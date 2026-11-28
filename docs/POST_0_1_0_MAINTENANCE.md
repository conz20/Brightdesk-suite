# Brightdesk post-0.1.0 permanent maintenance backlog

**Status:** permanent follow-up register; do not treat these items as approved for the 0.1.0 release.
**Created:** 2026-11-28
**Scope:** all 27 `conz20` repositories, the Brightdesk Suite, and the ten approved customer products.

## Operating rule — every update cycle, permanently

1. Keep a version and dependency inventory for all 27 repositories. Record current pin, latest stable upstream version, support status, licence, security advisories, compatibility, and whether an update is approved.
2. Check upstream projects and dependencies on every planned Brightdesk maintenance cycle and before each subsequent release.
3. Adopt only stable, non-prerelease versions. Do not move to a newer major/minor/patch prerelease, nightly, release candidate, beta, or untagged development commit. Wait until the stable release is published.
4. Do not blindly upgrade. Check changelogs, source diffs, licences, platform support, transitive dependencies, security impact, API compatibility, lockfiles, and migration notes. Test the update against Brightdesk before approval.
5. If a newer stable version exists but is not safe to adopt yet, record it here with the blocker and revisit it next cycle. Never silently leave it off the maintenance list.
6. Keep Brightdesk's approved runtime pins and release constraints intact unless a newer **stable** version has been reviewed and explicitly approved for a later release. No downgrades or compatibility workarounds that weaken the product.
7. Preserve Brightdesk's product boundary: exactly ten customer products (Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace). Brightdesk-AI remains internal engineering/tooling; Wiki remains separate public help. Do not add products.
8. Preserve free-forever, local-first operation: no subscriptions, accounts, telemetry, ads, analytics, crash reporting, cloud sync, collaboration, remote AI, or customer document/text uploads. Internet access remains limited to official Brightdesk updates and Brightdesk-controlled language-resource discovery/download.
9. Do not import upstream branding, logos, distinctive trade dress, proprietary code, or dependencies without an explicit licence and architecture review. Treat upstream projects as learning references, not code sources.
10. Keep an auditable record of each check: date, repository, old/new stable versions, source URL, licence/security review, compatibility result, tests, decision, and follow-up owner/action.

## Research: Craft Launcher, WordCraft, DeckCraft and GridCraft

Reviewed public repositories and release/commit history on 2026-11-28. These are candidate patterns for future Brightdesk work, not a statement that Brightdesk already implements them.

### Suite and release/update infrastructure

- [Craft Launcher](https://github.com/storytold/craft-launcher): its 2026-11-27 changes include a signed static release/catalogue source with GitHub fallback, isolated tests for live-catalogue and release fixtures, signed prerelease candidate handling, offline-cache fallback tests, and honoring HTTP `Retry-After` for signed catalogue requests.
- Candidate Brightdesk work: use a Brightdesk-controlled static release manifest; verify signatures and hashes before trusting metadata or installers; cache the last-known-good manifest for offline display; honor `Retry-After` and bounded backoff; impose one explicit request budget across background checks; test live and fixture paths independently. Keep Brightdesk's official update host as the only source. Do not copy ArtCraft endpoints or add third-party runtime services.
- [Launcher release history](https://github.com/storytold/craft-launcher/releases): review update state transitions, version pinning, download/install queues, retry behavior, platform-specific launch identity, and installer integrity. Adapt only what fits Brightdesk's simpler local-first updater. No nightly/developer-build channel for customers unless separately approved.

### Pages

- [WordCraft](https://github.com/storytold/wordcraft): current release notes include editable Markdown source view, image clipboard transfer and internal paste media preservation, editing text boxes inside groups, and platform-correct Save As extension handling. Its wider architecture separates document model, layout, formats, rendering, command engine and UI.
- Candidate Brightdesk work: verify editable Markdown source mode where supported; preserve images and rich content through copy/paste; test grouped-object editing and selection hit-testing; ensure Save As extension follows the selected file type on every OS; improve format round-trip tests and document-model/UI separation.
- WordCraft's public architecture reports hundreds of commands and explicit feature/parity catalogues. Candidate: keep a traceable Pages feature catalogue linking each user-facing command to implementation, test and known limitation.

### Decks

- [DeckCraft](https://github.com/storytold/deckcraft): recent stable changes include modern video decoding, per-entry chart legend formatting, animation/transition ordering, gradient-stop interaction, improved PowerPoint import bounds, shared format primitives, and clearer command protocol documentation.
- Candidate Brightdesk work: test video playback formats and unsupported-codec messages; preserve chart legend text styles; ensure slide animations wait for transitions and replay at the correct time; test gradient editor click behavior; bound PPTX import work and malformed media/XML inputs; keep shape connectors attached during edits; verify undo/redo for grouped shape, notes and animation changes.

### Sheets

- [GridCraft](https://github.com/storytold/gridcraft): recent stable releases include stronger Arabic bidirectional text and font fallback, CJK baseline alignment, formula and import work budgets, workbook view/scroll preservation, row/column structural edit correctness, charts/pivot tables, and update-state handling.
- Candidate Brightdesk work: test Arabic RTL in cells, formula bar and editors; CJK font fallback and baseline alignment; preserve each sheet's scroll position when sheets move; test keyboard range navigation, formula reference selection and structural formula rewrites; add explicit calculation/import/memory budgets; test chart/legend formatting and workbook round-trip fidelity.

## Cross-portfolio candidates

- **All ten products:** build a command/feature registry that maps every visible control to an implemented action, keyboard equivalent where appropriate, automated interaction test, and documented limitation. Avoid decorative or inert controls.
- **All ten products:** maintain a parity checklist for the relevant established productivity workflows, but mark depth and gaps honestly. A command existing is not proof that the workflow is complete.
- **Suite:** add end-to-end tests for real clicks, screen transitions, open/close/reopen, keyboard navigation, window focus, persistence, error feedback, and empty/loading/success/failure states.
- **Engine / Common-Libs / Common-Actions:** review bounded parsing, input-size and resource-amplification protections, undo memory budgets, deterministic serialization, shared format primitives, and property/fuzz tests.
- **Fonts / Localization:** test font discovery and fallback for Latin, Arabic, CJK and complex scripts; ensure language resources are licensed, checksummed, signed and usable offline after installation. Keep dictionaries offline-first and Brightdesk-hosted only.
- **Design-System / Assets:** verify original icons, contrast, focus, scaling, reduced motion, keyboard access and visual consistency at reference and narrow desktop sizes.
- **Release-Tools / Developer-Tools / Services:** review reproducible builds, action/dependency pinning, release manifests, checksum/signature verification, artifact retention, rollback and release-state reporting. Services remains optional owner-operated infrastructure, never a customer runtime dependency.
- **Wiki:** keep everyday help and deep technical docs accurate against actual shipped behavior; never document a planned feature as available.
- **Printing / Voice / Type-Preview / Extensions:** check supported platform integration, offline behavior, accessibility, data boundaries and dependency freshness; retain Type-Preview as local/offline with no hosted preview service.

## Stable-update review log

| Date | Repository / dependency | Current pin | New stable version | Decision and evidence | Next action |
|---|---|---|---|---|---|
| 2026-11-28 | Craft Launcher reference review | n/a | Latest observed commits on 2026-11-27 | Research only; not a Brightdesk dependency | Revisit signed manifest, cache fallback and Retry-After patterns after 0.1.0 |
| 2026-11-28 | WordCraft reference review | n/a | Latest observed stable release v0.19.1 | Research only; alpha project; no code/dependency adoption | Revisit document editing, clipboard and format-fidelity tests after 0.1.0 |
| 2026-11-28 | DeckCraft reference review | n/a | Latest observed stable release v0.19.1 | Research only; alpha project; no code/dependency adoption | Revisit media, charts, animations and import hardening after 0.1.0 |
| 2026-11-28 | GridCraft reference review | n/a | Latest observed stable release v0.19.1 | Research only; alpha project; no code/dependency adoption | Revisit RTL/CJK, workbook fidelity and calculation budgets after 0.1.0 |

## Repository inventory to maintain

The 27-repository count is authoritative. Reconcile this list against GitHub on each maintenance cycle; do not add customer products to reach the count.

1. Brightdesk-suite
2. Brightdesk-Pages
3. Brightdesk-Sheets
4. Brightdesk-Decks
5. Brightdesk-Notes
6. Brightdesk-Database
7. Brightdesk-Forms
8. Brightdesk-Lists
9. Brightdesk-Planner
10. Brightdesk-To-Do
11. Brightdesk-Workspace
12. Brightdesk-AI (internal only)
13. Brightdesk-Assets
14. Brightdesk-Common-Actions
15. Brightdesk-Common-Libs
16. Brightdesk-Design-System
17. Brightdesk-Developer-Tools
18. Brightdesk-Extensions
19. Brightdesk-Fonts
20. Brightdesk-Localization
21. Brightdesk-Printing
22. Brightdesk-Release-Tools
23. Brightdesk-Services (optional owner-operated infrastructure only)
24. Brightdesk-Type-Preview (local/offline only)
25. Brightdesk-Voice
26. Brightdesk-Wiki (separate online help)
27. Brightdesk-Engine

**Release boundary:** this backlog is for work after 0.1.0. A candidate discovered here must not be slipped into 0.1.0 without a separate scope, risk and verification decision.

## Portfolio manifest audit — 2026-11-28

The 27-repository manifest review found 26 Node.js package manifests and one Rust-only repository (Brightdesk-Engine). Twenty-five Node.js manifests pin Node 24.22.2; Brightdesk-Design-System already declares Node 24.22.3. Do not downgrade that repository. Keep the approved 0.1.0 pins unchanged and make the first post-release Node maintenance action a reviewed alignment to stable Node 24.22.3 across the Node repositories, subject to native-module compatibility, all-platform builds, product tests and lockfile verification.

The Suite and all ten standalone product manifests currently share these direct dependency pins: `docx@9.15.1`, `electron-updater@6.8.11`, `exceljs@4.4.0`, `fast-xml-parser@5.11.2`, `jszip@3.10.2`, `mammoth@1.12.2`, `nspell@2.1.5` and `pptxgenjs@4.0.1`; their development pins are `electron@45.2.1` and `electron-builder@26.18.0`.

The eight Rust toolchain manifests reviewed (Suite, AI, Lists, Planner, To Do, Workspace, Voice and Engine) all pin Rust 1.99.1. Rust 1.100.0 remains on the permanent post-release review list. This is a manifest inventory, not a claim that every repository's complete transitive lockfile has already been independently audited.

## Stable runtime updates queued for the first post-0.1.0 maintenance cycle

Checked against official release sources on 2026-11-28. Keep the 0.1.0 pins unchanged; these are confirmed stable follow-ups, not prereleases.

| Component | 0.1.0 pin | New stable release | Priority / reason | Source |
|---|---:|---:|---|---|
| Node.js 24 LTS | 24.22.2 | **24.22.3** (2026-11-11) | **Highest priority:** security release with multiple high-severity HTTP/2 and TLS fixes. Review and adopt first after 0.1.0, subject to full cross-platform tests. | https://github.com/nodejs/node/releases |
| Rust | 1.99.1 | **1.100.0** (2026-11-12) | Latest stable Rust line. Review toolchain, native addon, all product crates and platform builds; the 1.99 line is superseded. | https://blog.rust-lang.org/releases/ |
| Electron 45 | 45.2.1 | **45.5.0** (2026-11-24) | Stable patch update on the pinned major. Review Chromium/Node changes, native module compatibility, window behavior, security fixes and installers. Do not jump to Electron 46 alpha/beta. | https://releases.electronjs.org/ |
| electron-builder 26 | 26.18.0 | **26.18.1** | Stable v26 release tag is available; npm's `latest` tag still points to 26.18.0 while `v26` points to 26.18.1. Verify release metadata, signatures/checksums and all 66 artifact targets before adopting. | https://www.npmjs.com/package/electron-builder?activeTab=versions |

These four versions must remain visible on the maintenance list until each is either adopted in a later stable Brightdesk release or explicitly deferred with a documented compatibility/security reason. Recheck the upstream stable version before implementation because newer stable patches may have appeared by then. Do not adopt Electron 46 prereleases or Node.js 27 alpha/nightly builds.
