# Brightdesk Office Suite

<p align="center"><img src="assets/brand/brightdesk-logo.svg" alt="Brightdesk" width="340"></p>

<p align="center"><strong>Ten focused desktop products. One consistent Brightdesk experience.</strong></p>

Brightdesk is an independent, local-first desktop productivity suite. It uses original product names, code, interface design and artwork. It is not affiliated with Microsoft, Adobe or ArtCraft.

## The ten approved products

| Product | Original icon | Purpose |
| --- | :---: | --- |
| **Pages** | <img src="assets/icons/pages.svg" alt="Pages icon" width="52"> | Create and format documents, letters and reports. |
| **Sheets** | <img src="assets/icons/sheets.svg" alt="Sheets icon" width="52"> | Work with spreadsheets, formulas, calculations and data. |
| **Decks** | <img src="assets/icons/decks.svg" alt="Decks icon" width="52"> | Create, edit and present slide presentations. |
| **Notes** | <img src="assets/icons/notes.svg" alt="Notes icon" width="52"> | Capture and organise quick notes and ideas. |
| **Database** | <img src="assets/icons/database.svg" alt="Database icon" width="52"> | Build local tables, define fields and manage records. |
| **Forms** | <img src="assets/icons/forms.svg" alt="Forms icon" width="52"> | Create forms, preview questions and collect responses locally. |
| **Lists** | <img src="assets/icons/lists.svg" alt="Lists icon" width="52"> | Organise records with custom columns, search, filters and sorting. |
| **Planner** | <img src="assets/icons/planner.svg" alt="Planner icon" width="52"> | Organise plans, buckets, tasks, priorities and progress. |
| **To Do** | <img src="assets/icons/to-do.svg" alt="To Do icon" width="52"> | Manage personal tasks, due dates and daily priorities. |
| **Workspace** | <img src="assets/icons/workspace.svg" alt="Workspace icon" width="52"> | Bring project pages, notes, checklists and information together. |

These are the only products in the approved suite. Outlook, OneDrive, Teams and any other unapproved products are excluded.

## Our own approach to office productivity

Brightdesk uses familiar productivity workflows as capability references, then builds its own product experience around the approved ten applications. The goal is a coherent Brightdesk suite—not a copy of another company's software.

Our product names, four-panel brand mark, icons, artwork, interface styling, source code and implementation decisions remain original. Microsoft product references are used only to describe comparable task capabilities; they do not imply affiliation, identical feature availability or permission to reuse proprietary material.

See the [Office Suite capability benchmark](docs/OFFICE-SUITE-CAPABILITY-BENCHMARK.md) for the researched feature areas, current first-use boundaries, local-first adaptations and staged implementation direction. Planned capabilities are not represented as finished features.


## Suite design preview

<p align="center"><img src="assets/previews/suite-dashboard-concept.svg" alt="Brightdesk suite dashboard design concept, not a running application screenshot" width="100%"></p>

> **Concept artwork — not a screenshot.** This image communicates the intended Brightdesk visual direction. It is not a capture from the running desktop build.

Brightdesk uses exactly one suite-wide Settings entry point: the cogwheel in the top-right corner. It opens the Settings area for app management, language resources and updates. The left sidebar is reserved for product navigation and contains no duplicate Settings item. The Suite preview artwork follows the same rule. The bell immediately to the left of the cogwheel is Notifications, with a clearly labelled panel and an honest empty state. Product-specific options remain in an app card's three-dot menu under **Product settings**, distinct from suite-wide Settings. The Save control has a recognisable icon and a visible label.

The integrated desktop suite opens to a first-class Home app centre. All ten approved products are displayed together with original preview artwork, product icons, descriptions and a direct **Open** action. The sidebar keeps all ten product destinations available, and the **All apps** return control takes users back to the suite home from a product workspace. Settings contains device-local language, dictionary and update preferences. The navigation and app-discovery flow take inspiration from the clear Apps / All apps organisation used by Adobe Creative Cloud, while Brightdesk keeps its own original visual identity and implementation. All ten products are included in the suite package; separate downloadable product installers are not published yet, so the app centre does not pretend that its Open action downloads another installer. The machine-readable [design contract](docs/BRIGHTDESK_DESIGN_CONTRACT.json) locks this Home experience as the default: all ten products remain visible, each workspace has persistent return navigation, cards open included products directly, and Download is shown only when a verified published installer URL exists. `tests/integrated-app-shell.test.js` and `tests/design-contract.test.js` protect these rules.

## Cross-platform consistency

Brightdesk uses one approved visual system and the same ten-product feature scope on Windows, macOS and Linux. All products share the Brightdesk navigation, typography, spacing, component states, layout rules and original icon artwork. Each product keeps its approved accent colour and icon on every platform. Only operating-system integrations such as window chrome, keyboard conventions, native file dialogs, permissions, installation and removal surfaces may adapt to native conventions. The authoritative rules are in the [Brightdesk visual and interaction standard](docs/BRIGHTDESK_VISUAL_STANDARD.md).

| Operating system | Configured suite package targets |
| --- | --- |
| Windows | x64 NSIS installer (.exe) |
| macOS | Universal disk image (.dmg), package installer (.pkg) and archive (.zip) |
| Linux | x64 AppImage (.AppImage) and Debian package (.deb) |

The macOS suite bundle uses the original Brightdesk four-panel mark from `src/assets/brand/brightdesk-mark.svg`, packaged as `build/icon.icns`.

**Local macOS verification (6 November 2026):** the universal `.app` was built with the Brightdesk icon, and both the executable and Rust Node-API module contain `arm64` and `x86_64`. The PKG and ZIP were generated. DMG generation failed in `hdiutil` with `Device not configured`; a separate minimal `hdiutil create` check failed the same way. The DMG currently in `release/` is the preserved earlier artifact, not a successful current build. The artifact verifier checks names, non-empty files and hashes, not build provenance or installation. The earlier DMG's checksum verified and the generated ZIP passed `unzip -t`; the ZIP extracted successfully, and its app executable matches the expanded PKG payload. The PKG contains the Terms and app payload. The PKG is unsigned, and the app bundle is not Developer ID signed. No Developer ID signing identity was available, and notarisation was skipped. On the PR #60 candidate based on `7c9d6ec`, `npm test` passed 261/266 Node tests plus 2 Vitest tests; five opt-in Node tests were skipped. With the live dictionary test enabled, 262 Node tests passed, four Linux-only installer tests were skipped, and both Vitest tests passed. The Linux installer tests passed separately in an isolated Linux container. Configured Vite workspace builds, 13 pinned product-source checks, licence/lock/runtime checks, release preflight and high-severity npm audit (0 vulnerabilities) also passed. Workspace is implemented in the integrated suite rather than a separate Vite workspace. The bundled app still could not be visually inspected: `electron .` and a direct launch exited with `SIGABRT` during AppKit application registration, including from an ad-hoc-signed temporary copy; Launch Services returned `kLSNoExecutableErr`. Home, sidebar navigation and return-to-Home therefore remain unverified. Installation, upgrade, removal, signing and notarisation remain unverified. No release was published.

These are configured targets, not proof that current installers are published or verified. A complete cross-platform release requires successful native build, install, first launch, upgrade and removal checks for every supported operating system, using the same approved suite version and source commit.

**Terms and first launch:** Windows NSIS and macOS DMG/PKG installers present the Terms and Conditions before installation continues. Linux uses the same blocking agreement in the packaged product on first launch, because AppImage has no installer agreement page. The workspace remains unavailable until the user explicitly accepts; declining or closing the agreement exits the product.

**Updates and removal:** The suite owns the customer-facing version and approved release. The current suite package does not configure a GitHub update publishing provider, so automatic cross-platform update delivery is not active or verified. When update delivery is enabled, every platform must receive the same approved version, features and release notes. Operating systems use different native install/removal mechanisms; the required outcome is consistent removal of the software without silently deleting local project data. Do not claim uninstall/data-preservation parity until each native route has passed its checks.

## What is implemented

All ten approved product areas are integrated into the main suite source and have dedicated workspace or service modules. The current first-use scope includes:

| Product | First-use workflows represented in the suite |
| --- | --- |
| **Pages** | Document editing, basic text formatting, lists and tables, page size, orientation and margin settings. |
| **Sheets** | Cell editing, basic arithmetic and range formulas, row/column editing and column sorting. |
| **Decks** | Create, edit, duplicate and delete slides; choose basic themes and present. |
| **Notes** | Write and edit quick notes with on-device saving and text/Markdown export. |
| **Database** | Create tables and typed fields; add, edit, search, sort and export records as CSV. |
| **Forms** | Create forms and supported question types; preview, validate, collect and review local responses. |
| **Lists** | Create lists, custom columns and records; search, filter and sort data. |
| **Planner** | Create plans, buckets and tasks; track priority, progress and due dates; filter tasks. |
| **To Do** | Create and update tasks; use My Day, Important, Planned, Tasks and Completed views; search tasks. |
| **Workspace** | Create workspaces and pages; add and organise text, heading, bullet, callout, divider and checklist blocks. |

This table describes the first-use scope represented in source code. It is not a claim of complete feature parity with other office suites, final accessibility sign-off or release acceptance. Each product has explicit boundaries and acceptance checks in its documentation.

## Rust Node-API engine

The Suite includes a Rust engine exposed to the Electron main process through a Node-API 8 native module. Electron and JavaScript continue to own application orchestration, user-interface state, file access and provider selection. The renderer does not load native code directly.

The engine provides bounded source chunking and analysis, embedding-vector normalisation, cosine similarity and vector ranking. The provider-neutral JavaScript bridge accepts an injected embedding provider; Rust processes vectors returned by that provider.

**Important boundaries:**
- Rust does not generate semantic embeddings or call language models. A separate embedding provider is required for semantic vectors.
- No remote model provider, paid API, credential or remote source upload is enabled by this engine.
- The native binary is generated during the build and is not committed to the repository.
- Ordinary development can use a bounded JavaScript fallback when the native module is unavailable. The dedicated Rust verification workflow requires the native module to load successfully.
- Native calls are made through the trusted Electron main-process/preload boundary; renderer code does not receive direct Node.js or native-module access.

The Rust toolchain is pinned to **1.99.1**. macOS native builds produce both Apple Silicon and Intel libraries and combine them for the universal desktop package. See [Rust engine integration](docs/RUST_ENGINE_INTEGRATION.md) for the API, safety limits, provider boundary and build details.

## Genuine screenshots and verification

The concept previews in the product repositories are not genuine screenshots. The older `assets/hero-showcase.png` file is a composed promotional collage, not a capture of the current running suite; it is intentionally not used as evidence of working screens. No verified screenshot set from the current running desktop build is published yet. Do not treat concept artwork, prototype package screens or the older v0.1.0 source archive as proof of current desktop behaviour.

A genuine screenshot should be captured directly from the current Electron build after launching the product and checking its primary workflow. The capture must show the real interface without composited controls or fabricated UI. Use non-sensitive sample data, retain the full product window, and label the image with the tested build or commit. See the [visual and interaction standard](docs/BRIGHTDESK_VISUAL_STANDARD.md) and its [machine-readable approved design contract](docs/BRIGHTDESK_DESIGN_CONTRACT.json), which locks the shared Brightdesk shell tokens and all ten original product icon/accent identities.

## Installer agreement

The Windows NSIS installer and macOS DMG/PKG present the Brightdesk Terms and Conditions before installation can continue. Choose **Accept** or **Agree** to proceed, or **Decline** or **Disagree** to cancel; declining stops installation. Linux AppImage/DEB packages use a blocking in-product agreement on first launch because AppImage has no installer agreement page. The Brightdesk workspace does not open until the agreement is accepted; declining or closing it exits the product. For a first-time Mac installation, use the DMG or PKG rather than the update ZIP.

## Local-first desktop software

Brightdesk is designed to keep product data on the current device. The first-use features described above do not require an account, cloud workspace or online collaboration. Some tasks such as downloads and update checks may use network access when explicitly requested.

## Product repositories

Each approved product has its own repository and product documentation:

- [Brightdesk Pages](https://github.com/connormolloy12/Brightdesk-Pages)
- [Brightdesk Sheets](https://github.com/connormolloy12/Brightdesk-Sheets)
- [Brightdesk Decks](https://github.com/connormolloy12/Brightdesk-Decks)
- [Brightdesk Notes](https://github.com/connormolloy12/Brightdesk-Notes)
- [Brightdesk Database](https://github.com/connormolloy12/Brightdesk-Database)
- [Brightdesk Forms](https://github.com/connormolloy12/Brightdesk-Forms)
- [Brightdesk Lists](https://github.com/connormolloy12/Brightdesk-Lists)
- [Brightdesk Planner](https://github.com/connormolloy12/Brightdesk-Planner)
- [Brightdesk To Do](https://github.com/connormolloy12/Brightdesk-To-Do)
- [Brightdesk Workspace](https://github.com/connormolloy12/Brightdesk-Workspace)

## Development

Use Node.js **24.22.2** for development, tests and release builds. Customers do not need to install Node.js; the desktop package includes its Electron runtime.

Install the locked dependencies and run the main checks:

```sh
npm ci
npm run check:node
npm run verify:product-sources
npm test
npm run build
```

The source-parity pilot now covers **thirteen feature modules across all ten individual product repositories**: Pages (`src/page-layout.js`), Sheets (`src/formula.js`), Decks (`src/slides-service.js`), Notes (`src/notes-service.js`), Forms (`src/forms-service.js` and `src/forms-workspace.js`), Lists (`src/lists-service.js`), To Do (`src/todo-service.js`), Planner (`src/planner-service.js`), Database (`src/database-service.js` and `src/database-workspace.js`), and Workspace (`src/workspace-editor.js` and `src/workspace-service.js`). The Suite verifies each vendored copy against the pinned Git blob recorded in [PRODUCT_SOURCE_LOCK.json](docs/PRODUCT_SOURCE_LOCK.json). The Pages, Sheets, Forms service, Lists, To Do, Planner and Workspace modules are pinned to their product repositories' `main` branches. Forms workspace is pinned to Forms PR #15 commit `0960d0ceee9e00bc7f0f78a053289c3d4d3699ce`; Database service/workspace are pinned to Database PR #15 commit `46d0feeb9e7110c2025857b6a2d145eeed06d40a`; Decks slide service is pinned to Decks PR #15 commit `69ce10e2d9ebf10d0968c0808b9f2928660af653`; and Notes content service is pinned to Notes PR #15 commit `c6e279974d3bde5df7ab024fc7805b984a2cb919`. These four product PR references remain unmerged and are pinned to immutable commits pending integration into their respective `main` branches. The Notes regression tests also cover cursor insertion and replacement of selected text at separator boundaries (`tests/notes-service.test.js`). The same source check runs in CI and release preflight. This is verified source parity for these thirteen modules only, not complete UI-shell parity or proof that every product file is shared from one implementation. On 5 November 2026, direct GitHub blob comparisons at Suite PR #60 heads `fc9b978fa4477266a15e610ca6307502739dba93` and `bedb2eced845b75dd2c2637f98362379aac57d20` confirmed that all 13 upstream files, Suite vendor copies and `sourceBlobSha` lock values match. Eight entries use product `main` refs and five entries use immutable commits from four unmerged source-alignment PRs. The Decks and Notes pins were subsequently advanced to their latest reviewed PR #15 commits after confirming that their feature-file blob SHAs were unchanged. This establishes exact source-file identity at the pinned revisions only; it does not mean those PRs are merged or that desktop runtime acceptance is complete. A fresh direct GitHub blob comparison at source-bearing PR #60 commit `3c9e2fbfa836e76e92bcb53a52ffbc0853fb5481` on 5 November 2026 confirmed that all thirteen upstream files at their recorded refs, the Suite vendor copies and the `sourceBlobSha` lock values are byte-for-byte identical (13/13). The source lock and all thirteen vendored feature files were unchanged after the direct 13/13 comparison at source-bearing Suite PR #60 commit `3c9e2fbfa836e76e92bcb53a52ffbc0853fb5481`; the later integration and branch-synchronisation commits did not modify those locked files or their lock entries. The 13/13 source-file comparison therefore still applies to the current merge commit `6da72ab8bacda50e73e5d252ed9c38e0865720e7`. This is file-content evidence only. On 6 November 2026, this PR branch is synchronized with the five commits now on `main` through a normal two-parent merge commit, without a force-push. The sync includes the approved single-Settings design, its concept artwork and the implementation/regression-test correction. The PR remains a draft and unmerged; check live PR metadata for current ahead/behind and mergeability. Historical 5 November evidence (superseded by the 6 November current-head section below): on the synchronised Suite revision `f23bb31086674843043ef0727770c95d70e4ca85`, the quality gate passed on Node.js 24.22.2 with 257 Node tests (252 passed, 0 failed, 5 skipped), 2 Vitest tests, thirteen pinned product modules, release preflight READY and zero npm audit vulnerabilities. The Rust Node-API workflow also passed formatting, Electron main syntax, Clippy, Rust/native bridge tests and native addon compilation. At that time, standard Suite CI was still running and README freshness failed before any steps, with no readable logs. Those workflow states apply only to that earlier commit. The current candidate's fresher results are recorded in the current-head section above.

For universal macOS packaging, the x64 and arm64 Electron binaries are combined while ASAR archive merging remains disabled. The Rust Node-API binary stays outside ASAR through the explicit `asarUnpack` rule, keeping the architecture-specific native module separate from the shared application resources.

Build and verify the Rust engine:

```sh
cargo fmt --manifest-path rust/Cargo.toml --all -- --check
cargo clippy --manifest-path rust/Cargo.toml --workspace --all-targets --locked -- -D warnings
cargo test --manifest-path rust/Cargo.toml --workspace --locked
npm run native:build
```

Run `npm run release:preflight` before preparing an installer. Build and verify installers on their matching native platforms; a build script existing in the repository does not mean that a verified installer has been published. The dedicated Rust workflow checks formatting, Clippy, Rust tests, native compilation and the native Node-API/provider bridge tests.

For a local, current-platform release verification, run:

```sh
npm run verify:local-release
```

This local process does not publish a GitHub Release or upload artifacts. Run it separately on each operating system you intend to distribute for.

See [installation guidance](docs/INSTALLATION.md), [local release verification](docs/LOCAL-RELEASE-VERIFICATION.md), [versioning](docs/VERSIONING.md), [Rust integration](docs/RUST_ENGINE_INTEGRATION.md), [PRODUCT_SCOPE_LOCK.md](PRODUCT_SCOPE_LOCK.md), [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Integration and release status

The customer-facing package version in the current main-branch manifest is **0.1.0**. Product integration, automated tests, live desktop acceptance and installer release are separate checkpoints. The integrated source includes all ten approved product areas and the Rust Node-API engine, but that does not by itself establish complete product workflows, accessibility acceptance, local persistence/recovery, upgrade and uninstall behaviour, or verified installers on all three operating systems.

The quality and Rust workflows are configured to use the repository's private self-hosted Mac runner. The native installer workflow is a separate manual workflow with Windows, macOS and Linux build jobs; release publication is opt-in and disabled by default. Workflow configuration is not evidence that a job has completed successfully. Do not describe the release as complete until current-head checks and native install/runtime acceptance have actually passed. No automatic update publishing provider is configured.

## Current-head verification — 6 November 2026

On candidate commit `cd37e982a2a5754da723f4cd09160c8e607d66e9`, the Brightdesk quality gate [42111944732](https://github.com/connormolloy12/Brightdesk-suite/actions/runs/42111944732) passed on Node.js 24.22.2: 261 Node tests passed, 0 failed and 5 were skipped; both Vitest tests passed; all thirteen pinned product-source checks passed; release preflight reported READY; and `npm audit --audit-level=high` found 0 vulnerabilities. Brightdesk Suite CI [42111944719](https://github.com/connormolloy12/Brightdesk-suite/actions/runs/42111944719) passed, and the Rust Node-API workflow [42111944716](https://github.com/connormolloy12/Brightdesk-suite/actions/runs/42111944716) passed formatting, Electron main-process syntax, Clippy, Rust tests, native addon compilation and native module/provider-bridge checks. README freshness [42111944815](https://github.com/connormolloy12/Brightdesk-suite/actions/runs/42111944815) was still queued at the last check. These results apply to the exact candidate commit above. They do not establish successful desktop launch, real-window visual or accessibility acceptance, or native installer installation and removal. The single-Settings correction and regression test require fresh current-head verification.

## Documentation freshness

The root README is maintained alongside the product, not as an end-of-project task. Every pull request and direct push to `main` that changes application code, tests, UI, design assets, screenshots, icons, configuration, dependencies, packaging, or build/release workflows must also update this README in the same change. The **README freshness** GitHub Actions check runs on pull requests and pushes to `main`; it requires a root `README.md` update whenever a non-Markdown file changes. A passing check confirms inclusion, not factual accuracy. Reviewers remain responsible for checking that feature status, screenshots, visual references, application icons, setup/build instructions, platform compatibility and repository links match the latest verified implementation.

The README freshness workflow runs on the existing self-hosted macOS ARM64 runner to avoid reliance on unavailable hosted Linux runner allocation. Its shell script is compatible with macOS system Bash and deliberately avoids `mapfile`/`readarray`. This is a documentation-check runner choice only; it does not change the supported Brightdesk product platforms or installer targets.
