package store

import (
	"context"
	"encoding/json"
	"errors"
	"net/url"
	"os"
	"path/filepath"
	"runtime"
	"testing"

	"github.com/lamine/backend/src/internal/model"
)

// dataFile locates the committed dataset relative to this source file, so the
// tests work no matter which directory `go test` is invoked from.
func dataFile(t *testing.T) string {
	t.Helper()
	_, thisFile, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("cannot resolve the test source path")
	}
	// thisFile = <module>/src/internal/store/store_test.go
	p := filepath.Join(filepath.Dir(thisFile), "..", "..", "..", "data", "lamine.json")
	if _, err := os.Stat(p); err != nil {
		t.Fatalf("dataset not found at %s: %v", p, err)
	}
	return p
}

// testStore opens the committed corpus read-only.
func testStore(t *testing.T) *Store {
	t.Helper()
	s, err := Open(dataFile(t))
	if err != nil {
		t.Fatalf("open data file: %v", err)
	}
	return s
}

// testStoreFile copies the corpus into a temp file so a test can write to it and
// then re-open it, which is what proves a mutation actually reaches the disk.
func testStoreFile(t *testing.T) (*Store, string) {
	t.Helper()
	raw, err := os.ReadFile(dataFile(t))
	if err != nil {
		t.Fatalf("read dataset: %v", err)
	}
	path := filepath.Join(t.TempDir(), "lamine.json")
	if err := os.WriteFile(path, raw, 0o644); err != nil {
		t.Fatalf("seed temp data file: %v", err)
	}
	s, err := Open(path)
	if err != nil {
		t.Fatalf("open temp data file: %v", err)
	}
	return s, path
}

func q(t *testing.T, raw string) url.Values {
	t.Helper()
	v, err := url.ParseQuery(raw)
	if err != nil {
		t.Fatalf("bad query %q: %v", raw, err)
	}
	return v
}

func TestCorpusCounts(t *testing.T) {
	ctx := context.Background()
	s := testStore(t)

	// These are the verified Understat numbers (plan.md §3.2). If ingest ever
	// changes the corpus shape, this is the first thing that should notice.
	c, err := LoadCounts(ctx, s)
	if err != nil {
		t.Fatalf("counts: %v", err)
	}
	want := Counts{
		Matches: 108, Goals: 37, Shots: 358,
		Teams: 27, Opponents: 26, Competitions: 1, Players: 1, Heatmaps: 6,
	}
	if c != want {
		t.Errorf("counts = %+v, want %+v", c, want)
	}
}

func TestListGoalsFilters(t *testing.T) {
	ctx := context.Background()
	s := testStore(t)

	tests := []struct {
		name      string
		query     string
		wantTotal int64
	}{
		{"no filter returns everything", "", 37},
		{"penalties", "goal_type=penalty", 4},
		{"left foot", "body_part=left_foot", 33},
		{"right foot", "body_part=right_foot", 4},
		{"2025/2026 season", "season=2025%2F2026", 16},
		{"2023/2024 season", "season=2023%2F2024", 5},
		{"away goals", "is_home=false", 18},
		{"home goals", "is_home=true", 19},
		{"competition 1", "competition_id=1", 37},
		{"unknown competition matches nothing", "competition_id=9999", 0},
		{"combined season and type", "season=2025%2F2026&goal_type=penalty", 3},
		{"body part outside the enum", "body_part=tail", 0},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			f, err := model.ParseGoalFilter(q(t, tt.query))
			if err != nil {
				t.Fatalf("parse filter: %v", err)
			}
			res, err := s.ListGoals(ctx, f)
			if err != nil {
				t.Fatalf("list: %v", err)
			}
			if res.Total != tt.wantTotal {
				t.Errorf("total = %d, want %d", res.Total, tt.wantTotal)
			}
			// Items are capped by the default page size of 24, so only the
			// total is comparable unless the query raised the limit.
			wantItems := tt.wantTotal
			if wantItems > defaultPage {
				wantItems = defaultPage
			}
			if int64(len(res.Items)) != wantItems {
				t.Errorf("len(items) = %d, want %d", len(res.Items), wantItems)
			}
		})
	}
}

func TestListGoalsSort(t *testing.T) {
	ctx := context.Background()
	s := testStore(t)

	get := func(sort string) []model.Goal {
		f, err := model.ParseGoalFilter(q(t, "limit=200&sort="+sort))
		if err != nil {
			t.Fatalf("parse: %v", err)
		}
		res, err := s.ListGoals(ctx, f)
		if err != nil {
			t.Fatalf("list: %v", err)
		}
		return res.Items
	}

	// Every whitelisted sort must produce a stable, distinct ordering.
	byDateAsc, byDateDesc := get(model.SortDateAsc), get(model.SortDateDesc)
	if len(byDateAsc) != len(byDateDesc) || len(byDateAsc) != 37 {
		t.Fatalf("unexpected sizes: asc=%d desc=%d", len(byDateAsc), len(byDateDesc))
	}
	for i := 1; i < len(byDateAsc); i++ {
		if byDateAsc[i].MatchID < byDateAsc[i-1].MatchID {
			// Match id order is fixture order, which is chronological.
			t.Fatalf("date_asc is not ascending at %d", i)
		}
	}
	for i := 1; i < len(byDateDesc); i++ {
		if byDateDesc[i].MatchID > byDateDesc[i-1].MatchID {
			t.Fatalf("date_desc is not descending at %d", i)
		}
	}

	xgAsc := get(model.SortXGAsc)
	for i := 1; i < len(xgAsc); i++ {
		if xgAsc[i-1].XG != nil && xgAsc[i].XG != nil && *xgAsc[i-1].XG > *xgAsc[i].XG {
			t.Fatalf("xg_asc is not ascending at %d: %v > %v", i, *xgAsc[i-1].XG, *xgAsc[i].XG)
		}
	}
	xgDesc := get(model.SortXGDesc)
	for i := 1; i < len(xgDesc); i++ {
		if xgDesc[i-1].XG != nil && xgDesc[i].XG != nil && *xgDesc[i-1].XG < *xgDesc[i].XG {
			t.Fatalf("xg_desc is not descending at %d", i)
		}
	}
}

func TestListGoalsPagination(t *testing.T) {
	ctx := context.Background()
	s := testStore(t)

	f, err := model.ParseGoalFilter(q(t, "limit=10&offset=0"))
	if err != nil {
		t.Fatalf("parse: %v", err)
	}
	page1, err := s.ListGoals(ctx, f)
	if err != nil {
		t.Fatalf("page1: %v", err)
	}
	if len(page1.Items) != 10 {
		t.Errorf("page1 len = %d, want 10", len(page1.Items))
	}
	if page1.Total != 37 {
		t.Errorf("total = %d, want 37 (total ignores pagination)", page1.Total)
	}

	f.Offset = 10
	page2, err := s.ListGoals(ctx, f)
	if err != nil {
		t.Fatalf("page2: %v", err)
	}
	for _, a := range page1.Items {
		for _, b := range page2.Items {
			if a.ID == b.ID {
				t.Fatalf("goal %d appears on both pages", a.ID)
			}
		}
	}

	// An offset past the end is empty, not an error.
	f.Offset = 500
	page3, err := s.ListGoals(ctx, f)
	if err != nil {
		t.Fatalf("page3: %v", err)
	}
	if len(page3.Items) != 0 {
		t.Errorf("offset past end returned %d items", len(page3.Items))
	}
}

// The golden coordinate case from plan.md §4. Every stored goal must be inside
// the 105 x 68 m pitch, and the verified shot must land exactly where §4 says.
func TestGoalCoordinatesAreOnThePitch(t *testing.T) {
	ctx := context.Background()
	s := testStore(t)

	res, err := s.ListGoals(ctx, model.GoalFilter{Limit: 200, Sort: model.SortDateDesc})
	if err != nil {
		t.Fatalf("list: %v", err)
	}
	found := false
	for _, g := range res.Items {
		if g.LocationX == nil || g.LocationY == nil {
			t.Errorf("goal %d has no location", g.ID)
			continue
		}
		if *g.LocationX < 0 || *g.LocationX > 105 {
			t.Errorf("goal %d location_x = %v, outside [0,105]", g.ID, *g.LocationX)
		}
		if *g.LocationY < 0 || *g.LocationY > 68 {
			t.Errorf("goal %d location_y = %v, outside [0,68]", g.ID, *g.LocationY)
		}
		if g.SourceGoalID != nil && *g.SourceGoalID == "543569" {
			found = true
			if *g.LocationX != 104.475 || *g.LocationY != 34.816 {
				t.Errorf("golden goal at (%v,%v), want (104.475, 34.816)", *g.LocationX, *g.LocationY)
			}
		}
	}
	if !found {
		t.Error("golden goal 543569 is missing from the corpus")
	}
}

func TestSummary(t *testing.T) {
	ctx := context.Background()
	s := testStore(t)

	sum, err := s.Summary(ctx, model.GoalFilter{})
	if err != nil {
		t.Fatalf("summary: %v", err)
	}
	if sum.Goals != 37 {
		t.Errorf("goals = %d, want 37", sum.Goals)
	}
	if sum.Assists == 0 {
		t.Error("assists is 0; assists come from match stats, not goals")
	}
	if len(sum.ByType) != 2 {
		t.Errorf("by_type len = %d, want 2", len(sum.ByType))
	}
	if sum.ByType[0].Key != "open_play" || sum.ByType[0].Count != 33 {
		t.Errorf("by_type[0] = %+v, want open_play/33", sum.ByType[0])
	}
	if sum.ByType[1].Key != "penalty" || sum.ByType[1].Count != 4 {
		t.Errorf("by_type[1] = %+v, want penalty/4", sum.ByType[1])
	}
	// by_type must be ordered by count descending, as the SQL ordered it.
	for i := 1; i < len(sum.ByType); i++ {
		if sum.ByType[i-1].Count < sum.ByType[i].Count {
			t.Errorf("by_type is not count-descending at %d", i)
		}
	}
	// Five seasons appear in matches, but only four contain a goal: Yamal's
	// 2022/2023 debut produced no goals.
	if len(sum.BySeason) != 4 {
		t.Errorf("by_season len = %d, want 4", len(sum.BySeason))
	}
	total := int64(0)
	for _, b := range sum.BySeason {
		if b.Key == "" {
			t.Error("by_season bucket has an empty key")
		}
		total += b.Count
	}
	if total != 37 {
		t.Errorf("by_season counts sum to %d, want 37", total)
	}
	if len(sum.Minutes) == 0 {
		t.Error("minutes histogram is empty")
	}
	for i := 1; i < len(sum.Minutes); i++ {
		if sum.Minutes[i].Minute < sum.Minutes[i-1].Minute {
			t.Errorf("minutes is not ascending at %d", i)
		}
	}
}

func TestHeatmap(t *testing.T) {
	ctx := context.Background()
	s := testStore(t)

	h, err := s.Heatmap(ctx, model.HeatmapFilter{})
	if err != nil {
		t.Fatalf("heatmap: %v", err)
	}
	if h.TotalGoals != 37 {
		t.Errorf("total_goals = %d, want 37", h.TotalGoals)
	}
	if len(h.Grid) == 0 {
		t.Fatal("grid is empty")
	}
	total := int64(0)
	for i, b := range h.Grid {
		if b.IX < 0 || b.IX >= heatmapNX || b.IY < 0 || b.IY >= heatmapNY {
			t.Errorf("bin %d out of grid: ix=%d iy=%d", i, b.IX, b.IY)
		}
		if b.X <= 0 || b.X >= 105 || b.Y <= 0 || b.Y >= 68 {
			t.Errorf("bin %d centre off pitch: (%v,%v)", i, b.X, b.Y)
		}
		total += b.Count
	}
	if total != h.TotalGoals {
		t.Errorf("bin counts sum to %d, want %d", total, h.TotalGoals)
	}
	for i := 1; i < len(h.Grid); i++ {
		if h.Grid[i].IY < h.Grid[i-1].IY {
			t.Errorf("grid is not row-ordered at %d", i)
		}
	}
}

// score_for and score_against are always from the tracked player's point of
// view, so they swap for an away fixture. The earlier Postgres build recorded
// them home-vs-away and left score_for null on every away match, which made the
// match score render as "-".
func TestMatchScoresAreFromThePlayersPerspective(t *testing.T) {
	ctx := context.Background()
	s := testStore(t)

	res, err := s.ListMatches(ctx, model.MatchFilter{Limit: 200})
	if err != nil {
		t.Fatalf("list matches: %v", err)
	}
	home, away := 0, 0
	for _, m := range res.Items {
		if m.ScoreFor == nil || m.ScoreAgainst == nil {
			t.Errorf("match %d has a null score (%v/%v)", m.ID, m.ScoreFor, m.ScoreAgainst)
			continue
		}
		if m.IsHome {
			home++
		} else {
			away++
		}
	}
	if home == 0 || away == 0 {
		t.Fatalf("corpus should contain both home and away matches, got %d/%d", home, away)
	}
}

// A created goal must reach the file on disk and still be there after a
// re-open. This is the write-then-restart guarantee.
func TestCreateGoalPersistsToFile(t *testing.T) {
	ctx := context.Background()
	s, path := testStoreFile(t)

	before, err := s.ListGoals(ctx, model.GoalFilter{Limit: 200})
	if err != nil {
		t.Fatalf("list before: %v", err)
	}
	if before.Total != 37 {
		t.Fatalf("baseline total = %d, want 37", before.Total)
	}

	created, err := s.CreateGoal(ctx, model.Goal{
		MatchID: 1, Minute: 77, GoalType: "open_play",
		BodyPart: strPtr("left_foot"), XG: f64(0.5),
		LocationX: f64(90), LocationY: f64(34),
	})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	if created.ID != 38 {
		t.Errorf("created id = %d, want 38 (append-only)", created.ID)
	}

	// On disk.
	raw, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read data file: %v", err)
	}
	var onDisk model.Fixture
	if err := json.Unmarshal(raw, &onDisk); err != nil {
		t.Fatalf("decode data file: %v", err)
	}
	if len(onDisk.Goals) != 38 {
		t.Errorf("goals on disk = %d, want 38", len(onDisk.Goals))
	}
	if onDisk.Goals[37].Minute != 77 {
		t.Errorf("created goal on disk has minute %d, want 77", onDisk.Goals[37].Minute)
	}

	// After a restart.
	reopened, err := Open(path)
	if err != nil {
		t.Fatalf("reopen: %v", err)
	}
	after, err := reopened.ListGoals(ctx, model.GoalFilter{Limit: 200})
	if err != nil {
		t.Fatalf("list after: %v", err)
	}
	if after.Total != 38 {
		t.Errorf("total after restart = %d, want 38", after.Total)
	}
	got, err := reopened.GetGoal(ctx, 38)
	if err != nil {
		t.Fatalf("get created goal: %v", err)
	}
	if got.Minute != 77 || got.LocationX == nil || *got.LocationX != 90 {
		t.Errorf("created goal did not survive restart: %+v", got)
	}
}

func TestCreateGoalValidation(t *testing.T) {
	ctx := context.Background()
	s := testStore(t)

	tests := []struct {
		name string
		g    model.Goal
		want error
	}{
		{"missing match", model.Goal{Minute: 10, GoalType: "open_play"}, ErrBadInput},
		{"unknown match", model.Goal{MatchID: 9999, Minute: 10, GoalType: "open_play"}, ErrBadInput},
		{"bad goal type", model.Goal{MatchID: 1, Minute: 10, GoalType: "tap_in"}, ErrBadInput},
		{"bad body part", model.Goal{MatchID: 1, Minute: 10, GoalType: "open_play", BodyPart: strPtr("tail")}, ErrBadInput},
		{"minute too high", model.Goal{MatchID: 1, Minute: 131, GoalType: "open_play"}, ErrBadInput},
		{"x off the pitch", model.Goal{MatchID: 1, Minute: 10, GoalType: "open_play", LocationX: f64(106)}, ErrBadInput},
		{"y off the pitch", model.Goal{MatchID: 1, Minute: 10, GoalType: "open_play", LocationY: f64(-1)}, ErrBadInput},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := s.CreateGoal(ctx, tt.g)
			if !errors.Is(err, tt.want) {
				t.Errorf("err = %v, want %v", err, tt.want)
			}
		})
	}
}

func TestReferenceResourcesAreReadOnly(t *testing.T) {
	ctx := context.Background()
	s := testStore(t)

	// Reads work.
	for _, tc := range []struct {
		name string
		fn   func() (int, error)
	}{
		{"players", func() (int, error) { v, e := s.ListPlayers(ctx); return len(v), e }},
		{"teams", func() (int, error) { v, e := s.ListTeams(ctx); return len(v), e }},
		{"opponents", func() (int, error) { v, e := s.ListOpponents(ctx); return len(v), e }},
		{"competitions", func() (int, error) { v, e := s.ListCompetitions(ctx); return len(v), e }},
	} {
		t.Run("list "+tc.name, func(t *testing.T) {
			n, err := tc.fn()
			if err != nil {
				t.Fatalf("list: %v", err)
			}
			if n == 0 {
				t.Error("empty list")
			}
		})
	}

	// Writes are refused with a conflict rather than silently accepted.
	if _, err := s.CreatePlayer(ctx, model.Player{FullName: "X"}); !errors.Is(err, ErrConflict) {
		t.Errorf("CreatePlayer err = %v, want conflict", err)
	}
	if _, err := s.CreateTeam(ctx, model.Team{Name: "X"}); !errors.Is(err, ErrConflict) {
		t.Errorf("CreateTeam err = %v, want conflict", err)
	}
	if err := s.DeleteOpponent(ctx, 1); !errors.Is(err, ErrConflict) {
		t.Errorf("DeleteOpponent err = %v, want conflict", err)
	}
}

func TestMatchDetailExpand(t *testing.T) {
	ctx := context.Background()
	s := testStore(t)

	d, err := s.GetMatchDetail(ctx, 10, true, true)
	if err != nil {
		t.Fatalf("detail: %v", err)
	}
	if d.ID != 10 {
		t.Errorf("match id = %d, want 10", d.ID)
	}
	if len(d.Goals) == 0 {
		t.Error("expand=goals returned no goals")
	}
	if len(d.Stats) != 1 {
		t.Errorf("stats len = %d, want 1", len(d.Stats))
	}
	if d.Competition.Code == "" {
		t.Error("competition not joined")
	}

	// Without expand the collections are empty, not null.
	plain, err := s.GetMatchDetail(ctx, 10, false, false)
	if err != nil {
		t.Fatalf("plain detail: %v", err)
	}
	if len(plain.Goals) != 0 || len(plain.Stats) != 0 {
		t.Error("unexpanded detail should return empty collections")
	}
	if _, err := s.GetMatchDetail(ctx, 99999, false, false); !errors.Is(err, ErrNotFound) {
		t.Errorf("missing match err = %v, want not found", err)
	}
}

func TestHeatmapIsFlaggedSynthetic(t *testing.T) {
	ctx := context.Background()
	s := testStore(t)

	c, _ := LoadCounts(ctx, s)
	if c.Heatmaps == 0 {
		t.Skip("corpus has no heatmaps")
	}
	found := false
	for _, st := range s.db.stats {
		if st.Heatmap == nil {
			continue
		}
		found = true
		if !st.Heatmap.Synthetic {
			t.Errorf("match_stats %d heatmap is not flagged synthetic", st.ID)
		}
		if st.Heatmap.Grid.NX != 24 || st.Heatmap.Grid.NY != 16 {
			t.Errorf("heatmap grid = %dx%d, want 24x16", st.Heatmap.Grid.NX, st.Heatmap.Grid.NY)
		}
	}
	if !found {
		t.Error("no heatmaps attached")
	}
}

// A malformed file must be rejected loudly rather than booting empty.
func TestOpenRejectsBadData(t *testing.T) {
	dir := t.TempDir()
	tests := []struct {
		name    string
		content string
	}{
		{"not json", "nope"},
		{"wrong schema version", `{"schema_version":"9.9.9","source":"mock"}`},
		{"wrong source", `{"schema_version":"1.0.0","source":"live"}`},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			p := filepath.Join(dir, tt.name+".json")
			if err := os.WriteFile(p, []byte(tt.content), 0o644); err != nil {
				t.Fatal(err)
			}
			if _, err := Open(p); err == nil {
				t.Error("expected an error")
			}
		})
	}
}

func f64(v float64) *float64 { return &v }

// defaultPage mirrors model.defaultLimit, the page size used when a query does
// not ask for one.
const defaultPage = 24
