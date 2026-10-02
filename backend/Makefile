# Lamine goals API — build tooling.
#
# The dataset is a single committed JSON file (data/lamine.json). There is no
# database, no migration step and no compose stack: the binary just reads it.
#
# dev    run the API on :8080 against the committed dataset
# test   run the test suite
# lint   gofmt + go vet
# ingest refresh data/lamine.json from Understat (manual, build time only)

SHELL := /bin/bash

PORT ?= 8080
ADMIN_TOKEN ?= dev-admin-token
DATA_FILE ?= data/lamine.json

export PORT ADMIN_TOKEN DATA_FILE

.PHONY: help dev build test test-short lint fmt vet ingest clean

help:
	@grep -E '^[a-z-]+:.*?## ' $(MAKEFILE_LIST) | sed 's/:.*## /\t/' | expand -t18

dev:  ## run the API on :8080 against the committed dataset
	@go run ./src

build:  ## compile the server binary
	@go build -o bin/server ./src

test:  ## run the test suite
	@go test ./... -count=1

test-short:  ## unit tests only
	@go test ./... -count=1 -short

ingest:  ## refresh data/lamine.json from Understat (manual, build time only)
	@go run ./src/tools/ingest

lint: fmt vet

fmt:
	@sh -c 'out=$$(gofmt -l src); if [ -n "$$out" ]; then echo "gofmt needed:"; echo "$$out"; exit 1; fi; echo "gofmt clean"'

vet:
	@go vet ./...

clean:
	@rm -rf bin
