# Brightdesk contributor instructions

## Runtime
Use exactly Node.js **24.22.2 LTS**. Do not change the pinned runtime in package.json, .nvmrc, .node-version, .npmrc, the dev container or GitHub Actions without explicit project-owner approval.

## Product scope
Keep the approved catalogue exactly ten apps: Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace. All ten are integrated into the Brightdesk suite and have dedicated standalone installer build targets.

Do not add Outlook, OneDrive, Teams or any other unapproved app.

## Product identity
Brightdesk is an independent product. Use original names, source code, interface design and artwork. Do not claim Microsoft affiliation or copy proprietary Microsoft code or assets.

## Distribution
Keep Brightdesk-suite as the complete ten-app desktop product. The App Centre must offer a standalone download for each approved app. The standalone downloads must point to verified release assets. Each app repository is a separate product home generated from the same tested suite source and must lock its build to its one app ID.

## Release safety
Do not claim an installer is ready until its platform build, legal files, checksum verification and release tests have passed. Do not publish a GitHub Release unless the project owner explicitly selects the publish option.
