package store

import "testing"

// seasonMatches guards the one filter the season links depend on. The stored
// form is the full "2025/2026"; URLs and the UI carry the short "2025". An
// exact compare returns zero rows for every season link, which is invisible in
// a smoke test and looks like "no data for this season" in the UI.
func TestSeasonMatches(t *testing.T) {
	stored := "2025/2026"

	cases := []struct {
		name  string
		want  *string
		match bool
	}{
		{"no filter", nil, true},
		{"short form", strPtr("2025"), true},
		{"full form", strPtr("2025/2026"), true},
		{"other short year", strPtr("2024"), false},
		{"other full season", strPtr("2024/2025"), false},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := seasonMatches(&stored, c.want); got != c.match {
				t.Errorf("seasonMatches(%q, %q) = %v, want %v", stored, deref(c.want), got, c.match)
			}
		})
	}

	if seasonMatches(nil, strPtr("2025")) {
		t.Error("a match with no season must not match any filter")
	}
}
