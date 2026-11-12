#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

OWNER='conz20'
REPOSITORY='Brightdesk-suite'
REPOSITORY_URL="https://github.com/$OWNER/$REPOSITORY"
RUNNER_VERSION='2.338.2'
ARCHIVE_NAME="actions-runner-linux-x64-${RUNNER_VERSION}.tar.gz"
ARCHIVE_URL="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${ARCHIVE_NAME}"
ARCHIVE_SHA256='baebf204307bac6193480852732f0aba2ae97b6c5597c244f4d5558390147c40'
RUNNER_ROOT="${BRIGHTDESK_RUNNER_ROOT:-${HOME}/.brightdesk-product-ci-runners}"
RUNNER_NAME="Brightdesk-Linux-WSL-${WSL_DISTRO_NAME:-Ubuntu}"
RUNNER_HOME="$RUNNER_ROOT/$REPOSITORY"
RUNNER_PID_FILE="$RUNNER_HOME/runner.pid"

say() { printf '%s\n' "$*"; }
fail() { printf 'SETUP STOPPED: %s\n' "$*" >&2; exit 1; }

start_runner() {
  local runner_pid=''
  if [[ -f "$RUNNER_PID_FILE" ]]; then
    runner_pid="$(cat "$RUNNER_PID_FILE" 2>/dev/null || true)"
    if [[ "$runner_pid" =~ ^[0-9]+$ ]] && kill -0 "$runner_pid" 2>/dev/null; then
      say "Already running: $RUNNER_NAME (PID $runner_pid)"
      return 0
    fi
  fi

  runner_pid="$(ps -eo pid=,args= | awk -v runner_home="$RUNNER_HOME" 'index($0, runner_home) && /Runner.Listener/ {print $1; exit}' | tr -d '[:space:]')"
  if [[ "$runner_pid" =~ ^[0-9]+$ ]] && kill -0 "$runner_pid" 2>/dev/null; then
    printf '%s\n' "$runner_pid" > "$RUNNER_PID_FILE"
    say "Already running: $RUNNER_NAME (PID $runner_pid)"
    return 0
  fi

  (
    cd "$RUNNER_HOME"
    nohup ./run.sh > "$RUNNER_HOME/runner.log" 2>&1 < /dev/null &
    printf '%s\n' "$!" > "$RUNNER_PID_FILE"
  )
  runner_pid="$(cat "$RUNNER_PID_FILE")"
  sleep 2
  if ! kill -0 "$runner_pid" 2>/dev/null; then
    say "Runner did not stay running: $RUNNER_NAME."
    say "Inspect the private local log: $RUNNER_HOME/runner.log"
    return 1
  fi
  say "Started: $RUNNER_NAME (PID $runner_pid)"
}

if [[ "$(uname -s)" != 'Linux' ]]; then
  fail 'Run this script inside the Ubuntu WSL distribution, not Windows PowerShell or macOS.'
fi
[[ "$(uname -m)" == 'x86_64' ]] || fail 'This runner requires an x64 Linux environment.'
[[ -n "${WSL_DISTRO_NAME:-}" ]] || fail 'WSL was not detected. This setup is specifically for WSL 2 on Windows 10 or Windows 11.'
[[ "$(uname -r)" == *microsoft-standard-WSL2* ]] || fail 'This is not a WSL 2 kernel. Confirm the distribution is version 2 with wsl --list --verbose.'

if [[ ! -r /etc/os-release ]]; then
  fail 'Cannot identify the Linux distribution.'
fi
# shellcheck disable=SC1091
source /etc/os-release
[[ "${ID:-}" == 'ubuntu' ]] || fail 'Use Ubuntu 22.04 LTS or Ubuntu 24.04 LTS in WSL 2.'
case "${VERSION_ID:-}" in
  '22.04'|'24.04') ;;
  *) fail "Ubuntu ${VERSION_ID:-unknown} is not supported by this setup. Use Ubuntu 22.04 or 24.04 LTS." ;;
esac

for command_name in gh curl tar sha256sum nohup ps awk; do
  command -v "$command_name" >/dev/null 2>&1 || fail "Required command not found: $command_name."
done

gh auth status --hostname github.com >/dev/null 2>&1 || fail 'Sign in to GitHub CLI inside this Ubuntu distribution with: gh auth login --hostname github.com'
github_user="$(gh api user --jq '.login' 2>/dev/null)" || fail 'GitHub CLI could not read the authenticated account.'
[[ "$github_user" == "$OWNER" ]] || fail "GitHub CLI is authenticated as '$github_user', not '$OWNER'."

say ''
say 'BRIGHTDESK PRIVATE LINUX RUNNER SETUP'
say 'This configures one x64 Linux runner for the private Brightdesk-suite repository.'
say 'It runs inside this Ubuntu WSL 2 distribution on Windows 10 or Windows 11.'
say 'It does not change workflow files, repository permissions, secrets or release settings.'
say 'Keep this runner attached only to the private Brightdesk-suite repository.'
say ''
say "Distribution: ${WSL_DISTRO_NAME}"
say "Ubuntu: ${VERSION_ID}"
say "Runner name: $RUNNER_NAME"
say ''
printf 'Type REGISTER to continue, or press Enter to cancel: '
read -r confirmation
[[ "$confirmation" == 'REGISTER' ]] || { say 'Setup cancelled. No runner was registered.'; exit 0; }

[[ ! -L "$RUNNER_ROOT" ]] || fail 'The runner root is a symbolic link; inspect it before continuing.'
mkdir -p "$RUNNER_ROOT"
chmod 700 "$RUNNER_ROOT"
[[ ! -L "$RUNNER_HOME" ]] || fail 'The runner directory is a symbolic link; inspect it before continuing.'

runners_endpoint="repos/$OWNER/$REPOSITORY/actions/runners?per_page=100"
required_labels='["self-hosted","Linux","X64"]'
online_runner="$(gh api "$runners_endpoint" --jq "[.runners[]? | select(.status == \"online\") | ([.labels[].name] | contains($required_labels))] | any" 2>/dev/null)" ||
  fail 'Cannot inspect registered runners. Check GitHub repository administration access.'

if [[ "$online_runner" == 'true' ]]; then
  say 'A compatible Linux x64 runner is already online for Brightdesk-suite.'
  say 'No duplicate runner was created.'
  exit 0
fi

registered_status="$(gh api "$runners_endpoint" --jq ".runners[]? | select(.name == \"$RUNNER_NAME\") | .status" 2>/dev/null | head -n 1)" ||
  fail "Cannot inspect runner '$RUNNER_NAME'."
if [[ -n "$registered_status" ]]; then
  registered_labels_match="$(gh api "$runners_endpoint" --jq ".runners[]? | select(.name == \"$RUNNER_NAME\") | ([.labels[].name] | contains($required_labels))" 2>/dev/null | head -n 1)" ||
    fail "Cannot inspect labels for runner '$RUNNER_NAME'."
  if [[ "$registered_status" == 'offline' && "$registered_labels_match" == 'true' &&
        ! -L "$RUNNER_HOME" && -f "$RUNNER_HOME/.runner" && ! -L "$RUNNER_HOME/.runner" && -x "$RUNNER_HOME/run.sh" ]]; then
    say 'Restarting the existing registered runner...'
    start_runner || fail 'Could not restart the registered Linux runner.'
    say 'The runner is active for this WSL session. It will go offline when WSL shuts down.'
    exit 0
  fi
  fail "Runner '$RUNNER_NAME' is already registered ($registered_status) or has different labels. Inspect the runner in GitHub Settings > Actions > Runners; no duplicate was created."
fi

offline_compatible_runner="$(gh api "$runners_endpoint" --jq "[.runners[]? | select(.status == \"offline\") | ([.labels[].name] | contains($required_labels))] | any" 2>/dev/null)" ||
  fail 'Cannot inspect offline runner registrations.'
if [[ "$offline_compatible_runner" == 'true' ]]; then
  fail 'A compatible Linux x64 runner is already registered but offline. Inspect it in GitHub Settings > Actions > Runners; no duplicate was created.'
fi

if [[ -e "$RUNNER_HOME" ]]; then
  [[ -d "$RUNNER_HOME" ]] || fail "The runner path is not a normal directory: $RUNNER_HOME."
  existing_items="$(find "$RUNNER_HOME" -mindepth 1 -maxdepth 1 -print -quit)"
  [[ -z "$existing_items" ]] || fail "The runner folder already contains files: $RUNNER_HOME. Inspect it before trying again."
else
  mkdir -p "$RUNNER_HOME"
fi
chmod 700 "$RUNNER_HOME"

temp_directory="$(mktemp -d "${TMPDIR:-/tmp}/brightdesk-linux-runner.XXXXXX")"
trap 'rm -rf -- "$temp_directory"; unset registration_token config_args 2>/dev/null || true' EXIT
archive_path="$temp_directory/$ARCHIVE_NAME"

say ''
say "Downloading the official GitHub Actions Linux x64 runner v$RUNNER_VERSION..."
curl --fail --location --silent --show-error --retry 3 "$ARCHIVE_URL" --output "$archive_path"
actual_sha256="$(sha256sum "$archive_path" | awk '{print $1}')"
[[ "$actual_sha256" == "$ARCHIVE_SHA256" ]] || fail 'The runner archive SHA-256 did not match the official GitHub release.'
tar -tzf "$archive_path" >/dev/null || fail 'The verified runner archive could not be read.'
say 'Runner archive checksum verified.'
tar -xzf "$archive_path" -C "$RUNNER_HOME"
rm -f -- "$archive_path"

registration_endpoint="repos/$OWNER/$REPOSITORY/actions/runners/registration-token"
registration_token="$(gh api --method POST "$registration_endpoint" --jq '.token')" ||
  fail 'GitHub could not issue a short-lived runner registration token.'
[[ -n "$registration_token" ]] || fail 'GitHub returned an empty runner registration token.'

say 'Registering this Linux runner with Brightdesk-suite...'
config_args=(--url "$REPOSITORY_URL" --token "$registration_token" --name "$RUNNER_NAME" --runnergroup 'Default' --work '_work' --unattended)
(
  cd "$RUNNER_HOME"
  ./config.sh "${config_args[@]}"
)
unset registration_token config_args

start_runner || fail 'The runner was registered but did not stay online.'
say ''
say 'SUCCESS: the Brightdesk Linux x64 runner is running inside WSL 2.'
say "Runner name: $RUNNER_NAME"
say 'Default labels: self-hosted, Linux, X64'
say 'Confirm it shows as Idle/Online in GitHub Settings > Actions > Runners.'
say 'WSL must remain running while GitHub Actions jobs are waiting.'
say 'This runner does not install a Windows service or start WSL after a Windows reboot.'
