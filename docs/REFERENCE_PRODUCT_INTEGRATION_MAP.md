# Reference-informed Brightdesk product integration map

**Reviewed:** 7 November 2026  
**Status:** research guidance and proposed work map; not a claim that the products are complete.

## External references

- [Wordcraft](https://github.com/storytold/wordcraft): document editing, formatting, pagination, review, references and document interchange research for Brightdesk Pages.
- [GridCraft](https://github.com/storytold/gridcraft): workbook modelling, formulas, calculation, tables, charts, data handling and spreadsheet interchange research for Brightdesk Sheets.

Both public projects identify themselves as clean-room implementations, publish under MIT OR Apache-2.0, and maintain separate attribution and asset policies. Their current roadmaps describe alpha-stage products with known compatibility and readiness gaps. Brightdesk should learn from their public feature maps, architecture boundaries, testing practices and honest gap reporting—not claim that their features are already Brightdesk features.

## Product ownership map

| Brightdesk product | Repository | Reference-informed direction |
|---|---|---|
| Pages | [Brightdesk-Pages](https://github.com/connormolloy12/Brightdesk-Pages) | Wordcraft-informed document model, formatting, pagination, review and file compatibility. See its [reference roadmap](https://github.com/connormolloy12/Brightdesk-Pages/blob/main/docs/WORDCRAFT_REFERENCE_AND_PAGES_ROADMAP.md). |
| Sheets | [Brightdesk-Sheets](https://github.com/connormolloy12/Brightdesk-Sheets) | GridCraft-informed workbook model, formulas, calculation, data features, charts and XLSX compatibility. See its [reference roadmap](https://github.com/connormolloy12/Brightdesk-Sheets/blob/main/docs/GRIDCRAFT_REFERENCE_AND_SHEETS_ROADMAP.md). |
| Decks | [Brightdesk-Decks](https://github.com/connormolloy12/Brightdesk-Decks) | Presentation structure, slide layouts, themes, objects, notes, transitions, presenter workflow and PPTX compatibility. |
| Notes | [Brightdesk-Notes](https://github.com/connormolloy12/Brightdesk-Notes) | Fast local capture, notebooks/sections, rich text or Markdown, tags, search, backlinks, attachments and export. |
| Database | [Brightdesk-Database](https://github.com/connormolloy12/Brightdesk-Database) | Typed tables, relationships, views, filters, forms, validation, import/export and local data integrity. |
| Forms | [Brightdesk-Forms](https://github.com/connormolloy12/Brightdesk-Forms) | Form builder, question types, branching, validation, preview, local response collection and export. |
| Lists | [Brightdesk-Lists](https://github.com/connormolloy12/Brightdesk-Lists) | Custom columns, record types, sorting, filtering, grouping, status and reusable list views. |
| Planner | [Brightdesk-Planner](https://github.com/connormolloy12/Brightdesk-Planner) | Boards, buckets, tasks, dates, assignments, progress, dependencies and timeline/calendar views. |
| To Do | [Brightdesk-To-Do](https://github.com/connormolloy12/Brightdesk-To-Do) | Personal tasks, due dates, recurrence, priorities, reminders and daily/weekly views. |
| Workspace | [Brightdesk-Workspace](https://github.com/connormolloy12/Brightdesk-Workspace) | Connected project pages, notes, lists, resources, links and cross-product navigation. |

The directions for Decks through Workspace are capability areas to audit against each repository's actual source and README. They are not statements that every capability is already implemented.

## Shared foundations

- **Brightdesk-Design-System:** original design tokens, reusable components, responsive layout rules, accessibility states and product-specific icon/accent standards.
- **Brightdesk-Fonts:** font discovery, licence records, previewing and shared typography integration.
- **Brightdesk-Localization:** translation catalogues, language selection, date/number formats and locale-aware input.
- **Brightdesk-Engine:** shared native Rust capabilities and explicit Node-API contracts where they provide measurable value.
- **Brightdesk-Common-Libs:** shared contracts, validation, persistence helpers, file handling and common utilities.
- **Brightdesk-Common-Actions:** reusable non-AI CI actions and quality checks.
- **Brightdesk-Developer-Tools:** SDKs, CLI utilities, templates and local developer workflows.
- **Brightdesk-Extensions:** extension manifests, permissions, lifecycle and compatibility.
- **Brightdesk-Wiki:** architecture, user/developer guides and maintained product knowledge.
- **Brightdesk-Release-Tools:** planned repository; not yet part of the verified 21-repository inventory.

A repository existing is not the same as a package being implemented, published or consumed. Each shared foundation needs a real implementation, documented public interface, tests, versioning and at least one verified consumer before it is described as connected.

## Connection rules

1. Each product repository owns its product source, tests, README and product release evidence.
2. The Suite owns the desktop shell, product catalogue, integrated navigation, first-run experience and combined installer orchestration. It must not become a duplicate source of truth for product internals.
3. Brightdesk-AI remains a private engineering control plane. It may assist audits and approved development work, but is never a customer runtime dependency and is excluded from customer packages.
4. Shared libraries do not depend on product repositories. Products consume versioned interfaces only after contract tests pass.
5. Keep Node.js at 24.22.2 where currently specified. Preserve Rust and all other existing languages and toolchains.
6. No new paid services, paid runners, metered model APIs or subscription dependencies.
7. Use local-first data handling and explicit import/export boundaries.
8. A product is not "up and running" until its tests pass and its packaged build has been installed and exercised on the target operating system.

## Clean-room and licensing rules

Use external projects as research references for workflows, feature coverage, architecture and test ideas. Prefer an independently written Brightdesk implementation based on public file-format specifications, documented behaviour and Brightdesk requirements.

If a specific source component is intentionally reused, its MIT or Apache-2.0 terms must be followed for that component: preserve copyright and licence notices, include required licence text and attribution in the relevant repository's third-party notices, track the exact upstream commit and files, and run a dependency/licence review. Never reuse ArtCraft names, logos, icons, screenshots, sample content, fonts or other brand assets. Do not copy an entire application or duplicate its distinctive visual design.

Brightdesk must retain its own name, icon system, colours, layout composition, copy, sample files and customer experience. Familiar interaction patterns such as a ribbon, formula bar, grid, slide navigator, formatting toolbar or sheet tabs are generic product conventions; the final interface must still be original Brightdesk work.

## Evidence and README rules

- Every README must distinguish implemented, tested, planned and unsupported functionality.
- Use genuine application screenshots only after the current build has been launched and the depicted workflow verified. Label concept artwork as concept artwork.
- Keep original Brightdesk icons and product identity in every product README and in the Suite catalogue.
- Each code, UI, build, dependency or workflow change must include the relevant README update in the same pull request.
- Record the exact commit tested, the actual test command, results and any skipped or blocked checks.
- Do not claim cross-platform readiness from configured installer targets alone; require native build, installation, first launch, persistence, update/upgrade and removal evidence.

## Research limitations

This first review examined public repository metadata, README feature claims, top-level Rust workspace manifests, crate/app directories, roadmap summaries and attribution/licence documents. It did not execute either reference project, inspect every source file, measure runtime behaviour or independently validate their feature claims. Further source-level comparison should be feature-specific and should not be described as runtime reverse engineering.

## Source-level isolation audit — 7 November 2026

A read-only source audit of the ten product repositories found a common implementation pattern that needs a deliberate migration plan:

- Each inspected product manifest declares its own `brightdeskAppId` (for example, `pages`, `sheets`, `slides`, `notes`, `database`, `forms`, `lists`, `planner`, `todo`, or `loop`).
- The inspected product source directories also contain a broad shared set of modules for multiple products, including database, forms, lists, planner, To Do and Workspace modules. The Pages and Sheets `src/app.js` files both define defaults and configuration for all ten product IDs.
- The Sheets, Decks and Notes repositories share an identical `src/main.js` blob at the time of inspection. Several product manifests use the same broad dependency set and include all of `src/**/*` in the packaged files.
- Sheets, Decks, Notes, Database and Forms have matching long test-command lists that enumerate the same cross-product test areas. Other repositories use `node --test` discovery.

This does not prove that every product exposes every other product at runtime: the per-product `brightdeskAppId` is used to select a launch target. It does show that the product source trees and packaged file sets are not yet cleanly isolated by product. The current approach creates duplicated cross-product implementation and makes independent ownership, test scope and future updates harder.

### Required migration

1. Preserve the current product-specific launch IDs and existing working behaviour.
2. Establish a shared shell/runtime contract in the Suite and shared foundations.
3. Identify the true product-owned modules and tests from each product's actual entry points and runtime paths.
4. Move only shared infrastructure behind versioned, tested interfaces; move product-specific modules into their owning repositories.
5. Keep a compatibility adapter while each product is migrated. Do not delete duplicated source until the independent product tests and Suite integration tests pass.
6. Change each product's test command to run its own tests plus relevant shared contract tests, not unrelated product suites.
7. Verify each product package contains only its required runtime modules and assets, then build, install, launch, save/reopen and remove it on its target platforms.

This is a source-structure finding, not a runtime failure diagnosis. No source was moved or deleted during this audit.

## Suite workspace and shared UI audit — 7 November 2026

A follow-up inspection of the Suite's actual workspace files found these additional gaps:

- The root `package.json` declares workspaces for nine product folders plus `packages/*`; it does not declare an `apps/workspace` package.
- The `apps` directory contains Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and an extra `wiki` prototype. The Wiki folder is not one of the ten approved customer products and is not listed in the root workspace manifest.
- The `apps/pages/index.js` prototype renders a title field, textarea and Save button whose handler only displays an alert. It does not persist a document.
- The `apps/sheets/index.js` prototype renders a small editable grid and formula input, but the Export CSV handler only displays an alert. It does not calculate formulas or create a CSV file.
- The root Electron entry point is `src/main.js`, while the prototype workspaces are Vite projects. The presence of a workspace folder is not proof that it is integrated into the shipped desktop runtime.
- `packages/ui/package.json` points its main entry to `src/index.js`, while the package-root `index.js` exports only a storage helper. The source entry exports theme, Button, Card and Input. The build script only prints a readiness message; no component build or test suite is defined.
- The UI theme currently contains a small set of generic colour and typography values. It is not yet the complete shared Brightdesk design system.

### Required correction

Treat the `apps/*` projects as early prototypes until their functionality and connection to the Electron Suite are demonstrated. Do not count their placeholder Save/Export alerts as completed persistence or file-export features.

The next implementation sequence should be:

1. Keep the working Suite runtime in `src/` intact while mapping each existing product workflow and its tests.
2. Add the missing Workspace product workspace or explicitly document a different supported integration boundary; do not substitute the internal Wiki prototype.
3. Replace placeholder actions in the product workspaces with real operations backed by the owning product service and persistence layer.
4. Fix the shared UI package entry-point inconsistency, define actual design tokens/components and add component tests.
5. Connect the workspaces to the Suite's real navigation and build pipeline, then verify packaged launch and data persistence.
6. Keep all ten product IDs, original icons and current product scope unchanged.

These are direct source observations. They do not establish whether the separate `src/` product modules already implement equivalent workflows; those modules require their own feature-specific tests and runtime checks.
