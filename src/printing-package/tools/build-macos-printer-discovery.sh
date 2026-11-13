#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "The native Bonjour helper must be built on macOS." >&2
  exit 1
fi

if ! command -v swiftc >/dev/null 2>&1; then
  echo "The Xcode Swift compiler is required to build Brightdesk's macOS printer discovery helper." >&2
  exit 1
fi

OUTPUT="$REPO_ROOT/native/macos/brightdesk-ipp-discovery"
SOURCE="$REPO_ROOT/native/macos/ipp-printer-discovery.swift"

swiftc -O "$SOURCE" -o "$OUTPUT"
chmod 755 "$OUTPUT"
"$OUTPUT" --version
