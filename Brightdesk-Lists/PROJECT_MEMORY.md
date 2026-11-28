# Brightdesk project memory

## Runtime and release rules
- Use exactly Node.js 24.22.3 LTS for development, testing and release builds. Never silently downgrade to Node.js 22 or an older Node 24 patch.
- Keep the existing native installer targets: Windows NSIS EXE; macOS DMG, PKG and ZIP; Linux AppImage and DEB.
- Keep release publication manual and owner-approved. Never claim an installer was built or tested unless a real CI/build artifact and verification result exist.
- Preserve user data and settings across upgrades and uninstall.

## Fixed product scope
The approved product scope is exactly ten apps:
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

Outlook, OneDrive and Teams are excluded. Do not add them or any other product.

## Current integrated suite state
- GitHub `main` is the Brightdesk 0.1.0 integrated first-release line; this version reset is intentional and is not an old snapshot to overwrite with the earlier v0.5.1 archive.
- The integrated suite catalogue contains all ten approved apps and marks them available.
- The integrated codebase contains dedicated service/workspace modules and tests for Database, Forms, Lists, Planner, To Do and Workspace, in addition to Pages, Sheets, Decks and Notes.
- The suite is local-first. Do not claim cloud collaboration, remote sync or Microsoft service integration.
- “Available” means the app has a usable integrated local-first workflow; it does not mean full feature parity with commercial office products.
- PR #15 configures suite and individual desktop-installer targets for all ten approved products. Treat installer readiness as unverified until platform builds and artifact checks pass.
- The App Centre already shows all ten app cards and SVG preview artwork. The original Brightdesk master mark now appears in the sidebar and Product Centre, and the App Centre has grid/list view selection with a locally remembered preference.

## Source lineage and archive handling
- The recovered v0.5.1 Linux Installer CI Hardening archive is an earlier four-core-app development snapshot. It is useful historical material for Node 24 setup, legal gates and installer scripts, but it must not replace the current integrated GitHub `main` branch.
- The v0.1.0 archive in the Library is also a historical four-app snapshot. The connected GitHub `main` branch contains later integrated app modules and tests.
- Preserve GitHub history and newer main-branch changes when reconciling source. Do not restore either historical ZIP over the current repository.

## Rust / launcher work
- PR #19 contributes a safe Rust foundation that remains separate from Electron. Do not claim performance improvements until representative benchmarks and parity tests justify an integration.
- Keep Electron as the UI; only consider a narrow Node-API bridge for measured CPU-heavy work.
- Keep Rust core checks separate from the JavaScript suite.

## Installer work
- PR #15 configures separate desktop-installer builds and repository seed folders for all ten approved products. The seed generator does not create or publish remote repositories.
- Its installer workflow uses native hosted Ubuntu, Windows and macOS runners. Installer readiness still requires successful platform builds, legal-file checks, checksums and release tests.
- Keep release publication manual and owner-approved.

## Design and ownership
Brightdesk is an independent desktop product with original names, code, artwork, interface and installer identity. Learn from common productivity patterns and public capability descriptions, but do not copy Storytold or Microsoft source code, logos, artwork, distinctive layouts or proprietary assets.

## Testing and background quality
- Keep the exact ten-app catalogue and excluded-product checks.
- Run the full Node test suite, JavaScript syntax checks, licence verification, release preflight and Brightdesk static REA Bench for meaningful source changes.
- Rust changes must pass `cargo fmt --check`, Clippy with warnings denied and `cargo test`.
- Cross-platform builds must run on native Windows, macOS and Linux runners and include installation, first-launch, upgrade, rollback and uninstall smoke tests.
- Scheduled quality checks are useful, but they do not replace verified CI results. Investigate failed or runner-less Actions runs before calling a change complete.

## Current known release blockers
- The latest main and pull-request workflow attempts on 2026-11-03 failed before any job step ran (GitHub returned runner_id 0 and no steps). The latest workflow has been changed to hosted runners, but GitHub still did not allocate a runner.
- The prior post-integration main build on 2026-11-01 completed Windows, macOS and Linux build/verification jobs successfully.
- No verified current release artifact set has been produced from the latest main commit or the new ten-product installer workflow.
- Confirm GitHub Actions availability/minutes, then verify Node.js 24.22.3, dependency lock, licence audit, full tests and all target installer smoke tests before release.
- Signing/notarisation must be reported accurately; never claim signed status without actual credentials and verification.
