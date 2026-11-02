# Brightdesk native architecture, launcher and installer roadmap

**Status:** Proposed engineering direction. This document does not claim that Rust has been integrated or that new installers have been built.

## Product constraints

- Keep exactly the ten approved applications in `PRODUCT_SCOPE_LOCK.md`: Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace.
- Do not add Outlook, OneDrive, Teams or any other product.
- Keep Brightdesk's implementation, names, artwork, interface and installer branding original.
- Preserve the current local-first product direction and existing user data.
- Do not publish a release without the owner's approval.

## What the public Storytold repositories demonstrate

The public Craft Launcher repository documents a native Rust launcher with a central app catalogue, platform/CPU-aware downloads, SHA-256 verification, install/update status, tray/menu-bar access, grid and table views, logs and localisation. The public GridCraft and DeckCraft repositories document native Rust desktop/web architectures and command-driven application workflows.

These are product and engineering observations only. Brightdesk must not copy their source code, artwork, branding, distinctive layouts, product copy or proprietary assets. Reuse of any third-party code would require a separate licence and attribution review; the intended implementation here is original.

## Architecture decision: keep Electron, introduce Rust selectively

Do **not** rewrite the complete suite in Rust or replace the current Electron UI at this stage. Brightdesk already has Electron packaging, a hardened preload boundary, file adapters, a language/dictionary service and an existing three-platform installer workflow. Rewriting all of that would add substantial risk without proving a performance benefit.

The proposed architecture is:

```text
Brightdesk Desktop (Electron)
  ├── Original Brightdesk shell and App Centre
  ├── Ten-app catalogue and module routing
  ├── Existing document/file adapters and user-data store
  ├── Existing updater and installer integration
  └── Native compute boundary
       └── Rust library exposed through Node-API (N-API)
            ├── Benchmarked spreadsheet calculation hot paths
            ├── Large-data transforms where profiling proves value
            └── Other CPU-heavy, deterministic operations only
```

### Rust integration rules

1. First profile the current JavaScript implementation with representative documents and datasets. Record baseline latency, memory and throughput.
2. Prototype a small Rust crate using safe Rust and a stable Node-API interface (for example, napi-rs). Do not make the Electron renderer load native code directly.
3. Keep native calls behind a narrow main-process service. Validate input sizes, types and document versions before crossing the boundary.
4. Keep a tested JavaScript implementation as a compatibility fallback for non-security-critical operations while the native module is unavailable. Never silently fall back around a failed integrity or authenticity check.
5. Compare Rust and JavaScript results against the same golden fixtures and property tests. Require identical observable results before enabling the native path.
6. Build and test the native module on native Windows, macOS and Linux CI runners. Package architecture-specific binaries with the application and verify that they load on supported CPU architectures.
7. Add Rust only when benchmarks show a meaningful improvement that outweighs build, maintenance and packaging cost.

### Do not port these parts just to use Rust

- The current Electron window, menus, navigation and renderer.
- Text editing, ribbon layout, dialogs or ordinary UI state.
- Stable Node.js file-format adapters without measured bottlenecks.
- Features that would require a large rewrite before the first usable release.

A separate all-Rust launcher is not the first step. Brightdesk should have one coherent desktop experience, not two competing launchers.

## Brightdesk App Centre requirements

The App Centre should provide:

- All ten approved app cards, with original Brightdesk icons and short descriptions.
- Clear states such as **Included**, **In development**, **Update available** and **Unavailable for this device**. Never describe a planned app as complete.
- Grid and compact list views, user-selectable and remembered.
- Search and category filtering limited to the approved ten apps.
- App version and suite version information.
- A clear route to open an installed app.
- Accessible keyboard navigation, visible focus, readable text and scalable layout.
- Tray/menu-bar access only where supported and useful; closing the window must not unexpectedly hide or terminate user work.

For the integrated suite, app modules should normally update with the suite. Do not create independent app downloads or update channels unless standalone packaging is deliberately enabled and tested for that module.

## Installer and update design

Retain the existing Electron Builder pipeline while improving its reliability and presentation.

| Platform | Installer target | Required experience |
|---|---|---|
| Windows x64 | NSIS `.exe` | Readable licence screen, accept/decline, optional install location, Start menu and desktop shortcuts |
| macOS universal | `.dmg`, `.pkg`, `.zip` | Clear branded welcome/finish screens; signed and notarised public release where credentials are configured |
| Linux x64 | `.AppImage`, `.deb` | Explicit terms acceptance, clear install/uninstall instructions and desktop integration |

### Installer quality gates

- Distinct downloads per operating system; never combine unrelated platform installers into one customer download.
- Consistent product name, app ID, version, icon, publisher metadata and output naming.
- Ship the licence, terms and third-party notices with every relevant package.
- Verify package contents, architecture, executable permissions, file associations and uninstall behaviour.
- Smoke-test installation, first launch, terms acceptance, update, rollback and uninstall on each native operating system.
- Do not claim a build is tested on a platform merely because its configuration file exists.

### Secure update flow

1. Retrieve a release manifest from the configured Brightdesk release channel.
2. Validate the manifest schema, product ID, version, platform and architecture.
3. Verify a detached signature from a pinned Brightdesk release-signing public key. SHA-256 checksums detect corruption but, by themselves, do not prove who published a download.
4. Download to a staging location and verify the full package before installation.
5. Do not replace an application while it is running.
6. Install atomically where the platform permits and preserve a recoverable previous version.
7. Report progress, errors and the exact installed version to the App Centre.
8. Keep automatic installation under the user's control. A failed update must not destroy the previous working installation.

The current `electron-updater` integration is the starting point. Do not enable public auto-update until the repository owner, release channel, signature verification and rollback behaviour are configured and tested.

## Operational quality

- Structured logs with rotation and privacy-conscious defaults.
- No document contents, passwords, tokens or private paths in routine logs.
- Crash recovery and safe-save behaviour for open documents.
- Dependency and licence audits for JavaScript and Rust dependencies.
- Rust formatting, Clippy and test gates if a Rust workspace is introduced.
- CI must build on native Windows, macOS and Linux runners and retain checksums and build metadata.
- Release publication stays manual and owner-approved.

## Delivery sequence

1. **Recover source:** restore the verified v0.5.1 source into the canonical GitHub repository; do not mix it with the older v0.1.0 snapshot.
2. **Baseline:** run the existing tests and static REA Bench, check the exact Node.js 24.22.2 requirement, verify the dependency lock and licence notices.
3. **Brand and App Centre:** approve the original Brightdesk icon and visual system, then implement the App Centre without changing the ten-app scope.
4. **Rust proof of value:** benchmark one bounded CPU-heavy operation, implement a small N-API prototype, compare outputs and measure the real gain.
5. **Installer hardening:** refine the existing NSIS, DMG/PKG/ZIP, AppImage and DEB flows; add signed-manifest verification and rollback tests.
6. **Native CI:** run the complete test/build/smoke-test matrix on actual Windows, macOS and Linux runners.
7. **Release gate:** verify all ten app cards and actual app completion states, all platform packages, checksums, notices, signing status and update recovery. Publish only after explicit owner approval.

## Current known blockers

- The GitHub `main` branch currently identifies itself as v0.1.0, while the recovered installer-hardening source archive is v0.5.1. Reconcile this before merging code.
- The v0.5.1 source records Pages, Sheets, Decks and Notes as incomplete foundations; Database, Forms, Lists, Planner, To Do and Workspace remain planned.
- The current execution environment does not have the required Node.js 24.22.2 runtime, Rust/Cargo, installed project dependencies or a usable 12ui design CLI. Therefore no Rust build, Electron dependency build or visual-design export is claimed by this change.
- Native installer outputs and platform smoke tests remain outstanding until the corresponding CI runners execute successfully.

## Acceptance criteria

- Exactly ten app IDs remain in the catalogue; exclusions remain absent from UI, build scripts and packages.
- Existing documents and preferences survive upgrades.
- The App Centre reports honest app and update states.
- Rust is enabled only for measured, tested workloads and has no effect on environments where it is not available.
- Every installer is built and smoke-tested on its target OS.
- Release downloads have verifiable checksums and authenticated release metadata.
- No release is published without explicit owner approval.
