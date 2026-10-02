package model

// The fixture structs below are the v1 contract from plan.md §7.2. They are
// shared by exactly two callers: tools/ingest writes them, internal/seed reads
// them. They are intentionally NOT the API structs — the fixture keeps source
// shaped fields (source_match_id, career_goal_number, round) that the database
// normalises away.

const (
	// SchemaVersion is the v1 fixture contract version.
	SchemaVersion = "1.0.0"
	// SourceMock is the mandatory provenance badge for every fixture record
	// (plan.md §7.1 item 5).
	SourceMock = "mock"
	// DemoVideoURL is the placeholder video used by every goal in v1.
	DemoVideoURL = "https://www.youtube.com/watch?v=k_q9v_WJJnQ"
	// PlayerFixtureID is the single tracked player in v1.
	PlayerFixtureID = "lamine-yamal"
	// UnderstatPlayerID is the Understat id of Lamine Yamal.
	UnderstatPlayerID = "11527"
	// CompetitionLaLiga is the only competition Understat covers.
	CompetitionLaLiga = "la-liga"
)

// Fixture is the whole of data/seed/lamine-yamal.json.
type Fixture struct {
	SchemaVersion    string                 `json:"schema_version"`
	Source           string                 `json:"source"`
	Provenance       Provenance             `json:"provenance"`
	CoordinateSystem CoordinateSystem       `json:"coordinate_system"`
	Player           FixturePlayer          `json:"player"`
	Teams            map[string]FixtureTeam `json:"teams"`
	Competitions     map[string]FixtureComp `json:"competitions"`
	Matches          []FixtureMatch         `json:"matches"`
	MatchStats       []FixtureMatchStat     `json:"match_stats"`
	Goals            []FixtureGoal          `json:"goals"`
	Shots            []FixtureShot          `json:"shots"`
	Heatmaps         []Heatmap              `json:"heatmaps"`
}

// Provenance records where the corpus came from and under what licence.
type Provenance struct {
	Origin    string `json:"origin"`
	FetchedAt string `json:"fetched_at"`
	PlayerID  string `json:"player_id"`
	License   string `json:"license"`
}

// CoordinateSystem pins the contract from plan.md §4. Changing any value here
// without changing the frontend viewBox breaks every marker.
type CoordinateSystem struct {
	Pitch   []float64 `json:"pitch"`
	Origin  string    `json:"origin"`
	Axis    string    `json:"axis"`
	ViewBox []float64 `json:"viewbox"`
}

type FixturePlayer struct {
	ID               string `json:"id"`
	SourcePlayerID   string `json:"source_player_id"`
	Name             string `json:"name"`
	TeamID           string `json:"team_id"`
	ShirtNumber      int    `json:"shirt_number"`
	Position         string `json:"position"`
	FavoritePosition string `json:"favorite_position"`
	Nationality      string `json:"nationality"`
	BirthDate        string `json:"birth_date"`
}

type FixtureTeam struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	ShortName string `json:"short_name"`
	LogoURL   string `json:"logo_url"`
}

type FixtureComp struct {
	ID      string `json:"id"`
	Name    string `json:"name"`
	Country string `json:"country"`
	Tier    int    `json:"tier"`
	LogoURL string `json:"logo_url"`
}

// FixtureMatch keeps home/away from the neutral fixture point of view; the
// ingester already resolved which side the player was on.
type FixtureMatch struct {
	ID                  string  `json:"id"`
	SourceMatchID       string  `json:"source_match_id"`
	Date                string  `json:"date"`
	CompetitionID       string  `json:"competition_id"`
	Season              string  `json:"season"`
	Round               *int    `json:"round"`
	Venue               *string `json:"venue"`
	Attendance          *int    `json:"attendance"`
	HomeTeamID          string  `json:"home_team_id"`
	AwayTeamID          string  `json:"away_team_id"`
	HomeScore           int     `json:"home_score"`
	AwayScore           int     `json:"away_score"`
	ScoreDisplay        string  `json:"score_display"`
	Status              string  `json:"status"`
	IsHome              bool    `json:"is_home"`
	PlayerSide          string  `json:"player_side"`
	PlayerMinutesPlayed int     `json:"player_minutes_played"`
	PlayerPosition      string  `json:"player_position"`
	Referee             *string `json:"referee"`
}

type FixtureMatchStat struct {
	MatchID        string  `json:"match_id"`
	IsStarting     bool    `json:"is_starting"`
	PositionPlayed string  `json:"position_played"`
	MinutesPlayed  int     `json:"minutes_played"`
	Goals          int     `json:"goals"`
	Assists        int     `json:"assists"`
	Shots          int     `json:"shots"`
	ShotsOnTarget  int     `json:"shots_on_target"`
	XG             float64 `json:"xg"`
	NPXG           float64 `json:"npxg"`
	XA             float64 `json:"xa"`
	KeyPasses      int     `json:"key_passes"`
	XGChain        float64 `json:"xg_chain"`
	XGBuildup      float64 `json:"xg_buildup"`
}

// FixtureGoal is the richest record in the corpus. Fields that Understat cannot
// supply are pointers and stay null rather than being invented.
type FixtureGoal struct {
	ID                 string   `json:"id"`
	MatchID            string   `json:"match_id"`
	SourceGoalID       string   `json:"source_goal_id"`
	Minute             int      `json:"minute"`
	AddedMinute        *int     `json:"added_minute"`
	MinuteDisplay      string   `json:"minute_display"`
	StoppageTime       bool     `json:"stoppage_time"`
	Period             int      `json:"period"`
	ElapsedSeconds     int      `json:"elapsed_seconds"`
	GoalType           string   `json:"goal_type"`
	GoalTypeDisplay    string   `json:"goal_type_display"`
	IsPenalty          bool     `json:"is_penalty"`
	IsHeader           bool     `json:"is_header"`
	IsFreeKick         bool     `json:"is_free_kick"`
	BodyPart           string   `json:"body_part"`
	BodyPartDisplay    string   `json:"body_part_display"`
	XG                 float64  `json:"xg"`
	XGOT               *float64 `json:"xgot"`
	IsBigChance        *bool    `json:"is_big_chance"`
	X                  float64  `json:"x"`
	Y                  float64  `json:"y"`
	DistanceToGoalM    float64  `json:"distance_to_goal_m"`
	AttackingDirection string   `json:"attacking_direction"`
	AssistName         *string  `json:"assist_name"`
	AssistID           *string  `json:"assist_id"`
	PreviousAction     *string  `json:"previous_action"`
	PlayPattern        *string  `json:"play_pattern"`
	OpponentTeamID     string   `json:"opponent_team_id"`
	CompetitionID      string   `json:"competition_id"`
	Season             string   `json:"season"`
	IsHome             bool     `json:"is_home"`
	Venue              *string  `json:"venue"`
	ScoreHomeAfter     *int     `json:"score_home_after"`
	ScoreAwayAfter     *int     `json:"score_away_after"`
	ScoreDisplayAfter  *string  `json:"score_display_after"`
	VideoURL           string   `json:"video_url"`
	SeasonGoalNumber   int      `json:"season_goal_number"`
	CareerGoalNumber   *int     `json:"career_goal_number"`
}

type FixtureShot struct {
	ID         string  `json:"id"`
	MatchID    string  `json:"match_id"`
	Minute     *int    `json:"minute"`
	Outcome    string  `json:"outcome"`
	XG         float64 `json:"xg"`
	X          float64 `json:"x"`
	Y          float64 `json:"y"`
	BodyPart   string  `json:"body_part"`
	Situation  string  `json:"situation"`
	LastAction *string `json:"last_action"`
	AssistName *string `json:"assist_name"`
}
