# Brightdesk changelog

All notable changes to Brightdesk are recorded here. Versions follow the project's release cadence; entries are grouped by release.

## Unreleased — release-readiness work in progress

### Fixed in this change

- Pages → View → Focus Mode no longer references the out-of-scope `isTodo` variable. The unreachable `todo-mode` class toggle was removed from the `renderToolbar()` handler.
- Added `tests/focus-mode.test.js`, a dependency-free static regression test for the Pages Focus Mode handler and its scope.
- Added `docs/RELEASE_GATE.md` to consolidate automated gates, artifact verification, manual QA, dependency decisions and owner sign-off.
- Added `docs/PRODUCT_REPOSITORY_ONBOARDING.md` to define the supported process for populating the Lists and Planner product repositories.
- Added `docs/PRODUCT-REPOSITORIES.md` to distinguish remote repository existence from whether its source is populated.
- Restored `scripts/create-app-repository-seeds.js` in the shared Suite and added a 37-file generated product test set, with suite-only and live-network tests kept out.
- Added canonical product installer artifact names, product-specific desktop identity and shared-engine trade-off wording to generated product packages and READMEs.
- Restored the shared download map and product artifact verifier (`src/standalone-downloads.js` and `scripts/verify-standalone-apps.js`) so generated `verify:product:*` commands resolve.
- Added regression coverage for upgrade preservation, product launch locking, original product artwork, Rust fallback integration and NSIS uninstaller extraction.
- Corrected the preload product allow-list so it matches all ten IDs accepted by the Electron main process.
- Kept the Node-API bridge optional in generated product installers pending its separate architecture and benchmark approval.

### Still pending — not claimed as completed

- The shared Suite quality and Rust workflows passed on commit `60f0f9661c9fb30730cd7d55af63aa8673b46687`. The Node suite reported 231 tests, 226 passed, 0 failed and 5 skipped. The permanent product-folder bundle and remote product updates remain pending.
- Run `npm run repositories:prepare` from the merged shared Suite source to create all ten product folders. The automated test currently creates temporary folders to verify the generator; it does not populate remote repositories.
- Run each generated product's 37-file test command and verify its installer filenames/checksum workflow before pushing any product folder.
- Populate the remote Brightdesk-To-Do, Brightdesk-Workspace, Brightdesk-Lists and Brightdesk-Planner repositories from their generated folders. Their GitHub repositories existed but had empty `main` branches during the 4 November 2026 check.
- Do not add per-PR Linux installer smoke builds while runner allocation remains unreliable and a no-cost workflow is required. Product installer builds remain manual.
- Complete actual Windows, macOS and Linux builds, checksums, legal-file verification, install/upgrade/uninstall QA and the owner-approved release gate before any release is marked ready.

### Security

- The CI audit on commit `60f0f9661c9fb30730cd7d55af63aa8673b46687` reported 21 moderate advisories involving `minimatch` (GHSA-g3hv-75wg-m249) and `uuid` (GHSA-w5hq-g745-h8pq). The `npm audit --audit-level=high` step passed because no high-or-critical finding was reported; this does not clear the moderate findings.
- No remediation or owner-approved exception is claimed. The release remains blocked until a compatible dependency fix is tested and the audit is clean, or an authorised owner records a time-limited exception with evidence and a remediation plan.

### Known limitations

- GitHub Actions runner allocation remains under investigation in [Brightdesk-suite issue #23](https://github.com/connormolloy12/Brightdesk-suite/issues/23). The self-hosted Mac quality-gate proposal is [PR #42](https://github.com/connormolloy12/Brightdesk-suite/pull/42); its existence does not establish that a successful run occurred.
- The Focus Mode source fix and regression test are in [PR #43](https://github.com/connormolloy12/Brightdesk-suite/pull/43). They are not yet merged into `main`.
- The Rust core and Node-API bridge must be treated separately. Do not claim runtime performance improvements or approve shipping the bridge until its architecture is reconciled with project direction and representative CPU-heavy benchmark/parity evidence exists.
- Product installer readiness is not established by repository exports or source-level checks. Actual platform builds, checksums, legal-file verification, installation, upgrade and uninstall QA are still required.
- Product README shared-engine trade-off wording is pending the generator update described above.

## Release history

Previous releases, if any, are recorded in GitHub Releases. This in-tree changelog records work from this release-readiness effort forward. Do not convert pending items above into completed release notes until the changes are merged, regenerated and verified.
