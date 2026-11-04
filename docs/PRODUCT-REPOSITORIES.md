# Brightdesk product repositories

The following table records the repository state observed during the 4 November 2026 GitHub check. Repository existence and source population are separate facts: an empty GitHub repository is not a populated product repository.

## The ten intended product repositories

| Product | GitHub repository | Product ID | Repository status |
|---|---|---|---|
| Brightdesk Pages | Brightdesk-Pages | pages | Created and populated |
| Brightdesk Sheets | Brightdesk-Sheets | sheets | Created and populated |
| Brightdesk Decks | Brightdesk-Decks | slides | Created and populated |
| Brightdesk Notes | Brightdesk-Notes | notes | Created and populated |
| Brightdesk Database | Brightdesk-Database | database | Created and populated |
| Brightdesk Forms | Brightdesk-Forms | forms | Created and populated |
| Brightdesk Lists | Brightdesk-Lists | lists | Created; empty |
| Brightdesk Planner | Brightdesk-Planner | planner | Created; empty |
| Brightdesk To Do | Brightdesk-To-Do | todo | Created; empty |
| Brightdesk Workspace | Brightdesk-Workspace | loop | Created; empty |

The six populated repositories contain product source on their default branch. The remaining four repository records exist on GitHub, but their `main` branches were empty during the check. The Brightdesk-To-Do and Brightdesk-Workspace text exports are available as source material; they must still be pushed to their corresponding remote repositories before those repositories can be described as populated.

Re-check this table before each release. Do not infer remote population from a generated local folder, a text export or a repository record with an empty branch.

## Current CI runner limitation

The suite has an open runner-allocation investigation tracked in [Brightdesk-suite issue #23](https://github.com/connormolloy12/Brightdesk-suite/issues/23). The issue records intermittent GitHub Actions jobs failing before any step executes, with no assigned runner and no usable job logs. A zero-step failure is not evidence that tests passed or that application code failed.

A proposed self-hosted Mac quality gate is tracked in [Brightdesk-suite PR #42](https://github.com/connormolloy12/Brightdesk-suite/pull/42). Treat the runner limitation as unresolved until the actual job starts and completes successfully. Verify current state and evidence for each repository rather than assuming all repositories share one runner outcome.

## Source-of-truth and population process

The shared Brightdesk Suite source is the source of truth for product code and generated product packages. Generate product folders with:

```sh
npm run repositories:prepare
```

Do not hand-edit generated product source or package manifests. Fix the suite source or generator, regenerate, and test each folder. Reuse the matching existing GitHub repository rather than creating a duplicate. For populated remotes, compare the generated folder and submit a reviewed pull request; do not overwrite or force-push the default branch. For an existing empty remote, confirm it is still empty before the initial population.

## Fixed product scope

Exactly ten approved products are included: Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace. Outlook, OneDrive and Teams are excluded.

Brightdesk is an independent product with original names, code, interface design and artwork.
