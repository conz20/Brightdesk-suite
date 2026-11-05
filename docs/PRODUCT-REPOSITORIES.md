# Brightdesk product repositories

Brightdesk has one complete desktop Suite and a separate GitHub repository for each approved product.

- `Brightdesk-suite` is the main repository and the integrated ten-product desktop Suite.
- Each product repository is the product-specific home for its source, documentation, tests and release preparation.
- Product repository existence is separate from verified source parity, passing CI, runtime acceptance and installer release.

## The ten product repositories

| Product | GitHub repository | Product ID | Repository status |
|---|---|---|---|
| Brightdesk Pages | [Brightdesk-Pages](https://github.com/connormolloy12/Brightdesk-Pages) | `pages` | Exists; `main` and `package.json` verified |
| Brightdesk Sheets | [Brightdesk-Sheets](https://github.com/connormolloy12/Brightdesk-Sheets) | `sheets` | Exists; `main` and `package.json` verified |
| Brightdesk Decks | [Brightdesk-Decks](https://github.com/connormolloy12/Brightdesk-Decks) | `slides` | Exists; `main` and `package.json` verified |
| Brightdesk Notes | [Brightdesk-Notes](https://github.com/connormolloy12/Brightdesk-Notes) | `notes` | Exists; `main` and `package.json` verified |
| Brightdesk Database | [Brightdesk-Database](https://github.com/connormolloy12/Brightdesk-Database) | `database` | Exists; `main` and `package.json` verified |
| Brightdesk Forms | [Brightdesk-Forms](https://github.com/connormolloy12/Brightdesk-Forms) | `forms` | Exists; `main` and `package.json` verified |
| Brightdesk Lists | [Brightdesk-Lists](https://github.com/connormolloy12/Brightdesk-Lists) | `lists` | Exists; `main` and `package.json` verified |
| Brightdesk Planner | [Brightdesk-Planner](https://github.com/connormolloy12/Brightdesk-Planner) | `planner` | Exists; `main` and `package.json` verified |
| Brightdesk To Do | [Brightdesk-To-Do](https://github.com/connormolloy12/Brightdesk-To-Do) | `todo` | Exists; `main` and `package.json` verified |
| Brightdesk Workspace | [Brightdesk-Workspace](https://github.com/connormolloy12/Brightdesk-Workspace) | `loop` | Exists; `main` and `package.json` verified |

The repository inventory was checked directly against GitHub on **5 November 2026**. All ten repositories exist, use `main` as their default branch and expose a readable `package.json`. This check does not establish that their source is complete, that current CI has passed, or that an installer has been built. Those require separate evidence on the exact current commit.

## Prepare product repository folders

From a checkout of `Brightdesk-suite` using Node.js 24.22.2, run:

    npm ci
    npm run repositories:prepare

The generator prepares ten product folders in `release/product-repository-folders/`. Each generated folder is intended to contain the product source, locked package manifest, original product artwork, product README and GitHub Actions desktop-installer workflow.

The generator does not create remote GitHub repositories or push code. Because all ten remote repositories now exist, the generated folders are a source-preparation/export step for reviewing and synchronising product content. Review differences against each repository's current branch and open work before updating it; do not overwrite in-flight product work blindly. The Suite workflow can upload the generated ten-folder bundle as a GitHub Actions artifact, including hidden workflow files.

## Product repository checks and releases

The repository workflows define product checks, dependency-lock verification, third-party licence verification, release preflight and dependency audits. A workflow file or a queued job does not count as a passing check. Verify the current head SHA and require a completed successful run with actual job steps before describing a product check as passed.

A product installer build must complete on the native Windows, macOS or Linux runner for the relevant operating system and produce the expected artifacts and SHA-256 checksums. Publishing a GitHub Release is a separate manual action and must remain off until the build and release gates pass.

The integrated Suite build is intended to produce the Suite and all ten individual product installers. The complete build matrix must be verified on one coherent candidate commit before any package is described as a current release.

## Automatic update status

Automatic update delivery is **not configured yet** in the installer branch. The Suite's `build.publish` list and the individual-product builder's `publish` list are empty. The current updater code therefore reports that automatic updates are unavailable. Interface controls, an updater dependency, or a build workflow do not prove that a release can be discovered or installed.

The default policy is to check for updates without downloading or installing them automatically. Automatic downloading is disabled until the user explicitly opts in; automatic installation is also disabled until the user separately opts in. A manual download action remains available once a valid update source exists. Before claiming update parity, configure and test a reachable publishing provider and a versioned update channel for Suite and individual-product installations. Test older installations discovering the release, downloading it, validating its integrity and installing it only with the user's approval on Windows, macOS and Linux. Test Linux AppImage and DEB/package-manager update behaviour separately. Keep the update gate blocked until the evidence exists. Track the provider and acceptance work in [Suite issue #66](https://github.com/connormolloy12/Brightdesk-suite/issues/66).

## Current CI runner limitation

Runner-allocation evidence is tracked in [Suite issue #23](https://github.com/connormolloy12/Brightdesk-suite/issues/23). Some individual product repository jobs have failed before executing any steps because GitHub did not assign a runner (for example, `runner_id: 0`, no runner name and an empty step list). That is an infrastructure block, not a source-code test failure and not a passing check.

The Suite's self-hosted runner is not automatically shared with the ten product repositories. Use the latest job metadata and logs for each repository before reporting status. Do not repeatedly rerun jobs that have no runner assigned, and do not enable paid overage or change repository visibility as a workaround.

## Product scope

The approved products remain exactly Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace. Outlook, OneDrive, Teams and any additional products are excluded. Brightdesk remains independent and uses original product names, source code, artwork and interface design.
