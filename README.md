# Brightdesk Office Suite

Brightdesk is an independent native desktop productivity suite. It is not affiliated with Microsoft.

## First release

Version 0.1.0 is the integrated ten-product desktop suite. The complete first-release lineup is shown below:

| Product | What it does | Status |
| --- | --- | --- |
| Brightdesk Pages | Write and format documents. | Available |
| Brightdesk Sheets | Build spreadsheets, formulas and tables. | Available |
| Brightdesk Decks | Create slide presentations. | Available |
| Brightdesk Notes | Keep notes and ideas together. | Available |
| Brightdesk Database | Organise records, tables and structured data locally. | Available |
| Brightdesk Forms | Create surveys, quizzes and collect responses locally. | Available |
| Brightdesk Lists | Track projects, inventories and records locally. | Available |
| Brightdesk Planner | Plan work, tasks and progress locally. | Available |
| Brightdesk To Do | Manage daily tasks and reminders. | Available |
| Brightdesk Workspace | Bring project notes, tasks and resources together locally. | Available |

All ten products are integrated in the 0.1.0 codebase and have dedicated workspaces, service/UI tests and native desktop installer targets. The first integrated release remains local-first; these products do not claim cloud collaboration or Microsoft service integration.

## Download the complete suite or an individual product

The main Brightdesk installer contains all ten approved products. The Brightdesk Product Centre also provides an individual desktop installer for each product, so you can install only the product you need without installing the complete suite.

The product installers are built from the same tested source as the suite and are checked as part of each release build. The product repository folders provide separate homes for each product's code, documentation and artwork. Brightdesk-Pages is the only separate product repository currently confirmed to exist; the other nine product folders still need their GitHub repositories created and populated. See docs/PRODUCT-REPOSITORIES.md for the repository map.

## Supported installer targets

The release workflow builds macOS universal DMG and PKG installers, Windows x64 EXE installers, and Linux x64 AppImage and DEB packages for the complete suite and each product. A build is only considered ready after the platform artifacts, legal documents and SHA-256 checksums have been verified.

## Installing Brightdesk

End users do not need to download or install Node.js. The native desktop program is packaged with the Electron runtime it needs. Install Brightdesk using the installer for your operating system and open it like any other desktop program. See INSTALLATION.md in docs for instructions.

## Development

Building and testing Brightdesk requires exactly Node.js 24.22.2. This is a developer/CI requirement only; it is not a customer installation requirement. Run npm run setup:dev after activating that runtime. The project uses its checked-in package lock and automated Node.js tests.

Brightdesk uses original product names, code, artwork and interface design. Microsoft product names are used only as internal workflow comparisons.
