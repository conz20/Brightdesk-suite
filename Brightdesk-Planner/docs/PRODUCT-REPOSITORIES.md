# Brightdesk product repositories

Brightdesk keeps one complete desktop suite and gives each approved product its own intended repository.

- Brightdesk-suite remains the main repository and the complete ten-product desktop suite.
- Each product repository contains the named product's desktop edition, README, original artwork and its own desktop-installer workflow.
- Each product repository is generated from the same tested Brightdesk source so its features stay aligned with the suite.

## The ten intended product repositories

| Product | GitHub repository | Product ID | Repository status |
|---|---|---|---|
| Brightdesk Pages | Brightdesk-Pages | pages | Created and populated |
| Brightdesk Sheets | Brightdesk-Sheets | sheets | Created and populated |
| Brightdesk Decks | Brightdesk-Decks | slides | Created and populated |
| Brightdesk Notes | Brightdesk-Notes | notes | Created and populated |
| Brightdesk Database | Brightdesk-Database | database | Created and populated |
| Brightdesk Forms | Brightdesk-Forms | forms | Created and populated |
| Brightdesk Lists | Brightdesk-Lists | lists | Not created |
| Brightdesk Planner | Brightdesk-Planner | planner | Not created |
| Brightdesk To Do | Brightdesk-To-Do | todo | Not created |
| Brightdesk Workspace | Brightdesk-Workspace | loop | Not created |

Repository status was checked against GitHub on 3 November 2026. Brightdesk-Pages, Brightdesk-Sheets, Brightdesk-Decks, Brightdesk-Notes, Brightdesk-Database and Brightdesk-Forms exist and contain product-specific source packages, artwork, package manifests and installer workflows. Brightdesk-Lists, Brightdesk-Planner, Brightdesk-To-Do and Brightdesk-Workspace do not exist yet.

## Prepare the product folders

From a checkout of Brightdesk-suite using Node.js 24.22.2, run:

    npm ci
    npm run repositories:prepare

The generator creates ten complete folders in release/product-repository-folders/. Each folder contains the product source, a locked product package manifest, original product artwork, a product README and a GitHub Actions desktop-installer workflow.

The generator does not create GitHub repositories or push code. After a repository exists, its matching folder can be pushed to that repository. The suite build workflow is configured to upload the generated ten-folder bundle as a GitHub Actions artifact, including hidden GitHub workflow files. After a successful updated build, download that artifact from the Actions run and use the matching folder to populate each repository.

## Product repository checks and releases

Each generated product repository runs its complete test suite, validates its dependency lock and third-party licences, checks release preflight and audits high-severity dependency vulnerabilities on each pull request and push. A daily scheduled check repeats those quality checks.

A product installer build is started manually after the test job passes. It builds Windows, macOS and Linux desktop installers and verifies the expected files and SHA-256 checksums. Publishing a GitHub Release is a separate manual option and is off by default.

The integrated suite also builds and verifies the ten product installers. The Product Centre in Brightdesk-suite opens the correct installer for the computer's operating system after the suite release has been published.

## Current CI runner limitation

The Brightdesk Pages repository has a successful product quality run. The private Sheets, Decks, Notes, Database and Forms repositories currently fail before job steps because GitHub does not allocate a hosted runner; their failed jobs expose no runner name, steps or downloadable logs. The self-hosted Mac runner registered to Brightdesk-suite is not automatically shared with those separate repositories. The integrated Brightdesk-suite gate therefore remains the authoritative place to execute all ten product tests and installer builds until a shared runner group or suitable per-repository runner is available. Do not treat the private product repository checks as passed.

## Product scope

The approved products remain exactly Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace. Outlook, OneDrive and Teams are excluded. Brightdesk remains an independent product and uses original names, code, artwork and interface design.
