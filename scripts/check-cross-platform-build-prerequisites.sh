#!/usr/bin/env bash
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" || "$(uname -m)" != "arm64" ]]; then
  echo "Brightdesk cross-platform packaging must run on the existing Apple-silicon Mac runner." >&2
  exit 2
fi

if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  echo "An existing Docker engine is ready for cross-platform packaging."
  exit 0
fi

missing=()
for tool in colima docker qemu-system-x86_64; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    missing+=("$tool")
  fi
done

if [[ ${#missing[@]} -eq 0 ]]; then
  echo "Colima, Docker CLI and QEMU are available; the build can start its isolated Colima profile."
  exit 0
fi

if command -v brew >/dev/null 2>&1 || [[ -x /opt/homebrew/bin/brew ]] || [[ -x /usr/local/bin/brew ]]; then
  echo "Homebrew is available to install missing cross-build tools: ${missing[*]}"
  exit 0
fi

if command -v sudo >/dev/null 2>&1 && sudo -n true >/dev/null 2>&1 && command -v curl >/dev/null 2>&1; then
  echo "Non-interactive bootstrap prerequisites are available for Homebrew and missing cross-build tools."
  exit 0
fi

printf 'Missing cross-platform build tools: %s\n' "${missing[*]}" >&2
echo "No running Docker engine or complete Colima/Docker/QEMU toolchain is available." >&2
echo "Homebrew is missing and cannot be installed without non-interactive administrator access." >&2
echo "Make the free cross-build tools available to this Mac runner before retrying." >&2
exit 2
