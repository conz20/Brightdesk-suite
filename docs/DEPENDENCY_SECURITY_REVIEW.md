# Brightdesk dependency security review

**Review date:** 4 November 2026  
**Scope:** the shared Suite dependency lock used by all ten generated product repositories.

## Applied scoped overrides

The current Suite manifest contains two targeted npm overrides:

| Parent package | Dependency | Requested version | Current lock resolution | Reason |
|---|---|---:|---:|---|
| ExcelJS 4.4.0 | uuid | `^11.1.1` | 11.1.1 | Removes the vulnerable uuid 8.3.2 inherited from ExcelJS. Version 11.1.1 is listed as patched by GHSA-w5hq-g745-h8pq and retains CommonJS support; uuid 12 removed CommonJS support. |
| app-builder-lib 26.18.0 | minimatch | `^11.0.1` | 11.0.4 | Moves the app-builder-lib minimatch 10.2.6 dependency to the maintainer's patched 11.0.1 release line. |

These overrides are intentionally scoped to their parent packages. They do not force an incompatible minimatch major onto older consumers.

## Compatibility coverage

`tests/dependency-security.test.js` verifies that:

- ExcelJS resolves uuid 11.1.1 and can load its CommonJS v4 API.
- ExcelJS can write an XLSX workbook and read it back with the overridden uuid.
- app-builder-lib resolves minimatch 11.0.4 or later within the 11.x major line and the `Minimatch` / `minimatch` APIs used by the builder work.
- The root package manifest retains both scoped overrides.

The regenerated lockfile was created on the existing self-hosted Mac runner. `npm ls --package-lock-only --depth=0` passed. On commit `eaab5e76e71dde81e3f8cb95708f6acc03b76948`, the Suite CI reported 236 tests, 231 passed, 0 failed and 5 skipped; licence checks, syntax checks and release preflight passed. The Rust CI also passed formatting, Clippy, Cargo tests, the native build and native-engine tests.

The full `npm audit` report on that commit contained **16 moderate findings**, all remaining under the nested `minimatch@3.1.5` and `minimatch@5.1.9` paths listed below. No uuid finding and no app-builder-lib `minimatch@10.2.6` finding remained. The `npm audit --audit-level=high` command passes because these are moderate, not high or critical; moderate-or-higher findings are not all cleared.

## Remaining minimatch advisory-range question

The lockfile still contains older minimatch copies under legacy dependencies:

- `minimatch@3.1.5` at `node_modules/glob/node_modules/minimatch`, reached through the Electron packaging dependency tree.
- `minimatch@5.1.9` at `node_modules/readdir-glob/node_modules/minimatch`, reached through ExcelJS's archive dependency tree.

Together these paths account for the 16 moderate audit findings in the `eaab5e76` CI run.

The minimatch maintainer's advisory identifies 10.2.6 as affected and 11.0.1 as patched. The GitHub Advisory Database currently publishes the broader affected range `<11.0.1`, which causes scanner reports to include the older 3.x and 5.x copies.

GitHub Advisory Database issue [#10811](https://github.com/github/advisory-database/issues/10811) is open and requests clarification. Contributors have posted source inspection and bounded tests indicating that minimatch 3.x–6.x do not contain the `firstPhasePreProcess`, `secondPhasePreProcess` or `optimizationLevel` mechanism described by this specific advisory. That evidence is useful for triage, but it is not a formal amendment to the advisory. The older copies remain visible; they have not been silently suppressed or classified as globally safe.

A blanket override to minimatch 11 is deliberately not used. Older consumers rely on the legacy callable CommonJS export, while minimatch 11 exposes an object with a named `minimatch` API. Forcing v11 across those dependency branches could break their callers.

References:

- [Minimatch maintainer advisory GHSA-g3hv-75wg-m249](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249)
- [GitHub Advisory Database record for GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)
- [GitHub Advisory Database range clarification issue #10811](https://github.com/github/advisory-database/issues/10811)
- [uuid advisory GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq)
- [uuid 11.1.1 release](https://github.com/uuidjs/uuid/releases/tag/v11.1.1)
- [uuid CommonJS compatibility note](https://www.npmjs.com/package/uuid)

## Release decision

This review records targeted remediation and compatibility tests; it does **not** grant a release exception. Keep the release blocked until the 16 moderate findings have been reviewed against the published dependency paths and either:

1. the advisory database clarifies the older minimatch range and the release audit is clean; or
2. the release owner records a named, time-limited exception, affected paths, evidence, impact assessment and remediation/review date in `docs/RELEASE_GATE.md`.

Do not use `npm audit fix --force`; the earlier audit output proposed a breaking ExcelJS downgrade. Do not claim the Node-API bridge is approved for installer shipping based on Rust CI success.
