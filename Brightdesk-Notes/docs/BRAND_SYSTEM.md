# Brightdesk visual identity

Date: 2026-11-03

## Identity direction

Brightdesk is a calm, capable desktop workspace: precise, clear, modern and welcoming. Its original master mark uses layered document panels that form a forward-moving B. This is original Brightdesk artwork, not a redraw of another company's logo.

## Applied colour system

| Token | Value | Use |
| --- | --- | --- |
| Midnight | #101827 | Deep icon background |
| Navy | #152A52 | Brand mark and strong surfaces |
| Ink | #18233B | Sidebar, headings and primary text |
| Teal | #36C7B4 | Primary action and selected state |
| Mint | #70E1D1 | Mark highlight and positive accent |
| Indigo | #667FE0 | Secondary mark accent |
| Page | #F3F6FA | Main application background |
| Paper | #F5FBFF | Light surfaces and contrast |
| Border | #E0E7EF | Card and panel borders |
| Muted | #64748B | Secondary text |

The integrated shell now uses an original dark-ink navigation rail, teal interaction accent, light document canvas, restrained borders and accessible visible focus. The master mark is used in the sidebar, App Centre and installer configuration.

Use semantic tokens for success, warning, danger and disabled states rather than using accent colours decoratively. Colour must never be the only way to convey a state.

## Layout and interaction principles

- Keep a stable left navigation rail and a clear working canvas.
- Use consistent spacing, predictable toolbars and visible keyboard focus.
- Prefer readable labels and familiar office workflows over icon-only controls.
- Support light and dark themes without changing the product identity.
- Keep app-specific colour accents subtle; the suite mark remains consistent.
- Make status visible in words: Available, Installed, Update available or Planned.
- The App Centre supports both a responsive grid and a compact list view; the selected view is remembered locally.
- Use original line icons and app artwork; never reuse Storytold or Microsoft icons.

## Typography

Use platform UI fonts with a clear sans-serif fallback stack. Maintain readable body text, restrained heading weights and strong contrast. Do not embed third-party fonts unless their licence and attribution are reviewed.

## App icon family

The master suite mark is at `assets/branding/brightdesk-suite-mark.svg`. It is wired as the electron-builder icon source for Windows, macOS and Linux, and a renderer copy is packaged at `src/assets/brand/brightdesk-suite-mark.svg`.

The ten app cards currently use their own labels, accent treatments and original preview artwork. A complete set of ten purpose-specific app glyphs is still planned; do not describe that icon family as finished until each app has its own reviewed, original icon.

## Ownership

Brightdesk names, logo, artwork, UI and visual tokens are independent. Similarity is limited to common productivity conventions such as a toolbar, navigation rail, ribbon-like command grouping, grid/list views and document canvas.
