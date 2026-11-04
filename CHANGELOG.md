# Brightdesk changelog

All notable changes to Brightdesk are recorded here. Versions follow the project's release cadence; entries are grouped by release.

## Unreleased — release-readiness work in progress

### Fixed in this change

- Pages → View → Focus Mode no longer references the out-of-scope `isTodo` variable. The unreachable `todo-mode` class toggle was removed from the `renderToolbar()` handler.
- Added `tests/focus-mode.test.js`, a dependency-free static regression test for the Pages Focus Mode handler and its scope.
- Added `docs/RELEASE_GATE.md` to consolidate automated gates, artifact verification, manual QA, dependency decisions and owner sign-off.
- Added `docs/PRODUCT_REPOSITORY_ONBOARDING.md` to define the supported process for populating the Lists and Planner product repositories.
- Added `docs/PRODUCT-REPOSITORIES.md` to distinguish remote repository existence from whether its source is populated.

### Still pending — not claimed as completed

- Update the current shared `scripts/create-app-repository-seeds.js` generator with the 35-file product test selection, the Focus Mode regression test, canonical artifact names, product-specific `desktopName` values and the product README shared-engine trade-off paragraph.
- Regenerate all ten product folders from the updated suite generator, then run the suite and each product's tests before pushing.
- Update the generator's product workflow only if a smoke-build runner and cost policy are approved. A per-PR hosted Linux installer build is deferred while runner allocation remains unreliable and no-cost operation is required.
- Populate the remote Brightdesk-To-Do and Brightdesk-Workspace repositories from their verified generated source exports. Their GitHub repositories existed but had empty `main` branches during the 4 November 2026 check.
- Populate the Lists and Planner repositories from generated product folders when they are ready and verified.

### Security

- The earlier repository review reported 21 moderate advisories involving `minimatch` (GHSA-g3hv-75wg-m249) and `uuid` (GHSA-w5hq-g745-h8pq). This is historical input, not a verified count for the current release commit.
- No remediation or owner-approved exception is claimed here. Obtain `npm audit --json` from the release commit, investigate the dependency paths, and record remediation or a time-limited approval in the release gate before publication.

### Known limitations

- GitHub Actions runner allocation remains under investigation in [Brightdesk-suite issue #23](https://github.com/connormolloy12/Brightdesk-suite/issues/23). The self-hosted Mac quality-gate proposal is [PR #42](https://github.com/connormolloy12/Brightdesk-suite/pull/42); its existence does not establish that a successful run occurred.
- The Focus Mode source fix and regression test are in [PR #43](https://github.com/connormolloy12/Brightdesk-suite/pull/43). They are not yet merged into `main`.
- The Rust core and Node-API bridge must be treated separately. Do not claim runtime performance improvements or approve shipping the bridge until its architecture is reconciled with project direction and representative CPU-heavy benchmark/parity evidence exists.
- Product installer readiness is not established by repository exports or source-level checks. Actual platform builds, checksums, legal-file verification, installation, upgrade and uninstall QA are still required.
- Product README shared-engine trade-off wording is pending the generator update described above.

## Release history

Previous releases, if any, are recorded in GitHub Releases. This in-tree changelog records work from this release-readiness effort forward. Do not convert pending items above into completed release notes until the changes are merged, regenerated and verified.
