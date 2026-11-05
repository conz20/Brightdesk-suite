# Brightdesk Office Suite — capability benchmark and implementation contract

**Status:** Research and implementation target, not a claim that these capabilities are already implemented.
**Scope:** Exactly the ten approved Brightdesk products and the shared desktop suite.
**Design authority:** `docs/BRIGHTDESK_VISUAL_STANDARD.md` and the approved suite README.
**Runtime:** Node.js 24.22.2; local-first desktop software.

## Purpose

Use current Microsoft 365 product capabilities as a functional benchmark for quality, workflow completeness and usability. Build original Brightdesk implementations with comparable task coverage and familiar productivity conventions, while preserving Brightdesk names, code, icons, visual identity and interaction design.

This is a capability benchmark, not a request to reproduce Microsoft's source code, assets, branding, exact screen layouts or distinctive trade dress. Do not use Microsoft logos, product icons, screenshots or copied interface assets.

Microsoft 365 includes services beyond the approved Brightdesk scope. They are research references only; they do not expand the product catalogue.

## Non-negotiable product and architecture rules

- Exactly ten products: Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace.
- Do not add Outlook, OneDrive, Teams or any other product.
- The ten individual repositories are the product source projects. The suite must bring their actual feature modules, data services, tests and original assets into one integrated desktop experience; it must not merely link to, launch, or install ten unrelated programs.
- A user should be able to move between all ten products without leaving the suite. Shared navigation, settings, search, file handling, notifications and local storage conventions should feel like one product.
- Preserve local-first behaviour. Do not introduce accounts, cloud storage, online workspaces, cloud sync or multi-user collaboration as implied or silently enabled capabilities. Any future network-dependent feature needs a separately approved design and clear opt-in.
- Keep the existing Brightdesk visual standard: four-panel brand mark, lowercase wordmark, deep navy navigation, calm light workspaces, original product icons, restrained product accents, consistent controls and accessible focus states.
- All visible actions must work. Do not add decorative controls that pretend to be functional.
- Keep current version 0.1.0 unless separately approved. Do not publish releases or tags as part of this work.
- README feature claims and screenshots must reflect tested running software. Concept artwork remains labelled as concept artwork.

## Research basis

Microsoft's current product catalogue includes Word, Excel, PowerPoint, OneNote, Access, Forms, Lists, Planner, To Do and Loop, among other services. This benchmark maps only the ten Brightdesk products to the closest task categories.

Useful official references:
- Microsoft 365 app catalogue: https://www.microsoft.com/en-au/microsoft-365/products-apps-services
- Microsoft 365 suite feature overview: https://learn.microsoft.com/en-us/office365/servicedescriptions/office-365-platform-service-description/office-365-suite-features
- Office application feature availability: https://learn.microsoft.com/en-us/office365/servicedescriptions/office-applications-service-description/office-applications-service-description
- Office for the web feature comparison: https://learn.microsoft.com/en-us/office365/servicedescriptions/office-online-service-description/office-online-service-description
- Microsoft Loop concepts and portable components: https://support.microsoft.com/en-us/loop/get-started-with-microsoft-loop
- Microsoft 365 co-authoring requirements: https://support.microsoft.com/en-us/sharepoint/get-started-with-sharepoint/document-collaboration-and-co-authoring
- Microsoft Planner views: https://support.microsoft.com/en-us/planner/create-a-plan-in-microsoft-planner
- Microsoft Planner timeline: https://support.microsoft.com/en-us/planner/timeline-view
- Microsoft To Do reminders and recurrence: https://support.microsoft.com/en-us/todo/add-due-dates-and-reminders-in-microsoft-to-do
- Microsoft Forms branching: https://support.microsoft.com/en-au/forms/use-branching-logic-in-your-form
- Microsoft Lists view formatting: https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/formatting-list-views
- Microsoft Access table relationships: https://support.microsoft.com/en-us/access/guide-to-table-relationships
- OneNote search: https://support.microsoft.com/en-us/onenote/onenote-help-and-learning/search-notes-in-onenote

Features vary by platform, subscription and service plan. Do not treat every Microsoft 365 capability as available in every Microsoft product or every plan.

## Current capability observations — reviewed 5 November 2026

The following points are drawn from Microsoft's current official support material. They describe task capabilities worth benchmarking, not a specification to duplicate Microsoft's interface. Microsoft documents that availability can differ by application version, operating system, web versus desktop, and subscription or licence. Brightdesk should implement the useful underlying tasks in its own design and must label any unsupported import/export or advanced behaviour honestly.

| Brightdesk product | Current reference capabilities observed | Brightdesk interpretation |
| --- | --- | --- |
| **Pages** | Word documentation covers document collaboration and review workflows, including Track Changes with accept/reject, plus version history and accessibility checking in the feature comparison. Word also supports editable headers, footers and page numbers. | Build original document-review tools, accessible document checks, reusable styles and reliable page layout. Where Brightdesk is local-only, implement local revision history rather than implying cloud co-authoring or shared version history. |
| **Sheets** | Excel documents conditional formatting rules (including value-based highlights, scales and icon sets) and PivotTable layout/formatting for summarising and exploring data. | Prioritise reliable formulas and references first, then tables, charts, conditional-format rules and summary/pivot analysis. Keep recalculation, formula errors and export fidelity testable. |
| **Decks** | PowerPoint separates slide transitions from object animations. Presenter View can show the current and next slide, speaker notes, a timer, slide thumbnails and presentation controls. | Treat transitions and object animation as separate features. Add speaker notes and a presenter console only when they work in the packaged desktop runtime, including multi-display testing where supported. |
| **Notes** | OneNote search can cover one page, a section, a notebook or all notebooks. Its documentation also describes searching handwriting, images and spoken words in audio/video when the relevant audio-search option is enabled. | Provide fast local full-text search across Brightdesk notebooks and pages. Treat OCR, handwriting recognition and media transcription as separate optional capabilities, not assumed baseline behaviour. |
| **Database** | Access relationships connect tables through common fields; queries can filter, summarise, and select, append, update or delete records, including queries that assemble information from multiple tables. | Build a real relational data model with keys, relationship validation and a safe query layer. Never expose destructive bulk query actions without preview, confirmation and rollback/recovery safeguards. |
| **Forms** | Forms supports sections and response-based branching so respondents can skip questions or move to relevant later questions. Sections can also be moved or duplicated. | Add sections and deterministic forward branching to the local form engine. Validate branch targets, prevent unreachable questions, and test preview and submission using the exact same routing rules. |
| **Lists** | Lists supports reusable custom views, column selection/reordering, sort, filter and group operations. View formatting can apply conditional styles, and rules can react to list changes. | Build saved local views over one data set, with sorting/filtering/grouping and clear rule previews. Keep formatting separate from data, and do not imply background notifications unless the local service is actually running. |
| **Planner** | Planner's documented basic views include Grid, Board, Charts and Calendar/Schedule. Timeline is a Gantt-style view with task bars and date adjustment; some advanced views depend on a premium licence. | Bring useful views to local plans without a subscription gate: board, grid and calendar first; add a timeline only after start/finish dates and duration logic are reliable. Do not present premium-only Microsoft features as universal. |
| **To Do** | To Do supports due dates, reminders, repeat schedules, task steps and the My Day planning experience with suggested tasks. Platform support for individual conveniences can vary. | Prioritise dependable task details, subtasks, due dates and recurring rules. Local reminders require explicit permission/settings and reliable desktop scheduling; My Day suggestions should remain transparent and dismissible. |
| **Workspace** | Loop is built around workspaces, flexible pages and portable components such as lists, tables and notes. Shared components stay synchronised across connected Microsoft apps. | Create Brightdesk-native reusable blocks and live local references to its own Pages, Sheets, Decks, Lists and tasks. Keep references consistent after edits and restart, but do not claim cross-device/cloud co-authoring in a local-first product. |

### Source notes for the observations

- [Word feature comparison: desktop and web](https://support.microsoft.com/en-au/word/word-features-comparison-word-for-the-web-vs-desktop) — collaboration, Track Changes, version history and accessibility feature availability.
- [Collaborate in Word](https://support.microsoft.com/en-us/word/training/collaborate-in-word) and [edit headers and footers](https://support.microsoft.com/en-us/word/edit-your-existing-headers-and-footers-in-word) — review flow and page furniture.
- [Excel conditional formatting](https://support.microsoft.com/en-us/excel/use-conditional-formatting-to-highlight-information-in-excel) and [PivotTable layout and formatting](https://support.microsoft.com/en-us/excel/design-the-layout-and-format-of-a-pivottable) — rule-based formatting and data summaries.
- [PowerPoint Presenter View](https://support.microsoft.com/en-us/powerpoint/training/use-presenter-view-in-powerpoint) and [animations versus transitions](https://support.microsoft.com/en-us/powerpoint/the-difference-between-animations-and-transitions) — presenter controls and distinct motion models.
- [Search notes in OneNote](https://support.microsoft.com/en-us/onenote/onenote-help-and-learning/search-notes-in-onenote) — search scopes and optional audio/video search.
- [Access table relationships](https://support.microsoft.com/en-us/access/guide-to-table-relationships) and [introduction to queries](https://support.microsoft.com/en-us/access/introduction-to-queries) — relational design and query types.
- [Forms branching logic](https://support.microsoft.com/en-us/forms/use-branching-logic-in-your-form) and [form sections](https://support.microsoft.com/en-us/forms/add-sections-to-your-survey-or-questionnaire) — conditional respondent paths and section management.
- [Create or change a Lists view](https://support.microsoft.com/en-us/sharepoint/lists/create-change-or-delete-a-view-of-a-list-or-library), [format list views](https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/formatting-list-views), and [automate a list](https://support.microsoft.com/en-au/sharepoint/lists/documents-and-library/create-a-rule-to-automate-a-list-or-library) — saved views, conditional formatting and rules.
- [Planner plan views](https://support.microsoft.com/en-us/planner/create-a-plan-in-microsoft-planner), [Timeline view](https://support.microsoft.com/en-us/planner/timeline-view), and [Planner licence FAQ](https://support.microsoft.com/en-us/planner/frequently-asked-questions-about-microsoft-planner) — view types and plan-tier differences.
- [To Do due dates and reminders](https://support.microsoft.com/en-us/todo/add-due-dates-and-reminders-in-microsoft-to-do) and [My Day planning](https://support.microsoft.com/en-au/todo/plan-and-connect-with-microsoft-to-do) — recurrence, reminders and daily planning.
- [Get started with Loop](https://support.microsoft.com/en-au/loop/get-started-with-microsoft-loop) — workspace, page and portable-component model.

These links are research references. They do not grant permission to reuse Microsoft's proprietary code, assets, branding, screenshots or exact screen compositions. The Brightdesk implementation must remain original.

## Product capability benchmark

The "current foundation" column reflects the documented first-use scope in the Brightdesk repositories at the time of this audit. The target column is a staged capability direction, not a promise that every item belongs in the first release.

| Brightdesk product | Benchmark category | Current documented foundation | Brightdesk capability direction |
| --- | --- | --- | --- |
| **Pages** | Word — document authoring | Text editing, basic formatting, headings, lists, simple tables, page size/orientation/margins, project save and supported import/export | Strong document canvas; styles and themes; headers/footers; page/section breaks; images and links; tables; find/replace; spelling/proofing; comments/track changes only if a real local workflow is designed; reliable DOCX/PDF import/export and print preview |
| **Sheets** | Excel — spreadsheets and analysis | Cell editing, formula bar, basic arithmetic and range functions, row/column editing, sorting, CSV/XLSX support | Multiple sheets; cell formats; formula/function library with clear error handling; references and ranges; fill/copy; filters and tables; charts; conditional formatting; data validation; freeze panes; find/replace; import/export fidelity and workbook recovery |
| **Decks** | PowerPoint — presentations | Create/edit/duplicate/delete slides, basic themes, presentation mode, supported PowerPoint import/export | Slide layouts; reusable themes; master/layout controls; text, shapes, images and charts; alignment/guides; speaker notes; transitions and animations where stable; presenter controls; PDF/PPTX export with honest compatibility boundaries |
| **Notes** | OneNote — notebooks and capture | Quick notes, local saving, text/Markdown export | Notebook/section/page hierarchy; fast capture; rich text, headings, lists, checklists and tables; tags; global search; links and attachments stored locally; navigation and page history/recovery |
| **Database** | Access — structured data | Local tables, typed fields, records, validation, search/sort and CSV export | Relationships and keys; query builder and saved queries; joins and filters; editable forms; printable reports; import/export; schema validation and safe migrations |
| **Forms** | Forms — forms and surveys | Local form editor, supported question types, preview, validation, local responses and response review | Sections; conditional branching; reusable question sets; stronger validation; response summaries and charts; CSV/XLSX export; accessible respondent preview; local-only collection clearly labelled |
| **Lists** | Lists — structured tracking | Custom columns, records, search, filters, sorting and local saving | Saved views; grouping; column formatting; conditional rules; richer field types; row detail forms; templates; import/export; reusable local list data |
| **Planner** | Planner — project planning | Plans, buckets, tasks, priority, progress, due dates, labels/text metadata, filters | Board, grid and calendar views; timeline/Gantt where practical; drag-and-drop; grouping and filters; task detail/checklists; dependencies only with robust scheduling; progress charts; local notifications only with explicit settings |
| **To Do** | To Do — personal task management | Tasks, notes, due dates, priorities, My Day/Important/Planned/Tasks/Completed, search, completion and restore | Multiple lists; steps/subtasks; reminders; repeat rules; smart views; quick add; drag/reorder; daily planning; keyboard shortcuts; reliable date/time handling and notification preferences |
| **Workspace** | Loop — connected project canvas | Workspaces, pages, text/headings/bullets/callouts/dividers/checklists, search and local saving | Flexible page canvas; reusable blocks; local links/embeds to Brightdesk documents, sheets, decks, lists, forms and tasks; task rollups; page templates; backlinks and cross-product references; consistent navigation without claiming cloud co-authoring |

## Shared suite benchmark

The integrated suite is the product experience around the ten workspaces. It should provide:

1. **App Centre:** all ten original product cards, clear install/open/remove actions, status, search and responsive layout.
2. **Persistent navigation:** switch products and return home without losing current work or resetting the active document.
3. **Recent work:** reopen recent local projects from any product, with clear file type and last-saved status.
4. **Unified local file handling:** create, open, save, save as, import, export, print and recover supported project files; do not report success before the operation completes.
5. **Cross-product handoff:** open a relevant item in another Brightdesk product and preserve a link/reference to the source where supported.
6. **Global search:** search product names, recent files and supported local content, with clear result locations and no hidden network upload.
7. **Shared interaction patterns:** consistent menus, keyboard shortcuts, command/search entry, dialogs, toolbars, status messages, undo/redo where supported, and empty/loading/error states.
8. **Settings and notifications:** one Settings area for language, dictionaries, app management, local storage and update preferences; notifications must show real events or an honest empty state.
9. **Local data safety:** autosave or explicit save status, atomic writes where practical, backups/recovery, export paths, and clear handling of storage errors.
10. **Accessibility and polish:** keyboard-operable controls, focus visibility, semantic labels, readable contrast, reduced motion and no clipped essential controls.

## Integration contract for the ten repositories

Each product repository remains independently maintainable, but the suite must consume the same tested product implementation rather than maintaining a divergent duplicate.

For each product, verify:
- Its current source module and data/service layer are included in the suite workspace.
- The suite uses the product's original icon, metadata, storage contract and product-specific UI.
- The individual repository and suite build the same feature behaviour from the same source or a deliberately versioned shared package.
- Product tests run in the individual repository and in the integrated suite.
- Navigation, open/save/export, error handling and local persistence work from the integrated shell.
- Product-specific README claims match the actual source and tests.
- A feature is not marked complete merely because a module, menu item, button or concept preview exists.

## Delivery sequence and acceptance gates

### Gate 1 — Source and design audit
Inventory the ten product repositories and suite workspace packages. Identify duplicate or divergent modules, missing imports, inconsistent visual tokens, inactive controls and unsupported README claims. Preserve the approved design assets and existing user changes.

### Gate 2 — Integrated suite shell
Verify App Centre, deep navy navigation, all ten product entries, settings, notifications, recent work, global search and persistent switching. Test the packaged desktop build, not only static HTML.

### Gate 3 — Product workflow parity
Implement and test each product's next most valuable workflows in small increments. Use failing tests before behaviour changes. Start with reliable create/edit/save/open/export and keyboard operation, then add the richer capabilities in the product matrix.

### Gate 4 — Cross-product workflows
Verify that projects and supported content can be handed between products without data loss, stale copies or misleading save states. Ensure local links and references survive restart.

### Gate 5 — Visual and accessibility acceptance
Compare every implemented screen with the approved Brightdesk design references at desktop and narrow widths. Use original Brightdesk assets. Check keyboard-only operation, focus, contrast, labels and error/empty states.

### Gate 6 — Real desktop acceptance
Build locally on each target platform, launch the packaged application, exercise real workflows, verify local persistence after restart, test upgrade/uninstall behaviour, capture genuine screenshots, and update README files only from verified results.

## Evidence and status language

Use these labels consistently:
- **Implemented and tested:** real workflow exists and automated plus runtime checks pass.
- **Implemented, runtime verification pending:** source and tests exist, but packaged desktop use has not yet been verified.
- **Planned:** target capability not yet implemented.
- **Not in scope:** excluded by the approved ten-product or local-first rules.

Do not claim "Microsoft 365 feature parity", "complete", "fully functional" or "release ready" without a feature-by-feature acceptance record. The target is a polished, coherent Brightdesk suite with strong comparable workflows—not a copy of Microsoft's products.


## Initial repository audit findings — 5 November 2026

The first source inspection found an integration problem that must be resolved before claiming that the ten independent repositories have been turned into one maintainable suite:

- The Electron suite's actual first-use workflows are currently implemented in the root `src/` shell and its feature/service modules.
- The ten separate GitHub repositories contain near-identical copies of the broad suite `src/app.js` shell, with product launch restrictions. This duplicates suite code instead of cleanly sharing each product's own implementation.
- The root npm workspace folders under `apps/` are not yet reliable product source packages. Their current `index.js` files are thin demonstration screens; several buttons only show alert messages, and there is no `apps/workspace` package (the suite's internal product ID is `loop`). They must not be mistaken for the actual ten integrated feature implementations.
- The documented product feature modules and service layers in the root suite do have tests, but the source-of-truth relationship between each individual repository and the integrated suite is not sufficiently clear.

**Required correction:** establish one authoritative implementation for each product, expose it as a real workspace package or shared module, and have the suite shell consume those same modules. The ten individual repositories must build their own product entry point from that same source without carrying ten divergent copies of the entire suite shell. Remove or replace the demo-only workspace entry points only after their intended consumers and tests have been identified. Preserve the current working root suite modules and local user changes during this migration.

This is a confirmed architecture gap from source inspection. It is not evidence that every current integrated workflow is broken; the existing root suite tests and feature services remain valuable and must be preserved.

## Repository-level source evidence — 5 November 2026

This snapshot was taken from the ten product repositories' `main` branches and the suite integration branch. It is a source comparison, not a runtime acceptance test.

### Product repository shell duplication

All ten product repositories contain a `src/app.js` between 76,108 and 76,405 characters. Each inspected copy contains the broad suite shell, including shared product defaults and app-manager/workspace rendering. The four newest product repositories (Lists, Planner, To Do and Workspace) have the exact same `src/app.js` blob SHA, `0f8464b3521411c912329175f7a140c061c38db6`. The earlier six have similarly sized but non-identical copies. This confirms that product repositories currently carry duplicated suite-shell source rather than only their own product entry point.

| Individual repository | `src/app.js` characters | Git blob SHA on `main` |
| --- | ---: | --- |
| [Pages](https://github.com/connormolloy12/Brightdesk-Pages) | 76,405 | `ded949374730fd4fe7e48b5921e3c9d69bdf83b6` |
| [Sheets](https://github.com/connormolloy12/Brightdesk-Sheets) | 76,313 | `6aea12add1369402470f014ef6d97ed4e39b5dae` |
| [Decks](https://github.com/connormolloy12/Brightdesk-Decks) | 76,314 | `8378fd281531f722d9531e1ae5c0b8b21fa7ce3fd` |
| [Notes](https://github.com/connormolloy12/Brightdesk-Notes) | 76,313 | `b499505408da6c5f80e5dc178a73c4c5b5346995` |
| [Database](https://github.com/connormolloy12/Brightdesk-Database) | 76,319 | `720f2f33370e4dc6204394015f63036e2ac1d63d` |
| [Forms](https://github.com/connormolloy12/Brightdesk-Forms) | 76,313 | `a1fdb181787fc2b4161c65479f14810ee8724c96` |
| [Lists](https://github.com/connormolloy12/Brightdesk-Lists) | 76,108 | `0f8464b3521411c912329175f7a140c061c38db6` |
| [Planner](https://github.com/connormolloy12/Brightdesk-Planner) | 76,108 | `0f8464b3521411c912329175f7a140c061c38db6` |
| [To Do](https://github.com/connormolloy12/Brightdesk-To-Do) | 76,108 | `0f8464b3521411c912329175f7a140c061c38db6` |
| [Workspace](https://github.com/connormolloy12/Brightdesk-Workspace) | 76,108 | `0f8464b3521411c912329175f7a140c061c38db6` |

### Workspace package placeholders

The suite currently declares nine `apps/*` workspaces: `pages`, `sheets`, `decks`, `notes`, `database`, `forms`, `lists`, `planner` and `todo`. There is no `apps/loop` workspace, even though the suite's internal product ID for Workspace is `loop`.

The inspected workspace `index.js` files are short demonstration screens (roughly 843–2,228 characters). Several buttons only display an alert, and they do not import the corresponding product repository feature module. These files are not the ten production product implementations and must not replace the tested product workspaces.

### Feature-module parity checks

A direct blob comparison between the individual product repositories' documented feature modules and the suite integration branch found:

| Product | Individual module | Comparison with suite branch |
| --- | --- | --- |
| Pages | `src/page-layout.js` | Identical blob |
| Sheets | `src/formula.js` | Identical blob |
| Forms | `src/forms-service.js` | Identical blob |
| Database | `src/database-service.js` | Matches the immutable Database PR #15 commit `46d0feeb9e7110c2025857b6a2d145eeed06d40a` |
| Database | `src/database-workspace.js` | Matches the immutable Database PR #15 commit `46d0feeb9e7110c2025857b6a2d145eeed06d40a` |
| Lists | `src/lists-service.js` | Identical blob |
| To Do | `src/todo-service.js` | Identical blob |
| Planner | `src/planner-service.js` | Identical blob on product `main` and the Suite branch |
| Workspace | `src/workspace-editor.js` | Identical blob |
| Planner | `src/planner-workspace.js` | The individual repository's `main` snapshot differed; the draft fix branch now matches the Suite module byte-for-byte |

The Planner difference in the original `main` snapshot was that the Suite caught local-storage write errors and displayed a clear failure status, while the individual repository did not. [Brightdesk Planner PR #3](https://github.com/connormolloy12/Brightdesk-Planner/pull/3) now proposes the same error handling and adds a focused failure regression test. The current draft Planner branch and Suite integration branch both resolve `src/planner-workspace.js` to blob SHA `88b9f66e3a04d952f2958fd2a0075fad11dfc30d`. This is source parity evidence, not a claim that PR #3 has merged or passed its full CI and packaged-app checks.

### Source-parity pilot — Pages, Sheets, Forms, Lists, To Do, Planner, Database and Workspace

The Suite now has pinned, automated parity checks for ten feature modules across eight individual product repositories:

| Product | Canonical repository | Source file | Suite vendor file | Pinned upstream Git blob |
| --- | --- | --- | --- | --- |
| Pages | [Brightdesk-Pages](https://github.com/connormolloy12/Brightdesk-Pages) | `src/page-layout.js` | `src/page-layout.js` | `9777090bbbd01fee1b2789c703619dc8faa87859` |
| Sheets | [Brightdesk-Sheets](https://github.com/connormolloy12/Brightdesk-Sheets) | `src/formula.js` | `src/formula.js` | `4b75569239c9834308f77815392b98d7371ea459` |
| Forms | [Brightdesk-Forms](https://github.com/connormolloy12/Brightdesk-Forms) | `src/forms-service.js` | `src/forms-service.js` | `d925764977a79ec6b7d79af5e1a0d6e08ab9d8e4` |
| Database | [Brightdesk-Database](https://github.com/connormolloy12/Brightdesk-Database) | `src/database-service.js` | `src/database-service.js` | `d879ab20878c3ed838cf6cf56020fd3c4695834b` |
| Database | [Brightdesk-Database](https://github.com/connormolloy12/Brightdesk-Database) | `src/database-workspace.js` | `src/database-workspace.js` | `f7ba29971887321b931bdc013291d90c502a5e0b` |
| Lists | [Brightdesk-Lists](https://github.com/connormolloy12/Brightdesk-Lists) | `src/lists-service.js` | `src/lists-service.js` | `ae3aebadd3194af4846c80fe58a2f1c98c88c57f` |
| To Do | [Brightdesk-To-Do](https://github.com/connormolloy12/Brightdesk-To-Do) | `src/todo-service.js` | `src/todo-service.js` | `34e048b651dfdd50cb8b3292c660e1dbd57fe7f8` |
| Planner | [Brightdesk-Planner](https://github.com/connormolloy12/Brightdesk-Planner) | `src/planner-service.js` | `src/planner-service.js` | `6b05218a71f0f0d63beebdf20decae5ea112f7fc` |
| Workspace | [Brightdesk-Workspace](https://github.com/connormolloy12/Brightdesk-Workspace) | `src/workspace-editor.js` | `src/workspace-editor.js` | `2cd96b879c7b90da1df66dee7fc2a2c319b53781` |
| Workspace | [Brightdesk-Workspace](https://github.com/connormolloy12/Brightdesk-Workspace) | `src/workspace-service.js` | `src/workspace-service.js` | `a5a73ac3b727064f43fde0a14320fe2f594a5ba7` |

The eight Pages, Sheets, Forms, Lists, To Do, Planner and Workspace entries are pinned to their product repositories' `main` branches. The two Database entries are pinned to immutable Database PR #15 commit `46d0feeb9e7110c2025857b6a2d145eeed06d40a`; these modules are not yet present on Database `main`. The lock record is [docs/PRODUCT_SOURCE_LOCK.json](PRODUCT_SOURCE_LOCK.json), and the verification command is `npm run verify:product-sources`.

The verifier calculates Git's blob SHA-1 from the actual vendored file bytes and compares it with each reviewed upstream blob. It rejects missing or modified vendor copies and repository paths that escape the project. The check is included in Suite CI and release preflight.

This establishes a repeatable source-integrity gate for ten feature modules across eight products. It does **not** automatically fetch upstream changes or verify every UI/shell file or shared asset. Decks and Notes still need verified product-specific source modules; the Database references remain pinned to an immutable pre-merge product commit. When a canonical product file changes, review the product change first, update the Suite vendor copy and pinned blob deliberately, then require the parity check and product/Suite tests to pass.

### Migration implications

1. Keep the ten product names, individual repositories and original app identities.
2. Remove suite-shell duplication from the product repositories only after each product's own entry point and tests are independently verified.
3. Replace the nine demonstration workspace packages with actual product modules; add the missing Workspace package.
4. Choose and document one canonical source and a repeatable sync/version strategy before moving source files. Do not create another manually maintained copy.
5. Prove parity with automated checks that compare the individual product module version with the suite's bundled module.
6. Migrate one product at a time. Require its focused tests, full repository tests, suite tests and packaged desktop workflow before migrating the next product.

No bulk source move or repository-wide rewrite is authorised by this audit. The immediate next migration should be the smallest product with a clear module boundary and repeatable parity verification.
