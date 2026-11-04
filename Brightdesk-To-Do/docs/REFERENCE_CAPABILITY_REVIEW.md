# Independent capability review: Storytold reference

Date: 2026-11-03

## Approach
This is a clean-room review of public repository descriptions and documentation. It is not a source-code port. Brightdesk keeps its own source, architecture, names, interface, icons, installer experience and release identity. No third-party code or assets are introduced.

## Capabilities worth adopting

| Reference capability | Why it matters | Brightdesk adaptation |
| --- | --- | --- |
| One launcher/catalogue | One place to manage a suite | Brightdesk home showing exactly ten approved apps, descriptions, installed/available state and open actions |
| Installed/latest version state | Understandable maintenance | Version and update status per component; no silent replacement |
| OS/CPU-aware downloads | Correct package selection | Detect OS and architecture, offer matching verified packages |
| SHA-256 verification | Detect corruption or substitution | Verify release manifest before installation and retain result |
| Install/update lifecycle | Less manual maintenance | Download, verify, stage, check running apps, update and recover on failure |
| Engine/UI separation | Performance without rewriting screens | Keep Electron UI; move measured hot paths into Rust behind a narrow interface |
| Automated quality gates | Avoid shipping known failures | Format, lint, tests, dependency/licence audit, package verification and cross-platform builds |
| Honest compatibility reporting | Avoid false parity claims | Publish capability and file-format support for each approved app |

## Brightdesk product boundary
The approved catalogue remains exactly: Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace.

Do not add Outlook, OneDrive, Teams or any other application. Do not claim cloud collaboration, online sync or Microsoft service integration unless separately implemented and approved.

## Existing strengths to preserve
- Electron desktop shell and Node.js 24.22.2 development pin.
- Native installer targets: Windows NSIS EXE, macOS DMG/PKG/ZIP, Linux AppImage/DEB.
- Existing licence verification, release preflight, artifact verification and SHA-256 preparation scripts.
- Manual-only GitHub Release publishing.
- Original Brightdesk naming and local-first direction.

## Priority gaps
1. A useful suite launcher/catalogue with honest per-app readiness and installed state.
2. A verified update/install lifecycle with checksum validation, staged replacement and recovery.
3. Original, consistent app icons and visual tokens across launcher, installer and app windows.
4. A Rust performance pilot for a measured hot path, with Electron retained as the UI.
5. Expand the build matrix to supported CPU architectures only after dependencies and native modules are verified.
6. Add end-to-end install/upgrade/uninstall smoke tests on clean Windows, macOS and Linux runners.

## Explicit non-goals
- No copying Storytold logos, app icons, screenshots, UI layouts, source code or proprietary assets.
- No wholesale rewrite in Rust before benchmarks justify it.
- No silent auto-update or privileged installation.
- No additional apps or cloud services.
- No public release until the owner explicitly approves it.
