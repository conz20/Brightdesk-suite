# Brightdesk AI maintenance system

## Purpose

Brightdesk AI is a project-maintenance helper that runs on GitHub-hosted Linux computers. It does not need the owner's Mac to be switched on. GitHub starts work when a workflow is scheduled or a repository event happens.

The first implementation is being introduced in the Brightdesk Suite repository. It is a foundation, not a claim that the entire account-wide autonomous system is finished.

## Local AI model

GitHub Models is retired, so this implementation does not call the GitHub Models API and does not use a paid AI key.

The helper downloads and checks two pinned files:

- llama.cpp release b10343, using its published SHA-256 checksum.
- Qwen3 0.6B GGUF from a fixed Hugging Face revision, using its published SHA-256 checksum.

The model runs on the GitHub Linux runner. Failure logs and /ai question context are sent to that local model process, not to a paid AI inference service. A small model is useful for short explanations, but it can misunderstand code and must not be trusted to invent fixes.

## Included in this first foundation

- A daily maintenance workflow that checks the dependency lock, runs the existing test suite, runs release preflight and performs a deterministic configuration audit.
- A weekly call to the existing cross-platform installer workflow. It explicitly sets publish_release=false.
- A failure helper that reads failed job names and a limited, redacted end section of the workflow log, then comments on the related pull request when one exists.
- An /ai question reply for the repository owner, members and collaborators on issues and pull requests.
- A deterministic audit of the pinned Node.js version, package/lock version match, approved app catalogue, installer formats, current architecture settings and existing workflows.
- Explanations of Windows, macOS and Linux uninstall behaviour.

The helper does not change application source code. The audit currently reports configuration and version-file facts; it does not prove that an installer was installed, launched, upgraded or uninstalled.

## Current platform baseline

| System | Current package target | Uninstall method |
|---|---|---|
| Windows | x64 NSIS .exe | NSIS provides a normal Windows uninstall entry |
| macOS | Universal .dmg, .pkg and .zip | Remove the application in Finder; there is no standard separate uninstaller |
| Linux | x64 .AppImage and .deb | Remove DEB with the package manager; delete an AppImage and its desktop entry |

Windows ARM64 and Linux ARM64 are not included in the checked-in build settings at this stage. The universal Mac package is intended to cover Intel and Apple silicon, but this still needs a real native test.

## Not complete yet

1. Cross-repository access. This workflow can manage only the repository in which it runs. A single account-wide controller needs a GitHub App installed on the chosen repositories with only the required permissions. The built-in GitHub Actions token does not automatically access the owner's other private repositories.
2. Account-wide discovery and creation of missing repositories. The connected GitHub interface cannot register a GitHub App or create repositories, so those account-level actions are not part of this branch.
3. Automatic code repairs. This first local model is too small to be trusted to write application changes. Deterministic repair routines and isolated tests must be added for each specific repair before the system is allowed to prepare those changes.
4. Full native install, launch, upgrade and uninstall smoke tests for the Suite and all ten standalone apps on Windows, macOS and Linux.
5. Customer release publishing. The source repository is private, while the current app updater expects a public no-login release feed. A separate public release repository or public download host is required before users can receive updates without signing in.
6. Automatic user-facing release installation. Brightdesk's existing update design should continue to show the available version and let the user choose when to install. The helper must never silently install an update inside a running user's app.

## Security and permissions

The helper uses read access to source and Actions data, plus issue and pull-request comment permissions. The maintainer uses actions: write only to start the existing installer workflow. It does not receive repository contents write access, secrets write access or signing credentials.

The AI instructions treat logs, issue text and pull-request content as untrusted. Common credential formats are redacted before they enter the local model prompt. Redaction is not a guarantee that every possible secret format is detected, so logs must never be treated as safe to publish.

## Scheduling and limits

The source audit runs daily. The native installer workflow is requested weekly and can also be started manually. GitHub may delay scheduled workflows during busy periods; this is not a continuously running computer and cannot guarantee an immediate response to every new problem.

Private repositories consume the included GitHub Actions minutes. The model and runtime are cached to avoid downloading them on every run, but model inference still uses runner time. The workflow does not publish a GitHub Release.

The result is best-effort automation: it can catch many known problems and explain failures, but a clean audit does not guarantee that every feature or installer is ready for customers.
