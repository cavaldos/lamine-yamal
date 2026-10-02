package store

import (
	"errors"
	"fmt"
	"sort"
	"strings"

	"github.com/lamine/backend/src/internal/model"
)

// Sentinel errors. The handler layer turns these into RFC 9457 problem
// responses; nothing above the store needs to know how they arose.
var (
	ErrNotFound = errors.New("not found")
	ErrConflict = errors.New("conflict")
	ErrBadInput = errors.New("bad input")
)

// notFoundf takes a plain description of what was missing. Call sites that need
// to add an id use fmt.Errorf with ErrNotFound directly.
func notFoundf(what string) error {
	return fmt.Errorf("%w: %s", ErrNotFound, what)
}

func conflictf(format string, args ...any) error {
	return fmt.Errorf("%w: %s", ErrConflict, fmt.Sprintf(format, args...))
}

func errBadInput(format string, args ...any) error {
	return fmt.Errorf("%w: %s", ErrBadInput, fmt.Sprintf(format, args...))
}

// The CHECK constraints from the old schema are enforced here instead, since
// there is no longer a database to enforce them.

var validGoalType = map[string]bool{
	"open_play": true, "penalty": true, "free_kick": true,
	"header": true, "counter": true, "own_goal": true,
}

var validBodyPart = map[string]bool{
	"left_foot": true, "right_foot": true, "head": true, "other": true,
}

func checkGoal(g *model.Goal) error {
	if g.Minute < 0 || g.Minute > 130 {
		return errBadInput("minute must be between 0 and 130")
	}
	if !validGoalType[g.GoalType] {
		return errBadInput("goal_type %q is not one of %s", g.GoalType, keyList(validGoalType))
	}
	if g.BodyPart != nil && *g.BodyPart != "" && !validBodyPart[*g.BodyPart] {
		return errBadInput("body_part %q is not one of %s", *g.BodyPart, keyList(validBodyPart))
	}
	// The pitch is always 105 x 68 m with a top-left origin.
	if g.LocationX != nil && (*g.LocationX < 0 || *g.LocationX > 105) {
		return errBadInput("location_x must be between 0 and 105 metres")
	}
	if g.LocationY != nil && (*g.LocationY < 0 || *g.LocationY > 68) {
		return errBadInput("location_y must be between 0 and 68 metres")
	}
	return nil
}

func keyList(m map[string]bool) string {
	keys := make([]string, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	return strings.Join(keys, ", ")
}
