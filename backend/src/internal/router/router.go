// Package router wires the chi tree. It lives in its own file so the route
// table — the whole HTTP surface in one screen — is easy to audit against the
// table in plan.md §8.3.
package router

import (
	"log/slog"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/lamine/backend/src/internal/config"
	"github.com/lamine/backend/src/internal/handler"
	"github.com/lamine/backend/src/internal/middleware"
)

// New builds the fully wired HTTP handler.
func New(api *handler.API, cfg config.Config, log *slog.Logger) http.Handler {
	r := chi.NewRouter()

	r.Use(middleware.RequestID)
	r.Use(middleware.Recoverer(log))
	if cfg.LogRequests {
		r.Use(middleware.Logger())
	}
	r.Use(middleware.CORS(cfg.CORSOrigin))

	r.NotFound(handler.NotFound)
	r.MethodNotAllowed(handler.MethodNotAllowed)

	// Liveness and the contract are outside the versioned API and unguarded.
	r.Get("/healthz", api.Healthz)
	r.Get("/openapi.json", api.OpenAPI)

	admin := middleware.Admin(cfg.AdminToken)

	r.Route("/api/v1", func(r chi.Router) {
		r.Get("/players", api.ListPlayers)
		r.Get("/players/{id}", api.GetPlayer)
		r.With(admin).Post("/players", api.CreatePlayer)
		r.With(admin).Patch("/players/{id}", api.UpdatePlayer)
		r.With(admin).Delete("/players/{id}", api.DeletePlayer)

		r.Get("/teams", api.ListTeams)
		r.Get("/teams/{id}", api.GetTeam)
		r.With(admin).Post("/teams", api.CreateTeam)
		r.With(admin).Patch("/teams/{id}", api.UpdateTeam)
		r.With(admin).Delete("/teams/{id}", api.DeleteTeam)

		r.Get("/competitions", api.ListCompetitions)
		r.Get("/competitions/{id}", api.GetCompetition)
		r.With(admin).Post("/competitions", api.CreateCompetition)
		r.With(admin).Patch("/competitions/{id}", api.UpdateCompetition)
		r.With(admin).Delete("/competitions/{id}", api.DeleteCompetition)

		r.Get("/opponents", api.ListOpponents)
		r.Get("/opponents/{id}", api.GetOpponent)
		r.With(admin).Post("/opponents", api.CreateOpponent)
		r.With(admin).Patch("/opponents/{id}", api.UpdateOpponent)
		r.With(admin).Delete("/opponents/{id}", api.DeleteOpponent)

		r.Get("/matches", api.ListMatches)
		r.Get("/matches/{id}", api.GetMatch)
		r.With(admin).Post("/matches", api.CreateMatch)
		r.With(admin).Patch("/matches/{id}", api.UpdateMatch)
		r.With(admin).Delete("/matches/{id}", api.DeleteMatch)
		r.Get("/matches/{id}/stats", api.GetMatchStat)
		r.With(admin).Put("/matches/{id}/stats/heatmap", api.PutMatchHeatmap)

		r.Get("/goals", api.ListGoals)
		r.Get("/goals/{id}", api.GetGoal)
		r.With(admin).Post("/goals", api.CreateGoal)
		r.With(admin).Patch("/goals/{id}", api.UpdateGoal)
		r.With(admin).Delete("/goals/{id}", api.DeleteGoal)

		// Aggregates. Read-only, so no admin gate.
		r.Get("/heatmap", api.Heatmap)
		r.Get("/summary", api.Summary)
	})

	return r
}
