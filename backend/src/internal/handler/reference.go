package handler

import (
	"net/http"

	"github.com/lamine/backend/src/internal/model"
	"github.com/lamine/backend/src/internal/problem"
)

// The four reference resources (players, teams, competitions, opponents) have
// identical CRUD shapes, so they live in one file. They are kept explicit
// rather than collapsed behind a generic helper: a reflection-based CRUD
// factory would be harder to read than the four short blocks below.

// ---------- players ----------

func (a *API) ListPlayers(w http.ResponseWriter, r *http.Request) {
	items, err := a.Store.ListPlayers(r.Context())
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (a *API) GetPlayer(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}
	p, err := a.Store.GetPlayer(r.Context(), id)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (a *API) CreatePlayer(w http.ResponseWriter, r *http.Request) {
	var body model.Player
	if !decodeJSON(w, r, &body) {
		return
	}
	if body.FullName == "" {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", "full_name is required")
		return
	}
	p, err := a.Store.CreatePlayer(r.Context(), body)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, p)
}

func (a *API) UpdatePlayer(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}
	var body model.PlayerPatch
	if !decodeJSON(w, r, &body) {
		return
	}
	p, err := a.Store.UpdatePlayer(r.Context(), id, body)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, p)
}

func (a *API) DeletePlayer(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}
	if err := a.Store.DeletePlayer(r.Context(), id); err != nil {
		a.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ---------- teams ----------

func (a *API) ListTeams(w http.ResponseWriter, r *http.Request) {
	items, err := a.Store.ListTeams(r.Context())
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (a *API) GetTeam(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}
	t, err := a.Store.GetTeam(r.Context(), id)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, t)
}

func (a *API) CreateTeam(w http.ResponseWriter, r *http.Request) {
	var body model.Team
	if !decodeJSON(w, r, &body) {
		return
	}
	if body.Name == "" {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", "name is required")
		return
	}
	t, err := a.Store.CreateTeam(r.Context(), body)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, t)
}

func (a *API) UpdateTeam(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}
	var body model.TeamPatch
	if !decodeJSON(w, r, &body) {
		return
	}
	t, err := a.Store.UpdateTeam(r.Context(), id, body)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, t)
}

func (a *API) DeleteTeam(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}
	if err := a.Store.DeleteTeam(r.Context(), id); err != nil {
		a.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ---------- competitions ----------

func (a *API) ListCompetitions(w http.ResponseWriter, r *http.Request) {
	items, err := a.Store.ListCompetitions(r.Context())
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (a *API) GetCompetition(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}
	c, err := a.Store.GetCompetition(r.Context(), id)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, c)
}

func (a *API) CreateCompetition(w http.ResponseWriter, r *http.Request) {
	var body model.Competition
	if !decodeJSON(w, r, &body) {
		return
	}
	if body.Name == "" || body.Code == "" {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", "name and code are required")
		return
	}
	c, err := a.Store.CreateCompetition(r.Context(), body)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, c)
}

func (a *API) UpdateCompetition(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}
	var body model.CompetitionPatch
	if !decodeJSON(w, r, &body) {
		return
	}
	c, err := a.Store.UpdateCompetition(r.Context(), id, body)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, c)
}

func (a *API) DeleteCompetition(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}
	if err := a.Store.DeleteCompetition(r.Context(), id); err != nil {
		a.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ---------- opponents ----------

func (a *API) ListOpponents(w http.ResponseWriter, r *http.Request) {
	items, err := a.Store.ListOpponents(r.Context())
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, items)
}

func (a *API) GetOpponent(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}
	o, err := a.Store.GetOpponent(r.Context(), id)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, o)
}

func (a *API) CreateOpponent(w http.ResponseWriter, r *http.Request) {
	var body model.Opponent
	if !decodeJSON(w, r, &body) {
		return
	}
	if body.Name == "" {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", "name is required")
		return
	}
	o, err := a.Store.CreateOpponent(r.Context(), body)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, o)
}

func (a *API) UpdateOpponent(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}
	var body model.OpponentPatch
	if !decodeJSON(w, r, &body) {
		return
	}
	o, err := a.Store.UpdateOpponent(r.Context(), id, body)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, o)
}

func (a *API) DeleteOpponent(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}
	if err := a.Store.DeleteOpponent(r.Context(), id); err != nil {
		a.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
