# Brightdesk project memory

The standing project requirement is to use exactly Node.js 24.22.2 LTS for development, testing and release builds.

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

## Permanent cross-platform parity requirement

Brightdesk is one product ecosystem across Windows, macOS and Linux. The Suite and all ten individual products must use the same approved Brightdesk design contract, feature set, source revision, versioned release train, file compatibility, update policy and support standards. Use native operating-system packaging only where required; platform differences must not remove features or create a different product interface.

The Microsoft 365-inspired office workflows and Adobe-inspired creative/publishing workflows must be available consistently in the approved ten products. Keep Brightdesk branding and implementation original. Do not add Outlook, OneDrive, Teams or other products without explicit owner approval.

The Suite and individual product packages must share the canonical implementation and release version. Every candidate release must build and verify the Suite plus all ten individual products on native Windows, macOS and Linux runners, validate checksums and legal files, and pass install, launch, persistence, import/export, update, repair and uninstall checks on each platform. The update channel must work for both Suite and individual product installs. Uninstall must preserve documents, projects, creative assets and settings by default, and remove only the selected product unless the user explicitly approves data deletion.

Native installers and uninstall mechanisms may differ by OS, but download selection, product identity, consent, install/update status, recovery, data preservation and user guidance must be equivalent. Do not claim cross-platform parity or release readiness without successful current-head evidence for every build target and operating system. See docs/CROSS_PLATFORM_PARITY_AND_RELEASE_CONTRACT.md.

