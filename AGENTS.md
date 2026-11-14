# Brightdesk contributor instructions

## Runtime

Use exactly Node.js **24.22.2 LTS**. Do not change the pinned runtime in package.json, .nvmrc, .node-version, .npmrc, the dev container or GitHub Actions without explicit project-owner approval.

## Version compatibility

Also pin Electron **45.2.1**, electron-builder **26.18.0** and Rust **1.99.1** wherever those tools apply. Keep manifests, lockfiles, runtime selector files, development containers, build scripts and CI workflows aligned.

Do not reuse older-version code or API guidance unchanged. Port required work to the currently approved API, then update tests, configuration and documentation. Do not mix old/new major-version APIs or run tests with an older runtime to force a pass. Changing the baseline requires explicit owner approval.

Follow [docs/VERSION_COMPATIBILITY.md](docs/VERSION_COMPATIBILITY.md) for the complete cross-repository policy and migration checks.

## Product scope

Keep the approved ten-app catalogue unchanged:
- Pages
- Sheets
- Decks
- Notes
- Database
- Forms
- Lists
- Planner
- To Do
- Workspace

All ten app modules are now integrated into the main suite. Keep their availability and implementation claims accurate; integration does not mean final acceptance, accessibility, persistence, installer or cross-platform verification is complete.

Do not add Outlook, OneDrive, Teams or any other unapproved app.

## Product identity

Brightdesk is an independent product. Use original names, source code, interface design and artwork. Do not claim Microsoft affiliation or copy proprietary Microsoft code or assets.

## Development quality

Read the README before each development stage and update it whenever implementation status, commands, requirements or release readiness changes. Add or update tests for behavioral changes. Run the repository's focused tests and full test suite whenever the available environment permits. Never claim tests or builds passed unless they were actually run successfully.

## Release safety and cost

Do not claim an installer is ready until its platform build, legal files, checksum verification and release tests have passed. Do not publish a GitHub Release unless the project owner explicitly selects the publish option. Keep development and CI workflows within free/no-cost limits; never request payment details or enable paid services.