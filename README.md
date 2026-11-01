# Brightdesk Office Suite

Brightdesk is an independent native desktop productivity suite. It is not affiliated with Microsoft.

## First release

Version 0.1.0 is planned as a ten-app desktop suite. The complete first-release lineup is shown below, including apps still being developed:

| App | What it does | Status |
| --- | --- | --- |
| Brightdesk Pages | Write and format documents. | Available |
| Brightdesk Sheets | Build spreadsheets, formulas and tables. | Available |
| Brightdesk Decks | Create slide presentations. | Available |
| Brightdesk Notes | Keep notes and ideas together. | Available |
| Brightdesk Database | Organise records, tables and queries. | In development |
| Brightdesk Forms | Create surveys, quizzes and collect responses. | In development |
| Brightdesk Lists | Track projects, inventories and records. | In development |
| Brightdesk Planner | Plan work, tasks and progress. | In development |
| Brightdesk To Do | Manage daily tasks and reminders. | In development |
| Brightdesk Workspace | Bring project notes, tasks and resources together. | In development |

The four marked Available are implemented in the current 0.1.0 codebase. The other six are part of the planned first-release lineup but are not yet working apps. They will only be marked available after implementation and testing.

## Supported installer targets

The release workflow is designed to build macOS universal DMG and PKG installers, Windows x64 EXE installers, and Linux x64 AppImage and DEB packages. A build is only considered ready after the platform artifacts, legal documents and SHA-256 checksums have been verified.

## Installing Brightdesk

**End users do not need to download or install Node.js.** The native desktop application is packaged with the Electron runtime it needs. Install Brightdesk using the installer for your operating system and open it like any other desktop app. See [INSTALLATION.md](docs/INSTALLATION.md) for instructions.

## Development

Building and testing Brightdesk requires exactly Node.js 24.22.2. This is a developer/CI requirement only; it is not a customer installation requirement. Run `npm run setup:dev` after activating that runtime. The project uses its checked-in package lock and automated Node.js tests.

Brightdesk uses original product names, code, artwork and interface design. Microsoft product names are used only as internal workflow comparisons.
