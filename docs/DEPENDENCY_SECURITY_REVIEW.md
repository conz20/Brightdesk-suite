# Brightdesk dependency security review

**Review date:** 4 November 2026  
**Scope:** the shared Suite dependency lock used by all ten generated product repositories.

## Applied scoped overrides

The current Suite manifest contains three scoped npm override paths:

| Parent package | Dependency | Requested version | Current lock resolution | Reason |
|---|---|---:|---:|---|
| ExcelJS 4.4.0 | uuid | `^11.1.1` | 11.1.1 | Removes the vulnerable uuid 8.3.2 inherited from ExcelJS. Version 11.1.1 is listed as patched by GHSA-w5hq-g745-h8pq and retains CommonJS support; uuid 12 removed CommonJS support. |
| app-builder-lib 26.18.0 | minimatch | `^11.0.1` | 11.0.4 | Moves the app-builder-lib minimatch 10.2.6 dependency to the maintainer's patched 11.0.1 release line. |
| archiver 5.3.2 | readdir-glob (and its minimatch) | `^3.0.0` / `^11.0.1` | 3.0.0 / 11.0.4 | Replaces the legacy readdir-glob 1.x archive path with v3 and scopes minimatch 11 to that upgraded caller. |

These overrides are intentionally scoped to their parent packages. The Archiver override matches the original `readdir-glob@^1.1.2` dependency range, then selects `readdir-glob@3.0.0` and its patched minimatch line. It does not force minimatch 11 onto the separate legacy `glob` consumer.

## Compatibility coverage

`tests/dependency-security.test.js` verifies that:

- ExcelJS resolves uuid 11.1.1 and can load its CommonJS v4 API.
- ExcelJS can write an XLSX workbook and read it back with the overridden uuid.
- app-builder-lib resolves minimatch 11.0.4 or later within the 11.x major line and the `Minimatch` / `minimatch` APIs used by the builder work.
- The root package manifest retains the ExcelJS, app-builder-lib and Archiver/readdir-glob scoped overrides.

The regenerated lockfile was created on the existing self-hosted Mac runner. `npm ls --package-lock-only --depth=0` passed. On the latest clean-install quality run, lock verification, `npm ci`, third-party licence checks, renderer syntax and app-module syntax all passed. The full test job then stopped on two incorrect test assertions that looked up the Archiver override using the resolved version instead of its original dependency-range key; both assertions are corrected on the current branch. The audit and release-preflight steps were skipped because the test step failed. Rust formatting, Clippy, Cargo tests, native addon build and native-engine/provider bridge checks passed in the accompanying Rust workflow.

The **16 moderate findings** below are from the earlier lock graph before the Archiver dependency-path update; that count is not asserted for the current lock. A fresh full audit has not yet run against the current lock because the latest quality job stopped at the test step. The current lock no longer contains `minimatch@5.1.9`, and the patched uuid and app-builder-lib minimatch resolutions remain present. Keep audit status pending until the complete report is generated from this exact lock.

## Remaining minimatch advisory-range question

The current lockfile contains one remaining legacy copy:

- `minimatch@3.1.5` at `node_modules/glob/node_modules/minimatch`, reached through the Electron packaging dependency tree.

The former `readdir-glob@1.1.3` / `minimatch@5.1.9` path is replaced by `readdir-glob@3.0.0`, which resolves to `minimatch@11.0.4` under the scoped Archiver override. The full current-lock audit is still pending, so no new finding count is claimed.

The minimatch maintainer's advisory identifies 10.2.6 as affected and 11.0.1 as patched. The GitHub Advisory Database currently publishes the broader affected range `<11.0.1`, which causes scanner reports to include the older 3.x and 5.x copies.

GitHub Advisory Database issue [#10811](https://github.com/github/advisory-database/issues/10811) is open and requests clarification. Contributors have posted source inspection and bounded tests indicating that minimatch 3.x–6.x do not contain the `firstPhasePreProcess`, `secondPhasePreProcess` or `optimizationLevel` mechanism described by this specific advisory. That evidence is useful for triage, but it is not a formal amendment to the advisory. The older copies remain visible; they have not been silently suppressed or classified as globally safe.

A blanket override to minimatch 11 is deliberately not used. The legacy `glob` dependency branch remains on its existing minimatch 3.x line rather than having a breaking major forced onto it. The minimatch 11 override is confined to app-builder-lib and the upgraded Archiver/readdir-glob branch, and those APIs are covered by the dependency compatibility tests.

References:

- [Minimatch maintainer advisory GHSA-g3hv-75wg-m249](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249)
- [GitHub Advisory Database record for GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)
- [GitHub Advisory Database range clarification issue #10811](https://github.com/github/advisory-database/issues/10811)
- [uuid advisory GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq)
- [uuid 11.1.1 release](https://github.com/uuidjs/uuid/releases/tag/v11.1.1)
- [uuid CommonJS compatibility note](https://www.npmjs.com/package/uuid)

## Release decision

This review records targeted remediation and compatibility tests; it does **not** grant a release exception. Keep the release blocked until a fresh full audit of the current lock is completed and any remaining findings have been reviewed against the published dependency paths, then either:

1. the advisory database clarifies the older minimatch range and the release audit is clean; or
2. the release owner records a named, time-limited exception, affected paths, evidence, impact assessment and remediation/review date in `docs/RELEASE_GATE.md`.

Do not use `npm audit fix --force`; the earlier audit output proposed a breaking ExcelJS downgrade. Do not claim the Node-API bridge is approved for installer shipping based on Rust CI success.
