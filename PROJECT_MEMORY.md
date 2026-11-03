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
- The default `main` branch still restricts separate single-app installers to Pages, Sheets, Decks and Notes. The active working branch below extends independent packaging to all ten approved apps.
- The active launcher branch uses original per-app SVG icons in its App Centre and navigation, with the Brightdesk master mark. Continue checking the visual system, accessibility, and native installer icon output on each platform.

## Source lineage and archive handling
- The recovered v0.5.1 Linux Installer CI Hardening archive is an earlier four-core-app development snapshot. It is useful historical material for Node 24 setup, legal gates and installer scripts, but it must not replace the current integrated GitHub `main` branch.
- The v0.1.0 archive in the Library is also a historical four-app snapshot. The connected GitHub `main` branch contains later integrated app modules and tests.
- Preserve GitHub history and newer main-branch changes when reconciling source. Do not restore either historical ZIP over the current repository.

## Current Rust / launcher work
- PR #19 (`feature/storytold-inspired-engine-launcher`) is the single active review path for the clean-room Storytold capability review, original Brightdesk master SVG, brand system, installer/update design and the initial Rust core.
- The Rust crate is a standalone safe-Rust foundation and is not yet linked into Electron. Do not claim a performance improvement until a representative benchmark and parity tests prove it.
- Keep Electron as the UI. Add Rust through a narrow Node-API bridge only for measured CPU-heavy operations; do not rewrite the full suite in Rust just to match another project's technology.
- PR #20 was a duplicate foundation PR and has been closed in favour of PR #19.
- PR #15 prepares separate installer/repository folders for all ten products. It is still a draft and needs a careful review of the generated product repositories and native CI approach before merging. Do not assume its standalone products are already published or its installers built.

## Design and ownership
Brightdesk is an independent desktop product with original names, code, artwork, interface and installer identity. Learn from common productivity patterns and public capability descriptions, but do not copy Storytold or Microsoft source code, logos, artwork, distinctive layouts or proprietary assets. Review third-party licences before any code reuse.

## Testing and background quality
- Keep the exact ten-app catalogue and excluded-product checks.
- Run the full Node test suite, JavaScript syntax checks, licence verification, release preflight and Brightdesk static REA Bench for meaningful source changes.
- Rust changes must pass `cargo fmt --check`, Clippy with warnings denied and `cargo test`.
- Cross-platform builds must run on native Windows, macOS and Linux runners and include installation, first-launch, upgrade, rollback and uninstall smoke tests.
- Scheduled quality checks are useful, but they do not replace verified CI results. Investigate failed or runner-less Actions runs before calling a change complete.

## Current known release blockers
- The latest main-branch installer workflow run on 2026-11-02 failed before any job step ran (GitHub returned runner_id 0 and no steps). The prior post-integration main build on 2026-11-01 completed Windows, macOS and Linux build/verification jobs successfully.
- No verified current release artifact set has been produced from the latest main commit.
- Confirm current Node.js 24.22.2 runner, real package lock, dependency install, licence audit and all target installer smoke tests before release.
- Signing/notarisation must be reported accurately; never claim signed status without actual credentials and verification.
- Feature-branch quality workflow runs on 2026-11-03 (including run 41566954782 at the current feature-branch head) completed as failures before any job step was recorded; the jobs returned empty step lists and no downloadable logs. No Node.js tests, release preflight or audit results were produced by these runs. Treat this as an Actions runner/workflow-start blocker, not evidence that source tests passed or a diagnosed source-code failure. Re-check Actions availability before drawing conclusions.



## Full suite launcher direction — 2026-11-03
- The Suite launcher is its own installed desktop application. The ten individual Brightdesk apps must also be separately buildable/installable on Windows, macOS and Linux.
- The launcher must allow a person to add selected apps to the in-suite navigation, open those apps inside Brightdesk, and separately download/install each app as its own desktop application. The launcher itself must never silently mark all ten apps as installed.
- The App Centre begins with zero selected apps. Users can select apps, skip setup and return later. UI wording must distinguish “Add to suite” from “Download desktop app”.
- Every app has an original individual SVG icon in `src/assets/app-icons/`. Never use plain letters as the final app icon treatment.
- Separate build support is required for exactly Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace. Standalone app channels must be unique per app to prevent updater metadata collisions. Suite launcher uses the stable `latest` channel.
- Update checking and downloading are opt-in. A user must always approve installation by pressing **Next**; never install automatically on quit. Present current and target versions. Update notifications need a Review action and a dismiss X.
- Brightdesk is strictly ad-free, subscription-free and free to use: no ads, sponsorships, subscriptions, paid tiers, paid licence fees, activation keys, serial numbers or locked features. Keep third-party open-source attribution/notices where legally required; those notices do not create a user fee.
- Current implementation branch: `feature/brightdesk-original-suite-experience`, based on `feature/complete-suite-launcher-apps` and the clean-room foundation in PR #19 (`feature/storytold-inspired-engine-launcher`). Changes on this branch are not yet merged or tested on the user's Mac. Do not confuse repository commits with the user's installed build.
- The launcher selection correction, SVG family, refreshed App Centre styling, standalone package support and update controls need local full-suite tests and native Windows/macOS/Linux build/install tests before another user-facing installer is produced.


## Confirmed product design direction — 2026-11-03

- The target is the professional visual quality and creative polish associated with Adobe, combined with the familiar productivity workflows associated with Microsoft 365. This is inspiration only: Brightdesk must have its own visual identity, navigation, layouts, interactions, typography, icon family and assets.
- The Suite launcher is a separately installed app. Each selected standalone app is installed as an independent operating-system app; users can launch it directly or open it from the Suite launcher.
- The App Centre must show all ten approved products with original SVG artwork, clear descriptions and honest states. First-run selection begins empty. Do not interpret a previous release's automatically selected app list as user consent.
- Distinguish adding an app to the in-suite navigation from downloading its separate desktop app.
- The App Centre first-run selection now has **Select All** and **Clear All** controls for choosing which apps appear inside the Suite. These controls do not install standalone OS packages; the separate multi-app installer/modify wizard remains an open release requirement.
- The true native installer experience still needs an explicit platform-by-platform review. The Suite installer currently builds as its own app and individual app installers are built separately; do not claim a combined installer selection wizard exists until implemented and verified on Windows, macOS and Linux.
- The update settings controller has one owner in `src/app.js` and static markup in `src/index.html`. The obsolete duplicate `src/update-settings.js` controller has been deleted because it duplicated controls and exposed a prohibited install-on-quit setting. Suite update notifications now route **Review update** to the Updates Centre. The approved path is manual or opt-in check/download, then explicit **Next** to start the verified installer. Automatic installation remains disabled.
- Brightdesk must remain ad-free, subscription-free and free to use. There are no Brightdesk licence fees, activation keys, serial numbers, paywalls, paid tiers or paid updates. Keep third-party licence notices where required.
- Recent feature-branch commits remove the duplicate update-settings controller, update stale tests to cover all ten standalone app packages, and add a Node.js 24.22.2 quality workflow. These source changes are committed, but no test/build success is claimed until a successful runner result and actual native platform outputs are available.


## Product-experience research — 2026-11-03

- Added `docs/REFERENCE_PRODUCT_EXPERIENCE_REVIEW.md`, a clean-room review of public Adobe Creative Cloud and Microsoft 365 product discovery, download, install, app-management and update workflows. The same doc specifies Brightdesk's original target Download Centre, cross-platform installation architecture, catalogue, manifest, registry, IPC boundary, delivery priorities and native release gates.
- Adopt common user-facing patterns only: catalogue vs installed apps, product-specific details/actions, platform-aware downloads, per-app versions, visible update controls and preference-preserving uninstall. Do not copy logos, assets, source, layouts, paid accounts, subscription systems, cloud services or any unapproved app.
- Linux must be a first-class Brightdesk target. The reviewed official Adobe and Microsoft desktop installation material describes Windows and macOS desktop clients, not a native Linux equivalent. Brightdesk currently targets AppImage and DEB; more formats need native verification.
- Source-level gaps to keep visible: the native multi-app setup/Modify wizard is unfinished; the release manifest and platform package flow now share per-app versions and checksum metadata but still need real published-release tests; the customer-facing no-login release host is unconfigured because the source repository is private; packaging currently includes the broad `src/**/*` tree for each standalone app.
- The REA guide skill is available, but no REA runtime MCP tools are registered in this session. Public pages and official docs were reviewed; no Adobe/Microsoft binaries, hidden endpoints or live clients were reverse engineered. The 12ui design CLI installation attempt timed out, so no mockup or visual implementation is claimed. Do not substitute improvised CSS for an approved visual design.
- Next design work should create and inspect original Brightdesk candidates for Home, Apps, Downloads, Updates and Settings, then implement the chosen direction across the launcher and platform installers. Preserve all ten apps and the ad-free, subscription-free, no-user-licence-fee rule.


## Adobe / Microsoft reference review and stacked PR — 2026-11-03

- The clean-room review is saved at `docs/REFERENCE_PRODUCT_EXPERIENCE_REVIEW.md` and linked from README. It evaluates public app discovery, platform downloads, installed-app management, version display, updates, notifications and uninstall preference choices from Adobe Creative Cloud and Microsoft 365.
- Brightdesk's target adds a dedicated Downloads area to Home, Apps, Updates and Settings. It must show OS/architecture-aware individual downloads for the exact ten approved apps and a separate Suite installer, with a later Modify installation flow.
- The App Centre selection and the native installer selection remain separate concepts. The former selects apps that appear in the Suite; the latter installs selected standalone OS applications.
- The current source review identified installer-time registration, shared release-manifest/channel resolution and broad per-app packaging as further engineering items. See the report for evidence, exact proposed architecture and acceptance tests.
- PR #22 (`feature/brightdesk-original-suite-experience` -> `feature/complete-suite-launcher-apps`) is a stacked draft on PR #21. Do not merge it or publish installers until native CI is healthy, tests pass, and the user approves the resulting installer flow.
- The 12ui design CLI install timed out in this session; no new UI mockup or pixel-aligned implementation has been produced. The REA guide skill is available but no REA runtime tools are registered here; the reference review is limited to public pages, official documentation and source-level Brightdesk observations.


## Applied Adobe / Microsoft public experience lessons — 2026-11-03

- The Suite now has separate Home, Apps and Downloads destinations. Home separates apps included inside Brightdesk from independently installed desktop apps. Apps has catalogue search and All / In suite / Desktop installed / Not installed filters. Downloads has a Windows / macOS / Linux platform selector.
- For the current computer, standalone packages are downloaded through the main process, staged and checksum-verified before explicit **Next**. For another target OS, the app-download IPC resolves the package from the shared release manifest, validates the supported OS/architecture and trusted GitHub origin, opens that exact URL externally, and displays version, filename and SHA-256. The host OS never launches another platform's installer.
- The shared release manifest records separate Suite and app versions, platform/architecture/package metadata, file size and SHA-256; its generator rechecks actual package bytes against the verified platform checksum files.
- Suite and standalone apps share one update-preference file. Existing app-level settings migrate on first read. Automatic installation is always forced off.
- The launcher registry combines startup self-registration with OS discovery of macOS bundles, Windows install locations/registry entries, Linux desktop entries/DEB package records and AppImage desktop entries. Home's refresh updates the same registry without leaving Home. A reinstalled app at a new path replaces the stale entry.
- Standalone app update windows check and show only their own app version. The Suite checks all installed standalone apps.
- CI uses pinned Ubuntu 24.04, Windows Server 2025 and macOS 15 runner labels. The security audit also uses Ubuntu 24.04. The feature quality job syntax-checks all shared release, discovery and preference modules.
- The combined native multi-app installer/Modify wizard is still a release blocker. The Downloads centre is a cross-platform individual installer catalogue, not the final combined NSIS/macOS PKG/Linux component-selection wizard.
- The connected source repo is private, while the in-app updater requests unauthenticated public GitHub release metadata. A separate public Brightdesk release repository or public download host must be configured before end users can download or update without an account. Do not make the source repository public without explicit approval.
- The latest Actions attempts continue to fail before any step starts with `runner_id: 0`. Stable runner labels did not fix account/repository runner allocation. The likely causes include Actions billing/usage limits, a spending/budget hard stop, a billing hold, or a plan limitation for private repositories; this connector cannot inspect account billing. Owner needs to check GitHub Settings -> Billing & licensing -> Usage/Budgets and repository Settings -> Actions -> General. This is GitHub CI usage, not a Brightdesk customer fee.


## Runner and cross-platform download work — 2026-11-03

- Added an issue to track GitHub Actions runner allocation: #23 https://github.com/connormolloy12/Brightdesk-suite/issues/23. The latest workflow attempts continue to be created with `runner_id: 0`, no runner name and empty step lists. Retrying and pinning the runner images did not fix the problem. Do not claim tests passed.
- All current feature quality, installer and security workflows use stable supported runner labels. The feature quality workflow syntax-checks the shared release manifest, update preferences, standalone discovery and release generator in addition to the Electron entry points.
- GitHub's current documentation says private repositories consume plan-based included compute and additional Actions usage is billed; Actions is unavailable for private repositories on legacy per-repository plans. A spending budget can stop metered Actions usage. Owner-side billing, budget and repository Actions settings still need review; connector cannot access account billing.
- Downloads now has a platform selector for Windows, macOS and Linux. Current-computer packages are staged and checksum-verified before Next. Other-platform packages are resolved through the shared manifest, limited to the built architecture, opened via the OS browser, and their version, filename and SHA-256 are displayed. The host will not run an installer for another OS.
- Linux discovery now recognises standalone DEB/package desktop entries and portable AppImage desktop entries. The launcher refresh reconciles moved and upgraded installs and has a Home refresh action.
- The source repository is private. The customer-facing resolver uses unauthenticated public GitHub release metadata; a separate public release repository or download host is required before end users can download or update without sign-in. Do not expose the private source repository as a public distribution endpoint or make it public without owner approval.
- PR #22 remains a draft stacked on PR #21, with the latest source on `feature/brightdesk-original-suite-experience`. The branch has not been merged to main. Node.js 24.22.2 test execution and native platform build/install verification remain outstanding.
