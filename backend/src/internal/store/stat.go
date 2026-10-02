package store

import (
	"context"
	"strconv"

	"github.com/lamine/backend/src/internal/model"
)

func (s *Store) GetMatchStat(_ context.Context, matchID int64) (model.MatchStat, error) {
	s.db.mu.RLock()
	defer s.db.mu.RUnlock()
	if st, ok := s.db.statByMatch[matchID]; ok {
		return *st, nil
	}
	return model.MatchStat{}, notFoundf("match stats")
}

// UpdateHeatmap replaces the whole grid. Writing it as one value is what makes
// the endpoint idempotent: the same grid posted twice produces the same row.
func (s *Store) UpdateHeatmap(_ context.Context, matchID int64, h model.Heatmap) (model.MatchStat, error) {
	err := s.db.mutate(func(fx *model.Fixture) error {
		st, ok := s.db.statByMatch[matchID]
		if !ok {
			return notFoundf("match stats")
		}
		m := s.db.matchByID[matchID]
		if m == nil || m.SourceMatchID == nil {
			return notFoundf("match")
		}
		h.MatchID = matchID
		if h.Grid.Origin == "" {
			h.Grid.Origin = "top_left"
		}
		st.Heatmap = &h

		// Upsert the fixture's heatmap list, keyed by the numeric source match
		// id the ingester uses.
		key, err := strconv.ParseInt(*m.SourceMatchID, 10, 64)
		if err != nil {
			return errBadInput("match %d has no numeric source_match_id", matchID)
		}
		replaced := false
		for i := range fx.Heatmaps {
			if fx.Heatmaps[i].MatchID == key {
				fx.Heatmaps[i] = h
				replaced = true
				break
			}
		}
		if !replaced {
			fx.Heatmaps = append(fx.Heatmaps, h)
		}
		return nil
	})
	if err != nil {
		return model.MatchStat{}, err
	}
	s.db.mu.RLock()
	defer s.db.mu.RUnlock()
	if updated, ok := s.db.statByMatch[matchID]; ok {
		return *updated, nil
	}
	return model.MatchStat{}, notFoundf("match stats after write")
}

func (s *Store) ListShots(_ context.Context, matchID int64) ([]model.Shot, error) {
	s.db.mu.RLock()
	defer s.db.mu.RUnlock()
	out := []model.Shot{}
	for _, sh := range s.db.shots {
		if sh.MatchID == matchID {
			out = append(out, *sh)
		}
	}
	return out, nil
}
