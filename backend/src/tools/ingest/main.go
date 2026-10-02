// Command ingest is an OFFLINE, build-time-only tool that pulls Lamine Yamal's
// Understat corpus once and writes the committed fixture
// data/lamine.json (plan.md §7.1/§7.2). It is the project's datastore.
//
// It is NOT part of the shipped server: the runtime never touches the network,
// it only reads the committed fixture. Run it by hand when the fixture needs a
// refresh:
//
//	go run ./tools/ingest
//
// Understat returns every value as a JSON *string*, so every field is parsed
// defensively with strconv helpers. Unknown or empty values become 0 or null —
// never a panic (plan.md §11 risk 8).
package main

import (
	"compress/gzip"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"log"
	"math"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/lamine/backend/src/internal/coord"
	"github.com/lamine/backend/src/internal/model"
)

// userAgent is the only reason this request gets a 200: Understat serves the
// XHR endpoint to browser-shaped requests only.
const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

// ---------------------------------------------------------------------------
// Understat wire types. Every field is a string, even the numbers.
// ---------------------------------------------------------------------------

type usPlayer struct {
	ID               string `json:"id"`
	Name             string `json:"name"`
	FavoritePosition string `json:"favorite_position"`
}

type usMatch struct {
	Goals     string `json:"goals"`
	Shots     string `json:"shots"`
	XG        string `json:"xG"`
	Time      string `json:"time"`
	Position  string `json:"position"`
	HTeam     string `json:"h_team"`
	ATeam     string `json:"a_team"`
	HGoals    string `json:"h_goals"`
	AGoals    string `json:"a_goals"`
	Date      string `json:"date"`
	ID        string `json:"id"`
	Season    string `json:"season"`
	RosterID  string `json:"roster_id"`
	XA        string `json:"xA"`
	Assists   string `json:"assists"`
	KeyPasses string `json:"key_passes"`
	NPG       string `json:"npg"`
	NPXG      string `json:"npxG"`
	XGChain   string `json:"xGChain"`
	XGBuildup string `json:"xGBuildup"`
}

type usShot struct {
	ID             string  `json:"id"`
	Minute         string  `json:"minute"`
	Result         string  `json:"result"`
	X              string  `json:"X"`
	Y              string  `json:"Y"`
	XG             string  `json:"xG"`
	HA             string  `json:"h_a"`
	MatchID        string  `json:"match_id"`
	Situation      string  `json:"situation"`
	Season         string  `json:"season"`
	ShotType       string  `json:"shotType"`
	HTeam          string  `json:"h_team"`
	ATeam          string  `json:"a_team"`
	HGoals         string  `json:"h_goals"`
	AGoals         string  `json:"a_goals"`
	Date           string  `json:"date"`
	PlayerAssisted *string `json:"player_assisted"`
	LastAction     string  `json:"lastAction"`
}

type usPayload struct {
	Player  usPlayer  `json:"player"`
	Matches []usMatch `json:"matches"`
	Shots   []usShot  `json:"shots"`
}

// ---------------------------------------------------------------------------
// Defensive parsing helpers (§11 risk 8).
// ---------------------------------------------------------------------------

func atoiDef(s string) int {
	v, err := strconv.Atoi(strings.TrimSpace(s))
	if err != nil {
		return 0
	}
	return v
}

func atofDef(s string) float64 {
	v, err := strconv.ParseFloat(strings.TrimSpace(s), 64)
	if err != nil || math.IsNaN(v) || math.IsInf(v, 0) {
		return 0
	}
	return v
}

// parseMinute handles both "45" and "45+2" defensively. Understat currently only
// ships the plain form, but a stoppage-minute string must not become 0.
func parseMinute(s string) (minute, added int, stoppage bool) {
	s = strings.TrimSpace(s)
	if i := strings.IndexByte(s, '+'); i >= 0 {
		return atoiDef(s[:i]), atoiDef(s[i+1:]), true
	}
	return atoiDef(s), 0, false
}

func round1(f float64) float64 { return math.Round(f*10) / 10 }

// ---------------------------------------------------------------------------
// Enum mappings (plan.md §7.1 item 2 / §7.2).
// ---------------------------------------------------------------------------

// goalType: situation -> goal_type. Only the six values the DDL CHECK constraint
// accepts are ever returned. FromCorner and SetPiece both collapse into
// open_play — a corner or a set-piece delivery converted in open play is not a
// dead-ball goal — and the distinction survives in play_pattern, which carries
// the original situation label.
func mapGoalType(situation string) (goalType, display string) {
	switch situation {
	case "OpenPlay":
		return "open_play", "Open Play"
	case "FromCorner":
		return "open_play", "Open Play"
	case "SetPiece":
		return "open_play", "Open Play"
	case "DirectFreekick":
		return "free_kick", "Free Kick"
	case "Penalty":
		return "penalty", "Penalty"
	default:
		return "open_play", "Open Play"
	}
}

// playPattern is the human-readable situation label carried on every goal.
func mapPlayPattern(situation string) string {
	switch situation {
	case "OpenPlay":
		return "Regular Play"
	case "FromCorner":
		return "From Corner"
	case "SetPiece":
		return "Set Piece"
	case "DirectFreekick":
		return "Direct Free Kick"
	case "Penalty":
		return "Penalty"
	default:
		return "Unknown"
	}
}

func mapBodyPart(shotType string) (part, display string) {
	switch shotType {
	case "LeftFoot":
		return "left_foot", "Left Foot"
	case "RightFoot":
		return "right_foot", "Right Foot"
	case "Head":
		return "head", "Head"
	default:
		return "unknown", "Unknown"
	}
}

// mapOutcome: Understat result -> fixture outcome. Snapped/blocked attempts are
// not on target.
func mapOutcome(result string) string {
	switch result {
	case "Goal":
		return "goal"
	case "MissedShots":
		return "missed"
	case "BlockedShot":
		return "blocked"
	case "SavedShot":
		return "saved"
	case "ShotOnPost":
		return "post"
	case "OwnGoal":
		return "own_goal"
	default:
		return "unknown"
	}
}

// onTarget reports whether a result counts as a shot on target for match_stats.
func onTarget(result string) bool {
	switch result {
	case "Goal", "SavedShot", "ShotOnPost":
		return true
	}
	return false
}

// slug turns "Athletic Club" into "athletic-club".
func slug(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	var b strings.Builder
	prevDash := false
	for _, r := range s {
		switch {
		case (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9'):
			b.WriteRune(r)
			prevDash = false
		default:
			if !prevDash && b.Len() > 0 {
				b.WriteByte('-')
				prevDash = true
			}
		}
	}
	return strings.Trim(b.String(), "-")
}

// shortName derives a deterministic 2-4 letter abbreviation from a team name.
// It is a display convenience only; no external data is invented.
func shortName(name string) string {
	words := strings.Fields(name)
	initials := ""
	for _, w := range words {
		if len([]rune(w)) > 3 { // skip "Club"/"FC"/"de"
			initials += strings.ToUpper(string([]rune(w)[0]))
		}
	}
	if len(initials) < 2 {
		r := []rune(strings.ToUpper(name))
		if len(r) > 3 {
			return string(r[:3])
		}
		return string(r)
	}
	return initials
}

// seasonLabel maps Understat's start-year "2023" to the human "2023/2024".
func seasonLabel(s string) string {
	y := atoiDef(s)
	if y == 0 {
		return s
	}
	return fmt.Sprintf("%d/%d", y, y+1)
}

func teamID(name string) string {
	if id := slug(name); id != "" {
		return id
	}
	return "unknown"
}

func matchID(sourceID string) string { return "match-" + sourceID }
func goalID(sourceID string) string  { return "goal-" + sourceID }
func shotID(sourceID string) string  { return "shot-" + sourceID }

// ---------------------------------------------------------------------------
// Fetch
// ---------------------------------------------------------------------------

func fetch(url, referer string) ([]byte, error) {
	req, err := http.NewRequest(http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", userAgent)
	req.Header.Set("X-Requested-With", "XMLHttpRequest")
	req.Header.Set("Referer", referer)
	// We ask for gzip explicitly, so Go's transport will NOT transparently
	// decode the body — we do it ourselves below.
	req.Header.Set("Accept-Encoding", "gzip")

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("GET %s: unexpected status %d", url, resp.StatusCode)
	}
	var r io.Reader = resp.Body
	if strings.EqualFold(resp.Header.Get("Content-Encoding"), "gzip") {
		zr, err := gzip.NewReader(resp.Body)
		if err != nil {
			return nil, fmt.Errorf("gzip: %w", err)
		}
		defer zr.Close()
		r = zr
	}
	return io.ReadAll(r)
}

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

type matchCtx struct {
	src        usMatch
	id         string
	playerSide string // "home" | "away"
	goals      int
	assists    int
	shots      int
	onTarget   int
}

func build(p usPayload, fetchedAt string) model.Fixture {
	// --- index shots by match -------------------------------------------------
	byMatch := map[string][]usShot{}
	for _, s := range p.Shots {
		byMatch[s.MatchID] = append(byMatch[s.MatchID], s)
	}
	// h_a is the shooter's own side; 0 mismatches vs the Barcelona home/away
	// split were verified, so it is the authoritative is_home signal.
	sideByMatch := map[string]string{}
	for _, s := range p.Shots {
		if _, ok := sideByMatch[s.MatchID]; !ok {
			sideByMatch[s.MatchID] = s.HA
		}
	}

	playerTeam := "Barcelona" // p.Player has no team field; every match in this
	// corpus is a Barcelona match (verified: h_a vs h_team 0 mismatches).

	// --- matches + match_stats ----------------------------------------------
	ctxs := make([]matchCtx, 0, len(p.Matches))
	stats := make([]model.FixtureMatchStat, 0, len(p.Matches))
	for _, m := range p.Matches {
		side := sideByMatch[m.ID]
		if side == "" {
			// 14 matches have zero shots: fall back to the fixture list.
			if m.HTeam == playerTeam {
				side = "h"
			} else {
				side = "a"
			}
		}
		minutes := atoiDef(m.Time)
		position := m.Position
		c := matchCtx{
			src:        m,
			id:         matchID(m.ID),
			playerSide: side,
			goals:      atoiDef(m.Goals),
			assists:    atoiDef(m.Assists),
		}
		// Shots / shots-on-target are re-derived from the shot list rather than
		// trusting matches[].shots, so the two can never disagree.
		for _, s := range byMatch[m.ID] {
			c.shots++
			if onTarget(s.Result) {
				c.onTarget++
			}
		}
		ctxs = append(ctxs, c)

		stats = append(stats, model.FixtureMatchStat{
			MatchID:        c.id,
			IsStarting:     position != "Sub" && position != "",
			PositionPlayed: position,
			MinutesPlayed:  minutes,
			Goals:          c.goals,
			Assists:        c.assists,
			Shots:          c.shots,
			ShotsOnTarget:  c.onTarget,
			XG:             round4(atofDef(m.XG)),
			NPXG:           round4(atofDef(m.NPXG)),
			XA:             round4(atofDef(m.XA)),
			KeyPasses:      atoiDef(m.KeyPasses),
			XGChain:        round4(atofDef(m.XGChain)),
			XGBuildup:      round4(atofDef(m.XGBuildup)),
		})
	}

	// Deterministic order everywhere: date, then source id.
	sort.SliceStable(ctxs, func(i, j int) bool {
		if ctxs[i].src.Date != ctxs[j].src.Date {
			return ctxs[i].src.Date < ctxs[j].src.Date
		}
		return ctxs[i].src.ID < ctxs[j].src.ID
	})
	sort.SliceStable(stats, func(i, j int) bool { return stats[i].MatchID < stats[j].MatchID })

	ctxByID := map[string]*matchCtx{}
	matches := make([]model.FixtureMatch, 0, len(ctxs))
	teams := map[string]model.FixtureTeam{}
	addTeam := func(name string) string {
		id := teamID(name)
		if _, ok := teams[id]; !ok {
			teams[id] = model.FixtureTeam{ID: id, Name: name, ShortName: shortName(name), LogoURL: ""}
		}
		return id
	}

	for i := range ctxs {
		c := &ctxs[i]
		src := c.src
		ctxByID[c.id] = c
		homeID := addTeam(src.HTeam)
		awayID := addTeam(src.ATeam)
		isHome := c.playerSide == "h"
		hs, as := atoiDef(src.HGoals), atoiDef(src.AGoals)
		side := "away"
		if isHome {
			side = "home"
		}
		matches = append(matches, model.FixtureMatch{
			ID:                  c.id,
			SourceMatchID:       src.ID,
			Date:                src.Date,
			CompetitionID:       model.CompetitionLaLiga,
			Season:              seasonLabel(src.Season),
			Round:               nil, // not in Understat (plan.md §11 risk 7)
			Venue:               nil, // stadium names are not in Understat, see report
			Attendance:          nil,
			HomeTeamID:          homeID,
			AwayTeamID:          awayID,
			HomeScore:           hs,
			AwayScore:           as,
			ScoreDisplay:        fmt.Sprintf("%d-%d", hs, as),
			Status:              "FT",
			IsHome:              isHome,
			PlayerSide:          side,
			PlayerMinutesPlayed: atoiDef(src.Time),
			PlayerPosition:      src.Position,
			Referee:             nil,
		})
	}

	// --- goals + shots -------------------------------------------------------
	goals := make([]model.FixtureGoal, 0, 40)
	shots := make([]model.FixtureShot, 0, len(p.Shots))
	seasonGoalSeq := map[string]int{}
	careerSeq := 0

	type orderedGoal struct {
		date    string
		minute  int
		added   int
		goalIdx int
	}
	ordered := make([]orderedGoal, 0, 40)

	for _, s := range p.Shots {
		px, py := coord.Understat01ToPitch(atofDef(s.X), atofDef(s.Y))
		c := ctxByID[matchID(s.MatchID)]
		isHome := s.HA == "h"

		shot := model.FixtureShot{
			ID:         shotID(s.ID),
			MatchID:    matchID(s.MatchID),
			Outcome:    mapOutcome(s.Result),
			XG:         round4(atofDef(s.XG)),
			X:          round3(px),
			Y:          round3(py),
			BodyPart:   bodyPartOf(s.ShotType),
			Situation:  s.Situation,
			LastAction: opt(s.LastAction),
			AssistName: s.PlayerAssisted,
		}
		min, added, stoppage := parseMinute(s.Minute)
		shot.Minute = &min
		shots = append(shots, shot)

		if s.Result != "Goal" {
			continue
		}

		gt, gtd := mapGoalType(s.Situation)
		bp, bpd := mapBodyPart(s.ShotType)
		// h_a is the shooter's own side: home -> h_team is Barcelona, so the
		// opponent is a_team (and vice versa).
		opponentName := s.ATeam
		if !isHome {
			opponentName = s.HTeam
		}
		opponentID := teamID(opponentName)
		// Big chance: a single documented threshold. Understat has no xGOT and
		// no event metadata, so we do not invent a second heuristic.
		xg := atofDef(s.XG)
		big := xg >= 0.30

		// Score *after* this goal would need the ordering of every goal in the
		// match, not just Yamal's — Understat cannot supply that, so null.
		g := model.FixtureGoal{
			ID:                 goalID(s.ID),
			MatchID:            matchID(s.MatchID),
			SourceGoalID:       s.ID,
			Minute:             min,
			AddedMinute:        nil,
			MinuteDisplay:      minuteDisplay(min, added),
			StoppageTime:       stoppage,
			Period:             periodOf(min),
			ElapsedSeconds:     elapsedOf(min, added),
			GoalType:           gt,
			GoalTypeDisplay:    gtd,
			IsPenalty:          s.Situation == "Penalty",
			IsHeader:           s.ShotType == "Head",
			IsFreeKick:         s.Situation == "DirectFreekick",
			BodyPart:           bp,
			BodyPartDisplay:    bpd,
			XG:                 round4(xg),
			XGOT:               nil,
			IsBigChance:        &big,
			X:                  round3(px),
			Y:                  round3(py),
			DistanceToGoalM:    round1(math.Hypot(105-px, 34-py)),
			AttackingDirection: "left_to_right",
			AssistName:         s.PlayerAssisted,
			AssistID:           nil,
			PreviousAction:     opt(s.LastAction),
			PlayPattern:        opt(mapPlayPattern(s.Situation)),
			OpponentTeamID:     opponentID,
			CompetitionID:      model.CompetitionLaLiga,
			Season:             seasonLabel(s.Season),
			IsHome:             isHome,
			Venue:              nil,
			ScoreHomeAfter:     nil,
			ScoreAwayAfter:     nil,
			ScoreDisplayAfter:  nil,
			VideoURL:           model.DemoVideoURL,
			SeasonGoalNumber:   0, // filled after chronological sort
			CareerGoalNumber:   nil,
		}
		if added > 0 {
			g.AddedMinute = &added
		}
		if c != nil && !isHome {
			// keep nothing extra; c only used for ordering
			_ = c
		}
		goals = append(goals, g)
		ordered = append(ordered, orderedGoal{date: s.Date, minute: min, added: added, goalIdx: len(goals) - 1})
	}

	// Career / season goal numbers: chronological order over (date, minute,
	// added) — derivable from Understat, unlike the score-after fields.
	sort.SliceStable(ordered, func(i, j int) bool {
		a, b := ordered[i], ordered[j]
		if a.date != b.date {
			return a.date < b.date
		}
		if a.minute != b.minute {
			return a.minute < b.minute
		}
		return a.added < b.added
	})
	for _, o := range ordered {
		g := &goals[o.goalIdx]
		careerSeq++
		n := careerSeq
		g.CareerGoalNumber = &n
		seasonGoalSeq[g.Season]++
		g.SeasonGoalNumber = seasonGoalSeq[g.Season]
	}

	heatmaps := synthHeatmaps(ctxs, byMatch, playerTeam)

	return model.Fixture{
		SchemaVersion: model.SchemaVersion,
		Source:        model.SourceMock,
		Provenance: model.Provenance{
			Origin:    "understat-getPlayerData",
			FetchedAt: fetchedAt,
			PlayerID:  model.UnderstatPlayerID,
			License:   "non-commercial-derived",
		},
		CoordinateSystem: model.CoordinateSystem{
			Pitch:   []float64{coord.PitchLength, coord.PitchWidth},
			Origin:  "top_left",
			Axis:    "left_to_right",
			ViewBox: []float64{coord.ViewBoxWidth, coord.ViewBoxHeight},
		},
		Player: model.FixturePlayer{
			ID:               model.PlayerFixtureID,
			SourcePlayerID:   firstNonEmpty(p.Player.ID, model.UnderstatPlayerID),
			Name:             firstNonEmpty(p.Player.Name, "Lamine Yamal"),
			TeamID:           "barcelona",
			ShirtNumber:      10,
			Position:         "RW",
			FavoritePosition: p.Player.FavoritePosition,
			Nationality:      "Spain",
			BirthDate:        "2007-07-13",
		},
		Teams: teams,
		Competitions: map[string]model.FixtureComp{
			model.CompetitionLaLiga: {
				ID:      model.CompetitionLaLiga,
				Name:    "La Liga",
				Country: "Spain",
				Tier:    1,
				LogoURL: "",
			},
		},
		Matches:    matches,
		MatchStats: stats,
		Goals:      goals,
		Shots:      shots,
		Heatmaps:   heatmaps,
	}
}

// ---------------------------------------------------------------------------
// Heatmaps: procedural + deterministic, always flagged synthetic (risk 6).
// Understat has no tracking data; only a handful of highlight matches get one so
// the rest of the UI exercises its empty state (plan.md §7.1 item 3).
// ---------------------------------------------------------------------------

const heatmapMatches = 6

func synthHeatmaps(ctxs []matchCtx, byMatch map[string][]usShot, playerTeam string) []model.Heatmap {
	type cand struct {
		c     *matchCtx
		score int
	}
	var cands []cand
	for i := range ctxs {
		c := &ctxs[i]
		shots := len(byMatch[c.src.ID])
		if shots == 0 {
			continue
		}
		cands = append(cands, cand{c: c, score: shots*10 + atoiDef(c.src.Goals)})
	}
	sort.SliceStable(cands, func(i, j int) bool {
		if cands[i].score != cands[j].score {
			return cands[i].score > cands[j].score
		}
		return cands[i].c.src.ID < cands[j].c.src.ID
	})
	if len(cands) > heatmapMatches {
		cands = cands[:heatmapMatches]
	}
	sort.SliceStable(cands, func(i, j int) bool { return cands[i].c.src.Date < cands[j].c.src.Date })

	out := make([]model.Heatmap, 0, len(cands))
	for _, cd := range cands {
		c := cd.c
		// Seeded per match id: same input payload -> byte-identical fixture.
		seed := int64(atoiDef(c.src.ID)) * 2654435761
		rng := rand.New(rand.NewSource(seed))
		minutes := atoiDef(c.src.Time)
		events := int64(minutes*4 + 25)
		touches := events*3 + int64(rng.Intn(40))
		duration := int64(minutes) * 60

		type cell struct{ ix, iy int }
		counts := map[cell]int64{}
		for i := int64(0); i < touches; i++ {
			// Yamal-shaped distribution: right wing, attacking half.
			u := rng.Float64()
			x := 52 + 45*rng.Float64() // metres, 52..97
			var y float64
			switch {
			case u < 0.45: // right wing corridor
				y = 4 + 22*rng.Float64()
			case u < 0.75: // right half-space
				y = 26 + 30*rng.Float64()
			default:
				y = 4 + 60*rng.Float64()
			}
			if x > 104 {
				x = 104
			}
			iy := int(y / coord.PitchWidth * 16)
			ix := int(x / coord.PitchLength * 24)
			if ix > 23 {
				ix = 23
			}
			if iy > 15 {
				iy = 15
			}
			counts[cell{ix, iy}]++
		}
		bins := make([]model.HeatmapBin, 0, len(counts))
		var max int64
		for k, v := range counts {
			centerX := (float64(k.ix) + 0.5) * 5.0
			centerY := (float64(k.iy) + 0.5) * 5.0
			if v > max {
				max = v
			}
			bins = append(bins, model.HeatmapBin{IX: k.ix, IY: k.iy, X: centerX, Y: centerY, Count: v})
		}
		sort.Slice(bins, func(i, j int) bool {
			if bins[i].IY != bins[j].IY {
				return bins[i].IY < bins[j].IY
			}
			return bins[i].IX < bins[j].IX
		})
		mid, _ := strconv.ParseInt(c.src.ID, 10, 64)
		out = append(out, model.Heatmap{
			MatchID:   mid,
			Synthetic: true,
			Grid: model.HeatmapGrid{
				NX: 24, NY: 16, CellW: 5.0, CellH: 5.0, Origin: "top_left",
			},
			Bins: bins,
			Totals: model.HeatmapTotal{
				Events: events, Touches: touches, DurationS: duration, MaxBinCount: max,
			},
		})
	}
	return out
}

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------

func round3(f float64) float64 { return math.Round(f*1000) / 1000 }
func round4(f float64) float64 { return math.Round(f*10000) / 10000 }

func bodyPartOf(shotType string) string { p, _ := mapBodyPart(shotType); return p }

func opt(s string) *string {
	s = strings.TrimSpace(s)
	if s == "" {
		return nil
	}
	return &s
}

func firstNonEmpty(vals ...string) string {
	for _, v := range vals {
		if v != "" {
			return v
		}
	}
	return ""
}

func minuteDisplay(minute, added int) string {
	if added > 0 {
		return fmt.Sprintf("%d+%d'", minute, added)
	}
	return fmt.Sprintf("%d'", minute)
}

// periodOf follows the golden example in plan.md §7.2: a goal recorded at 45'
// belongs to period 2.
func periodOf(minute int) int {
	if minute > 45 {
		return 2
	}
	if minute == 45 {
		return 2
	}
	return 1
}

func elapsedOf(minute, added int) int {
	period := periodOf(minute)
	rest := minute - (period-1)*45
	if rest < 0 {
		rest = 0
	}
	return (period-1)*45*60 + rest*60 + added*60
}

// ---------------------------------------------------------------------------

func repoPath(rel string) string {
	_, file, _, ok := runtime.Caller(0)
	if !ok {
		return rel
	}
	// src/tools/ingest/main.go -> module root (src, then backend)
	return filepath.Join(filepath.Dir(filepath.Dir(filepath.Dir(filepath.Dir(file)))), rel)
}

func main() {
	out := flag.String("out", filepath.Join(repoPath("data"), "lamine.json"), "fixture output path")
	flag.Parse()

	url := "https://understat.com/getPlayerData/" + model.UnderstatPlayerID
	log.Printf("fetching %s", url)
	body, err := fetch(url, "https://understat.com/player/"+model.UnderstatPlayerID)
	if err != nil {
		log.Fatalf("fetch: %v", err)
	}
	log.Printf("got %d bytes", len(body))

	var p usPayload
	if err := json.Unmarshal(body, &p); err != nil {
		log.Fatalf("decode: %v", err)
	}

	fx := build(p, time.Now().UTC().Format(time.RFC3339))

	buf, err := json.MarshalIndent(fx, "", "  ")
	if err != nil {
		log.Fatalf("encode: %v", err)
	}
	buf = append(buf, '\n')
	if err := os.MkdirAll(filepath.Dir(*out), 0o755); err != nil {
		log.Fatalf("mkdir: %v", err)
	}
	if err := os.WriteFile(*out, buf, 0o644); err != nil {
		log.Fatalf("write: %v", err)
	}
	report(fx, *out)
}

func report(fx model.Fixture, path string) {
	st, _ := os.Stat(path)
	log.Printf("wrote %s (%d bytes)", path, st.Size())
	log.Printf("matches=%d shots=%d goals=%d teams=%d competitions=%d match_stats=%d heatmaps=%d",
		len(fx.Matches), len(fx.Shots), len(fx.Goals), len(fx.Teams), len(fx.Competitions), len(fx.MatchStats), len(fx.Heatmaps))

	type row struct {
		k                string
		m, s, g, xg, min int
		xgf              float64
	}
	perSeason := map[string]*row{}
	perComp := map[string]*row{}
	get := func(m map[string]*row, k string) *row {
		if r, ok := m[k]; ok {
			return r
		}
		r := &row{k: k}
		m[k] = r
		return r
	}
	for _, mt := range fx.Matches {
		get(perSeason, mt.Season).m++
		get(perSeason, mt.Season).min += mt.PlayerMinutesPlayed
		get(perComp, mt.CompetitionID).m++
		get(perComp, mt.CompetitionID).min += mt.PlayerMinutesPlayed
	}
	for _, sh := range fx.Shots {
		for _, mt := range fx.Matches {
			if mt.ID != sh.MatchID {
				continue
			}
			get(perSeason, mt.Season).s++
			get(perComp, mt.CompetitionID).s++
			get(perSeason, mt.Season).xgf += sh.XG
			get(perComp, mt.CompetitionID).xgf += sh.XG
			break
		}
	}
	for _, g := range fx.Goals {
		get(perSeason, g.Season).g++
		get(perSeason, g.Season).xgf += g.XG
		get(perComp, g.CompetitionID).g++
		get(perComp, g.CompetitionID).xgf += g.XG
	}
	dump := func(label string, m map[string]*row) {
		keys := make([]string, 0, len(m))
		for k := range m {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		log.Printf("-- %s --", label)
		log.Printf("%-12s %7s %7s %7s %9s %8s", "key", "matches", "shots", "goals", "xg", "minutes")
		for _, k := range keys {
			r := m[k]
			log.Printf("%-12s %7d %7d %7d %9.2f %8d", k, r.m, r.s, r.g, r.xgf, r.min)
		}
	}
	dump("per season", perSeason)
	dump("per competition", perComp)

	goalTypes := map[string]int{}
	bodyParts := map[string]int{}
	situations := map[string]int{}
	homeGoals, awayGoals := 0, 0
	for _, g := range fx.Goals {
		goalTypes[g.GoalType]++
		bodyParts[g.BodyPart]++
		pattern := "unknown"
		if g.PlayPattern != nil {
			pattern = *g.PlayPattern
		}
		situations[pattern]++
		if g.IsHome {
			homeGoals++
		} else {
			awayGoals++
		}
	}
	outcomes := map[string]int{}
	for _, s := range fx.Shots {
		outcomes[s.Outcome]++
	}
	log.Printf("-- goals -- goal_type=%s body_part=%s play_pattern=%s is_home: h=%d a=%d", countStr(goalTypes), countStr(bodyParts), countStr(situations), homeGoals, awayGoals)
	log.Printf("-- shots -- outcome=%s", countStr(outcomes))
	log.Printf("-- heatmaps (synthetic) --")
	for _, h := range fx.Heatmaps {
		log.Printf("match-%d bins=%d events=%d touches=%d duration_s=%d max_bin=%d", h.MatchID, len(h.Bins), h.Totals.Events, h.Totals.Touches, h.Totals.DurationS, h.Totals.MaxBinCount)
	}
}

func countStr(m map[string]int) string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	parts := make([]string, 0, len(keys))
	for _, k := range keys {
		parts = append(parts, fmt.Sprintf("%s=%d", k, m[k]))
	}
	return strings.Join(parts, " ")
}
