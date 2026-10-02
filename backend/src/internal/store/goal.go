package store

import (
	"context"

	"github.com/lamine/backend/src/internal/model"
)

// Goals are writable. Their ids are append-only (next id = current length + 1),
// so creating a goal never renumbers an existing one and the ids the frontend
// already holds stay valid.

func (s *Store) ListGoals(_ context.Context, f model.GoalFilter) (model.List[model.Goal], error) {
	s.db.mu.RLock()
	defer s.db.mu.RUnlock()

	rows := s.db.selectGoals(f)
	sortGoals(rows, modeFor(f.Sort))
	page := paginate(rows, f.Limit, f.Offset)

	items := make([]model.Goal, 0, len(page))
	for _, r := range page {
		items = append(items, *r.g)
	}
	return model.List[model.Goal]{Items: items, Total: int64(len(rows))}, nil
}

func (s *Store) GetGoal(_ context.Context, id int64) (model.Goal, error) {
	s.db.mu.RLock()
	defer s.db.mu.RUnlock()
	if g, ok := s.db.goalByID[id]; ok {
		return *g, nil
	}
	return model.Goal{}, notFoundf("goal")
}

// GoalDetail is the expanded goal payload from GET /api/v1/goals/{id}.
type GoalDetail struct {
	model.Goal
	Match       model.Match       `json:"match"`
	Competition model.Competition `json:"competition"`
	Opponent    model.Opponent    `json:"opponent"`
	PrevGoal    *model.Goal       `json:"prevGoal"`
	NextGoal    *model.Goal       `json:"nextGoal"`
}

func (s *Store) GetGoalDetail(_ context.Context, id int64) (GoalDetail, error) {
	s.db.mu.RLock()
	defer s.db.mu.RUnlock()

	g, ok := s.db.goalByID[id]
	if !ok {
		return GoalDetail{}, notFoundf("goal")
	}
	d := GoalDetail{Goal: *g}
	m, ok := s.db.matchByID[g.MatchID]
	if !ok {
		return GoalDetail{}, notFoundf("match for goal")
	}
	d.Match = *m
	if c, ok := s.db.compByID[m.CompetitionID]; ok {
		d.Competition = *c
	}
	if o, ok := s.db.oppByID[m.OpponentID]; ok {
		d.Opponent = *o
	}
	d.PrevGoal, d.NextGoal = s.db.neighbours(g)
	return d, nil
}

// neighbours returns the adjacent goals in career order — the tuple
// (played_at, match_id, minute, id) — which is what the detail page's
// prev/next navigation needs.
func (d *DB) neighbours(g *model.Goal) (prev, next *model.Goal) {
	if _, ok := d.matchByID[g.MatchID]; !ok {
		return nil, nil
	}
	less := func(a *model.Goal, b *model.Goal) bool {
		am, bm := d.matchByID[a.MatchID], d.matchByID[b.MatchID]
		if am == nil || bm == nil {
			return false
		}
		if !am.PlayedAt.Equal(bm.PlayedAt) {
			return am.PlayedAt.Before(bm.PlayedAt)
		}
		if a.MatchID != b.MatchID {
			return a.MatchID < b.MatchID
		}
		if a.Minute != b.Minute {
			return a.Minute < b.Minute
		}
		return a.ID < b.ID
	}
	// closest goal strictly before g
	var bestPrev *model.Goal
	for _, c := range d.goals {
		if c.ID == g.ID || !less(c, g) {
			continue
		}
		if bestPrev == nil || less(bestPrev, c) {
			bestPrev = c
		}
	}
	var bestNext *model.Goal
	for _, c := range d.goals {
		if c.ID == g.ID || !less(g, c) {
			continue
		}
		if bestNext == nil || less(c, bestNext) {
			bestNext = c
		}
	}
	return bestPrev, bestNext
}

func (s *Store) CreateGoal(_ context.Context, g model.Goal) (model.Goal, error) {
	if g.MatchID == 0 {
		return model.Goal{}, errBadInput("match_id is required")
	}
	if err := checkGoal(&g); err != nil {
		return model.Goal{}, err
	}

	var newID int64
	err := s.db.mutate(func(fx *model.Fixture) error {
		if _, ok := s.db.matchByID[g.MatchID]; !ok {
			return errBadInput("match %d does not exist", g.MatchID)
		}
		if g.VideoURL == nil || *g.VideoURL == "" {
			g.VideoURL = strPtr(model.DemoVideoURL)
		}
		// Uniqueness on (match_id, source_goal_id), the old composite constraint.
		if g.SourceGoalID != nil {
			for _, e := range s.db.goals {
				if e.MatchID == g.MatchID && e.SourceGoalID != nil && *e.SourceGoalID == *g.SourceGoalID {
					return conflictf("goal %q already exists for match %d", *g.SourceGoalID, g.MatchID)
				}
			}
		}
		newID = s.db.nextGoal
		fx.Goals = append(fx.Goals, goalToFixture(fx, &g, newID))
		return nil
	})
	if err != nil {
		return model.Goal{}, err
	}
	// The read model is only rebuilt once mutate returns, so the created record
	// has to be looked up afterwards.
	return s.lookupGoal(newID)
}

// lookupGoal reads a goal from the rebuilt read model under the read lock.
func (s *Store) lookupGoal(id int64) (model.Goal, error) {
	s.db.mu.RLock()
	defer s.db.mu.RUnlock()
	if g, ok := s.db.goalByID[id]; ok {
		return *g, nil
	}
	return model.Goal{}, notFoundf("goal after write")
}

func (s *Store) UpdateGoal(_ context.Context, id int64, patch model.GoalPatch) (model.Goal, error) {
	err := s.db.mutate(func(fx *model.Fixture) error {
		g, ok := s.db.goalByID[id]
		if !ok {
			return notFoundf("goal")
		}
		applyGoalPatch(g, patch)
		if err := checkGoal(g); err != nil {
			return err
		}
		idx := int(id - 1)
		if idx < 0 || idx >= len(fx.Goals) {
			return notFoundf("goal")
		}
		fx.Goals[idx] = goalToFixture(fx, g, id)
		return nil
	})
	if err != nil {
		return model.Goal{}, err
	}
	return s.lookupGoal(id)
}

func applyGoalPatch(g *model.Goal, p model.GoalPatch) {
	if p.GoalType != nil {
		g.GoalType = *p.GoalType
	}
	setString(&g.BodyPart, p.BodyPart)
	setString(&g.AssistName, p.AssistName)
	setString(&g.VideoURL, p.VideoURL)
	setString(&g.PreviousAction, p.PreviousAction)
	setString(&g.PlayPattern, p.PlayPattern)
	setString(&g.SourceGoalID, p.SourceGoalID)
	setInt32(&g.Minute, p.Minute)
	setInt32Ptr(&g.AddedMinute, p.AddedMinute)
	setInt32Ptr(&g.SeasonGoalNumber, p.SeasonGoalNumber)
	setInt32Ptr(&g.CareerGoalNumber, p.CareerGoalNumber)
	setInt64(&g.AssistPlayerID, p.AssistPlayerID)
	setFloat(&g.XG, p.XG)
	setFloat(&g.XGOT, p.XGOT)
	setFloat(&g.LocationX, p.LocationX)
	setFloat(&g.LocationY, p.LocationY)
	setFloat(&g.DistanceToGoalM, p.DistanceToGoalM)
}

func (s *Store) DeleteGoal(_ context.Context, id int64) error {
	return s.db.mutate(func(fx *model.Fixture) error {
		if _, ok := s.db.goalByID[id]; !ok {
			return notFoundf("goal")
		}
		idx := int(id - 1)
		if idx < 0 || idx >= len(fx.Goals) {
			return notFoundf("goal")
		}
		fx.Goals = append(fx.Goals[:idx], fx.Goals[idx+1:]...)
		return nil
	})
}

// goalToFixture converts a model goal back into its fixture form, so a created
// or edited goal round-trips through the file unchanged.
func goalToFixture(fx *model.Fixture, g *model.Goal, id int64) model.FixtureGoal {
	matchKey := ""
	if m, ok := fixtureMatchKey(fx, g.MatchID); ok {
		matchKey = m
	}
	source := deref(g.SourceGoalID)
	if source == "" {
		source = "local-" + itoa(id)
	}
	return model.FixtureGoal{
		ID:                 "goal-" + source,
		MatchID:            matchKey,
		SourceGoalID:       source,
		Minute:             int(g.Minute),
		AddedMinute:        intPtrToInt(g.AddedMinute),
		MinuteDisplay:      itoa(int64(g.Minute)) + "'",
		StoppageTime:       false,
		Period:             periodOf(int(g.Minute)),
		ElapsedSeconds:     int(g.Minute) * 60,
		GoalType:           g.GoalType,
		GoalTypeDisplay:    displayGoalType(g.GoalType),
		IsPenalty:          g.GoalType == "penalty",
		IsHeader:           g.BodyPart != nil && *g.BodyPart == "head",
		IsFreeKick:         g.GoalType == "free_kick",
		BodyPart:           deref(g.BodyPart),
		BodyPartDisplay:    displayBodyPart(deref(g.BodyPart)),
		XG:                 derefF(g.XG),
		XGOT:               g.XGOT,
		X:                  derefF(g.LocationX),
		Y:                  derefF(g.LocationY),
		DistanceToGoalM:    derefF(g.DistanceToGoalM),
		AttackingDirection: "left_to_right",
		AssistName:         g.AssistName,
		PreviousAction:     g.PreviousAction,
		PlayPattern:        g.PlayPattern,
		SeasonGoalNumber:   int(derefInt32(g.SeasonGoalNumber)),
		CareerGoalNumber:   intPtrToInt(g.CareerGoalNumber),
		VideoURL:           derefOr(g.VideoURL, model.DemoVideoURL),
	}
}

func fixtureMatchKey(fx *model.Fixture, matchID int64) (string, bool) {
	i := int(matchID - 1)
	if i < 0 || i >= len(fx.Matches) {
		return "", false
	}
	return fx.Matches[i].ID, true
}

func periodOf(minute int) int {
	if minute <= 45 {
		return 1
	}
	return 2
}

func displayGoalType(t string) string {
	switch t {
	case "open_play":
		return "Open Play"
	case "penalty":
		return "Penalty"
	case "free_kick":
		return "Free Kick"
	case "header":
		return "Header"
	case "counter":
		return "Counter Attack"
	}
	return "Open Play"
}

func displayBodyPart(b string) string {
	switch b {
	case "left_foot":
		return "Left Foot"
	case "right_foot":
		return "Right Foot"
	case "head":
		return "Head"
	}
	return "Other"
}

func setString(dst **string, v *string) {
	if v != nil {
		*dst = v
	}
}

func derefOr(s *string, def string) string {
	if s == nil || *s == "" {
		return def
	}
	return *s
}
