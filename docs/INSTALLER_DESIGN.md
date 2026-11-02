# Brightdesk installer and application management design

Date: 2026-11-03

## Current installer baseline

Brightdesk already has native packaging configuration for:
- Windows: interactive NSIS EXE installer with licence display, install-location choice, desktop shortcut and Start menu entry.
- macOS: DMG, PKG and ZIP targets; the DMG/PKG remain unsigned until signing credentials are configured.
- Linux: AppImage and DEB packages.
- Existing release scripts perform preflight, legal-file checks, artifact verification and SHA-256 manifest preparation.
- GitHub Release publication is a separate manual workflow input and must remain disabled by default.

## Brightdesk installer experience

Create a consistent, original Brightdesk installer identity while respecting each operating system's normal conventions.

### Windows
- Keep the interactive installer rather than one-click installation.
- Present the Brightdesk licence/terms before installation.
- Allow the user to choose the destination folder.
- Offer optional desktop shortcut and create a Start menu entry.
- Register uninstall information and preserve user documents/settings when uninstalling.

### macOS
- DMG: branded background, clear app icon and drag-to-Applications instruction.
- PKG: signed installer package when Apple Developer signing/notarisation credentials are available.
- Universal build should cover Apple silicon and Intel where all native dependencies support both.
- Never claim signed/notarised status when credentials and verification are absent.

### Linux
- AppImage for portable use and DEB for Debian/Ubuntu-family systems.
- Add RPM only when tested packaging and maintenance support exist.
- Respect desktop launchers and user data directories.
- Do not require root for a portable AppImage.

## Installer manager / launcher behaviour

The suite home should list the ten approved products only. For each app, show a short purpose description and truthful state: Available, Installed, Update available, or Planned. Never show Planned as installed or complete.

For managed installs and updates:
1. Resolve the release version and exact OS/architecture asset.
2. Download to a temporary staging location.
3. Verify SHA-256 against a release manifest before opening or installing.
4. Check that the target application is not running before replacement.
5. Preserve user data and settings.
6. Apply the update using the platform's supported installer mechanism.
7. Verify the installed version and launch target.
8. Keep a recoverable prior version or provide a clear repair path if the update fails.
9. Record concise local logs and show actionable errors.
10. Ask before privileged operations and before changing install scope.

No silent privileged install, no hidden background download, and no forced app restart.

## Architecture and release coverage

Keep the current Electron/electron-builder pipeline as the first implementation. The current workflow builds Windows x64, Linux x64 and macOS universal artifacts. Add Windows ARM64 and Linux ARM64 only after every runtime/native dependency has passed architecture-specific CI. Keep separate downloads per operating system and architecture.

Before declaring a platform ready, require:
- clean install test;
- launch test;
- upgrade test from the previous supported version;
- uninstall test;
- data/settings preservation test;
- checksum verification;
- legal notices and licence files;
- code-signing/notarisation verification where claimed.

## Explicit release restriction

Build and upload CI artifacts for inspection, but do not publish a public GitHub Release unless the owner explicitly selects the publish option.
