#!/bin/sh
# Source this file from the Brightdesk project root to activate its local Node.js.
NODE_VERSION="24.22.2"
NODE_HOME="${BRIGHTDESK_NODE_HOME:-${HOME}/.brightdesk/toolchains}"
NODE_BIN="${NODE_HOME}/node-v${NODE_VERSION}/bin"

if [ ! -x "${NODE_BIN}/node" ]; then
  echo "Brightdesk Node.js ${NODE_VERSION} is not installed. Run: sh scripts/install-node24.sh" >&2
  return 1 2>/dev/null || exit 1
fi

export PATH="${NODE_BIN}:${PATH}"
if [ "$(node --version)" != "v${NODE_VERSION}" ]; then
  echo "Could not activate Node.js ${NODE_VERSION}; found $(node --version)." >&2
  return 1 2>/dev/null || exit 1
fi
printf 'Brightdesk Node.js %s is active. npm: ' "${NODE_VERSION}"
npm --version
