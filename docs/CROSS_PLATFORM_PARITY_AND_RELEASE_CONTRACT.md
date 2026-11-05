# Brightdesk cross-platform parity and release contract

Date: 2026-11-05

## Purpose

Brightdesk is one product ecosystem across Windows, macOS and Linux. The Suite and every individual product must share the same approved design language, product capabilities, versioned source, file behaviour, settings, update policy and support standards.

The product direction combines:

- Microsoft 365-inspired office workflows: professional documents, spreadsheets, presentations, notes, structured information, forms, lists, planning, tasks and connected workspaces.
- Adobe-inspired creative and publishing workflows: professional layout, visual assets, image and graphic editing, reusable creative resources, document production and PDF workflows.
- Brightdesk's own original product names, implementation, four-panel identity, icons, design tokens and interaction details.

These are capability and quality references, not permission to copy Microsoft or Adobe source code, proprietary assets, logos, screenshots or distinctive trade dress. The approved catalogue remains exactly Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace. Do not add Outlook, OneDrive, Teams or additional products without explicit owner approval.

## Non-negotiable parity rules

### 1. One Brightdesk design system

The machine-readable design contract and visual standard are authoritative for the Suite and all ten product repositories.

- Use the same Brightdesk shell, navigation, typography scale, spacing, icon rules, surfaces, buttons, focus states, empty states, error states and accessible interactions.
- Use the original product icon and product accent defined by the design contract everywhere that product appears.
- A product opened from the Suite and the same product opened from its individual desktop package must present the same product workspace and controls.
- A product must not receive a reduced-feature interface simply because it was installed separately or launched on a different operating system.
- Platform-specific code is limited to genuine operating-system integration: window chrome, title-bar controls, file pickers, menus, notifications, file paths, shortcut registration, signing and installer lifecycle.
- Platform conventions may change how a native action is presented, but must not remove a product capability or create a different Brightdesk design system.

### 2. One product capability set

- A feature accepted for a product is part of that product's supported capability set on Windows, macOS and Linux.
- The Suite build and the individual product build must use the same approved product implementation and shared components. They must not maintain separate feature branches or simplified fallback editors.
- Capability flags may be used for a real technical constraint only. They must be documented, tested and reported honestly; operating-system labels must not be used as a shortcut for hiding unfinished features.
- A feature is not complete until it works through the user interface, persists, survives close/reopen, handles errors and passes file-format tests where relevant.
- The feature benchmark records the Microsoft 365 and Adobe-inspired workflows expected for each of the ten products. It must distinguish implemented, in-progress and planned functionality.

### 3. One source and release train

- Use one canonical source revision and one verified dependency lock for each Brightdesk release.
- The Suite and all ten product packages must be built from that same release revision.
- Use one coordinated Brightdesk release version across the Suite, the ten products and the Windows, macOS and Linux variants. A product-specific emergency fix may use a documented patch release, but must not silently fork the shared version history.
- Each release must publish a machine-readable manifest recording product ID, product version, source commit, dependency-lock digest, operating system, architecture, installer format, minimum supported OS, release channel, file-format support and SHA-256 checksum.
- Each OS must receive the same feature release. A build is not marked current when its platform-specific artifact is missing, unverified or older than the release manifest.
- New product capabilities must land in the canonical implementation and flow into both the Suite and individual product packages. A repository source lock must verify that product repositories have not drifted from the approved source.

### 4. Same update availability and behaviour

The update experience must cover the Suite and every individual product installation.

- All supported operating systems use the same release manifest and release channel.
- The Suite receives Suite updates, including all ten included products.
- An individually installed product receives updates for that same product from the same coordinated Brightdesk release train. It must not be left on an older feature set because it was installed separately.
- Update checks must resolve the correct OS and architecture artifact. Never offer a build that is missing, incompatible or has failed verification.
- Show the same update states across platforms: checking, current, update available, downloading, ready to install, installed and actionable error.
- Use consistent user preferences and approval rules. Downloads or installation must not happen silently. Preserve the current explicit user-confirmation policy unless the owner approves a documented change.
- Keep update metadata, version comparison, checksum validation, rollback/recovery and release notes consistent across all products.
- The update service must have a real, reachable publishing provider and platform-specific signed/update metadata before any build is described as auto-updating. A button or dependency alone is not evidence of a functioning update service.

### 5. Consistent download, install, repair and uninstall

The download centre and installation experience must be the same recognisable Brightdesk experience on every operating system. Native package formats are required; one binary installer cannot safely or correctly replace the platform-specific package formats.

Current package targets:

| Operating system | Suite and individual-product package formats | Architecture baseline in current build scripts |
|---|---|---|
| Windows | NSIS .exe installer | x64 |
| macOS | .dmg, .pkg and .zip | Universal |
| Linux | AppImage and Debian .deb | x86_64 / amd64 |

The download centre must detect the operating system and offer the correct verified downloads, while allowing a user to select another supported platform. Each card must clearly identify Suite vs product, product name, version, OS, architecture, file size and checksum.

All installers must have the same user-facing sequence and safeguards where the platform supports them:

1. Clearly identify the Brightdesk product and version.
2. Present the same Terms and Conditions and require affirmative acceptance.
3. Provide understandable install progress and success/failure feedback.
4. Create the appropriate application entry and shortcuts without duplicates.
5. Preserve user documents, projects, assets and preferences during install, repair, upgrade and ordinary uninstall.
6. Provide a reliable repair/reinstall route.
7. Explain what will be removed before uninstall.

Uninstall behaviour must have the same outcome even where the operating system supplies different native mechanisms:

- Remove only the selected Brightdesk product's program files, application entries and product-specific shortcuts.
- Do not remove the Suite or other Brightdesk products when one individual product is removed.
- Do not delete shared projects, documents, creative assets or user settings by default.
- Offer separate, explicit consent before deleting user data. Make the affected data and backup consequences clear.
- Remove product-specific services, file associations, menus and shortcuts without leaving broken entries.
- Support a complete Suite removal path that still preserves user data unless the user explicitly selects data deletion.

Windows may use the signed NSIS uninstaller; macOS may use a dedicated Brightdesk removal helper or the native application-removal flow; Linux may use the package manager for DEB and the AppImage's documented removal/integration cleanup. These implementations can be native, but the policy, data-preservation outcome, confirmation language and user guidance must be equivalent. AppImage must not be described as having a package-manager uninstaller.

## Required release verification

A release must pass the complete matrix before the download centre labels it current or a GitHub Release is published.

### Build matrix

Build the Suite plus all ten individual products on native runners:

| Build target | Windows | macOS | Linux |
|---|---:|---:|---:|
| Brightdesk Office Suite | Required | Required | Required |
| Pages | Required | Required | Required |
| Sheets | Required | Required | Required |
| Decks | Required | Required | Required |
| Notes | Required | Required | Required |
| Database | Required | Required | Required |
| Forms | Required | Required | Required |
| Lists | Required | Required | Required |
| Planner | Required | Required | Required |
| To Do | Required | Required | Required |
| Workspace | Required | Required | Required |

For the current artifact target set, this produces 66 platform installer/archive outputs before legal notices and checksum manifests: one Windows package, three macOS package/archive formats and two Linux package formats for each of eleven build targets.

### Quality gates

- Node.js must match the repository's exact pinned version, currently 24.22.2.
- Verify the committed npm lockfile; do not regenerate it during release validation.
- Run dependency licence checks, the complete tests, native Rust formatting/lint/tests, type checks where configured, security audit and release preflight.
- Build each package on its native OS runner; do not use Wine, cross-OS emulation or a developer workstation as a substitute for the native release build.
- Verify expected product/version/OS/architecture names, non-empty package files, embedded terms and notices, SHA-256 manifests and release-manifest consistency.
- Install and launch the Suite and all ten individual products on each supported OS using clean test accounts or isolated test profiles.
- Exercise create, edit, save, close, reopen, export, import, update, repair and uninstall flows.
- Verify that app data survives upgrade and ordinary uninstall, and that removing one product does not damage another.
- Verify shared design tokens and real running screenshots on each OS. Concept artwork is not runtime evidence.
- Record test results by product, OS, architecture, package format, build version and commit. A skipped or unavailable platform is a blocker, not a pass.
- Sign and notarise where required. Never claim signing, notarisation or platform approval unless the produced artifact proves it.

### Update and uninstall acceptance

- Test the same release manifest against Windows, macOS and Linux update clients.
- Verify each install type receives the correct update: Suite, individual product, Windows EXE, macOS supported installer channel, Linux AppImage and Linux DEB/package-manager instructions.
- Confirm an older release can find the new release, download the correct artifact, verify its checksum and install only after user approval.
- Verify failure, cancellation, interrupted download and rollback/recovery paths.
- Test product-only and Suite uninstall on all supported operating systems, including data-retention and explicit data-deletion choices.

## Current implementation evidence and blockers (2026-11-05)

This section records source-level evidence, not a claim that a packaged desktop build has been runtime-tested.

1. The canonical main release workflow currently builds the Suite on native Windows, macOS and Linux runners. It does not, by itself, prove that all ten individual product packages build on all three OSes.
2. Draft Suite PR #15 contains a broader native-runner matrix intended to build the Suite and all ten product installers on Windows, macOS and Linux, with product artifact verification and checksum collection. It remains a draft; the latest inspected branch did not have a successful current-head three-platform build result. Do not describe all 66 outputs as verified until the workflow completes successfully.
3. The reviewed Suite and individual-product build configurations use an empty publishing-provider list. The update code checks for a configured publishing provider and reports updates unavailable when one is missing. The current updater therefore is not ready to deliver the latest release across platforms.
4. Linux .deb update guidance currently points users to their package manager or a new .deb; this is not the same automatic in-app update path used by an AppImage or a configured Windows/macOS update channel.
5. The reviewed updater settings describe Suite update controls. They do not yet establish verified update delivery for every individually installed product on all operating systems.
6. The current Suite source lock verifies thirteen feature modules across all ten product repositories: Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace. Eight entries are pinned to product `main` branches; five entries are pinned to four immutable product source-alignment PR revisions (Forms #15, Database #15, Decks #15 and Notes #15) pending their review and integration into their product `main` branches. The Suite verifies each vendored module against its exact recorded Git blob SHA. This establishes source parity for these thirteen feature modules only; it does not prove complete source-tree parity, complete UI-shell parity, or runtime/installer parity across the ten products and three operating systems.
7. The current main CI/quality workflows use a self-hosted runner. Platform release builds use separate native OS runners. The complete cross-platform release matrix must report current, successful results at the exact candidate commit.
8. A Windows NSIS uninstaller patch exists in the individual-product build work. Its existence is not proof of complete install/repair/uninstall parity across Windows, macOS and Linux.

## Release rule

Do not call Brightdesk cross-platform complete, up to date, feature-equivalent or release-ready until:

- all eleven build targets pass on all three operating systems;
- the same accepted product features and design contract are present in all builds;
- the update channel is configured and verified for Suite and individual product installs;
- install, repair, update and uninstall acceptance passes on all three operating systems; and
- the release manifest, checksums, signing status and real runtime evidence are attached to the candidate release.

The owner retains approval over public release publication. A workflow passing CI does not itself authorise publishing a release.
