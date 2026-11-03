# Brightdesk Office Suite

Brightdesk is an independent native desktop productivity suite. It is not affiliated with Microsoft.

## First release

Version 0.1.0 presents the complete ten-app Brightdesk catalogue. All ten apps remain visible in the suite; availability reflects implementation progress rather than hiding planned products.

| App | What it does | Implementation status |
| --- | --- | --- |
| Brightdesk Pages | Write and format documents. | Implemented |
| Brightdesk Sheets | Build spreadsheets, formulas and tables. | Implemented |
| Brightdesk Decks | Create slide presentations. | Implemented |
| Brightdesk Notes | Keep notes and ideas together. | Implemented |
| Brightdesk Database | Organise records, tables and structured data locally. | Planned |
| Brightdesk Forms | Create surveys, quizzes and collect responses locally. | Planned |
| Brightdesk Lists | Track projects, inventories and records locally. | Planned |
| Brightdesk Planner | Plan work, tasks and progress locally. | Planned |
| Brightdesk To Do | Manage daily tasks and reminders locally. | Planned |
| Brightdesk Workspace | Bring project notes, tasks and resources together locally. | Planned |

The first integrated 0.1.0 codebase implements Pages, Sheets, Decks and Notes. Database, Forms, Lists, Planner, To Do and Workspace are part of the approved product scope and catalogue, but are not yet implemented. Do not interpret their catalogue presence as a completed feature claim.

The first release remains local-first; the suite does not claim cloud collaboration or Microsoft service integration.

## Supported installer targets

The release workflow is designed to build macOS universal DMG, PKG and ZIP packages, Windows x64 EXE installers, and Linux x64 AppImage and DEB packages. A platform build is only considered ready after its artifacts, legal documents and SHA-256 checksums have been verified. No public release should be published without explicit owner approval.

## Installing Brightdesk

**End users do not need to download or install Node.js.** The native desktop application is packaged with the Electron runtime it needs. Install Brightdesk using the installer for your operating system and open it like any other desktop app. See [INSTALLATION.md](docs/INSTALLATION.md) for instructions.

## Development

Building and testing Brightdesk requires exactly Node.js 24.22.2. This is a developer/CI requirement only; it is not a customer installation requirement. Run `npm run setup:dev` after activating that runtime. The project uses its checked-in package lock and automated Node.js tests.

The GitHub Actions workflows pin third-party actions to immutable commit SHAs and use least-privilege permissions. Installer builds, test results and release artifacts must be verified in GitHub Actions before they are described as passing or ready.

Brightdesk uses original product names, code, artwork and interface design. Microsoft product names are used only as internal workflow comparisons.
