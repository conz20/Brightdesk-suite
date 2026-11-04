#!/bin/sh
# Source from the Brightdesk project root to install (when needed) and activate
# the exact project Node.js runtime in the current shell.

if [ ! -f package.json ] || [ ! -f scripts/install-node24.sh ]; then
  echo "Run this from the Brightdesk project root, for example: . ./scripts/use-node24.sh" >&2
  return 1 2>/dev/null || exit 1
fi

if command -v node >/dev/null 2>&1 && [ "$(node --version 2>/dev/null || true)" = "v24.22.2" ]; then
  node scripts/check-node24.js
  return 0 2>/dev/null || exit 0
fi

if ! sh scripts/install-node24.sh; then
  return 1 2>/dev/null || exit 1
fi
. scripts/activate-node24.sh || return 1 2>/dev/null || exit 1
