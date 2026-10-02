// Package config reads and validates the process environment. It fails loudly
// at boot rather than letting a missing secret turn into a wide-open write API
// (plan.md §11 risk 4).
package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
)

// Config is the whole runtime configuration. There is no database URL: the
// datastore is one JSON file.
type Config struct {
	DataFile    string
	Port        int
	AdminToken  string
	CORSOrigin  string
	LogRequests bool
}

// Load reads the environment and applies defaults.
func Load() (Config, error) {
	c := Config{
		DataFile:   env("DATA_FILE", "data/lamine.json"),
		AdminToken: env("ADMIN_TOKEN", "dev-admin-token"),
		CORSOrigin: env("CORS_ORIGIN", "http://localhost:3000"),
	}
	var err error
	if c.Port, err = envInt("PORT", 8080); err != nil {
		return c, err
	}
	if c.LogRequests, err = envBool("LOG_REQUESTS", true); err != nil {
		return c, err
	}
	if strings.TrimSpace(c.AdminToken) == "" {
		return c, fmt.Errorf("ADMIN_TOKEN must not be empty")
	}
	return c, nil
}

// Addr is the listen address.
func (c Config) Addr() string { return ":" + strconv.Itoa(c.Port) }

// Source describes where the data came from, for the boot log.
func (c Config) Source() string { return c.DataFile }

func env(key, def string) string {
	if v, ok := os.LookupEnv(key); ok {
		return v
	}
	return def
}

func envInt(key string, def int) (int, error) {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		return def, nil
	}
	n, err := strconv.Atoi(v)
	if err != nil {
		return 0, fmt.Errorf("%s must be an integer: %w", key, err)
	}
	return n, nil
}

func envBool(key string, def bool) (bool, error) {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		return def, nil
	}
	b, err := strconv.ParseBool(v)
	if err != nil {
		return false, fmt.Errorf("%s must be a boolean: %w", key, err)
	}
	return b, nil
}
