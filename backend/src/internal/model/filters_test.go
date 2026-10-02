package model

import (
	"errors"
	"net/url"
	"strings"
	"testing"
	"time"
)

func TestParseGoalFilter(t *testing.T) {
	tests := []struct {
		name   string
		query  string
		want   GoalFilter
		errIs  error
		checks func(*testing.T, GoalFilter)
	}{
		{
			name:  "empty query gets the default sort and page size",
			query: "",
			want:  GoalFilter{Sort: SortDateDesc, Limit: 24},
		},
		{
			name:  "unknown parameters are ignored, not errors",
			query: "?nonsense=1&limit=5",
			want:  GoalFilter{Sort: SortDateDesc, Limit: 5},
		},
		{
			name:  "sort outside the whitelist is rejected",
			query: "?sort=DROP+TABLE",
			errIs: ErrInvalidFilter,
		},
		{
			name:  "non-integer id is rejected",
			query: "?competition_id=abc",
			errIs: ErrInvalidFilter,
		},
		{
			name:  "negative offset is rejected",
			query: "?offset=-1",
			errIs: ErrInvalidFilter,
		},
		{
			name:  "malformed date is rejected",
			query: "?date_from=08-10-2023",
			errIs: ErrInvalidFilter,
		},
		{
			name:  "limit is clamped to the maximum",
			query: "?limit=99999",
			want:  GoalFilter{Sort: SortDateDesc, Limit: 200},
		},
		{
			name:  "limit=0 falls back to the default",
			query: "?limit=0",
			want:  GoalFilter{Sort: SortDateDesc, Limit: 24},
		},
		{
			name:  "season is taken verbatim, slashes included",
			query: "?season=2023%2F2024",
			want:  GoalFilter{Sort: SortDateDesc, Limit: 24},
			checks: func(t *testing.T, f GoalFilter) {
				if f.Season == nil || *f.Season != "2023/2024" {
					t.Errorf("season = %v, want 2023/2024", f.Season)
				}
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ParseGoalFilter(url.Values(mustQuery(tt.query)))
			if tt.errIs != nil {
				if !errors.Is(err, tt.errIs) {
					t.Fatalf("err = %v, want %v", err, tt.errIs)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got.Sort != tt.want.Sort {
				t.Errorf("Sort = %q, want %q", got.Sort, tt.want.Sort)
			}
			if got.Limit != tt.want.Limit {
				t.Errorf("Limit = %d, want %d", got.Limit, tt.want.Limit)
			}
			if tt.checks != nil {
				tt.checks(t, got)
			}
		})
	}
}

// mustQuery parses "a=b&c=d" into url.Values without a *testing.T, so the table
// above stays readable. A leading "?" is tolerated because it reads naturally in
// the table, but url.ParseQuery would otherwise treat it as part of the first key.
func mustQuery(q string) map[string][]string {
	v, err := url.ParseQuery(strings.TrimPrefix(q, "?"))
	if err != nil {
		panic(err)
	}
	return v
}

func TestParseGoalFilterDateRange(t *testing.T) {
	f, err := ParseGoalFilter(url.Values(mustQuery("date_from=2023-10-08&date_to=2023-10-08")))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if f.DateFrom == nil || !f.DateFrom.Equal(time.Date(2023, 10, 8, 0, 0, 0, 0, time.UTC)) {
		t.Errorf("DateFrom = %v", f.DateFrom)
	}
	if f.DateTo == nil || !f.DateTo.Equal(time.Date(2023, 10, 8, 0, 0, 0, 0, time.UTC)) {
		t.Errorf("DateTo = %v", f.DateTo)
	}
}

func TestParseHeatmapFilterClearsPagination(t *testing.T) {
	// Aggregation returns the whole set; limit/offset would silently truncate it.
	f, err := ParseHeatmapFilter(url.Values(mustQuery("limit=5&offset=10")))
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if f.Limit != 0 || f.Offset != 0 {
		t.Errorf("Limit/Offset = %d/%d, want 0/0", f.Limit, f.Offset)
	}
}
