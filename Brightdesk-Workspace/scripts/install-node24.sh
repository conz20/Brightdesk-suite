#!/bin/sh
# Install the exact Brightdesk Node.js version from the official Node.js
# distribution archive and verify it against the published SHA-256 manifest.
set -eu

NODE_VERSION="24.22.3"
DIST_BASE="${BRIGHTDESK_NODE_DIST_URL:-https://nodejs.org/dist/v${NODE_VERSION}}"
TOOLCHAIN_ROOT="${BRIGHTDESK_NODE_HOME:-${HOME}/.brightdesk/toolchains}"
INSTALL_DIR="${TOOLCHAIN_ROOT}/node-v${NODE_VERSION}"
TMP_DIR=""
STAGING_DIR=""

cleanup() {
  if [ -n "$TMP_DIR" ] && [ -d "$TMP_DIR" ]; then rm -rf "$TMP_DIR"; fi
  if [ -n "$STAGING_DIR" ] && [ -d "$STAGING_DIR" ]; then rm -rf "$STAGING_DIR"; fi
}
trap cleanup EXIT HUP INT TERM

if [ "$(uname -s)" = "Darwin" ]; then
  PLATFORM="darwin"
elif [ "$(uname -s)" = "Linux" ]; then
  PLATFORM="linux"
else
  echo "Unsupported operating system for this installer. Use scripts/install-node24.ps1 on Windows." >&2
  exit 2
fi

case "$(uname -m)" in
  x86_64|amd64) ARCH="x64" ;;
  aarch64|arm64) ARCH="arm64" ;;
  *) echo "Unsupported CPU architecture: $(uname -m). Supported architectures: x64 and arm64." >&2; exit 2 ;;
esac

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required to download the official Node.js distribution." >&2
  exit 2
fi
if command -v sha256sum >/dev/null 2>&1; then
  HASH_COMMAND="sha256sum"
elif command -v shasum >/dev/null 2>&1; then
  HASH_COMMAND="shasum -a 256"
else
  echo "sha256sum or shasum is required to verify the Node.js download." >&2
  exit 2
fi

if [ -x "${INSTALL_DIR}/bin/node" ] && [ "$("${INSTALL_DIR}/bin/node" --version)" = "v${NODE_VERSION}" ]; then
  echo "Node.js ${NODE_VERSION} is already installed at ${INSTALL_DIR}"
  exit 0
fi

ARCHIVE="node-v${NODE_VERSION}-${PLATFORM}-${ARCH}.tar.xz"
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/brightdesk-node24.XXXXXX")"
echo "Downloading official Node.js ${NODE_VERSION} (${PLATFORM}-${ARCH})..."
curl --fail --location --silent --show-error --proto '=https' --tlsv1.2 --retry 2 \
  "${DIST_BASE}/${ARCHIVE}" -o "${TMP_DIR}/${ARCHIVE}"
curl --fail --location --silent --show-error --proto '=https' --tlsv1.2 --retry 2 \
  "${DIST_BASE}/SHASUMS256.txt" -o "${TMP_DIR}/SHASUMS256.txt"

EXPECTED_HASH="$(awk -v file="${ARCHIVE}" '$2 == file || $2 == "*" file { print $1; exit }' "${TMP_DIR}/SHASUMS256.txt")"
if [ -z "${EXPECTED_HASH}" ]; then
  echo "The official checksum manifest does not contain ${ARCHIVE}. Refusing to install an unverified runtime." >&2
  exit 1
fi
ACTUAL_HASH="$( ${HASH_COMMAND} "${TMP_DIR}/${ARCHIVE}" | awk '{print $1}' )"
if [ "${ACTUAL_HASH}" != "${EXPECTED_HASH}" ]; then
  echo "Node.js archive checksum mismatch. Expected ${EXPECTED_HASH}; received ${ACTUAL_HASH}." >&2
  exit 1
fi

echo "SHA-256 verified. Installing into ${INSTALL_DIR}..."
mkdir -p "${TOOLCHAIN_ROOT}"
STAGING_DIR="${TOOLCHAIN_ROOT}/.node-v${NODE_VERSION}.staging.$$"
mkdir -p "${STAGING_DIR}"
tar -xJf "${TMP_DIR}/${ARCHIVE}" -C "${STAGING_DIR}"
EXTRACTED_DIR="${STAGING_DIR}/node-v${NODE_VERSION}-${PLATFORM}-${ARCH}"
if [ ! -x "${EXTRACTED_DIR}/bin/node" ]; then
  echo "The Node.js archive did not contain the expected executable." >&2
  rm -rf "${STAGING_DIR}"
  exit 1
fi
rm -rf "${INSTALL_DIR}"
mv "${EXTRACTED_DIR}" "${INSTALL_DIR}"
rm -rf "${STAGING_DIR}"
STAGING_DIR=""

if [ "$("${INSTALL_DIR}/bin/node" --version)" != "v${NODE_VERSION}" ]; then
  echo "Installed Node.js version verification failed." >&2
  exit 1
fi

echo "Node.js ${NODE_VERSION} installed successfully."
echo "Activate it in the current shell with: . ./scripts/activate-node24.sh"
echo "Then verify with: npm run check:node"
