# Brightdesk Office Suite

Brightdesk is an independent native desktop productivity suite. It is not affiliated with Microsoft.

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

### Current CI verification — 4 November 2026

Brightdesk Suite PR #38 now has successful self-hosted macOS runs for all four principal checks on commit `4f16721cc6f3847da8f23f75d8c31ccdd5c874c2`:

- [Rust Node-API integration](https://github.com/connormolloy12/Brightdesk-suite/actions/runs/41747718533) — formatting, Clippy, Rust tests, native addon build and Node-API/embedding bridge tests passed.
- [Integrated Suite checks](https://github.com/connormolloy12/Brightdesk-suite/actions/runs/41747718491) — dependency install, renderer syntax, all app-module syntax and `npm test` passed.
- [Lists checks](https://github.com/connormolloy12/Brightdesk-suite/actions/runs/41747718483) — dependency install, syntax and `npm test` passed.
- [Security and dependency audit](https://github.com/connormolloy12/Brightdesk-suite/actions/runs/41747718495) — lock preparation/verification, licence verification, tests and high-severity dependency audit passed.

These current CI runs execute on the repository's self-hosted macOS runner. They verify the Mac environment only; they do not establish Windows or Linux native builds, installers, or runtime acceptance. The other Brightdesk repositories still require their own runner setup or another approved CI execution path before their Rust changes can be described as CI-verified.

No customer release, installer publication or workflow artifact was produced by these checks. The PR remains open and unmerged pending the remaining repository and platform verification.

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

The GitHub Actions workflows pin third-party actions to immutable commit SHAs and use least-privilege permissions. The current PR validation workflows use a repository-scoped self-hosted macOS runner labelled `self-hosted`; the runner must be online for those checks to start. This is a macOS CI path, not a substitute for Windows and Linux verification. Installer builds, test results and release artifacts must be verified before they are described as passing or ready. See [Local release verification](docs/LOCAL-RELEASE-VERIFICATION.md) for the separate local installer verification process; this process does not upload or publish anything.

Brightdesk uses original product names, code, artwork and interface design. Microsoft product names are used only as internal workflow comparisons.

## Updates and customer control

Automatic update checking can be turned on or off. Turning it off stops scheduled and focus-triggered checks. Brightdesk never downloads or installs an update automatically; the customer must choose **Download update** and then **Install update**. The release feed is not configured in the current development build, so update checks will remain unavailable until the approved distribution repository is configured.

## Rust native engine

The Electron main process loads a local Rust Node-API module for bounded source processing and provider-neutral embedding operations. Rust is used for normalization, cosine similarity, and ranking of vectors returned by an explicitly configured model provider; it does not create semantic embeddings or call external models. No external model provider, paid API, credential, or remote source upload is enabled. See [Rust Node-API integration](docs/RUST_ENGINE_INTEGRATION.md).
