# Brightdesk Office Suite

Brightdesk is an independent native desktop productivity suite. It is not affiliated with Microsoft.

## First release

Version 0.1.0 includes four implemented desktop apps:

- Brightdesk Pages
- Brightdesk Sheets
- Brightdesk Decks
- Brightdesk Notes

The approved product catalogue contains ten apps in total. Brightdesk Database, Forms, Lists, Planner, To Do and Workspace are planned and are not included as working apps in this first release.

## Supported installer targets

The release workflow is designed to build macOS universal DMG and PKG installers, Windows x64 EXE installers, and Linux x64 AppImage and DEB packages. A build is only considered ready after the platform artifacts, legal documents and SHA-256 checksums have been verified.

## Development

Brightdesk requires exactly Node.js 24.22.2. Run `npm run setup:dev` after activating that runtime. The project uses its checked-in package lock and automated Node.js tests.

Brightdesk uses original product names, code, artwork and interface design. Microsoft product names are used only as internal workflow comparisons.
