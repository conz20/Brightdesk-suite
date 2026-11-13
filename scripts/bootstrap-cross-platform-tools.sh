#!/usr/bin/env bash
set -euo pipefail
COLIMA_VERSION=0.10.3
LIMA_VERSION=2.3.0
DOCKER_CLI_VERSION=29.9.3

if [[ "$(uname -s)" != "Darwin" || "$(uname -m)" != "arm64" ]]; then
  echo "Brightdesk cross-build bootstrap requires the existing Apple-silicon Mac runner." >&2
  exit 2
fi

for required in curl tar shasum awk find cp chmod; do
  command -v "$required" >/dev/null 2>&1 || { echo "Required macOS command is missing: $required" >&2; exit 2; }
done

TEMP_ROOT="${RUNNER_TEMP:-${TMPDIR:-/tmp}}"
mkdir -p "$TEMP_ROOT"
TEMP_ROOT="$(cd "$TEMP_ROOT" && pwd -P)"
TOOLS_ROOT="$TEMP_ROOT/brightdesk-cross-tools"
BIN_DIR="$TOOLS_ROOT/bin"
DOWNLOAD_DIR="$TOOLS_ROOT/downloads"
mkdir -p "$BIN_DIR" "$DOWNLOAD_DIR"

fetch() {
  curl --fail --silent --show-error --location --retry 3 --retry-delay 2 "$1" --output "$2"
}

verify_sha256() {
  local file="$1" expected="$2" label="$3" actual
  [[ "$expected" =~ ^[0-9a-fA-F]{64}$ ]] || { echo "No valid SHA-256 checksum was published for $label." >&2; exit 1; }
  actual="$(shasum -a 256 "$file" | awk '{print $1}')"
  [[ "$actual" == "$expected" ]] || { echo "SHA-256 verification failed for $label." >&2; exit 1; }
}

verify_tar_paths() {
  local archive="$1" listing="$DOWNLOAD_DIR/$(basename "$1").contents" member
  tar -tzf "$archive" > "$listing"
  while IFS= read -r member || [[ -n "$member" ]]; do
    [[ -n "$member" ]] || continue
    if [[ "$member" == /* || "/$member/" == *"/../"* ]]; then
      echo "Unsafe path in tool archive: $member" >&2
      exit 1
    fi
  done < "$listing"
}

COLIMA_ASSET="colima-Darwin-arm64"
COLIMA_RELEASE="https://github.com/abiosoft/colima/releases/download/v${COLIMA_VERSION}"
if [[ ! -x "$BIN_DIR/colima" ]] || ! "$BIN_DIR/colima" version 2>/dev/null | grep -Fq "$COLIMA_VERSION"; then
  echo "Bootstrapping Colima $COLIMA_VERSION into RUNNER_TEMP." >&2
  colima_asset="$DOWNLOAD_DIR/$COLIMA_ASSET"
  colima_checksum="$DOWNLOAD_DIR/$COLIMA_ASSET.sha256sum"
  fetch "$COLIMA_RELEASE/$COLIMA_ASSET" "$colima_asset"
  fetch "$COLIMA_RELEASE/$COLIMA_ASSET.sha256sum" "$colima_checksum"
  expected="$(awk 'NR == 1 { print $1; exit }' "$colima_checksum")"
  verify_sha256 "$colima_asset" "$expected" "$COLIMA_ASSET"
  cp "$colima_asset" "$BIN_DIR/colima"
  chmod 755 "$BIN_DIR/colima"
fi

LIMA_RELEASE="https://github.com/lima-vm/lima/releases/download/v${LIMA_VERSION}"
LIMA_ARCHIVE="lima-${LIMA_VERSION}-Darwin-arm64.tar.gz"
LIMA_GUEST_ARCHIVE="lima-additional-guestagents-${LIMA_VERSION}-Darwin-arm64.tar.gz"
if [[ ! -x "$BIN_DIR/limactl" || ! -d "$TOOLS_ROOT/share/lima" ]] || ! "$BIN_DIR/limactl" --version 2>/dev/null | grep -Fq "$LIMA_VERSION"; then
  echo "Bootstrapping Lima $LIMA_VERSION and its guest agents into RUNNER_TEMP." >&2
  lima_checksums="$DOWNLOAD_DIR/lima-${LIMA_VERSION}-SHA256SUMS"
  lima_archive="$DOWNLOAD_DIR/$LIMA_ARCHIVE"
  lima_guest_archive="$DOWNLOAD_DIR/$LIMA_GUEST_ARCHIVE"
  fetch "$LIMA_RELEASE/SHA256SUMS" "$lima_checksums"
  fetch "$LIMA_RELEASE/$LIMA_ARCHIVE" "$lima_archive"
  fetch "$LIMA_RELEASE/$LIMA_GUEST_ARCHIVE" "$lima_guest_archive"

  for asset in "$LIMA_ARCHIVE" "$LIMA_GUEST_ARCHIVE"; do
    expected="$(awk -v wanted="$asset" '{ name=$2; sub(/^\*/, "", name); if (name == wanted) { print $1; exit } }' "$lima_checksums")"
    if [[ "$asset" == "$LIMA_ARCHIVE" ]]; then
      verify_sha256 "$lima_archive" "$expected" "$asset"
    else
      verify_sha256 "$lima_guest_archive" "$expected" "$asset"
    fi
  done

  verify_tar_paths "$lima_archive"
  verify_tar_paths "$lima_guest_archive"
  lima_stage="$DOWNLOAD_DIR/lima-stage"
  guest_stage="$DOWNLOAD_DIR/lima-guestagents-stage"
  rm -rf "$lima_stage" "$guest_stage"
  mkdir -p "$lima_stage" "$guest_stage" "$TOOLS_ROOT/share"
  tar -xzf "$lima_archive" -C "$lima_stage"
  tar -xzf "$lima_guest_archive" -C "$guest_stage"

  limactl_source="$(find "$lima_stage" -path '*/bin/limactl' -print -quit)"
  [[ -n "$limactl_source" && -x "$limactl_source" ]] || { echo "Pinned Lima release lacks an executable limactl." >&2; exit 1; }
  lima_prefix="${limactl_source%/bin/limactl}"
  for directory in bin share etc; do
    if [[ -d "$lima_prefix/$directory" ]]; then
      mkdir -p "$TOOLS_ROOT/$directory"
      cp -R "$lima_prefix/$directory/." "$TOOLS_ROOT/$directory/"
    fi
  done

  guest_share="$(find "$guest_stage" -type d -path '*/share/lima' -print -quit)"
  if [[ -n "$guest_share" ]]; then
    mkdir -p "$TOOLS_ROOT/share/lima"
    cp -R "$guest_share/." "$TOOLS_ROOT/share/lima/"
  fi
  [[ -x "$BIN_DIR/limactl" && -d "$TOOLS_ROOT/share/lima" ]] || { echo "Lima binaries or guest agents were not installed." >&2; exit 1; }
fi

DOCKER_ARCHIVE="docker-${DOCKER_CLI_VERSION}.tgz"
if [[ ! -x "$BIN_DIR/docker" ]] || ! "$BIN_DIR/docker" --version 2>/dev/null | grep -Fq "Docker version ${DOCKER_CLI_VERSION},"; then
  echo "Downloading the official Docker CLI $DOCKER_CLI_VERSION for Apple silicon." >&2
  docker_archive="$DOWNLOAD_DIR/$DOCKER_ARCHIVE"
  docker_stage="$DOWNLOAD_DIR/docker-cli-stage"
  fetch "https://download.docker.com/mac/static/stable/aarch64/$DOCKER_ARCHIVE" "$docker_archive"
  verify_tar_paths "$docker_archive"
  rm -rf "$docker_stage"
  mkdir -p "$docker_stage"
  tar -xzf "$docker_archive" -C "$docker_stage"
  docker_source="$docker_stage/docker/docker"
  [[ -x "$docker_source" ]] || { echo "Official Docker CLI archive did not contain docker/docker." >&2; exit 1; }
  docker_archive_sha="$(shasum -a 256 "$docker_archive" | awk '{print $1}')"
  echo "Docker CLI archive SHA-256 (computed locally; no detached checksum asset is published for this macOS archive): $docker_archive_sha" >&2
  cp "$docker_source" "$BIN_DIR/docker"
  chmod 755 "$BIN_DIR/docker"
fi

for executable in "$BIN_DIR/colima" "$BIN_DIR/limactl" "$BIN_DIR/docker"; do
  if command -v xattr >/dev/null 2>&1; then xattr -d com.apple.quarantine "$executable" 2>/dev/null || true; fi
done

"$BIN_DIR/colima" version | grep -F "$COLIMA_VERSION" >/dev/null
"$BIN_DIR/limactl" --version | grep -F "$LIMA_VERSION" >/dev/null
"$BIN_DIR/docker" --version | grep -F "Docker version $DOCKER_CLI_VERSION," >/dev/null
printf '%s\n' "$TOOLS_ROOT"
