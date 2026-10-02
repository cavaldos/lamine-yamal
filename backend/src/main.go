// Command server runs the Lamine goals API.
//
// There is no database. The whole dataset is one JSON file, loaded into memory
// at boot and written back atomically on every mutation.
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/lamine/backend/src/internal/config"
	"github.com/lamine/backend/src/internal/handler"
	"github.com/lamine/backend/src/internal/router"
	"github.com/lamine/backend/src/internal/store"
	"github.com/lamine/backend/src/internal/term"
)

func main() {
	// -check loads the datastore, prints a summary and exits. There is no longer
	// a migrate or seed step: the file on disk is the state.
	check := flag.Bool("check", false, "load the data file, print a summary and exit")
	flag.Parse()

	log := slog.New(term.NewHandler())
	slog.SetDefault(log)

	if err := run(log, *check); err != nil {
		term.Fail(err.Error())
		os.Exit(1)
	}
}

func run(log *slog.Logger, check bool) error {
	started := time.Now()
	cfg, err := config.Load()
	if err != nil {
		return err
	}

	// Trapped before startup work so Ctrl-C during a slow load still exits
	// cleanly.
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	loadStart := time.Now()
	st, err := store.Open(cfg.DataFile)
	if err != nil {
		return err
	}
	counts, err := store.LoadCounts(ctx, st)
	if err != nil {
		return err
	}

	port, busy := freePort(cfg.Port)
	if !check {
		term.Banner("Lamine API", "v1 · single-file datastore", [][2]string{
			{"Local", "http://localhost:" + strconv.Itoa(port)},
			{"Network", "http://" + term.HostIP() + ":" + strconv.Itoa(port)},
			{"Data", cfg.DataFile},
			{"Dataset", fmt.Sprintf("%d matches · %d goals · %d shots · %d heatmaps",
				counts.Matches, counts.Goals, counts.Shots, counts.Heatmaps)},
			{"CORS", cfg.CORSOrigin},
			{"Writes", "require X-Admin-Token"},
		})
	}
	if busy != "" {
		term.Warn(busy)
	}
	term.Step("✓", "Data loaded in "+time.Since(loadStart).Round(time.Millisecond).String())

	if check {
		term.Step("✓", "Nothing else to do — pass no flags to serve")
		return nil
	}

	api := &handler.API{Store: st, Log: log, Ping: func(context.Context) error { return st.Health() }}
	srv := &http.Server{
		Addr:              ":" + strconv.Itoa(port),
		Handler:           router.New(api, cfg, log),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      60 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		term.Step("✓", "Ready in "+time.Since(started).Round(time.Millisecond).String())
		fmt.Fprintln(os.Stdout)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			errCh <- err
		}
	}()

	select {
	case err := <-errCh:
		return err
	case <-ctx.Done():
	}

	term.Warn("Shutting down, draining in-flight requests…")
	// Deliberately not the signal context: it is already cancelled.
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		return err
	}
	term.Step("✓", "Bye")
	return nil
}

// freePort returns the first free port at or above want. It reports a human
// warning when it had to move, the way `next dev` does, instead of dying with
// "address already in use".
func freePort(want int) (int, string) {
	if !term.PortOpen(net.JoinHostPort("", strconv.Itoa(want))) {
		return want, ""
	}
	for p := want + 1; p < want+20; p++ {
		if !term.PortOpen(net.JoinHostPort("", strconv.Itoa(p))) {
			return p, fmt.Sprintf("Port %d is in use, using %d instead", want, p)
		}
	}
	return want, ""
}
