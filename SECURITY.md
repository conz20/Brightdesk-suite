# Brightdesk Security Policy

**Repository:** Brightdesk-suite  
**Owner model:** Owner-controlled; all collaborator access is explicitly approved per repository.

## Supported versions

The 0.1.0 release is still in preparation. Until a stable release is published, security fixes are assessed against the default `main` development branch and the exact affected commit. Once a stable release is published, the supported-version statement will be updated alongside the release.

## Reporting a vulnerability

Do not publish vulnerability details, exploit steps, credentials, private data or unreleased security information in public issues, pull requests, discussions or commits.

- **Public repositories:** Use GitHub's **Security → Report a vulnerability** option only when it is visible and enabled for this repository. A `SECURITY.md` file alone does not enable private vulnerability reporting.
- If the private report option is unavailable, do not disclose technical details. Request a private reporting route using a message that contains no reproduction, exploit, secret or sensitive information.
- **Private repositories:** Keep reports within an owner-approved private channel. Do not copy private source, customer content or build output to an unapproved external service.

No bug bounty or fixed response-time commitment is currently offered. Use synthetic data and include only the affected component, commit/version, impact and minimum reproduction needed to investigate. Never attach customer files, personal information, credentials, tokens, signing keys or recovery codes.

## Scope and privacy

This policy covers source code, dependencies, build and release workflows, installers, update/download paths, local data handling and repository configuration.

Brightdesk products are intended to remain local-first. Security changes must not silently introduce telemetry, advertising, cloud synchronisation, remote AI processing or customer-content uploads.

## Response and handling

- Treat reports as confidential and share details only with people explicitly approved by the owner.
- Preserve the minimum non-sensitive evidence needed to investigate and reproduce the issue.
- Revoke or rotate any credential that may have been exposed; removing it from a later commit is not sufficient.
- Review affected dependencies, workflows and release artifacts where applicable.
- Record the affected component, fix commit and verification without retaining unnecessary sensitive material.
- Coordinate any public disclosure after the fix and impact have been assessed.

## Repository access

A report, issue, pull request, fork or contribution does not grant repository access. Collaboration permissions remain repository-specific and require explicit owner approval.

## Release security

Official Brightdesk packages must pass the release gates for tests, licence review, dependency review, checksums and provenance, plus signature verification where signing is enabled. Do not describe a checksum as a digital signature or say signing is active until a signed release has actually been verified.
