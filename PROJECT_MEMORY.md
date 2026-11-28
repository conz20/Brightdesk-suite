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
## Permanent README, licence and security separation — portfolio-wide

This is a standing rule for **all 28 Brightdesk repositories**. Keep the three root documents separate:

- `README.md`: Brightdesk/project/product identity, approved branding, purpose, scope, features, setup and verified status only. Never put licence grants, legal restrictions, licensing explanations, security policy, vulnerability-reporting instructions or security procedures in it.
- `LICENSE`: the complete operative software licence for only the material it actually covers. Keep third-party notices and item-level font/asset licences separate.
- `SECURITY.md`: vulnerability reporting and security policy only. Do not merge it with the README or licence.

Do not use a copyright mark as a substitute for the original Brightdesk Suite identity. Keep the original four-panel mark and wordmark unchanged.

## Owner-directed future licensing target — 29 November 2026

The owner has directed a **non-MIT Brightdesk Freeware Licence** as the future target for eligible Brightdesk-owned customer software: free of charge, personal and internal-business use, no subscriptions/trials/accounts/activation, and no resale, sublicensing, redistribution or modified proprietary copies without permission. This direction supersedes the previous recommendation to retain MIT as the future target.

This does **not** remove or narrow any existing MIT grants. The current Suite and ten customer-product repositories still contain MIT notices/package declarations, and third-party rights remain separate. Do not replace existing LICENSE files or claim the new licence is active until contributor/rights-holder clearance, written permissions where needed, file-level third-party review, clear version/file boundaries and qualified legal review are complete. The detailed decision and non-operative draft are held in the private Brightdesk-Archives repository.
