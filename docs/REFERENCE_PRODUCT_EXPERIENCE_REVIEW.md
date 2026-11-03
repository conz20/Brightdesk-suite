# Brightdesk product experience review: app hubs, downloads and updates

Date: 2026-11-03

## Purpose and boundaries

Use Adobe Creative Cloud and Microsoft 365 as public product-experience references for a Brightdesk-owned desktop suite. The goal is to learn from discoverability, installation clarity, installed-app management, version visibility, notifications and platform packaging.

This is a clean-room product and architecture review. It does not copy their source code, hidden APIs, network protocols, interface files, icons, screenshots, branding, distinctive layouts, account systems or paid features. The only Brightdesk products in scope are Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace. Outlook, OneDrive, Teams and all other unapproved products remain excluded.

The review is based on publicly accessible pages, official help material and visible reference imagery, plus static inspection of the Brightdesk source branch. It does not claim analysis of Adobe or Microsoft binaries, private endpoints, browser internals or running third-party clients.

## Public reference findings

### Adobe Creative Cloud

Publicly documented experience patterns worth learning from:

- Product discovery is organised by creative category and common use case, rather than presenting one undifferentiated wall of software.
- The desktop manager separates **Your apps** (installed products) from **All apps** (the catalogue). The installed list can show Open actions and app-specific controls.
- App actions are contextual: an individual product can expose information, version, update and uninstall options.
- Updates have a dedicated management view with a manual check, a list of products that actually have updates, and automatic-update preferences.
- Preferences include notifications and other desktop-client settings.
- Uninstall offers a deliberate choice to keep or remove app preferences, rather than silently treating the app binary and user settings as the same thing.

Brightdesk adaptation:

- Use **App Centre** as the catalogue and **Installed apps** as a separate filter/view in the same original shell.
- Keep the exact ten approved Brightdesk cards visible, with a short description, original SVG icon, version and honest installation state.
- Provide a context menu or details panel for Open, View details, Check update, Uninstall and Repair where implemented.
- Ask whether to keep app settings and user documents during uninstall. Never delete user documents by default.
- Use clear update states and opt-in automatic checking/downloading. Brightdesk always asks for explicit **Next** approval before running an installer.

Do not adopt Adobe's subscription, sign-in, cloud library, stock marketplace, promotional, trial or account-dependent features.

### Microsoft 365

Publicly documented experience patterns worth learning from:

- The download landing page offers clear platform-specific desktop download actions for Windows and macOS.
- Product pages introduce the main apps with a recognisable icon/name and a short purpose statement before sending users into product details.
- The Microsoft 365 Apps page separates the web app catalogue from the desktop installation action.
- The desktop installation flow is guided and tells users which installer to open after downloading.
- The wider catalogue uses a searchable/lettered inventory of apps and services, but Brightdesk must not import Microsoft's product catalogue.

Brightdesk adaptation:

- Create one **Brightdesk Downloads** destination with a detected-platform recommendation and a visible **Choose another platform** control.
- Provide individual downloads for every approved app as well as a Suite launcher download.
- Show the supported operating system, CPU architecture, package type, version, package size, release notes and checksum status before download.
- Keep the download path usable without an account, sign-in, activation key or subscription.
- Include concise product descriptions and a product-details view, but keep the catalogue fixed at ten.

Do not copy Microsoft's account sign-in, organisation licensing, cloud storage, Copilot offers, app lineup, web service integration or brand elements.

### Linux is a Brightdesk requirement, not a reference-platform assumption

The public Adobe desktop-app requirements reviewed list Windows and macOS. Microsoft's official desktop download page offers Windows and macOS installers; Microsoft support material states there is no native Microsoft 365 desktop client for Linux. Therefore, neither reference's platform choices are sufficient for Brightdesk.

Brightdesk must design and test Linux as a first-class platform. The existing source targets Linux AppImage and DEB packages. AppImage should remain usable without root privileges; DEB installation should use the operating system's package-management and permission model. Additional formats such as RPM or Flatpak should be added only with native build, upgrade and uninstall tests.

## Brightdesk target experience

### Navigation

Use one consistent Brightdesk launcher with these top-level areas:

1. **Home** — suite status, recently opened Brightdesk apps, available updates and clear next actions.
2. **Apps** — all ten approved apps, with All / Installed / Not installed filters and a search field.
3. **Downloads** — suite launcher and individual app packages, platform/architecture selection, verified downloads and release notes.
4. **Updates** — per-product installed version, available version, download state and the explicit Next-to-install action.
5. **Settings** — update preferences, notifications, appearance, language and app-management preferences.

The shell must use original Brightdesk components and artwork. Common conventions such as a product grid, search, navigation rail, app details, status chips and contextual actions are fine; competitor layouts and artwork are not.

### App card and details

Every card should show:

- Brightdesk's original product icon and product name.
- A plain-language purpose statement.
- Whether the app is available in the integrated suite, installed as an independent desktop app, or both.
- Installed version and update status when applicable.
- A primary action that accurately reflects the state: Open, Download, Install, Add to suite, Update or Next.
- A details action for platform compatibility, package size, release notes and supported file formats.

Avoid making users guess whether **Add to suite** installs a separate operating-system app. They are separate actions and must be labelled separately.

### Downloads experience

The Downloads area must support:

- A default recommendation for the current operating system and CPU architecture.
- A visible override for Windows, macOS and Linux, plus the architectures actually built and tested.
- A single Suite launcher download.
- Ten individual app downloads.
- An optional multi-app selection flow that installs the launcher plus only the apps selected by the user.
- **Select All** and **Clear All** controls in that installer selection step.
- A later **Modify installation** action to add or remove standalone apps.
- Download progress, checksum verification, install progress, completion and actionable failure states.
- A manual way to obtain a package without opening a paid account or web sign-in flow.

The App Centre's **Select All / Clear All** controls currently select which apps appear inside the Suite. They do not install independent desktop packages and must not be described as satisfying the native installer selection requirement.

### Installed-app management

The launcher must be able to discover a standalone app immediately after its installer completes. Discovery must not depend on the user opening the app once first.

For each product, provide a clear action menu. At minimum, support Open and Uninstall when the platform integration is available. Add Update, Repair, Show in Finder/Explorer/file manager and version details where supported. Keep application binaries, user documents and application preferences as separate data categories.

Uninstall defaults:
- Never remove user documents.
- Keep preferences by default, with a separate explicit option to remove app preferences.
- Explain what will be removed before confirming.
- Do not remove the Brightdesk Suite launcher or other apps when one product is uninstalled.

### Updates and notifications

- Update checking and downloading remain user-configurable and off until chosen by the user, consistent with the product memory.
- Manual **Check for updates** is always available.
- Automatic installation is never allowed.
- An available update notification shows the product name and current-to-target version, offers **Review**, and has a dismiss X.
- The Updates page shows per-product rows, not just one generic suite version.
- The installer is not launched until the user presses **Next**.
- A staged installer must be checked again immediately before launch: trusted source, file size, checksum, product ID, platform and target version.
- Failed updates must leave the existing app usable and provide a repair or retry path.

## Proposed technical architecture

### 1. One canonical catalogue

Keep one typed catalogue for the ten approved apps. Add structured platform/package metadata rather than duplicating product facts across the renderer, main process and packaging scripts.

Suggested fields:

- id, name, summary, description, icon, category
- integratedAvailability and truthful capability status
- standaloneProductId
- version and releaseChannel
- platforms[], each with OS, architecture, package type, package size and minimum supported OS
- release notes and supported file formats

The catalogue is data, not a way to add more apps. Add a test that rejects anything outside the fixed ten IDs.

### 2. Release manifest and download resolver

Create a versioned release manifest for the Suite and each app. Resolve download links from that manifest, not from guessed filenames.

A package record should include product ID, version, OS, architecture, package type, URL, byte size, SHA-256 and release notes. The installer should reject unknown products, unsupported platforms, mismatched filenames and untrusted origins.

A checksum detects corruption or mismatch against the manifest; it does not independently authenticate a manifest downloaded from the same compromised origin. Production releases should also use platform code-signing and a signed manifest or equivalent trusted release metadata. Preserve the platform-specific trust model:
- Windows: signed executable installers where signing credentials are available.
- macOS: Developer ID signed app/package and notarisation for public distribution.
- Linux: signed repository metadata for package repositories where used; verified checksums and clear provenance for AppImage distribution.

Signing costs are distribution/business costs, not a Brightdesk licence fee charged to users.

### 3. Installer orchestration

Keep individual product packages independently downloadable and installable. Add a separate platform-aware Suite setup experience that can orchestrate selected packages:

- Windows: a branded interactive installer with component choices and one installation summary. It can install the Suite launcher plus the selected app products, create individual shortcuts and register uninstall entries.
- macOS: a signed/notarised product package with selectable components, or a branded setup application that invokes separately signed product packages. A DMG drag-and-drop install alone cannot provide a multi-component selection wizard.
- Linux: offer the portable AppImage route and a user-friendly package route for supported distributions. Use user-level app directories and desktop entries for portable installs; use the system package manager and its permission prompts for DEB packages. Do not run hidden privileged commands.

Keep the later **Modify installation** flow backed by the same selected-products manifest and platform package manager.

The installer design is a proposal; implementation must be validated against current electron-builder, NSIS, Apple Installer and Linux packaging capabilities before selecting exact tooling.

### 4. Installation registry and app launching

Use a canonical installation registry written by the installer/installer integration, not only by the app's first launch. Each record should include product ID, version, platform, architecture, installation root, executable/bundle path, installation source and last verified time.

Before listing an app as installed, verify the recorded bundle/executable still exists and matches the expected product identity. Remove stale records safely. Keep launch commands platform-specific and tested.

### 5. Update channels and version model

Keep the Suite and individual apps independently versionable. Each update check must query the correct app-specific release channel or canonical manifest. Do not compare all apps against one unrelated releases/latest version.

The download centre and in-app update manager must consume the same manifest and version comparison logic. Test scenarios with different app versions, different channels, a missing package for one platform, a newer release for only one app and a staged installer that has become outdated.

### 6. Narrow IPC/API surface

Expose only validated application operations to the renderer. Suggested operations:

- catalog:list
- installation:list
- installation:plan
- installation:apply
- installation:modify
- apps:launch
- apps:uninstall
- downloads:resolve
- downloads:stage
- updates:check
- updates:stage
- updates:install
- notifications:dismiss

Do not let the renderer execute shell commands, choose arbitrary package URLs or request arbitrary file paths. Validate product ID, platform, architecture, manifest signature, file hash, size and staged path in the main process before opening any installer.

## Source review: current Brightdesk branch

The following are source-level observations, not completed runtime tests:

1. The app catalogue already contains exactly ten approved apps and original per-app SVG files.
2. Individual build scripts and electron-builder configuration already generate separate products for all ten app IDs and target Windows NSIS, macOS DMG/PKG/ZIP and Linux AppImage/DEB.
3. The App Centre already has an in-suite selection workflow and **Select All / Clear All** controls. That only changes the launcher navigation selection; it does not select standalone installers.
4. There is no completed cross-platform multi-app setup/modify wizard. This remains a release blocker.
5. standalone-app-registry.js records installed products, but the main process registers a product when that standalone product starts. The launcher therefore cannot rely on this registry alone to discover a newly installed app before its first launch. Installer-time registration is needed.
6. electron-builder.app.config.js configures a channel per standalone app. app-update-service.js currently queries the generic GitHub /releases/latest endpoint for standalone app download and update discovery. The correct relationship between channel metadata, release tags and this catalogue is not yet proven. Unify these paths through one app-aware release manifest and test them with real published release assets.
7. Each standalone app packaging config currently includes the broad src/**/* tree. Measure package sizes and confirm whether app-specific bundles are worth separating before changing the build layout.
8. Current native build targets cover Windows x64, macOS universal and Linux x64. Do not advertise more architectures until native build, dependency and installer tests pass.
9. Current CI quality runs have been failing before any steps are recorded (runner_id: 0, empty step arrays). No source test or platform build result should be inferred from those runs.

## Delivery order

### P0 — reliable installation foundation

- Define the canonical ten-app catalogue and versioned release manifest.
- Implement installer-time installation registration and reliable discovery.
- Implement the cross-platform multi-app selection and Modify installation flows.
- Preserve distinct independent application shortcuts, app IDs and uninstall behaviour.
- Build and verify all platform installers on native runners.

### P1 — complete download and update centre

- Build the dedicated Downloads destination with OS/architecture resolution and ten app packages.
- Make the download centre and update centre consume the same verified release manifest.
- Correct and test per-app channel resolution, app versions, staged installer invalidation and checksum checks.
- Add install/download progress, useful errors, retry and recovery.

### P2 — premium-feel product experience

- Explore an original Brightdesk visual direction for Home, Apps, Downloads, Updates and Settings.
- Apply the approved design consistently to the launcher, app detail states, update notifications and installer screens.
- Review light/dark themes, keyboard navigation, focus, scaling, localization and narrow-window behaviour.
- Only then replace the current shell styling; do not approximate an unreviewed mockup with ad-hoc CSS.

### Release gates

A platform is not ready until a clean native runner has verified:
- suite-only installation;
- suite plus one selected app;
- suite plus several selected apps;
- Select All and Clear All;
- later adding/removing an app via Modify installation;
- direct OS launch of each selected standalone app;
- launcher launch of each registered app before any manual first-run setup;
- individual uninstall with user data preserved;
- upgrade of one app without affecting other apps or the launcher;
- failed/corrupt download and checksum rejection;
- explicit Next approval before installer launch;
- retry/repair after failed installation;
- actual Windows/macOS/Linux signing or package trust checks, stated honestly.

## Implementation applied to the Brightdesk source branch

The reference lessons have now been applied in source code, not just recorded in this review:

- The Suite launcher has separate Home, Apps and Downloads destinations. Home shows in-Suite apps separately from standalone desktop installs.
- Apps has catalogue search and filters for All, In suite, Desktop installed and Not installed, plus first-run Select All / Clear All.
- Downloads has a Windows/macOS/Linux platform selector. Current-computer installers are staged and checksum-verified before explicit Next. Other-platform downloads are resolved from the same trusted release manifest and opened through the operating system browser, with version, filename and SHA-256 shown.
- The Suite and ten standalone apps consume one versioned release-manifest model. Suite version and app module versions are separate; package metadata includes OS, architecture, package type, size and SHA-256.
- Update preferences live in one shared Brightdesk app-data file, migrate legacy per-app settings and always force auto-install off.
- Standalone apps register with the launcher at startup, while the Suite also discovers existing installations from macOS app bundles, Windows install folders/uninstall registry entries, Linux desktop entries, DEB package records and AppImage desktop entries.
- A Home refresh action updates the installed-app registry without leaving Home. Reinstalled apps update their registry path and version.

These changes are source-level implementation only until Node.js 24.22.2 tests and native platform builds have actually run successfully.

## Newly confirmed release distribution blocker

The connected source repository is private. The desktop update/download resolver uses unauthenticated GitHub release metadata and asset URLs so end users do not need to sign in. A private source repository cannot serve as that no-login release origin. Before a public release, the owner must configure a separate public Brightdesk releases repository or public download host and point the shared manifest/package metadata there. Keep source private if desired; publish only approved release metadata, packages and required notices.

The native multi-app setup/Modify wizard is still unfinished. The Downloads centre now supports selecting the target OS and downloading individual installers, but the end-to-end native installer must still be able to install only selected apps and later modify that selection.

## Sources

Official public product and support material reviewed on 2026-11-03:

- Adobe Creative Cloud Australia product catalogue: https://www.adobe.com/au/creativecloud.html
- Adobe Creative Cloud desktop app feature overview: https://helpx.adobe.com/creative-cloud/apps/get-started/adobe-creative-cloud-desktop-app-features.html
- Adobe app management in Creative Cloud: https://helpx.adobe.com/creative-cloud/apps/manage-apps/creative-cloud-apps/manage-different-apps.html
- Adobe update management: https://helpx.adobe.com/creative-cloud/apps/manage-apps/creative-cloud-apps/check-for-app-updates.html
- Adobe uninstall and preference retention: https://helpx.adobe.com/au/creative-cloud/apps/manage-apps/creative-cloud-apps/uninstall-or-remove-apps.html
- Adobe desktop app system requirements: https://helpx.adobe.com/download-install/apps/system-requirements/creative-cloud-desktop-app-system-requirements.html
- Microsoft 365 Australia apps and services: https://www.microsoft.com/en-au/microsoft-365/products-apps-services
- Microsoft 365 desktop download page: https://www.microsoft.com/en-us/microsoft-365/download-office
- Microsoft 365 installation on PC and Mac: https://support.microsoft.com/en-us/office/lifecycle/officeinstall/download-install-or-reinstall-microsoft-365-or-office-2024-on-a-pc-or-mac
- Microsoft support discussion of native Linux desktop availability: https://learn.microsoft.com/en-au/answers/questions/5891967/microsoft-office-on-linux

## Evidence limits

The public pages and official documentation support the described user-facing workflows and published platform support. The source review supports the listed Brightdesk code observations. No third-party binaries, private services, private APIs or running third-party applications were inspected. The 12ui design CLI was not available to generate approved Brightdesk design candidates during this pass, so no visual mockup or pixel-fidelity implementation is claimed.
