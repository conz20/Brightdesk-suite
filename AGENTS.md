# Brightdesk contributor instructions

## Runtime
Use exactly Node.js **24.22.2 LTS**. Do not change the pinned runtime in package.json, .nvmrc, .node-version, .npmrc, the dev container or GitHub Actions without explicit project-owner approval.

## Product scope
Keep the approved catalogue exactly ten Brightdesk products: Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace. All ten are integrated into the Brightdesk suite and have desktop installer build targets.

Do not add Outlook, OneDrive, Teams or any other unapproved product.

## Product naming
Use each product's actual name on its own (for example, **Brightdesk Pages**). Describe distribution as **desktop installers**.

Do not use the words "standalone" or "app" in customer-facing text, product descriptions, repository names or descriptions, README files, documentation, UI labels, download controls, installer names, release names, workflow names, artwork or progress updates. Replace those terms with the product name or clear desktop-installer wording.

Apply this rule to all ten products and all future product repositories. Rename avoidable internal filenames, functions, variables, comments, tests and workflow identifiers when practical. Keep only framework-required API names or compatibility keys when a change would break runtime behavior or saved data; never display those technical names to customers.

## Product identity
Brightdesk is an independent product. Use original names, source code, interface design and artwork. Do not claim Microsoft affiliation or copy proprietary Microsoft code or assets.

## Distribution
Keep Brightdesk-suite as the complete ten-product desktop suite. Its Product Centre must link to verified desktop installer files for the correct operating system. Each product has a dedicated installer target and can be prepared as a product repository folder from the same tested suite source. Brightdesk-Pages is the only separate product repository currently confirmed to exist. The other nine product folders are not GitHub repositories until GitHub confirms their creation and the source has been pushed. Never describe a prepared folder as a created repository.

## Release safety
Do not claim an installer is ready until its platform build, legal files, checksum verification and release tests have passed. Do not publish a GitHub Release unless the project owner explicitly selects the publish option.
