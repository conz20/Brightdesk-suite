#!/usr/bin/env bash
set -u

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
REPOSITORY_ROOT="$(cd -- "$SCRIPT_DIR/../../.." && pwd)"
RUNNER_SETUP="$SCRIPT_DIR/Start-Brightdesk-Mac-Foundation-Runners.sh"

if [[ ! -f "$RUNNER_SETUP" ]]; then
  printf 'SETUP STOPPED: The Brightdesk Mac runner setup script was not found.\n' >&2
  printf 'Expected: %s\n' "$RUNNER_SETUP" >&2
  read -r -p 'Press Return to close this window... ' _ || true
  exit 1
fi

cd "$REPOSITORY_ROOT" || {
  printf 'SETUP STOPPED: Could not open the Brightdesk-suite repository folder.\n' >&2
  read -r -p 'Press Return to close this window... ' _ || true
  exit 1
}

printf '\nBRIGHTDESK MAC RUNNER SETUP\n'
printf 'This opens the existing, verified setup for the twelve private repositories.\n'
printf 'Review its security notice and type REGISTER only when you are ready.\n\n'

bash "$RUNNER_SETUP"
result=$?

printf '\n'
if [[ $result -eq 0 ]]; then
  printf 'The runner setup script has finished. Check GitHub for Idle/Online status.\n'
else
  printf 'The runner setup did not finish successfully. Read the message above before retrying.\n'
fi
read -r -p 'Press Return to close this window... ' _ || true
exit "$result"
