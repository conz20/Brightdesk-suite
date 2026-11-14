# Brightdesk engineering and release standard

This is the shared engineering baseline for Brightdesk Office Suite and its ten approved products. It applies before the first customer release, throughout release preparation, and after public launch. Apply the relevant parts in every Suite, product, shared-engine and engineering-support repository; do not add technologies to repositories where they do not apply.

## Approved portfolio

The customer portfolio contains exactly these ten products: Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace. Brightdesk Office Suite is the shared desktop experience for the ten products; it is not an additional product. Do not create additional customer products or duplicate product repositories. Outlook, OneDrive, Teams and other unapproved products are explicitly excluded.

Brightdesk-AI is separate, private engineering tooling. It is not a customer product or an eleventh product. Never include it in customer downloads, installers, update feeds or customer-facing features.

## Customer and service boundaries

Brightdesk is free forever. Do not introduce subscriptions, trials, paid tiers, in-product purchases, customer billing or paid feature unlocks. Do not require customer accounts, sign-in, passwords, profiles, activation codes, serial numbers or licence servers. Accepting the customer terms is not a paid activation or online licence-verification step.

Brightdesk is local-first desktop software. Customer documents, projects, assets, settings and spelling data stay on the customer's device. Do not add cloud storage, cloud synchronisation, hosted collaboration, telemetry, analytics, advertising, crash reporting, remote AI processing or customer-text/content uploads.

Internet access is limited to official Brightdesk-controlled services for Suite and product updates, and for Brightdesk-controlled language-resource discovery, download and update. Do not introduce other network services or third-party runtime dictionary downloads. The shared spelling and language-resource experience must support offline use; online discovery or updates must not make existing local resources or spelling functionality depend on a network connection.

## Brand, inspiration and third-party boundaries

Use original Brightdesk names, interface design, icons, SVGs, fonts and other artwork. Microsoft is the primary product and workflow inspiration, not a source of copied code, logos, assets or distinctive trade dress. Adobe may be referenced only for capability and workflow comparisons. Do not install, bundle, depend on, integrate with or require any Adobe application or Adobe service. The product must remain independently branded and must not imply Microsoft or Adobe affiliation.

## Source languages and toolchains

The Suite's current source tree contains JavaScript, TypeScript, Rust, HTML, CSS, shell scripts and PowerShell scripts. JSON, YAML and Markdown are also used for manifests, CI configuration and documentation; SVG is used for original vector artwork. Keep each format accurately classified: configuration and documentation formats are not programming languages.

The customer packages use the repository-pinned Node.js **24.22.2** toolchain. Rust is a first-class part of the engineering portfolio. Where Rust crates or Node-API bindings exist, validate formatting, Clippy, locked Cargo tests, native compilation and the JavaScript/native integration tests. Do not claim Rust is active in a product merely because a portfolio workflow is configured to check it.

Each product repository must keep its own evidence-based language inventory. Re-scan tracked source files and toolchain manifests as the code changes. File presence alone does not prove that code builds, is used at runtime or passes tests.

## Version compatibility and migrations

The approved runtime and build-tool versions are exact portfolio pins, not suggestions or loose minimums. Use Node.js **24.22.2**, Electron **45.2.1**, electron-builder **26.18.0** and Rust **1.99.1** where those tools apply. Keep package manifests, lockfiles, runtime selector files, development containers, build scripts and GitHub Actions aligned. A support repository that does not use Electron must not add Electron merely for consistency.

Do not bring an older implementation, API example or tutorial into a newer Brightdesk project unchanged. Check which versions it targets, then port useful work to the currently approved APIs and update its tests, configuration and documentation together. Never mix incompatible major-version APIs or use an older runtime to make a test pass.

Changing the approved baseline requires explicit owner approval and a coordinated compatibility review across the Suite, all ten products and relevant engineering repositories. Do not automatically chase upstream releases.

The detailed rules, migration checklist and read-only compatibility checks are in the [Version Compatibility Standard](VERSION_COMPATIBILITY.md). Cargo's `rust-version` field describes an MSRV floor; it is not the selected compiler. The active compiler is the version pinned by `rust-toolchain.toml` and CI.

## Required engineering practice

- Make the smallest safe change on a dedicated feature branch; do not commit routine work directly to the default branch.
- For behaviour changes, add a regression test first where practical, reproduce the issue, implement the fix and run the focused test plus the repository's full test suite.
- Use the repository's own scripts and locked dependency versions. Do not replace a failing test, weaken a security or accessibility check, skip a broken test or claim a pass without a successful run on the exact commit.
- Keep the Suite and all ten product repositories aligned on the approved product scope, original icons, visual tokens, keyboard interaction, focus visibility, reduced-motion handling and accessible controls.
- Keep dependencies current, review security advisories, verify lockfiles and third-party licence notices, and prevent credentials, private reports or personal information from entering source, logs, packages or release assets.
- Update the affected repository's README and supporting documentation whenever code, tests, UI, icons, screenshots, dependencies, configuration, packaging or release behaviour changes.

## Desktop packaging targets

The configured distribution targets are:

| Platform | Required package formats |
| --- | --- |
| Windows x64 | NSIS installer (.exe) |
| macOS universal | DMG, PKG and ZIP |
| Linux x64 | AppImage and Debian package (.deb) |

These are targets, not evidence of a completed build. The Suite and each of the ten products have six target artifacts, for 66 files across the complete release matrix. Build each platform on a matching native runner. Record the exact source commit, product version, architecture, file size and SHA-256 checksum for every artifact. A missing runner, skipped job or unverified artifact is a release blocker, not a pass.

## Installation, updates and removal

- Present the current terms and conditions and require an affirmative Accept action. Declining or closing the agreement must stop installation or prevent the product workspace from opening. Terms acceptance must not require an account, activation code or licence server.
- Verify fresh installation, upgrade, repair and removal on each supported operating system.
- Verify the expected Start Menu, desktop and application-launcher shortcuts, file associations and operating-system application registrations on the relevant platform.
- Preserve customer documents, projects, assets, default documents, settings, language preferences and spelling dictionaries during upgrades, repair and normal removal by default. Delete user data only after a clear, separate customer choice.
- Keep each product's installation and removal behaviour isolated and predictable. Removing one product must not silently remove another product, the Suite or shared customer data.
- Updates must use an official Brightdesk-controlled publisher and a verified manifest with version, platform, architecture, checksums and release metadata. Notify customers and require their confirmation before downloading or installing an update; never silently install updates.
- Do not describe an installer, updater, repair flow, uninstaller, shortcut, registration or download as available until its real behaviour has been tested.

## Screenshots and documentation accuracy

Only screenshots captured from a genuine running build may be described as product screenshots. Concept artwork, mock-ups and promotional compositions must be labelled accurately. Keep images, icons and SVGs aligned with the working interface and original Brightdesk artwork. Do not use an image of an unimplemented control or screen as proof that it works.

## First release and ongoing maintenance

The first customer release target is **0.1.0**. Before release, the Suite and all ten products must pass the same-coherent-candidate checks for source, tests, platform builds, installation, first launch, save/reopen, import/export, updates, data preservation, uninstallation, accessibility, licence and security requirements.

Engineering does not stop at 0.1.0. Continue maintaining the Suite and all ten product repositories after launch: fix defects, improve workflows, keep dependencies and toolchains current, strengthen tests, improve accessibility, maintain documentation and develop approved features. New product ideas must remain within the approved ten-product scope unless the owner changes it.

## Publication and ownership controls

Feature branches and draft pull requests are for development and review. Do not merge, publish a GitHub Release, create release tags, deploy production, make repositories public or change repository permissions, secrets, billing or runner registration without the owner's explicit approval. The owner controls the public launch and release approval. Keep development and CI within free/no-cost limits; do not enable paid services or runners.

## Related standards

- [Brightdesk visual and interaction standard](BRIGHTDESK_VISUAL_STANDARD.md)
- [Installation guidance](INSTALLATION.md)
- [Versioning](VERSIONING.md)
- [Rust engine integration](RUST_ENGINE_INTEGRATION.md)
- [Local release verification](LOCAL-RELEASE-VERIFICATION.md)
