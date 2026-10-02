package model

// Patch structs are the PATCH request bodies: every field is a pointer, so
// "absent" and "present but zero" are distinguishable. The generated UPDATE
// statements are COALESCE(arg, column), so a nil pointer leaves the column
// alone. Documented limitation: PATCH cannot null a column out in v1 — clearing
// a value means omitting it from the fixture, not from the API.

// PlayerPatch is a partial update of a player.
type PlayerPatch struct {
	FullName       *string `json:"full_name"`
	TeamID         *int64  `json:"team_id"`
	ShirtNumber    *int32  `json:"shirt_number"`
	Position       *string `json:"position"`
	BirthDate      *string `json:"birth_date"`
	Nationality    *string `json:"nationality"`
	SourcePlayerID *string `json:"source_player_id"`
}

// TeamPatch is a partial update of a team.
type TeamPatch struct {
	Name      *string `json:"name"`
	ShortName *string `json:"short_name"`
	Country   *string `json:"country"`
	LogoURL   *string `json:"logo_url"`
}

// CompetitionPatch is a partial update of a competition.
type CompetitionPatch struct {
	Name     *string `json:"name"`
	Code     *string `json:"code"`
	Country  *string `json:"country"`
	LogoURL  *string `json:"logo_url"`
	Priority *int32  `json:"priority"`
}

// OpponentPatch is a partial update of an opponent.
type OpponentPatch struct {
	Name    *string `json:"name"`
	TeamID  *int64  `json:"team_id"`
	LogoURL *string `json:"logo_url"`
}

// MatchPatch is a partial update of a match. played_at is a pointer to a
// pointer-free time value; omit it to leave the timestamp untouched.
type MatchPatch struct {
	CompetitionID *int64  `json:"competition_id"`
	OpponentID    *int64  `json:"opponent_id"`
	Season        *string `json:"season"`
	PlayedAt      *string `json:"played_at"`
	IsHome        *bool   `json:"is_home"`
	ScoreFor      *int32  `json:"score_for"`
	ScoreAgainst  *int32  `json:"score_against"`
	Venue         *string `json:"venue"`
	Referee       *string `json:"referee"`
	Attendance    *int32  `json:"attendance"`
	SourceMatchID *string `json:"source_match_id"`
	VideoURL      *string `json:"video_url"`
}

// GoalPatch is a partial update of a goal. Location fields are pitch metres on
// the 105x68 pitch; the database CHECK constraints reject anything outside.
type GoalPatch struct {
	Minute           *int32   `json:"minute"`
	AddedMinute      *int32   `json:"added_minute"`
	GoalType         *string  `json:"goal_type"`
	BodyPart         *string  `json:"body_part"`
	AssistName       *string  `json:"assist_name"`
	AssistPlayerID   *int64   `json:"assist_player_id"`
	XG               *float64 `json:"xg"`
	XGOT             *float64 `json:"xgot"`
	LocationX        *float64 `json:"location_x"`
	LocationY        *float64 `json:"location_y"`
	DistanceToGoalM  *float64 `json:"distance_to_goal_m"`
	PreviousAction   *string  `json:"previous_action"`
	PlayPattern      *string  `json:"play_pattern"`
	SeasonGoalNumber *int32   `json:"season_goal_number"`
	CareerGoalNumber *int32   `json:"career_goal_number"`
	VideoURL         *string  `json:"video_url"`
	SourceGoalID     *string  `json:"source_goal_id"`
}
