// Package model holds the API-facing structs. Field names and json tags mirror
// the DDL in plan.md §8.4 exactly — do not rename anything here.
package model

import "time"

// Player mirrors the players table.
type Player struct {
	ID             int64     `json:"id"`
	FullName       string    `json:"full_name"`
	TeamID         *int64    `json:"team_id"`
	ShirtNumber    *int32    `json:"shirt_number"`
	Position       *string   `json:"position"`
	BirthDate      *string   `json:"birth_date"`
	Nationality    *string   `json:"nationality"`
	SourcePlayerID *string   `json:"source_player_id"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// Team mirrors the teams table.
type Team struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	ShortName *string   `json:"short_name"`
	Country   *string   `json:"country"`
	LogoURL   *string   `json:"logo_url"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Competition mirrors the competitions table.
type Competition struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Code      string    `json:"code"`
	Country   *string   `json:"country"`
	LogoURL   *string   `json:"logo_url"`
	Priority  int32     `json:"priority"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Opponent mirrors the opponents table.
type Opponent struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	TeamID    *int64    `json:"team_id"`
	LogoURL   *string   `json:"logo_url"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// Match mirrors the matches table. score_for/score_against are always from the
// tracked player's point of view; is_home tells the frontend whether to mirror
// the pitch.
type Match struct {
	ID            int64     `json:"id"`
	CompetitionID int64     `json:"competition_id"`
	OpponentID    int64     `json:"opponent_id"`
	Season        *string   `json:"season"`
	PlayedAt      time.Time `json:"played_at"`
	IsHome        bool      `json:"is_home"`
	ScoreFor      *int32    `json:"score_for"`
	ScoreAgainst  *int32    `json:"score_against"`
	Venue         *string   `json:"venue"`
	Referee       *string   `json:"referee"`
	Attendance    *int32    `json:"attendance"`
	SourceMatchID *string   `json:"source_match_id"`
	VideoURL      *string   `json:"video_url"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

// Goal mirrors the goals table. Location is always pitch metres on a 105x68
// pitch, top-left origin, left-to-right attacking direction (plan.md §4).
type Goal struct {
	ID               int64     `json:"id"`
	MatchID          int64     `json:"match_id"`
	Minute           int32     `json:"minute"`
	AddedMinute      *int32    `json:"added_minute"`
	GoalType         string    `json:"goal_type"`
	BodyPart         *string   `json:"body_part"`
	AssistName       *string   `json:"assist_name"`
	AssistPlayerID   *int64    `json:"assist_player_id"`
	XG               *float64  `json:"xg"`
	XGOT             *float64  `json:"xgot"`
	LocationX        *float64  `json:"location_x"`
	LocationY        *float64  `json:"location_y"`
	DistanceToGoalM  *float64  `json:"distance_to_goal_m"`
	PreviousAction   *string   `json:"previous_action"`
	PlayPattern      *string   `json:"play_pattern"`
	SeasonGoalNumber *int32    `json:"season_goal_number"`
	CareerGoalNumber *int32    `json:"career_goal_number"`
	VideoURL         *string   `json:"video_url"`
	SourceGoalID     *string   `json:"source_goal_id"`
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
}

// Shot mirrors the shots table. Outcome is the raw Understat result
// (Goal, MissedShots, BlockedShot, SavedShot, ShotOnPost).
type Shot struct {
	ID           int64     `json:"id"`
	MatchID      int64     `json:"match_id"`
	PlayerID     int64     `json:"player_id"`
	Minute       *int32    `json:"minute"`
	Outcome      *string   `json:"outcome"`
	XG           *float64  `json:"xg"`
	LocationX    *float64  `json:"location_x"`
	LocationY    *float64  `json:"location_y"`
	BodyPart     *string   `json:"body_part"`
	Situation    *string   `json:"situation"`
	LastAction   *string   `json:"last_action"`
	AssistName   *string   `json:"assist_name"`
	SourceShotID *string   `json:"source_shot_id"`
	CreatedAt    time.Time `json:"created_at"`
}
