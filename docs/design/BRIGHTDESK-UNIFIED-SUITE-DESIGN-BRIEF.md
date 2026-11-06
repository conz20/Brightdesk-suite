# Brightdesk Unified Suite — Home and App Centre Design Brief

**Status:** Proposed design and implementation brief  
**Date:** 6 November 2026  
**Related reference:** [Brightdesk Unified Suite Design Reference](Brightdesk-Unified-Suite-Design-Reference.html)

This brief turns the three-way reference board into an actionable direction for the Brightdesk desktop experience. It is a design proposal, not evidence that these screens or behaviours are already implemented.

## Product direction

Brightdesk is one connected desktop suite with one original identity. It combines useful patterns from:

- **Microsoft 365:** a central Home experience, recent work and clear routes into products.
- **Adobe Creative Cloud:** creative discovery, featured workflows and a shared ecosystem feel.
- **ArtCraft:** a visible product catalogue with clear installation and management states.

These are design influences only. Brightdesk must retain its own name, artwork, icons, interface, code and product decisions.

## One suite shell

Use one consistent application frame across Home, App Centre, Files, Create and the ten product workspaces.

### Primary destinations

1. **Home** — welcome area, recent work, useful shortcuts and relevant activity.
2. **App Centre** — the complete catalogue of the ten approved products, with clear installed/available states and product management.
3. **Files** — access to the user's local Brightdesk documents and recent files.
4. **Create** — a focused starting point for creating a document, spreadsheet, presentation, note, form, list or plan.

Keep suite-wide Notifications and one clearly recognisable Settings cogwheel in the top-right. Do not create duplicate navigation systems or repeat all ten product links beside the App Centre cards.

### Product navigation

When a product workspace is open, provide a consistent way to return Home and switch between installed products. Keep each product's own identity, icon and purpose visible while preserving the shared Brightdesk shell.

## Home experience

The Home screen should answer three questions immediately:

- **Where do I start?** Show clear create shortcuts and routes to the products.
- **What was I working on?** Show recent local files with useful file-type and product context.
- **What can I do next?** Feature relevant workflows or discovery content without turning the page into advertising.

Suggested layout:

- A clear welcome/header area.
- A compact row of primary create actions.
- A recent-work area with readable file names, product labels and last-opened information when available.
- A restrained discovery/featured area for supported workflows and product capabilities.
- Optional activity or update notices only when there is real information to show.

Do not fabricate recent files, activity, update availability or usage statistics. Empty states should explain the next useful action.

## App Centre experience

Show all ten approved products together, with original Brightdesk icons and concise descriptions:

1. Pages
2. Sheets
3. Decks
4. Notes
5. Database
6. Forms
7. Lists
8. Planner
9. To Do
10. Workspace

Each product card should communicate:

- Product name and original icon.
- A short purpose statement.
- Installed or available status.
- Version information only when the value is known and accurate.
- The appropriate primary action, such as **Open** or **Install**.
- Product management actions in a predictable, accessible location.

Keep suite updates distinct from product installation. Do not imply that an individual product card has its own downloadable desktop installer if installation is actually managed by the suite. Do not show an Update action as available unless a real update source and applicable version have been verified.

Product-specific settings and three-dot menus may be explored as future design work, but must not be presented as implemented until they exist and work.

## Files and Create

**Files** should represent local documents and folders, not imply a cloud drive. Keep file access, sorting, search and recent-work behaviour consistent with the actual capabilities of the current build.

**Create** should reduce the steps needed to begin common work. Use clear product-specific actions and avoid advertising unsupported templates, file formats or workflows.

## Shared visual and interaction rules

- Use original Brightdesk branding and the approved product icons.
- Maintain consistent typography, spacing, navigation, controls, focus states and feedback.
- Preserve the approved accent colour and icon identity of each product.
- Use clear labels and recognisable icons together for important actions.
- Make keyboard focus, readable contrast, scalable layouts and accessible control names part of implementation acceptance.
- Keep layouts usable at smaller desktop window sizes; avoid relying on fixed-width content.
- Provide clear loading, empty, success and error states.
- Do not use another company's logos or imply affiliation.

## Product and business boundaries

- Keep the approved ten-product scope. Outlook, OneDrive, Teams and other unapproved products are excluded.
- Preserve Brightdesk's local-first direction and subscription-free model.
- Do not introduce mandatory cloud accounts, cloud storage, paid credits, trials or remote collaboration dependencies.
- Do not silently upload local documents or project data.
- Keep suite settings distinct from product-specific settings where that distinction is meaningful.
- Preserve user documents when uninstalling a product; verify this behaviour before claiming it.

## Implementation and evidence gates

Treat the work as a sequence of independently verifiable stages:

1. **Design approval:** agree on the Home, App Centre, Files and Create structure and the shared shell.
2. **Screen implementation:** implement one destination at a time using existing Brightdesk components and product capabilities.
3. **Interaction verification:** test navigation, product switching, create actions, file opening and management actions.
4. **Accessibility and responsive checks:** verify keyboard use, focus visibility, labels, contrast and smaller window sizes.
5. **Genuine screenshots:** capture each screen directly from the current running desktop build. Record the tested commit/build and use non-sensitive sample data.
6. **Release verification:** keep application checks, native installer builds, installation, first launch, upgrade and removal as separate evidence gates.

Concept artwork and the three external reference screenshots must never be labelled as genuine Brightdesk screenshots. A passing documentation or CI check is not proof that a proposed interface is implemented.

## Acceptance checklist

- [ ] One Brightdesk shell and one consistent primary navigation.
- [ ] Home brings together create actions and genuine recent work.
- [ ] App Centre displays all ten approved products with accurate states.
- [ ] Files reflects the real local file capabilities.
- [ ] Create actions open supported workflows.
- [ ] Product switching preserves the shared shell.
- [ ] Settings and Notifications are clearly placed and usable.
- [ ] No unsupported cloud, subscription, update or installer claims.
- [ ] Keyboard, focus, contrast and smaller-window behaviour are checked.
- [ ] Genuine screenshots are captured from the verified running build.

**Source of truth:** the running implementation, tests and verified behaviour determine what is complete. This brief describes the intended direction and must be updated when an approved design or implementation decision changes.
