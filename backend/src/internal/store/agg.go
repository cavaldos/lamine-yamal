package store

import (
	"context"
	"sort"

	"github.com/lamine/backend/src/internal/model"
)

// The aggregates used to be jsonb rollups in SQL. They are now plain Go
// aggregation over the same in-memory rows, producing byte-identical shapes.
//
// Grid geometry is fixed by the pitch contract (plan.md §4): a 105 x 68 m pitch
// binned 24 x 16 gives 4.375 m x 4.25 m cells, and a bin index is clamped so a
// coordinate on the far touchline lands in the last cell instead of spilling out.
const (
	heatmapNX = 24
	heatmapNY = 16
	cellW     = 105.0 / heatmapNX
	cellH     = 68.0 / heatmapNY
)

// Heatmap builds the aggregate grid for the filtered goals.
func (s *Store) Heatmap(_ context.Context, f model.HeatmapFilter) (model.HeatmapResponse, error) {
	s.db.mu.RLock()
	defer s.db.mu.RUnlock()

	rows := s.db.selectGoals(f)

	type cell struct{ ix, iy, n int }
	counts := map[cell]int{}
	matches := map[int64]bool{}
	for _, r := range rows {
		if r.g.LocationX == nil || r.g.LocationY == nil {
			continue
		}
		matches[r.g.MatchID] = true
		ix := clampIdx(int(*r.g.LocationX/cellW), heatmapNX)
		iy := clampIdx(int(*r.g.LocationY/cellH), heatmapNY)
		counts[cell{ix, iy, 0}]++
	}

	out := model.HeatmapResponse{Grid: []model.HeatmapBin{}, Matches: int64(len(matches))}
	for c, n := range counts {
		out.Grid = append(out.Grid, model.HeatmapBin{
			IX: c.ix, IY: c.iy,
			X:     (float64(c.ix) + 0.5) * cellW,
			Y:     (float64(c.iy) + 0.5) * cellH,
			Count: int64(n),
		})
	}
	// Ordered by row then column, matching the SQL's ORDER BY iy, ix.
	sort.Slice(out.Grid, func(i, j int) bool {
		if out.Grid[i].IY != out.Grid[j].IY {
			return out.Grid[i].IY < out.Grid[j].IY
		}
		return out.Grid[i].IX < out.Grid[j].IX
	})
	out.TotalGoals = int64(len(rows))
	return out, nil
}

func clampIdx(v, n int) int {
	if v < 0 {
		return 0
	}
	if v >= n {
		return n - 1
	}
	return v
}

// matchLevelOK is the match-level half of the filter, without the goal-only
// predicates. The SQL version computed assists over this set, so assists stay
// independent of which goals happen to be in view — filtering by goal_type does
// not change the assist total, and neither does it here.
func matchLevelOK(m *model.Match, f *model.GoalFilter) bool {
	if f.CompetitionID != nil && m.CompetitionID != *f.CompetitionID {
		return false
	}
	if !seasonMatches(m.Season, f.Season) {
		return false
	}
	if f.OpponentID != nil && m.OpponentID != *f.OpponentID {
		return false
	}
	if f.MatchID != nil && m.ID != *f.MatchID {
		return false
	}
	if f.IsHome != nil && m.IsHome != *f.IsHome {
		return false
	}
	if f.DateFrom != nil && m.PlayedAt.Before(*f.DateFrom) {
		return false
	}
	if f.DateTo != nil && !m.PlayedAt.Before(f.DateTo.AddDate(0, 0, 1)) {
		return false
	}
	return true
}

// Summary builds the dashboard rollup for the filtered goals.
func (s *Store) Summary(_ context.Context, f model.GoalFilter) (model.SummaryResponse, error) {
	s.db.mu.RLock()
	defer s.db.mu.RUnlock()

	rows := s.db.selectGoals(f)

	out := model.SummaryResponse{
		Goals:         int64(len(rows)),
		Minutes:       []model.MinuteBucket{},
		ByCompetition: []model.CountBucket{},
		BySeason:      []model.CountBucket{},
		ByType:        []model.CountBucket{},
		ByOpponent:    []model.CountBucket{},
	}

	assists := int64(0)
	minuteCounts := map[int32]int64{}

	for _, r := range rows {
		minuteCounts[r.g.Minute]++
		if c, ok := s.db.compByID[r.m.CompetitionID]; ok {
			bumpBy(&out.ByCompetition, c.Code, c.ID, c.Name)
		}
		if o, ok := s.db.oppByID[r.m.OpponentID]; ok {
			bumpBy(&out.ByOpponent, o.Name, o.ID, o.Name)
		}
		if r.m.Season != nil {
			bumpBy(&out.BySeason, *r.m.Season, 0, *r.m.Season)
		}
		bumpBy(&out.ByType, r.g.GoalType, 0, r.g.GoalType)
	}

	for _, m := range s.db.matches {
		if !matchLevelOK(m, &f) {
			continue
		}
		if st, ok := s.db.statByMatch[m.ID]; ok {
			assists += int64(st.Assists)
		}
	}
	out.Assists = assists

	for m, n := range minuteCounts {
		out.Minutes = append(out.Minutes, model.MinuteBucket{Minute: m, Count: n})
	}
	sort.Slice(out.Minutes, func(i, j int) bool { return out.Minutes[i].Minute < out.Minutes[j].Minute })

	sortByCountDesc(out.ByCompetition)
	sortByCountDesc(out.ByOpponent)
	sortByCountDesc(out.ByType)
	sort.Slice(out.BySeason, func(i, j int) bool { return out.BySeason[i].Key < out.BySeason[j].Key })
	return out, nil
}

// bumpBy increments the bucket for key, appending it on first sight.
func bumpBy(buckets *[]model.CountBucket, key string, id int64, name string) {
	for i := range *buckets {
		if (*buckets)[i].Key == key {
			(*buckets)[i].Count++
			return
		}
	}
	b := model.CountBucket{Key: key, Name: name, Count: 1}
	if id != 0 {
		b.ID = &id
	}
	*buckets = append(*buckets, b)
}

// sortByCountDesc mirrors the SQL's ORDER BY count DESC, name.
func sortByCountDesc(bs []model.CountBucket) {
	sort.SliceStable(bs, func(i, j int) bool {
		if bs[i].Count != bs[j].Count {
			return bs[i].Count > bs[j].Count
		}
		return bs[i].Name < bs[j].Name
	})
}
