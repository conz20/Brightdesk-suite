# Brightdesk licensing, copyright, brand and asset-provenance standard

**Purpose:** Keep Brightdesk ownership notices accurate, preserve the rights granted by each licence, protect the Brightdesk identity from misuse, and prevent unverified third-party material from entering a release.

This standard applies to Brightdesk Office Suite, its ten customer products, private engineering repositories and supporting repositories. Apply the relevant parts to each repository; do not assume every repository contains the same type of material.

## Official project identity and copyright notices

The official project identity is **Brightdesk** (one word, capital B). Where an existing Brightdesk-owned software component is already distributed under the MIT License, use this copyright notice:

```text
Copyright (c) 2026 Brightdesk
```

Do not place the owner's personal name, personal email address, account details or other identifying information in copyright notices, licence files, package metadata, release materials, repository documentation or security instructions. Use the Brightdesk project identity for public-facing attribution.

Keep existing licence grants and disclaimer text intact when correcting an attribution typo. A spelling correction does not change the licence terms or retroactively change the rights already granted.

## What the MIT License does and does not do

The MIT License is a permissive open-source licence. It allows recipients to use, copy, modify, merge, publish, distribute, sublicense and sell copies of the covered software, provided the required copyright and permission notice is retained.

**An MIT licence does not prevent someone from copying, modifying, forking, redistributing or commercially reusing the licensed code.** It does not make the code exclusive to Brightdesk and does not grant trademark rights to the Brightdesk name, wordmark, product names or logos.

Do not describe an MIT-licensed repository as protected from all copying or reuse. On 29 November 2026 the owner directed a future non-MIT Brightdesk Freeware Licence for eligible Brightdesk-owned customer software. This supersedes the previous future-target recommendation to retain MIT. It does not revoke or narrow any existing MIT grant. Keep current MIT-covered files and notices unchanged until the contributor/rights-holder audit, required written permissions, file-level third-party review, clear prospective version/file boundary and qualified legal review are complete. Do not apply the draft to current code as though it overrides MIT. The proposed terms and decision record are kept separately in the private Brightdesk-Archives repository.

## Brightdesk names and brand assets

The MIT licence for software does not grant permission to use Brightdesk's name, wordmark, product names, logos, icons, artwork, distinctive interface assets or other brand identifiers as if a fork or third-party product were an official Brightdesk release.

- Do not imply that a fork, derivative, package, website or service is an official Brightdesk product or is endorsed by Brightdesk.
- Do not copy Microsoft, Adobe or another third party's logos, product artwork, source code or distinctive trade dress. Product-workflow inspiration is not permission to copy protected material.
- Keep original Brightdesk brand assets separate from third-party assets and maintain their provenance.
- Do not claim that a trademark is registered, or that a particular legal right has been formally granted, unless that status has been independently verified.

## Third-party material and licence evidence

A repository may contain more than original source code. Fonts, dictionaries, language packs, icons, illustrations, photographs, audio, video, models, datasets, templates, sample files and generated or imported assets may each have different legal terms.

For every third-party item proposed for source control, bundling, embedding, distribution or customer download, record:

1. Item name and exact version or revision.
2. Author, creator, foundry or publisher, where known.
3. Original source and acquisition date.
4. Exact licence name and a copy or stable reference to its licence text.
5. Whether modification, redistribution, commercial use, embedding, subsetting, bundling and offline distribution are permitted.
6. Required attribution, notices, reserved names, trademark conditions and other restrictions.
7. SHA-256 checksum of the exact acquired file or pack.
8. The Brightdesk repository/path and intended use.

**Free to download does not automatically mean free to redistribute or embed.** Do not add, package or publish an item when its source, licence, rights or checksum cannot be verified. Quarantine it from release builds until the evidence is complete.

Keep third-party notices and any item-level inventory in the relevant repository. Do not treat a single repository-level MIT file as the licence for every font, image, dictionary, model or dataset inside that repository.

## Repository-specific licensing boundaries

- Original software code may use the approved software licence only after confirming that the repository's content and contribution provenance support that choice.
- Documentation and help content may require a documentation-specific licence; do not assume the software MIT file automatically covers all written content or screenshots.
- Fonts, Assets, Localization and Archives require item-level provenance and licence checks. Do not apply one blanket licence to their contents.
- Brightdesk-AI, Engine, Design-System, Common-Libs, Common-Actions, Developer-Tools, Extensions, Release-Tools, Services, Type-Preview, Printing and Voice must each be reviewed according to their actual source, documentation, bundled assets and third-party dependencies before adding a root-level licence.
- A third-party dependency's licence does not become Brightdesk's licence, and Brightdesk must preserve each dependency's required notices in distributed packages.

## Pull-request and release checks

Before accepting a licence or asset change:

- Confirm the copyright holder is the Brightdesk project identity where appropriate and no personal identifying details have been introduced.
- Check the exact licence text, provenance and affected files.
- Regenerate and verify third-party notices when distributed contents change.
- Verify the release package includes required notices and does not bundle quarantined or unverified items.
- Keep licence changes in a focused pull request, describe exactly which files and rights are affected, and do not merge or publish without the owner's required review and release approval.

This document is an internal project policy, not legal advice. For material licensing, trademark or ownership decisions, obtain qualified legal advice rather than making assumptions from repository metadata alone.
