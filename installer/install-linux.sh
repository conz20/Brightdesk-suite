#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TERMS_FILE="$SCRIPT_DIR/TERMS_AND_CONDITIONS.txt"
if [[ ! -f "$TERMS_FILE" ]]; then
  TERMS_FILE="$SCRIPT_DIR/Brightdesk-Linux-TERMS_AND_CONDITIONS.txt"
fi
mapfile -t DEB_FILES < <(find "$SCRIPT_DIR" -maxdepth 1 -type f -name 'brightdesk-*.deb' -print | sort)

if [[ ! -f "$TERMS_FILE" ]]; then
  echo "Brightdesk terms file is missing: $TERMS_FILE" >&2
  exit 1
fi
if [[ ${#DEB_FILES[@]} -ne 1 ]]; then
  echo "Place exactly one Brightdesk .deb installer beside this script." >&2
  exit 1
fi

printf '\nBRIGHTDESK — TERMS AND CONDITIONS\n\n'
cat "$TERMS_FILE"
printf '\nDo you agree to these Terms and Conditions and want to continue installing Brightdesk?\n'
read -r -p 'Choose Yes or No [y/N]: ' answer
case "${answer,,}" in
  y|yes) ;;
  *) echo "You did not agree. Brightdesk has not been installed."; exit 1 ;;
esac

if ! command -v apt-get >/dev/null 2>&1; then
  echo "This installer requires a Debian/Ubuntu system with apt-get." >&2
  exit 1
fi
if sudo apt-get install -y "${DEB_FILES[0]}"; then
  echo "Brightdesk installation completed. You can now launch Brightdesk from your applications menu."
else
  install_status=$?
  echo "Linux package installation failed with exit code $install_status." >&2
  exit "$install_status"
fi
