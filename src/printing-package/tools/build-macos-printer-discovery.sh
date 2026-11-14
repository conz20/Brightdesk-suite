#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "The native Bonjour helper must be built on macOS." >&2
  exit 1
fi

if ! command -v swiftc >/dev/null 2>&1 || ! command -v xcrun >/dev/null 2>&1; then
  echo "The Xcode Swift compiler and lipo tool are required to build Brightdesk's universal macOS printer discovery helper." >&2
  exit 1
fi

OUTPUT="$REPO_ROOT/native/macos/brightdesk-ipp-discovery"
SOURCE="$REPO_ROOT/native/macos/ipp-printer-discovery.swift"
TEMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/brightdesk-print-discovery.XXXXXX")"
trap 'rm -rf "$TEMP_DIR"' EXIT

ARM64_HELPER="$TEMP_DIR/brightdesk-ipp-discovery-arm64"
X86_64_HELPER="$TEMP_DIR/brightdesk-ipp-discovery-x86_64"

swiftc -O -target arm64-apple-macosx11.0 "$SOURCE" -o "$ARM64_HELPER"
swiftc -O -target x86_64-apple-macosx10.15 "$SOURCE" -o "$X86_64_HELPER"

mkdir -p "$(dirname "$OUTPUT")"
xcrun lipo -create "$ARM64_HELPER" "$X86_64_HELPER" -output "$OUTPUT"
xcrun lipo "$OUTPUT" -verify_arch arm64 x86_64
chmod 755 "$OUTPUT"
"$OUTPUT" --version
