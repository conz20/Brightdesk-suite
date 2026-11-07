#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Brightdesk cross-platform installer build — Node.js $(node --version)"
npm run check:node
npm run lock:verify
npm ci --no-audit --no-fund
npm run verify:licenses

echo "=== Linux x64: Suite and all ten products ==="
npm run dist:linux
npm run release:prepare -- linux
npm run release:verify:linux
npm run dist:products:linux
npm run release:verify:products:linux
bash scripts/test-linux-package-lifecycle.sh release
npm run release:collect:linux

echo "=== Windows x64: Suite and all ten products (Wine/NSIS cross-build) ==="
if [[ -n "${WIN_CSC_LINK:-}" ]]; then
  export CSC_LINK="$WIN_CSC_LINK"
  export CSC_KEY_PASSWORD="${WIN_CSC_KEY_PASSWORD:-}"
fi
export WINEPREFIX="${WINEPREFIX:-/root/.wine-brightdesk}"
export WINEARCH=win64
export WINEDEBUG="${WINEDEBUG:--all}"
xvfb-run -a wineboot --init
xvfb-run -a env BRIGHTDESK_NATIVE_TARGET=win32 npm run dist:win
npm run release:prepare -- win
npm run release:verify:win
xvfb-run -a npm run dist:products:win
npm run release:verify:products:win
npm run release:collect:win

echo "Cross-build files and SHA-256 manifests prepared:"
echo "- Windows x64 (Wine/NSIS cross-build; native Windows OS acceptance remains separate)"
echo "- Linux x64 (Linux container build)"
