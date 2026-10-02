package model

import (
	"errors"
	"fmt"
	"net/url"
	"strconv"
	"time"
)

// ErrInvalidFilter wraps every query-string rejection. The handler turns it
// into a 400; anything else reaching it is a bug.
var ErrInvalidFilter = errors.New("invalid filter")

// Sort modes for /goals and /matches. This is the whitelist: the store only
// ever picks one of these named static queries, so request input can never
// reach the SQL text (plan.md §8.3, risk 4).
const (
	SortDateAsc   = "date_asc"
	SortDateDesc  = "date_desc"
	SortXGAsc     = "xg_asc"
	SortXGDesc    = "xg_desc"
	SortValueDesc = "value_desc"
)

var sortWhitelist = map[string]bool{
	SortDateAsc: true, SortDateDesc: true,
	SortXGAsc: true, SortXGDesc: true, SortValueDesc: true,
}

const (
	defaultLimit = 24
	maxLimit     = 200
)

// GoalFilter is the whitelisted filter set for GET /api/v1/goals. Every field
// maps to one nullable predicate in a static SQL statement.
type GoalFilter struct {
	CompetitionID *int64
	Season        *string
	OpponentID    *int64
	MatchID       *int64
	GoalType      *string
	BodyPart      *string
	IsHome        *bool
	DateFrom      *time.Time
	DateTo        *time.Time
	Sort          string
	Limit         int32
	Offset        int32
}

// ParseGoalFilter reads the query string. Unknown parameters are ignored on
// purpose: only the whitelist below is ever honoured.
func ParseGoalFilter(q url.Values) (GoalFilter, error) {
	f := GoalFilter{Sort: SortDateDesc, Limit: defaultLimit}
	var err error
	if f.CompetitionID, err = optInt64(q, "competition_id"); err != nil {
		return f, err
	}
	if f.OpponentID, err = optInt64(q, "opponent_id"); err != nil {
		return f, err
	}
	if f.MatchID, err = optInt64(q, "match_id"); err != nil {
		return f, err
	}
	if f.Season, err = optString(q, "season"); err != nil {
		return f, err
	}
	if f.GoalType, err = optString(q, "goal_type"); err != nil {
		return f, err
	}
	if f.BodyPart, err = optString(q, "body_part"); err != nil {
		return f, err
	}
	if f.IsHome, err = optBool(q, "is_home"); err != nil {
		return f, err
	}
	if f.DateFrom, err = optDate(q, "date_from"); err != nil {
		return f, err
	}
	if f.DateTo, err = optDate(q, "date_to"); err != nil {
		return f, err
	}
	if s := q.Get("sort"); s != "" {
		if !sortWhitelist[s] {
			return f, fmt.Errorf("%w: invalid sort %q", ErrInvalidFilter, s)
		}
		f.Sort = s
	}
	if f.Limit, err = optLimit(q); err != nil {
		return f, err
	}
	if f.Offset, err = optInt32(q, "offset"); err != nil {
		return f, err
	}
	return f, nil
}

// MatchFilter is the whitelisted filter set for GET /api/v1/matches.
type MatchFilter struct {
	CompetitionID *int64
	OpponentID    *int64
	Season        *string
	DateFrom      *time.Time
	DateTo        *time.Time
	Sort          string
	Limit         int32
	Offset        int32
}

func ParseMatchFilter(q url.Values) (MatchFilter, error) {
	f := MatchFilter{Sort: SortDateDesc, Limit: defaultLimit}
	var err error
	if f.CompetitionID, err = optInt64(q, "competition_id"); err != nil {
		return f, err
	}
	if f.OpponentID, err = optInt64(q, "opponent_id"); err != nil {
		return f, err
	}
	if f.Season, err = optString(q, "season"); err != nil {
		return f, err
	}
	if f.DateFrom, err = optDate(q, "date_from"); err != nil {
		return f, err
	}
	if f.DateTo, err = optDate(q, "date_to"); err != nil {
		return f, err
	}
	if s := q.Get("sort"); s != "" {
		if !sortWhitelist[s] {
			return f, fmt.Errorf("%w: invalid sort %q", ErrInvalidFilter, s)
		}
		f.Sort = s
	}
	if f.Limit, err = optLimit(q); err != nil {
		return f, err
	}
	if f.Offset, err = optInt32(q, "offset"); err != nil {
		return f, err
	}
	return f, nil
}

// HeatmapFilter reuses the goal filters: /api/v1/heatmap accepts the same set.
type HeatmapFilter = GoalFilter

func ParseHeatmapFilter(q url.Values) (HeatmapFilter, error) {
	f, err := ParseGoalFilter(q)
	if err != nil {
		return f, err
	}
	// Aggregation returns the whole set; pagination is meaningless here.
	f.Limit, f.Offset = 0, 0
	return f, nil
}

func optString(q url.Values, key string) (*string, error) {
	v := q.Get(key)
	if v == "" {
		return nil, nil
	}
	return &v, nil
}

func optInt64(q url.Values, key string) (*int64, error) {
	v := q.Get(key)
	if v == "" {
		return nil, nil
	}
	n, err := strconv.ParseInt(v, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("%w: invalid %s: %s", ErrInvalidFilter, key, err)
	}
	return &n, nil
}

func optInt32(q url.Values, key string) (int32, error) {
	v := q.Get(key)
	if v == "" {
		return 0, nil
	}
	n, err := strconv.ParseInt(v, 10, 32)
	if err != nil || n < 0 {
		return 0, fmt.Errorf("%w: invalid %s: %q", ErrInvalidFilter, key, v)
	}
	return int32(n), nil
}

func optBool(q url.Values, key string) (*bool, error) {
	v := q.Get(key)
	if v == "" {
		return nil, nil
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		return nil, fmt.Errorf("%w: invalid %s: %s", ErrInvalidFilter, key, err)
	}
	return &b, nil
}

func optDate(q url.Values, key string) (*time.Time, error) {
	v := q.Get(key)
	if v == "" {
		return nil, nil
	}
	t, err := time.Parse("2006-01-02", v)
	if err != nil {
		return nil, fmt.Errorf("%w: invalid %s: %q, want YYYY-MM-DD", ErrInvalidFilter, key, v)
	}
	return &t, nil
}

func optLimit(q url.Values) (int32, error) {
	n, err := optInt32(q, "limit")
	if err != nil {
		return 0, err
	}
	if n == 0 {
		return defaultLimit, nil
	}
	if n > maxLimit {
		return maxLimit, nil
	}
	return n, nil
}
