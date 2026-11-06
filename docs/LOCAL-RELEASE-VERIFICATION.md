# Local release verification

The local release command builds and verifies the Brightdesk Office Suite and all ten approved products on the computer where it runs. The automated and manual installer workflows use private self-hosted GitHub Actions runners; this local command does not upload artifacts or publish a release.

## Requirements

- macOS, Windows or Linux.
- Exactly Node.js 24.22.2.
- Internet access for the locked npm dependencies and the npm security audit.
- A native build host matching the output platform.
- No GitHub-hosted runner, release upload or signing certificate is required for an unsigned local build.

## Run

From the Brightdesk Suite repository root:

```sh
npm run verify:local-release
```

The script checks the Node.js runtime and dependency lock, installs the locked dependencies, verifies third-party notices, runs the automated tests and source inspection, checks release preflight and high-severity npm advisories, then:

1. Builds the Brightdesk Office Suite for the current operating system.
2. Prepares the operating-system-specific Terms and Conditions, MIT licence and third-party notices.
3. Verifies the Suite installer/archive names, non-empty files and SHA-256 checksums.
4. Builds all ten approved product installers for the same operating system.
5. Verifies each product's versioned installer names and creates/re-reads its SHA-256 manifest.
6. Collects the Suite and ten product outputs into the native platform folder.

## Expected local output

| Host | Suite outputs | Ten product outputs |
| --- | --- | --- |
| Windows | x64 NSIS installer (.exe) | 10 x64 NSIS installers (.exe) |
| macOS | Universal DMG, PKG and ZIP | 10 × universal DMG, PKG and ZIP |
| Linux | AppImage and Debian package (.deb) | 10 × AppImage and Debian package (.deb) |

Files are collected under `release/Windows`, `release/macOS` or `release/Linux`. Product folders and their individual checksum manifests are under `release/apps/<platform>/<product-id>`.

The script does not upload artifacts, create a GitHub Release or publish anything. Review the generated files and checksums before sharing them. Local builds are unsigned unless signing credentials are already configured. Unsigned macOS applications may show a Gatekeeper warning, and unsigned Windows installers may show a SmartScreen warning. A successful unsigned build is not the same as a signed and notarised production release.

This command verifies only the operating system where it runs. It does not claim that other operating systems have passed, and it does not replace live installation, first-launch, upgrade, removal or data-preservation acceptance tests. The complete release workflow combines the three native outputs and runs the 66-file cross-platform integrity gate described in [CROSS-PLATFORM-RELEASE-VERIFICATION.md](CROSS-PLATFORM-RELEASE-VERIFICATION.md).

## No-cost GitHub Actions runners

The manual installer workflow uses private self-hosted runners instead of GitHub-hosted runners. This avoids consuming paid hosted-runner minutes and keeps source code on computers controlled by the project owner.

Register one runner for each required platform in the repository's **Settings → Actions → Runners** page:

- **macOS:** labels `self-hosted`, `macOS`, `ARM64` (the existing Apple-silicon Mac runner).
- **Windows:** labels `self-hosted`, `Windows`, `X64` (the project Windows PC).
- **Linux:** labels `self-hosted`, `Linux`, `X64` (a Linux x64 computer).

GitHub assigns the standard operating-system and architecture labels when each runner is registered. Do not add a custom label in place of the standard labels above. Keep the runner service active while a build is queued. The installer workflow waits for all three matching runners; if a platform runner is offline or not registered, that platform's job remains queued and the full bundle cannot be collected.

The existing Mac runner can handle the preparation, collection and macOS build jobs. A Windows runner is required for the native Windows installer, and a Linux x64 runner is required for the native Linux packages. Do not substitute a cross-build from another operating system and call it verified. The workflow does not publish a release unless the manual `publish_release` input is explicitly enabled; its default remains disabled.

Runner setup requires access to each physical computer and a one-time registration from the repository settings. Never copy a runner registration token into source files, logs, issues or documentation. Keep all runners private to this repository and do not run untrusted fork pull-request code on them.
