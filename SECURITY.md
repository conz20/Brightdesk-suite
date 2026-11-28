# Brightdesk Security Policy

**Repository:** Brightdesk Office Suite  
**Owner model:** Owner-controlled; repository access is granted only with explicit owner approval.

## Supported versions

The 0.1.0 release is in preparation. Until a stable release is published, security fixes are assessed against the default `main` development branch and the exact affected commit. After publication, this section must identify the releases that remain supported.

## Reporting a vulnerability

Do not publish vulnerability details, exploit steps, credentials, private data or unreleased security information in public issues, pull requests, discussions or commits.

- **Public repositories:** Use GitHub's **Security → Report a vulnerability** option only when it is visible and enabled for that repository. A `SECURITY.md` file alone does not enable private vulnerability reporting.
- **If private reporting is unavailable:** Request a private reporting route without including technical details, reproduction steps, exploit code, secrets or sensitive material.
- **Private repositories:** Use an owner-approved private channel. Do not copy private source, customer content or build output to an unapproved external service.

No bug bounty or fixed response-time commitment is offered. Use synthetic data and include only the affected component, version or commit, potential impact and minimum reproduction information needed to investigate. Never attach customer files, personal information, credentials, tokens, signing keys or recovery codes.

## Scope and privacy

This policy covers source code, dependencies, build and release workflows, installers, update and download paths, local data handling, repository configuration and distributed packages.

Brightdesk products are intended to remain local-first. Security changes must not silently introduce telemetry, advertising, analytics, cloud synchronisation, remote AI processing or customer-content uploads.

## Response and handling

- Treat reports as confidential and share details only with people explicitly approved by the project owner.
- Preserve only the minimum non-sensitive evidence needed to investigate and reproduce the issue.
- Revoke or rotate any credential that may have been exposed; removing it from a later commit is not sufficient.
- Review affected dependencies, workflows and release artefacts where applicable.
- Record the affected component, fix commit and verification without retaining unnecessary sensitive material.
- Coordinate public disclosure after the issue and fix have been assessed.

## Repository access

A report, issue, pull request, fork or contribution does not grant repository access. Collaboration permissions remain repository-specific and require explicit owner approval. Do not assume that CODEOWNERS alone enforces review; the corresponding GitHub branch rule must be enabled and verified.

## Release security

Official Brightdesk packages must pass the applicable release gates for tests, licence review, dependency review, checksums and provenance, plus signature verification where signing is enabled. A checksum is not a digital signature. Do not describe signing or customer-side verification as active until signed releases and verification steps have actually been implemented and tested.
