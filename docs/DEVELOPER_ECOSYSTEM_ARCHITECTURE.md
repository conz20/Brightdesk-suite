# Brightdesk Developer Ecosystem

Status: architecture and repository bootstrap plan  
Visibility: private for every repository  
Implementation rule: original Brightdesk code and assets; no copied project source without a compatible licence review.

## 1. Product repositories

Each customer product has one source-of-truth repository:

- `Brightdesk-Pages`
- `Brightdesk-Sheets`
- `Brightdesk-Decks`
- `Brightdesk-Notes`
- `Brightdesk-Database`
- `Brightdesk-Forms`
- `Brightdesk-Lists`
- `Brightdesk-Planner`
- `Brightdesk-To-Do`
- `Brightdesk-Workspace`

The `Brightdesk-suite` repository owns the desktop shell, product catalogue, navigation, first-run experience, installer integration, and cross-product launch/update/uninstall surfaces. It should consume versioned product packages rather than becoming a second source tree for each product.

## 2. Shared component repositories to create

These are separate private repositories. They are not created yet; create them before moving source out of existing repositories.

| Repository | Owns | Must not own |
|---|---|---|
| `Brightdesk-Engine` | Original Rust core, Node-API boundary, shared data and document primitives, stable native interfaces | AI models, prompts, agent workflows |
| `Brightdesk-UI` | Original design tokens, component library, accessibility primitives, icon system, themes | Product-specific screens or AI logic |
| `Brightdesk-Common` | Shared TypeScript/JavaScript contracts, validation, logging, configuration, IPC schemas and small utilities | Product features or AI runtime |
| `Brightdesk-Localization` | Translation catalogues, locale rules, language selection and validation tooling | AI translation services |
| `Brightdesk-Extensions` | Extension manifest, permission model, lifecycle hooks, SDK and compatibility tests | AI agents or model integrations |
| `Brightdesk-Fonts` | Font metadata/catalogue, licensing records, preview service and font integration helpers | Unlicensed font binaries |
| `Brightdesk-Documentation` | Product guides, developer documentation, help centre and versioned documentation site | AI-generated content pipeline |
| `Brightdesk-DevOps` | Reusable non-AI GitHub Actions, release packaging helpers, signing/notarization checklists and CI templates | AI agent orchestration or secrets |
| `Brightdesk-Status` | Read-only release/service status page and status data model | AI incident agents |

## 3. AI-only boundary

All AI-related implementation belongs in the private `Brightdesk-AI` repository:

- model/provider adapters and model configuration
- prompts, agent definitions, planning and orchestration
- AI-assisted code review and repository analysis
- autonomous maintenance and scheduled repository audits
- AI release-readiness analysis and recommendations
- AI skills, evaluation datasets, safety policies and AI-specific tests
- AI service credentials and private integration workflows

Product repositories may contain only a small, documented integration interface when a product explicitly needs to call a Brightdesk-AI service. They must not contain model weights, prompts, agent code, provider credentials, autonomous workflows, or AI service dependencies required for ordinary product operation. The suite and products must continue to work when Brightdesk-AI is unavailable.

## 4. Dependency direction

```text
Brightdesk-Suite
  ├── ten product repositories
  ├── Brightdesk-UI
  ├── Brightdesk-Common
  ├── Brightdesk-Engine
  ├── Brightdesk-Localization
  ├── Brightdesk-Extensions
  └── Brightdesk-Fonts

Brightdesk-Documentation  (documents all supported releases)
Brightdesk-DevOps          (reusable non-AI CI/release workflows)
Brightdesk-Status          (release/service status)

Brightdesk-AI              (private control plane; separate from installers)
  ├── repository audit and maintenance agents
  ├── AI code review and planning
  ├── model/provider integrations
  └── AI evaluations and safety checks
```

Shared libraries must not depend on product repositories. Products may depend on released shared-library versions. Brightdesk-AI may inspect repositories through scoped credentials, but product builds must never require Brightdesk-AI.

## 5. Required baseline in every repository

- Private visibility and least-privilege access
- README with purpose, supported features, exclusions and setup steps
- `LICENSE` and third-party notices reviewed before release
- Node.js version pinned to the suite's supported Node 24 line where applicable
- Rust toolchain pinned where Rust is used
- lockfiles committed; generated output, caches and secrets ignored
- unit tests plus integration/contract tests for public interfaces
- format, lint, type-check, test, dependency/license and security checks
- platform build checks appropriate to the repository
- release notes and versioned releases
- CODEOWNERS, issue templates and pull-request template
- no automatic public release or installer publication without owner approval

## 6. Migration and implementation order

1. Stabilise repository inventory and CI in Brightdesk-AI; keep all AI implementation there.
2. Create the nine shared private repositories listed above.
3. Establish package names, versioning, ownership, compatibility policy and release process.
4. Extract shared code only after tests prove the source and destination behave identically.
5. Migrate the suite to consume released packages; remove duplicate product source snapshots only after verified replacements exist.
6. Add conformance tests so all ten products use the same UI, accessibility, IPC, localization, installer and security contracts.
7. Complete a feature-by-feature gap audit for every product and implement missing first-release requirements in that product's own repository.
8. Verify Windows, macOS and Linux packaging before any public release.

## 7. Safety rules for the migration

- Do not delete or rewrite existing product source during extraction.
- Do not change customer-facing product behaviour as part of repository moves.
- Do not copy Storytold implementation code; use it as architectural reference only and independently implement Brightdesk equivalents.
- Check the source repository's licence and attribution requirements before reusing any code or assets.
- Keep credentials out of Git history and logs.
- Keep AI code and AI-specific workflows exclusively in Brightdesk-AI.
- Keep release publication behind explicit owner approval.

## 8. Current verified baseline

The owner account currently has separate private repositories for the Suite, Brightdesk-AI and all ten products. The nine shared component repositories above are the remaining repository-creation work. This document is a plan, not evidence that those repositories or extracted packages already exist.
