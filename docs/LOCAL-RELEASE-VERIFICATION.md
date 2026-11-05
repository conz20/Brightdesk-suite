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

## Latest local macOS verification — 6 November 2026

The verification candidate was based on PR #60 commit `7c9d6ec4e4534047f232ef86ee76c1097b252f94`. Node.js 24.22.2, lockfile verification, licence verification, all 13 pinned product-source checks, all configured Vite workspace builds and high-severity npm audit passed. The Vite builds cover nine app packages plus the shared UI package; Workspace is implemented in the integrated suite and is covered by its service/UI tests. The standard `npm test` run reported 266 Node tests: 261 passed, 0 failed and 5 opt-in tests skipped; Vitest reported 2 passed. Enabling `BRIGHTDESK_LIVE_DICT_TESTS=1` ran the pinned `en-AU` download test successfully: 262 Node tests passed, 0 failed and 4 Linux-only installer tests skipped; Vitest reported 2 passed. Those four installer tests passed separately in an isolated Linux container. Release preflight passed all checks.

The universal app, PKG and ZIP built, but DMG creation failed because `hdiutil` returned `Device not configured`. A separate minimal `hdiutil create` attempt returned the same host error. The DMG already present before the build was preserved; its internal checksum verified, but it is not evidence of a current build. The macOS artifact verifier passed on the current release folder and on a temporary candidate folder containing that earlier DMG, the newly built PKG and ZIP, and the legal files. It checks names, non-empty files and checksums only. The ZIP passed `unzip -t` and extracted successfully. `pkgutil --expand-full` exposed the PKG distribution, Terms file and app payload; the PKG and ZIP payload executables matched byte-for-byte. This does not verify installation. The PKG is unsigned and the app bundle is not Developer ID signed. No Developer ID signing or notarisation was available.

Live app launch and visual navigation acceptance remain unverified. `electron .` and direct launch of the packaged app exited with `SIGABRT` in AppKit application registration. Launch Services returned `kLSNoExecutableErr` even though the executable is present. A diagnostic copy of the app was ad-hoc signed and still failed the same way. Do not claim this host run verifies the Home screen, app routing, installation, upgrade, removal, signing or notarisation. No release was published.

Build output is kept in the local `release/` folder. The script does not upload artifacts, create a GitHub Release or publish anything. Review the generated files and checksum report before sharing them. Local builds are unsigned unless signing credentials are already configured. Unsigned macOS apps may show a Gatekeeper warning, and unsigned Windows installers may show a SmartScreen warning. A successful unsigned build is not the same as a signed, notarised production release.

Run it separately on each operating system you intend to distribute Brightdesk for. A successful build on one platform does not verify the other platforms.
