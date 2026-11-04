# Brightdesk Office Suite

Brightdesk is an independent native desktop productivity suite. It is not affiliated with Microsoft.

## First release

Version 0.1.0 is the integrated ten-app desktop suite. The complete first-release lineup is shown below:

| App | What it does | Status |
| --- | --- | --- |
| Brightdesk Pages | Write and format documents. | Available |
| Brightdesk Sheets | Build spreadsheets, formulas and tables. | Available |
| Brightdesk Decks | Create slide presentations. | Available |
| Brightdesk Notes | Keep notes and ideas together. | Available |
| Brightdesk Database | Organise records, tables and structured data locally. | Available |
| Brightdesk Forms | Create surveys, quizzes and collect responses locally. | Available |
| Brightdesk Lists | Track projects, inventories and records locally. | Available |
| Brightdesk Planner | Plan work, tasks and progress locally. | Available |
| Brightdesk To Do | Manage daily tasks and reminders locally. | Available |
| Brightdesk Workspace | Bring project notes, tasks and resources together locally. | Available |

All ten apps are implemented in the integrated 0.1.0 codebase and are designed to work as part of the Brightdesk desktop suite. The first integrated release remains local-first; these modules do not claim cloud collaboration or Microsoft service integration.

## Supported installer targets

The release workflow is designed to build macOS universal DMG and PKG installers, Windows x64 EXE installers, and Linux x64 AppImage and DEB packages. A build is only considered ready after the platform artifacts, legal documents and SHA-256 checksums have been verified.

## Local AI maintenance helper

The separate developer-maintenance helper uses a local Qwen3 model through llama.cpp. Its Node.js adapter at `scripts/brightdesk-ai/local-qwen-provider.js` follows the same `generate(...)` provider contract used by the private Brightdesk-AI coordinator.

The adapter is disabled by default. The maintenance response script explicitly enables it for that local workflow, and it can only contact `http://127.0.0.1:8080`. It has no remote fallback and needs no model API key. Chat models and embedding models remain separate: Qwen provides chat responses; the Brightdesk-AI Rust engine only processes vectors produced by a real embedding provider.

This helper is development infrastructure only. It is not bundled into customer installers, and the ten Office Suite apps do not depend on Brightdesk-AI or on the helper. Local model inference has no per-request model API fee, but GitHub Actions runner time remains subject to the repository's GitHub usage limits and billing rules.

See [the maintenance guide](docs/BRIGHTDESK_AI_MAINTENANCE.md) for its limits and security boundaries.

## Installing Brightdesk

**End users do not need to download or install Node.js.** The native desktop application is packaged with the Electron runtime it needs. Install Brightdesk using the installer for your operating system and open it like any other desktop app. See [INSTALLATION.md](docs/INSTALLATION.md) for instructions.

## Development

Building and testing Brightdesk requires exactly Node.js 24.22.2. This is a developer/CI requirement only; it is not a customer installation requirement. Run `npm run setup:dev` after activating that runtime. The project uses its checked-in package lock and automated Node.js tests.

Brightdesk uses original product names, code, artwork and interface design. Microsoft product names are used only as internal workflow comparisons.
