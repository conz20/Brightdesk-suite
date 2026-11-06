# Local release verification

This script provides a no-cost way to test and build the Brightdesk Suite and all ten product installers on a computer you already own.

## Requirements

- macOS, Windows or Linux
- Exactly Node.js 24.22.2
- Internet access to install the project's npm dependencies and run the npm security audit
- No GitHub payment method, paid subscription or signing certificate is required for an unsigned local build

## Run

From the Brightdesk Suite repository folder, run:

```sh
npm run verify:local-release
```

The script checks the Node.js version and committed dependency lock, installs the locked dependencies, verifies licence notices, runs the full test suite, refreshes the static source inventory with `npm run rea:inspect`, runs release preflight and the high-severity npm audit, then:

1. Builds the Suite for the current operating system.
2. Prepares and verifies the Suite legal and SHA-256 files.
3. Builds all ten approved product installers for that same operating system.
4. Creates and verifies a SHA-256 manifest for each product.
5. Collects the Suite and product outputs into the operating-system folder.

The configured outputs are:

| Operating system | Suite | Each of the ten products |
| --- | --- | --- |
| macOS | Universal DMG, PKG and ZIP | Universal DMG, PKG and ZIP |
| Windows | x64 NSIS installer (.exe) | x64 NSIS installer (.exe) |
| Linux | x64 AppImage and DEB | x64 AppImage and DEB |

A single-platform verification run produces the expected 11 files for Windows, 33 for macOS or 22 for Linux. The full cross-platform release target is 66 files: six Suite outputs plus 60 product outputs. The final combined-bundle verifier checks product folders, filenames, version alignment, legal files and transferred SHA-256 checksums.

Build output is kept in the local `release/` folder. The script does not upload artifacts, create a GitHub Release or publish anything. Review the generated files and checksum reports before sharing them. Local builds are unsigned unless signing credentials are already configured. Unsigned macOS applications may show a Gatekeeper warning, and unsigned Windows installers may show a SmartScreen warning. A successful unsigned build is not the same as a signed, notarised production release.

Run it separately on each operating system you intend to distribute Brightdesk for. A successful build on one platform does not verify the other platforms. This process verifies packaging and checksums, not native installation, first launch, upgrade, automatic update, repair, uninstall or customer-data preservation.

## No-cost GitHub Actions runners

The manual installer workflow uses private self-hosted runners instead of GitHub-hosted runners. This avoids consuming paid hosted-runner minutes and keeps source code on computers controlled by the project owner.

Register one runner for each required platform in the repository's **Settings → Actions → Runners** page:

- **macOS:** labels `self-hosted`, `macOS`, `ARM64`.
- **Windows:** labels `self-hosted`, `Windows`, `X64`.
- **Linux:** labels `self-hosted`, `Linux`, `X64`.

GitHub assigns the standard operating-system and architecture labels when each runner is registered. Do not add a custom label in place of the standard labels above. Keep the runner service active while a build is queued. The installer workflow waits for the matching native runner for each platform; if a required runner is offline or not registered, that platform job remains queued and the full bundle cannot be collected.

The existing Mac runner can handle preparation, collection and macOS packaging. A Windows runner is required for native Windows installers, and a Linux x64 runner is required for native Linux packages. Do not substitute a cross-build from another operating system and call it verified.

The installer workflow does not publish a release unless the manual `publish_release` input is explicitly enabled; its default remains disabled. No automatic update publisher is configured in the current Suite package.

Runner setup requires access to each physical computer and a one-time registration from the repository settings. Never copy a runner registration token into source files, logs, issues or documentation. Keep all runners private to this repository and do not run untrusted fork pull-request code on them.
