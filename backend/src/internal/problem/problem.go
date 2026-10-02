// Package problem implements the RFC 9457 application/problem+json error
// format used by every non-2xx response in this API (plan.md §8.3). It is its
// own tiny package so both the handler layer and the middleware can render the
// same shape without importing each other.
package problem

import (
	"encoding/json"
	"net/http"
)

// TypeBase is the problem type prefix. Per RFC 9457 the type is a URI
// reference; using a URN keeps it resolvable without inventing URLs.
const TypeBase = "urn:lamine:problem:"

// Problem is the RFC 9457 member set. Only the members that carry information
// are serialised; the rest are omitted rather than sent as empty strings.
type Problem struct {
	Type     string `json:"type"`
	Title    string `json:"title"`
	Status   int    `json:"status"`
	Detail   string `json:"detail,omitempty"`
	Instance string `json:"instance,omitempty"`
}

// ContentType is the media type every problem response carries.
const ContentType = "application/problem+json"

// New builds a problem from a status and a title.
func New(status int, title string) Problem {
	return Problem{Type: TypeBase + slug(title), Title: title, Status: status}
}

// WithDetail returns a copy carrying an instance-specific explanation.
func (p Problem) WithDetail(detail string) Problem {
	p.Detail = detail
	return p
}

// WithInstance records the request path that failed.
func (p Problem) WithInstance(path string) Problem {
	p.Instance = path
	return p
}

// Write renders the problem. It never fails the request twice: if the client
// has already gone away there is nothing useful left to say.
func Write(w http.ResponseWriter, r *http.Request, p Problem) {
	if r != nil {
		p = p.WithInstance(r.URL.Path)
	}
	w.Header().Set("Content-Type", ContentType)
	w.Header().Set("Cache-Control", "no-store")
	w.WriteHeader(p.Status)
	_ = json.NewEncoder(w).Encode(p)
}

// Writef is the common case: build, add a detail, render.
func Writef(w http.ResponseWriter, r *http.Request, status int, title, detail string) {
	Write(w, r, New(status, title).WithDetail(detail))
}

// slug lowercases a title into a type token.
func slug(s string) string {
	out := make([]rune, 0, len(s))
	for _, r := range s {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9', r == '-':
			out = append(out, r)
		case r >= 'A' && r <= 'Z':
			out = append(out, r+('a'-'A'))
		case r == ' ':
			out = append(out, '-')
		}
	}
	return string(out)
}
