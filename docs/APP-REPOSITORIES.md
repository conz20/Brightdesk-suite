# Brightdesk app repositories

Brightdesk keeps one complete desktop suite and gives each approved app its own repository.

- **Brightdesk-suite** remains the main repository and the complete ten-app desktop product.
- Each app repository contains a standalone edition of that app, its own README and preview artwork, and its own build workflow.
- The standalone edition opens directly into its named app. It does not add a new app to the approved catalogue.
- The app repositories are generated from the same tested Brightdesk source so their features stay aligned with the suite.

## The ten app repositories

| App | GitHub repository | App ID |
|---|---|---|
| Brightdesk Pages | Brightdesk-Pages | `pages` |
| Brightdesk Sheets | Brightdesk-Sheets | `sheets` |
| Brightdesk Decks | Brightdesk-Decks | `slides` |
| Brightdesk Notes | Brightdesk-Notes | `notes` |
| Brightdesk Database | Brightdesk-Database | `database` |
| Brightdesk Forms | Brightdesk-Forms | `forms` |
| Brightdesk Lists | Brightdesk-Lists | `lists` |
| Brightdesk Planner | Brightdesk-Planner | `planner` |
| Brightdesk To Do | Brightdesk-To-Do | `todo` |
| Brightdesk Workspace | Brightdesk-Workspace | `loop` |

These are the exact intended repository names. Each remains pending until its GitHub repository has been created and the seed has been pushed.

## Prepare the repository contents

From a checkout of Brightdesk-suite using Node.js 24.22.2, run:

```sh
npm ci
npm run repositories:prepare
```

The generator creates ten complete folders in `release/app-repository-seeds/`. Each folder contains the standalone app source, a locked app-specific package manifest, the original app preview artwork, an app-focused README, and a separate GitHub Actions workflow.

The generator does not create GitHub repositories or push code. After a repository exists, its matching seed folder can be pushed to that repository.

## Standalone releases

Each app repository has its own manual release workflow. It tests the app, builds its native Windows, macOS and Linux installers, verifies the expected files and writes SHA-256 checksums. Publishing a GitHub Release is a separate manual option and is off by default.

The integrated suite also builds all ten standalone installers. The App Centre in Brightdesk-suite opens the corresponding standalone installer for the computer's operating system after the suite release has been published.

## Product scope

The approved apps remain exactly Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace. Outlook, OneDrive and Teams are excluded. Brightdesk remains an independent product and uses original names, code, artwork and interface design.
