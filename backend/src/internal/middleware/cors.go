package middleware

import (
	"net/http"
	"strings"
)

// CORS allows the Next.js dev server to read the API. Only the configured
// origin is echoed, and credentials stay off — there is no cookie auth in v1,
// only the X-Admin-Token header.
func CORS(origin string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			reqOrigin := r.Header.Get("Origin")
			if reqOrigin != "" && originMatches(origin, reqOrigin) {
				h := w.Header()
				h.Set("Access-Control-Allow-Origin", reqOrigin)
				h.Set("Vary", "Origin")
				h.Set("Access-Control-Allow-Methods", "GET, POST, PATCH, PUT, DELETE, OPTIONS")
				h.Set("Access-Control-Allow-Headers", "Content-Type, X-Admin-Token, X-Request-Id")
				h.Set("Access-Control-Max-Age", "600")
			}
			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// originMatches supports a comma-separated allowlist plus "*". A literal "*"
// means any origin; it is only safe because no credentials are involved.
func originMatches(allowed, req string) bool {
	for _, o := range strings.Split(allowed, ",") {
		o = strings.TrimSpace(o)
		if o == "*" || o == req {
			return true
		}
	}
	return false
}
