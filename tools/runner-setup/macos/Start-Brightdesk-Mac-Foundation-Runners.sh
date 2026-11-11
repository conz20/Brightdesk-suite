#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

OWNER='conz20'
RUNNER_VERSION='2.338.2'
ARCHIVE_NAME="actions-runner-osx-arm64-${RUNNER_VERSION}.tar.gz"
ARCHIVE_URL="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${ARCHIVE_NAME}"
ARCHIVE_SHA256='25a065af409ffa317ab4d5a3b614dd15fc9c40f2172bc1b35a1b1258e919a388'
RUNNER_ROOT="${BRIGHTDESK_RUNNER_ROOT:-${HOME}/.brightdesk-product-ci-runners}"

REPOSITORIES=(
  'Brightdesk-Common-Actions'
  'Brightdesk-Developer-Tools'
  'Brightdesk-Extensions'
  'Brightdesk-Wiki'
  'Brightdesk-Release-Tools'
  'Brightdesk-Services'
  'Brightdesk-Assets'
  'Brightdesk-Lists'
)

say() {
  printf '%s\n' "$*"
}

fail() {
  printf 'SETUP STOPPED: %s\n' "$*" >&2
  exit 1
}

start_runner() {
  local runner_home="$1"
  local runner_pid_file="$runner_home/runner.pid"
  local runner_pid=''

  if [[ -f "$runner_pid_file" ]]; then
    runner_pid="$(cat "$runner_pid_file" 2>/dev/null || true)"
    if [[ "$runner_pid" =~ ^[0-9]+$ ]] && kill -0 "$runner_pid" 2>/dev/null; then
      say "Already running: $(basename "$runner_home") (PID $runner_pid)"
      return 0
    fi
  fi

  (
    cd "$runner_home"
    nohup ./run.sh > "$runner_home/runner.log" 2>&1 < /dev/null &
    printf '%s\n' "$!" > "$runner_pid_file"
  )

  runner_pid="$(cat "$runner_pid_file")"
  sleep 2
  if ! kill -0 "$runner_pid" 2>/dev/null; then
    say "Runner did not stay running: $(basename "$runner_home")."
    say "Inspect the private local log: $runner_home/runner.log"
    return 1
  fi
  say "Started: $(basename "$runner_home") (PID $runner_pid)"
}

if [[ "$(uname -s)" != 'Darwin' || "$(uname -m)" != 'arm64' ]]; then
  fail 'This setup is for an Apple-silicon Mac only.'
fi

for command_name in gh curl tar shasum nohup; do
  command -v "$command_name" >/dev/null 2>&1 || fail "Required command not found: $command_name."
done

gh auth status --hostname github.com >/dev/null 2>&1 || fail 'Sign in to GitHub CLI first with: gh auth login --hostname github.com'
github_user="$(gh api user --jq '.login' 2>/dev/null)" || fail 'GitHub CLI could not read the authenticated account.'
[[ "$github_user" == "$OWNER" ]] || fail "GitHub CLI is authenticated as '$github_user', not '$OWNER'."

say ''
say 'BRIGHTDESK PRIVATE MAC RUNNER SETUP'
say 'This will prepare up to eight repository-scoped runners on this Apple-silicon Mac.'
say 'The runners can execute workflows from their matching private Brightdesk repositories.'
say 'No repository settings, branches, source files, or release settings will be changed.'
say 'The runner registrations are local to this Mac and will not auto-start after a reboot.'
say ''
say 'Repositories:'
for repository in "${REPOSITORIES[@]}"; do
  printf '  - %s\n' "$repository"
done
say ''
say 'GitHub CLI must be authenticated as conz20 with administrator access to these repositories.'
say 'The GitHub CLI credential is passed to the official runner configurator through RUNNER_CFG_PAT.'
say 'It is not written to a file, printed, or supplied as a command-line argument.'
say ''
printf 'Type REGISTER to continue, or press Enter to cancel: '
read -r confirmation
[[ "$confirmation" == 'REGISTER' ]] || { say 'Setup cancelled. No runner was registered.'; exit 0; }

mkdir -p "$RUNNER_ROOT"
[[ ! -L "$RUNNER_ROOT" ]] || fail 'The runner root is a symbolic link; inspect it before continuing.'
chmod 700 "$RUNNER_ROOT"

temp_directory="$(mktemp -d "${TMPDIR:-/tmp}/brightdesk-mac-runners.XXXXXX")"
trap 'rm -rf -- "$temp_directory"; unset RUNNER_CFG_PAT 2>/dev/null || true' EXIT
archive_path="$temp_directory/$ARCHIVE_NAME"

say ''
say "Downloading the official GitHub Actions runner v$RUNNER_VERSION..."
curl --fail --location --silent --show-error --retry 3 "$ARCHIVE_URL" --output "$archive_path"
actual_sha256="$(shasum -a 256 "$archive_path" | awk '{print $1}')"
[[ "$actual_sha256" == "$ARCHIVE_SHA256" ]] || fail 'The runner archive SHA-256 did not match the official GitHub release.'
tar -tzf "$archive_path" >/dev/null || fail 'The verified runner archive could not be read.'

say 'Runner archive checksum verified.'
say ''

started_count=0
already_online_count=0
manual_recovery_count=0

for repository in "${REPOSITORIES[@]}"; do
  runner_name="Brightdesk-Mac-$repository"
  runner_home="$RUNNER_ROOT/$repository"
  repository_url="https://github.com/$OWNER/$repository"
  extra_label=''
  if [[ "$repository" == 'Brightdesk-Lists' ]]; then
    extra_label='brightdesk-product-ci'
  fi

  required_labels='["self-hosted","macOS","ARM64"]'
  if [[ -n "$extra_label" ]]; then
    required_labels='["self-hosted","macOS","ARM64","brightdesk-product-ci"]'
  fi

  runners_endpoint="repos/$OWNER/$repository/actions/runners?per_page=100"
  online_runner="$(gh api "$runners_endpoint" --jq "[.runners[]? | select(.status == \"online\") | ([.labels[].name] | contains($required_labels))] | any" 2>/dev/null)" ||
    fail "Cannot inspect registered runners for $repository. Check GitHub repository administration access."

  if [[ "$online_runner" == 'true' ]]; then
    say "Already has an online runner with the required labels: $repository"
    already_online_count=$((already_online_count + 1))
    continue
  fi

  registered_status="$(gh api "$runners_endpoint" --jq ".runners[]? | select(.name == \"$runner_name\") | .status" 2>/dev/null | head -n 1)" ||
    fail "Cannot inspect runner '$runner_name' in $repository."

  if [[ -n "$registered_status" ]]; then
    if [[ "$registered_status" == 'offline' && -f "$runner_home/.runner" && -x "$runner_home/run.sh" ]]; then
      say "Restarting the already-registered runner for $repository..."
      start_runner "$runner_home" || fail "Could not restart $runner_name."
      started_count=$((started_count + 1))
    else
      say "Registered runner '$runner_name' is $registered_status, but its existing local installation needs inspection."
      say "No duplicate registration was created. Local folder expected: $runner_home"
      manual_recovery_count=$((manual_recovery_count + 1))
    fi
    continue
  fi

  if [[ -e "$runner_home" || -L "$runner_home" ]]; then
    fail "The local folder already exists but no matching runner registration was found: $runner_home. Nothing was overwritten."
  fi

  say "Preparing $repository..."
  mkdir -m 700 "$runner_home"
  tar -xzf "$archive_path" -C "$runner_home"

  github_pat="$(gh auth token --hostname github.com 2>/dev/null)" || fail 'Could not read the GitHub CLI credential.'
  [[ -n "$github_pat" ]] || fail 'GitHub CLI returned an empty credential.'

  config_log="$runner_home/configure.log"
  config_args=(--url "$repository_url" --name "$runner_name" --runnergroup 'Default' --work '_work')
  if [[ -n "$extra_label" ]]; then
    config_args+=(--labels "$extra_label")
  fi

  if ! (
    cd "$runner_home"
    RUNNER_CFG_PAT="$github_pat" ./config.sh "${config_args[@]}"
  ) > "$config_log" 2>&1; then
    unset github_pat
    say "Runner configuration failed for $repository. No token was printed or saved."
    say "Inspect the local configuration log: $config_log"
    fail "Could not register $runner_name. Existing files were left in place for inspection."
  fi
  unset github_pat

  start_runner "$runner_home" || fail "Could not start $runner_name."
  started_count=$((started_count + 1))
done

say ''
say "Setup finished. Started or restarted: $started_count; already online: $already_online_count; needs inspection: $manual_recovery_count."
say 'Check each repository under Settings > Actions > Runners and confirm the runner is Idle/Online.'
say 'The runner processes continue after this terminal window closes, but they do not auto-start after logout or reboot.'
say 'The per-repository runner logs and configuration files remain in the local runner folders.'
