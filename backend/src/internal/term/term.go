// Package term renders the CLI output. It is a presentation concern only:
// nothing here is imported by the request path, and it adds no dependency.
//
// Every ANSI call is a no-op when stdout is not a terminal or NO_COLOR is set,
// so piped logs and CI output stay plain.
package term

import (
	"context"
	"fmt"
	"log/slog"
	"net"
	"os"
	"strconv"
	"strings"
	"time"
)

// ANSI codes. Kept inline rather than pulled from a library: the palette is
// seven constants, and a dependency for that is not worth it.
const (
	reset   = "\x1b[0m"
	bold    = "\x1b[1m"
	dim     = "\x1b[2m"
	red     = "\x1b[31m"
	green   = "\x1b[32m"
	yellow  = "\x1b[33m"
	blue    = "\x1b[34m"
	magenta = "\x1b[35m"
	cyan    = "\x1b[36m"
	gray    = "\x1b[90m"
)

// enabled is resolved once at startup.
var enabled = detect()

func detect() bool {
	if os.Getenv("NO_COLOR") != "" {
		return false
	}
	if os.Getenv("TERM") == "dumb" {
		return false
	}
	fi, err := os.Stdout.Stat()
	if err != nil {
		return false
	}
	return fi.Mode()&os.ModeCharDevice != 0
}

func paint(code, s string) string {
	if !enabled {
		return s
	}
	return code + s + reset
}

func Bold(s string) string   { return paint(bold, s) }
func Dim(s string) string    { return paint(dim, s) }
func Red(s string) string    { return paint(red, s) }
func Green(s string) string  { return paint(green, s) }
func Yellow(s string) string { return paint(yellow, s) }
func Blue(s string) string   { return paint(blue, s) }
func Pink(s string) string   { return paint(magenta, s) }
func Cyan(s string) string   { return paint(cyan, s) }
func Gray(s string) string   { return paint(gray, s) }

// Banner prints the startup header in the same shape as `next dev`: a coloured
// mark, a title, then key/value rows whose values line up.
func Banner(title, subtitle string, rows [][2]string) {
	fmt.Fprintln(os.Stdout)
	fmt.Printf("  %s %s  %s\n", Pink("▲"), Bold(title), Dim(subtitle))
	fmt.Fprintln(os.Stdout)
	for _, r := range rows {
		fmt.Printf("  %s %s\n", Dim(pad("- "+r[0]+":", labelWidth)), r[1])
	}
	fmt.Fprintln(os.Stdout)
}

// labelWidth aligns the value column. 15 chars fits "- Network:" plus padding,
// which is the longest label used.
const labelWidth = 15

// Step prints a completion line with a coloured tick, e.g.
// "✓ Ready in 12ms".
func Step(icon, msg string) {
	fmt.Printf("  %s %s\n", Green(icon), msg)
}

// Warn prints a caution line, e.g. "⚠ Port 8080 is in use ...".
func Warn(msg string) {
	fmt.Printf("  %s %s\n", Yellow("⚠"), msg)
}

// Fail prints an error line.
func Fail(msg string) {
	fmt.Printf("  %s %s\n", Red("✗"), msg)
}

// Request prints one access-log line. The status drives both the icon and its
// colour, so a 500 is impossible to miss in a wall of 200s.
func Request(method, path string, status int, bytes int, dur time.Duration) {
	fmt.Printf("  %s %s %s %s %s\n",
		statusIcon(status),
		Gray(pad(method, 6)),
		path,
		statusColor(status)(strconv.Itoa(status)),
		Dim(formatBytes(bytes)+" "+roundDur(dur)),
	)
}

func statusIcon(status int) string {
	switch {
	case status >= 500:
		return Red("✗")
	case status >= 400:
		return Yellow("⚠")
	case status >= 300:
		return Cyan("→")
	default:
		return Green("✓")
	}
}

func statusColor(status int) func(string) string {
	switch {
	case status >= 500:
		return Red
	case status >= 400:
		return Yellow
	case status >= 300:
		return Cyan
	default:
		return Green
	}
}

func pad(s string, n int) string {
	if len(s) >= n {
		return s
	}
	return s + strings.Repeat(" ", n-len(s))
}

func roundDur(d time.Duration) string {
	if d < time.Millisecond {
		return d.Round(10 * time.Microsecond).String()
	}
	return d.Round(time.Millisecond).String()
}

func formatBytes(n int) string {
	switch {
	case n >= 1<<20:
		return fmt.Sprintf("%.1fMB", float64(n)/(1<<20))
	case n >= 1<<10:
		return fmt.Sprintf("%.1fKB", float64(n)/(1<<10))
	default:
		return strconv.Itoa(n) + "B"
	}
}

// HostIP returns the first non-loopback IPv4 address, for the Network row.
func HostIP() string {
	ifaces, err := net.Interfaces()
	if err != nil {
		return ""
	}
	for _, iface := range ifaces {
		if iface.Flags&net.FlagUp == 0 || iface.Flags&net.FlagLoopback != 0 {
			continue
		}
		addrs, err := iface.Addrs()
		if err != nil {
			continue
		}
		for _, a := range addrs {
			if ipnet, ok := a.(*net.IPNet); ok {
				if v4 := ipnet.IP.To4(); v4 != nil {
					return v4.String()
				}
			}
		}
	}
	return ""
}

// PortOpen reports whether something is already listening on addr.
func PortOpen(addr string) bool {
	conn, err := net.DialTimeout("tcp", addr, 300*time.Millisecond)
	if err != nil {
		return false
	}
	_ = conn.Close()
	return true
}

// Handler is a slog.Handler that prints errors in the same visual language as
// the rest of the CLI. It is deliberately simple: the request line does not go
// through slog (it has its own formatter), so only genuine errors land here.
type Handler struct {
	Level slog.Level
}

// NewHandler builds a logger at info level.
func NewHandler() slog.Handler { return &Handler{Level: slog.LevelInfo} }

func (h *Handler) Enabled(_ context.Context, l slog.Level) bool { return l >= h.Level }

func (h *Handler) Handle(_ context.Context, r slog.Record) error {
	icon, colour := Green("✓"), Green
	switch {
	case r.Level >= slog.LevelError:
		icon, colour = Red("✗"), Red
	case r.Level >= slog.LevelWarn:
		icon, colour = Yellow("⚠"), Yellow
	}
	msg := r.Message
	attrs := make([]string, 0, r.NumAttrs())
	r.Attrs(func(a slog.Attr) bool {
		attrs = append(attrs, fmt.Sprintf("%s=%s", Gray(a.Key), attrValue(a.Value)))
		return true
	})
	line := "  " + icon + " " + colour(msg)
	if len(attrs) > 0 {
		line += "  " + strings.Join(attrs, " ")
	}
	fmt.Fprintln(os.Stdout, line)
	return nil
}

func (h *Handler) WithAttrs([]slog.Attr) slog.Handler { return h }
func (h *Handler) WithGroup(string) slog.Handler      { return h }

func attrValue(v slog.Value) string {
	s := fmt.Sprint(v.Any())
	if strings.ContainsAny(s, " ") {
		return strconv.Quote(s)
	}
	return s
}
