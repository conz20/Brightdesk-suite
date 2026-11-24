# Brightdesk Fonts shared package

This package is the single offline font resource shared by the ten Brightdesk products. It is not a customer-facing eleventh product.

## Current approved family

- **Inter 4.1** — normal and italic variable TrueType faces, retaining the exact original family name.
- Variable axes: optical size (14–32) and weight (100–900).
- Upstream script subsets: Latin, Latin Extended, Greek, Greek Extended, Cyrillic, Cyrillic Extended and Vietnamese.
- Licence: SIL Open Font Licence 1.1. The complete upstream licence is in `licenses/inter-OFL.txt`.

## Source and rights

The font files are from the official Google Fonts `ofl/inter` directory at the pinned revision in `catalogue.json`; the original Inter source revision is recorded too. Each binary has a SHA-256 checksum.

Only fonts whose exact binaries have verified redistribution and application-embedding rights may be bundled. Preserve every family name, author and copyright notice. Respect any Reserved Font Name terms declared by a future family.

## Microsoft and other proprietary fonts

Microsoft and other proprietary fonts may be used when present on the user's device and permitted by their installed licence. Brightdesk must not copy, convert, download or repackage those binaries without written extended rights. Document embedding permission does not grant application-packaging rights.

## Shared use

All ten Brightdesk applications consume this package. Add each approved family once here; products must not maintain separate copies. Fonts are installed locally and are never downloaded at runtime.
