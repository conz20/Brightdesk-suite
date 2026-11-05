# Local release verification

GitHub Actions is configured to use the existing private self-hosted Mac runner for the pull-request test suite. This local script is a no-hosted-runner alternative for building and verifying the full Brightdesk Suite plus all ten products on the computer you already own.

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
