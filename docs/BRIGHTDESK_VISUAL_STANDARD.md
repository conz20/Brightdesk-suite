# Brightdesk visual and interaction standard

This is the shared design contract for Brightdesk Office Suite and all ten approved applications. It draws on familiar productivity and creative-software conventions while keeping Brightdesk's own brand, layout, icon artwork and interaction language. It must not copy proprietary Microsoft, Adobe or ArtCraft code, logos, screenshots or distinctive trade dress.

## Brand foundation

- Use the Brightdesk four-panel mark and lowercase wordmark consistently.
- Use a calm, light workspace canvas, deep navy navigation, clear white content surfaces and restrained product-specific accents.
- Use the product's original application icon artwork everywhere: launcher card, sidebar, window icon, application metadata, product README and preview.
- Application icons must be original, designed SVG or raster assets. **Do not use emoji, Unicode symbols, text glyphs, generic placeholders or single-letter initials as application icons.**
- Never substitute emoji for application icons in the launcher, navigation, README files, screenshots, previews, documentation or release artwork.
- Keep icon silhouettes recognisable at small sizes and ensure each product has a distinct visual metaphor.
- Use consistent spacing, border radii, typography hierarchy, button heights, focus rings and motion across the portfolio.

## Ten application identities

| Product | Icon metaphor | Accent family |
| --- | --- | --- |
| Pages | Document page and editing pen | Blue-violet |
| Sheets | Spreadsheet grid and chart | Green |
| Decks | Layered presentation slides | Amber |
| Notes | Open notebook and bookmark | Blue-teal |
| Database | Structured data cylinder and rows | Violet |
| Forms | Form page and response checkboxes | Coral |
| Lists | Ordered checklist rows | Teal |
| Planner | Calendar and schedule | Royal blue |
| To Do | Task list and completion check | Green |
| Workspace | Connected project panels | Slate indigo |

The product-specific accents should help recognition, not create ten unrelated design systems. Shared surfaces, typography and interaction patterns remain common.

## Suite app-centre experience

The suite home should make each product immediately recognisable and manageable:

- Use one clear Settings cog as the entry point for local app, language and update management.
- Show all ten approved products in a responsive app grid with strong, product-specific preview artwork.
- Every card contains the app icon, product name, a concise purpose line, a truthful Installed or Available state, and obvious Open plus Uninstall actions when installed, or Install when available.
- Keep installation state and primary actions visible; do not hide them in overflow menus.
- Confirm uninstall and make clear that removing an app from the suite does not delete its local documents.
- Put language packs, spelling dictionaries and update preferences in the Settings area.
- Show progress and clear success/failure feedback for downloads and updates.
- Never show fabricated update states, availability or version numbers. If an action is only a design target, label it as such in documentation.

The suite is local-first desktop software. Do not add account creation, sign-in, cloud storage, online workspace or cloud-sync imagery or language. Settings must describe controls and resources on this device. Local save states should be explicit and truthful.

## Application workspaces

Each application should use a predictable layout: brand and product navigation, page title and context, task-specific toolbar or controls, a generous working canvas, clear saved/local status and consistent empty/loading/error states. The workspace should put the core task first rather than fill space with decoration.

Product-specific controls must use the same visual language:
- Pages: document canvas, page layout, readable ribbon groups and print/export affordances.
- Sheets: formula bar, clear grid, row/column headers, selected-cell focus and chart/data tools.
- Decks: slide filmstrip, canvas, design controls and obvious presentation mode.
- Notes: notebook/page navigation, note canvas, headings, lists and quick capture.
- Database: table navigation, fields, record grid, search and export.
- Forms: question editor, preview and responses as clear workspace tabs.
- Lists: searchable, filterable table with visible columns and status.
- Planner: board and timeline views with readable task cards and priority/status metadata.
- To Do: fast task entry, My Day and other task views, completion state and daily progress.
- Workspace: project pages, notes, task and resource blocks with simple navigation.

## Accessibility and responsive quality

- Keyboard access and visible focus for every actionable control.
- Semantic labels, accessible names and logical reading order.
- High contrast for normal text; never communicate state by colour alone.
- Respect reduced-motion preferences.
- At narrow sizes, navigation and grids must adapt without clipping controls or hiding essential actions.
- Keep touch/click targets comfortable and avoid tiny three-dot menus.

## Cross-platform parity (Windows, macOS and Linux)

The same approved Brightdesk visual system and supported feature scope apply on every supported desktop operating system. Do not create a separate visual design for Windows, macOS or Linux.

- Keep shared navigation, information hierarchy, typography, spacing, radii, controls, empty/loading/error states, focus treatment and interaction behaviour aligned across platforms.
- Keep each product's original icon and approved product accent identical across platforms. Product accents distinguish the ten products; they are not operating-system themes.
- Use the same application modules and first-use workflow coverage on every platform. Do not hide or downgrade a supported feature merely because a different operating system is being used.
- Adapt only where the operating system requires it: window chrome, standard file/folder dialogs, keyboard conventions, permissions, notifications, installer surfaces and native removal controls.
- Keep text, labels, validation, save status, update status and accessibility behaviour consistent. Never use colour alone to communicate status.

### Package and release parity

The configured suite package targets are:

| Operating system | Expected package targets |
| --- | --- |
| Windows | x64 NSIS installer (.exe) |
| macOS | Universal DMG (.dmg), PKG (.pkg) and ZIP (.zip) |
| Linux | x64 AppImage (.AppImage) and Debian package (.deb) |

These are build targets, not proof of a published or verified release. A release is ready only after each target operating system has completed its own native build and verification. Test install, first launch, agreement acceptance/decline, upgrade, launch after upgrade, removal and local-data handling on the actual target OS. A successful build on one OS does not verify another.

The suite's Windows and macOS installers present the Terms and Conditions during installation. Linux AppImage has no installer agreement page, so the packaged suite enforces the same blocking agreement before the first workspace opens. A valid agreement must be accepted; declining or closing the agreement exits without opening the product.

The suite owns the customer-facing version. All platform packages for one release must use the same approved source commit, version, product scope and release notes. Do not advertise automatic update delivery until a publisher/feed and its signed or otherwise approved artifacts have been configured and verified on all supported platforms. The current suite package has an empty build publishing-provider list, so an active cross-platform update feed is not yet established.

### Consistent removal outcome

Native uninstall controls differ between Windows, macOS and Linux. The interface and documentation must still give users a consistent outcome: remove the requested Brightdesk product or suite software, clearly distinguish product removal from full-suite removal, and never silently delete local project data. Confirm the exact data-retention behaviour through native uninstall tests on each OS before describing it as verified.

## README, concept artwork and genuine screenshots

Each product README should show the Brightdesk brand, its own original product icon, a product-specific preview, a short explanation, accurate first-use scope and truthful build/release status.

Concept artwork is allowed as a design reference, but it must be labelled **Concept artwork — not a screenshot**. Never describe a concept image, rendered mockup, HTML prototype or composited illustration as a capture from the running desktop software.

Genuine screenshots must:
- Be captured directly from the current Electron build running on its target desktop platform.
- Show the real product window and actual controls, not a mockup or composite.
- Demonstrate a real first-use workflow with clearly fictitious sample content.
- Avoid personal data, secrets, developer tools, debug overlays and unrelated desktop clutter.
- Retain the full application frame at a readable resolution; do not crop away errors or incomplete controls.
- Be labelled with the product name and the tested version or commit.
- Be captured only after the visible workflow has been checked against the product's acceptance criteria.

Use `assets/screenshots/<product>-workspace.png` for verified captures. Keep original design concepts under `assets/previews/` and label them as concepts. Do not replace a concept preview with a screenshot until the screenshot has passed the checks above. Do not imply that screenshots exist when the repository contains only concept artwork.

All product icons shown in Markdown must be embedded image assets with meaningful alt text. Do not use emoji, Unicode pictographs, initials or text characters as product icon substitutes.

## Completion criteria

A visual change is not complete until:
1. The same original application icon is used in the app, launcher and documentation.
2. No emoji or text-glyph placeholders are used as application icons.
3. The view remains legible at desktop and narrow widths.
4. Navigation, focus, keyboard and empty/error states are checked.
5. The affected app's tests and shared-suite tests pass.
6. The README accurately distinguishes implemented behaviour from planned behaviour.
