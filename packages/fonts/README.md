# Brightdesk Fonts shared package

This is the one shared offline font library used by all ten Brightdesk products. It is infrastructure, not an eleventh customer product.

## First-release collection

Inter 4.1 is the current checked-in starter family. **It is not the complete 0.1.0 collection.** Brightdesk 0.1.0 is required to contain at least 1,900 distinct, individually verified Google Fonts families plus every approved, redistributable Microsoft open-font family selected for that release. Proprietary Microsoft Windows and Office binaries are detected locally where permitted; they are not copied into Brightdesk without extended rights.

## Importing the approved 0.1.0 release package

Build the source package in the private Brightdesk-Fonts repository using its pinned Google and Microsoft source revisions. Place the complete, verified generated artifact in `artifacts/brightdesk-fonts-0.1.0`, then run:

```sh
npm run fonts:import-release
npm run fonts:verify
npm run test
npm run release:preflight
```

The importer verifies the source package's complete file list, sizes, SHA-256 digests, catalogue metadata, family-level redistribution and application-embedding permissions, retained licence files, and inspected face details. It then converts the source catalogue into the shared Suite package format and atomically replaces `packages/fonts`. It rejects packages with fewer than 1,900 Google Fonts families. The existing Inter-only seed must never be treated as release-complete.

## Local use across all ten products

The Suite host verifies every bundled font binary against the shared catalogue, checks licence notices and package paths, and installs the package into one shared Brightdesk local-data folder. All product windows read a safe family list through the preload bridge. The font files and stylesheet are loaded from the shared local folder, so normal font use works offline. Raw asset paths, source links and checksums are not exposed to renderer code.

Future font packages are additive versions in the same local store. The store retains already-installed versions while a later package is verified and added. A font catalogue entry must not become selectable until its package has been installed locally.

## Rights and provenance

- Keep exact original family and face names, authors, credits and licence text.
- Preserve script coverage, styles, weights, variable axes and all distinct faces.
- De-duplicate byte-identical binaries by SHA-256, without collapsing distinct typefaces.
- Bundle only exact binaries whose licence explicitly permits redistribution and application embedding.
- Respect Reserved Font Names and any modification or attribution conditions.
- Never bundle proprietary Windows or Office fonts without written extended rights.
- Never retrieve font files directly from Google, Microsoft, foundries or third-party CDNs at runtime.

The source package and each local installation are integrity-checked. A signed customer-update package and host-side signature verification are still required before optional online font downloads are enabled.
