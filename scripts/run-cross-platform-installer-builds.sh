#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TOOLS_ROOT="${RUNNER_TEMP:-${TMPDIR:-/tmp}}/brightdesk-cross-tools"
export PATH="$TOOLS_ROOT/bin:$PATH"
export COLIMA_HOME="$TOOLS_ROOT/colima-home"
export COLIMA_CACHE_HOME="$TOOLS_ROOT/colima-cache"
export DOCKER_CONFIG="$TOOLS_ROOT/docker-config"
IMAGE="brightdesk-cross-builder:node-24.22.2-rust-1.99.1"

CONTEXT="$(bash "$ROOT/scripts/prepare-cross-platform-runtime.sh")"
if [[ -z "$CONTEXT" ]]; then
  echo "The prepared cross-platform runtime did not return a Docker context." >&2
  exit 1
fi

default_context="$(docker context show 2>/dev/null || true)"
echo "Docker CLI default context left unchanged: $default_context" >&2
echo "Using an existing Docker engine context: $CONTEXT" >&2

docker --context "$CONTEXT" info >/dev/null
docker --context "$CONTEXT" build --platform linux/amd64 --tag "$IMAGE" \
  --file "$ROOT/tools/release-cross-build/Dockerfile" "$ROOT/tools/release-cross-build"

architecture="$(docker --context "$CONTEXT" run --rm \
  --platform linux/amd64 \
  --entrypoint /bin/uname \
  "$IMAGE" -m)"
if [[ "$architecture" != "x86_64" ]]; then
  echo "Cross-build image is not executing as x86_64 under QEMU binfmt: $architecture" >&2
  exit 1
fi

for volume in brightdesk-cross-node-modules brightdesk-cross-electron-cache brightdesk-cross-builder-cache brightdesk-cross-cargo-registry; do
  docker --context "$CONTEXT" volume create "$volume" >/dev/null
done

docker_args=(--rm --init --platform linux/amd64 --workdir /workspace
  --volume "$ROOT:/workspace"
  --volume brightdesk-cross-node-modules:/workspace/node_modules
  --volume brightdesk-cross-electron-cache:/root/.cache/electron
  --volume brightdesk-cross-builder-cache:/root/.cache/electron-builder
  --volume brightdesk-cross-cargo-registry:/root/.cargo/registry
  --env ELECTRON_CACHE=/root/.cache/electron
  --env ELECTRON_BUILDER_CACHE=/root/.cache/electron-builder)

if [[ -n "${WIN_CSC_LINK:-}" ]]; then
  if [[ -f "$WIN_CSC_LINK" ]]; then
    cert_path="$(cd "$(dirname "$WIN_CSC_LINK")" && pwd)/$(basename "$WIN_CSC_LINK")"
    docker_args+=(--mount "type=bind,source=$cert_path,target=/run/secrets/brightdesk-windows-signing.p12,readonly")
    docker_args+=(--env WIN_CSC_LINK=/run/secrets/brightdesk-windows-signing.p12)
  else
    docker_args+=(--env WIN_CSC_LINK)
  fi
fi
if [[ -n "${WIN_CSC_KEY_PASSWORD:-}" ]]; then docker_args+=(--env WIN_CSC_KEY_PASSWORD); fi

docker --context "$CONTEXT" run "${docker_args[@]}" "$IMAGE" bash scripts/build-cross-platform-installers.sh
