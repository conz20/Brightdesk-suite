# Brightdesk product repositories

Brightdesk keeps one complete desktop suite and gives each approved product its own intended repository.

- Brightdesk-suite remains the main repository and the complete ten-product desktop suite.
- Each product repository contains the named product's desktop edition, README, original artwork and its own desktop-installer workflow.
- Each product repository is generated from the same tested Brightdesk source so its features stay aligned with the suite.

## The ten intended product repositories

| Product | GitHub repository | Product ID | Repository status |
|---|---|---|---|
| Brightdesk Pages | Brightdesk-Pages | pages | Created |
| Brightdesk Sheets | Brightdesk-Sheets | sheets | Not created |
| Brightdesk Decks | Brightdesk-Decks | slides | Not created |
| Brightdesk Notes | Brightdesk-Notes | notes | Not created |
| Brightdesk Database | Brightdesk-Database | database | Not created |
| Brightdesk Forms | Brightdesk-Forms | forms | Not created |
| Brightdesk Lists | Brightdesk-Lists | lists | Not created |
| Brightdesk Planner | Brightdesk-Planner | planner | Not created |
| Brightdesk To Do | Brightdesk-To-Do | todo | Not created |
| Brightdesk Workspace | Brightdesk-Workspace | loop | Not created |

These are the intended repository names. The Pages repository already exists. The other nine names are prepared as product folders but are not GitHub repositories yet.

## Prepare the product folders

From a checkout of Brightdesk-suite using Node.js 24.22.2, run:

    npm ci
    npm run repositories:prepare

The generator creates ten complete folders in release/product-repository-folders/. Each folder contains the product source, a locked product package manifest, original product artwork, a product README and a GitHub Actions desktop-installer workflow.

The generator does not create GitHub repositories or push code. After a repository exists, its matching folder can be pushed to that repository.

## Product repository checks and releases

Each generated product repository runs its complete test suite, validates its dependency lock and third-party licences, checks release preflight and audits high-severity dependency vulnerabilities on each pull request and push. A daily scheduled check repeats those quality checks.

A product installer build is started manually after the test job passes. It builds Windows, macOS and Linux desktop installers and verifies the expected files and SHA-256 checksums. Publishing a GitHub Release is a separate manual option and is off by default.

The integrated suite also builds and verifies the ten product installers. The Product Centre in Brightdesk-suite opens the correct installer for the computer's operating system after the suite release has been published.

## Product scope

The approved products remain exactly Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace. Outlook, OneDrive and Teams are excluded. Brightdesk remains an independent product and uses original names, code, artwork and interface design.
