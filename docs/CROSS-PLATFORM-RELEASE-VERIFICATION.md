# Cross-platform release verification

This document defines how Brightdesk builds and verifies the Suite plus all ten approved products without requiring the customer to own or operate Windows or Linux hardware.

## Build architecture

All automated builds run on the existing private Apple-silicon Mac runner. No GitHub-hosted runner, separate Windows computer or separate Linux computer is required.

| Target | Build method | Outputs |
| --- | --- | --- |
| macOS | Native build on the Mac runner | Suite plus ten products; universal DMG, PKG and ZIP packages |
| Linux x64 | Pinned x86_64 Linux container inside Colima/QEMU | Suite plus ten products; AppImage and Debian (.deb) packages |
| Windows x64 | Windows GNU Rust cross-compilation and Electron Builder/NSIS inside the same Linux container, using Wine | Suite plus ten x64 NSIS (.exe) installers |

The Colima profile uses the open-source QEMU virtual-machine backend. The Docker CLI talks to the profile-specific Colima context. The build container image is pinned by digest and uses Node.js 24.22.2, Rust 1.99.1, the Windows GNU target, MinGW and Wine. Node.js is downloaded only after its published SHA-256 checksum is verified. Docker Desktop is not installed or required.

Separate persistent container volumes keep Linux dependencies, Electron downloads, Electron Builder caches and the Cargo registry away from the Mac host's `node_modules`. The workflow does not upload intermediate Actions artifacts, avoiding additional use of the repository's exhausted Actions artifact-storage quota.

## Installer and package checks

For each platform, the workflow verifies:

1. Expected versioned filenames, legal documents and non-empty installer files.
2. SHA-256 manifests for the Suite and each of the ten products.
3. The exact ten product identities and all 66 Suite/product installer/archive outputs.
4. Clean release assembly that copies only the three platform folders, ten product folders per platform and the committed dependency lock. Temporary unpacked build folders and symlinks are excluded.
5. Final version, lockfile, folder, filename and checksum consistency in `release/verified-bundle`.

File and checksum checks prove that the correct build outputs were produced and transferred; they do not by themselves prove installation or removal.

## Install, repair, removal and data-preservation smoke tests

### Linux

Inside the x86_64 Linux container, the lifecycle suite installs all eleven Debian packages with `dpkg`, verifies package registration, launches the installed app in packaged-startup smoke mode under Xvfb, reapplies the same package to exercise repair/reinstall, removes the package and checks that the application payload is gone. It also places a preservation sentinel under the app's actual Electron user-data directory.

Each AppImage is extracted using the AppImage runtime's `--appimage-extract` option and its packaged `AppRun` is launched in the same startup-smoke mode. The temporary portable file and extracted test directory are removed, while the document and per-product settings sentinels must remain. No FUSE device or privileged Docker capability is required for this extracted test path. See [AppImage no-FUSE guidance](https://docs.appimage.org/user-guide/troubleshooting/fuse.html).

Electron's Linux `userData` path is based on `$XDG_CONFIG_HOME` (or `~/.config`) plus the application name; Brightdesk sets that name from each package's `productName`. The test uses this real per-product path rather than an unrelated placeholder folder. See [Electron app path documentation](https://www.electronjs.org/docs/latest/api/app).

### Windows

Inside the Linux build container, Wine/NSIS installs the Suite and each of the ten products in an isolated temporary Windows prefix. The test locates the registered uninstaller and installed executable, launches the packaged app in startup-smoke mode, creates a preservation sentinel beneath the actual `%APPDATA%/<product name>` Electron user-data folder, reinstalls the same package version, and runs the uninstaller. It verifies that the program executable, remaining program files and uninstall registry entry are removed while the user's document and product user-data sentinel remain.

This is Windows packaging and compatibility smoke evidence under Wine. It is **not native Windows operating-system certification**. Wine does not prove every Windows-specific integration or the interactive NSIS Terms acceptance/decline experience. Those remain separate acceptance requirements.

The second install of the same version tests a reinstall/repair path; it is not an older-version-to-newer-version upgrade test.

### macOS

The Mac runner builds the universal packages natively. Real installation, first-launch Terms acceptance/decline, older-to-newer upgrade, repair, uninstall and data-preservation checks must still be completed on macOS before release acceptance.

## Release controls and acceptance boundaries

The pull-request verification workflow uses the private Mac runner and checks the current PR source. The manual release workflow uses the same runner and does not automatically publish. GitHub Release publication is separately gated by the manual `publish_release` input, which defaults to false and is allowed only from `main`.

The workflow does not claim a build, install, upgrade or uninstall has passed unless its current-head run records that evidence. A Windows Wine pass is not described as a native Windows pass. A same-version reinstall is not described as an upgrade. The interactive Windows Terms page is not described as tested by a silent installer run.

The release remains blocked until the latest PR head passes its Mac-runner build and automated tests, all 66 output checks succeed, the Linux package/AppImage smoke tests pass, the Windows Wine/NSIS smoke tests pass, and native macOS install/upgrade/repair/uninstall/data-preservation acceptance is complete. Older-to-newer upgrade tests and the Windows interactive Terms flow remain explicit acceptance items; no package should be described as published or fully verified before they pass.
