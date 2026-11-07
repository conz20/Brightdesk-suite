#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RELEASE_DIR="$(cd "${1:-$ROOT/release}" && pwd)"
TEST_HOME="$(mktemp -d)"
trap 'rm -rf "$TEST_HOME"' EXIT
export HOME="$TEST_HOME"
export DEBIAN_FRONTEND=noninteractive

mkdir -p "$HOME/Documents" "$HOME/.config"
DOCUMENT_SENTINEL="$HOME/Documents/brightdesk-uninstall-preservation.txt"
printf 'Brightdesk user document preservation fixture\n' > "$DOCUMENT_SENTINEL"

mapfile -d '' debs < <(find "$RELEASE_DIR" -type f -name '*.deb' -print0 | sort -z)
mapfile -d '' appimages < <(find "$RELEASE_DIR" -type f -name '*.AppImage' -print0 | sort -z)

if [[ "${#debs[@]}" -ne 11 ]]; then
  echo "Expected 11 Debian packages (Suite plus ten products), found ${#debs[@]}." >&2
  exit 1
fi
if [[ "${#appimages[@]}" -ne 11 ]]; then
  echo "Expected 11 AppImages (Suite plus ten products), found ${#appimages[@]}." >&2
  exit 1
fi

declare -A seen_packages=()

for package in "${debs[@]}"; do
  package_name="$(dpkg-deb -f "$package" Package)"
  if [[ -z "$package_name" || -n "${seen_packages[$package_name]:-}" ]]; then
    echo "Missing or duplicate Debian package identity: $package_name" >&2
    exit 1
  fi
  seen_packages[$package_name]=1
  data_sentinel="$HOME/.config/brightdesk-user-data-$package_name/preserve.txt"
  mkdir -p "$(dirname "$data_sentinel")"
  printf 'Preserve user settings and local data for %s\n' "$package_name" > "$data_sentinel"

  echo "Installing Debian package: $package_name"
  if ! dpkg --install "$package"; then
    apt-get update
    apt-get install --yes --no-install-recommends --fix-broken
  fi

  status="$(dpkg-query -W -f='${Status}' "$package_name" 2>/dev/null || true)"
  if [[ "$status" != "install ok installed" ]]; then
    echo "Debian package did not reach installed state: $package_name ($status)" >&2
    exit 1
  fi

  mapfile -t installed_payloads < <(dpkg -L "$package_name" | while IFS= read -r candidate; do if [[ "$candidate" == /opt/* && -f "$candidate" ]]; then printf '%s\\n' "$candidate"; fi; done)
  if [[ "${#installed_payloads[@]}" -eq 0 ]]; then
    echo "No installed application payload was recorded for $package_name." >&2
    exit 1
  fi

  echo "Removing Debian package: $package_name"
  dpkg --remove "$package_name"

  status="$(dpkg-query -W -f='${Status}' "$package_name" 2>/dev/null || true)"
  if [[ "$status" == "install ok installed" ]]; then
    echo "Debian package remains installed after removal: $package_name" >&2
    exit 1
  fi
  for installed_path in "${installed_payloads[@]}"; do
    if [[ -e "$installed_path" ]]; then
      echo "Application payload remains after package removal: $installed_path" >&2
      exit 1
    fi
  done

  if [[ ! -f "$DOCUMENT_SENTINEL" || ! -f "$data_sentinel" ]]; then
    echo "Uninstall removed a user document or settings sentinel for $package_name." >&2
    exit 1
  fi
  echo "Install/remove and user-data preservation passed: $package_name"
done

portable_dir="$HOME/PortableApps"
mkdir -p "$portable_dir"
for appimage in "${appimages[@]}"; do
  portable_copy="$portable_dir/$(basename "$appimage")"
  cp "$appimage" "$portable_copy"
  chmod +x "$portable_copy"
  if [[ ! -s "$portable_copy" || ! -x "$portable_copy" ]]; then
    echo "AppImage portable package is not executable: $portable_copy" >&2
    exit 1
  fi
  "$portable_copy" --appimage-version >/dev/null
  rm "$portable_copy"
  if [[ -e "$portable_copy" || ! -f "$DOCUMENT_SENTINEL" ]]; then
    echo "Portable AppImage removal did not complete safely: $portable_copy" >&2
    exit 1
  fi
done

echo "Linux package lifecycle passed for all 11 Debian packages and all 11 AppImage portable files."
