package store

import (
	"sort"
	"strings"

	"github.com/lamine/backend/src/internal/model"
)

// This file replaces the SQL whitelisting with Go whitelisting. The guarantee is
// the same: the request supplies values for a fixed set of fields, and the code
// that reads them is a fixed set of comparisons. Nothing from the query string
// is ever interpreted as anything but the value it is declared to be.

// goalRows pairs each goal with its match so the join the SQL used to perform
// happens once, here, instead of per row.
type goalRows []goalRow

type goalRow struct {
	g *model.Goal
	m *model.Match
}

// seasonMatches compares a stored season ("2025/2026") against a filter value.
// The UI and the shared URLs carry the short form ("2025") because that is what
// people actually type and click, so an exact compare here silently returned
// zero rows for every season link. The full form still matches exactly.
func seasonMatches(stored *string, want *string) bool {
	if want == nil {
		return true
	}
	if stored == nil {
		return false
	}
	if *stored == *want {
		return true
	}
	return strings.HasPrefix(*stored, *want)
}

// matchOK applies the match-level half of the goal filter. date_to is
// inclusive of the whole day, matching the SQL's `+ interval '1 day'`.
func matchOK(m *model.Match, f *model.GoalFilter) bool {
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
	if f.DateTo != nil {
		end := f.DateTo.AddDate(0, 0, 1)
		if !m.PlayedAt.Before(end) {
			return false
		}
	}
	return true
}

// goalOK applies the goal-only half of the filter.
func goalOK(g *model.Goal, f *model.GoalFilter) bool {
	if f.GoalType != nil && g.GoalType != *f.GoalType {
		return false
	}
	if f.BodyPart != nil && (g.BodyPart == nil || *g.BodyPart != *f.BodyPart) {
		return false
	}
	return true
}

// selectGoals returns the filtered goals with their match, before sorting.
func (d *DB) selectGoals(f model.GoalFilter) goalRows {
	out := make(goalRows, 0, len(d.goals))
	for _, g := range d.goals {
		m := d.matchByID[g.MatchID]
		if m == nil || !matchOK(m, &f) || !goalOK(g, &f) {
			continue
		}
		out = append(out, goalRow{g: g, m: m})
	}
	return out
}

// sortGoals reproduces the ORDER BY the SQL used to apply, including the
// played_at DESC / id DESC tiebreak that every mode carried.
func sortGoals(rows goalRows, mode int) {
	cmpNilF := func(a, b *float64) int {
		switch {
		case a == nil && b == nil:
			return 0
		case a == nil:
			return -1 // NULLS LAST
		case b == nil:
			return 1
		case *a < *b:
			return -1
		case *a > *b:
			return 1
		}
		return 0
	}
	// value is the goal's value proxy: xG weighted by xGOT, matching the SQL.
	value := func(g *model.Goal) *float64 {
		if g.XG == nil {
			return nil
		}
		v := *g.XG
		if g.XGOT != nil {
			v *= *g.XGOT
		} else {
			v *= 1
		}
		return &v
	}

	sort.SliceStable(rows, func(i, j int) bool {
		a, b := rows[i], rows[j]
		switch mode {
		case 1: // date_asc
			if !a.m.PlayedAt.Equal(b.m.PlayedAt) {
				return a.m.PlayedAt.Before(b.m.PlayedAt)
			}
			if a.g.Minute != b.g.Minute {
				return a.g.Minute < b.g.Minute
			}
			return a.g.ID > b.g.ID
		case 3: // xg_asc
			if c := cmpNilF(a.g.XG, b.g.XG); c != 0 {
				return c < 0
			}
		case 4: // xg_desc
			if c := cmpNilF(a.g.XG, b.g.XG); c != 0 {
				return c > 0
			}
		case 5: // value_desc
			if c := cmpNilF(value(a.g), value(b.g)); c != 0 {
				return c > 0
			}
		}
		// Default and shared tiebreak: newest first, then id descending.
		if !a.m.PlayedAt.Equal(b.m.PlayedAt) {
			return a.m.PlayedAt.After(b.m.PlayedAt)
		}
		return a.g.ID > b.g.ID
	})
}

// paginate applies limit/offset. A limit of zero means "no limit", which is what
// the aggregate endpoints use.
func paginate[T any](items []T, limit, offset int32) []T {
	if offset > 0 {
		if int(offset) >= len(items) {
			return []T{}
		}
		items = items[offset:]
	}
	if limit > 0 && int(limit) < len(items) {
		items = items[:limit]
	}
	return items
}

// matchOKFor is the match endpoint's own filter half.
func matchOKFor(m *model.Match, f *model.MatchFilter) bool {
	if f.CompetitionID != nil && m.CompetitionID != *f.CompetitionID {
		return false
	}
	if f.OpponentID != nil && m.OpponentID != *f.OpponentID {
		return false
	}
	if !seasonMatches(m.Season, f.Season) {
		return false
	}
	if f.DateFrom != nil && m.PlayedAt.Before(*f.DateFrom) {
		return false
	}
	if f.DateTo != nil {
		end := f.DateTo.AddDate(0, 0, 1)
		if !m.PlayedAt.Before(end) {
			return false
		}
	}
	return true
}

// countWhere is a tiny helper for the aggregate endpoints.
func countWhere(n int, ok bool) int64 {
	if !ok {
		return 0
	}
	return int64(n)
}

func deref(s *string) string {
	if s == nil {
		return ""
	}
	return *s
}

func derefF(f *float64) float64 {
	if f == nil {
		return 0
	}
	return *f
}

func eqFold(a, b string) bool { return strings.EqualFold(a, b) }
