# Brightdesk project memory

The standing project requirement is to use exactly Node.js 24.22.2 LTS for development, testing and desktop installer builds.

The approved and fixed product scope is exactly ten Brightdesk products:
- Brightdesk Pages
- Brightdesk Sheets
- Brightdesk Decks
- Brightdesk Notes
- Brightdesk Database
- Brightdesk Forms
- Brightdesk Lists
- Brightdesk Planner
- Brightdesk To Do
- Brightdesk Workspace

All ten products are integrated into Brightdesk-suite. The complete suite is delivered through one native desktop installer. Each approved product has a desktop installer build target and its own product repository containing product-specific metadata, original artwork and build workflow.

The individual product repositories are generated from the same tested suite source. Each desktop build is configured for its named product, while Brightdesk-suite continues to contain all ten products together.

## Brightdesk naming rule

Use the product's actual name on its own (for example, **Brightdesk Pages**) and describe distribution as **desktop installers**.

Do not use the words "standalone" or "app" in customer-facing wording, product descriptions, repository names or descriptions, README files, documentation, UI labels, download buttons, installer names, release names, workflow names, artwork or progress updates. Replace either word with the product name or clear desktop-installer wording wherever possible.

Apply this rule consistently to all ten approved products and to every future product repository. When updating source code or internal files, also rename avoidable filenames, function names, variables, comments, tests and workflow identifiers that use the disallowed terminology. Preserve framework-required API names or compatibility keys only when changing them would break runtime behavior or existing data, and never expose such identifiers as product wording.

The user has explicitly authorised using available plugins and tools as needed for Brightdesk project work. This does not authorise adding products outside the approved ten or publishing releases without explicit release approval.

## Product scope restrictions

Outlook, OneDrive and Teams are excluded. Do not add them.

Brightdesk is an independent desktop product with original branding and implementation. Keep installers native to their target operating systems. Do not publish a release without explicit owner approval.
