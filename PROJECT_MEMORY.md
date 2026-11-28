# Brightdesk project memory

The standing project requirement is to use exactly Node.js 24.22.2 LTS for development, testing and release builds.
The approved cross-repository version baseline is Electron 45.2.1, electron-builder 26.18.0 and Rust 1.99.1 wherever those tools apply. Port older code and API guidance forward before reuse; do not mix old APIs or use an older runtime to pass tests. Changes to the baseline need explicit owner approval. See docs/VERSION_COMPATIBILITY.md.

The approved product scope is fixed at ten apps:
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

All ten approved app modules are integrated into the main Brightdesk suite. The codebase includes dedicated feature modules, service/workspace modules where appropriate, and automated tests. Integration is not the same as final product acceptance: real user workflows, accessibility, persistence, upgrades, uninstall and platform installers still require verification.

Outlook, OneDrive and Teams are excluded. Do not add them.

Brightdesk is an independent desktop product with original branding and implementation. Keep installers native to their target operating systems. Keep work within free/no-cost tooling. Do not request payment details, enable paid services or publish a release without explicit owner approval.

Read README.md before each development stage and update it as work progresses. Do not claim tests or builds passed unless they were actually run successfully.

## Version maintenance rule (owner-approved 28 November 2026)
Always check the newest upstream stable versions before updates. Use the newest compatible stable version and prove it with tests/builds. If one candidate breaks compatibility, revert only that component to its previous stable compatible version, record the exception and continue unrelated updates. Do not globally roll back or stop the portfolio for one incompatible dependency. Keep exact versions and evidence recorded; recheck exceptions later. Older versions are acceptable in archives and explicit compatibility exceptions, not as assumed current versions. Continue fixing bugs and updating Brightdesk after 0.1.0.
