# openapi/ — the authoritative REST contract

`openapi.yaml` is **hand-written** and is the source of truth for this backend:

- the DTO structs in `internal/model/*.go` mirror its json tags (field names come
  from the DDL in `plan.md` §8.4),
- `internal/api/api.gen.go` is generated from it and must never be edited by hand,
- `GET /openapi.json` serves the embedded copy of this exact document, so the
  browser and any client generator see the same contract the handlers implement.

## Regenerating `internal/api/`

Requires **oapi-codegen v2.4.1** (`~/go/bin/oapi-codegen`). From `backend/`:

```sh
mkdir -p internal/api
~/go/bin/oapi-codegen -config openapi/codegen.yaml openapi/openapi.yaml
```

Equivalent, without a global install:

```sh
go run github.com/oapi-codegen/oapi-codegen/v2/cmd/oapi-codegen@v2.4.1 \
  -config openapi/codegen.yaml openapi/openapi.yaml
```

Output: exactly one file, `internal/api/api.gen.go` (models + embedded spec).

## What `codegen.yaml` generates — and what it deliberately does not

```yaml
generate:
  models: true
  embedded-spec: true
output-options:
  skip-prune: true
```

There is **no chi server and no strict-server stub**. The handlers work directly
on the `internal/model` structs, and the spec is served verbatim from the
embedded copy. Only add `chi-server` / `strict-server` here if the handler layer
is ever rewritten to bind to generated types.

## Dependencies

`api.gen.go` imports two modules, so `go.mod` must list them:

```
github.com/getkin/kin-openapi   (openapi3 — parses the embedded spec)
github.com/oapi-codegen/runtime (types — used by the generated types)
```

`go get github.com/getkin/kin-openapi@latest github.com/oapi-codegen/runtime@latest`

## Validating the spec

`check_spec.py` asserts the contract invariants (OpenAPI 3.1 validity, RFC 9457
`application/problem+json` on every non-2xx, `X-Admin-Token` on every mutation,
the §8.3 query-parameter names, and that every `$ref` resolves):

```sh
python3 -m venv /tmp/lamvenv
/tmp/lamvenv/bin/pip install pyyaml openapi-spec-validator
/tmp/lamvenv/bin/python openapi/check_spec.py
```

## One caveat: `nullable: true` in a 3.1 document

oapi-codegen v2.4.1 does not implement OpenAPI 3.1 (upstream issue #373), so the
3.1-native nullable spellings — `type: [string, "null"]` and
`anyOf: [{type: string}, {type: "null"}]` — make the generator fail with
`unhandled Schema type: &[string null]`. The spec therefore keeps the 3.0-style
`nullable: true` keyword, which is semantically identical, passes
`openapi_spec_validator` in 3.1 mode, and generates the correct `*T` pointer
fields. If oapi-codegen gains 3.1 support, a one-line sed can migrate the file:

```sh
sed -i '' -E 's/^(\s*)nullable: true$/\1/' openapi/openapi.yaml   # then re-add type: [x, "null"]
```

Do **not** mix the two styles in one property.
