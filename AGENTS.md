# Brightdesk contributor instructions

## Runtime

Use exactly Node.js **24.22.2 LTS**. Do not change the pinned runtime in package.json, .nvmrc, .node-version, .npmrc, the dev container or GitHub Actions without explicit project-owner approval. Do not run project tests or builds with Node.js 22.

## Product scope

Keep exactly these ten approved apps: Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace.

All ten have integrated local-first workflows and dedicated modules in the current integrated source line. Keep the availability catalogue and tests truthful. “Implemented” does not mean full commercial feature parity or release-ready platform packaging.

Do not add Outlook, OneDrive, Teams or any other unapproved app.

## Suite and standalone architecture

- Brightdesk Suite is its own desktop launcher application.
- Each of the ten approved apps must be independently buildable and installable on Windows, macOS and Linux.
- The launcher must open registered standalone apps, while each standalone app must launch directly from its operating system.
- The initial app-selection state is empty. Never silently select all apps or report unselected apps as installed.
- Keep “Add to suite” distinct from “Download desktop app”.
- Preserve existing documents and user settings during upgrades and uninstall.
- Do not claim a native multi-app installer selector is complete until each platform's actual installer selection flow has been built and tested.

## Updates

- Manual update checks must always remain available.
- Automatic checking and downloading are user-configurable.
- Automatic installation is prohibited. Keep autoInstall false and autoUpdater.autoInstallOnAppQuit false.
- A person must explicitly press **Next** to launch a verified installer.
- Show installed and available versions, provide a review action, and allow update notifications to be dismissed.

## Product identity and pricing

Brightdesk is independent. Use original names, source code, interface design and artwork. Do not claim Microsoft or Adobe affiliation or copy proprietary code, logos, icons, assets or distinctive layouts.

Brightdesk must remain ad-free, subscription-free and free to use, with no Brightdesk licence fee, activation keys, serial numbers, paid tiers, paywalls or paid updates. Preserve third-party open-source attribution and notices where legally required.

## Quality and release safety

Use tests for behaviour changes. Run the full test suite, JavaScript syntax checks, licence verification, release preflight and applicable platform tests using exactly Node.js 24.22.2.

Do not claim an installer is ready until its platform build, legal files, checksum verification, first-launch, upgrade and uninstall tests have passed. Do not publish a GitHub Release unless the project owner explicitly selects the publish option.
