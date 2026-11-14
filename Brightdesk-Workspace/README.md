# Brightdesk Workspace

![Brightdesk Workspace repository banner](assets/social-preview.svg)

![Brightdesk Workspace product artwork](assets/brightdesk-product.svg)

Combine notes, lists, tasks and project material in one local workspace.

Brightdesk is an independent desktop product. This repository is the dedicated desktop version of **Brightdesk Workspace**. It uses the shared Brightdesk desktop engine and opens directly into this product, with product switching disabled.

## What this product does

Combine notes, lists, tasks and project material in one local workspace.

## Download

The latest desktop installers are published from this repository’s verified release workflow when a release is approved.

| Platform | Installer |
| --- | --- |
| Windows | Windows x64 installer (.exe) |
| macOS | Universal installer (.dmg), package (.pkg) and archive (.zip) |
| Linux | x64 AppImage and Debian package (.deb) |

The complete ten-product desktop suite remains available from [Brightdesk-suite](https://github.com/connormolloy12/Brightdesk-suite).

## Quality and security

Pull requests and pushes run the product and shared-engine test suite, verify the dependency lock and third-party licences, check release preflight and block high-severity dependency vulnerabilities. The same checks repeat daily. Dependabot checks npm packages and GitHub Actions weekly.

Installer builds are started manually. Publishing a GitHub Release is a separate manual choice and is disabled by default.

## Run from source

Use Node.js **24.22.2**.

    npm ci
    npm start

To build an installer on its native operating system:

    npm run dist:product:mac
    npm run verify:product:mac

Use win on Windows or linux on Linux instead of mac.

## Project structure

- src/ — Brightdesk desktop renderer and product modules.
- assets/brightdesk-product.svg — original product artwork.
- scripts/ — build and release verification tools.
- tests/ — automated product and shared-engine tests.

## Related project

[Brightdesk Office Suite](https://github.com/connormolloy12/Brightdesk-suite) brings all ten approved Brightdesk products together in one desktop installer.

## Identity and licence

Brightdesk is independent and is not affiliated with Microsoft. It uses original product names, code, interface design and artwork. See LICENSE, TERMS_AND_CONDITIONS.txt and THIRD_PARTY_NOTICES.md.


## Customer Help

The Brightdesk Workspace desktop experience includes a small, discreet **Help** link near the bottom of its persistent left sidebar. It opens the central, read-only customer guide at the reserved address `https://help.brightdesk.com/products/workspace.html` in the customer's normal browser. The Help website is not live or verified yet; this link must not be released until the production domain and deployment are verified. Approved Wiki guide updates appear the next time customers open Help and do not require a new Brightdesk installer. Opening Help sends no document or product data.
