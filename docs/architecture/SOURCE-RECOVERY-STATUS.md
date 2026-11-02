# Brightdesk source recovery status

**Date:** 2026-11-03  
**Purpose:** Prevent older source from silently replacing the latest development work.

## Verified repository state

The connected GitHub repository is `connormolloy12/Brightdesk-suite`, private, with `main` as its default branch.

The current `main` branch reports package version **0.1.0** in `package.json`. Its latest visible commits include the November 2 update-settings changes. The repository contains source files and a v0.1.0 source archive.

## Recovered newer source

The project Library contains the **Brightdesk v0.5.1 Linux Installer CI Hardening** source archive. Its archive inventory includes:

- Node.js 24.22.2 runtime pin and setup scripts.
- Electron Builder configuration and Windows/macOS/Linux release workflow.
- Installer agreement handling and Linux install helper.
- Brightdesk source, language/dictionary services, file adapters and tests.
- Product scope, architecture, implementation matrix, release readiness and REA Bench reports.

The recovered source archive is the correct development lineage to reconcile before continuing code changes. It is not proof that the source has been installed, tested on Node.js 24.22.2 or built into native installers in the current environment.

## Required repository reconciliation

1. Preserve the current GitHub history and the November 2 update-settings commits.
2. Restore the recovered v0.5.1 source as a reviewed source update, not by replacing the repository with the older v0.1.0 archive.
3. Compare the v0.5.1 source against current `main` and explicitly retain any valid later fixes.
4. Keep the package version and release tag consistent; do not call v0.5.1 a finished release.
5. Run the exact Node.js 24.22.2 workflow, tests, lockfile validation, licence verification and platform build matrix.
6. Only then begin merging the Rust prototype and new visual assets into the recovered source.

## Scope guard

The only approved app IDs are `pages`, `sheets`, `slides`, `notes`, `database`, `forms`, `lists`, `planner`, `todo` and `loop`. Outlook, OneDrive, Teams and all other apps remain excluded.
