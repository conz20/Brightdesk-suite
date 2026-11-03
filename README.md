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

Pull requests use one consolidated Brightdesk quality gate. It checks Node.js 24.22.2, the committed dependency lock, third-party licences, app-module syntax, the complete test suite, release preflight and high-severity dependency vulnerabilities. The same gate runs weekly. Native installer builds remain a separate, non-publishing release check.

The private repository's native Actions runner issue is still tracked in [Brightdesk-suite issue #23](https://github.com/connormolloy12/Brightdesk-suite/issues/23). The public Brightdesk-Pages maintenance controller provides a separate no-publication path using short-lived, repository-scoped read-only tokens and private issue-only diagnostics.

The latest full test and installer verification is [Brightdesk-Pages run 41718905454](https://github.com/connormolloy12/Brightdesk-Pages/actions/runs/41718905454). The controller regression tests passed under Node.js 24.22.2. The complete `npm test` command passed for Brightdesk-suite and the other five existing private repositories on Linux. The Suite startup smoke-test implementation was added in [Brightdesk-suite PR #34](https://github.com/connormolloy12/Brightdesk-suite/pull/34); the trusted native installer checker was updated in [Brightdesk-Pages PR #33](https://github.com/connormolloy12/Brightdesk-Pages/pull/33). On the latest run, the Brightdesk Suite Linux and Windows installer jobs passed package verification, checksum generation, temporary installation, the packaged startup/interface check, and uninstall. The macOS job has not started: it remains queued without a hosted runner assignment. The matrix is therefore not complete.

The run produced no uploaded workflow artifacts and no customer release. Private source, raw command output and installer files remain on temporary runners. The Linux and Windows test results verify those two candidate paths only; they do not make Brightdesk generally release-ready.

## Supported installer targets

The release workflow is designed to build macOS universal DMG, PKG and ZIP packages, Windows x64 EXE installers, and Linux x64 AppImage and DEB packages. A platform build is only considered ready after its artifacts, legal documents and SHA-256 checksums have been verified. No public release should be published without explicit owner approval.

## Installing Brightdesk

**End users do not need to download or install Node.js.** The native desktop application is packaged with the Electron runtime it needs. Install Brightdesk using the installer for your operating system and open it like any other desktop app. See [INSTALLATION.md](docs/INSTALLATION.md) for instructions.

## Development

Building and testing Brightdesk requires exactly Node.js 24.22.2. This is a developer/CI requirement only; it is not a customer installation requirement. Run `npm run setup:dev` after activating that runtime. The project uses its checked-in package lock and automated Node.js tests.

The GitHub Actions workflows pin third-party actions to immutable commit SHAs and use least-privilege permissions. Installer builds, test results and release artifacts must be verified before they are described as passing or ready. If hosted runners are unavailable, run `npm run verify:local-release` on each target operating system; see [Local release verification](docs/LOCAL-RELEASE-VERIFICATION.md). This local process does not upload or publish anything.

Brightdesk uses original product names, code, artwork and interface design. Microsoft product names are used only as internal workflow comparisons.
## Updates and customer control

Automatic update checking can be turned on or off. Turning it off stops scheduled and focus-triggered checks. Brightdesk never downloads or installs an update automatically; the customer must choose **Download update** and then **Install update**. The release feed is not configured in the current development build, so update checks will remain unavailable until the approved distribution repository is configured.
