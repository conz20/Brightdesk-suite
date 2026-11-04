# Brightdesk product repository onboarding

This guide describes how to populate the Brightdesk Lists and Brightdesk Planner product repositories from the shared suite source. It follows the same generated-folder approach used for every product. The current GitHub check found repository records for both names, but their `main` branches were empty; check again before pushing because repository state can change.

This guide assumes the shared suite generator contains the approved test selection, Focus Mode correction, canonical artifact naming and product README updates. Do not hand-edit generated product source or package manifests.

## Prerequisites

- Suite checkout on `main` with the approved changes merged.
- Node.js 24.22.2 active.
- `npm ci` completed in the suite.
- `npm test` passing in the suite.
- Permission to push to the target GitHub repositories.
- Confirmed status of `connormolloy12/Brightdesk-Lists` and `connormolloy12/Brightdesk-Planner`.

## Step 1 — Generate the product folders

In the suite:

```sh
npm run repositories:prepare
```

This prepares all ten product folders under `release/product-repository-folders/`. Confirm these folders exist:

```text
release/product-repository-folders/Brightdesk-Lists/
release/product-repository-folders/Brightdesk-Planner/
```

## Step 2 — Verify each generated folder before pushing

Run in each target folder:

```sh
npm ci
npm test
node -e "const p=require('./package.json'); console.log(p.name); console.log(p.brightdeskAppId); console.log(p.build.appId); console.log(p.desktopName); console.log(p.build.win.artifactName); console.log(p.build.appImage);"
```

Expected for Brightdesk Lists:

- `name`: `brightdesk-lists`
- `brightdeskAppId`: `lists`
- `build.appId`: `org.brightdesk.lists`
- `desktopName`: `org.brightdesk.lists.desktop`
- `build.win.artifactName`: `Brightdesk-Lists-${version}-${arch}.${ext}`
- `build.appImage`: `undefined`

Expected for Brightdesk Planner: the same shape with `planner`, `Planner` and `org.brightdesk.planner.desktop`.

Confirm each generated folder contains:

- `.github/workflows/product-installers.yml`
- `.github/dependabot.yml`
- `README.md` and `REPOSITORY_INFO.md`
- `assets/brightdesk-product.svg` and `assets/social-preview.svg`
- `package.json` and `package-lock.json`
- `src/`, `scripts/`, `tests/`, `rust/`, `installer/` and `assets/branding/`
- `LICENSE`, `TERMS_AND_CONDITIONS.txt` and `THIRD_PARTY_NOTICES.md`
- `PRODUCT_SCOPE_LOCK.md`, `PROJECT_MEMORY.md` and `AGENTS.md`
- `electron-builder.app.config.js`

If any expected file is missing, stop and fix the suite generator before pushing.

## Step 3 — Confirm the GitHub repository

Check GitHub for the exact repository name and its default branch.

- If the repository already exists and is empty, use that repository. Do not create a duplicate.
- If it does not exist, create `Brightdesk-Lists` or `Brightdesk-Planner` using the exact case.
- Choose visibility at creation time; do not encode visibility in the generated folder.
- Do not initialise a new repository with a README, `.gitignore` or licence; the generated folder already contains its own files.
- Use `main` as the default branch.

## Step 4 — Push the generated folder

For an existing empty remote repository, from inside the generated folder:

```sh
git init
git checkout -b main
git add -A
git commit -m "Initial Brightdesk Lists product repository"
git remote add origin https://github.com/<owner>/Brightdesk-Lists.git
git push -u origin main
```

For Planner, use the matching repository URL and commit message. If a local Git repository already exists, inspect its remotes and history instead of reinitialising it.

If the remote is not empty, stop and compare its history before pushing. Do not force-push or overwrite existing source.

Confirm the pushed repository shows:

- README rendered.
- Product and social-preview artwork present.
- `.github/workflows/product-installers.yml` present.
- Actions workflow permissions and token permissions are reviewed; grant only the access required by the workflow.

## Step 5 — Verify CI on the new or populated repository

The product test job must execute on `main` and pass. A workflow that fails before any job step starts, including a `runner_id: 0` event, is blocked rather than a code failure or a test pass.

Do not approve a release from a repository whose required product tests have never actually run. Build and publish jobs remain workflow-dispatch-gated; publication must remain a separate owner-approved action.

## Step 6 — Update suite documentation

After GitHub confirms that the source is on `main`, update `docs/PRODUCT-REPOSITORIES.md` with the observed status:

```text
| Brightdesk Lists | Brightdesk-Lists | lists | Created and populated |
| Brightdesk Planner | Brightdesk-Planner | planner | Created and populated |
```

Remove any statement that these repositories are not created. Keep the CI runner limitation note while it remains accurate.

## Step 7 — Add the products to release QA

Add Lists and Planner to the per-product release gate only after their generated folders have passed tests and their first product installers have been built and verified. Complete the platform manual QA before approving a release.

## Step 8 — Prepare release notes

Use the first-post-fix release-notes template maintained with the release documentation. Include the actual advisory result from `npm audit --json`, the final artifact names, and the shared-engine trade-off. State explicitly that new repositories have no historical installer filename migration.

## Do not

- Do not edit generated product folders after `repositories:prepare`; those edits will be lost on regeneration.
- Do not copy product folders between each other.
- Do not push a generated product folder before its local tests pass.
- Do not force-push over a non-empty remote repository.
- Do not claim a repository is populated until GitHub confirms that product source is present on `main`.
- Do not claim CI passed when a job did not start or execute any steps.
