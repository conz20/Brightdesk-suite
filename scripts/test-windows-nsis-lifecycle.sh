#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE_DIR="$(cd "${1:-$ROOT/release}" && pwd)"
VERSION="$(node -p "require('$ROOT/package.json').version")"
PREFIX="$(mktemp -d)"
export WINEPREFIX="$PREFIX"
export WINEARCH=win64
export WINEDEBUG=-all
trap 'rm -rf "$PREFIX"' EXIT

xvfb-run -a wineboot --init
APPDATA_WIN="$(xvfb-run -a wine cmd /c echo %APPDATA% | tail -n 1 | tr -d '\r')"
USERPROFILE_WIN="$(xvfb-run -a wine cmd /c echo %USERPROFILE% | tail -n 1 | tr -d '\r')"
APPDATA_UNIX="$(winepath -u "$APPDATA_WIN")"
DOCUMENTS_UNIX="$(winepath -u "${USERPROFILE_WIN}\\Documents")"
mkdir -p "$APPDATA_UNIX" "$DOCUMENTS_UNIX"
DOCUMENT_SENTINEL="$DOCUMENTS_UNIX/brightdesk-windows-uninstall-preservation.txt"
printf 'Preserve this user document through every uninstall.\n' > "$DOCUMENT_SENTINEL"

find_uninstall_string() {
  local product_name="$1"
  local hive output value
  for hive in HKCU HKLM; do
    output="$(wine reg query "${hive}\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall" /s /v UninstallString 2>/dev/null || true)"
    value="$(printf '%s\n' "$output" | sed -n 's/^[[:space:]]*UninstallString[[:space:]]*REG_SZ[[:space:]]*//p' | head -n 1)"
    if [[ -n "$value" ]]; then
      value="${value#\"}"
      value="${value%\"}"
      printf '%s\n' "$value"
      return 0
    fi
  done
  return 1
}

run_lifecycle_test() {
  local installer="$1"
  local product_name="$2"
  local data_sentinel="$APPDATA_UNIX/$product_name/brightdesk-user-data-preservation.txt"
  mkdir -p "$(dirname "$data_sentinel")"
  printf 'Preserve settings and local data for %s.\n' "$product_name" > "$data_sentinel"

  echo "Installing with Wine/NSIS smoke mode: $product_name"
  xvfb-run -a wine "$installer" /S

  local uninstall_string=""
  for attempt in {1..15}; do
    uninstall_string="$(find_uninstall_string "$product_name" || true)"
    [[ -n "$uninstall_string" ]] && break
    sleep 1
  done
  if [[ -z "$uninstall_string" ]]; then
    echo "Installer did not register an NSIS uninstaller for $product_name." >&2
    exit 1
  fi

  local uninstaller
  uninstaller="$(winepath -u "$uninstall_string")"
  if [[ ! -f "$uninstaller" ]]; then
    echo "Registered NSIS uninstaller does not exist: $uninstaller" >&2
    exit 1
  fi
  local install_directory
  install_directory="$(dirname "$uninstaller")"

  echo "Uninstalling with Wine/NSIS smoke mode: $product_name"
  xvfb-run -a wine "$uninstaller" /S

  if [[ -e "$uninstaller" ]]; then
    echo "Uninstaller file remains after removal: $uninstaller" >&2
    exit 1
  fi
  if [[ -d "$install_directory" ]] && find "$install_directory" -type f -print -quit | grep -q .; then
    echo "Program files remain after uninstall for $product_name: $install_directory" >&2
    exit 1
  fi
  if [[ ! -f "$data_sentinel" || ! -f "$DOCUMENT_SENTINEL" ]]; then
    echo "Uninstall removed user settings or documents for $product_name." >&2
    exit 1
  fi
  if find_uninstall_string "$product_name" >/dev/null 2>&1; then
    echo "Windows uninstall registry entry remains after removing $product_name." >&2
    exit 1
  fi
  echo "Wine install/uninstall smoke test and user-data preservation passed: $product_name"
}

suite_installer="$RELEASE_DIR/Windows/Brightdesk-Office-Suite-$VERSION-x64.exe"
if [[ ! -s "$suite_installer" ]]; then
  echo "Missing Windows Suite installer: $suite_installer" >&2
  exit 1
fi
run_lifecycle_test "$suite_installer" "Brightdesk Office Suite"

declare -A product_slugs=(
  [pages]="Pages"
  [sheets]="Sheets"
  [slides]="Decks"
  [notes]="Notes"
  [database]="Database"
  [forms]="Forms"
  [lists]="Lists"
  [planner]="Planner"
  [todo]="To-Do"
  [loop]="Workspace"
)
declare -A product_names=(
  [pages]="Brightdesk Pages"
  [sheets]="Brightdesk Sheets"
  [slides]="Brightdesk Decks"
  [notes]="Brightdesk Notes"
  [database]="Brightdesk Database"
  [forms]="Brightdesk Forms"
  [lists]="Brightdesk Lists"
  [planner]="Brightdesk Planner"
  [todo]="Brightdesk To Do"
  [loop]="Brightdesk Workspace"
)

for product_id in pages sheets slides notes database forms lists planner todo loop; do
  slug="${product_slugs[$product_id]}"
  installer="$RELEASE_DIR/apps/Windows/$product_id/Brightdesk-$slug-$VERSION-x64.exe"
  if [[ ! -s "$installer" ]]; then
    echo "Missing Windows product installer: $installer" >&2
    exit 1
  fi
  run_lifecycle_test "$installer" "${product_names[$product_id]}"
done

echo "Wine/NSIS install and uninstall smoke tests passed for the Suite and all ten products."
echo "These are compatibility smoke tests, not native Windows operating-system certification."
