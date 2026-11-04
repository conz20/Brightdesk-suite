# Brightdesk changelog

All notable changes to Brightdesk are recorded here. Versions follow the project's release cadence; entries are grouped by release.

## Unreleased — release-readiness work in progress

### Fixed in this change

- Pages → View → Focus Mode no longer references the out-of-scope `isTodo` variable. The unreachable `todo-mode` class toggle was removed from the `renderToolbar()` handler.
- Added `tests/focus-mode.test.js`, a dependency-free static regression test for the Pages Focus Mode handler and its scope.
- Added `docs/RELEASE_GATE.md` to consolidate automated gates, artifact verification, manual QA, dependency decisions and owner sign-off.
- Added `docs/PRODUCT_REPOSITORY_ONBOARDING.md` to define the supported process for populating the Lists and Planner product repositories.
- Added `docs/PRODUCT-REPOSITORIES.md` to distinguish remote repository existence from whether its source is populated.
- Restored `scripts/create-app-repository-seeds.js` in the shared Suite and added a 38-file generated product test set, with suite-only and live-network tests kept out.
- Added canonical product installer artifact names, product-specific desktop identity and shared-engine trade-off wording to generated product packages and READMEs.
- Restored the shared download map and product artifact verifier (`src/standalone-downloads.js` and `scripts/verify-standalone-apps.js`) so generated `verify:product:*` commands resolve.
- Updated the generated repository handoff instructions to reuse existing GitHub repositories, compare populated remotes and use pull requests instead of creating duplicates or overwriting default branches.
- Added regression coverage for upgrade preservation, product launch locking, original product artwork, Rust fallback integration and NSIS uninstaller extraction.
- Corrected the preload product allow-list so it matches all ten IDs accepted by the Electron main process.
- Kept the Node-API bridge optional in generated product installers pending its separate architecture and benchmark approval.

### Still pending — not claimed as completed

- The current clean-install quality run passed lock verification, `npm ci`, licence checks and source syntax checks. The full test run then exposed two incorrect assertions for the scoped Archiver override key; those assertions are fixed in the current branch. The audit and release preflight were skipped on that run and must be rechecked. The Rust workflow passed formatting, Clippy, Cargo tests, native addon build and native-engine/provider bridge tests.
- The committed dependency lock resolves ExcelJS's `uuid` dependency to 11.1.1 and app-builder-lib's `minimatch` dependency to 11.0.4. The ExcelJS archive chain is moved from `archiver@5.3.2` / `readdir-glob@1.1.3` to `readdir-glob@3.0.0` with scoped minimatch 11.0.4; an integration test creates a ZIP through the existing Archiver API.
- A clean install against the committed lock has passed. The full suite and fresh audit still need a clean CI run after the assertion correction; do not mark dependency verification complete until then.
- The permanent product-folder bundle and remote product updates remain pending.
- Run `npm run repositories:prepare` from the merged shared Suite source to create all ten product folders. The automated test currently creates temporary folders to verify the generator; it does not populate remote repositories.
- Run each generated product's 38-file test command and verify its installer filenames/checksum workflow before pushing any product folder.
- Populate the remote Brightdesk-To-Do, Brightdesk-Workspace, Brightdesk-Lists and Brightdesk-Planner repositories from their generated folders. Their GitHub repositories existed but had empty `main` branches during the 4 November 2026 check.
- Do not add per-PR Linux installer smoke builds while runner allocation remains unreliable and a no-cost workflow is required. Product installer builds remain manual.
- Complete actual Windows, macOS and Linux builds, checksums, legal-file verification, install/upgrade/uninstall QA and the owner-approved release gate before any release is marked ready.

### Security

- Scoped overrides replace ExcelJS's `uuid@8.3.2` with `uuid@11.1.1`, and app-builder-lib's `minimatch@10.2.6` with `minimatch@11.0.4`. A scoped Archiver override also replaces `readdir-glob@1.1.3` with `3.0.0` and pins that branch to minimatch 11.0.4. Compatibility tests cover the workbook round-trip, builder API and archive creation.
- The current lock retains `minimatch@3.1.5` through the legacy `glob` path; the former `readdir-glob@1.1.3` / `minimatch@5.1.9` path is no longer present. The advisory database currently publishes a broad `<11.0.1` range; clarification is tracked in [issue #10811](https://github.com/github/advisory-database/issues/10811).
- The earlier **16 moderate findings** were reported against the previous lock graph and should not be carried forward as the current count. The latest CI did not reach the audit step because the tests failed on incorrect override-key assertions. A full current-lock audit remains pending; keep the release blocker in place until it is complete.
- No owner-approved exception is claimed. Keep release approval blocked until the remaining audit paths are formally reviewed and either cleared by authoritative advisory clarification or covered by a named, time-limited owner exception with evidence and a remediation plan.

### Known limitations

- GitHub Actions runner allocation remains under investigation in [Brightdesk-suite issue #23](https://github.com/connormolloy12/Brightdesk-suite/issues/23). The self-hosted Mac quality-gate proposal is [PR #42](https://github.com/connormolloy12/Brightdesk-suite/pull/42); its existence does not establish that a successful run occurred.
- The Focus Mode source fix and regression test are in [PR #43](https://github.com/connormolloy12/Brightdesk-suite/pull/43). They are not yet merged into `main`.
- The Rust core and Node-API bridge must be treated separately. Do not claim runtime performance improvements or approve shipping the bridge until its architecture is reconciled with project direction and representative CPU-heavy benchmark/parity evidence exists.
- Product installer readiness is not established by repository exports or source-level checks. Actual platform builds, checksums, legal-file verification, installation, upgrade and uninstall QA are still required.
- Product README shared-engine trade-off wording is now in the shared generator. Generated folders still need to be created and checked against each remote repository.

## Release history

Previous releases, if any, are recorded in GitHub Releases. This in-tree changelog records work from this release-readiness effort forward. Do not convert pending items above into completed release notes until the changes are merged, regenerated and verified.
