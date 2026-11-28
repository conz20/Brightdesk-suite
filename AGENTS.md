# Brightdesk contributor instructions

## Read the shared standards first

Before changing a repository, read its README and the applicable Brightdesk standards. The portfolio-wide engineering, release and product-boundary rules are in [docs/ENGINEERING_AND_RELEASE_STANDARD.md](docs/ENGINEERING_AND_RELEASE_STANDARD.md); exact toolchain and migration rules are in [docs/VERSION_COMPATIBILITY.md](docs/VERSION_COMPATIBILITY.md). Apply the current approved versions and product requirements, not older instructions copied from previous projects.

## Runtime and dependency updates

Before every planned runtime, framework, toolchain or dependency update, check the official upstream source for the newest stable release, current security advisories and support status. Prefer the newest stable version that passes the required Brightdesk compatibility checks. Keep exact tested pins and documented exceptions in [docs/VERSION_COMPATIBILITY.md](docs/VERSION_COMPATIBILITY.md); do not duplicate stale fixed version numbers here.

A newer major runtime is a separate compatibility candidate. Keep manifests, lockfiles, runtime selector files, development containers, build scripts, installer configuration and CI aligned with the selected version. Do not add technologies that a repository does not use.

Do not reuse older-version code or API guidance unchanged. Port useful work to the currently supported APIs, then update tests, configuration and documentation. Do not mix incompatible major-version APIs or run tests with an older runtime to force a pass.

If a candidate is incompatible or causes a regression, revert only that component to its previous stable compatible version, record the evidence and retry condition, and continue unrelated work. Do not globally downgrade or stop the full task because one component fails.

Follow [docs/VERSION_COMPATIBILITY.md](docs/VERSION_COMPATIBILITY.md) for the complete cross-repository policy and migration checks.

## Product scope

Keep the approved ten-product catalogue unchanged:
- Pages
- Sheets
- Decks
- Notes
- Database
- Forms
- Lists
- Planner
- To Do
- Workspace

Brightdesk Office Suite is the shared desktop experience, not an additional product. Brightdesk-AI is private engineering tooling, not a customer product. Do not add Outlook, OneDrive, Teams or any other unapproved product.

All ten product modules are integrated into the main Suite. Keep availability and implementation claims accurate; integration does not mean final acceptance, accessibility, persistence, installer or cross-platform verification is complete.

## Ownership, collaboration and repository safety

- The Brightdesk project owner controls access. Do not add, invite or grant a collaborator access to any repository unless the owner explicitly approves that person and the specific repository.
- Grant the least permission needed for the agreed work. Review access periodically and remove access when it is no longer needed; do not broaden permissions across the portfolio by default.
- Keep work on branches and submit pull requests for review. Do not bypass required checks or merge your own changes unless the owner has explicitly authorised that action.
- Treat CODEOWNERS as a review-routing file, not as a substitute for GitHub branch protection. Configure default-branch protections and required checks in GitHub repository settings where available; record any plan or integration limitation rather than claiming protection is active.
- Never put secrets, access tokens, private reports, personal names, private email addresses or other identifying information in source files, issues, pull requests, logs, public metadata or release assets.
- Follow the repository's root SECURITY.md for private vulnerability reporting. Do not publish exploitable details in public issues.

## Product and service boundaries

Brightdesk is free forever. Do not introduce subscriptions, trials, paid tiers, billing, customer accounts, sign-in, passwords, profiles, activation codes, serial numbers or licence servers.

Do not add telemetry, analytics, advertising, crash reporting, cloud storage, cloud sync, hosted collaboration, remote AI processing or customer-content uploads. Internet access is limited to official Brightdesk product updates and Brightdesk-controlled language-resource discovery, downloads and updates. Do not add third-party runtime dictionary downloads.

Use original Brightdesk names and artwork. Do not add Adobe applications, services, dependencies or integrations. Do not copy Microsoft, Adobe or other third-party logos, code, assets or distinctive trade dress.

## Development quality

Add or update tests for behavioral changes. Run the repository's focused tests and full test suite whenever the available environment permits. Never claim tests or builds passed unless they were actually run successfully. Update the README and affected documentation when implementation, requirements or release readiness changes.

## Release safety and cost

Do not claim an installer is ready until its platform build, legal files, checksum verification and release tests have passed. Do not publish a GitHub Release unless the project owner explicitly selects the publish option. Keep development and CI workflows within free/no-cost limits; never request payment details or enable paid services.


## Version update policy
Before dependency/toolchain updates, check the upstream official source for the newest stable release. Prefer the newest compatible stable version, then run the relevant tests/builds. If a candidate breaks compatibility, roll back only that component, document the evidence and continue unrelated updates. Never globally downgrade or stop the whole task because one component is incompatible. Keep archived versions only as history or explicit compatibility exceptions. Follow docs/VERSION_COMPATIBILITY.md.
