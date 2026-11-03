# Brightdesk installer and application management design

Date: 2026-11-03

## Current installer baseline

Brightdesk already has native packaging configuration for:
- Windows: interactive NSIS EXE installer with licence display, install-location choice, desktop shortcut and Start menu entry.
- macOS: DMG, PKG and ZIP targets; the DMG/PKG remain unsigned until signing credentials are configured.
- Linux: AppImage and DEB packages.
- Existing release scripts perform preflight, legal-file checks, artifact verification and SHA-256 manifest preparation.
- The integrated suite's original SVG master mark is wired into the Windows, macOS and Linux application icon configuration through electron-builder's SVG conversion support.
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


## Suite launcher and standalone app architecture (2026-11-03)

The Brightdesk Suite launcher is a separate product from the ten standalone desktop apps. Installing the launcher must not silently select or install every app.

The fixed product catalogue is:
- Pages
- Sheets
- Decks
- Notes
- Database
- Forms
- Lists
- Planner
- To Do
- Workspace

The App Centre must start with no apps selected. Users can add individual apps to the in-suite navigation, skip selection and return later, or open the standalone-app download page from each product card. The launcher must distinguish clearly between **Add to suite** (opens the app inside the launcher) and **Download desktop app** (installs the separate OS application).

Every app has an original Brightdesk SVG icon under `src/assets/app-icons/`. All ten apps must be supported by the standalone build scripts and receive distinct application IDs, product names, installer artifacts and update channels. Separate build output directories are used so application artifacts cannot overwrite one another.

Standalone builds use these commands:
- Local Windows builds: `npm run dist:apps:win`
- Local macOS builds: `npm run dist:apps:mac`
- Local Linux builds: `npm run dist:apps:linux`
- Build one app: `npm run dist:app -- <app-id> <win|mac|linux>`
- Release/publish the standalone app set for the current target OS: `npm run release:apps:<win|mac|linux>`

Each standalone app uses its own GitHub update channel named after its app ID (for example, `pages`, `database`, or `workspace`/the actual ID `loop`). The Suite launcher uses the default `latest` channel. This avoids ten applications overwriting one shared update manifest.

Update preferences default to manual checking and manual downloading. Automatic checking and automatic downloading are opt-in. Automatic installation is prohibited: even when downloading automatically, Brightdesk must announce the available version and require the user to press **Next** before installation. Show the installed version and available version together. Notifications must be reviewable and dismissible.

## Commercial and product guarantees

Brightdesk is permanently ad-free, subscription-free and free of activation fees. Do not add adverts, sponsored placements, paid tiers, activation keys, serial numbers, paid licences, subscription prompts, paywalls or locked premium features. Include third-party notices and legally required open-source licence attributions without charging the user.

## Remaining release gates

The launcher UI, app-selection logic, SVG assets and standalone build coverage are source-level work only until local builds and platform-specific install tests pass. GitHub update feeds require actual published release assets and metadata. macOS auto-updating additionally requires valid code signing; macOS distribution still needs signing/notarisation verification. Do not claim Windows, macOS or Linux public release readiness before clean install, launch, update, uninstall and data-preservation tests have passed.
