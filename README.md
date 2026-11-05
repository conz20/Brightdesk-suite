# Brightdesk Office Suite

<p align="center"><img src="assets/brand/brightdesk-logo.svg" alt="Brightdesk" width="340"></p>

<p align="center"><strong>Ten focused desktop products. One consistent Brightdesk experience.</strong></p>

Brightdesk is an independent, local-first desktop productivity suite. It uses original product names, code, interface design and artwork. It is not affiliated with Microsoft, Adobe or ArtCraft.

## The ten approved products

| Product | Original icon | Purpose |
| --- | :---: | --- |
| **Pages** | <img src="assets/icons/pages.svg" alt="Pages icon" width="52"> | Create and format documents, letters and reports. |
| **Sheets** | <img src="assets/icons/sheets.svg" alt="Sheets icon" width="52"> | Work with spreadsheets, formulas, calculations and data. |
| **Decks** | <img src="assets/icons/decks.svg" alt="Decks icon" width="52"> | Create, edit and present slide presentations. |
| **Notes** | <img src="assets/icons/notes.svg" alt="Notes icon" width="52"> | Capture and organise quick notes and ideas. |
| **Database** | <img src="assets/icons/database.svg" alt="Database icon" width="52"> | Build local tables, define fields and manage records. |
| **Forms** | <img src="assets/icons/forms.svg" alt="Forms icon" width="52"> | Create forms, preview questions and collect responses locally. |
| **Lists** | <img src="assets/icons/lists.svg" alt="Lists icon" width="52"> | Organise records with custom columns, search, filters and sorting. |
| **Planner** | <img src="assets/icons/planner.svg" alt="Planner icon" width="52"> | Organise plans, buckets, tasks, priorities and progress. |
| **To Do** | <img src="assets/icons/to-do.svg" alt="To Do icon" width="52"> | Manage personal tasks, due dates and daily priorities. |
| **Workspace** | <img src="assets/icons/workspace.svg" alt="Workspace icon" width="52"> | Bring project pages, notes, checklists and information together. |

These are the only products in the approved suite. Outlook, OneDrive, Teams and any other unapproved products are excluded.

## Our own approach to office productivity

Brightdesk uses familiar productivity workflows as capability references, then builds its own product experience around the approved ten applications. The goal is a coherent Brightdesk suite—not a copy of another company's software.

Our product names, four-panel brand mark, icons, artwork, interface styling, source code and implementation decisions remain original. Microsoft product references are used only to describe comparable task capabilities; they do not imply affiliation, identical feature availability or permission to reuse proprietary material.

See the [Office Suite capability benchmark](docs/OFFICE-SUITE-CAPABILITY-BENCHMARK.md) for the researched feature areas, current first-use boundaries, local-first adaptations and staged implementation direction. Planned capabilities are not represented as finished features.


## Suite design preview

<p align="center"><img src="assets/previews/suite-dashboard-concept.svg" alt="Brightdesk suite dashboard design concept, not a running application screenshot" width="100%"></p>

> **Concept artwork — not a screenshot.** This image communicates the intended Brightdesk visual direction. It is not a capture from the running desktop build.

The app-centre concept uses a Settings cogwheel in the top-right corner instead of an account/avatar badge. In the integrated desktop suite, that control opens the existing Settings area. The bell immediately to its left is Notifications: it opens a clearly labelled panel with an honest empty state. The Save control also has a recognisable save icon and a visible label.

## What is implemented

All ten approved product areas are integrated into the main suite source and have dedicated workspace or service modules. The current first-use scope includes:

| Product | First-use workflows represented in the suite |
| --- | --- |
| **Pages** | Document editing, basic text formatting, lists and tables, page size, orientation and margin settings. |
| **Sheets** | Cell editing, basic arithmetic and range formulas, row/column editing and column sorting. |
| **Decks** | Create, edit, duplicate and delete slides; choose basic themes and present. |
| **Notes** | Write and edit quick notes with on-device saving and text/Markdown export. |
| **Database** | Create tables and typed fields; add, edit, search, sort and export records as CSV. |
| **Forms** | Create forms and supported question types; preview, validate, collect and review local responses. |
| **Lists** | Create lists, custom columns and records; search, filter and sort data. |
| **Planner** | Create plans, buckets and tasks; track priority, progress and due dates; filter tasks. |
| **To Do** | Create and update tasks; use My Day, Important, Planned, Tasks and Completed views; search tasks. |
| **Workspace** | Create workspaces and pages; add and organise text, heading, bullet, callout, divider and checklist blocks. |

This table describes the first-use scope represented in source code. It is not a claim of complete feature parity with other office suites, final accessibility sign-off or release acceptance. Each product has explicit boundaries and acceptance checks in its documentation.

## Genuine screenshots and verification

The concept previews in the product repositories are not genuine screenshots. The older `assets/hero-showcase.png` file is a composed promotional collage, not a capture of the current running suite; it is intentionally not used as evidence of working screens. No verified screenshot set from the current running desktop build is published yet. Do not treat concept artwork, prototype package screens or the older v0.1.0 source archive as proof of current desktop behaviour.

A genuine screenshot should be captured directly from the current Electron build after launching the product and checking its primary workflow. The capture must show the real interface without composited controls or fabricated UI. Use non-sensitive sample data, retain the full product window, and label the image with the tested build or commit. See the [visual and interaction standard](docs/BRIGHTDESK_VISUAL_STANDARD.md) and its [machine-readable approved design contract](docs/BRIGHTDESK_DESIGN_CONTRACT.json), which locks the shared Brightdesk shell tokens and all ten original product icon/accent identities.

## Local-first desktop software

Brightdesk is designed to keep product data on the current device. The first-use features described above do not require an account, cloud workspace or online collaboration. Some tasks such as downloads and update checks may use network access when explicitly requested.

## Product repositories

Each approved product has its own repository and product documentation:

- [Brightdesk Pages](https://github.com/connormolloy12/Brightdesk-Pages)
- [Brightdesk Sheets](https://github.com/connormolloy12/Brightdesk-Sheets)
- [Brightdesk Decks](https://github.com/connormolloy12/Brightdesk-Decks)
- [Brightdesk Notes](https://github.com/connormolloy12/Brightdesk-Notes)
- [Brightdesk Database](https://github.com/connormolloy12/Brightdesk-Database)
- [Brightdesk Forms](https://github.com/connormolloy12/Brightdesk-Forms)
- [Brightdesk Lists](https://github.com/connormolloy12/Brightdesk-Lists)
- [Brightdesk Planner](https://github.com/connormolloy12/Brightdesk-Planner)
- [Brightdesk To Do](https://github.com/connormolloy12/Brightdesk-To-Do)
- [Brightdesk Workspace](https://github.com/connormolloy12/Brightdesk-Workspace)

## Development

Use Node.js **24.22.2** for development, tests and release builds.

```sh
npm ci
npm run check:node
npm run verify:product-sources
npm test
npm run build
```

The source-parity pilot now covers **thirteen feature modules across all ten individual product repositories**: Pages (`src/page-layout.js`), Sheets (`src/formula.js`), Decks (`src/slides-service.js`), Notes (`src/notes-service.js`), Forms (`src/forms-service.js` and `src/forms-workspace.js`), Lists (`src/lists-service.js`), To Do (`src/todo-service.js`), Planner (`src/planner-service.js`), Database (`src/database-service.js` and `src/database-workspace.js`), and Workspace (`src/workspace-editor.js` and `src/workspace-service.js`). The Suite verifies each vendored copy against the pinned Git blob recorded in [PRODUCT_SOURCE_LOCK.json](docs/PRODUCT_SOURCE_LOCK.json). The Pages, Sheets, Forms service, Lists, To Do, Planner and Workspace modules are pinned to their product repositories' `main` branches. Forms workspace is pinned to Forms PR #15 commit `0960d0ceee9e00bc7f0f78a053289c3d4d3699ce`; Database service/workspace are pinned to Database PR #15 commit `46d0feeb9e7110c2025857b6a2d145eeed06d40a`; Decks slide service is pinned to Decks PR #15 commit `a0e049a5402d8a53f0be3454ae87440f81619889`; and Notes content service is pinned to Notes PR #15 commit `733adb51adcd9586ee8b71dd4154d16da661f1b9`. These four product PR references remain unmerged and are pinned to immutable commits pending integration into their respective `main` branches. The Notes regression tests also cover cursor insertion and replacement of selected text at separator boundaries (`tests/notes-service.test.js`). The same source check runs in CI and release preflight. This is verified source parity for these thirteen modules only, not complete UI-shell parity or proof that every product file is shared from one implementation. On 5 November 2026, a direct GitHub blob comparison at Suite PR #60 head `09ad0433a3a53a7a25529b85dc1402e6bbb7bb7d` confirmed that all 13 upstream files, Suite vendor copies and `sourceBlobSha` lock values match. Eight entries use product `main` refs and five entries use immutable commits from four unmerged source-alignment PRs. This establishes exact source-file identity at the pinned revisions only; it does not mean those PRs are merged or that desktop runtime acceptance is complete.

Run `npm run release:preflight` before preparing an installer. Build and verify installers on their matching native platforms; a build script existing in the repository does not mean that a verified installer has been published.

See [installation guidance](docs/INSTALLATION.md), [local release verification](docs/LOCAL-RELEASE-VERIFICATION.md), [versioning](docs/VERSIONING.md), [Rust integration](docs/RUST_ENGINE_INTEGRATION.md), [PRODUCT_SCOPE_LOCK.md](PRODUCT_SCOPE_LOCK.md), [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## Integration and release status

Product integration, automated tests, live desktop acceptance and installer release are separate checkpoints. The integrated source still requires current-build workflow verification, accessibility review, local persistence/recovery checks, upgrade and uninstall checks, legal packaging checks, and native installer verification before a public release is described as complete.

