# Brightdesk Office Suite

Brightdesk is an independent native desktop productivity suite. It is not affiliated with Microsoft.

## First release

Version 0.1.0 contains the complete ten-app Brightdesk catalogue and integrated app modules. All ten apps remain visible in the suite.

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
| Brightdesk To Do | Manage daily tasks and reminders. | Integrated |
| Brightdesk Workspace | Bring project notes, tasks and resources together locally. | Integrated |

All ten approved app modules are present in the integrated suite, with dedicated service/workspace code and automated integration coverage. “Integrated” describes the current codebase; it does not mean every workflow, accessibility scenario, data migration, installer or operating-system build has passed final acceptance testing.

The first release remains local-first; the suite does not claim cloud collaboration or Microsoft service integration.

## Quality verification

The automated test suite includes service tests, app-shell integration tests and DOM-contract checks for the integrated workspaces. Database CSV export also prefixes formula-like text values so spreadsheet programs are less likely to interpret user-entered text as formulas. These checks help protect module-to-shell connections and core logic; they do not replace real app interaction, data-persistence, accessibility, cross-platform build, installation, upgrade or uninstall testing.

The GitHub Actions build workflow is configured to test the project and build platform installers. Recent hosted workflow runs have failed before any runner steps were recorded, so no installer build is currently verified as passing. Do not describe an installer as ready until its platform build, legal files, SHA-256 checksums and release tests have passed.

## Supported installer targets

The release workflow is designed to build macOS universal DMG, PKG and ZIP packages, Windows x64 EXE installers, and Linux x64 AppImage and DEB packages. A platform build is only considered ready after its artifacts, legal documents and SHA-256 checksums have been verified. No public release should be published without explicit owner approval.

## Installing Brightdesk

**End users do not need to download or install Node.js.** The native desktop application is packaged with the Electron runtime it needs. Install Brightdesk using the installer for your operating system and open it like any other desktop app. See [INSTALLATION.md](docs/INSTALLATION.md) for instructions.

## Development

Building and testing Brightdesk requires exactly Node.js 24.22.2. This is a developer/CI requirement only; it is not a customer installation requirement. Run `npm run setup:dev` after activating that runtime. The project uses its checked-in package lock and automated Node.js tests.

The GitHub Actions workflows pin third-party actions to immutable commit SHAs and use least-privilege permissions. Installer builds, test results and release artifacts must be verified before they are described as passing or ready.

Brightdesk uses original product names, code, artwork and interface design. Microsoft product names are used only as internal workflow comparisons.
## Updates and customer control

Automatic update checking can be turned on or off. Brightdesk never downloads or installs an update automatically; the customer must choose **Download update** and then **Install update**.
