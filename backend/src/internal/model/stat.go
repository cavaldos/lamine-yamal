package model

import "time"

// Heatmap is the jsonb payload stored on match_stats.heatmap (plan.md §7.2).
// Synthetic is always true for v1: Understat has no tracking data (plan.md §11
// risk 6), so a synthetic heatmap must never be presented as tracking data.
type Heatmap struct {
	MatchID   int64        `json:"match_id"`
	Synthetic bool         `json:"synthetic"`
	Grid      HeatmapGrid  `json:"grid"`
	Bins      []HeatmapBin `json:"bins"`
	Totals    HeatmapTotal `json:"totals"`
}

// HeatmapGrid describes the bin layout. v1 uses 24x16 bins over 105x68 m, which
// is 5.0 m per cell in both axes.
type HeatmapGrid struct {
	NX     int     `json:"nx"`
	NY     int     `json:"ny"`
	CellW  float64 `json:"cell_w"`
	CellH  float64 `json:"cell_h"`
	Origin string  `json:"origin"`
}

// HeatmapBin is one occupied cell. x/y is the cell centre in pitch metres.
type HeatmapBin struct {
	IX    int     `json:"ix"`
	IY    int     `json:"iy"`
	X     float64 `json:"x"`
	Y     float64 `json:"y"`
	Count int64   `json:"count"`
}

// HeatmapTotal carries the summary numbers the UI shows above the pitch.
type HeatmapTotal struct {
	Events      int64 `json:"events"`
	Touches     int64 `json:"touches"`
	DurationS   int64 `json:"duration_s"`
	MaxBinCount int64 `json:"max_bin_count"`
}

// MatchStat mirrors the match_stats table. Heatmap is NULL for matches where we
// have no tracking data; the UI must render an empty state, not zeros.
type MatchStat struct {
	ID             int64     `json:"id"`
	MatchID        int64     `json:"match_id"`
	PlayerID       int64     `json:"player_id"`
	IsStarting     *bool     `json:"is_starting"`
	PositionPlayed *string   `json:"position_played"`
	MinutesPlayed  *int32    `json:"minutes_played"`
	Goals          int32     `json:"goals"`
	Assists        int32     `json:"assists"`
	Shots          int32     `json:"shots"`
	ShotsOnTarget  int32     `json:"shots_on_target"`
	XG             *float64  `json:"xg"`
	NPXG           *float64  `json:"npxg"`
	XA             *float64  `json:"xa"`
	KeyPasses      int32     `json:"key_passes"`
	XGChain        *float64  `json:"xg_chain"`
	XGBuildup      *float64  `json:"xg_buildup"`
	Rating         *float64  `json:"rating"`
	Heatmap        *Heatmap  `json:"heatmap"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}
