// Package handler is transport only: decode the request, call the store, encode
// the response. No persistence logic, no business rules.
package handler

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/lamine/backend/src/internal/model"
	"github.com/lamine/backend/src/internal/problem"
	"github.com/lamine/backend/src/internal/store"
)

// maxBodySize caps request bodies. The largest legitimate payload is a 24x16
// heatmap grid, which is a few kilobytes.
const maxBodySize = 1 << 20 // 1 MiB

// API holds the shared dependencies of every handler.
type API struct {
	Store *store.Store
	Log   *slog.Logger
	// Ping reports database reachability for /healthz.
	Ping func(ctx context.Context) error
}

// writeJSON renders v as JSON with the given status. A nil slice is emitted as
// [] rather than null so the frontend never has to null-check a collection.
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

// decodeJSON reads a JSON body into v. Unknown fields are rejected: a typo in an
// admin PATCH should be a loud 400, not a silently ignored no-op.
func decodeJSON(w http.ResponseWriter, r *http.Request, v any) bool {
	r.Body = http.MaxBytesReader(w, r.Body, maxBodySize)
	dec := json.NewDecoder(r.Body)
	dec.DisallowUnknownFields()
	if err := dec.Decode(v); err != nil {
		if errors.Is(err, io.EOF) {
			problem.Writef(w, r, http.StatusBadRequest, "Bad Request", "a JSON body is required")
			return false
		}
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
		return false
	}
	return true
}

// pathID reads the {id} path parameter.
func pathID(r *http.Request) (int64, error) {
	raw := chi.URLParam(r, "id")
	id, err := strconv.ParseInt(raw, 10, 64)
	if err != nil {
		return 0, errors.New("id must be an integer")
	}
	return id, nil
}

// fail maps a store error onto RFC 9457. Anything unrecognised becomes a 500
// and is logged with its real message, so genuine bugs are never swallowed.
func (a *API) fail(w http.ResponseWriter, r *http.Request, err error) {
	switch {
	case errors.Is(err, store.ErrNotFound):
		problem.Writef(w, r, http.StatusNotFound, "Not Found", "the requested resource does not exist")
	case errors.Is(err, store.ErrConflict):
		problem.Writef(w, r, http.StatusConflict, "Conflict", err.Error())
	case errors.Is(err, store.ErrBadInput):
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
	case errors.Is(err, model.ErrInvalidFilter):
		problem.Writef(w, r, http.StatusBadRequest, "Bad Request", err.Error())
	default:
		a.Log.Error("unhandled error", "path", r.URL.Path, "error", err)
		problem.Writef(w, r, http.StatusInternalServerError, "Internal Server Error",
			"the request could not be completed")
	}
}
