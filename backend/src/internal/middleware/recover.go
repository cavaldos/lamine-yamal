package middleware

import (
	"log/slog"
	"net/http"
	"runtime/debug"

	"github.com/lamine/backend/src/internal/problem"
)

// Recoverer turns a panic into a 500 problem+json response and keeps the
// process alive. A panic here is a bug, not a client error, so it logs the
// stack at Error level.
func Recoverer(log *slog.Logger) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			defer func() {
				if rec := recover(); rec != nil {
					if rec == http.ErrAbortHandler {
						panic(rec)
					}
					log.Error("panic",
						"error", rec,
						"method", r.Method,
						"path", r.URL.Path,
						"stack", string(debug.Stack()),
					)
					problem.Writef(w, r, http.StatusInternalServerError,
						"Internal Server Error",
						"the request could not be completed")
				}
			}()
			next.ServeHTTP(w, r)
		})
	}
}
