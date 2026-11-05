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
