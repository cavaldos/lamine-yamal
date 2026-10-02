package model

// List is the envelope for every paginated collection endpoint (§8.3).
type List[T any] struct {
	Items []T   `json:"items"`
	Total int64 `json:"total"`
}

// HeatmapResponse is the payload of GET /api/v1/heatmap. Grid holds the occupied
// bins only; nx/ny/cell size are the constants in internal/coord (24x16 over
// 105x68 m => 4.375 m x 4.25 m per cell) and are documented in openapi.yaml.
type HeatmapResponse struct {
	Grid       []HeatmapBin `json:"grid"`
	TotalGoals int64        `json:"total_goals"`
	Matches    int64        `json:"matches"`
}

// CountBucket is one entry of a summary rollup. Key is the dimension value
// (competition code, season, goal type, opponent name); ID and Name are present
// when the dimension has a row behind it. The shape mirrors CountBucket in
// openapi.yaml.
type CountBucket struct {
	Key   string `json:"key"`
	ID    *int64 `json:"id,omitempty"`
	Name  string `json:"name,omitempty"`
	Count int64  `json:"count"`
}

// MinuteBucket is one bar of the goals-by-minute histogram.
type MinuteBucket struct {
	Minute int32 `json:"minute"`
	Count  int64 `json:"count"`
}

// SummaryResponse is the payload of GET /api/v1/summary (plan.md §7.3).
type SummaryResponse struct {
	Goals         int64          `json:"goals"`
	Assists       int64          `json:"assists"`
	Minutes       []MinuteBucket `json:"minutes"`
	ByCompetition []CountBucket  `json:"by_competition"`
	BySeason      []CountBucket  `json:"by_season"`
	ByType        []CountBucket  `json:"by_type"`
	ByOpponent    []CountBucket  `json:"by_opponent"`
}

// Health is the payload of GET /healthz.
type Health struct {
	Status string `json:"status"`
	DB     string `json:"db"`
}
