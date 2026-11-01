# Brightdesk project memory

The standing project requirement is to use exactly Node.js 24.22.2 LTS for development, testing and release builds.

The approved and fixed product scope is exactly ten apps:
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

All ten apps are integrated into Brightdesk-suite. The complete suite remains available as one native desktop installer. Each approved app also has a standalone installer build target and a standalone app repository seed with app-specific metadata, original artwork and build workflow.

The individual app repositories are generated from the same tested suite source. Each standalone package is locked to one app ID, while Brightdesk-suite continues to contain and launch all ten apps together.

Outlook, OneDrive and Teams are excluded. Do not add them.

Brightdesk is an independent desktop product with original branding and implementation. Keep installers native to their target operating systems. Do not publish a release without explicit owner approval.
