package handler

import (
	"net/http"
	"strings"

	"github.com/lamine/backend/src/internal/model"
	"github.com/lamine/backend/src/internal/problem"
)

func (a *API) ListMatches(w http.ResponseWriter, r *http.Request) {
	f, err := model.ParseMatchFilter(r.URL.Query())
	if err != nil {
		a.fail(w, r, err)
		return
	}
	res, err := a.Store.ListMatches(r.Context(), f)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}

func (a *API) GetMatch(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}
	// expand is a fixed set of booleans, never a caller-supplied column list.
	expand := map[string]bool{}
	for _, v := range strings.Split(r.URL.Query().Get("expand"), ",") {
		if v = strings.TrimSpace(v); v != "" {
			expand[v] = true
		}
	}
	d, err := a.Store.GetMatchDetail(r.Context(), id, expand["goals"], expand["stats"])
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, d)
}

func (a *API) CreateMatch(w http.ResponseWriter, r *http.Request) {
	var body model.Match
	if !decodeJSON(w, r, &body) {
		return
	}
	if body.CompetitionID == 0 || body.OpponentID == 0 {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request",
			"competition_id and opponent_id are required")
		return
	}
	m, err := a.Store.CreateMatch(r.Context(), body)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusCreated, m)
}

func (a *API) UpdateMatch(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}
	var body model.MatchPatch
	if !decodeJSON(w, r, &body) {
		return
	}
	m, err := a.Store.UpdateMatch(r.Context(), id, body)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, m)
}

func (a *API) DeleteMatch(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}
	if err := a.Store.DeleteMatch(r.Context(), id); err != nil {
		a.fail(w, r, err)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

// ---------- match stats + heatmap ----------

func (a *API) GetMatchStat(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}
	s, err := a.Store.GetMatchStat(r.Context(), id)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, s)
}

// PutMatchHeatmap replaces the whole grid. Posting the same body twice leaves
// the row in the same state, which is what makes it idempotent.
func (a *API) PutMatchHeatmap(w http.ResponseWriter, r *http.Request) {
	id, err := pathID(r)
	if err != nil {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
		return
	}
	var body model.Heatmap
	if !decodeJSON(w, r, &body) {
		return
	}
	if body.Grid.NX <= 0 || body.Grid.NY <= 0 {
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request",
			"grid.nx and grid.ny must be positive")
		return
	}
	s, err := a.Store.UpdateHeatmap(r.Context(), id, body)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, s)
}
