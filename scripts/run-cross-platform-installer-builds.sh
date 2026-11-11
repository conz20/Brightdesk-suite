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
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  CONTEXT="${DOCKER_CONTEXT:-$(docker context show)}"
  echo "Using an existing Docker engine context: $CONTEXT"
else
  if ! command -v colima >/dev/null 2>&1 || ! command -v docker >/dev/null 2>&1 || ! command -v qemu-system-x86_64 >/dev/null 2>&1; then
    if ! command -v brew >/dev/null 2>&1; then
      if [[ -x /opt/homebrew/bin/brew ]]; then
        eval "$(/opt/homebrew/bin/brew shellenv)"
      elif [[ -x /usr/local/bin/brew ]]; then
        eval "$(/usr/local/bin/brew shellenv)"
      else
        echo "Cross-platform packaging needs Docker with a running engine, or Colima, Docker CLI and QEMU." >&2
        echo "Homebrew is missing and cannot install the missing tools without non-interactive administrator access." >&2
        if ! command -v sudo >/dev/null 2>&1 || ! sudo -n true >/dev/null 2>&1; then
          echo "No paid runner is required; make the free cross-build tools available to this Mac runner, then retry." >&2
          exit 2
        fi
        if ! command -v curl >/dev/null 2>&1; then
          echo "curl is required to install Homebrew." >&2
          exit 2
        fi
        NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        if [[ -x /opt/homebrew/bin/brew ]]; then
          eval "$(/opt/homebrew/bin/brew shellenv)"
        elif [[ -x /usr/local/bin/brew ]]; then
          eval "$(/usr/local/bin/brew shellenv)"
        else
          echo "Homebrew installation completed without a usable brew executable." >&2
          exit 2
        fi
      fi
    fi
    if ! command -v colima >/dev/null 2>&1; then brew install colima; fi
    if ! command -v docker >/dev/null 2>&1; then brew install docker; fi
    if ! command -v qemu-system-x86_64 >/dev/null 2>&1; then brew install qemu; fi
  fi

  status="$(colima status --profile "$PROFILE" 2>&1 || true)"
  if ! printf '%s' "$status" | grep -qi 'running'; then
    colima start --profile "$PROFILE" --arch x86_64 --vm-type qemu --cpus 4 --memory 8 --disk 100
  fi
  CONTEXT="colima-$PROFILE"
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
