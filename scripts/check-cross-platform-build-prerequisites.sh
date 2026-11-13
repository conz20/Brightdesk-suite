#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "@@{BASH_SOURCE[0]}")/.." && pwd)"
context="$(bash "$ROOT/scripts/prepare-cross-platform-runtime.sh")"
if [[ -z "$context" ]]; then
  echo "Cross-platform runtime preparation returned no Docker context." >&2
  exit 1
fi

echo "Cross-platform Docker runtime is ready on context: $context"
