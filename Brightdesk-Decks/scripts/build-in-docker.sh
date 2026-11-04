#!/usr/bin/env bash
set -euo pipefail

target="${1:-}"
case "$target" in
  linux) builder_image="brightdesk-electron-builder:24.22.2-linux" ;;
  win) builder_image="brightdesk-electron-builder:24.22.2-windows" ;;
  *)
    echo "Usage: bash scripts/build-in-docker.sh <linux|win>" >&2
    exit 2
    ;;
esac

: "${GITHUB_RUN_ID:?GitHub Actions run ID is required}"
: "${GITHUB_WORKSPACE:?GitHub Actions workspace is required}"
: "${RUNNER_TEMP:?GitHub Actions temporary folder is required}"

module_dir="$RUNNER_TEMP/brightdesk-node-modules-${GITHUB_RUN_ID}-$target"
container_home="$HOME/.cache/brightdesk-container-home"

mkdir -p "$module_dir" \
  "$container_home/.cache/electron" \
  "$container_home/.cache/electron-builder"

cleanup() {
  rm -rf "$module_dir"
}
trap cleanup EXIT

docker run --rm --platform linux/amd64 \
  --user "$(id -u):$(id -g)" \
  --env HOME=/home/brightdesk \
  --env WINEPREFIX=/home/brightdesk/.wine \
  --env WINEDEBUG=-all \
  --env DISPLAY= \
  --env WINEDLLOVERRIDES=mscoree,mshtml= \
  --env ELECTRON_CACHE=/home/brightdesk/.cache/electron \
  --env ELECTRON_BUILDER_CACHE=/home/brightdesk/.cache/electron-builder \
  --env npm_config_cache=/home/brightdesk/.npm \
  --env BRIGHTDESK_BUILD_TARGET="$target" \
  --env CSC_LINK --env CSC_KEY_PASSWORD \
  --volume "$GITHUB_WORKSPACE:/project" \
  --volume "$module_dir:/project/node_modules" \
  --volume "$container_home:/home/brightdesk" \
  --workdir /project \
  --entrypoint /bin/bash \
  "$builder_image" \
  -lc '
    set -euo pipefail
    mkdir -p "$HOME"
    node --version
    wine --version
    npm run check:node
    npm ci --no-audit --no-fund

    if [ "$BRIGHTDESK_BUILD_TARGET" = "win" ]; then
      node scripts/patch-electron-builder-nsis.js
      npm run dist:win
      npm run release:prepare -- win
      npm run release:verify:win
      npm run dist:products:win
      npm run release:verify:products:win
    else
      npm run dist:linux
      npm run release:prepare -- linux
      npm run release:verify:linux
      npm run dist:products:linux
      npm run release:verify:products:linux
    fi
  '
