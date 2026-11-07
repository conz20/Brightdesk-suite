#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROFILE="brightdesk-cross"
CONTEXT="colima-${PROFILE}"
IMAGE="brightdesk-cross-builder:node-24.22.2-rust-1.99.1"

if [[ "$(uname -s)" != "Darwin" || "$(uname -m)" != "arm64" ]]; then
  echo "Brightdesk cross-platform packaging must run on the existing Apple-silicon Mac runner." >&2
  exit 2
fi
if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew is required to install the free Colima, Docker CLI and QEMU tools." >&2
  exit 2
fi
for formula in colima docker qemu; do
  if ! brew list --formula "$formula" >/dev/null 2>&1; then brew install "$formula"; fi
done

status="$(colima status --profile "$PROFILE" 2>&1 || true)"
if ! printf '%s' "$status" | grep -qi 'running'; then
  colima start --profile "$PROFILE" --arch x86_64 --vm-type qemu --cpu 4 --memory 8 --disk 100
fi

docker --context "$CONTEXT" info >/dev/null
docker --context "$CONTEXT" build --platform linux/amd64 --tag "$IMAGE" \
  --file "$ROOT/tools/release-cross-build/Dockerfile" "$ROOT/tools/release-cross-build"

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
