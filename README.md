# Brightdesk Office Suite

Brightdesk is an independent ten-app desktop suite for productivity and creative work. It is not affiliated with Microsoft.

## First release

Version 0.1.0 is the integrated ten-app desktop suite. The complete first-release lineup is shown below:

| App | What it does | Status |
| --- | --- | --- |
| Brightdesk Pages | Write and format documents. | Available |
| Brightdesk Sheets | Build spreadsheets, formulas and tables. | Available |
| Brightdesk Decks | Create slide presentations. | Available |
| Brightdesk Notes | Keep notes and ideas together. | Available |
| Brightdesk Database | Organise records, tables and structured data locally. | Available |
| Brightdesk Forms | Create surveys, quizzes and collect responses locally. | Available |
| Brightdesk Lists | Track projects, inventories and records locally. | Available |
| Brightdesk Planner | Plan work, tasks and progress locally. | Available |
| Brightdesk To Do | Manage daily tasks and reminders locally. | Available |
| Brightdesk Workspace | Bring project notes, tasks and resources together locally. | Available |

All ten apps have integrated local-first workflows in the 0.1.0 source line and are designed to work as part of the Brightdesk desktop suite. This does not claim full commercial feature parity, cloud collaboration, remote sync or Microsoft service integration.

The Suite launcher is its own desktop application. The ten approved products are also built as separate desktop apps so users can install only what they need and launch each product directly from Windows, macOS or Linux. The launcher has separate Home, Apps, Downloads, Updates and Settings areas. Home distinguishes apps added to the Suite from standalone desktop installations; Apps provides search and installation-state filters; Downloads lets users choose Windows, macOS or Linux and select individual installers. The launcher discovers installed apps from operating-system locations as well as app self-registration. The App Centre's Select All / Clear All controls only select which apps appear inside the Suite; they are not the native multi-app installer wizard.

Brightdesk is an original product. Adobe and Microsoft 365 are broad quality and workflow references only; Brightdesk does not copy their proprietary source code, artwork, logos or distinctive interface designs. Brightdesk is ad-free, subscription-free and free to use, with no activation codes, licence fees, paid tiers or paid updates. Required third-party licence notices remain included.

## Product experience and download architecture

The Adobe and Microsoft references are used only to evaluate public app-discovery, download, install, installed-app management and update workflows. Brightdesk keeps its own visual identity, product scope, code and free local-first model. See [the clean-room product experience review](docs/REFERENCE_PRODUCT_EXPERIENCE_REVIEW.md) for the public-source findings, cross-platform architecture and release requirements.

## Download distribution requirement

The application source repository is currently private. A public no-login desktop download and update service therefore cannot use its release assets directly. Before the first customer release, configure a public Brightdesk releases repository or public download host for the signed release manifest and installers. This does not require making the private source repository public. No customer account, licence key or subscription may be required.

## Supported installer targets

The release workflow is designed to build macOS universal DMG and PKG installers, Windows x64 EXE installers, and Linux x64 AppImage and DEB packages. A build is only considered ready after the platform artifacts, legal documents and SHA-256 checksums have been verified.

## Installing Brightdesk

**End users do not need to download or install Node.js.** The native desktop application is packaged with the Electron runtime it needs. Install Brightdesk using the installer for your operating system and open it like any other desktop app. See [INSTALLATION.md](docs/INSTALLATION.md) for instructions.

## Development

Building and testing Brightdesk requires exactly Node.js 24.22.2. This is a developer/CI requirement only; it is not a customer installation requirement. Run `npm run setup:dev` after activating that runtime. The project uses its checked-in package lock and automated Node.js tests.

Brightdesk uses original product names, code, artwork and interface design. Microsoft product names are used only as internal workflow comparisons.

## Engineering and design direction

Brightdesk's clean-room capability review, original visual identity, installer design and staged Rust engine plan are documented here:

- [Reference capability review](docs/REFERENCE_CAPABILITY_REVIEW.md)
- [Brightdesk visual identity](docs/BRAND_SYSTEM.md)
- [Installer and update design](docs/INSTALLER_DESIGN.md)
- [Rust engine roadmap](docs/RUST_ENGINE_ROADMAP.md)

The initial Rust core is a separate, tested foundation and is not yet linked into the Electron application. It must pass its own formatting, lint and test workflow before any native bridge is considered.
