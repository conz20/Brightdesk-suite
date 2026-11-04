# Brightdesk AI maintenance system

## Purpose

Brightdesk's local AI maintenance helper is separate from the customer-facing Office Suite. It runs inside the repository's maintenance workflow and does not require the desktop apps to use AI or to connect to Brightdesk-AI.

The helper is one workstream in the wider Brightdesk development setup. The private Brightdesk-AI repository owns the provider-neutral coordinator, provider policy, provenance and Rust processing engine. The two repositories share a small Node.js provider contract, not a package or runtime dependency.

## Local AI model

GitHub Models is not used by this implementation. It does not call a paid AI inference API or require a model API key.

The helper downloads and checks two pinned files:

- llama.cpp release b10343, using its published SHA-256 checksum.
- Qwen3 0.6B GGUF from a fixed Hugging Face revision, using its published SHA-256 checksum.

The model runs on the maintenance workflow's Linux runner. Failure logs and /ai question context are sent to that local model process. A small model is useful for short explanations, but it can misunderstand code and must not be trusted to invent or apply fixes.

The local model itself has no per-request API fee. GitHub Actions runner time is separate and remains subject to the repository's GitHub usage limits and billing rules. Do not describe a private-repository workflow as cost-free unless its runner allocation has been verified.

## Shared provider contract

The adapter in `scripts/brightdesk-ai/local-qwen-provider.js` implements the same Node.js chat-model provider shape defined by Brightdesk-AI:

- `id`: `brightdesk-local-qwen`
- `model`: `brightdesk-qwen3-local`
- `adapterVersion`: `1.0.0`
- `pricingMode`: `free`
- `enabled`: false unless the caller explicitly enables it
- `generate({ taskId, task, input, model, promptTemplateVersion })`: sends the task and input to the local model and returns plain text

The maintenance response script explicitly enables this provider when its local workflow is invoked. All other callers get a disabled provider by default. The adapter uses a fixed `127.0.0.1:8080` endpoint; callers cannot override it with a remote URL, and there is no network-service fallback.

Brightdesk-AI still applies its own `policy.enabledProviders` allowlist and zero-spend checks when it coordinates providers. This Suite-side adapter is compatible with that contract; it does not import Brightdesk-AI into the Suite repository or make customer apps depend on it.

## Chat and embeddings are different

Qwen3 0.6B is a chat model. It is not an embedding model.

- Chat models implement `generate(...)`.
- Embedding models use a separate `embed(text)` contract.
- The Brightdesk-AI Rust Node-API library performs bounded source processing, provider-vector normalization, cosine similarity and deterministic ranking.
- Rust does not generate semantic embeddings or call language models.

Do not turn a chat response into a pretend embedding vector. A real embedding model can be integrated later as a separate provider.

## Included in this first foundation

- A daily maintenance workflow that checks the dependency lock, runs the existing test suite, runs release preflight and performs a deterministic configuration audit.
- A weekly call to the existing cross-platform installer workflow. It explicitly sets publish_release=false.
- A failure helper that reads failed job names and a limited, redacted end section of the workflow log, then comments on the related pull request when one exists.
- An /ai question reply for the repository owner, members and collaborators on issues and pull requests.
- A deterministic audit of the pinned Node.js version, package/lock version match, approved app catalogue, installer formats, current architecture settings and existing workflows.
- Explanations of Windows, macOS and Linux uninstall behaviour.

The helper does not change application source code. The audit currently reports configuration and version-file facts; it does not prove that an installer was installed, launched, upgraded or uninstalled. On the current main branch, the existing build-release workflow builds the Suite package; it does not yet build every standalone app. That wider build coverage is being handled separately and must be merged and tested before the weekly job can claim coverage for all ten standalone apps.

## Current platform baseline

| System | Current package target | Uninstall method |
|---|---|---|
| Windows | x64 NSIS .exe | NSIS provides a normal Windows uninstall entry |
| macOS | Universal .dmg, .pkg and .zip | Remove the application in Finder; there is no standard separate uninstaller |
| Linux | x64 .AppImage and .deb | Remove DEB with the package manager; delete an AppImage and its desktop entry |

Windows ARM64 and Linux ARM64 are not included in the checked-in build settings at this stage. The universal Mac package is intended to cover Intel and Apple silicon, but this still needs a real native test.

## Not complete yet

1. Cross-repository GitHub access. This workflow can manage only the repository in which it runs. A single account-wide controller needs a separately installed GitHub App with only the required permissions. The built-in GitHub Actions token does not automatically access the owner's other private repositories.
2. Account-wide discovery and creation of missing repositories. The connected GitHub interface cannot register a GitHub App or create repositories, so those account-level actions are not part of this branch.
3. Automatic code repairs. This first local model is too small to be trusted to write application changes. Deterministic repair routines and isolated tests must be added for each specific repair before the system is allowed to prepare those changes.
4. Full native install, launch, upgrade and uninstall smoke tests for the Suite and all ten standalone apps on Windows, macOS and Linux.
5. Customer release publishing. The source repository is private, while the current app updater expects a public no-login release feed. A separate public release repository or public download host is required before users can receive updates without signing in.
6. Automatic user-facing release installation. Brightdesk's existing update design should continue to show the available version and let the user choose when to install. The helper must never silently install an update inside a running user's app.

## Security and permissions

The helper uses read access to source and Actions data, plus issue and pull-request comment permissions. The maintainer uses actions: write only to start the existing installer workflow. It does not receive repository contents write access, secrets write access or signing credentials.

The AI instructions treat logs, issue text and pull-request content as untrusted. Common credential formats are redacted before they enter the local model prompt. Redaction is not a guarantee that every possible secret format is detected, so logs must never be treated as safe to publish. The local model is advisory only and must not be allowed to write source files, merge pull requests or publish releases.

## Scheduling and limits

The source audit runs daily. The native installer workflow is requested weekly and can also be started manually. GitHub may delay scheduled workflows during busy periods; this is not a continuously running computer and cannot guarantee an immediate response to every new problem.

Private repositories consume the included GitHub Actions minutes. The model and runtime are cached to avoid downloading them on every run, but model inference still uses runner time. The workflow does not publish a GitHub Release.

The result is best-effort automation: it can catch many known problems and explain failures, but a clean audit does not guarantee that every feature or installer is ready for customers.
