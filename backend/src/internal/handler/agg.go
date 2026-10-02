package handler

import (
	"net/http"

	"github.com/lamine/backend/src/internal/model"
)

// Heatmap serves the aggregate grid for the current filter. The binning runs in
// SQL; this layer only decodes the finished jsonb.
func (a *API) Heatmap(w http.ResponseWriter, r *http.Request) {
	f, err := model.ParseHeatmapFilter(r.URL.Query())
	if err != nil {
		a.fail(w, r, err)
		return
	}
	res, err := a.Store.Heatmap(r.Context(), f)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}

// Summary serves the dashboard rollup for the current filter.
func (a *API) Summary(w http.ResponseWriter, r *http.Request) {
	f, err := model.ParseGoalFilter(r.URL.Query())
	if err != nil {
		a.fail(w, r, err)
		return
	}
	res, err := a.Store.Summary(r.Context(), f)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	writeJSON(w, http.StatusOK, res)
}
