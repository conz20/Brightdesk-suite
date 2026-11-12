# Brightdesk visual and interaction standard

This is the shared design contract for Brightdesk Office Suite and all ten approved applications. It draws on familiar productivity-software conventions while keeping Brightdesk's own brand, layout, icon artwork and interaction language. It must not copy proprietary Microsoft, Adobe or ArtCraft code, logos, screenshots or distinctive trade dress.

## Brand foundation

- Keep the Suite's Brightdesk Office Suite name and original icon in its native application identity and window title so it is recognisable when opened or closed. Do not repeat the Suite logo or wordmark inside the Suite Home interface, README hero or Home SVG artwork.
- Use a calm, light workspace canvas, deep navy navigation, clear white content surfaces and restrained product-specific accents.
- Use the product's original application icon artwork everywhere: launcher card, sidebar, window icon, application metadata, product README and approved interface artwork. For Windows, macOS and Linux installers, pass the same canonical SVG to Electron Builder so its icon pipeline converts it into the correct platform format. Never reuse the Suite mark as a substitute for a product-specific icon.
- Application icons must be original, designed SVG or raster assets. **Do not use emoji, Unicode symbols, text glyphs, generic placeholders or single-letter initials as application icons.**
- Never substitute emoji for application icons in the launcher, navigation, README files, screenshots, approved interface artwork, documentation or release artwork.
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

## Suite Home and Apps experience

The suite home should make each product immediately recognisable and manageable:

- Use one clear Settings cog in the top-right as the suite-wide entry point for local app, language and update management; do not repeat it as a sidebar item.
- Use a clean, professional suite sidebar with only **Home**, **Apps** and **Files**. The Files icon must visibly communicate a folder containing documents (an open folder plus a visible document stack), not a generic rectangle or ambiguous box. Do not add secondary captions under these three entries; use the original navigation icons and labels only. The footer should reinforce that files stay on this device without repeating the Suite name or logo. The README must show one unified Home image, not separate competing screen designs. **Apps** is the plain-language destination for all ten installed desktop products; do not use the technical label “App Centre”. Do not add a **Create** navigation item. Keep the ten product choices in the main Apps grid, not repeated as sidebar shortcuts.
- Inside an active product workspace, show only installed products in a **Switch product** sidebar group for quick navigation. Hide that group on the Apps and language/settings screens; the sidebar should reflect the current context rather than duplicate the page content.
- After first-use setup, Home is the landing screen and displays all ten product cards. Apps opens the product-management screen. Files provides local **Open file** and **Save project** actions; do not describe it as a full file browser or recent-files list until that functionality exists.
- Label product-card options **Product settings** in the three-dot menu so they are clearly distinct from suite-wide Settings. The current menu lets users hide or restore an installed product in **Switch product** without uninstalling it; save this preference locally.
- Show all ten approved products in a responsive app grid with strong, product-specific application artwork.
- On Home, use the top-bar eyebrow **YOUR WORKSPACE** and heading **Your apps**. The product section below uses the heading **Your products** and the description **Ten focused tools, connected by one Brightdesk experience.** Do not place an additional eyebrow label above this heading. Keep this wording and hierarchy consistent in the running desktop interface and `assets/product-experience/brightdesk-home.svg`.
- At the 1600 × 900 reference size, use a 238 px deep-navy sidebar, a clean, unbranded navigation start with a 56 px main top inset, and 38 px circular Notifications and Settings controls. The Home heading is 34 px.
- At the 1600 × 900 reference size, use a five-column, two-row product grid with 240 px minimum card width, 240 px minimum card height, 16 px column gaps and 18 px row gaps. Reduce the column count responsively without horizontal clipping; keep the original product icons and card actions visible.
- Every card contains the app icon, product name, a concise purpose line, a truthful Installed or Available state, and obvious Open plus Uninstall actions when installed, or Install when available.
- Keep installation state and primary actions visible; do not hide them in overflow menus.
- Confirm uninstall and make clear that removing an app from the suite does not delete its local documents.
- Put language packs, spelling dictionaries and update preferences in the Settings area.
- Show progress and clear success/failure feedback for downloads and updates. Update availability and completion appear as dismissible desktop notifications and remain in the Notifications bell history; do not place install or update explanation cards on Home.
- Never show fabricated update states, availability or version numbers. If an action is only a design target, label it as such in documentation.

The suite is local-first desktop software. Do not add account creation, sign-in, cloud storage, online workspace or cloud-sync imagery or language. Keep navigation focused on local desktop work: Home, Apps and Files. Do not add online-service destinations or a Create sidebar button. Settings must describe controls and resources on this device. Local save states should be explicit and truthful.

## Microsoft-level completeness and individual product windows

Microsoft productivity applications are the completeness and usability benchmark for the corresponding Brightdesk product. Before a product is considered complete, compare its workflows against the current relevant Microsoft application and record missing, applicable capabilities. Add every missing capability that fits the approved Brightdesk product scope, local-first architecture, accessibility requirements and supported platforms. Do not omit a useful, established productivity feature merely because it was not in the first-use prototype. Do not copy Microsoft branding, proprietary assets, code or distinctive trade dress.

The Suite is the launcher and product manager, not a substitute workspace for the ten products. Selecting **Open** must launch or focus that product's own top-level application window, with its own product name, icon, navigation, workspace and window lifecycle. It must never silently replace the Suite renderer's selected product. Selecting another product from a product's **Switch product** control must open or focus that product's window. Users may keep any number of product windows open or closed. Closing a product window must not close the Suite or another product window; closing the Suite must not silently discard or close other product windows. Preserve local files and settings when windows close.

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

## README, approved interface artwork and genuine screenshots

Each product README should show the Brightdesk brand, its own original product icon, an approved product-specific interface reference, a short explanation, accurate first-use scope and truthful build/release status.

Approved interface artwork is the visual specification for the intended production interface. It is not a runtime screenshot. Never describe a design image, rendered mockup, HTML prototype or composited illustration as a capture from the running desktop software.

Genuine screenshots must:
- Be captured directly from the current Electron build running on its target desktop platform.
- Show the real product window and actual controls, not a mockup or composite.
- Demonstrate a real first-use workflow with clearly fictitious sample content.
- Avoid personal data, secrets, developer tools, debug overlays and unrelated desktop clutter.
- Retain the full application frame at a readable resolution; do not crop away errors or incomplete controls.
- Be labelled with the product name and the tested version or commit.
- Be captured only after the visible workflow has been checked against the product's acceptance criteria.

Use `assets/screenshots/<product>-workspace.png` for verified captures. Keep approved interface references under `assets/product-experience/`. Do not replace an approved reference with a screenshot until the screenshot has passed the checks above. Do not imply that screenshots exist when the repository contains only approved design artwork.

All product icons shown in Markdown must be embedded image assets with meaningful alt text. Do not use emoji, Unicode pictographs, initials or text characters as product icon substitutes.

## Completion criteria

A visual change is not complete until:
1. The same original application icon is used in the app, launcher and documentation.
2. No emoji or text-glyph placeholders are used as application icons.
3. The view remains legible at desktop and narrow widths.
4. Navigation, focus, keyboard and empty/error states are checked.
5. The affected app's tests and shared-suite tests pass.
6. The README accurately distinguishes implemented behaviour from planned behaviour.


The **Apps** sidebar entry uses the original four-tile launcher icon from `assets/icons/apps.svg`, not the Brightdesk brand mark or a document icon. Keep the icon paired with the Apps label in both the desktop interface and Home artwork.


## Native platform icon requirements

- The Suite and each of the ten integrated product builds must point to their matching original icon identity in Electron Builder. Decks and Workspace use the `decks` and `workspace` native asset filenames while retaining their internal product IDs `slides` and `loop`.
- Prepare the native icon sets from `assets/platform-icons/brightdesk-platform-icons.zip` with `npm run release:prepare:icons` before packaging.
- Keep multi-resolution Windows ICO, macOS ICNS and Linux PNG outputs aligned to the canonical SVG source artwork. Validate file signatures and expected dimensions before invoking Electron Builder.
- Native icon configuration is not proof of a verified installed icon. Check real Windows shortcuts and taskbar, macOS Dock and Finder, and Linux desktop launcher after each platform installer has been installed.


## Native platform icon requirements

- Keep one canonical SVG for the Suite and each of the ten products; use the exact same artwork in the launcher, workspace, README and package identity.
- Run `npm run release:prepare:icons` before packaging. This copies the Suite mark and ten product SVGs into the isolated Electron Builder build-resources directory and verifies each source.
- Pass each copied SVG to Windows, macOS and Linux Electron Builder targets. Electron Builder performs the platform conversion; do not maintain a second manually edited icon set.
- Decks and Workspace use the `decks.svg` and `workspace.svg` build-resource names while retaining internal product IDs `slides` and `loop`.
- Icon configuration is not proof of a verified installed icon. Check real Windows shortcuts and taskbar, macOS Dock and Finder, and Linux desktop launcher after each platform installer has been installed.
