package term

import (
	"net/http"
	"testing"
)

// A 500 must never be visually indistinguishable from a 200, so the status
// classification is worth pinning down.
func TestStatusClass(t *testing.T) {
	tests := []struct {
		status int
		icon   string
	}{
		{200, Green("✓")},
		{201, Green("✓")},
		{204, Green("✓")},
		{301, Cyan("→")},
		{304, Cyan("→")},
		{400, Yellow("⚠")},
		{401, Yellow("⚠")},
		{404, Yellow("⚠")},
		{409, Yellow("⚠")},
		{500, Red("✗")},
		{503, Red("✗")},
	}
	for _, tt := range tests {
		t.Run(http.StatusText(tt.status), func(t *testing.T) {
			if got := statusIcon(tt.status); got != tt.icon {
				t.Errorf("statusIcon(%d) = %q, want %q", tt.status, got, tt.icon)
			}
		})
	}
}

func TestFormatBytes(t *testing.T) {
	tests := []struct {
		in   int
		want string
	}{
		{0, "0B"},
		{512, "512B"},
		{2048, "2.0KB"},
		{43 * 1024, "43.0KB"},
		{2 * 1024 * 1024, "2.0MB"},
	}
	for _, tt := range tests {
		if got := formatBytes(tt.in); got != tt.want {
			t.Errorf("formatBytes(%d) = %q, want %q", tt.in, got, tt.want)
		}
	}
}

func TestPad(t *testing.T) {
	if got := pad("GET", 6); got != "GET   " {
		t.Errorf("pad(GET,6) = %q", got)
	}
	// Longer input is left alone rather than truncated.
	if got := pad("OPTIONS", 4); got != "OPTIONS" {
		t.Errorf("pad(OPTIONS,4) = %q", got)
	}
}
