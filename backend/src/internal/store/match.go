package store

import (
	"context"
	"sort"

	"github.com/lamine/backend/src/internal/model"
)

// Matches are writable. Their ids are append-only, exactly like goals.

func (s *Store) ListMatches(_ context.Context, f model.MatchFilter) (model.List[model.Match], error) {
	s.db.mu.RLock()
	defer s.db.mu.RUnlock()

	matched := make([]*model.Match, 0, len(s.db.matches))
	for _, m := range s.db.matches {
		if matchOKFor(m, &f) {
			matched = append(matched, m)
		}
	}
	asc := f.Sort == model.SortDateAsc
	sort.SliceStable(matched, func(i, j int) bool {
		if !matched[i].PlayedAt.Equal(matched[j].PlayedAt) {
			if asc {
				return matched[i].PlayedAt.Before(matched[j].PlayedAt)
			}
			return matched[i].PlayedAt.After(matched[j].PlayedAt)
		}
		return matched[i].ID > matched[j].ID
	})
	page := paginate(matched, f.Limit, f.Offset)

	items := make([]model.Match, 0, len(page))
	for _, m := range page {
		items = append(items, *m)
	}
	return model.List[model.Match]{Items: items, Total: int64(len(matched))}, nil
}

func (s *Store) GetMatch(_ context.Context, id int64) (model.Match, error) {
	s.db.mu.RLock()
	defer s.db.mu.RUnlock()
	if m, ok := s.db.matchByID[id]; ok {
		return *m, nil
	}
	return model.Match{}, notFoundf("match")
}

// MatchDetail is the expanded match payload (?expand=goals,stats).
type MatchDetail struct {
	model.Match
	Competition model.Competition `json:"competition"`
	Opponent    model.Opponent    `json:"opponent"`
	Goals       []model.Goal      `json:"goals"`
	Stats       []model.MatchStat `json:"stats"`
	Shots       []model.Shot      `json:"shots"`
}

// GetMatchDetail assembles the expanded view. Which collections to load is a
// fixed set of booleans, never a caller-supplied list.
func (s *Store) GetMatchDetail(_ context.Context, id int64, expandGoals, expandStats bool) (MatchDetail, error) {
	s.db.mu.RLock()
	defer s.db.mu.RUnlock()

	m, ok := s.db.matchByID[id]
	if !ok {
		return MatchDetail{}, notFoundf("match")
	}
	d := MatchDetail{
		Match: *m,
		Goals: []model.Goal{}, Stats: []model.MatchStat{}, Shots: []model.Shot{},
	}
	if c, ok := s.db.compByID[m.CompetitionID]; ok {
		d.Competition = *c
	}
	if o, ok := s.db.oppByID[m.OpponentID]; ok {
		d.Opponent = *o
	}
	if expandGoals {
		for _, g := range s.db.goals {
			if g.MatchID == id {
				d.Goals = append(d.Goals, *g)
			}
		}
		for _, sh := range s.db.shots {
			if sh.MatchID == id {
				d.Shots = append(d.Shots, *sh)
			}
		}
	}
	if expandStats {
		if st, ok := s.db.statByMatch[id]; ok {
			d.Stats = append(d.Stats, *st)
		}
	}
	return d, nil
}

func (s *Store) CreateMatch(_ context.Context, m model.Match) (model.Match, error) {
	if m.PlayedAt.IsZero() {
		return model.Match{}, errBadInput("played_at is required")
	}
	if m.CompetitionID == 0 || m.OpponentID == 0 {
		return model.Match{}, errBadInput("competition_id and opponent_id are required")
	}

	var newID int64
	err := s.db.mutate(func(fx *model.Fixture) error {
		comp, ok := s.db.compByID[m.CompetitionID]
		if !ok {
			return errBadInput("competition %d does not exist", m.CompetitionID)
		}
		opp, ok := s.db.oppByID[m.OpponentID]
		if !ok {
			return errBadInput("opponent %d does not exist", m.OpponentID)
		}
		// The old schema had a UNIQUE constraint on source_match_id.
		if m.SourceMatchID != nil {
			for _, e := range s.db.matches {
				if e.SourceMatchID != nil && *e.SourceMatchID == *m.SourceMatchID {
					return conflictf("match source_match_id %q already exists", *m.SourceMatchID)
				}
			}
		}
		newID = s.db.nextMatch
		fx.Matches = append(fx.Matches, matchToFixture(fx, &m, newID, comp.Code, opp.Name))
		return nil
	})
	if err != nil {
		return model.Match{}, err
	}
	s.db.mu.RLock()
	defer s.db.mu.RUnlock()
	if created, ok := s.db.matchByID[newID]; ok {
		return *created, nil
	}
	return model.Match{}, notFoundf("match after write")
}

func (s *Store) UpdateMatch(_ context.Context, id int64, p model.MatchPatch) (model.Match, error) {
	err := s.db.mutate(func(fx *model.Fixture) error {
		m, ok := s.db.matchByID[id]
		if !ok {
			return notFoundf("match")
		}
		setString(&m.Season, p.Season)
		setString(&m.Venue, p.Venue)
		setString(&m.Referee, p.Referee)
		setString(&m.SourceMatchID, p.SourceMatchID)
		setString(&m.VideoURL, p.VideoURL)
		setInt32Ptr(&m.ScoreFor, p.ScoreFor)
		setInt32Ptr(&m.ScoreAgainst, p.ScoreAgainst)
		setInt32Ptr(&m.Attendance, p.Attendance)
		setInt64Val(&m.CompetitionID, p.CompetitionID)
		setInt64Val(&m.OpponentID, p.OpponentID)
		if p.IsHome != nil {
			m.IsHome = *p.IsHome
		}
		if p.PlayedAt != nil {
			t := parseDate(*p.PlayedAt)
			if t.IsZero() {
				return errBadInput("played_at must be YYYY-MM-DD")
			}
			m.PlayedAt = t
		}
		idx := int(id - 1)
		if idx < 0 || idx >= len(fx.Matches) {
			return notFoundf("match")
		}
		comp, opp := s.db.compByID[m.CompetitionID], s.db.oppByID[m.OpponentID]
		if comp == nil || opp == nil {
			return errBadInput("competition_id and opponent_id must reference existing rows")
		}
		fx.Matches[idx] = matchToFixture(fx, m, id, comp.Code, opp.Name)
		return nil
	})
	if err != nil {
		return model.Match{}, err
	}
	s.db.mu.RLock()
	defer s.db.mu.RUnlock()
	if updated, ok := s.db.matchByID[id]; ok {
		return *updated, nil
	}
	return model.Match{}, notFoundf("match after write")
}

// DeleteMatch removes a match and everything hanging off it, which is what the
// old ON DELETE CASCADE did. The fixture key is captured before the slice is
// spliced, because the removed row is the only thing that knows it.
func (s *Store) DeleteMatch(_ context.Context, id int64) error {
	return s.db.mutate(func(fx *model.Fixture) error {
		i := int(id - 1)
		if i < 0 || i >= len(fx.Matches) {
			return notFoundf("match")
		}
		key := fx.Matches[i].ID
		fx.Matches = append(fx.Matches[:i], fx.Matches[i+1:]...)

		fx.Goals = keepWhere(fx.Goals, func(g model.FixtureGoal) bool { return g.MatchID != key })
		fx.MatchStats = keepWhere(fx.MatchStats, func(st model.FixtureMatchStat) bool { return st.MatchID != key })
		fx.Shots = keepWhere(fx.Shots, func(sh model.FixtureShot) bool { return sh.MatchID != key })
		return nil
	})
}

// matchToFixture converts a model match back to its fixture form.
func matchToFixture(fx *model.Fixture, m *model.Match, id int64, compCode, oppName string) model.FixtureMatch {
	playerTeam := fx.Player.TeamID
	oppKey := ""
	for k, t := range fx.Teams {
		if t.Name == oppName {
			oppKey = k
			break
		}
	}
	homeKey, awayKey := oppKey, playerTeam
	homeScore, awayScore := derefInt32(m.ScoreAgainst), derefInt32(m.ScoreFor)
	if m.IsHome {
		homeKey, awayKey = playerTeam, oppKey
		homeScore, awayScore = derefInt32(m.ScoreFor), derefInt32(m.ScoreAgainst)
	}
	source := deref(m.SourceMatchID)
	if source == "" {
		source = "local-" + itoa(id)
	}
	return model.FixtureMatch{
		ID:            "match-" + source,
		SourceMatchID: source,
		Date:          m.PlayedAt.Format("2006-01-02"),
		CompetitionID: compCode,
		Season:        deref(m.Season),
		Venue:         m.Venue,
		Attendance:    intPtrToInt(m.Attendance),
		HomeTeamID:    homeKey,
		AwayTeamID:    awayKey,
		HomeScore:     int(homeScore),
		AwayScore:     int(awayScore),
		ScoreDisplay:  itoa(int64(homeScore)) + "-" + itoa(int64(awayScore)),
		Status:        "FT",
		IsHome:        m.IsHome,
		PlayerSide:    sideOf(m.IsHome),
		Referee:       m.Referee,
	}
}

func sideOf(isHome bool) string {
	if isHome {
		return "home"
	}
	return "away"
}

// keepWhere drops the rows for which keep returns false. It is generic over the
// three fixture record types because all three are keyed by MatchID.
func keepWhere[T any](items []T, keep func(T) bool) []T {
	out := make([]T, 0, len(items))
	for _, it := range items {
		if keep(it) {
			out = append(out, it)
		}
	}
	return out
}
