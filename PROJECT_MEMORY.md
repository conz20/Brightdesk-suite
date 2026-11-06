# Brightdesk project memory

The standing project requirement is to use exactly Node.js 24.22.2 LTS for development, testing and release builds.

The approved product scope is fixed at ten apps:
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

All ten approved app modules are integrated into the main Brightdesk suite. The codebase includes dedicated feature modules, service/workspace modules where appropriate, and automated tests. Integration is not the same as final product acceptance: real user workflows, accessibility, persistence, upgrades, uninstall and platform installers still require verification.

Outlook, OneDrive and Teams are excluded. Do not add them.

Brightdesk is an independent desktop product with original branding and implementation. Keep installers native to their target operating systems. Keep work within free/no-cost tooling. Do not request payment details, enable paid services or publish a release without explicit owner approval.

Read README.md before each development stage and update it as work progresses. Do not claim tests or builds passed unless they were actually run successfully.

## Permanent cross-platform parity requirement

Brightdesk is one product ecosystem across Windows, macOS and Linux. The Suite and all ten individual products must use the same approved Brightdesk design contract, feature set, source revision, versioned release train, file compatibility, update policy and support standards. Use native operating-system packaging only where required; platform differences must not remove features or create a different product interface.

The Microsoft 365-inspired office workflows and Adobe-inspired creative/publishing workflows must be available consistently in the approved ten products. Keep Brightdesk branding and implementation original. Do not add Outlook, OneDrive, Teams or other products without explicit owner approval.

The Suite and individual product packages must share the canonical implementation and release version. Every candidate release must build and verify the Suite plus all ten individual products on native Windows, macOS and Linux runners, validate checksums and legal files, and pass install, launch, persistence, import/export, update, repair and uninstall checks on each platform. The update channel must work for both Suite and individual product installs. Uninstall must preserve documents, projects, creative assets and settings by default, and remove only the selected product unless the user explicitly approves data deletion.

Native installers and uninstall mechanisms may differ by OS, but download selection, product identity, consent, install/update status, recovery, data preservation and user guidance must be equivalent. Do not claim cross-platform parity or release readiness without successful current-head evidence for every build target and operating system. See docs/CROSS_PLATFORM_PARITY_AND_RELEASE_CONTRACT.md.

## Integration and source-parity checkpoint — 5 November 2026

Suite PR #60 branch `fix/all-ten-products-after-upgrade` is now synchronised with the current `main` branch. A normal two-parent merge commit `6da72ab8bacda50e73e5d252ed9c38e0865720e7` preserves previous branch head `9b9b40a352ed3544b90902553400bb82aa7fdd74` as its first parent and current main `eea967587ec872db44c3cc3b53373eae0b99d1db` as its second parent. This was a non-force update. The current comparison is 117 commits ahead and 0 behind; GitHub reports the draft PR as mergeable. Keep it draft and unmerged pending owner review and current-head validation.

The source lock contains thirteen feature modules across all ten approved product repositories. Direct GitHub blob comparisons at source-bearing commit `3c9e2fbfa836e76e92bcb53a52ffbc0853fb5481` confirmed all thirteen upstream files, Suite vendor copies and lock SHAs match. Comparison from that revision through merge commit `6da72ab8bacda50e73e5d252ed9c38e0865720e7` shows no changes to the source lock or any of the thirteen vendored feature modules, so the 13/13 source-file result remains applicable to the merged branch. This is module-level source parity only; it does not establish complete UI-shell parity, all-ten-product packaged runtime acceptance, or release readiness.

Validation completed on the content-identical synchronised revision `f23bb31086674843043ef0727770c95d70e4ca85`: quality gate [41996165480] passed Node.js 24.22.2, 257 Node tests (252 passed, 0 failed, 5 skipped), 2 Vitest tests, the 13-module source-lock check, release preflight READY and npm audit with 0 vulnerabilities. Rust Node-API [41996165464] also passed its Rust formatting, Electron main syntax, Clippy, 12 Rust/native tests, Node-API addon build and native bridge tests. Standard Suite CI [41996165582] was still in progress at last poll. README freshness [41996165648] failed before any steps and has no readable logs; classify it as an unexplained runner/job-start failure rather than a confirmed test or README defect. A documentation-only status refresh follows this validated revision and must receive its own checks. Continue with fresh checks under Node.js 24.22.2, source-lock verification, full `npm test`, build and release preflight. Do not merge, tag or publish until the remaining visual, runtime, accessibility and native Windows/macOS/Linux acceptance checks pass. Keep all README files updated with verified changes.

## Branch synchronisation — resolved 5 November 2026

The previous divergence blocker is resolved. Nine incoming `main` commits were brought into the integration branch using a normal two-parent merge commit, with five overlapping files reviewed and combined. The first-run experience test retains both the updated Windows/macOS/Linux Terms agreement assertions and the Suite's ten-product migration coverage. No force-push or merge of the pull request was performed. The PR remains a draft, open and unmerged.
 
## macOS universal packaging compatibility — 5 November 2026

The user ran `npm run dist:mac` in `Brightdesk-suite-pr60-verification` on macOS. The Rust Node-API addon compiled for x64 and arm64, and licence verification passed for 511 installed packages. Both architecture-specific Electron packaging steps completed. The universal merge then failed in `@electron/asar` 3.4.1 with `(0, minimatch_1.default) is not a function`. The lockfile shows the security-patched `minimatch` 11 override intended for `app-builder-lib` is also reaching the older ASAR dependency during universal ASAR merge. Do not downgrade to the vulnerable older minimatch line as a workaround.

A regression test was added to require `build.mac.mergeASARs === false`, keep ASAR enabled, and keep `native/brightdesk_engine.node` in `asarUnpack`. The macOS build configuration now disables ASAR merging while retaining the universal x64+arm64 target. The shared JavaScript/resources stay packaged in ASAR; the Rust native addon remains outside it. Root README and cross-platform release contract document this platform-specific packaging choice.

This is a mitigation awaiting local proof, not a completed build fix. The user must pull the updated PR #60 branch, run the focused/full tests, rerun `npm run dist:mac`, and then `npm run release:verify:mac`. Do not call the macOS installer verified until the DMG, PKG, ZIP, terms, MIT licence and third-party notices are all produced and accepted by the artifact verifier. Then launch-test the universal app. PR #60 remains draft and unmerged.

## Suite home and app navigation correction — 5 November 2026

The integrated desktop suite now treats Home as the first-class app centre: it displays all ten approved products with their original preview art, icons, descriptions and direct Open actions. The sidebar keeps all ten product destinations visible in the suite build, and a persistent All apps control returns users to Home from each workspace. Settings is separate for device-local language, dictionaries and update preferences. App discovery is no longer hidden inside Settings.

The suite package already bundles all ten product modules. The app centre explicitly states that separate downloadable product installers are not published yet; do not represent a local module navigation action as a download or installation. Only show Download when a real verified installer URL is configured.

The README and BRIGHTDESK_VISUAL_STANDARD.md were updated with the approved UX and Adobe Creative Cloud Apps / All apps as a high-level navigation reference only. Brightdesk keeps its original visual identity and assets. The UI change has been committed to the open draft PR #60; local test and packaged runtime verification are still pending.
