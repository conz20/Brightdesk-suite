#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "$(uname -s)" != "Darwin" || "$(uname -m)" != "arm64" ]]; then
  echo "Brightdesk cross-platform packaging requires the existing Apple-silicon Mac runner." >&2
  exit 2
fi

macos_major="$(sw_vers -productVersion | cut -d. -f1)"
if [[ ! "$macos_major" =~ ^[0-9]+$ ]] || (( macos_major < 13 )); then
  echo "The pinned Colima Virtualization.framework runtime requires macOS 13 or newer." >&2
  exit 2
fi

TOOLS_ROOT="$(bash "$ROOT/scripts/bootstrap-cross-platform-tools.sh")"
export PATH="$TOOLS_ROOT/bin:$PATH"
export COLIMA_HOME="$TOOLS_ROOT/colima-home"
export COLIMA_CACHE_HOME="$TOOLS_ROOT/colima-cache"
export DOCKER_CONFIG="$TOOLS_ROOT/docker-config"
mkdir -p "$COLIMA_HOME" "$COLIMA_CACHE_HOME" "$DOCKER_CONFIG"

PROFILE="brightdesk-cross-vz"
CONTEXT="colima-$PROFILE"
PROFILE_DIR="$COLIMA_HOME/$PROFILE"
CONFIG_FILE="$PROFILE_DIR/colima.yaml"
mkdir -p "$PROFILE_DIR"

if [[ ! -f "$CONFIG_FILE" ]]; then
  cat > "$CONFIG_FILE" <<'YAML'
cpu: 4
memory: 8
disk: 100
arch: aarch64
runtime: docker
autoActivate: false
vmType: vz
rosetta: false
binfmt: true
portForwarder: ssh
sshConfig: false
mounts: null
network:
  address: false
YAML
else
  for setting in \
    "arch: aarch64" \
    "runtime: docker" \
    "autoActivate: false" \
    "vmType: vz" \
    "rosetta: false" \
    "binfmt: true" \
    "sshConfig: false"; do
    if ! grep -Fxq "$setting" "$CONFIG_FILE"; then
      echo "Existing dedicated Colima profile has unexpected setting: $setting" >&2
      echo "Refusing to overwrite the profile; inspect $CONFIG_FILE." >&2
      exit 1
    fi
  done
fi

if ! "$TOOLS_ROOT/bin/colima" status --profile "$PROFILE" 2>&1 | grep -qi running; then
  echo "Starting the dedicated ARM64 Virtualization.framework runtime with QEMU binfmt enabled." >&2
  "$TOOLS_ROOT/bin/colima" start "$PROFILE" \
    --arch aarch64 \
    --vm-type vz \
    --runtime docker \
    --cpus 4 \
    --memory 8 \
    --disk 100 \
    --binfmt \
    --activate=false \
    --ssh-config=false
fi

ready=false
for attempt in {1..60}; do
  if "$TOOLS_ROOT/bin/docker" --context "$CONTEXT" info >/dev/null 2>&1; then
    ready=true
    break
  fi
  sleep 2
done
if [[ "$ready" != true ]]; then
  echo "Colima started but its Docker engine did not become ready on context $CONTEXT." >&2
  "$TOOLS_ROOT/bin/colima" status --profile "$PROFILE" >&2 || true
  exit 1
fi

BASE_IMAGE="$(awk '$1 == "FROM" && $2 == "--platform=linux/amd64" { print $3; exit }' "$ROOT/tools/release-cross-build/Dockerfile")"
if [[ -z "$BASE_IMAGE" || "$BASE_IMAGE" != *@sha256:* ]]; then
  echo "The cross-build Dockerfile must use its existing SHA-256-pinned linux/amd64 base image." >&2
  exit 1
fi

echo "Pulling the pinned x86_64 cross-build base image and checking QEMU binfmt execution." >&2
"$TOOLS_ROOT/bin/docker" --context "$CONTEXT" pull --platform linux/amd64 "$BASE_IMAGE" >&2
architecture="$("$TOOLS_ROOT/bin/docker" --context "$CONTEXT" run --rm \
  --platform linux/amd64 \
  --entrypoint /bin/uname \
  "$BASE_IMAGE" -m)"
if [[ "$architecture" != "x86_64" ]]; then
  echo "Expected an x86_64 Linux container through QEMU binfmt; received: $architecture" >&2
  exit 1
fi

echo "Verified linux/amd64 execution under the pinned image using the dedicated Colima VZ profile." >&2
printf '%s\n' "$CONTEXT"
