#!/usr/bin/env python3
"""Validate openapi.yaml as OpenAPI 3.1 and assert the contract invariants.

Usage (from backend/):
    python3 openapi/check_spec.py

Requires: pyyaml, openapi-spec-validator
    python3 -m venv /tmp/lamvenv && /tmp/lamvenv/bin/pip install pyyaml openapi-spec-validator
"""
import os
import sys

import yaml
from openapi_spec_validator import validate

SPEC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "openapi.yaml")
METHODS = ("get", "post", "put", "patch", "delete")

with open(SPEC) as fh:
    doc = yaml.safe_load(fh)

# 1. It is valid OpenAPI 3.1.
assert doc["openapi"] == "3.1.0", doc["openapi"]
assert doc["info"]["title"] and doc["info"]["version"]
validate(doc)
print(f"OK  yaml.safe_load + openapi_spec_validator.validate -> valid OpenAPI {doc['openapi']}")
print(f"OK  info: {doc['info']['title']} v{doc['info']['version']}")


def resolve(node):
    """Resolve a possibly-$ref'd node to a plain dict."""
    while isinstance(node, dict) and "$ref" in node:
        ref = node["$ref"]
        assert ref.startswith("#/"), ref
        target = doc
        for part in ref[2:].split("/"):
            target = target[part]
        node = target
    return node


failures = []
ops = []
for path, item in doc["paths"].items():
    for method, op in item.items():
        if method not in METHODS:
            continue
        ops.append((method.upper(), path, op["operationId"]))

# 2. Every operation has a success and only problem+json failures.
for method, path, _ in ops:
    op = doc["paths"][path][method.lower()]
    codes = op["responses"]
    if not any(c.startswith("2") for c in codes):
        failures.append(f"{method} {path}: no 2xx response")
    for code, resp in codes.items():
        if code.startswith("2"):
            continue
        resp = resolve(resp)
        if "application/problem+json" not in resp.get("content", {}):
            failures.append(f"{method} {path} {code}: not problem+json")
        if resolve(resp["content"]["application/problem+json"]["schema"]) is not doc[
            "components"
        ]["schemas"]["Problem"]:
            failures.append(f"{method} {path} {code}: schema is not Problem")

# 3. Every mutating operation documents the X-Admin-Token header.
for method, path, _ in ops:
    if method == "GET":
        continue
    op = doc["paths"][path][method.lower()]
    names = {resolve(p).get("name") for p in op.get("parameters", [])}
    if "X-Admin-Token" not in names:
        failures.append(f"{method} {path}: missing X-Admin-Token header")
    if resolve(doc["components"]["parameters"]["AdminToken"]).get("required") is not True:
        failures.append("AdminToken parameter is not required")

# 4. §8.3 query parameter names are present where the table requires them.
def qnames(path, method):
    op = doc["paths"][path][method.lower()]
    return {resolve(p).get("name") for p in op.get("parameters", [])}


expected_params = {
    ("GET", "/api/v1/matches"): {"competition_id", "opponent_id", "season", "date_from",
                                  "date_to", "limit", "offset", "sort"},
    ("GET", "/api/v1/goals"): {"competition_id", "season", "opponent_id", "date_from",
                                "date_to", "match_id", "goal_type", "body_part", "is_home",
                                "sort", "limit", "offset"},
    ("GET", "/api/v1/matches/{id}"): {"id", "expand"},
    ("GET", "/api/v1/heatmap"): {"competition_id", "season", "opponent_id", "date_from",
                                  "date_to", "match_id", "goal_type", "body_part", "is_home"},
    ("GET", "/api/v1/summary"): {"competition_id", "season", "opponent_id", "date_from",
                                  "date_to", "match_id", "goal_type", "body_part", "is_home"},
}
for (method, path), want in expected_params.items():
    have = qnames(path, method)
    if not want.issubset(have):
        failures.append(f"{method} {path}: missing params {sorted(want - have)}")

# 5. Path templating is consistent (every {x} has a matching required path param).
for method, path, _ in ops:
    op = doc["paths"][path][method.lower()]
    declared = {
        resolve(p)["name"] for p in op.get("parameters", []) if resolve(p)["in"] == "path"
    }
    templated = {p[1:-1] for p in path.split("/") if p.startswith("{")}
    if declared != templated:
        failures.append(f"{method} {path}: path params {declared} != template {templated}")

# 6. All $refs resolve.
def walk(node, where="<root>"):
    if isinstance(node, dict):
        if "$ref" in node:
            ref = node["$ref"]
            try:
                resolve(node)
            except (KeyError, TypeError):
                failures.append(f"unresolvable $ref at {where}: {ref}")
        for k, v in node.items():
            walk(v, f"{where}.{k}")
    elif isinstance(node, list):
        for i, v in enumerate(node):
            walk(v, f"{where}[{i}]")


walk(doc)

print(f"OK  {len(ops)} operations, {len(doc['components']['schemas'])} schemas, "
      f"{len(doc['components']['parameters'])} reusable parameters")
for method, path, oid in ops:
    print(f"    {method:6} {path:40} {oid}")

if failures:
    print("\nFAIL")
    for f in failures:
        print("  -", f)
    sys.exit(1)
print("\nOK  all contract invariants hold (problem+json, X-Admin-Token, §8.3 params, $refs)")
