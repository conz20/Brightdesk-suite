# Brightdesk product scope lock

The approved Brightdesk product scope contains exactly these ten apps:

1. Brightdesk Pages
2. Brightdesk Sheets
3. Brightdesk Decks
4. Brightdesk Notes
5. Brightdesk Database
6. Brightdesk Forms
7. Brightdesk Lists
8. Brightdesk Planner
9. Brightdesk To Do
10. Brightdesk Workspace

## First-release lineup

The first-release product lineup is all ten apps listed above. The catalogue and app manager must show every app, its original Brightdesk artwork, name, short explanation and honest availability status.

## Integrated implementation status

All ten approved app modules are now integrated into the main suite. The codebase contains dedicated feature modules, service/workspace modules where appropriate, and automated coverage for the integrated app shell and workspace DOM contracts.

Integration status must not be presented as final acceptance. Real user workflows, accessibility, local data persistence and recovery, upgrades, uninstall, legal packaging and each platform installer still require verification before release.

## Approved Suite navigation and Home layout

The approved sidebar uses **Home**, **Apps** and **Files**; no descriptive captions appear beneath the labels. The Home screen shows all ten approved products in the approved product-card layout.

The **Switch product** list appears only inside an active product workspace. It must not replace or appear in the Suite shell's Home, Apps, Files or Settings navigation.

## Explicit exclusions

Outlook, OneDrive and Teams are not part of Brightdesk and must not be added.

## Pricing, accounts and privacy lock

- Free forever. No subscriptions, trials, paid tiers or billing.
- No customer accounts, sign-in, passwords, profiles, activation codes, serial numbers or licence servers.
- No telemetry, analytics, advertising, crash reporting, cloud sync, collaboration or customer text uploads. No remote AI service or customer document uploads.
- Product data, document processing and spelling checks stay on the device.
- Network access is limited to Brightdesk-controlled product-update and language-resource services. Third-party dictionary downloads are not permitted. Dictionary downloads remain disabled until approved, signed Brightdesk-hosted packs are released.

## External brand and service boundaries

- Do not add Adobe applications, services, runtime dependencies or integrations.
- Microsoft products may be used as internal workflow references only. Do not use Microsoft or Adobe logos, code or distinctive trade dress.
- All product names, icons, artwork, typography, colours and interaction design must remain original Brightdesk work.


## Change control

This scope can change only when the user explicitly instructs. Do not infer approval to add apps from a technical dependency, design reference or workflow comparison.

## Identity

Brightdesk is independent and is not affiliated with Microsoft. Use original code, product names, interface design and assets. Microsoft product names may be used only as internal comparisons to explain familiar workflows.