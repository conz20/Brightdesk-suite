# Microsoft Product Parity and Independent Application Launch Requirements

Status: approved product requirement; implementation and verification outstanding.
Scope: Brightdesk Office Suite and the ten customer applications.

## Product principle

Brightdesk must deliver the depth, polish, discoverability, consistency and dependable desktop behaviour expected from mature Microsoft productivity applications. Microsoft products are the functional and experience benchmark. Brightdesk must retain original Brightdesk branding, names, artwork, icons, code and local-first architecture. This is a benchmark, not permission to copy Microsoft's protected assets, source code or trade dress.

The benchmark must be reviewed against current official Microsoft product documentation and current desktop application behaviour. Maintain a dated feature matrix for each Brightdesk product. Record each relevant Microsoft capability as:
- Implemented and verified in Brightdesk
- Planned, with an owner and acceptance tests
- Not applicable, with a clear reason
- Excluded because it depends on a prohibited service, conflicts with Brightdesk's approved scope, or is not appropriate for the product

Do not silently omit a relevant capability. Do not add features merely to inflate scope.

## Approved customer product scope

Exactly ten customer applications:
1. Pages
2. Sheets
3. Decks
4. Notes
5. Database
6. Forms
7. Lists
8. Planner
9. To Do
10. Workspace

Do not introduce Outlook, OneDrive, Teams, or additional customer products. Brightdesk-AI remains engineering/tooling, not an eleventh customer product.

## Microsoft-quality experience baseline

Every application must provide the relevant capabilities expected of a mature desktop productivity application, selected for that product:

- Clear application identity, title, icon, navigation, information architecture and product-specific workspace.
- Discoverable commands, context menus, command bars/ribbon where appropriate, keyboard shortcuts, tooltips and command search/help where appropriate.
- Complete create, open, edit, save, Save As, export, print/print preview and file recovery workflows where applicable.
- Undo/redo, selection, clipboard, find/search, replace, navigation and sensible document/workspace history where applicable.
- Rich product-specific authoring and editing tools, not merely decorative controls or generic text editors.
- Consistent preferences, view controls, zoom, accessibility settings and application-specific settings.
- Professional dialogs, confirmation, validation, errors, empty states, onboarding and recovery flows.
- Keyboard-first operation, screen-reader semantics, visible focus, high contrast, text scaling, localisation and accessible names.
- Responsive layouts, sensible window resizing, platform-native conventions and reliable multi-monitor/window behaviour.
- Offline operation and local data ownership. No telemetry, advertising, customer text uploads, cloud sync, collaboration service, customer accounts, subscriptions, activation or licence servers.
- File formats and interoperability appropriate to the product, with honest compatibility statements and round-trip tests.

Feature parity means matching relevant useful capabilities, not importing Microsoft's cloud services, subscriptions, account requirements or unrelated products.

## Ten-product functional benchmark

The feature matrix must be specific and comprehensive. At minimum assess the following areas and expand them using official Microsoft documentation:

### Pages (Word benchmark)
Document creation and editing; rich text and paragraph formatting; styles and themes; page setup, margins, orientation and sections; headers/footers/page numbers; tables, images, shapes, links and captions; columns and page/section breaks; lists; find/replace; spelling, grammar and proofing; comments/review and change tracking where supported locally; references, citations, footnotes/endnotes, table of contents and indexes where appropriate; templates; accessibility checks; print preview, print and PDF/export; document properties and recovery.

### Sheets (Excel benchmark)
Workbook/sheet management; cells/ranges; formulas and function library; formula bar and references; formatting and number formats; tables; sort/filter; validation; conditional formatting; charts; named ranges; freeze panes; multiple sheets; import/export; print areas/page setup; find/replace; error handling and formula auditing; accessibility; workbook protection where locally supportable; large-workbook performance and recalculation correctness.

### Decks (PowerPoint benchmark)
Slide creation, duplication, deletion and reordering; layouts, themes and variants; text and paragraph formatting; images, shapes, icons and charts; alignment, grouping, layering and selection; speaker notes; transitions and animations; slide master/layout editing where appropriate; presenter and slideshow modes; navigation/sorter views; accessibility; media support where locally supportable; print and PDF export.

### Notes (OneNote benchmark)
Notebooks, section groups, sections and pages; flexible note content; text formatting; lists and checklists; tables, links, images, attachments and printouts where appropriate; drawing/inking where platform support exists; tags; search across notebooks; page organisation; templates; export/print; local backup and recovery.

### Database (Access benchmark)
Database/project creation; table and field design; data types and constraints; primary/foreign keys; relationships; indexes; forms and record editing; queries and query design; sorting/filtering; validation; reports and print/export; import/export; referential integrity; transaction safety; backup/restore; large-data reliability and clear schema management.

### Forms (Microsoft Forms benchmark)
Form/survey/quiz authoring; question types; required fields; validation; sections and branching/conditional logic; themes and layout; preview/test mode; response collection and local response storage; response review, filtering and summary analysis; export; accessibility; print/share as local files without remote collection services.

### Lists (Microsoft Lists benchmark)
List templates; columns and data types; views; grid/list presentation; sorting, filtering and grouping; validation; choice fields; formatting; item forms; bulk editing; search; attachments where local and safe; import/export; version/history and recovery where appropriate; print.

### Planner (Microsoft Planner benchmark)
Plans, boards, buckets and tasks; task details; priorities; due dates; progress/status; labels/categories; checklists; attachments/links stored locally; calendar/schedule and chart views; filters/grouping; task search; recurring task support where appropriate; print/export; local notifications/reminders without cloud dependencies.

### To Do (Microsoft To Do benchmark)
Lists; My Day; planned, important and completed views; task details and notes; due dates and reminders; recurrence; steps/subtasks; priority; categories; search/filter/sort; quick entry; keyboard interaction; completion history; local notifications; import/export and recovery.

### Workspace (Microsoft Loop/workspace benchmark)
Workspaces and pages; nested organisation; reusable components/blocks; tables, lists, checklists and task components; linking and backlinks; templates; search; navigation; embeds/attachments where local and safe; export/print; local component consistency and data integrity. Collaboration/presence/cloud sync are excluded.

## Independent application launch and lifecycle

The Suite is a launcher and management centre, not a container that merely changes the selected view.

- Selecting Open for a product launches that product as its own installed desktop application/window, with its own process/window identity as appropriate to the platform.
- Pages, Sheets, Decks and any other combination of products can remain open concurrently.
- Users can close any product window, including every product window. Closing a window must never uninstall the product, remove its launcher entry, or delete documents.
- Users can reopen a closed product from the Suite at any time.
- Installation state, running state and visibility in the Suite are separate concepts. Running/closed must never be represented as installed/uninstalled.
- There must be no rule requiring at least one product to remain installed, visible, or open. The Suite itself remains available as the launch and management centre.
- Opening an already-running product should focus/restore its existing window by default rather than create confusing duplicates. If multiple windows for one product are intentionally supported, each must have a clear document/window identity.
- The Suite must accurately show installed, available and running states, and handle missing, damaged, updating or incompatible product executables with actionable messages.
- Launch paths must be resolved safely and portably on Windows, macOS and Linux. Never assume a developer's local path or a particular install directory.
- Closing a product must flush pending saves safely, preserve recovery data, release resources and return control normally to the operating system.
- The Suite must not terminate other open product windows when one product closes.
- Launch, focus, close, reopen, update and uninstall lifecycle events must be covered by automated integration tests on all supported platforms.

## Current known implementation gaps to verify and address

A review of the current Brightdesk-Suite main branch found:
- The product-card Open action currently calls `setApp(item.id)`, switching the selected product inside the Suite renderer rather than launching the separately packaged product executable.
- Product launch identifiers and separate product build scripts already exist, providing a starting point for independent product builds.
- `toggleAppInstall` prevents uninstalling the last installed product.
- Product navigation and `setApp` logic are restricted by the single-product launch identifier, but the Suite launcher has no verified cross-platform executable launch/instance-management contract yet.

These findings must be rechecked against the current branch before implementation; do not assume this list is exhaustive.

## Required shared architecture

Implement and maintain a shared product manifest/registry containing each product ID, display name, executable/app ID, platform package identity, icon, version and availability. The Suite must use this registry for launch and status, not hard-coded local paths.

Provide a narrow, validated main-process launch service. It must:
- Accept only the ten approved product IDs.
- Resolve the product executable using the installed-package registry/platform conventions.
- Avoid shell interpolation and unsafe arbitrary command execution.
- Launch or focus the correct product instance.
- Track process/window state and recover from launch/exit errors.
- Keep Suite-to-product communication limited to necessary lifecycle/status messages.
- Preserve local-first security boundaries and never expose unrestricted Node/Electron APIs to renderers.

## Automated acceptance criteria

1. All ten products have a documented Microsoft capability matrix with source links, applicability decisions and evidence.
2. No relevant Microsoft desktop capability is silently omitted from the matrix.
3. Product-specific controls are functional; no dead or decorative command passes acceptance.
4. Suite Open launches the correct separate product application on Windows, macOS and Linux.
5. At least three different products can be open simultaneously.
6. Closing one product leaves the others running.
7. Closing all products leaves the Suite usable and all installed products reopenable.
8. Closing a product does not uninstall it, hide it, or delete its documents/settings.
9. The user can uninstall all products if desired; no artificial last-installed/last-visible/last-open restriction.
10. Relaunching an already-open product focuses its existing window, unless multi-window document support is explicitly designed and tested.
11. App launch and close preserve unsaved-work safety and local data.
12. Tests cover invalid IDs, missing executables, launch failures, rapid repeated launches, concurrent products, close/reopen, upgrade and uninstall.
13. UI and interaction tests verify keyboard, accessibility, high-contrast, scaling, localisation, resize and platform conventions.
14. Evidence is produced from real packaged builds; screenshots alone are not accepted as proof of functionality.

## Governance

- Keep the feature matrix and architecture requirements in GitHub as the canonical source.
- Update the shared Design System, product repositories, tests and CI enforcement together.
- Require review of new product features against the ten-product scope, Microsoft capability matrix, local-first constraints and original Brightdesk identity.
- Do not mark parity complete based on a visual mock-up, README, checklist or passing unit tests alone. Require end-to-end evidence from real packaged applications.


## Current main-branch implementation status — rechecked 12 November 2026

The findings in the earlier "Current known implementation gaps" section are historical and must not be copied forward without rechecking. The following changes have since been committed directly to `main`:

- Suite product-card and Switch product actions call the validated `apps:open` IPC bridge rather than changing the selected renderer in the Suite window.
- The Suite creates a dedicated Electron top-level `BrowserWindow` per product, with its own title/icon and product launch identifier. Reopening a running product restores/focuses its existing window.
- Product document data is written to per-product local-storage keys in Suite-launched product windows.
- Suite product inclusion can be empty. Removing the final included product leaves the Suite launcher usable; every product may be hidden from Switch product navigation.
- The product-card controls are explicitly named **Add to Suite** and **Remove from Suite**. These actions change workspace inclusion, not the installed operating-system packages.

Important remaining distinctions and gaps:

1. The current Suite-created product windows are separate top-level windows in the Suite Electron process. They are **not yet proven to be separate operating-system processes or launches of the separately packaged product executables**.
2. The current product inclusion list is a local Suite preference. It is not an OS package registry and must not be treated as proof that an individual product binary was installed or uninstalled.
3. Standalone product installer build targets exist for Windows, macOS and Linux, but their actual packaged installation, upgrade, removal and relaunch workflows remain unverified.
4. The Suite README records that native Windows x64 and Linux x64 packaging runners still need to be registered and online. Cross-platform support is not accepted until real native builds and tests pass.
5. Regression tests for empty selection, removing the last product, and hiding the last visible product have been added to main. The full Suite test command and packaged OS integration suites have not yet produced verified CI results.

The target architecture in this requirements document remains the intended end state. The current main implementation is an interim window-level implementation and must not be labelled complete independent-executable launching.
