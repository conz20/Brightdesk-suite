# Brightdesk project memory

## Runtime and release rules
- Use exactly Node.js 24.22.2 LTS for development, testing and release builds. Never silently downgrade to Node.js 22 or an older Node 24 patch.
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
- The main Electron process and standalone build configuration still restrict separate single-app installers to Pages, Sheets, Decks and Notes. The integrated suite contains all ten apps.
- The App Centre already shows all ten app cards and SVG preview artwork. The original Brightdesk master mark now appears in the sidebar and Product Centre, and the App Centre has grid/list view selection with a locally remembered preference.

## Source lineage and archive handling
- The recovered v0.5.1 Linux Installer CI Hardening archive is an earlier four-core-app development snapshot. It is useful historical material for Node 24 setup, legal gates and installer scripts, but it must not replace the current integrated GitHub `main` branch.
- The v0.1.0 archive in the Library is also a historical four-app snapshot. The connected GitHub `main` branch contains later integrated app modules and tests.
- Preserve GitHub history and newer main-branch changes when reconciling source. Do not restore either historical ZIP over the current repository.

## Rust / launcher work
- PR #19 (`feature/storytold-inspired-engine-launcher`) is the single review path for the clean-room Storytold capability review, original Brightdesk master mark, brand system, installer/update design and initial Rust core.
- The Rust crate is a safe foundation only; it is not yet linked into Electron. Do not claim a performance improvement until representative benchmarks and parity tests prove it.
- Keep Electron as the UI. Add Rust through a narrow Node-API bridge only for measured CPU-heavy operations; do not rewrite the full suite in Rust just to match another project's technology.
- PR #20 was a duplicate foundation PR and has been closed in favour of PR #19.

## Standalone installer work
- PR #15 (`feature/standalone-downloads-all-ten`) prepares separate installer builds for all ten products and a downloadable bundle of ten product repository folders.
- Its installer workflow now uses native hosted Ubuntu, Windows and macOS runners; it no longer depends on an unregistered self-hosted Mac runner or Docker/Wine cross-builds.
- Six product repositories already exist and are populated: Pages, Sheets, Decks, Notes, Database and Forms. Four remote repositories are still missing: Lists, Planner, To Do and Workspace. The seed generator prepares all ten product folders but does not create remote repositories or push code; after the Actions artifact is available, create the four missing repos and populate them from the matching folders. Existing repositories should be synced to the final validated suite source before release.
- PR #15 remains a draft until native CI builds and verifies all platform artifacts.

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
- Confirm GitHub Actions availability/minutes, then verify Node.js 24.22.2, dependency lock, licence audit, full tests and all target installer smoke tests before release.
- Signing/notarisation must be reported accurately; never claim signed status without actual credentials and verification.
