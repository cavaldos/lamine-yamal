package store

import (
	"context"
	"sort"

	"github.com/lamine/backend/src/internal/model"
)

// The four reference resources: players, teams, competitions, opponents.
//
// These are READ-ONLY over the data file. Two reasons, both structural:
//
//  1. Ids are positional (a record's id is its index in the fixture array, or
//     its rank in the name-sorted team/opponent list). Inserting a row would
//     renumber every record after it, so a client holding an id would start
//     pointing at the wrong row. Positional ids are what keep the ids identical
//     to the values the earlier Postgres build served.
//  2. The fixture schema stores teams and competitions as objects keyed by id
//     and has a single `player` object. Writing a new one of any of these
//     changes that schema, and the schema has to stay round-trippable through
//     tools/ingest.
//
// Writes therefore return 409 with an explanation instead of silently accepting
// a change that would not survive or would corrupt ids. Goals and matches, whose
// ids are append-only, are fully writable — see goal.go and match.go.

func (s *Store) ListPlayers(_ context.Context) ([]model.Player, error) {
	out := make([]model.Player, 0, len(s.db.players))
	for _, p := range s.db.players {
		out = append(out, *p)
	}
	sort.SliceStable(out, func(i, j int) bool { return out[i].ID < out[j].ID })
	return out, nil
}

func (s *Store) GetPlayer(_ context.Context, id int64) (model.Player, error) {
	if p, ok := s.db.playerByID[id]; ok {
		return *p, nil
	}
	return model.Player{}, notFoundf("player")
}

func (s *Store) ListTeams(_ context.Context) ([]model.Team, error) {
	out := make([]model.Team, 0, len(s.db.teams))
	for _, t := range s.db.teams {
		out = append(out, *t)
	}
	sort.SliceStable(out, func(i, j int) bool {
		if out[i].Name != out[j].Name {
			return out[i].Name < out[j].Name
		}
		return out[i].ID < out[j].ID
	})
	return out, nil
}

func (s *Store) GetTeam(_ context.Context, id int64) (model.Team, error) {
	if t, ok := s.db.teamByID[id]; ok {
		return *t, nil
	}
	return model.Team{}, notFoundf("team")
}

func (s *Store) ListCompetitions(_ context.Context) ([]model.Competition, error) {
	out := make([]model.Competition, 0, len(s.db.competitions))
	for _, c := range s.db.competitions {
		out = append(out, *c)
	}
	sort.SliceStable(out, func(i, j int) bool {
		if out[i].Priority != out[j].Priority {
			return out[i].Priority > out[j].Priority
		}
		if out[i].Name != out[j].Name {
			return out[i].Name < out[j].Name
		}
		return out[i].ID < out[j].ID
	})
	return out, nil
}

func (s *Store) GetCompetition(_ context.Context, id int64) (model.Competition, error) {
	if c, ok := s.db.compByID[id]; ok {
		return *c, nil
	}
	return model.Competition{}, notFoundf("competition")
}

func (s *Store) GetCompetitionByCode(_ context.Context, code string) (model.Competition, error) {
	for _, c := range s.db.competitions {
		if c.Code == code {
			return *c, nil
		}
	}
	return model.Competition{}, notFoundf("competition")
}

func (s *Store) ListOpponents(_ context.Context) ([]model.Opponent, error) {
	out := make([]model.Opponent, 0, len(s.db.opponents))
	for _, o := range s.db.opponents {
		out = append(out, *o)
	}
	sort.SliceStable(out, func(i, j int) bool {
		if out[i].Name != out[j].Name {
			return out[i].Name < out[j].Name
		}
		return out[i].ID < out[j].ID
	})
	return out, nil
}

func (s *Store) GetOpponent(_ context.Context, id int64) (model.Opponent, error) {
	if o, ok := s.db.oppByID[id]; ok {
		return *o, nil
	}
	return model.Opponent{}, notFoundf("opponent")
}

// readOnlyRef builds the 409 for every refused reference write.
func readOnlyRef(kind string) error {
	return conflictf("%s are part of the committed Understat corpus and are read-only; "+
		"only goals and matches can be written", kind)
}

func (s *Store) CreatePlayer(_ context.Context, _ model.Player) (model.Player, error) {
	return model.Player{}, readOnlyRef("players")
}

func (s *Store) UpdatePlayer(_ context.Context, _ int64, _ model.PlayerPatch) (model.Player, error) {
	return model.Player{}, readOnlyRef("players")
}

func (s *Store) DeletePlayer(_ context.Context, _ int64) error { return readOnlyRef("players") }

func (s *Store) CreateTeam(_ context.Context, _ model.Team) (model.Team, error) {
	return model.Team{}, readOnlyRef("teams")
}

func (s *Store) UpdateTeam(_ context.Context, _ int64, _ model.TeamPatch) (model.Team, error) {
	return model.Team{}, readOnlyRef("teams")
}

func (s *Store) DeleteTeam(_ context.Context, _ int64) error { return readOnlyRef("teams") }

func (s *Store) CreateCompetition(_ context.Context, _ model.Competition) (model.Competition, error) {
	return model.Competition{}, readOnlyRef("competitions")
}

func (s *Store) UpdateCompetition(_ context.Context, _ int64, _ model.CompetitionPatch) (model.Competition, error) {
	return model.Competition{}, readOnlyRef("competitions")
}

func (s *Store) DeleteCompetition(_ context.Context, _ int64) error {
	return readOnlyRef("competitions")
}

func (s *Store) CreateOpponent(_ context.Context, _ model.Opponent) (model.Opponent, error) {
	return model.Opponent{}, readOnlyRef("opponents")
}

func (s *Store) UpdateOpponent(_ context.Context, _ int64, _ model.OpponentPatch) (model.Opponent, error) {
	return model.Opponent{}, readOnlyRef("opponents")
}

func (s *Store) DeleteOpponent(_ context.Context, _ int64) error { return readOnlyRef("opponents") }
