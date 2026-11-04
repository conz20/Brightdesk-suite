# Brightdesk product repository onboarding

This guide describes how to populate the Brightdesk Lists and Brightdesk Planner product repositories from the shared suite source. It follows the same generated-folder approach used for every product. The current GitHub check found repository records for both names, but their `main` branches were empty; check again before pushing because repository state can change.

This guide assumes the shared suite generator contains the approved test selection, Focus Mode correction, canonical artifact naming, product README updates and safe existing-repository instructions. Do not hand-edit generated product source or package manifests. Use an existing remote whenever it exists; never create a duplicate.

## Prerequisites

- Suite checkout on `main` with the approved changes merged.
- Node.js 24.22.2 active.
- `npm ci` completed in the suite.
- `npm test` passing in the suite.
- Permission to push to the target GitHub repositories.
- Confirmed current status of `connormolloy12/Brightdesk-Lists` and `connormolloy12/Brightdesk-Planner`.

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

Check GitHub for the exact repository name and its default branch immediately before writing.

- If the repository exists, use it. Do not create a duplicate, even when its default branch is empty.
- Only create a repository when a fresh GitHub check confirms that the exact name does not exist.
- Preserve the existing repository's visibility and default-branch settings; do not change either as part of population.
- Do not initialise a new repository with a README, `.gitignore` or licence; the generated folder already contains those files.
- Confirm whether `main` has any commits and files. An empty repository can be initialised once; any populated repository must be updated through a reviewed pull request.

## Step 4 — Prepare a safe repository update

For a populated remote repository, clone the matching remote and create a branch from its current default branch. Compare the generated folder with the existing source, then copy only the intended generated files into that branch:

```sh
git clone https://github.com/<owner>/Brightdesk-Lists.git
cd Brightdesk-Lists
git switch -c brightdesk/generated-refresh
```

Copy the generated folder contents into this checkout, inspect the complete diff, then:

```sh
git add -A
git status --short
git diff --cached --stat
git commit -m "Update Brightdesk Lists from shared suite"
git push -u origin brightdesk/generated-refresh
```

Open a pull request into the repository's existing default branch. Review the diff and CI before merging. Repeat with a distinct branch for Planner. If the existing remote has history or files, never replace its default branch directly and never force-push.

For a repository whose default branch is confirmed to have no commits and no files, first initialise that existing empty remote with the generated folder as its initial commit. Do not create a second repository. Once the initial branch exists, all later changes must use reviewed pull requests.

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
- Do not push a generated product folder before its local tests pass. For populated remotes, always use a reviewed branch and pull request.
- Do not force-push over a non-empty remote repository.
- Do not claim a repository is populated until GitHub confirms that product source is present on `main`.
- Do not claim CI passed when a job did not start or execute any steps.
