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

The regenerated lockfile was created on the existing self-hosted Mac runner. `npm ls --package-lock-only --depth=0` passed. The latest quality workflow on the corrected branch completed successfully: lock verification, clean `npm ci`, third-party licence checks, renderer and app-module syntax checks, all automated tests, release preflight and the high-severity audit gate passed. The suite reported **237 tests: 232 passed, 0 failed and 5 skipped**. Release preflight printed `READY` on the macOS runner and confirmed Node.js 24.22.2, the 448-package lock, the exact ten-app catalogue and installer-consent metadata. This is a source/environment preflight, not proof that Windows, macOS and Linux installers have been built and manually verified. Rust formatting, Clippy, Cargo tests, native addon build and native-engine/provider bridge checks also passed.

The full current-lock `npm audit --audit-level=high` report lists **15 moderate vulnerabilities** and no high- or critical-severity finding (the high-severity gate therefore passes). The report identifies `minimatch <11.0.1` at `node_modules/glob/node_modules/minimatch`, reached through the Electron packaging dependency tree and its consumers. This is the remaining legacy `minimatch@3.1.5` lock entry. The former `readdir-glob@1.1.3` / `minimatch@5.1.9` route is no longer present. npm's suggested `npm audit fix --force` would install `electron-builder@25.1.8`, a breaking downgrade from the current 26.18.0 line; it is not applied.

## Remaining minimatch advisory-range question

The current lockfile contains one remaining legacy copy:

- `minimatch@3.1.5` at `node_modules/glob/node_modules/minimatch`, reached through the Electron packaging dependency tree.

The former `readdir-glob@1.1.3` / `minimatch@5.1.9` path is replaced by `readdir-glob@3.0.0`, which resolves to `minimatch@11.0.4` under the scoped Archiver override. The current CI audit still flags the legacy 3.1.5 copy because GitHub Advisory Database currently publishes the affected range as `<11.0.1`.

The minimatch maintainer's advisory identifies 10.2.6 as affected and 11.0.1 as patched. The GitHub Advisory Database currently publishes the broader affected range `<11.0.1`, which causes scanner reports to include the older 3.x and 5.x copies.

GitHub Advisory Database issue [#10811](https://github.com/github/advisory-database/issues/10811) remains open and requests clarification specifically about `minimatch@3.1.5`. The current discussion includes source inspection and bounded examples indicating that 3.1.5 does not contain the `firstPhasePreProcess`, `secondPhasePreProcess` or `optimizationLevel` mechanism described by the maintainer. The maintainer advisory itself describes `10.2.6` as affected and `11.0.1` as patched, while the database range remains broader at `<11.0.1`. That evidence is relevant but not a formal database amendment or proof that the older release is generally safe. The audit alert therefore remains visible and unresolved.

A blanket override to minimatch 11 is deliberately not used. The legacy `glob` dependency branch remains on its existing minimatch 3.x line rather than having a breaking major forced onto it. The minimatch 11 override is confined to app-builder-lib and the upgraded Archiver/readdir-glob branch, and those APIs are covered by the dependency compatibility tests.

References:

- [Minimatch maintainer advisory GHSA-g3hv-75wg-m249](https://github.com/isaacs/minimatch/security/advisories/GHSA-g3hv-75wg-m249)
- [GitHub Advisory Database record for GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)
- [GitHub Advisory Database range clarification issue #10811](https://github.com/github/advisory-database/issues/10811)
- [uuid advisory GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq)
- [uuid 11.1.1 release](https://github.com/uuidjs/uuid/releases/tag/v11.1.1)
- [uuid CommonJS compatibility note](https://www.npmjs.com/package/uuid)

## Release decision

This review records targeted remediation and compatibility tests; it does **not** grant a release exception. The quality gate is green, but the audit still reports 15 moderate vulnerabilities under the published minimatch range. Keep release approval blocked until either:

1. the advisory database clarifies the older minimatch range and a new audit is clean; or
2. the release owner records a named, time-limited exception, affected paths, evidence, impact assessment and remediation/review date in `docs/RELEASE_GATE.md`.

Do not use `npm audit fix --force`; the current audit output proposes a breaking downgrade to electron-builder 25.1.8. Do not claim the Node-API bridge is approved for installer shipping based on Rust CI success.
