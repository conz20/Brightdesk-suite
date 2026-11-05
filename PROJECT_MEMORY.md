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

## Visual consistency repair — 5 November 2026

A source review found that the ten individual product repositories linked to the shared Brightdesk visual standard but their current stylesheets still contained legacy purple shell overrides. The approved design contract is now being carried onto a clean branch from current Suite `main` in draft PR #67. That branch contains the machine-readable contract, approved light/navy shared theme tokens, ten product accent identities, README updates and regression coverage.

Ten draft product PRs now apply the contract's shared shell and product-specific accent to each product stylesheet and README, with one token regression test per repository:
- Pages #43, Sheets #17, Decks #16, Notes #16, Database #16, Forms #16, Lists #5, Planner #6, To Do #5 and Workspace #5.
- Brightdesk-AI PR #26 mirrors the approved JSON contract and corrects its previous inaccurate UI-parity audit note.

All these PRs are review branches only. None is merged. Tests, genuine running-window visual comparison, accessibility review and native Windows/macOS/Linux build/install acceptance remain outstanding. GitHub Actions attempts associated with these new PR heads showed failed/queued statuses, but sampled failed jobs contained zero executed steps and no downloadable logs. The earlier GitHub notice states that recent account payments failed or the spending limit needs adjustment. Do not interpret these as code-test failures, do not rerun or bypass them, and do not enable paid services. Local verification on Node.js 24.22.2 is still required when an execution environment is available without cost.

Suite PR #60 remains a separate diverged draft. Do not merge or force-update it as part of this visual repair. The new PR #67 is based on current `main` and is limited to the approved shared visual contract and its regression checks.
