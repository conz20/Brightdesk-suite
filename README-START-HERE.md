# Brightdesk repository guide

Brightdesk Office Suite is maintained in the main [Brightdesk-suite repository](https://github.com/connormolloy12/Brightdesk-suite). Its approved lineup contains exactly ten desktop applications.

## The ten application repositories

All ten standalone repositories have been created and are available:

- [Brightdesk Pages](https://github.com/connormolloy12/Brightdesk-Pages) — documents and writing.
- [Brightdesk Sheets](https://github.com/connormolloy12/Brightdesk-Sheets) — spreadsheets, formulas and data.
- [Brightdesk Decks](https://github.com/connormolloy12/Brightdesk-Decks) — slide presentations.
- [Brightdesk Notes](https://github.com/connormolloy12/Brightdesk-Notes) — notes, notebooks and ideas.
- [Brightdesk Database](https://github.com/connormolloy12/Brightdesk-Database) — structured tables and records.
- [Brightdesk Forms](https://github.com/connormolloy12/Brightdesk-Forms) — forms, surveys and responses.
- [Brightdesk Lists](https://github.com/connormolloy12/Brightdesk-Lists) — structured lists and tracking.
- [Brightdesk Planner](https://github.com/connormolloy12/Brightdesk-Planner) — project plans and progress.
- [Brightdesk To Do](https://github.com/connormolloy12/Brightdesk-To-Do) — daily tasks and priorities.
- [Brightdesk Workspace](https://github.com/connormolloy12/Brightdesk-Workspace) — connected project workspaces.

## Which repository should be used?

- Use **Brightdesk-suite** for the integrated desktop suite, shared shell, product catalogue, design system, installer configuration and overall release readiness.
- Use an individual app repository for that product's standalone source, design details, tests and repository-specific documentation.
- Do not create duplicate application repositories. All ten already exist.
- **Brightdesk-AI** is a separate private engineering and maintenance tool. It is not a customer app and must never be included in customer installers or downloads.

## Product scope and identity

The approved lineup is Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace only. Outlook, OneDrive, Teams and other unapproved applications are excluded.

Brightdesk uses original names, code, interface design and artwork. Application icons must use the committed SVG artwork; do not use emoji, Unicode symbols, text glyphs or placeholder initials as app icons.

## Development requirements

Use Node.js **24.22.3** for development, testing and release builds. Read the repository's README and contributor instructions before making changes. Keep release claims accurate: a concept preview is not a running screenshot, a committed build script is not proof of a successful installer, and no public release should be published without the owner's approval.

See [the main suite README](README.md), [the product scope lock](PRODUCT_SCOPE_LOCK.md) and [the shared visual standard](docs/BRIGHTDESK_VISUAL_STANDARD.md) for the canonical requirements.
