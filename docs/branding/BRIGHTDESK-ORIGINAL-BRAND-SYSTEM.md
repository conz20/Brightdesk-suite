# Brightdesk — original brand identity

**Status:** Initial original identity direction for review and implementation. This is not a copy of Storytold or ArtCraft branding.

## Brand idea

Brightdesk is a calm, capable workspace for getting different kinds of work done. The identity should feel clear, dependable and modern without looking like a clone of another office suite or creative product.

## Visual principles

- **Clear structure:** strong hierarchy, consistent spacing and predictable navigation.
- **Useful colour:** colour helps identify the ten apps; it does not replace labels or accessible contrast.
- **Quiet confidence:** avoid excessive gradients, decorative noise, oversized hero art and crowded dashboards.
- **Original geometry:** use a Brightdesk-specific folded-ribbon / open-workspace mark, not another company's letterform, icon silhouette or logo arrangement.
- **Consistent, not identical:** app icons share a visual construction system but each has its own accent and simple app-specific metaphor.

## Proposed palette

| Token | Colour | Use |
|---|---|---|
| Ink | `#18233B` | Main text, icon background, strong surfaces |
| Paper | `#F7F8FC` | Main light surface |
| White | `#FFFFFF` | Cards and editor surfaces |
| Teal | `#36C7B4` | Primary accent and positive actions |
| Indigo | `#7168E8` | Navigation and selected state |
| Sky | `#4C9BE8` | Pages accent |
| Leaf | `#3EAD79` | Sheets accent |
| Amber | `#E9A34A` | Decks accent |
| Coral | `#E97870` | Notes accent |
| Plum | `#9673D8` | Database accent |
| Aqua | `#42AEB8` | Forms accent |
| Slate | `#64748B` | Lists accent |
| Blue | `#5685D8` | Planner accent |
| Gold | `#C99B3D` | To Do accent |
| Violet | `#8A70C9` | Workspace accent |

Colour assignments are proposed tokens, not final accessibility approval. Every state must also have text, iconography or shape differences; never rely on colour alone.

## Typography

- Primary UI: system sans-serif stack with Inter when bundled and licensed.
- Document content: respect the selected document font and user formatting.
- Use a restrained scale, comfortable line-height and readable default sizes.
- Support OS text scaling and avoid fixed-height controls that clip translated text.

## App icon family

Use one original Brightdesk master mark, then add a small app-specific motif and accent colour for each of the ten apps. App labels remain visible beside icons in the App Centre and navigation.

| App | Visual metaphor | Accent |
|---|---|---|
| Pages | Folded page with text lines | Sky |
| Sheets | Cell grid | Leaf |
| Decks | Slide frame | Amber |
| Notes | Open notebook | Coral |
| Database | Structured table / linked records | Plum |
| Forms | Form fields and check marks | Aqua |
| Lists | Ordered rows | Slate |
| Planner | Calendar blocks | Blue |
| To Do | Checked task | Gold |
| Workspace | Connected panels | Violet |

Do not use the Microsoft product icons, Storytold icons, ArtCraft marks or any other third-party logo.

## UI direction

- Light theme first, with a properly tested dark theme.
- Neutral background, clear cards, subtle borders and restrained shadows.
- App Centre: responsive grid and compact list modes with consistent card geometry.
- Main editor: preserve familiar productivity conventions such as toolbars, formatting controls, document canvas, formula bar and slide navigator where relevant; implement them with original Brightdesk spacing, colours, icons and component shapes.
- Keep controls consistently placed and keyboard accessible.
- Use direct, plain-language status text and never hide errors behind vague success messages.

## Asset rules

- Keep editable SVG source files in the repository.
- Export required platform sizes from the same master vector source.
- Include monochrome variants for system tray and menu-bar contexts.
- Confirm all assets are original and maintain a record of any third-party font or icon licence.
- Do not copy or trace a competitor's logo or distinctive application icon.

## Design approval and production

This direction establishes the brand constraints. A professional multi-screen UI exploration should be generated and visually reviewed before replacing the current shell styling. The 12ui CLI was not available in the current execution environment, so no 12ui mockup or pixel-perfect conversion is claimed yet.
