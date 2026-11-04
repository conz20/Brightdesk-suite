# Dependency security review

**Review date:** 2026-11-03  
**Branch:** `integration/pr15-pr19-review`  
**Runtime:** Node.js 24.22.2

## Summary

The current lockfile audit reported 21 moderate package findings, with no low, high, or critical findings. `npm audit --omit=dev --json` reported 9 moderate package findings. These entries trace primarily to two advisories: GHSA-g3hv-75wg-m249 for minimatch and GHSA-w5hq-g745-h8pq for uuid. The audit is not clean, and this review does not declare any finding fixed or formally approve a risk exception.

Most audit entries are parent-package effects in a dependency chain, rather than distinct underlying advisories. ExcelJS appears in both advisory chains.

## GHSA-g3hv-75wg-m249 — minimatch

The advisory describes glob-pattern amplification during preprocessing, followed by quadratic matching work. It reports versions below 11.0.1 as affected and specifically describes the vulnerable behavior in minimatch 10.2.6. The code path is selected when `optimizationLevel >= 2`; the installed implementation defaults to level 1.

### Installed copies and source review

| Version | Dependency path | Runtime classification | Source finding |
| --- | --- | --- | --- |
| 3.1.5 | `@electron/asar -> glob -> minimatch`; `@electron/universal -> dir-compare -> minimatch`; `glob -> minimatch` | Development/build only on the first two paths; production on the ExcelJS/Archiver path | Does not contain `firstPhasePreProcess`, `secondPhasePreProcess`, the `globParts` clone-and-append loop, or the described quadratic loop. The advisory version-range match appears over-broad for this installed code. |
| 5.1.9 | `filelist -> minimatch`; `readdir-glob -> minimatch` | Development/build on the first path; production on the Archiver path | Does not contain the specific preprocessing functions or clone-and-append loop. The advisory version-range match appears over-broad for this installed code. |
| 9.0.9 | `@electron/universal -> minimatch` | Development/build only | Contains the two preprocessing phases, the cloned glob-part append, and quadratic pairwise comparison. The vulnerable implementation is present; normal calls use the default optimization level 1 unless a caller explicitly requests level 2 or higher. |
| 10.2.6 | `app-builder-lib -> minimatch` | Development/build only | Contains the same advisory code path and optimization-level gate. The vulnerable implementation is present; normal calls use the default optimization level 1 unless a caller explicitly requests level 2 or higher. |

The installed dependency tree places the 9.0.9 copy under `@electron/universal@2.0.3` and the 10.2.6 copy under the Electron Builder build tree (`electron-builder@26.18.0` / `app-builder-lib@26.18.0`). The 3.1.5 and 5.1.9 copies used by the production ExcelJS/Archiver path do not implement the code described by this advisory.

### Audit package entries

The minimatch advisory accounts for these audit entries through dependency effects:

- **Development/build tree:** `@electron/asar@3.4.1`, `@electron/universal@2.0.3`, `app-builder-lib@26.18.0`, `dir-compare@4.2.0`, `dmg-builder@26.18.0`, `ejs@3.1.10`, `electron-builder@26.18.0`, `electron-builder-squirrel-windows@26.18.0`, `electron-winstaller@5.4.0`, `filelist@1.0.6`, `jake@10.9.4`, and `temp@0.9.4`.
- **Production dependency tree:** `archiver@5.3.2`, `archiver-utils@2.1.0` and nested `3.0.4`, `exceljs@4.4.0`, `glob@7.2.3`, `minimatch@3.1.5` and `5.1.9`, `readdir-glob@1.1.3`, `rimraf@2.6.3`, and `zip-stream@4.1.1`.

The production paths are `exceljs -> archiver -> archiver-utils -> glob -> minimatch@3.1.5` and `exceljs -> archiver -> readdir-glob -> minimatch@5.1.9`. The development/build paths run through Electron Builder, `app-builder-lib`, `@electron/universal`, `dir-compare`, `ejs`/`jake`/`filelist`, and related packaging utilities.

### Brightdesk call paths and exposure

Brightdesk imports ExcelJS in `src/file-service.js` to load and write XLSX/XLSM workbooks. The application uses `workbook.xlsx.load(buffer)` and `workbook.xlsx.writeFile(filePath)`. It does not call Archiver's directory or glob helpers, and a search of installed JavaScript outside minimatch found no explicit `optimizationLevel` setting. This reduces the observed production reachability of the flagged minimatch algorithm. The 9.0.9 and 10.2.6 implementations remain present in the build toolchain, so this evidence does not make the audit clean or prove every future build path safe.

## GHSA-w5hq-g745-h8pq — uuid

The advisory affects uuid versions below 11.1.1, including the installed `uuid@8.3.2`. It concerns `v3()`, `v5()`, and `v6()` when the caller supplies an external output buffer and/or offset; the affected functions can write past the intended bounds without rejecting the request.

### Dependency path and Brightdesk use

`exceljs@4.4.0 -> uuid@8.3.2` is a production path. ExcelJS imports only `v4` in its extended conditional-formatting serializer and calls it without a caller-supplied buffer. No calls to uuid `v3`, `v5`, or `v6` were found in the installed ExcelJS/Archiver code paths reviewed. Archiver itself does not import uuid in the inspected runtime source. Brightdesk's spreadsheet import path loads workbook data through ExcelJS; the observed uuid call is in serialization, not the external-buffer APIs described by the advisory.

The audit records both `uuid@8.3.2` and `exceljs@4.4.0` in this chain. The package version remains within the advisory range; the reviewed application call path does not exercise the described buffer behavior.

## Upstream versions and remediation options

The advisory-patched releases identified by npm/GitHub are minimatch `11.0.1` and uuid `11.1.1`. These cross major-version boundaries from the versions expected by current parents.

At review time, `electron-builder@26.18.1` was available, but its `app-builder-lib@26.18.1` metadata still requested minimatch `^10.2.5`; this patch update does not by itself establish remediation. ExcelJS `4.4.0` was the latest checked v4 release and still requested uuid `^8.3.0` and Archiver `^5.0.0`. The checked compatible-major lines for Archiver (`5.3.2`), glob (`7.2.3`), and readdir-glob (`1.1.3`) did not provide a clear upstream route to the advisory-patched minimatch major. Recheck registry metadata and the audit before any release because these versions can change.

The audit's suggested Electron Builder `20.23.1` and ExcelJS `3.4.0` changes are major downgrades and are not recommended as automatic security fixes for this project.

Recommended order:

1. Prefer compatible upstream parent releases that declare patched dependency versions, then verify the refreshed lockfile and audit.
2. If upstream fixes are unavailable, evaluate narrowly scoped overrides in a separate change. Do not assume a major override is compatible. Verify the supported minimatch API and test suite, Electron Builder packaging, ExcelJS workbook import/export and representative files on each supported platform.
3. If a finding remains, prepare a time-limited, evidence-based exception proposal describing the affected runtime, source-level findings, exposure, owner, expiration/review date, and monitoring plan. The project owner must decide whether to approve it; this document does not grant approval.

## Required review before release

- Rerun full and production-only `npm audit --json` on the final lockfile and record all advisory IDs, affected package versions, and dependency paths. Do not characterize the audit as clean while findings remain.
- Reinspect the minimatch implementations and caller-supplied options if any parent package or lockfile version changes. Confirm that no production or build caller enables `optimizationLevel >= 2` with attacker-controlled patterns.
- Recheck all uuid call sites after ExcelJS/uuid changes. Confirm no `v3`, `v5`, or `v6` calls use an externally supplied buffer or offset.
- For any proposed override, run the full JavaScript suite, ExcelJS round-trip tests, all eleven macOS packaging configurations, and platform-native build/artifact verification. Do not call an advisory fixed solely because the audit count changes.
- Record a project-owner decision for any temporary exception. No risk exception is approved by this review.

## Sources

- [GHSA-g3hv-75wg-m249: minimatch globparts amplification](https://github.com/advisories/GHSA-g3hv-75wg-m249)
- [GHSA-w5hq-g745-h8pq: uuid external-buffer bounds checks](https://github.com/advisories/GHSA-w5hq-g745-h8pq)
- [ExcelJS 4.4.0 package metadata](https://registry.npmjs.org/exceljs/4.4.0)
