# Brightdesk Office Suite

Brightdesk is an independent desktop productivity suite. It is not affiliated with Microsoft.

## First release scope

Version 0.1.0 is the planned integrated ten-product release. The approved product lineup is fixed:

| Product | First-use scope represented in the source |
| --- | --- |
| Brightdesk Pages | Write and format documents. |
| Brightdesk Sheets | Build spreadsheets, formulas and tables. |
| Brightdesk Decks | Create slide presentations. |
| Brightdesk Notes | Keep notes and ideas together. |
| Brightdesk Database | Organise records, tables and structured data locally. |
| Brightdesk Forms | Create surveys, quizzes and collect responses locally. |
| Brightdesk Lists | Track projects, inventories and records locally. |
| Brightdesk Planner | Plan work, tasks and progress locally. |
| Brightdesk To Do | Manage daily tasks and reminders. |
| Brightdesk Workspace | Bring project notes, tasks and resources together locally. |

These are first-use capabilities represented in the integrated source. They are not a claim of complete Microsoft 365 or Adobe capability parity, final accessibility sign-off, or completed runtime acceptance. The first release is local-first and does not claim cloud collaboration or Microsoft service integration.

## Suite and individual product downloads

The planned release bundle contains the complete Suite and a separately installable build for each of the ten approved products. The individual product builds use the same Brightdesk product identities and shared design rules.

All ten individual GitHub repositories now exist. On 5 November 2026, the repository check confirmed that each has a `main` default branch and a readable `package.json`. This confirms repository and manifest presence only; it does not prove that every product has complete feature parity, passing current-head CI, or a verified installer. See [the product repository map](docs/PRODUCT-REPOSITORIES.md).

## Supported installer targets

The workflow defines these expected native package formats for the Suite and each individual product:

- **Windows:** x64 NSIS `.exe`
- **macOS:** universal `.dmg`, `.pkg` and `.zip`
- **Linux:** x64 AppImage and Debian `.deb`

That is a planned set of 66 installer/archive outputs across eleven targets (the Suite plus ten products) and three operating systems. A workflow definition is not proof of a successful build. Release readiness requires real artifacts from the same candidate commit, correct versions and architectures, legal files, SHA-256 checksums, and successful install/runtime checks on native Windows, macOS and Linux runners. The current installer PR remains a draft until those checks are evidenced.

## Update availability

**Automatic update publishing is not configured yet.** In the current installer branch, the Suite's `build.publish` list and the individual-product builder's `publish` list are empty. The packaged updater checks this configuration and reports that automatic updates are unavailable.

The update controls in the interface are not evidence that updates can be delivered. Before enabling update claims, configure a real publishing provider and release channel, then verify discovery, download, signature/checksum validation and user-approved installation from older Suite and individual-product installations on all three operating systems. Linux DEB updates also need a documented, tested package-manager or replacement-package path. Do not describe any of these update paths as verified until those tests pass.

## Installing Brightdesk

End users do not need to download or install Node.js. The desktop build packages the Electron runtime it needs. Use only a verified installer for the computer's operating system. If a verified package is not listed on the official release page, it has not been published.

## Development

Building and testing Brightdesk requires exactly Node.js 24.22.2. This is a developer/CI requirement only; it is not a customer installation requirement. Run `npm run setup:dev` after activating that runtime. The project uses its checked-in package lock and automated tests.

Brightdesk uses original product names, code, artwork and interface design. Microsoft and Adobe are capability references only; their proprietary code, logos, artwork and distinctive trade dress are not used.
