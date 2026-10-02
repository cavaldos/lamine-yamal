package store

import (
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/lamine/backend/src/internal/model"
)

// DB is the whole datastore: one JSON file, loaded into memory at boot, written
// back atomically on every mutation.
//
// There is exactly one source of truth — fx, the decoded fixture. The read
// model below it is a cache rebuilt from fx after every mutation, so the two can
// never drift. That is deliberately simpler than keeping both writable.
type DB struct {
	mu   sync.RWMutex
	path string
	fx   *model.Fixture

	// Read model. Rebuilt wholesale on load and after each write.
	competitions []*model.Competition
	teams        []*model.Team
	players      []*model.Player
	opponents    []*model.Opponent
	matches      []*model.Match
	goals        []*model.Goal
	stats        []*model.MatchStat
	shots        []*model.Shot

	compByID    map[int64]*model.Competition
	teamByID    map[int64]*model.Team
	playerByID  map[int64]*model.Player
	oppByID     map[int64]*model.Opponent
	matchByID   map[int64]*model.Match
	matchByKey  map[string]*model.Match // fixture id, e.g. "match-22771"
	goalByID    map[int64]*model.Goal
	statByMatch map[int64]*model.MatchStat

	// fixture index of each match, keyed by db match id, so goal -> fixture row
	// survives a mutation.
	matchFixtureIdx map[int64]int
	// id assigned to the next locally created record of each kind.
	nextMatch, nextGoal, nextShot, nextStat int64
}

// OpenDB loads the data file into memory. The file is the whole dataset and is
// committed to the repo, so it is read from disk and written back in place.
func OpenDB(path string) (*DB, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return nil, fmt.Errorf("data file %s does not exist; run `make ingest` to download it", path)
		}
		return nil, fmt.Errorf("read data file %s: %w", path, err)
	}

	var fx model.Fixture
	if err := json.Unmarshal(raw, &fx); err != nil {
		return nil, fmt.Errorf("decode data file: %w", err)
	}
	if fx.SchemaVersion != model.SchemaVersion {
		return nil, fmt.Errorf("data schema_version %q does not match compiled %q; run `make ingest`",
			fx.SchemaVersion, model.SchemaVersion)
	}
	if fx.Source != model.SourceMock {
		return nil, fmt.Errorf("unexpected data source %q", fx.Source)
	}

	db := &DB{path: path, fx: &fx}
	db.rebuild()
	return db, nil
}

// Path reports the file backing this datastore ("" when embedded).
func (d *DB) Path() string { return d.path }

// Health reports reachability. A file store is healthy when its source is
// readable in memory, which keeps /healthz meaningful without a database.
func (d *DB) Health() error {
	d.mu.RLock()
	defer d.mu.RUnlock()
	if d.fx == nil {
		return fmt.Errorf("store is not loaded")
	}
	return nil
}

// rebuild re-derives the whole read model from fx. Called on load and after every
// mutation, so it is the only place ids and joins are established.
func (d *DB) rebuild() {
	fx := d.fx

	d.competitions = d.competitions[:0]
	d.teams = d.teams[:0]
	d.players = d.players[:0]
	d.opponents = d.opponents[:0]
	d.matches = d.matches[:0]
	d.goals = d.goals[:0]
	d.stats = d.stats[:0]
	d.shots = d.shots[:0]

	d.compByID = map[int64]*model.Competition{}
	d.teamByID = map[int64]*model.Team{}
	d.playerByID = map[int64]*model.Player{}
	d.oppByID = map[int64]*model.Opponent{}
	d.matchByID = map[int64]*model.Match{}
	d.matchByKey = map[string]*model.Match{}
	d.goalByID = map[int64]*model.Goal{}
	d.statByMatch = map[int64]*model.MatchStat{}
	d.matchFixtureIdx = map[int64]int{}

	// Competitions: keyed by fixture id, ordered by fixture key for stability.
	// The fixture's competition key doubles as the API `code` (e.g. "la-liga").
	compKeys := sortedKeys(fx.Competitions)
	for i, k := range compKeys {
		c := fx.Competitions[k]
		d.competitions = append(d.competitions, &model.Competition{
			ID: int64(i + 1), Name: c.Name, Code: c.ID,
			Country: strPtr(c.Country), LogoURL: strPtr(c.LogoURL),
			Priority: int32(c.Tier), CreatedAt: fileEpoch(), UpdatedAt: fileEpoch(),
		})
		d.compByID[int64(i+1)] = d.competitions[len(d.competitions)-1]
	}

	// Teams: ordered by name. Ids here were non-deterministic under Postgres
	// (Go map iteration); sorting makes them stable across restarts instead.
	teamKeys := sortedKeys(fx.Teams)
	sort.Slice(teamKeys, func(a, b int) bool {
		return fx.Teams[teamKeys[a]].Name < fx.Teams[teamKeys[b]].Name
	})
	teamIDByFixture := map[string]int64{}
	for i, k := range teamKeys {
		t := fx.Teams[k]
		id := int64(i + 1)
		teamIDByFixture[k] = id
		d.teams = append(d.teams, &model.Team{
			ID: id, Name: t.Name, ShortName: strPtr(t.ShortName),
			Country: strPtr("Spain"), LogoURL: strPtr(t.LogoURL),
			CreatedAt: fileEpoch(), UpdatedAt: fileEpoch(),
		})
		d.teamByID[id] = d.teams[len(d.teams)-1]
	}

	// Opponents: every team except the tracked player's own club, same name order.
	oppIDs := map[string]int64{} // opponent name -> id
	for _, k := range teamKeys {
		if k == fx.Player.TeamID {
			continue
		}
		t := fx.Teams[k]
		id := int64(len(d.opponents) + 1)
		oppIDs[t.Name] = id
		teamID := teamIDByFixture[k]
		d.opponents = append(d.opponents, &model.Opponent{
			ID: id, Name: t.Name, TeamID: &teamID, LogoURL: strPtr(t.LogoURL),
			CreatedAt: fileEpoch(), UpdatedAt: fileEpoch(),
		})
		d.oppByID[id] = d.opponents[len(d.opponents)-1]
	}

	// Player: v1 has exactly one.
	p := fx.Player
	pTeamID := teamIDByFixture[p.TeamID]
	pid := int64(1)
	d.players = append(d.players, &model.Player{
		ID: pid, FullName: p.Name, TeamID: &pTeamID,
		ShirtNumber: int32Ptr(p.ShirtNumber, true), Position: strPtr(p.Position),
		BirthDate: strPtr(p.BirthDate), Nationality: strPtr(p.Nationality),
		SourcePlayerID: strPtr(p.SourcePlayerID),
		CreatedAt:      fileEpoch(), UpdatedAt: fileEpoch(),
	})
	d.playerByID[pid] = d.players[0]

	// Matches: fixture array order, so ids match the values the Postgres build
	// served (id == index + 1) and stay stable across restarts.
	for i := range fx.Matches {
		fm := &fx.Matches[i]
		id := int64(i + 1)
		d.matchFixtureIdx[id] = i

		compID := int64(0)
		if c, ok := d.compByCode(fm.CompetitionID); ok {
			compID = c.ID
		}
		// The opponent is always the side that is not the tracked player's club.
		other := fm.HomeTeamID
		if fm.HomeTeamID == fx.Player.TeamID {
			other = fm.AwayTeamID
		}
		oppID := int64(0)
		if name, ok := teamNameOf(fx.Teams, other); ok {
			oppID = oppIDs[name]
		}
		// "for" is always the tracked player's side, never the home side. When
		// they are away the two swap; matchToFixture below inverts this same
		// rule on the way back out, so the two must stay mirror images.
		forScore, againstScore := fm.HomeScore, fm.AwayScore
		if !fm.IsHome {
			forScore, againstScore = fm.AwayScore, fm.HomeScore
		}
		m := &model.Match{
			ID: id, CompetitionID: compID, OpponentID: oppID,
			Season: strPtr(fm.Season), PlayedAt: parseDate(fm.Date),
			IsHome:       fm.IsHome,
			ScoreFor:     int32Ptr(forScore, true),
			ScoreAgainst: int32Ptr(againstScore, true),
			Venue:        fm.Venue, Referee: fm.Referee,
			Attendance:    int32PtrPtr(fm.Attendance),
			SourceMatchID: strPtr(fm.SourceMatchID),
			CreatedAt:     fileEpoch(), UpdatedAt: fileEpoch(),
		}
		d.matches = append(d.matches, m)
		d.matchByID[id] = m
		d.matchByKey[fm.ID] = m
	}

	// Goals, shots and match stats follow the same index+1 rule.
	for i := range fx.Goals {
		fg := &fx.Goals[i]
		id := int64(i + 1)
		g := &model.Goal{
			ID: id, MatchID: d.matchIDOf(fg.MatchID),
			Minute: int32(fg.Minute), AddedMinute: int32PtrPtr(fg.AddedMinute),
			GoalType: fg.GoalType, BodyPart: strPtr(fg.BodyPart),
			AssistName: nonNil(fg.AssistName), XG: float64Ptr(fg.XG), XGOT: fg.XGOT,
			LocationX: float64Ptr(fg.X), LocationY: float64Ptr(fg.Y),
			DistanceToGoalM:  float64Ptr(fg.DistanceToGoalM),
			PreviousAction:   nonNil(fg.PreviousAction),
			PlayPattern:      nonNil(fg.PlayPattern),
			SeasonGoalNumber: int32Ptr(fg.SeasonGoalNumber, true),
			CareerGoalNumber: int32PtrPtr(fg.CareerGoalNumber),
			VideoURL:         strPtr(fg.VideoURL),
			SourceGoalID:     strPtr(fg.SourceGoalID),
			CreatedAt:        fileEpoch(), UpdatedAt: fileEpoch(),
		}
		d.goals = append(d.goals, g)
		d.goalByID[id] = g
	}
	for i := range fx.Shots {
		fs := &fx.Shots[i]
		id := int64(i + 1)
		d.shots = append(d.shots, &model.Shot{
			ID: id, MatchID: d.matchIDOf(fs.MatchID), PlayerID: pid,
			Minute: int32PtrPtr(fs.Minute), Outcome: strPtr(fs.Outcome),
			XG: float64Ptr(fs.XG), LocationX: float64Ptr(fs.X), LocationY: float64Ptr(fs.Y),
			BodyPart: strPtr(fs.BodyPart), Situation: strPtr(fs.Situation),
			LastAction: nonNil(fs.LastAction), AssistName: nonNil(fs.AssistName),
			SourceShotID: strPtr(fs.ID), CreatedAt: fileEpoch(),
		})
	}
	for i := range fx.MatchStats {
		fst := &fx.MatchStats[i]
		id := int64(i + 1)
		matchID := d.matchIDOf(fst.MatchID)
		st := &model.MatchStat{
			ID: id, MatchID: matchID, PlayerID: pid,
			IsStarting: boolPtr(fst.IsStarting), PositionPlayed: strPtr(fst.PositionPlayed),
			MinutesPlayed: int32PtrPtrInt(fst.MinutesPlayed),
			Goals:         i32(fst.Goals),
			Assists:       i32(fst.Assists),
			Shots:         i32(fst.Shots),
			ShotsOnTarget: i32(fst.ShotsOnTarget),
			XG:            float64Ptr(fst.XG), NPXG: float64Ptr(fst.NPXG),
			XA: float64Ptr(fst.XA), KeyPasses: i32(fst.KeyPasses),
			XGChain: float64Ptr(fst.XGChain), XGBuildup: float64Ptr(fst.XGBuildup),
			CreatedAt: fileEpoch(), UpdatedAt: fileEpoch(),
		}
		if hm := d.heatmapForFixture(fx, matchID); hm != nil {
			st.Heatmap = hm
		}
		d.stats = append(d.stats, st)
		d.statByMatch[matchID] = st
	}

	d.nextMatch = int64(len(d.matches)) + 1
	d.nextGoal = int64(len(d.goals)) + 1
	d.nextShot = int64(len(d.shots)) + 1
	d.nextStat = int64(len(d.stats)) + 1
}

// matchIDOf resolves a fixture match id ("match-22771") to its stable integer id.
func (d *DB) matchIDOf(fixtureID string) int64 {
	if m, ok := d.matchByKey[fixtureID]; ok {
		return m.ID
	}
	// The ingest tool also keys heatmaps by the bare Understat id.
	if m, ok := d.matchByKey["match-"+fixtureID]; ok {
		return m.ID
	}
	return 0
}

// heatmapForFixture attaches the synthetic heatmap for a match, if the ingester
// produced one. Matches without one keep a NULL heatmap so the UI can show an
// honest empty state rather than a grid of zeros.
func (d *DB) heatmapForFixture(fx *model.Fixture, matchID int64) *model.Heatmap {
	m := d.matchByID[matchID]
	if m == nil {
		return nil
	}
	src := ""
	if m.SourceMatchID != nil {
		src = *m.SourceMatchID
	}
	for i := range fx.Heatmaps {
		h := fx.Heatmaps[i]
		if strconv.FormatInt(h.MatchID, 10) != src {
			continue
		}
		hm := h
		hm.MatchID = matchID
		return &hm
	}
	return nil
}

func (d *DB) compByCode(key string) (*model.Competition, bool) {
	for _, c := range d.competitions {
		if c.Code == key {
			return c, true
		}
	}
	return nil, false
}

// flush writes the fixture back to disk atomically: a temp file in the same
// directory followed by a rename. A reader therefore never observes a truncated
// or half-written file, even while the server is serving requests.
func (d *DB) flush() error {
	if d.path == "" {
		return nil
	}
	b, err := json.MarshalIndent(d.fx, "", "  ")
	if err != nil {
		return fmt.Errorf("encode data file: %w", err)
	}
	dir := filepath.Dir(d.path)
	tmp, err := os.CreateTemp(dir, ".lamine-*.json")
	if err != nil {
		return fmt.Errorf("create temp file: %w", err)
	}
	tmpName := tmp.Name()
	defer os.Remove(tmpName) // no-op once the rename succeeds

	if _, err := tmp.Write(b); err != nil {
		tmp.Close()
		return fmt.Errorf("write temp file: %w", err)
	}
	// Durability before the rename, so a crash cannot leave an empty file behind.
	if err := tmp.Sync(); err != nil {
		tmp.Close()
		return fmt.Errorf("sync temp file: %w", err)
	}
	if err := tmp.Close(); err != nil {
		return fmt.Errorf("close temp file: %w", err)
	}
	if err := os.Chmod(tmpName, 0o644); err != nil {
		return fmt.Errorf("chmod temp file: %w", err)
	}
	if err := os.Rename(tmpName, d.path); err != nil {
		return fmt.Errorf("replace %s: %w", d.path, err)
	}
	return nil
}

// mutate runs fn under the write lock, rebuilds the read model, then persists.
// If fn or the flush fails the in-memory state is already consistent, so a
// failed write simply is not durable — never half-applied.
func (d *DB) mutate(fn func(fx *model.Fixture) error) error {
	d.mu.Lock()
	defer d.mu.Unlock()
	if err := fn(d.fx); err != nil {
		return err
	}
	d.rebuild()
	return d.flush()
}

// ---------- helpers ----------

func fileEpoch() time.Time { return time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC) }

func parseDate(s string) time.Time {
	t, err := time.Parse("2006-01-02", s)
	if err != nil {
		return time.Time{}
	}
	return t
}

func sortedKeys[T any](m map[string]T) []string {
	out := make([]string, 0, len(m))
	for k := range m {
		out = append(out, k)
	}
	sort.Strings(out)
	return out
}

func teamNameOf(teams map[string]model.FixtureTeam, key string) (string, bool) {
	t, ok := teams[key]
	if !ok {
		return "", false
	}
	return t.Name, true
}

func i32(v int) int32 { return int32(v) }

func int32PtrPtrInt(v int) *int32 {
	n := i32(v)
	return &n
}

func strPtr(s string) *string {
	if s == "" {
		return nil
	}
	v := s
	return &v
}

// nonNil turns an empty fixture string into a nil pointer so the API reports
// "absent" rather than "".
func nonNil(s *string) *string {
	if s == nil || strings.TrimSpace(*s) == "" {
		return nil
	}
	v := *s
	return &v
}

func float64Ptr(f float64) *float64 {
	if f == 0 {
		return nil
	}
	v := f
	return &v
}

func boolPtr(b bool) *bool { return &b }

// set* helpers implement PATCH semantics: a nil field in the patch leaves the
// stored value alone. (PATCH still cannot null a field out — see model/patch.go.)

func setInt32(dst *int32, v *int32) {
	if v != nil {
		*dst = *v
	}
}

// setInt32Ptr replaces a nullable int32 column.
func setInt32Ptr(dst **int32, v *int32) {
	if v != nil {
		*dst = v
	}
}

// setInt64Val replaces a non-nullable int64 column.
func setInt64Val(dst *int64, v *int64) {
	if v != nil {
		*dst = *v
	}
}

func setInt64(dst **int64, v *int64) {
	if v != nil {
		*dst = v
	}
}

func setFloat(dst **float64, v *float64) {
	if v != nil {
		*dst = v
	}
}

func intPtrToInt(p *int32) *int {
	if p == nil {
		return nil
	}
	v := int(*p)
	return &v
}

func itoa(n int64) string { return strconv.FormatInt(n, 10) }

func int32Ptr(v int, present bool) *int32 {
	if !present {
		return nil
	}
	n := int32(v)
	return &n
}

func int32PtrPtr(v *int) *int32 {
	if v == nil {
		return nil
	}
	n := int32(*v)
	return &n
}
