# Brightdesk product scope lock

The approved Brightdesk product scope contains exactly these ten products:

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

The first-release lineup is all ten products above. The Product Centre must show every product, its original Brightdesk artwork, name, short explanation and accurate availability status.

## Version 0.1.0 implementation status

All ten products are integrated into the Brightdesk desktop suite. Each has a catalogue entry, a dedicated workspace, connected local-service or document-engine functionality, automated tests and a product-specific desktop installer target.

The project release gate must still pass the full test suite, dependency and licence checks, release preflight, and native Windows, macOS and Linux installer verification before a release is described as ready.

## Separate product repositories

Brightdesk-suite remains the complete integrated desktop suite. Each product repository is a separate code and documentation home for its named product. Product repository folders are generated from the same suite source and tested package lock.

A generated folder is not a GitHub repository. A product repository is only considered created after GitHub confirms the repository exists and its source has been pushed.

## Explicit exclusions

Outlook, OneDrive and Teams are not part of Brightdesk and must not be added.

## Change control

This scope can change only when the user explicitly instructs. Do not infer approval to add products from a technical dependency, design reference or workflow comparison.

## Identity

Brightdesk is independent and is not affiliated with Microsoft. Use original code, product names, interface design and assets. Microsoft product names may be used only as internal comparisons to explain familiar workflows.
