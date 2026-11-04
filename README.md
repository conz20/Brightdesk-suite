<p align="center">
  <img src="assets/brand/brightdesk-logo.svg" alt="Brightdesk Office Suite" width="480">
</p>

# Brightdesk Office Suite

Brightdesk is an independent native desktop productivity suite. It is not affiliated with Microsoft.

## See Brightdesk

The following concept shows the intended Brightdesk app centre: app discovery, updates, downloads, launch controls and per-app management.

<p align="center">
  <img src="assets/previews/suite-dashboard-concept.svg" alt="Concept preview of the Brightdesk app centre showing all ten original app icons, app descriptions, Open, Update, Download and a three-dot management menu" width="900">
</p>

> **Important:** This is a concept illustration, not a screenshot of a completed application build. It shows a proposed visual direction. The per-app menu, app downloads and update controls are design targets; they must be implemented and acceptance-tested before being described as available functionality.


## Visual design standard

All ten applications follow the shared [Brightdesk visual and interaction standard](docs/BRIGHTDESK_VISUAL_STANDARD.md), including original product icons, consistent workspace layouts, app-centre actions, responsive behaviour and accessible controls. App screenshots in this README are labelled concepts until captured from running, acceptance-tested screens.

## The ten Brightdesk applications

Each application has its own original, purpose-designed icon. The matching artwork is used in the launcher and app navigation, so you can recognise each app by its symbol as well as its name. All ten remain part of the approved suite.

| Application | Icon | Purpose |
| --- | :---: | --- |
| **Pages** | <img src="assets/icons/pages.svg" width="72" height="72" alt="Brightdesk Pages icon" /> | Write and format documents. |
| **Sheets** | <img src="assets/icons/sheets.svg" width="72" height="72" alt="Brightdesk Sheets icon" /> | Build spreadsheets, formulas and tables. |
| **Decks** | <img src="assets/icons/decks.svg" width="72" height="72" alt="Brightdesk Decks icon" /> | Create slide presentations. |
| **Notes** | <img src="assets/icons/notes.svg" width="72" height="72" alt="Brightdesk Notes icon" /> | Keep notes and ideas together. |
| **Database** | <img src="assets/icons/database.svg" width="72" height="72" alt="Brightdesk Database icon" /> | Organise records, tables and structured data locally. |
| **Forms** | <img src="assets/icons/forms.svg" width="72" height="72" alt="Brightdesk Forms icon" /> | Create surveys, quizzes and collect responses locally. |
| **Lists** | <img src="assets/icons/lists.svg" width="72" height="72" alt="Brightdesk Lists icon" /> | Track projects, inventories and records locally. |
| **Planner** | <img src="assets/icons/planner.svg" width="72" height="72" alt="Brightdesk Planner icon" /> | Plan work, tasks and progress locally. |
| **To Do** | <img src="assets/icons/to-do.svg" width="72" height="72" alt="Brightdesk To Do icon" /> | Manage daily tasks, due dates and priorities. |
| **Workspace** | <img src="assets/icons/workspace.svg" width="72" height="72" alt="Brightdesk Workspace icon" /> | Bring project notes, tasks and resources together locally. |

## How Brightdesk works

1. **Install:** Choose the installer for Windows, macOS or Linux. End users do not need to install Node.js or Rust.
2. **Open:** Launch Brightdesk from your Applications folder, Start menu or desktop environment.
3. **Choose an app:** Select one of the ten app cards from the Brightdesk home screen.
4. **Work locally:** Use the selected application. The first release is local-first; it does not claim cloud collaboration or Microsoft service integration.
5. **Update when ready:** Brightdesk can check for updates when configured. It never downloads or installs an update without the customer's choice.

## First release

Version 0.1.0 contains the complete ten-app Brightdesk catalogue and integrated app modules. All ten apps remain visible in the suite.

Brightdesk is the ten-app desktop suite, with all ten approved apps implemented in the integrated codebase.

## Official product version

**The first official customer-facing Brightdesk release is 0.1.0.** The root `package.json` is the single source of truth. The desktop app, all ten app modules, installer filenames, release notes and download metadata must use that same version. Internal development numbers are never customer release numbers. Future customer updates must update the package manifest and lockfile together. See [the versioning policy](docs/VERSIONING.md).

| App | What it does | Implementation status |
| --- | --- | --- |
| Brightdesk Pages | Write and format documents. | Integrated |
| Brightdesk Sheets | Build spreadsheets, formulas and tables. | Integrated |
| Brightdesk Decks | Create slide presentations. | Integrated |
| Brightdesk Notes | Keep notes and ideas together. | Integrated |
| Brightdesk Database | Organise records, tables and structured data locally. | Integrated |
| Brightdesk Forms | Create surveys, quizzes and collect responses locally. | Integrated |
| Brightdesk Lists | Track projects, inventories and records locally. | Integrated |
| Brightdesk Planner | Plan work, tasks and progress locally. | Integrated |
| Brightdesk To Do | Manage daily tasks, due dates and priorities. | Integrated |
| Brightdesk Workspace | Bring project notes, tasks and resources together locally. | Integrated |

All ten approved app modules are present in the integrated suite, with dedicated feature code and automated integration coverage. “Integrated” describes the current codebase; it does not mean every workflow, accessibility scenario, data migration, installer or operating-system build has passed final acceptance testing.

The first release remains local-first; the suite does not claim cloud collaboration or Microsoft service integration.

## Quality verification

The automated test suite includes service tests, app-shell integration tests and DOM-contract checks for the integrated workspaces. Database supports ascending and descending record sorting, and CSV export prefixes formula-like text values so spreadsheet programs are less likely to interpret user-entered text as formulas. These checks help protect module-to-shell connections and core logic; they do not replace real app interaction, data-persistence, accessibility, cross-platform build, installation, upgrade or uninstall testing.

### Current verification — 4 November 2026

Brightdesk-suite PR #38 has been merged into main at commit `887515e5348e7c005ed3d32d20f32a97998f2c87`.

- The [Rust Node-API engine check](https://github.com/connormolloy12/Brightdesk-suite/actions/runs/41797522160) passed on the existing self-hosted Mac runner. Formatting, Clippy, Rust tests, native addon build and Node-API/embedding bridge tests passed.
- The [security and dependency audit](https://github.com/connormolloy12/Brightdesk-suite/actions/runs/41797522120) passed on the self-hosted runner.
- The installer preparation, lockfile-generation and third-party-notices jobs did not execute their steps on GitHub-hosted runners. They remain blocked by the existing hosted-runner allocation issue tracked in [Brightdesk-suite issue #23](https://github.com/connormolloy12/Brightdesk-suite/issues/23). These are runner-start failures, not evidence that installer builds or application tests failed.
- The Windows and Linux installer paths have not been verified by this post-merge run. The Mac Rust check verifies the native engine only; it is not a complete macOS installer acceptance test.

No customer release was published and no installer bundle was produced by these checks. Brightdesk is not yet release-ready across all three operating systems.

## Supported installer targets

The release workflow is designed to build macOS universal DMG, PKG and ZIP packages, Windows x64 EXE installers, and Linux x64 AppImage and DEB packages. A platform build is only considered ready after its artifacts, legal documents and SHA-256 checksums have been verified. No public release should be published without explicit owner approval.

## Standalone app builds

The shared suite can also build each of the ten approved product editions separately. To build all ten for one operating system, use:

- Windows: `npm run dist:apps:win`
- macOS: `npm run dist:apps:mac`
- Linux: `npm run dist:apps:linux`

Individual commands are available as `npm run dist:<product>:<platform>` for Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace. Each standalone installer includes the native Rust Node-API engine. The batch command builds that engine once before producing the ten installers.

## Installing Brightdesk

**End users do not need to download or install Node.js.** The native desktop application is packaged with the Electron runtime it needs. Install Brightdesk using the installer for your operating system and open it like any other desktop app. See [INSTALLATION.md](docs/INSTALLATION.md) for instructions.

## Development

Building and testing Brightdesk requires exactly Node.js 24.22.2. This is a developer/CI requirement only; it is not a customer installation requirement. Run `npm run setup:dev` after activating that runtime. The project uses its checked-in package lock and automated Node.js tests.

The consolidated pull-request quality gate uses the existing self-hosted Mac runner to avoid consuming paid GitHub-hosted minutes. It verifies Node.js 24.22.2, the committed dependency lock, licences, app-module syntax, the complete test suite, release preflight and high-severity dependency vulnerabilities. The runner must be online for those checks to start.

The three-platform installer workflow is manual-only. It requires Windows, macOS and Linux build runners; do not dispatch it unless those runners are available. Publishing a GitHub Release remains a separate explicit choice and defaults to off. For local verification, run `npm run verify:local-release` on the target operating system; see [Local release verification](docs/LOCAL-RELEASE-VERIFICATION.md). This local process does not upload or publish anything.

Brightdesk uses original product names, code, artwork and interface design. Microsoft product names are used only as internal workflow comparisons.

## Updates and customer control

Automatic update checking can be turned on or off. Turning it off stops scheduled and focus-triggered checks. Brightdesk never downloads or installs an update automatically; the customer must choose **Download update** and then **Install update**. The release feed is not configured in the current development build, so update checks will remain unavailable until the approved distribution repository is configured.

## Rust native engine

The Electron main process loads a local Rust Node-API module for bounded source processing and provider-neutral embedding operations. Rust is used for normalization, cosine similarity, and ranking of vectors returned by an explicitly configured model provider; it does not create semantic embeddings or call external models. No external model provider, paid API, credential, or remote source upload is enabled. See [Rust Node-API integration](docs/RUST_ENGINE_INTEGRATION.md).

## Professional product quality programme

The suite is the visual and functional reference for every standalone Brightdesk application. This programme raises the complete ecosystem to one release-quality standard rather than polishing the launcher while leaving individual products behind.

### Shared experience requirements

- One coherent Brightdesk design system: typography, spacing, colour tokens, surfaces, borders, elevation, icon sizing, focus states and interaction feedback.
- A consistent desktop application frame with clear navigation, a useful work area, predictable toolbars and contextual actions.
- Real product-specific screens and workflows; no generic placeholder dashboards, decorative controls that do nothing, or invented feature claims.
- Consistent empty, loading, success, validation, error and destructive-confirmation states.
- Keyboard operation, visible focus, readable contrast, accessible names, sensible tab order and layouts that remain usable at supported window sizes.
- Original Brightdesk artwork and product identities. Microsoft 365, Adobe and ArtCraft are quality references only; Brightdesk must not copy their logos, proprietary assets or exact interface designs.

### Worked examples and screenshots

Every example must match an implemented and testable workflow. Label concept artwork clearly; label captured application screenshots with the build/version used. Do not present mock data or concept screens as shipped functionality. Examples should show realistic content, useful density, clear hierarchy and the complete task outcome—not empty panels or disconnected controls.

### Release acceptance

A visual change is complete only after the relevant screen has been checked at practical desktop sizes, its key interactions have been exercised, keyboard/focus behaviour has been checked, and the repository's documented tests pass. Suite-level acceptance must also confirm all ten app cards, their descriptions, app identities and launch destinations remain correct. Installer, persistence, upgrade and cross-platform claims must be backed by their own successful checks.

This programme does not change the approved ten-app scope or the first customer-facing version **0.1.0**. It does not mark unfinished work as complete; each application must earn its status through evidence.
