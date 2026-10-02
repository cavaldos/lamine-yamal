// Package coord is the single place in the project where pitch coordinates are
// converted. See plan.md §4 — do not inline any of these formulas elsewhere.
package coord

// Pitch geometry constants. Metres. The SVG viewBox is metres * 10.
const (
	PitchLength   = 105.0
	PitchWidth    = 68.0
	ViewBoxWidth  = 1050.0
	ViewBoxHeight = 680.0
)

// Understat01ToPitch converts Understat's normalised 0-1 shot coordinates into
// pitch metres. X is measured from the shooter's own goal line towards the
// opponent goal, Y is measured from the top touchline towards the bottom one.
//
//	pitch_x = X * 105
//	pitch_y = (1 - Y) * 68
//
// The result is top-left origin, left-to-right attacking direction, which is
// what the frontend renders against viewBox 0 0 1050 680.
func Understat01ToPitch(x, y float64) (px, py float64) {
	return x * PitchLength, (1 - y) * PitchWidth
}

// StatsBombToPitch converts StatsBomb's 120x80 origin-own-goal coordinates into
// the project contract (105x68, top-left, left-to-right).
func StatsBombToPitch(x, y float64) (px, py float64) {
	return x * PitchLength / 120, y * PitchWidth / 80
}

// ToSVG scales pitch metres to SVG viewBox units (1 m = 10 units).
func ToSVG(x, y float64) (px, py float64) {
	return x * 10, y * 10
}
