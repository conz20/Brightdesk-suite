#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

OWNER='conz20'
RUNNER_VERSION='2.338.2'
ARCHIVE_NAME="actions-runner-osx-arm64-${RUNNER_VERSION}.tar.gz"
ARCHIVE_URL="https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${ARCHIVE_NAME}"
ARCHIVE_SHA256='25a065af409ffa317ab4d5a3b614dd15fc9c40f2172bc1b35a1b1258e919a388'
RUNNER_BASE="${HOME}/.brightdesk-product-ci-runners"
RUNNER_ROOT="$RUNNER_BASE/products"

REPOSITORIES=(
  'Brightdesk-Pages'
  'Brightdesk-Sheets'
  'Brightdesk-Decks'
  'Brightdesk-Notes'
  'Brightdesk-Database'
  'Brightdesk-Forms'
  'Brightdesk-Lists'
  'Brightdesk-Planner'
  'Brightdesk-To-Do'
  'Brightdesk-Workspace'
)

say() { printf '%s\n' "$*"; }
fail() { printf 'SETUP STOPPED: %s\n' "$*" >&2; exit 1; }


gh_api() {
  GH_TOKEN="$registration_api_token" gh api "$@"
}

start_runner() {
  local runner_home="$1"
  local runner_pid_file="$runner_home/runner.pid"
  local runner_pid=''
  local runner_command=''
  local runner_gh_config="$runner_home/gh-config-no-credentials"

  if [[ -L "$runner_pid_file" ]]; then
    say "Refusing a symbolic-link runner PID file: $runner_pid_file"
    return 1
  fi
  if [[ -e "$runner_pid_file" && ! -f "$runner_pid_file" ]]; then
    say "Refusing a non-regular runner PID path: $runner_pid_file"
    return 1
  fi

  if [[ -f "$runner_pid_file" ]]; then
    runner_pid="$(cat "$runner_pid_file" 2>/dev/null || true)"
    if [[ "$runner_pid" =~ ^[0-9]+$ ]]; then
      runner_command="$(ps -p "$runner_pid" -o command= 2>/dev/null || true)"
      if [[ "$runner_command" == *"$runner_home"* ]]; then
        say "Already running: $(basename "$runner_home") (PID $runner_pid)"
        return 0
      fi
    fi
  fi

  runner_pid="$(ps -axo pid=,command= | awk -v runner_home="$runner_home" 'index($0, runner_home) && /run[.]sh|Runner[.]Listener/ {print $1; exit}' | tr -d '[:space:]')"
  if [[ "$runner_pid" =~ ^[0-9]+$ ]] && kill -0 "$runner_pid" 2>/dev/null; then
    printf '%s\n' "$runner_pid" > "$runner_pid_file"
    say "Already running: $(basename "$runner_home") (PID $runner_pid)"
    return 0
  fi

  [[ ! -L "$runner_gh_config" ]] || { say "Refusing a symbolic-link GitHub CLI config path: $runner_gh_config"; return 1; }
  mkdir -p "$runner_gh_config"
  chmod 700 "$runner_gh_config"
  if [[ -n "$(find "$runner_gh_config" -mindepth 1 -maxdepth 1 -print -quit)" ]]; then
    say "Refusing to start with a non-empty GitHub CLI config folder: $runner_gh_config"
    say "Remove saved credentials only after reviewing the folder contents."
    return 1
  fi

  (
    cd "$runner_home"
    GH_CONFIG_DIR="$runner_gh_config" nohup "$runner_home/run.sh" > "$runner_home/runner.log" 2>&1 < /dev/null &
    printf '%s\n' "$!" > "$runner_pid_file"
  )
  runner_pid="$(cat "$runner_pid_file")"
  sleep 2
  runner_command="$(ps -p "$runner_pid" -o command= 2>/dev/null || true)"
  if [[ "$runner_command" != *"$runner_home"* ]] || ! kill -0 "$runner_pid" 2>/dev/null; then
    say "Runner did not stay running: $(basename "$runner_home")."
    say "Inspect the private local log: $runner_home/runner.log"
    return 1
  fi
  say "Started: $(basename "$runner_home") (PID $runner_pid)"
}

if [[ "$(uname -s)" != 'Darwin' || "$(uname -m)" != 'arm64' ]]; then
  fail 'This setup is for an Apple-silicon Mac only.'
fi

for command_name in gh curl tar shasum nohup ps awk tr head find; do
  command -v "$command_name" >/dev/null 2>&1 || fail "Required command not found: $command_name."
done


say ''
say 'BRIGHTDESK CUSTOMER-PRODUCT MAC RUNNER SETUP'
say 'This prepares up to ten repository-scoped Actions runners on this Apple-silicon Mac.'
say 'Each runner can execute workflow code from its matching private Brightdesk product repository.'
say 'It does not change repository permissions, secrets, workflows, visibility, branch protection or release settings.'
say 'Runner processes are owner-operated and do not auto-start after logout or reboot.'
say ''
say 'Customer products:'
for repository in "${REPOSITORIES[@]}"; do printf '  - %s\n' "$repository"; done
say ''
say 'A temporary fine-grained GitHub token for conz20 is required.'
say 'It must be limited to exactly these ten repositories with Administration: write permission and a one-day expiry.'
say 'The token is used only for registration and is cleared before any runner process starts.'
say ''
if [[ "${BRIGHTDESK_RUNNER_SETUP_CONFIRMED:-}" == 'REGISTER' ]]; then
  say 'Registration was approved in the Finder dialog.'
else
  printf 'Type REGISTER to continue, or press Enter to cancel: '
  read -r confirmation
  [[ "$confirmation" == 'REGISTER' ]] || { say 'Setup cancelled. No runner was registered.'; exit 0; }
fi

[[ ! -L "$RUNNER_BASE" ]] || fail 'The runner base path is a symbolic link; inspect it before continuing.'
mkdir -p "$RUNNER_BASE"
chmod 700 "$RUNNER_BASE"
[[ ! -L "$RUNNER_ROOT" ]] || fail 'The product runner path is a symbolic link; inspect it before continuing.'
mkdir -p "$RUNNER_ROOT"
chmod 700 "$RUNNER_ROOT"
temp_directory="$(mktemp -d "${TMPDIR:-/tmp}/brightdesk-product-runners.XXXXXX")"
trap 'rm -rf -- "$temp_directory"; unset registration_token config_args registration_api_token GH_TOKEN 2>/dev/null || true' EXIT
export GH_CONFIG_DIR="$temp_directory/gh-config"
mkdir -m 700 "$GH_CONFIG_DIR"

[[ -n "${GH_TOKEN:-}" ]] || fail 'Setup requires a temporary fine-grained GitHub token in GH_TOKEN. Do not use a stored interactive GitHub CLI login.'
registration_api_token="$GH_TOKEN"
unset GH_TOKEN
GH_TOKEN="$registration_api_token" gh auth status --hostname github.com >/dev/null 2>&1 || fail 'The temporary GitHub token was rejected. Check its owner, repository selection, permissions and expiry.'
github_user="$(gh_api user --jq '.login' 2>/dev/null)" || fail 'GitHub could not validate the temporary token.'
[[ "$github_user" == "$OWNER" ]] || fail "The temporary token belongs to '$github_user', not '$OWNER'."

archive_path="$temp_directory/$ARCHIVE_NAME"

say ''
say "Downloading the official GitHub Actions runner v$RUNNER_VERSION..."
curl --fail --location --silent --show-error --retry 3 "$ARCHIVE_URL" --output "$archive_path"
actual_sha256="$(shasum -a 256 "$archive_path" | awk '{print $1}')"
[[ "$actual_sha256" == "$ARCHIVE_SHA256" ]] || fail 'The runner archive SHA-256 did not match the pinned official GitHub release digest.'
tar -tzf "$archive_path" >/dev/null || fail 'The verified runner archive could not be read.'
say 'Runner archive checksum verified.'
say ''

started_count=0
already_online_count=0
manual_recovery_count=0
RUNNERS_TO_START=()

for repository in "${REPOSITORIES[@]}"; do
  runner_name="Brightdesk-Product-Mac-$repository"
  runner_home="$RUNNER_ROOT/$repository"
  repository_url="https://github.com/$OWNER/$repository"
  runners_endpoint="repos/$OWNER/$repository/actions/runners?per_page=100"

  online_runner="$(gh_api "$runners_endpoint" --jq "[.runners[]? | select(.status == \"online\") | ([.labels[].name] | contains(["self-hosted","macOS","ARM64","brightdesk-product-ci"]))] | any" 2>/dev/null)" ||
    fail "Cannot inspect registered runners for $repository. Check GitHub repository administration access."
  if [[ "$online_runner" == 'true' ]]; then
    say "Already has an online runner with the required product CI labels: $repository"
    already_online_count=$((already_online_count + 1))
    continue
  fi

  registered_status="$(gh_api "$runners_endpoint" --jq ".runners[]? | select(.name == \"$runner_name\") | .status" 2>/dev/null | head -n 1)" ||
    fail "Cannot inspect runner '$runner_name' in $repository."
  if [[ -n "$registered_status" ]]; then
    registered_labels_match="$(gh_api "$runners_endpoint" --jq ".runners[]? | select(.name == \"$runner_name\") | ([.labels[].name] | contains(["self-hosted","macOS","ARM64","brightdesk-product-ci"]))" 2>/dev/null | head -n 1)" ||
      fail "Cannot inspect labels for runner '$runner_name'."
    if [[ "$registered_status" == 'offline' && "$registered_labels_match" == 'true' &&
          ! -L "$runner_home" && -f "$runner_home/.runner" && ! -L "$runner_home/.runner" && -x "$runner_home/run.sh" ]]; then
      say "Restarting the already-registered product runner for $repository..."
      RUNNERS_TO_START+=("$runner_home")
    else
      say "Registered product runner '$runner_name' is $registered_status or has different labels."
      say "No duplicate registration was created. Inspect its labels and local folder: $runner_home"
      manual_recovery_count=$((manual_recovery_count + 1))
    fi
    continue
  fi

  offline_compatible_runner="$(gh_api "$runners_endpoint" --jq "[.runners[]? | select(.status == \"offline\") | ([.labels[].name] | contains(["self-hosted","macOS","ARM64","brightdesk-product-ci"]))] | any" 2>/dev/null)" ||
    fail "Cannot inspect offline runner registrations for $repository."
  if [[ "$offline_compatible_runner" == 'true' ]]; then
    say "A compatible macOS product CI runner is already registered but offline for $repository."
    say 'No duplicate registration was created. Inspect Settings > Actions > Runners and restart the existing local runner.'
    manual_recovery_count=$((manual_recovery_count + 1))
    continue
  fi

  if [[ -e "$runner_home" || -L "$runner_home" ]]; then
    fail "An unregistered runner folder already exists at $runner_home. Nothing was executed or overwritten; inspect it and move it aside before retrying."
  fi

  say "Preparing $repository..."
  mkdir -m 700 "$runner_home"
  tar -xzf "$archive_path" -C "$runner_home"
  [[ -f "$runner_home/config.sh" && ! -L "$runner_home/config.sh" && -x "$runner_home/config.sh" &&
     -f "$runner_home/run.sh" && ! -L "$runner_home/run.sh" && -x "$runner_home/run.sh" ]] ||
    fail "The extracted product runner files are incomplete for $repository."


  registration_endpoint="repos/$OWNER/$repository/actions/runners/registration-token"
  registration_token="$(gh_api --method POST "$registration_endpoint" --jq '.token')" ||
    fail "GitHub could not issue a registration token for $repository. Check repository administration access and try again."
  [[ -n "$registration_token" && "$registration_token" != 'null' ]] ||
    fail "GitHub returned no registration token for $repository."

  config_args=(--url "$repository_url" --token "$registration_token" --name "$runner_name" --runnergroup 'Default' --work '_work' --labels 'brightdesk-product-ci' --unattended)
  if ! (cd "$runner_home" && ./config.sh "${config_args[@]}"); then
    unset registration_token config_args
    fail "Runner configuration failed for $repository. Review the configurator message above; the short-lived registration token was not printed or saved."
  fi
  unset registration_token config_args

  RUNNERS_TO_START+=("$runner_home")
done

# Clear the temporary repository-administration credential before any runner can execute workflow code.
unset GH_TOKEN registration_api_token GH_CONFIG_DIR

for runner_home in "${RUNNERS_TO_START[@]}"; do
  start_runner "$runner_home" || fail "Could not start or restart runner for $(basename "$runner_home")."
  started_count=$((started_count + 1))
done

say ''
say "Setup finished. Started or restarted: $started_count; already online: $already_online_count; needs inspection: $manual_recovery_count."
say 'Check each repository under Settings > Actions > Runners and confirm its runner is Idle/Online with the required labels.'
say 'Runner processes continue after the terminal window closes, but they do not auto-start after logout or reboot.'
say 'Per-repository runner logs and configuration files remain under the local products runner folder.'
