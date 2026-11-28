# Brightdesk contributor instructions

## Read the shared standards first

Before changing a repository, read its README and the applicable Brightdesk standards. The portfolio-wide engineering, release and product-boundary rules are in [docs/ENGINEERING_AND_RELEASE_STANDARD.md](docs/ENGINEERING_AND_RELEASE_STANDARD.md); exact toolchain and migration rules are in [docs/VERSION_COMPATIBILITY.md](docs/VERSION_COMPATIBILITY.md). Apply the current approved versions and product requirements, not older instructions copied from previous projects.

## Runtime

Use exactly Node.js **24.22.2 LTS**. Do not change the pinned runtime in package.json, .nvmrc, .node-version, .npmrc, the dev container or GitHub Actions without explicit project-owner approval.

## Version compatibility

Also pin Electron **45.2.1**, electron-builder **26.18.0** and Rust **1.99.1** wherever those tools apply. Keep manifests, lockfiles, runtime selector files, development containers, build scripts and CI workflows aligned.

Do not reuse older-version code or API guidance unchanged. Port required work to the currently approved API, then update tests, configuration and documentation. Do not mix old/new major-version APIs or run tests with an older runtime to force a pass. Changing the baseline requires explicit owner approval.

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
