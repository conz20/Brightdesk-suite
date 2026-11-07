# Brightdesk Developer Ecosystem

Status: proposed architecture; implementation is tracked separately
Verified repository inventory: 7 November 2026
Visibility: the 23 existing Brightdesk repositories are private
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

The following eleven private repositories have been confirmed to exist. Their names and responsibilities are authoritative; repository existence does not mean a reusable package or service has already been implemented or connected.

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
| [Brightdesk-Release-Tools](https://github.com/connormolloy12/Brightdesk-Release-Tools) | Release manifests, version consistency, platform artifact validation, checksums and release evidence |
| [Brightdesk-Services](https://github.com/connormolloy12/Brightdesk-Services) | Optional self-hosted device management, workspace-scoped sync APIs, user-controlled storage and background services |

**Implementation status:** the nine earlier shared repositories remain README-only bootstraps. Brightdesk-Release-Tools has its first read-only implementation under review in PR #1. Brightdesk-Services now exists as a private repository; its first device and sync service foundation is under review in [Brightdesk-Services PR #1](https://github.com/connormolloy12/Brightdesk-Services/pull/1). Neither repository is production-ready or connected to product consumers. Repository existence and documentation must not be reported as completed operational infrastructure.


### Permanent free and no-account requirement

Brightdesk is free forever. No subscriptions, paid tiers, premium features or account-based restrictions may be introduced. Brightdesk Suite and none of its ten product areas will offer or require user accounts, passwords, customer profiles, sign-up, sign-in, email registration, cloud identity or account recovery. Customers must never have to log in, create an account, enter a password or pay to use Brightdesk. The optional Services layer may support device pairing and device-scoped credentials for synchronisation, but these identify devices only, not people or customer accounts. The service-operator secret is an owner configuration credential, not an end-user login. Every product must remain fully usable locally without Services, accounts or an internet connection.

## 3A. Brightdesk-Services — initial foundation under review

**Reference reviewed:** [storytold/artcraft-services](https://github.com/storytold/artcraft-services). This is a capability reference only. Brightdesk must implement its own code, interfaces, data model, security controls and user experience. Do not copy its source, assets or implementation. Its published licence is restrictive; obtain legal review before considering any reuse. The Brightdesk implementation should be original and independently licensed.

**Repository:** [Brightdesk-Services](https://github.com/connormolloy12/Brightdesk-Services) is now confirmed as a private repository and is included in the verified count of 23 existing private repositories. Its first implementation is in [PR #1](https://github.com/connormolloy12/Brightdesk-Services/pull/1).

**Purpose:** an optional, self-hostable service layer that can support Brightdesk products without making a vendor-operated cloud, subscription, metered API or permanent internet connection mandatory.

Initial capability areas to design and implement in stages:

- **Device enrolment and administration:** optional device pairing, enrolment, revocation, device lists and device-scoped service credentials. Do not create person/customer identity, user accounts or sign-in sessions. Keep local-only use available.
- **Encrypted synchronisation:** versioned sync protocol, per-product namespaces, conflict detection/resolution, tombstones, resumable transfers and end-to-end encrypted payload handling where the server cannot read user content.
- **Storage:** user-controlled storage adapters, metadata and blob lifecycle, quotas as configurable policy rather than a commercial gate, backup/restore and integrity checks.
- **Background work:** durable job queue, retries, idempotency, cancellation, status reporting and bounded worker execution.
- **API gateway and contracts:** documented versioned HTTP/WebSocket APIs, schema validation, compatibility tests, rate limits and health/readiness endpoints.
- **Administration and deployment:** self-hosted setup, configuration validation, migrations, logs, diagnostics, backup and restore. No mandatory hosted control plane.

**Brightdesk boundaries:**

- The ten product repositories remain the source of truth for product behaviour and local data models. They integrate through stable, documented service contracts.
- Brightdesk-Engine owns shared native/core code; Brightdesk-Common-Libs owns reusable contracts/utilities. Avoid duplicating these responsibilities in Services.
- Brightdesk-AI owns models, prompts, provider adapters and AI orchestration. Services may expose a narrow integration boundary only when an explicit product workflow requires it; AI must remain optional.
- Brightdesk-Release-Tools owns release manifests and artifact verification, not runtime services.
- The Suite remains usable offline and without a Brightdesk-Services deployment. Sync and remote features should be opt-in and degrade safely when unavailable.

**Security and acceptance gates:** threat model before production endpoints; TLS in transit; strong credential hashing and scoped tokens; token rotation/revocation; secret redaction; input and resource limits; audit events without content leakage; encryption design reviewed before storing user data; migration/backup recovery tests; API compatibility tests; and integration tests against at least one real product consumer. Do not claim end-to-end encryption until key ownership, recovery and server-blindness are independently verified.

**Delivery status:** first implementation under review. PR #1 adds a Node.js 24.22.2-targeted, zero-third-party-dependency API foundation for device enrolment/listing/revocation, product scopes, workspace isolation and revision-checked opaque sync payload storage. Eleven regression tests and syntax checks passed locally on Node 22.16.0; exact Node 24.22.2 verification remains outstanding. Client-side encryption/key recovery, production database, backups, multi-process operation, security review and product integration remain unfinished. No user-account or person-identity system is planned. Do not deploy as production or connect products until the remaining gates pass.

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
  └── shared interfaces and optional services
        ├── Design-System
        ├── Fonts
        ├── Localization
        ├── Engine
        ├── Common-Libs
        ├── Common-Actions
        ├── Developer-Tools
        ├── Extensions
        ├── Wiki
        ├── Release-Tools
        └── Services (optional, self-hosted, device-scoped synchronisation)

Brightdesk-AI
  └── private, scoped engineering access to the ecosystem
```

- The Suite integrates and launches the ten products; each product remains the source of truth for its own implementation.
- Products consume shared functionality through documented, versioned interfaces. Shared repositories must not depend on product repositories.
- Brightdesk-AI can inspect and support the ecosystem through least-privilege access. It must not become a runtime dependency of customer products. Brightdesk-Services is an optional device-scoped synchronisation layer; it does not introduce customer accounts or sign-in, and products remain fully usable without it.
- Shared CI actions are non-AI infrastructure. AI-specific orchestration and automation remain in Brightdesk-AI.
- Release Tools coordinates release evidence and validation; it does not replace the Suite or product repositories as the source of versioned application code.
- Do not create direct cross-repository source copies as a substitute for package/interface integration.

## 5. Programming languages and native engine

Preserve the programming languages already present in each repository. Do not remove, replace or rewrite an existing language to standardise the ecosystem. Rust remains a supported implementation language and must remain part of the engine and relevant product/AI workflows.

Use each repository's existing toolchain, lockfiles and test commands. Pin Node.js to 24.22.2 where the repository already targets the Suite's Node runtime. Pin Rust toolchains where Rust is used. Native interfaces must have explicit compatibility tests and safe fallback behaviour where already supported.

## 6. Safe integration sequence

1. Correct and publish this canonical repository map through reviewed pull requests.
2. Update Brightdesk-AI's inventory and audit rules to recognise all ten products, the Suite, AI and all eleven shared infrastructure repositories.
3. Audit each shared repository's actual files, language, tests and package metadata before assigning implementation or extracting code.
4. Define stable package names, ownership, versioning and compatibility contracts without moving existing source yet.
5. Add contract tests to the shared interface and consuming repository before enabling each dependency.
6. Connect the ten products one at a time, retaining each product's independent build and tests.
7. Implement release-manifest and artifact-verification contracts in Release Tools, then connect the Suite/product release workflows through reviewed changes.
8. Update the Suite to consume the verified product/shared interfaces; preserve its existing product catalogue and customer experience.
9. Verify the complete graph with current-head CI, native Rust checks and non-publishing platform builds.

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

As of 7 November 2026, GitHub contains **23 private repositories**: Brightdesk Office Suite, Brightdesk-AI, ten product repositories and eleven shared infrastructure repositories.

Nine of the eleven shared repositories remain README-only. Brightdesk-Release-Tools and Brightdesk-Services have first implementation PRs under review, but neither has passed all verification gates or been connected to a product consumer. Some product repositories already contain Rust integration work and active pull requests. Their existing language choices and changes must be preserved.

This document defines the target architecture and current repository map. It does not claim that every repository is already connected, every shared package has been published, or every product has passed integration and release testing.


## Permanent customer connectivity and commercial boundary

The customer product is free forever. No subscriptions, paid tiers, billing, trials, activation fees, user accounts, sign-in, passwords, customer profiles or account recovery may be introduced. The Suite and all ten products must work locally without internet access. The only permitted customer-runtime network activity is the official update path: check for, download and install updates for the Suite and its individual products. No cloud sync, online storage, remote AI/model provider, telemetry, analytics, crash reporting, advertising, online collaboration or other network-dependent customer feature is permitted. Access to private GitHub repositories is solely an owner/developer maintenance activity and is not part of the customer experience.
