#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

if ! command -v node >/dev/null 2>&1 || [ "$(node --version 2>/dev/null || true)" != "v24.22.3" ]; then
  echo "Brightdesk requires Node.js 24.22.3. Installing the official, checksum-verified runtime..."
  sh scripts/install-node24.sh
  . scripts/activate-node24.sh
else
  node scripts/check-node24.js
fi

if [ "$(uname -s)" = "Linux" ]; then
  if command -v apt-get >/dev/null 2>&1; then
    echo "Installing Linux build/runtime prerequisites..."
    sudo apt-get update
    if apt-cache show libfuse2t64 >/dev/null 2>&1; then FUSE_PACKAGE=libfuse2t64; else FUSE_PACKAGE=libfuse2; fi
    if apt-cache show libasound2t64 >/dev/null 2>&1; then ALSA_PACKAGE=libasound2t64; else ALSA_PACKAGE=libasound2; fi
    sudo apt-get install -y build-essential python3 "$FUSE_PACKAGE" libnss3 libatk1.0-0 libatk-bridge2.0-0 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 "$ALSA_PACKAGE"
  else
    echo "Automatic OS dependency installation is supported here only for Debian/Ubuntu. Install Electron's Linux runtime libraries using your distribution package manager." >&2
    exit 1
  fi
fi

npm run setup:dev
