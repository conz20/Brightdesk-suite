# Brightdesk Microsoft Feature-Parity Audit

**Audit date:** 12 November 2026  
**Status:** Initial evidence-based audit; implementation and platform verification remain outstanding.  
**Applies to:** Brightdesk Suite and the ten approved customer products on Windows, macOS and Linux.

## Purpose and rules

Use the relevant current Microsoft desktop product as a functional-completeness benchmark, not as a design or branding template. Keep Brightdesk's own names, visual identity, icons, code and local-first architecture.

For every candidate capability, decide whether it is:
- **Required:** useful for the product, compatible with Brightdesk's scope and supportable offline.
- **Adapted:** useful, but must be redesigned for local files, local storage, native OS features or single-user use.
- **Excluded:** depends on a prohibited Microsoft cloud/account/collaboration service, adds an unapproved product, or is unsuitable for Brightdesk.

Do not copy Microsoft code, logos, illustrations, screenshots or distinctive trade dress. Do not add accounts, subscriptions, telemetry, advertising, cloud sync, remote collaboration, or customer-content uploads. A feature is not complete because a button or design reference exists: it must work, save correctly, have automated tests, and pass packaged acceptance on all three operating systems.

## Initial ten-product matrix

This is an initial comparison based on the first-use scope described by the current Suite README and product specifications. It is **not** a claim that every code path has been audited or that any candidate gap has been implemented.

| Brightdesk product | Current first-use scope recorded in the repository | Microsoft desktop capability areas to assess and add when applicable |
| --- | --- | --- |
| **Pages** | Document editing, basic text formatting, lists and tables, page size, orientation and margins. | Consistent styles and templates; headers, footers and page numbers; columns and section breaks; tables, images, shapes and captions; citations, footnotes/endnotes and tables of contents; review and change tracking; accessibility checking; print preview and reliable DOCX/PDF interoperability. |
| **Sheets** | Cell editing, basic arithmetic and range formulas, row/column editing and column sorting. | Broad, correctly calculated function library; multi-sheet workbooks; structured tables; data validation; conditional formatting; named ranges; freeze panes; charts; PivotTables or equivalent local summaries; import/export, print setup and formula auditing. |
| **Decks** | Create, edit, duplicate and delete slides; basic themes and presentation mode. | Slide layouts and masters; richer themes; alignment, grouping and layer ordering; shapes, images and charts; speaker notes; transitions and animations; presenter view and multi-display presentation; accessible slide checks; PPTX and PDF/handout export. |
| **Notes** | Quick notes, on-device saving and text/Markdown export. | Notebook, section and page hierarchy; section groups; page templates; tags; cross-notebook search; tables, links, images and attachments; checklists; drawing/inking where the OS supports it; local print/export and backup/recovery. |
| **Database** | Local tables, typed fields, required-value validation, record create/edit/delete/search/sort and CSV export. | Relationships and keys; indexes and constraints; query designer and safe local query execution; data-entry forms; reports; import/export; referential integrity; transactions, backup and recovery. Relationships, query design, forms, reports, database import and SQL execution are explicitly outside the documented first feature set. |
| **Forms** | Local form creation, short/long text, single/multiple choice and date questions, required fields, preview, response collection and review. | Sections; conditional branching; broader question types such as rating, ranking and Likert; quiz scoring; response summaries and filters; reusable templates/themes; export and accessible preview. Branching, scoring, anonymous links, attachments and online collection are explicitly not in the documented first feature set. |
| **Lists** | Local lists, records, custom text/date/choice columns, search, status filtering and sorting. | Saved views; calendar, board and gallery presentations where relevant; grouping; conditional row/view formatting; richer field types and validation; bulk editing; local attachments; import/export, print and safe history/recovery. |
| **Planner** | Plans, buckets and tasks with priority, progress, due dates, local assignee text and filters. | Schedule and timeline/Gantt views; task dependencies and milestones where useful; checklists; recurring tasks; local reminders/notifications; task history; richer grouping and reporting. The current specification explicitly excludes reminders, recurring tasks and online collaboration. |
| **To Do** | Tasks with notes, due date and priority; completion and importance; My Day, Important, Planned, Tasks and Completed views; search. | Steps/subtasks; reminders and native notifications; recurrence; suggested tasks for My Day; quick entry; sorting and filtering; completion history; import/export and recovery. The current specification says not to claim recurring reminders or OS notifications until implemented and tested. |
| **Workspace** | Local workspaces and pages with text, heading, bullet, callout, divider and checklist blocks; page/block search. | Nested organisation; richer reusable local components; tables and structured task/resource blocks; backlinks and internal page links; templates; embeds and attachments stored locally; export/print; component integrity and local recovery. Cloud components, real-time coauthoring, comments, mentions and cloud sync remain excluded. |

## Cross-platform acceptance: mandatory on every product

The same supported feature set must be available on **Windows, macOS and Linux**. Do not mark a feature complete after testing on only one operating system.

For each product and each supported OS, verify:
1. Launch, focus, minimise, restore, close and reopen.
2. Native window identity, icon, title, keyboard conventions and multi-monitor behaviour.
3. Open, save, Save As, export, print/print preview and recovery where applicable.
4. Correct local persistence after restart, OS restart and interrupted close.
5. File dialogs, permissions, notifications and uninstall behaviour using that OS's native conventions.
6. Keyboard-only operation, visible focus, accessible names, high contrast, text scaling and reduced motion.
7. Resizing and display scaling without clipped commands, panels or content.
8. Import/export round trips and data integrity for every claimed file format.
9. Automated tests and real packaged-build smoke tests, with the tested commit and OS recorded.

A configured package target is not proof of a working installer. The current Suite README records Windows x64 NSIS, macOS universal DMG/PKG/ZIP, and Linux x64 AppImage/DEB targets; it also records that Windows and Linux self-hosted packaging runners still need to be registered and online. Treat the three-platform installer matrix as unverified until native jobs and real install/upgrade/removal checks pass.

## Recommended implementation order

1. **Complete the product lifecycle first:** independent product launch/focus, concurrent applications, close/reopen, no artificial last-installed-product restriction, and correct installed/running/visible states.
2. **Build functional depth product by product:** Sheets calculations and workbook correctness; Pages document layout and references; Decks presenter workflow; Database relationships and queries; Forms branching; Lists views; Planner timeline and reminders; To Do recurrence and reminders; Notes hierarchy/search; Workspace reusable local components.
3. **Integrate and verify each feature in its individual product repository and the Suite launcher.** Keep shared design, document formats, settings, local data and accessibility consistent.
4. **Run the same acceptance suite on Windows, macOS and Linux.** Record platform-specific evidence and unresolved failures rather than inferring parity.

## Official Microsoft references consulted

These are reference points for the capability areas above, not instructions to add Microsoft services:

- [Word desktop and web feature comparison](https://support.microsoft.com/en-au/word/word-features-comparison-word-for-the-web-vs-desktop)
- [Excel help and learning: formulas, data, formatting and PivotTables](https://support.microsoft.com/en-au/excel/)
- [Excel business-intelligence capabilities](https://support.microsoft.com/en-au/excel/bi-capabilities-in-excel-and-office-365)
- [PowerPoint feature comparison across platforms](https://support.microsoft.com/en-au/powerpoint/compare-powerpoint-features-on-different-platforms)
- [PowerPoint Presenter View](https://support.microsoft.com/en-us/powerpoint/training/use-presenter-view-in-powerpoint)
- [OneNote search across notes](https://support.microsoft.com/en-us/onenote/onenote-help-and-learning/search-notes-in-onenote)
- [Access introduction to queries](https://support.microsoft.com/en-us/access/introduction-to-queries)
- [Access relationships and joins](https://support.microsoft.com/en-us/access/join-tables-and-queries)
- [Microsoft Forms branching logic](https://support.microsoft.com/en-us/forms/use-branching-logic-in-microsoft-forms)
- [Microsoft Forms question types and quiz setup](https://support.microsoft.com/en-us/forms/create-a-quiz-with-microsoft-forms)
- [Microsoft Lists view formatting and conditional rules](https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/formatting-list-views)
- [Microsoft Lists view types](https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/create-change-or-delete-a-view-of-a-list-or-library)
- [Planner timeline (Gantt) view](https://support.microsoft.com/en-au/planner/timeline-view)
- [Planner basic and premium capability comparison](https://support.microsoft.com/en-au/planner/compare-microsoft-planner-basic-vs-premium-plans)
- [To Do due dates, reminders and recurrence](https://support.microsoft.com/en-us/todo/add-due-dates-and-reminders-in-microsoft-to-do)
- [To Do daily planning and My Day](https://support.microsoft.com/en-us/todo/plan-and-connect-with-microsoft-to-do)
- [Microsoft Loop workspaces, pages and components](https://support.microsoft.com/en-au/loop/get-started-with-microsoft-loop)

---
**Evidence rule:** update this matrix only when a feature has been checked against current source code, tests and the real packaged application. Keep each row's status explicit; never call the suite "Microsoft-equivalent" or "feature-complete" solely from this audit.
