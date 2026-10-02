package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/lamine/backend/src/internal/api"
	"github.com/lamine/backend/src/internal/model"
	"github.com/lamine/backend/src/internal/problem"
)

// Healthz reports liveness plus a real database round trip, so a server that
// cannot reach Postgres is reported as degraded rather than healthy.
func (a *API) Healthz(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
	defer cancel()

	h := model.Health{Status: "ok", DB: "ok"}
	status := http.StatusOK
	if err := a.Ping(ctx); err != nil {
		h.Status, h.DB = "degraded", "unavailable"
		status = http.StatusServiceUnavailable
		a.Log.Warn("health check failed", "error", err)
	}
	writeJSON(w, status, h)
}

// OpenAPI serves the contract from the oapi-codegen embedded spec, so the
// served document is always the exact one the DTOs were generated from. CORS is
// handled by the global middleware, so no extra header is set here.
func (a *API) OpenAPI(w http.ResponseWriter, r *http.Request) {
	swagger, err := api.GetSwagger()
	if err != nil {
		a.fail(w, r, err)
		return
	}
	body, err := json.Marshal(swagger)
	if err != nil {
		a.fail(w, r, err)
		return
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(http.StatusOK)
	_, _ = w.Write(body)
}

// NotFound handles unmatched routes. It is exported because the router registers
// it directly.
func NotFound(w http.ResponseWriter, r *http.Request) {
	problem.Writef(w, r, http.StatusNotFound, "Not Found",
		"no route matches "+r.Method+" "+r.URL.Path)
}

// MethodNotAllowed keeps 405s in the same problem+json shape as everything else,
// instead of chi's plain-text default.
func MethodNotAllowed(w http.ResponseWriter, r *http.Request) {
	problem.Writef(w, r, http.StatusMethodNotAllowed, "Method Not Allowed",
		r.Method+" is not allowed on this path")
}
