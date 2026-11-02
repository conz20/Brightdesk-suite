# Brightdesk capability gap analysis

Date: 2026-11-03

## Purpose and evidence boundary

This is a clean-room comparison of public Storytold repository documentation with Brightdesk source code on the `feature/standalone-downloads-all-ten` branch. It records observable code paths and product gaps; it does not copy third-party source, artwork, names or distinctive layouts.

The review is static. The REA Reverse Engineer Anything runtime/MCP tools are not connected in this ChatGPT session, so no binary decompilation, target execution, runtime tracing or REA scan is claimed. Storytold repositories reviewed include `craft-launcher`, `wordcraft`, `gridcraft`, `deckcraft`, `pdfcraft` and `craft-libs`.

## Brightdesk baseline observed in source

The branch contains the fixed ten-app catalogue and dedicated local-first modules for the six additional apps. Evidence includes:

- `src/app-catalog.js`: ten approved product IDs; all currently marked `available`.
- `src/todo-service.js`, `src/lists-service.js`, `src/forms-service.js`, `src/planner-service.js`, `src/database-service.js`, `src/workspace-service.js`: app-specific data/service logic.
- `src/forms-workspace.js`, `src/planner-workspace.js`, `src/database-workspace.js`, `src/workspace-editor.js`: dedicated UI workspaces.
- `src/app.js`: routes the six additional apps to their dedicated UI modules; it also retains a generic editor fallback.
- `src/file-service.js`: local project validation and Office-format import/export paths.
- `src/standalone-downloads.js`, `scripts/build-app.js`, `scripts/build-apps.js` and `electron-builder.app.config.js`: ten-product download/build configuration.
- `tests/`: app-specific service and UI integration tests, catalogue/scope tests, installer and release checks.

“Available” here means an integrated local workflow exists. It does not mean feature parity with a large commercial office application, cloud collaboration, or verified release readiness.

## Reference capability patterns worth learning from

| Public reference | Observable capability pattern | Brightdesk adaptation |
|---|---|---|
| Craft Launcher | One catalogue; grid/table views; installed/latest versions; OS/CPU-aware packages; checksum verification; install/update/open lifecycle; tray/menu-bar access | Evolve the Brightdesk Product Centre into a trustworthy local product manager with real install state, verified downloads and clear update/recovery states |
| WordCraft | Rich document model; styles; page layout; tables; references; review; mail merge; multiple import/export formats; command-driven actions | Expand Pages in stages around a stable document model and verified DOCX/PDF fidelity |
| GridCraft | Large formula library; dynamic arrays; structured tables; conditional formatting; pivot tables; charts; XLSX round-trip | Expand Sheets around formula correctness, workbook fidelity and data analysis features, not just visual controls |
| DeckCraft | Slide masters/layouts; shapes/connectors; media; charts; transitions/animations; presenter workflow; PPTX round-trip | Build Decks around a real slide/object model and reliable PPTX round-trip |
| PdfCraft | High-fidelity PDF viewing; search/selection; annotations; page organization; guarded edits; robust file handling | Improve PDF export and document interchange inside the approved apps; do not add a separate PDF app without approval |
| Craft Libraries | Reusable atomic writes, PDF, i18n, fonts, keymaps, dialogs and path-safety libraries | Adopt the engineering principles where they fit Brightdesk; do not import code without licence and dependency review |

## Product-by-product gap list

These are capability targets to evaluate, not claims that every item must ship in version 0.1.0.

| Brightdesk app | Existing foundation observed | Important next capabilities to evaluate |
|---|---|---|
| Pages | Editable document workspace; DOCX import/export and PDF export paths | Document styles, robust page layout, headers/footers, tables, images, page/section breaks, comments, tracked changes, references, accessibility and round-trip fidelity |
| Sheets | Cell grid, formula evaluation and workbook export/import paths | Broader formula compatibility, named ranges, tables, sorting/filtering, validation, conditional formatting, charts, pivot tables, recalculation correctness and XLSX round-trip tests |
| Decks | Slide creation/editing basics and PPTX export/import paths | Slide masters/layouts, object positioning, shapes/connectors, charts, notes, themes, media, transitions, animations, presenter mode and PPTX round-trip tests |
| Notes | Local note editing and persistence | Notebook/section/page hierarchy, tags, search, attachments, templates, export and cross-linking |
| Database | Local database/table/field/record model and dedicated workspace | Relationships, views, query/filter builder, import/export, validation, indexes, larger-data performance and backup/restore |
| Forms | Local form/question/response model with preview and response views | Conditional branching, richer validation, response export, accessible form controls, summary analytics and safe sharing options that do not require a cloud service |
| Lists | Local structured lists, columns and records | More field types, saved views, sorting/filtering, bulk edits, import/export, validation and linked records |
| Planner | Local plans, buckets, tasks, priorities, progress, due dates and labels | Calendar/timeline views, recurring tasks, dependencies, reminders, better assignment workflows and plan export |
| To Do | Local personal tasks, completion, priorities and due-date handling | Recurrence, subtasks, reminder notifications, smart lists, keyboard workflows and reliable backup/export |
| Workspace | Local workspaces, pages and typed content blocks | Reusable templates, backlinks, cross-app references, embedded app data, richer blocks, search and safe local linking between projects |

## Cross-suite engineering priorities

### P0 — prove what is actually ready

1. Keep the exact ten-app catalogue and exclusions enforced.
2. Make app readiness and installer availability truthful and separately represented.
3. Run all tests on the exact Node.js 24.22.2 runtime.
4. Build every suite and individual-product installer on native Windows, macOS and Linux runners.
5. Smoke-test clean install, first launch, data persistence, upgrade, rollback/repair and uninstall on each platform.
6. Verify each installer checksum, architecture, legal files and signing/notarisation claims.
7. Keep release publication manual and owner-approved.

### P1 — strengthen the product foundations

1. Define versioned, validated document/workbook/presentation and app-data models.
2. Use crash-safe atomic writes, backups and recovery for every user-data store.
3. Add import/export round-trip fixtures from real-world documents, including malformed and oversized inputs.
4. Add keyboard shortcuts, command search and accessible focus/keyboard navigation consistently.
5. Add performance fixtures for large documents, sheets, lists and databases before choosing any Rust workload.
6. Make all app data exportable and recoverable without a Brightdesk account or cloud service.

### P2 — build the launcher lifecycle

1. Track installed product version and latest available version separately.
2. Resolve downloads by OS and CPU architecture.
3. Verify downloaded bytes against a trusted release checksum manifest before installation.
4. Stage updates, detect running applications, preserve user data and provide a repair/rollback path.
5. Show clear progress, cancellation and actionable failure messages.
6. Add tray/menu-bar integration only if it remains useful and does not create unwanted background behaviour.

### P3 — consider a native engine selectively

Storytold's Rust architecture is a useful reference, but Brightdesk should not rewrite Electron merely to match it. First benchmark an actual Brightdesk hot path. Only then prototype a small Rust library behind a versioned boundary, with JavaScript parity tests and native builds for every supported platform. The existing Rust foundation is not yet integrated and makes no performance claim.

## Explicit non-goals

- Do not add Outlook, OneDrive, Teams, PDFCraft or any other unapproved app.
- Do not copy Storytold or Microsoft source, logos, icons, screenshots, distinctive UI or proprietary assets.
- Do not claim feature parity, cloud collaboration, sync, signed installers or successful builds without evidence.
- Do not add silent privileged installs, forced restarts or hidden network activity.
- Do not publish a public release without explicit owner approval.

## Immediate recommended sequence

1. Resolve the GitHub Actions runner-allocation blocker so the existing test and native installer workflow can execute.
2. Merge the clean-room brand/launcher foundation only after CI validation.
3. Merge the ten-product build/repository preparation only after the full suite and all ten product installers pass native CI.
4. Finish and verify the launcher download/checksum/update lifecycle.
5. Improve one app at a time, beginning with Pages and Sheets, using acceptance tests and real file round-trip fixtures before expanding features.
