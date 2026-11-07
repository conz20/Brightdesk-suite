# Brightdesk Developer Ecosystem

Status: proposed architecture; implementation is tracked separately
Verified repository inventory: 7 November 2026
Visibility: the 21 existing Brightdesk repositories are private
Compatibility rule: preserve each repository's existing implementation and programming languages, including Rust.

## 1. Customer product repositories

Each of the ten products has its own source-of-truth repository:

| Product | Repository |
|---|---|
| Pages | [Brightdesk-Pages](https://github.com/connormolloy12/Brightdesk-Pages) |
| Sheets | [Brightdesk-Sheets](https://github.com/connormolloy12/Brightdesk-Sheets) |
| Decks | [Brightdesk-Decks](https://github.com/connormolloy12/Brightdesk-Decks) |
| Notes | [Brightdesk-Notes](https://github.com/connormolloy12/Brightdesk-Notes) |
| Database | [Brightdesk-Database](https://github.com/connormolloy12/Brightdesk-Database) |
| Forms | [Brightdesk-Forms](https://github.com/connormolloy12/Brightdesk-Forms) |
| Lists | [Brightdesk-Lists](https://github.com/connormolloy12/Brightdesk-Lists) |
| Planner | [Brightdesk-Planner](https://github.com/connormolloy12/Brightdesk-Planner) |
| To Do | [Brightdesk-To-Do](https://github.com/connormolloy12/Brightdesk-To-Do) |
| Workspace | [Brightdesk-Workspace](https://github.com/connormolloy12/Brightdesk-Workspace) |

The ten repositories remain independently buildable and maintain their own product code, tests, documentation and release evidence.

## 2. Suite and AI responsibilities

- [Brightdesk-suite](https://github.com/connormolloy12/Brightdesk-suite) owns the customer desktop shell, product catalogue, navigation, first-run experience, integrated product packaging, and customer-facing launch, update and removal surfaces. It coordinates the ten products without replacing their source repositories.
- [Brightdesk-AI](https://github.com/connormolloy12/Brightdesk-AI) is the private engineering control plane for repository inventory, AI-assisted analysis, planning, evaluations and approved development automation. It is not shipped to customers and is not required for ordinary product use.

AI implementation, prompts, model/provider adapters, agent workflows, AI-specific tests and AI credentials belong in Brightdesk-AI. Product repositories may expose a small documented integration boundary only where a product feature explicitly requires it. Customer software must continue working if Brightdesk-AI is unavailable.

## 3. Existing shared infrastructure repositories

The following nine private repositories have been confirmed to exist. Their names and responsibilities are authoritative; repository existence does not mean a reusable package or service has already been implemented or connected.

| Repository | Intended ownership |
|---|---|
| [Brightdesk-Design-System](https://github.com/connormolloy12/Brightdesk-Design-System) | Shared design tokens, original components, themes, icon rules and accessibility primitives |
| [Brightdesk-Fonts](https://github.com/connormolloy12/Brightdesk-Fonts) | Font catalogue, metadata, licence records, previews and typography integration |
| [Brightdesk-Localization](https://github.com/connormolloy12/Brightdesk-Localization) | Translation catalogues, locale rules, regional formats and language resources |
| [Brightdesk-Engine](https://github.com/connormolloy12/Brightdesk-Engine) | Shared native/core capabilities, Rust implementation and stable Node-API boundary |
| [Brightdesk-Common-Libs](https://github.com/connormolloy12/Brightdesk-Common-Libs) | Reusable language-specific contracts, validation, configuration, logging, IPC schemas and utilities |
| [Brightdesk-Common-Actions](https://github.com/connormolloy12/Brightdesk-Common-Actions) | Reusable non-AI CI workflows and GitHub Actions |
| [Brightdesk-Developer-Tools](https://github.com/connormolloy12/Brightdesk-Developer-Tools) | SDKs, command-line tools, templates and developer utilities |
| [Brightdesk-Extensions](https://github.com/connormolloy12/Brightdesk-Extensions) | Extension manifests, permissions, lifecycle contracts, SDK and compatibility tests |
| [Brightdesk-Wiki](https://github.com/connormolloy12/Brightdesk-Wiki) | Central technical documentation, developer guides, architecture and product knowledge |

[Brightdesk-Release-Tools](https://github.com/connormolloy12/Brightdesk-Release-Tools) is the one planned shared repository still awaiting creation. Until then, release tooling stays in its current repositories; do not block other work on its creation.

## 4. Dependency and connection rules

```text
Brightdesk Office Suite
  ├── Brightdesk-Pages
  ├── Brightdesk-Sheets
  ├── Brightdesk-Decks
  ├── Brightdesk-Notes
  ├── Brightdesk-Database
  ├── Brightdesk-Forms
  ├── Brightdesk-Lists
  ├── Brightdesk-Planner
  ├── Brightdesk-To-Do
  ├── Brightdesk-Workspace
  └── versioned shared interfaces/packages
        ├── Design-System
        ├── Fonts
        ├── Localization
        ├── Engine
        ├── Common-Libs
        ├── Common-Actions
        ├── Developer-Tools
        ├── Extensions
        └── Wiki

Brightdesk-AI
  └── private, scoped engineering access to the ecosystem
```

- The Suite integrates and launches the ten products; each product remains the source of truth for its own implementation.
- Products consume shared functionality through documented, versioned interfaces. Shared repositories must not depend on product repositories.
- Brightdesk-AI can inspect and support the ecosystem through least-privilege access. It must not become a runtime dependency of customer products.
- Shared CI actions are non-AI infrastructure. AI-specific orchestration and automation remain in Brightdesk-AI.
- Do not create direct cross-repository source copies as a substitute for package/interface integration.

## 5. Programming languages and native engine

Preserve the programming languages already present in each repository. Do not remove, replace or rewrite an existing language to standardise the ecosystem. Rust remains a supported implementation language and must remain part of the engine and relevant product/AI workflows.

Use each repository's existing toolchain, lockfiles and test commands. Pin Node.js to 24.22.2 where the repository already targets the Suite's Node runtime. Pin Rust toolchains where Rust is used. Native interfaces must have explicit compatibility tests and safe fallback behaviour where already supported.

## 6. Safe integration sequence

1. Correct and publish this canonical repository map through reviewed pull requests.
2. Update Brightdesk-AI's inventory and audit rules to recognise all ten products, the Suite, AI and the nine shared repositories.
3. Audit each shared repository's actual files, language, tests and package metadata before assigning implementation or extracting code.
4. Define stable package names, ownership, versioning and compatibility contracts without moving existing source yet.
5. Add contract tests to the shared interface and consuming repository before enabling each dependency.
6. Connect the ten products one at a time, retaining each product's independent build and tests.
7. Update the Suite to consume the verified product/shared interfaces; preserve its existing product catalogue and customer experience.
8. Verify the complete graph with current-head CI, native Rust checks and non-publishing platform builds.

## 7. Safety, security and release gates

- Work in feature branches and submit pull requests; do not push integration work directly to main.
- Never delete or rewrite existing product source during extraction until the replacement is integrated and independently verified.
- Keep private repositories private and use least-privilege credentials; never commit tokens or secrets.
- Review third-party licences and notices before reusing any code or assets.
- Do not introduce paid services, paid runners or metered APIs without separate approval.
- Do not automatically merge, publish installers or create public releases. Owner approval remains required.
- A queued, cancelled, skipped, stale or inaccessible check is not a passing check.
- Report repository existence, source implementation, package publication, dependency integration and runtime verification as separate statuses.

## 8. Verified baseline and limitations

As of 7 November 2026, GitHub contains 21 private repositories: the Suite, Brightdesk-AI, ten product repositories and nine shared infrastructure repositories. The separate Brightdesk-Release-Tools repository is still pending.

The nine shared repositories currently have basic README descriptions; this inspection has not established that their intended packages or services are implemented. Some product repositories already contain Rust integration work and active pull requests. Their existing language choices and changes must be preserved.

This document defines the target architecture and current repository map. It does not claim that every repository is already connected, every shared package has been published, or every product has passed integration and release testing.
