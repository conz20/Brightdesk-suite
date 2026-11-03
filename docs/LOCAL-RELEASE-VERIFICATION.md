# Local release verification

GitHub-hosted workflow runs are currently failing before their first runner step. This script provides a no-cost way to test and build Brightdesk on a computer you already own.

## Requirements

- macOS, Windows or Linux
- Exactly Node.js 24.22.2
- Internet access to install the project's public npm dependencies and run the npm security audit
- No GitHub payment method, paid subscription or signing certificate is required for an unsigned local build

## Run

From the Brightdesk repository folder, run:

```sh
npm run verify:local-release
```

The script checks the Node.js version and dependency lock, installs the locked dependencies, verifies licence notices, runs the full test suite, refreshes the static source inventory with `npm run rea:inspect`, runs release preflight and the high-severity npm audit, builds for the current operating system, prepares the legal/checksum assets and verifies the installer files.

The script builds only for the operating system where it is run:
- macOS: universal DMG, PKG and ZIP
- Windows: x64 EXE
- Linux: x64 AppImage and DEB

Build output is kept in the local `release/` folder. The script does not upload artifacts, create a GitHub Release or publish anything. Review the generated files and checksum report before sharing them.

Run it separately on each operating system you intend to distribute Brightdesk for. A successful build on one platform does not verify the other platforms.
