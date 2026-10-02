package coord

import (
	"math"
	"testing"
)

// The golden case from plan.md §4. X=0.995 -> 104.475, Y=0.488 -> 34.816.
// If this fails, every shot marker and heatmap bin in the product is wrong
// without any error being reported anywhere.
func TestUnderstat01ToPitchGolden(t *testing.T) {
	tests := []struct {
		name      string
		x, y      float64
		wantPX    float64
		wantPY    float64
		tolerance float64
	}{
		{"golden verified goal", 0.995, 0.488, 104.475, 34.816, 1e-9},
		{"raw understat payload", 0.995, 0.4879999923706055, 104.475, 34.816, 1e-5},
		{"own goal line, top touchline", 0, 0, 0, 68, 1e-9},
		{"opponent goal line, bottom touchline", 1, 1, 105, 0, 1e-9},
		{"pitch centre", 0.5, 0.5, 52.5, 34, 1e-9},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			px, py := Understat01ToPitch(tt.x, tt.y)
			if math.Abs(px-tt.wantPX) > tt.tolerance {
				t.Errorf("pitch_x = %v, want %v", px, tt.wantPX)
			}
			if math.Abs(py-tt.wantPY) > tt.tolerance {
				t.Errorf("pitch_y = %v, want %v", py, tt.wantPY)
			}
		})
	}
}

// Every shot the ingester can emit must land inside the pitch, otherwise the
// database CHECK constraints (0..105 / 0..68) reject it at seed time.
func TestUnderstat01ToPitchStaysInsidePitch(t *testing.T) {
	for i := 0; i <= 1000; i++ {
		x := float64(i) / 1000
		px, py := Understat01ToPitch(x, x)
		if px < 0 || px > PitchLength {
			t.Fatalf("x=%v -> px=%v outside [0,%v]", x, px, PitchLength)
		}
		if py < 0 || py > PitchWidth {
			t.Fatalf("y=%v -> py=%v outside [0,%v]", x, py, PitchWidth)
		}
	}
}

func TestStatsBombToPitchGolden(t *testing.T) {
	// A penalty spot: 12 yards out, centre of goal, on a 120x80 pitch.
	px, py := StatsBombToPitch(108, 40)
	if math.Abs(px-94.5) > 1e-9 {
		t.Errorf("pitch_x = %v, want 94.5", px)
	}
	if math.Abs(py-34) > 1e-9 {
		t.Errorf("pitch_y = %v, want 34", py)
	}
}

func TestToSVG(t *testing.T) {
	px, py := ToSVG(104.475, 34.816)
	if px != 1044.75 || py != 348.16 {
		t.Errorf("svg = (%v, %v), want (1044.75, 348.16)", px, py)
	}
}
