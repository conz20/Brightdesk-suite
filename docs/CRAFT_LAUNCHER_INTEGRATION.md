# Craft Launcher experience inside Brightdesk Suite

**Status:** implementation specification; no runtime behaviour changed by this document  
**Target:** Brightdesk Suite 0.1.0 and later maintenance releases  
**Reference:** [Craft Launcher](https://github.com/storytold/craft-launcher)  
**Brightdesk source of truth:** this repository's current `main` branch

## Decision

Bring the useful launcher experience demonstrated by Craft Launcher into **Brightdesk Suite itself**. Brightdesk remains one complete customer-facing desktop Suite with an integrated launcher and exactly ten products. Do not create a separate Brightdesk Launcher customer app, an eleventh product, or a replacement Suite.

Use Craft Launcher as a capability reference, not as code, branding, artwork, or UI to copy. Keep Brightdesk's original identity, product interfaces, Home design and existing engineering foundations.

## Preserve the existing Brightdesk work

The integration must retain:

- The ten approved products: Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace.
- The existing Home, Apps and Files navigation and approved Brightdesk Home artwork.
- Existing product windows, local document storage, shared native engine, font and language work, licensing, security, tests, packaging and release automation.
- Independent product repositories as the source of truth for product implementations.
- Existing standalone product build and installer work, including platform-specific acceptance requirements.
- The existing free-forever, local-first and privacy boundaries.

Do not delete, flatten, replace, or rewrite product or shared repository source to make the Suite repository appear smaller. Repository consolidation is a separate lossless migration and may remove a snapshot only after a file-by-file reconciliation and parity proof.

## Sidebar and navigation boundary

The existing sidebar is part of the approved Brightdesk experience and must remain intact:

- Keep **Home**, **Apps** and **Files** in their current order and retain their existing icons, visual treatment and behaviour.
- Keep the contextual **Switch product** navigation that appears while working inside a product workspace.
- Do not add separate sidebar destinations for Launcher, Installer, Uninstaller or Updater.
- Put the new catalogue, standalone installation status and Install / Update / Uninstall actions inside the existing **Apps** screen. Keep Home as the ten-product starting view and Files as the local file-access destination.
- Keep Suite membership controls separate from standalone OS installation controls. Adding or removing a workspace from the Suite must not install or uninstall the standalone application.

## Important state distinction

The current Suite has an integrated product catalogue and a saved selection of which products appear inside the Suite. It also has native launch routing for separately installed product applications. These are useful foundations, but they are not the same as a verified operating-system installation manager.

The interface and internal model must keep these states separate:

| State | Meaning |
| --- | --- |
| Available | A supported Brightdesk product and compatible release exist in the trusted catalogue. |
| In Suite | The product workspace is enabled in the integrated Suite experience. |
| Installed | A verified standalone product package is installed and registered with the operating system. |
| Running | The product currently has an active process or Suite-managed window. |
| Update available | A trusted, compatible newer version exists than the installed version. |
| Downloaded and verified | The selected package has been downloaded and its SHA-256 digest has been checked against the trusted manifest. |

**Never label “In Suite” as “Installed”.** Removing a product from the Suite must not uninstall its standalone application. Uninstalling a standalone application must not delete its documents or silently remove its integrated workspace.

## Launcher experience to add

### 1. One product catalogue

Provide one central catalogue for all ten products, using the original Brightdesk product names, icons and descriptions. Support a clear card view and a compact list/table view, with search and useful filters.

Each product entry should show only verified information: product name, installed version, latest compatible version, platform/architecture compatibility, installation state and update state. Do not invent version or installation status when discovery is incomplete.

### 2. Product actions

Offer the correct action for the current state:

- **Open** — launch an installed standalone app or open its integrated Suite workspace.
- **Add to Suite / Remove from Suite** — change only the integrated Suite selection.
- **Install** — download and install a compatible standalone package after explicit user confirmation.
- **Update** — show the version change and let the user review it before installing.
- **Uninstall** — invoke the appropriate platform-native removal flow after confirmation; preserve user documents and settings.
- **Retry / Details** — explain failed discovery, download, checksum, install or update steps without hiding the error.

Do not present a fake Install or Uninstall action when only the integrated Suite selection is changing.

### 3. Trusted release and package handling

Use a Brightdesk-controlled release manifest as the source of package metadata. Each package record must identify the product, release version, operating system, architecture, package format, filename, download location, file size where available and SHA-256 digest.

- Resolve only approved Brightdesk release locations.
- Select packages by the current operating system and architecture; never guess or silently substitute an incompatible build.
- Download to a temporary staging location, verify the complete SHA-256 digest, and only then offer the package to the platform installer.
- Reject missing, malformed, mismatched, untrusted or unsupported manifest entries and packages.
- Show progress and useful failure/retry information.
- Keep manual update checks available. Automatic installation is prohibited; installing an update always requires an explicit user action.
- Do not run downloaded package content inside the Suite renderer or bypass operating-system installer protections.

### 4. Platform-aware lifecycle

Implement platform adapters separately for Windows, macOS and Linux. Use native package/install/uninstall conventions and verified OS discovery. Do not assume that a shortcut, desktop entry, bundle identifier or Suite selection alone proves an installation is healthy.

The Suite should still open already-installed products when offline. Catalogue browsing, release checks and package downloads may require an internet connection to official Brightdesk-controlled endpoints. No third-party download catalogue or runtime dependency is introduced.

### 5. One Brightdesk settings and update experience

Keep product management within the existing Suite navigation. Share the trusted release catalogue and update preferences across the Suite and product experiences where the current architecture supports it. Do not create a second settings system or duplicate product registry.

## Architecture boundaries

- **Brightdesk-suite:** customer desktop shell, launcher UI, product catalogue, installation/update coordination, platform adapters, shared Suite navigation and combined release orchestration.
- **Ten product repositories:** product source, product-specific tests, standalone product builds and product documentation.
- **Shared repositories:** reusable capabilities behind documented, versioned and tested interfaces. Do not assume a README-only repository already contains an operational package.
- **Brightdesk-AI:** internal engineering tooling only; never a customer product or runtime dependency.
- **Brightdesk-Wiki:** separate online help; not embedded as another product.

Do not introduce paid services, paid runners, telemetry, advertising, analytics, crash reporting, customer accounts, cloud sync, collaboration services, remote AI or customer document/text uploads.

## Product-repository release prerequisite

The ten standalone products have separate source repositories. The launcher must use those repositories as the source of truth; it must not silently treat copies inside Brightdesk Suite as the authoritative product source.

The repository audit found:

- All ten product repositories exist and use `main` as their default branch.
- Brightdesk Notes and Brightdesk Lists are private; the other eight product repositories are public.
- None of the ten product repositories currently has a published GitHub Release containing installable product packages.
- Brightdesk Pages already has a GitHub-hosted controller that checks out the product repositories and builds/verifies Windows, macOS and Linux packages. It does not publish those packages.
- Brightdesk Suite's current release workflow still builds the standalone product variants from the Suite checkout. It does not yet build each product from a pinned commit of its own repository.
- Several product-repository workflows still contain self-hosted runner references. Those paths must not be used for production builds, release publishing or updates.

Required release path before enabling customer Install or Update actions:

1. Check out the exact approved commit from each product repository using a short-lived, read-only GitHub App token. Record the repository and commit SHA used for each product build.
2. Build each standalone product on GitHub-hosted Windows, macOS and Linux runners. No self-hosted runner or personal MacBook may be required.
3. Verify all ten products' six package formats, plus the six Suite packages, before release publication.
4. Publish the verified packages and the signed-off manifest to the public Brightdesk Suite release location. This allows Notes and Lists to remain private source repositories while their approved customer installers are publicly downloadable.
5. Keep release publication behind the existing explicit owner approval gate. Building and verifying packages must never publish them automatically.

Until this path produces a complete, verified release manifest, the Suite must show that standalone installation is unavailable rather than inventing an installed state or offering a broken download.

## Implementation sequence and gates

1. **Audit current main:** trace the existing catalogue, Suite selection, product launch routing, product windows, update policy, release packaging and all consumers before changing behaviour.
2. **Reconcile earlier launcher work:** inspect prior launcher branches and pull requests as research only. Do not merge them wholesale when they are substantially behind current main or contain superseded workflow, runtime, visual, security or release assumptions.
3. **Define and test the state model:** add tests first for the distinction between In Suite, installed, running, available and update available; cover all ten product IDs and invalid/unknown states.
4. **Define and test the release manifest:** validate product IDs, version formats, platform/architecture/package compatibility, approved download origins and SHA-256 values.
5. **Implement the lifecycle services:** add isolated discovery, download/staging, checksum verification, install/update handoff and uninstall adapters. Keep platform-specific code out of the renderer.
6. **Integrate the existing Apps screen:** add accurate status and actions without changing the approved Home design or existing product workspace behaviour.
7. **Verify all three platforms:** run the repository's full test and quality gates, then platform-native install, launch, update, uninstall and data-preservation tests on GitHub-hosted automation. A skipped, stale, cancelled or inaccessible check is not a pass.
8. **Release gate:** no installer publication, release tag, merge to main or automatic installation without the existing owner-approval requirements.

## Acceptance criteria

- The customer sees one Brightdesk Suite, not a separate launcher product.
- The catalogue contains exactly the ten approved products.
- Every displayed install/update state is based on verified evidence, not Suite selection or guessed filesystem paths.
- A user can add/remove a workspace from the Suite without installing or uninstalling its standalone application.
- A user can install, open, update and uninstall supported standalone apps using the correct platform flow.
- Every downloaded package is checked against the trusted manifest before installation.
- Updates require an explicit user action; no automatic installation occurs.
- Uninstall preserves user documents and settings unless the user separately chooses to remove them through a clearly explained action.
- Existing Suite features, product repositories, shared engine, licences, security, fonts, languages, tests and release work remain intact.
- Windows, macOS and Linux behaviour is verified on independent GitHub-hosted runners; the owner's MacBook is not a production build or update dependency.

## Explicitly out of scope

- Copying Craft Launcher source code, branding, assets or distinctive interface design.
- Adding a separate Brightdesk Launcher app or an eleventh customer product.
- Replacing the Brightdesk Home design or existing product workspaces.
- Deleting embedded product snapshots before the separate lossless consolidation gates are met.
- Automatically installing updates, publishing releases, changing repository visibility/permissions or introducing paid infrastructure.
