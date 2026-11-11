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

## No-cost cross-platform GitHub Actions builds

The automated installer workflow uses the existing private Apple-silicon Mac runner. It does not require a separate Windows or Linux computer or additional self-hosted runners.

The Mac runner builds macOS packages natively. It then uses the free, open-source Colima virtual machine with QEMU and a pinned x86_64 Linux build container to produce Linux x64 AppImage/DEB packages and Windows x64 NSIS installers. The container uses the pinned Node.js 24.22.2 runtime and Rust 1.99.1 toolchain. Wine is used for Windows packaging tools such as NSIS.

The Linux container also runs lifecycle smoke checks for all eleven Debian packages: install with `dpkg`, confirm the package is registered, remove it, verify application payload files are gone, and confirm document/settings sentinels remain. Each of the eleven AppImages is checked in portable mode. This is Linux container evidence; no Linux hardware is required from the customer. The Windows container uses Wine/NSIS to install and silently uninstall the Suite and ten products, checks the uninstall registry entry and program files, and confirms document/settings sentinels remain. This is Wine compatibility evidence, not native Windows OS certification, and the silent smoke test does not exercise the interactive Terms page. Native Windows-specific behaviours that Wine cannot prove remain unverified. The packaged application startup checks also require the native Rust Node-API addon: the Mac runner and Linux container run the native-required Rust tests, while Wine starts each Windows package with `BRIGHTDESK_REQUIRE_NATIVE_ENGINE=1`. This does not replace native Windows OS acceptance.

Colima, Docker CLI and QEMU are installed through Homebrew when missing. Docker Desktop is not installed or required. Intermediate platform files remain in the Mac runner workspace; the build does not upload Actions artifacts, avoiding the repository's Actions artifact-storage quota. Release publication is a separate manual selection and remains disabled by default.
