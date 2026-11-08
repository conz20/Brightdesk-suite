#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE_DIR="$(cd "${1:-$ROOT/release}" && pwd)"
TEST_HOME="$(mktemp -d)"
trap 'rm -rf "$TEST_HOME"' EXIT
export HOME="$TEST_HOME"
export XDG_CONFIG_HOME="$HOME/.config"
export DEBIAN_FRONTEND=noninteractive
mkdir -p "$HOME/Documents" "$XDG_CONFIG_HOME"
DOCUMENT_SENTINEL="$HOME/Documents/brightdesk-uninstall-preservation.txt"
printf 'Brightdesk user document preservation fixture\n' > "$DOCUMENT_SENTINEL"

app_name_for_artifact() {
  local filename="${1##*/}"
  case "$filename" in
    brightdesk-office-suite-*|Brightdesk-Office-Suite-*) printf '%s\n' 'Brightdesk Office Suite' ;;
    brightdesk-pages-*) printf '%s\n' 'Brightdesk Pages' ;;
    brightdesk-sheets-*) printf '%s\n' 'Brightdesk Sheets' ;;
    brightdesk-decks-*) printf '%s\n' 'Brightdesk Decks' ;;
    brightdesk-notes-*) printf '%s\n' 'Brightdesk Notes' ;;
    brightdesk-database-*) printf '%s\n' 'Brightdesk Database' ;;
    brightdesk-forms-*) printf '%s\n' 'Brightdesk Forms' ;;
    brightdesk-lists-*) printf '%s\n' 'Brightdesk Lists' ;;
    brightdesk-planner-*) printf '%s\n' 'Brightdesk Planner' ;;
    brightdesk-to-do-*) printf '%s\n' 'Brightdesk To Do' ;;
    brightdesk-workspace-*) printf '%s\n' 'Brightdesk Workspace' ;;
    *) echo "Unrecognised Brightdesk Linux installer identity: $filename" >&2; return 1 ;;
  esac
}

mapfile -d '' debs < <(find "$RELEASE_DIR" -type f -name '*.deb' -print0 | sort -z)
mapfile -d '' appimages < <(find "$RELEASE_DIR" -type f -name '*.AppImage' -print0 | sort -z)
if [[ "${#debs[@]}" -ne 11 ]]; then echo "Expected 11 Debian packages, found ${#debs[@]}." >&2; exit 1; fi
if [[ "${#appimages[@]}" -ne 11 ]]; then echo "Expected 11 AppImages, found ${#appimages[@]}." >&2; exit 1; fi

declare -A seen_packages=()
declare -A seen_app_names=()
for package in "${debs[@]}"; do
  package_name="$(dpkg-deb -f "$package" Package)"
  app_name="$(app_name_for_artifact "$package")"
  if [[ -z "$package_name" || -n "${seen_packages[$package_name]:-}" ]]; then echo "Missing or duplicate Debian package identity: $package_name" >&2; exit 1; fi
  if [[ -n "${seen_app_names[$app_name]:-}" ]]; then echo "Duplicate Brightdesk application identity: $app_name" >&2; exit 1; fi
  seen_packages[$package_name]=1
  seen_app_names[$app_name]=1

  # Electron userData = $XDG_CONFIG_HOME/<app name>; main.js calls app.setName(productName).
  user_data_dir="$XDG_CONFIG_HOME/$app_name"
  data_sentinel="$user_data_dir/brightdesk-user-data-preservation.txt"
  mkdir -p "$user_data_dir"
  printf 'Preserve real Electron userData for %s\n' "$app_name" > "$data_sentinel"

  echo "Installing Debian package: $package_name ($app_name)"
  if ! dpkg --install "$package"; then apt-get update; apt-get install --yes --no-install-recommends --fix-broken; fi
  status="$(dpkg-query -W -f='${Status}' "$package_name" 2>/dev/null || true)"
  if [[ "$status" != "install ok installed" ]]; then echo "Debian package did not install: $package_name ($status)" >&2; exit 1; fi

  mapfile -t installed_payloads < <(dpkg -L "$package_name" | while IFS= read -r candidate; do if [[ "$candidate" == /opt/* && -f "$candidate" ]]; then printf '%s\n' "$candidate"; fi; done)
  if [[ "${#installed_payloads[@]}" -eq 0 ]]; then echo "No installed payload found for $package_name." >&2; exit 1; fi

  desktop_file="$(dpkg -L "$package_name" | awk '/\/usr\/share\/applications\/[^/]+\.desktop$/ { print; exit }')"
  if [[ -z "$desktop_file" || ! -s "$desktop_file" ]]; then echo "No desktop entry found for $app_name ($package_name)." >&2; exit 1; fi
  exec_entry="$(sed -n 's/^Exec=//p' "$desktop_file" | head -n 1)"
  if [[ "$exec_entry" =~ ^\"([^\"]+)\" ]]; then app_binary="${BASH_REMATCH[1]}"; else app_binary="${exec_entry%% *}"; fi
  if [[ -z "$app_binary" || ! -x "$app_binary" ]]; then echo "Desktop entry does not resolve to executable for $app_name: $exec_entry" >&2; exit 1; fi

  echo "Launching installed package in packaged-startup smoke mode: $app_name"
  BRIGHTDESK_REQUIRE_NATIVE_ENGINE=1 BRIGHTDESK_STARTUP_SMOKE_TEST=1 timeout 90s xvfb-run -a "$app_binary" --no-sandbox
  if [[ ! -f "$data_sentinel" ]]; then echo "Packaged startup removed userData sentinel for $app_name." >&2; exit 1; fi

  echo "Reapplying package to exercise reinstall/repair: $package_name"
  if ! dpkg --install "$package"; then apt-get install --yes --no-install-recommends --fix-broken; fi
  status="$(dpkg-query -W -f='${Status}' "$package_name" 2>/dev/null || true)"
  if [[ "$status" != "install ok installed" ]]; then echo "Package repair/reinstall failed: $package_name ($status)" >&2; exit 1; fi

  echo "Removing Debian package: $package_name"
  dpkg --remove "$package_name"
  status="$(dpkg-query -W -f='${Status}' "$package_name" 2>/dev/null || true)"
  if [[ "$status" == "install ok installed" ]]; then echo "Package remains installed: $package_name" >&2; exit 1; fi
  for installed_path in "${installed_payloads[@]}"; do
    if [[ -e "$installed_path" ]]; then echo "Application payload remains after removal: $installed_path" >&2; exit 1; fi
  done
  if [[ ! -f "$DOCUMENT_SENTINEL" || ! -f "$data_sentinel" ]]; then echo "Uninstall removed a user document or actual userData for $app_name." >&2; exit 1; fi
  echo "Install, startup, reinstall, removal and data preservation passed: $app_name"
done

portable_dir="$HOME/PortableApps"
mkdir -p "$portable_dir"
appimage_index=0
for appimage in "${appimages[@]}"; do
  appimage_index=$((appimage_index + 1))
  app_name="$(app_name_for_artifact "$appimage")"
  user_data_dir="$XDG_CONFIG_HOME/$app_name"
  data_sentinel="$user_data_dir/brightdesk-appimage-user-data-preservation.txt"
  mkdir -p "$user_data_dir"
  printf 'Preserve real Electron userData for portable %s\n' "$app_name" > "$data_sentinel"

  portable_copy="$portable_dir/$(basename "$appimage")"
  appimage_workdir="$TEST_HOME/appimage-$appimage_index"
  mkdir -p "$appimage_workdir"
  cp "$appimage" "$portable_copy"
  chmod +x "$portable_copy"
  if [[ ! -s "$portable_copy" || ! -x "$portable_copy" ]]; then echo "AppImage is not executable: $portable_copy" >&2; exit 1; fi

  (
    cd "$appimage_workdir"
    "$portable_copy" --appimage-extract >/dev/null
    if [[ ! -x squashfs-root/AppRun ]]; then echo "AppImage did not provide executable AppRun: $portable_copy" >&2; exit 1; fi
    echo "Launching extracted AppImage in packaged-startup smoke mode: $app_name"
    BRIGHTDESK_REQUIRE_NATIVE_ENGINE=1 BRIGHTDESK_STARTUP_SMOKE_TEST=1 timeout 90s xvfb-run -a squashfs-root/AppRun --no-sandbox
  )
  rm "$portable_copy"
  rm -rf "$appimage_workdir"
  if [[ -e "$portable_copy" || -d "$appimage_workdir" || ! -f "$DOCUMENT_SENTINEL" || ! -f "$data_sentinel" ]]; then echo "AppImage cleanup did not preserve user docs/settings: $app_name" >&2; exit 1; fi
  echo "AppImage extraction, packaged startup and portable cleanup passed: $app_name"
done

echo "Linux lifecycle passed for all 11 Debian packages and all 11 AppImages, including packaged startup and real userData preservation."
