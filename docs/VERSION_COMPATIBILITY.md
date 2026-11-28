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
