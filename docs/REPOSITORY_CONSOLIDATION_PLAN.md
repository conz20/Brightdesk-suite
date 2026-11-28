# Lossless Brightdesk repository consolidation

**Date:** 29 November 2026  
**Status:** staged migration plan; no product source has been removed or rewritten  
**Baseline:** `main` at `b20e46d683f4bab5475eec68855e063c56fd6705`

## Goal

Make Brightdesk's repository boundaries as clear and maintainable as a launcher-plus-shared-components architecture, without sacrificing product capability, product identity, release support, tests, licensing evidence or Git history.

This is a source-ownership and dependency-boundary refactor, not a rewrite and not a request to make the codebase smaller at any cost.

## Verified baseline

The live GitHub inventory contains 28 repositories under `conz20`. Their roles remain:

- **Customer products (exactly ten):** Brightdesk-Pages, Brightdesk-Sheets, Brightdesk-Decks, Brightdesk-Notes, Brightdesk-Database, Brightdesk-Forms, Brightdesk-Lists, Brightdesk-Planner, Brightdesk-To-Do and Brightdesk-Workspace.
- **Customer desktop shell:** Brightdesk-suite.
- **Private engineering tooling:** Brightdesk-AI. It is not a customer product or runtime dependency.
- **Shared foundations:** Brightdesk-Assets, Brightdesk-Common-Actions, Brightdesk-Common-Libs, Brightdesk-Design-System, Brightdesk-Developer-Tools, Brightdesk-Engine, Brightdesk-Extensions, Brightdesk-Fonts, Brightdesk-Localization and Brightdesk-Release-Tools.
- **Supporting repositories:** Brightdesk-Archives, Brightdesk-Printing, Brightdesk-Services, Brightdesk-Type-Preview, Brightdesk-Voice and Brightdesk-Wiki. Wiki remains separate online help; Services remains optional experimental infrastructure; Type-Preview remains local/offline.

### Suite repository measurements

GitHub reports the Suite repository size as **83,989 KiB**. The current `main` tree has **2,219 entries**.

The ten top-level `Brightdesk-*` product snapshot folders each contain 158 file blobs (1,580 file paths in total). Their summed path sizes are **40,876,199 bytes**. Git stores identical blob objects once: these paths currently resolve to 218 unique blob objects totalling **15,207,219 bytes**. These figures describe the current tree, not the complete historical Git object database.

A direct path-and-blob-hash comparison of the embedded `Brightdesk-Pages/` snapshot with the current `conz20/Brightdesk-Pages` `main` tree found only **74 of 158** embedded files with an exact match. The current product repository also has files absent from that embedded snapshot. The other embedded snapshots have the same file count, but they still need individual comparisons before any are removed.

This establishes that the folders are not safe to delete as if they were identical submodules. Some content has drifted. Their unique material must be reconciled before consolidation.

### What the current build uses

The inspected `electron-builder.app.config.js` packages the Suite's `src/**/*`, the built native module, the root package manifest and legal files. `scripts/build-app.js` invokes this root configuration for each of the ten product IDs. The top-level product snapshots are not listed as packaged inputs in that configuration.

This is an initial packaging-path check, not yet proof that every script, workflow, test, archive process or developer task is independent of those folders. A complete reference and workflow audit is a required gate before their removal.

## Target architecture

```text
Brightdesk Office Suite
  ├── owns the desktop shell, launcher, catalogue and navigation
  ├── integrates exactly ten product workspaces
  └── assembles and verifies Suite/product installers
       │
       ├── Pages       ├── Sheets      ├── Decks
       ├── Notes       ├── Database    ├── Forms
       ├── Lists       ├── Planner     ├── To Do
       └── Workspace
             │
             └── consume pinned, tested shared interfaces
                   ├── Design-System
                   ├── Common-Libs
                   ├── Engine (Rust/native boundary)
                   ├── Fonts
                   ├── Localization
                   ├── Assets
                   └── other shared foundations where justified

Brightdesk-AI: private engineering/control tooling only
Brightdesk-Wiki: separate online help and technical documentation
```

### Ownership rules

1. Each product repository is the source of truth for that product's implementation, product-specific tests, product documentation and standalone build.
2. Brightdesk-suite owns the launcher/shell, approved ten-product catalogue, integrated navigation, shared Suite experience and combined release orchestration. It must not become a second source of truth for product internals.
3. Shared repositories own genuinely reusable capabilities. A repository's existence or README is not proof that a working package, API or service exists.
4. Products consume shared code through documented, versioned and tested interfaces. Pin exact versions or commit SHAs; do not depend on floating branches.
5. Shared foundations must not depend on individual product repositories. Product repositories must not copy whole Suite/product implementations to obtain common code.
6. Preserve each repository's existing implementation language and toolchain. Keep the current Brightdesk runtime/build pins unless a separately verified compatibility change is approved.
7. The ten product names and scope remain unchanged. Brightdesk-AI, Wiki, Services, Type-Preview, Printing and Voice do not become extra customer products.

## Lossless migration sequence

### Phase 1 — Freeze and inventory

- Work on feature branches and reviewed pull requests; never restructure `main` directly.
- Record the starting commit, file manifests, blob hashes, workflow references, package inputs and current test/build evidence.
- Compare each of the ten embedded product snapshots against its matching live product repository.
- Classify each file as: identical, newer in the product repo, newer in the Suite snapshot, Suite-specific, product-specific, generated/binary, licence/notice, or obsolete.
- Do not remove any folder while unmatched files remain unexplained.

### Phase 2 — Reconcile product ownership

- Move useful product-specific changes into the matching product repository through reviewed changes and product tests.
- Preserve Suite-only shell and integration code in Brightdesk-suite.
- Move genuinely shared implementation into an existing shared repository only after defining its owner, public interface, package/build process, licence notices and consumer tests.
- Keep a recoverable copy in Git history. Do not force-push, squash away historical branches, rewrite repository history or delete an unverified implementation.

### Phase 3 — Establish shared package contracts

- Start with the smallest high-value shared boundaries: design tokens/components, common contracts/utilities, native Engine APIs, fonts and localization.
- Add contract tests and at least one real consumer before declaring a shared package operational.
- Pin package versions/commits in consumers and update lockfiles reproducibly.
- Avoid adding Git submodules or cross-repository checkout requirements until their developer, CI and release access paths are proven. Prefer ordinary versioned dependencies where they meet the build and licensing requirements.

### Phase 4 — Make the Suite an integrator

- Integrate the ten product workspaces from their verified product-source boundaries rather than stale embedded snapshots.
- Keep each standalone installer buildable and each product's own tests runnable.
- Keep the Suite shell, shared navigation and combined installer orchestration in Brightdesk-suite.
- Do not ship Brightdesk-AI, engineering tools or documentation-only repositories in customer installers.

### Phase 5 — Prove parity before removing snapshots

For each product, require:

- current product source and Suite integration to use the same approved implementation;
- product unit and integration tests passing;
- Suite integration tests passing;
- license and third-party notice checks passing;
- platform package builds and artifact checks passing on GitHub-hosted runners;
- standalone launch, Suite launch, local persistence, upgrade and uninstall checks passing;
- no missing files or undocumented behaviour compared with the pre-migration baseline.

Only then may the corresponding embedded snapshot be removed from the current Suite tree. Keep the original commits and Git history intact.

## Repository-size and history facts

Removing old snapshots from the current tree can make the checkout and repository browser cleaner. It will **not** erase those files from existing Git history. GitHub's reported repository size may therefore remain materially larger until old objects expire or history is deliberately rewritten.

A history rewrite is **not** part of this plan. Preserving the existing work and history takes priority over reaching ArtCraft's reported repository size. A launcher and a ten-product desktop suite are also different scopes, so their repository sizes are not a direct quality comparison.

## Non-negotiable safeguards

- No MacBook is required for repository maintenance, builds, release delivery or updates. Use GitHub-hosted automation and approved online hosting only.
- No paid runners, subscriptions, telemetry, cloud sync, collaboration service, customer account system or remote customer-content processing may be introduced.
- Customer software stays local-first and works without Brightdesk-AI.
- Keep all ten products, original Brightdesk identity/assets, licensing and attribution protections, security checks, platform support and release evidence.
- Do not publish installers or releases automatically as part of this architecture change.
- A skipped, cancelled, stale or unavailable check is not a passing check.

## Immediate next actions

1. Complete the ten-way snapshot comparison and reference audit.
2. Fix any stale repository-seed or documentation references discovered by that audit.
3. Reconcile the first product end-to-end as a pilot, including a shared package only where the code is genuinely reusable.
4. Verify the pilot on GitHub-hosted CI before applying the same migration pattern to the remaining nine products.
5. Remove only the reconciled snapshot folders, one reviewed change at a time.

**Current completion status:** inventory and first Pages snapshot comparison completed; initial Suite packaging-path inspection completed; no source files or folders removed; full script/workflow audit, all-product reconciliation and implementation remain outstanding.
