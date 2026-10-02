// Package middleware holds the cross-cutting HTTP concerns: logging, panic
// recovery, CORS for the Next.js dev server, and the admin token gate.
package middleware

import (
	"net/http"
	"time"

	"github.com/lamine/backend/src/internal/term"
)

// statusWriter remembers the status code so the access log can report it.
type statusWriter struct {
	http.ResponseWriter
	status int
	bytes  int
}

func (w *statusWriter) WriteHeader(code int) {
	w.status = code
	w.ResponseWriter.WriteHeader(code)
}

func (w *statusWriter) Write(b []byte) (int, error) {
	if w.status == 0 {
		w.status = http.StatusOK
	}
	n, err := w.ResponseWriter.Write(b)
	w.bytes += n
	return n, err
}

// Logger prints one compact line per request. Errors are left to slog: this
// only renders the happy path, so a 200 never competes visually with a 500.
func Logger() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			sw := &statusWriter{ResponseWriter: w}
			next.ServeHTTP(sw, r)
			if sw.status == 0 {
				sw.status = http.StatusOK
			}
			term.Request(r.Method, r.URL.Path, sw.status, sw.bytes, time.Since(start))
		})
	}
}

// RequestID echoes an inbound X-Request-Id so the browser can quote it in a
// bug report.
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if id := r.Header.Get("X-Request-Id"); id != "" {
			w.Header().Set("X-Request-Id", id)
		}
		next.ServeHTTP(w, r)
	})
}
