package middleware

import (
	"net/http"

	"github.com/lamine/backend/src/internal/problem"
)

// AdminHeader is the header every write must carry (plan.md §8.3).
const AdminHeader = "X-Admin-Token"

// Admin guards every write. The token is compared in constant time so the
// endpoint cannot be used as a timing oracle (plan.md §11 risk 4).
func Admin(token string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if got := r.Header.Get(AdminHeader); got == "" || !equalConstantTime(got, token) {
				w.Header().Set("WWW-Authenticate", `Bearer realm="lamine-admin"`)
				problem.Writef(w, r, http.StatusUnauthorized, "Unauthorized",
					AdminHeader+" header is required for write operations")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

// equalConstantTime avoids leaking the token through response timing.
func equalConstantTime(a, b string) bool {
	if len(a) != len(b) {
		return false
	}
	var diff byte
	for i := 0; i < len(a); i++ {
		diff |= a[i] ^ b[i]
	}
	return diff == 0
}
