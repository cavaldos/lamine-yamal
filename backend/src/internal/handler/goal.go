package handler

import (
	"net/http"

	"github.com/lamine/backend/src/internal/model"
	"github.com/lamine/backend/src/internal/problem"
)

func (a *API) ListGoals(w http.ResponseWriter, r *http.Request) {
	f, err := model.ParseGoalFilter(r.URL.Query())
	if err != nil {
		a.fail(w, r, err)
		return
	}
	res, err := a.Store.ListGoals(r.Context(), f)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (a *API) GetGoal(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}
	g, err := a.Store.GetGoalDetail(r.Context(), id)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, g)
}

func (a *API) CreateGoal(w http.ResponseWriter, r *http.Request) {
	var body model.Goal
	if !decodeJSON(w, r, &body) {
		return
	}
	if body.MatchID == 0 {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", "match_id is required")
		return
	}
	if body.GoalType == "" {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", "goal_type is required")
		return
	}
	g, err := a.Store.CreateGoal(r.Context(), body)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, g)
}

func (a *API) UpdateGoal(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}
	var body model.GoalPatch
	if !decodeJSON(w, r, &body) {
		return
	}
	g, err := a.Store.UpdateGoal(r.Context(), id, body)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, g)
}

func (a *API) DeleteGoal(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}
	if err := a.Store.DeleteGoal(r.Context(), id); err != nil {
		a.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
