// Package store is the whole data layer: one JSON file, loaded into memory.
//
// DB owns the data and the lock. Store is the query API that the handler layer
// talks to. Handler code is unchanged by the move away from Postgres — the
// method signatures and the model types they return are identical.
package store

import (
	"context"

	"github.com/lamine/backend/src/internal/model"
)

// Store exposes the data file as a queryable API.
type Store struct {
	db *DB
}

// New wraps an already-loaded DB.
func New(db *DB) *Store { return &Store{db: db} }

// Open is the convenience path used by main and by tests.
func Open(path string) (*Store, error) {
	db, err := OpenDB(path)
	if err != nil {
		return nil, err
	}
	return New(db), nil
}

// OpenDB loads the backing file into a DB. Callers that need the raw DB (to
// reach the health probe) use this; most callers want Open.

// Path reports the backing file ("" when the embedded fixture is used).
func (s *Store) Path() string { return s.db.Path() }

// Health reports whether the datastore is loaded.
func (s *Store) Health() error { return s.db.Health() }

// DB exposes the underlying handle for callers that need the health probe.
func (s *Store) DB() *DB { return s.db }

// Counts summarises what the datastore holds. It backs the boot log and the
// -check mode, which replaced the old migrate/seed one-shots.
type Counts struct {
	Teams        int
	Opponents    int
	Competitions int
	Players      int
	Matches      int
	Goals        int
	Shots        int
	Heatmaps     int
}

// LoadCounts reports the size of the loaded corpus.
func LoadCounts(_ context.Context, s *Store) (Counts, error) {
	s.db.mu.RLock()
	defer s.db.mu.RUnlock()
	c := Counts{
		Teams: len(s.db.teams), Opponents: len(s.db.opponents),
		Competitions: len(s.db.competitions), Players: len(s.db.players),
		Matches: len(s.db.matches), Goals: len(s.db.goals), Shots: len(s.db.shots),
	}
	for _, st := range s.db.stats {
		if st.Heatmap != nil {
			c.Heatmaps++
		}
	}
	return c, nil
}

// sortMode maps a whitelisted sort name onto the integer the comparator uses.
// This is the entire request-to-ordering surface: the request supplies a name,
// never an expression.
var sortMode = map[string]int{
	model.SortDateAsc:   1,
	model.SortDateDesc:  2,
	model.SortXGAsc:     3,
	model.SortXGDesc:    4,
	model.SortValueDesc: 5,
}

func modeFor(sort string) int {
	if m, ok := sortMode[sort]; ok {
		return m
	}
	return 2 // date_desc
}

// matchModeFor: the xG sort modes are goal-only, so a match list asked to sort
// by xG falls back to newest first, exactly as the SQL did.
func matchModeFor(sort string) int {
	if sort == model.SortDateAsc {
		return 1
	}
	return 2
}

func derefInt32(p *int32) int32 {
	if p == nil {
		return 0
	}
	return *p
}
