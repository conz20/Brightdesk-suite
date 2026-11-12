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


## Additional official source checks — 12 November 2026

The following Microsoft Support pages were checked while preparing this audit. They clarify the product capabilities to compare, without making Microsoft cloud or account features requirements for Brightdesk.

- **Pages:** Word's desktop comparison documents styles, templates, columns, headers/footers, page numbers, images, page and section breaks, citations, bibliography, footnotes/endnotes, table of contents, Track Changes, PDF export, offline authoring and accessibility checking: [Word desktop feature comparison](https://support.microsoft.com/en-us/word/word-features-comparison-word-for-the-web-vs-desktop.).
- **Sheets:** Excel documents data validation, including whole number, decimal, list, date, time, text-length and custom rules; and conditional formatting rules and PivotTable layout/formatting: [Data validation](https://support.microsoft.com/en-us/excel/get-started/apply-data-validation-to-cells), [Conditional formatting](https://support.microsoft.com/en-us/excel/use-conditional-formatting-to-highlight-information-in-excel), [PivotTable layout and formatting](https://support.microsoft.com/en-us/excel/design-the-layout-and-format-of-a-pivottable).
- **Decks:** PowerPoint documents slide masters and layouts that control consistent colors, fonts, effects and placeholders; Presenter View includes current/next slide, speaker notes, timer, annotations, navigation and dual-monitor presentation: [Slide masters](https://support.microsoft.com/en-us/powerpoint/training/customize-a-slide-master), [Presenter View](https://support.microsoft.com/en-us/powerpoint/training/use-presenter-view-in-powerpoint).
- **Notes:** OneNote documents notebook/section/page hierarchy, subpages and section groups, plus search scoped across pages, sections and notebooks: [Organize notes](https://support.microsoft.com/en-gb/onenote/organize-your-notes), [Search notes](https://support.microsoft.com/en-us/onenote/onenote-help-and-learning/search-notes-in-onenote).
- **Database:** Access documents relational table links and select queries that join multiple tables, select fields, apply criteria and can be saved for reuse: [Table relationships](https://support.microsoft.com/en-us/access/guide-to-table-relationships), [Select query design](https://support.microsoft.com/en-us/access/create-a-simple-select-query).
- **Forms:** Microsoft Forms documents question sections and response-based branching to later questions or the end of the form, plus choice, text, rating, date, ranking and Likert question types: [Branching logic](https://support.microsoft.com/en-us/forms/use-branching-logic-in-your-form), [Quiz question types and sections](https://support.microsoft.com/en-us/forms/create-a-quiz-with-microsoft-forms).
- **Lists:** Microsoft Lists documents conditional row/view formatting and calendar views derived from date columns: [Conditional view formatting](https://support.microsoft.com/en-us/sharepoint/lists/data-and-lists/formatting-list-views), [Calendar views](https://support.microsoft.com/en-us/sharepoint/lists/create-a-calendar-view-from-a-list).
- **Planner:** Planner documents timeline/Gantt scheduling, recurring task rules and calendar/schedule views: [Timeline](https://support.microsoft.com/en-au/planner/timeline-view), [Recurring tasks](https://support.microsoft.com/en-au/planner/recurring-tasks-in-planner), [Schedule view](https://support.microsoft.com/en-us/planner/training/use-schedule-view-in-microsoft-planner).
- **To Do:** To Do documents due dates, reminders and repeat patterns (daily, weekdays, weekly, monthly, yearly or custom); it also documents optional natural-language recognition of date/reminder/repeat text, with platform and language limitations: [Due dates and reminders](https://support.microsoft.com/en-us/todo/add-due-dates-and-reminders-in-microsoft-to-do), [Smart date/reminder recognition](https://support.microsoft.com/en-us/todo/smart-due-date-reminder-recognition-in-microsoft-to-do).
- **Workspace:** Loop documents flexible pages and portable components, but those components are designed to stay in sync across Microsoft apps and shared workspaces use Microsoft account/cloud storage. Brightdesk should adapt the modular local-page/block idea only; do not reproduce online sharing, cross-app cloud sync or identity requirements: [Get started with Loop](https://support.microsoft.com/en-au/loop/get-started-with-microsoft-loop), [Loop storage and access requirements](https://support.microsoft.com/en-us/loop/loop-access-via-microsoft-365-subscriptions).

Where a Microsoft article describes a feature that is Windows-only, web-only, account-dependent, subscription-dependent or cloud-backed, Brightdesk must not assume that the capability is automatically available or appropriate on all three Brightdesk operating systems. Build a local-first equivalent only where it is practical and verify the same intended behaviour on Windows, macOS and Linux.


## Native product-launch implementation status — 12 November 2026

The Suite main branch now contains a native product-launch service and platform-specific package registration settings:

- Windows: launch the product's Brightdesk Start Menu shortcut created by the product NSIS package.
- macOS: launch by the product's \`org.brightdesk.<id>\` bundle identifier.
- Linux: launch the exact registered \`org.brightdesk.<id>.desktop\` entry using \`gio launch\`.
- Each product has a unique package/runtime name and application ID. The Electron main process requests a single-instance lock so a repeated launch can focus the existing instance.
- Product build configuration assigns its matching original icon. The Suite's Open and Switch product actions call the native launch service and show actionable errors when a package cannot be found or started.

The manual release workflow now invokes all ten individual product builds after building the Suite, then verifies the expected product package formats and records a separate product SHA-256 manifest for each platform.

**Important verification boundary:** these are source/configuration and workflow changes only. No new packaged Windows, macOS or Linux installer has yet been run through an end-to-end installation and relaunch test. CI results are not available for the current code head. Linux AppImages do not automatically register desktop entries; a user must integrate the AppImage, or install the DEB package, before the Suite can discover it. The real process launch, app focus, concurrent operation, upgrade and uninstall behaviour remain pending native-platform acceptance.
