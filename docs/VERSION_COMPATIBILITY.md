# Brightdesk version compatibility standard

**Status:** Owner-approved version baseline for the Brightdesk portfolio. Check this file before adding, upgrading, migrating or reusing code that depends on a runtime, framework, SDK, build tool or external API.

## Approved toolchain baseline

| Toolchain | Required version | Where it applies |
|---|---:|---|
| Node.js | **24.22.2** | Every Node.js repository, script, test, build and CI job |
| Electron | **45.2.1** | Brightdesk desktop applications that package Electron |
| electron-builder | **26.18.0** | Brightdesk desktop applications that build installers |
| Rust | **1.99.1** | Every Brightdesk Cargo build, test, lint and native-addon task |

These are the approved Brightdesk versions, not a request to automatically install whatever upstream calls "latest". Do not change this baseline without explicit owner approval and a compatibility review across the portfolio.

## Required consistency

- Keep `package.json` `engines.node` at the exact Node.js patch above. Do not use ranges such as `^24`, `24.x`, `>=24` or an older patch.
- Keep `.node-version`, `.nvmrc`, dev-container settings, setup scripts, container image tags and every GitHub Actions `setup-node` step aligned with the same Node.js patch.
- Desktop app manifests must pin Electron and electron-builder exactly as listed. Keep the resolved direct package versions in the committed npm lockfile aligned with their manifests.
- Keep `rust-toolchain.toml` (or the approved equivalent) and Rust CI actions pinned to Rust 1.99.1. Run Cargo formatting, lint, tests and builds with that selected toolchain.
- Use the repository's current lockfile and package manager. Do not run lockfile generation under an older or different runtime/package manager and commit the result without checking it.
- When a repository does not use Electron, electron-builder or Rust, do not add those tools merely to make its manifest look like another repository. Apply only the relevant parts of this policy.

## Working with older code and documentation

- Do not copy an older implementation into a newer Brightdesk project and assume it is compatible.
- Before reusing code, a sample, a command or API guidance, check which major/minor version it was written for and compare it with the approved baseline and the actual dependency lock.
- When useful work exists only in an older version, **port it forward** to the currently approved API and implementation. Update imports, method signatures, configuration, build scripts, tests and docs together.
- Prefer documentation and examples for the exact package/runtime version in use. Treat older docs and old examples as migration references only.
- Do not mix old and new major-version APIs in the same application or silently fall back to an older runtime to get a test passing.
- Preserve existing user data and file formats during migrations. Add tests for migration, compatibility and regression behaviour.
- A deliberate `rust-version` value in Cargo metadata expresses a minimum compiler compatibility floor; it is not the selected compiler. The selected compiler is pinned by `rust-toolchain.toml` and CI. Do not confuse the two or lower the selected toolchain to satisfy an old metadata value.

## Changing the approved baseline

A version-baseline change requires explicit owner approval. Before changing it:

1. Verify the proposed version and supported APIs against authoritative release documentation.
2. Check compatibility across the Suite, all ten products, shared Rust/native components and engineering repositories.
3. Update every applicable manifest, lockfile, runtime selector, dev container, CI workflow, build script, installer configuration and version-sensitive documentation in one coordinated change.
4. Port old code to the new APIs; do not leave mixed implementations or stale examples.
5. Add tests proving the new exact pins are consistent and run them on the proposed toolchain.
6. Record the migration and any remaining platform-specific verification limits.

## Enforcement

Use Brightdesk Developer Tools:

```sh
node /path/to/Brightdesk-Developer-Tools/bin/brightdesk-dev.mjs doctor --root /path/to/repository
node /path/to/Brightdesk-Developer-Tools/bin/brightdesk-dev.mjs doctor --root /path/to/repository --json
```

The doctor is read-only. It verifies relevant exact pins and reports mismatches; it does not install, upgrade or rewrite project files. A passing doctor report does not replace the repository's tests, native build, installer verification or real application checks.


## Rolling latest-stable update policy — owner-approved 28 November 2026

The exact pins above describe the currently recorded baseline; they are not a permanent ceiling and must not be treated as proof that a version is still current. Before every planned update, check the upstream project's official release source for the newest stable release and compare it with the version actually installed in the manifest, lockfile, runtime selector, CI and build environment.

- Prefer the newest **stable** version that is compatible with Brightdesk's supported operating systems, Electron runtime, native modules, APIs and release targets. Do not adopt alpha, beta, nightly or release-candidate builds as production defaults.
- Check current security advisories and upstream support status as part of the version review. A package being present in a lockfile does not mean it is current or supported.
- Upgrade in small, attributable groups. Keep manifests, lockfiles, runtime selectors, CI, build scripts, installer configuration and version-sensitive documentation consistent.
- Prove compatibility with the repository's focused tests, full tests, type checks, builds, native-addon checks and relevant platform installer/smoke tests. Record the exact candidate version and exact tested commit.
- If a candidate is incompatible or causes a regression, revert **only the affected component** to its previous stable compatible version. Keep unrelated successful upgrades and continue the rest of the maintenance work; do not roll back the whole toolchain or freeze the portfolio because one component failed.
- Record each exception: candidate version, previous stable version retained, reproducible failure/evidence, affected repositories/platforms and the condition for trying again. Recheck the candidate on later maintenance cycles.
- Once a candidate passes in the Suite, roll the same approved version through every applicable product and supporting repository, with repository-specific tests. Do not assume one repository's pass proves every other repository is compatible.
- Keep older versions in archive history and explicit compatibility exceptions when required. Do not silently make an old version the new standard just because it is familiar.
- Continue maintenance after 0.1.0. Post-release defects are expected to be corrected in subsequent stable updates; release does not end development.

This rolling policy supersedes the earlier instruction that the listed exact pins could change only after a separate approval. The owner has explicitly authorised this latest-stable-first maintenance approach. The current exact pins remain in force until their replacements have passed the required checks; candidate availability alone does not promote a version.


## Version candidate audit — 28 November 2026

This is an upstream-version snapshot, not an approval to promote any candidate before Brightdesk compatibility checks pass. The current pins above remain the working baseline until a candidate passes the required repository and platform checks.

| Component | Current Suite pin / lock | Newest stable candidate checked | Next action |
|---|---:|---:|---|
| Node.js 24 line | 24.22.2 | 24.22.3 | Patch-update candidate and high priority: Node.js 24.22.3 is a security release with multiple high-severity fixes. Test the exact runtime, npm lock, builds and native modules. Node.js 26.13.1 is the newer Active LTS line and must be evaluated as a separate major-runtime compatibility trial, not silently substituted. |
| Electron | 45.2.1 | 45.5.0 | Test the newest stable patch on the current Electron 45 line. Electron 45.5.0 embeds Node.js 24.22.3 and includes renderer fixes; Electron 46 is prerelease at this snapshot. |
| electron-builder | 26.18.0 | 26.18.1 | Test the newest stable 26.x patch; 27.x is prerelease and is not a production default. |
| Rust | 1.99.1 | 1.100.1 | Suite PR #126 is the active candidate. Its quality, Suite CI, Rust Node-API and README checks passed; macOS installer verification was still running at the latest check. Keep draft until that completes. |
| Vite | 6.4.5 | 8.4.0 | Suite PR #100 proposes 8.3.6 and is stale. Its exact-head quality and Suite CI fail because tests/dependency-security.test.js still expects 6.4.5; README freshness also fails because package files changed without a README update. These are test/documentation failures, not proof that Vite 8 is incompatible. Recreate the update against current main using 8.4.0 and regenerate the lockfile. |
| Vitest | 5.1.0 | 5.1.2 | Test the current stable patch and keep its Vite peer compatibility aligned with the selected Vite version. |
| TypeScript | 5.9.3 (locked) | 7.0.2 | Treat as a separate major upgrade; run the full typecheck and product builds before promotion. |

Official version sources checked: [Node.js downloads](https://nodejs.org/en/download/), [Electron stable releases](https://releases.electronjs.org/?channel=stable), [electron-builder changelog](https://www.electron.build/changelog/), [Rust release notes](https://dev.rust-lang.org/releases.html), [Vite npm releases](https://www.npmjs.com/package/vite), [Vitest npm releases](https://www.npmjs.com/package/vitest) and [TypeScript npm releases](https://www.npmjs.com/package/typescript).


### Security priority
Node.js 24.22.3 is not merely a routine patch: the official 11 November 2026 release is a security release with multiple high-severity fixes. Electron 45.5.0 also embeds Node.js 24.22.3. Prioritise these compatible patch-line updates in the Suite, then replicate them across all ten product repositories after exact-head checks pass. Do not switch the whole portfolio to Node.js 26 until its compatibility is tested separately.
