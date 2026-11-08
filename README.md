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

## The Brightdesk experience

<p align="center"><img src="assets/product-experience/brightdesk-home.svg" alt="Brightdesk Office Suite production Home screen: Home, Apps and Files sidebar, ten product cards, Notifications and Settings" width="100%"></p>

The SVG above is the approved production Home screen design and the single visual source of truth for the desktop interface. It defines the exact Home heading, Home–Apps–Files sidebar, ten original product cards, Notifications and Settings controls, spacing and visual treatment. This is the intended customer-facing design; the live desktop interface and this artwork must remain aligned.

**Current implementation alignment:** the desktop source uses the original Brightdesk wordmark, the separate four-tile Apps icon, and the responsive icon-first product cards shown in the approved Home artwork. The Home top bar reads **Your apps**; the product grid is headed **Your products** with the line **Ten focused tools, connected by one Brightdesk experience.** The redundant **MY APPS** label is hidden on Home so the section has one clear heading. At the 1600 × 900 reference size, the shell uses a 238 px deep-navy sidebar, a 46 px Suite mark, a 25 px wordmark, a 34 px Home heading, 38 px circular Notifications and Settings controls, and 240 px product cards with 16 px column and 18 px row gaps. The grid presents five cards per row at this size and adapts to fewer columns on narrower screens. The **Home** screen opens to the ten-product grid, **Apps** opens product management, and **Files** provides local Open file and Save project actions. The Files screen is a local file-access page, not a full file browser or recent-files list. In an active product workspace, suite navigation is replaced by the **Switch product** list.

The approved sidebar uses **Home**, **Apps** and **Files**, with no secondary captions; the **Files** icon is a recognisable open folder with a visible stack of documents, matching the local file-opening and project-saving actions rather than an unexplained rectangle. There is no Create button, no online-service navigation and no cloud storage. The sidebar footer reinforces that Brightdesk is local-first; the current software version remains available in the product footer outside Home. Installed products belong in the **Switch product** group only while a product workspace is open. The original product icons remain consistent across the Home cards and product workspaces. The four-panel mark beside the Brightdesk wordmark is the Suite logo; the separate four-tile launcher icon identifies Apps.

**Updates:** Home does not contain separate Install or Update information panels. When a Brightdesk Suite update is reported by the update service, a desktop notification appears and the alert is saved in the Notifications bell history. The alert offers **Download update** when available and **Install update** after the download completes. Downloading and installing always require a deliberate action. The current suite has no configured GitHub update publishing provider, so live release delivery is not active or verified.

**Product cards:** the desktop catalogue currently supports product descriptions, installed/available status, and Open, Install or Uninstall actions. Uninstall now requires confirmation and explicitly tells users that their documents and project files remain on this device. The three-dot **Product settings** menu now lets users hide or restore an installed product in the **Switch product** sidebar without uninstalling it. This preference is saved locally, and Brightdesk keeps at least one installed product visible so workspace switching remains available.
## Cross-platform consistency

Brightdesk uses one approved visual system and the same ten-product feature scope on Windows, macOS and Linux. All products share the Brightdesk navigation, typography, spacing, component states, layout rules and original icon artwork. Each product keeps its approved accent colour and icon on every platform. Only operating-system integrations such as window chrome, keyboard conventions, native file dialogs, permissions, installation and removal surfaces may adapt to native conventions. The authoritative rules are in the [Brightdesk visual and interaction standard](docs/BRIGHTDESK_VISUAL_STANDARD.md).

The ten original SVG application icons remain the single source of truth. The Suite and its integrated product packagers copy the matching canonical SVG into Electron Builder's build-resources directory and pass that SVG to the Windows, macOS and Linux targets. Electron Builder's icon pipeline converts the vector artwork into the native icon formats required by each operating system; the source SVGs are not replaced by generic placeholders. Decks and Workspace have explicit source-name mappings to their internal product IDs. This configures the original identities for the integrated Suite and product builds, but it does **not** prove that an installed Dock icon, taskbar icon, Start menu shortcut or desktop launcher has been visually verified. The separately maintained product repositories still need their own matching packaging rollout and native install checks.

| Operating system | Configured Suite and individual product targets |
| --- | --- |
| Windows | Suite plus ten x64 NSIS installers (.exe) |
| macOS | Suite plus ten universal DMG, PKG and ZIP sets |
| Linux | Suite plus ten AppImage and Debian package (.deb) sets |

These are configured targets, not proof that current installers are published or verified. Routine Suite CI, quality, Rust and README checks, plus pull-request macOS installer verification, run on the existing private self-hosted Mac runner. The manual release workflow builds the Suite and all ten individual products on standard GitHub-hosted Windows x64 and Linux x64 runners plus the existing self-hosted macOS ARM64 runner. These are standard runners, not larger paid runners; private-repository use draws from the account's included Actions allowance. If that allowance is exhausted, Windows/Linux jobs may be blocked until it resets unless additional use is enabled. The customer does not need to own or operate Windows or Linux hardware. Each platform bundle is checked for the expected versioned installer files, legal documents and SHA-256 manifests. The final collector runs on the private Mac runner and verifies the same release version and dependency lock, all ten product folders per platform, all transferred checksums and the full 66-file target before a release can proceed.

At the start of each manually dispatched installer workflow, a narrowly scoped cleanup job removes only previous Brightdesk installer bundle artifacts that are at least 24 hours old. It protects the current workflow run and leaves unrelated Actions artifacts untouched; only that cleanup job receives Actions write permission. The workflow retains the three verified platform artifacts for one day and reuses them for final verification and publishing. It does not upload a second full copy of the combined bundle. This reduces avoidable storage use, although other retained artifacts or caches can still consume the repository quota. A complete cross-platform release still requires successful native builds and real installation, first-launch, upgrade, removal and data-preservation checks on every supported operating system. See [cross-platform release verification](docs/CROSS-PLATFORM-RELEASE-VERIFICATION.md) and [no-cost runner setup](docs/LOCAL-RELEASE-VERIFICATION.md#no-cost-github-actions-runners). GitHub Release publishing remains a separate manual input and is disabled by default.

**Terms and first launch:** Windows NSIS and macOS DMG/PKG installers for the Suite and all ten individual products present the Terms and Conditions before installation continues. The packaged macOS product also checks consent on first launch for every package type, so a ZIP opened directly cannot bypass the agreement. DMG/PKG installs therefore show the agreement during installation and again at first launch. Linux uses the same blocking agreement in the packaged product on first launch, because AppImage has no installer agreement page. The workspace remains unavailable until the user explicitly accepts; declining or closing the agreement exits the product.

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

## Product screenshots and verification

The approved Home SVG is the visual specification for the customer-facing interface and is kept aligned with the desktop source. It is not presented as a runtime screenshot. The older `assets/hero-showcase.png` file is a composed promotional collage, not a capture of the current running suite, so it is not used as evidence of working screens. No verified screenshot set from the current running desktop build is published yet. Do not treat design artwork or the older v0.1.0 source archive as proof of current desktop behaviour.

A genuine screenshot should be captured directly from the current Electron build after launching the product and checking its primary workflow. The capture must show the real interface without composited controls or fabricated UI. Use non-sensitive sample data, retain the full product window, and label the image with the tested build or commit. See the [visual standard](docs/BRIGHTDESK_VISUAL_STANDARD.md).

## Installer agreement

The Windows NSIS installer and macOS DMG/PKG present the Brightdesk Terms and Conditions before installation can continue. Choose **Accept** or **Agree** to proceed, or **Decline** or **Disagree** to cancel; declining stops installation. The packaged macOS product also checks the agreement on first launch for every package type, so a ZIP opened directly cannot bypass acceptance. Because the app bundle is the same, DMG/PKG installs also show the first-launch confirmation after installer acceptance. Linux AppImage/DEB packages use a blocking in-product agreement on first launch because AppImage has no installer agreement page. The Brightdesk workspace does not open until the agreement is accepted; declining or closing it exits the product. For a first-time Mac installation, use the DMG or PKG rather than the update ZIP.

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
npm test
npm run build
```

The catalogue and shell tests also check the shared release-version source, the current Home footer wording, and the bundled original SVG icon artwork. The customer-facing package version is shown in the product footer outside Home; the Home sidebar keeps its local-first message.

Build and verify the Rust engine:

```sh
cargo fmt --manifest-path rust/Cargo.toml --all -- --check
cargo clippy --manifest-path rust/Cargo.toml --workspace --all-targets --locked -- -D warnings
cargo test --manifest-path rust/Cargo.toml --workspace --locked
npm run native:build
```

Run `npm run release:preflight` before preparing an installer. Build and verify installers on their matching native platforms; a build script existing in the repository does not mean that a verified installer has been published. The dedicated Rust workflow checks formatting, Clippy, Rust tests, native compilation and the native Node-API/provider bridge tests.

**Packaging dependency compatibility:** electron-builder retains its patched `minimatch` 11 dependency, while `@electron/asar` resolves the compatible CommonJS `minimatch` 3.1.5 implementation it requires for archive creation. An automated dependency test checks that these two build-time dependency paths remain isolated.

For a local, current-platform release verification, run:

```sh
npm run verify:local-release
```

This local process does not publish a GitHub Release or upload artifacts. Run it separately on each operating system you intend to distribute for. The pull-request macOS packaging check builds and verifies the Suite installers plus all ten product installers locally on the native macOS runner, including per-product SHA-256 manifests. It does not upload duplicate installer bundles to GitHub Actions storage; build and verification results remain in the workflow log.

See [installation guidance](docs/INSTALLATION.md), [local release verification](docs/LOCAL-RELEASE-VERIFICATION.md), [versioning](docs/VERSIONING.md), [Rust integration](docs/RUST_ENGINE_INTEGRATION.md), [PRODUCT_SCOPE_LOCK.md](PRODUCT_SCOPE_LOCK.md), [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Integration and release status

The customer-facing package version in the current main-branch manifest is **0.1.0**. Product integration, automated tests, live desktop acceptance and installer release are separate checkpoints. The integrated source includes all ten approved product areas and the Rust Node-API engine, but that does not by itself establish complete product workflows, accessibility acceptance, local persistence/recovery, upgrade and uninstall behaviour, or verified installers on all three operating systems.

The quality and Rust workflows are configured to use the repository's private self-hosted Mac runner. The native installer workflow is a separate manual workflow with Windows, macOS and Linux build jobs; release publication is opt-in and disabled by default. Workflow configuration is not evidence that a job has completed successfully. Do not describe the release as complete until current-head checks and native install/runtime acceptance have actually passed. No automatic update publishing provider is configured.

## Documentation freshness

The root README is maintained alongside the product, not as an end-of-project task. Every pull request and direct push to `main` that changes application code, tests, UI, design assets, screenshots, icons, configuration, dependencies, packaging, or build/release workflows must also update this README in the same change. The **README freshness** GitHub Actions check runs on pull requests and pushes to `main`; it requires a root `README.md` update whenever a non-Markdown file changes. A passing check confirms inclusion, not factual accuracy. Reviewers remain responsible for checking that feature status, screenshots, visual references, application icons, setup/build instructions, platform compatibility and repository links match the latest verified implementation.
