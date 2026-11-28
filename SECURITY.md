# Brightdesk Security Policy

**Policy owner:** Brightdesk project  
**Applies to:** This repository and its source, build, release and distribution processes

## Reporting a security vulnerability

Report suspected vulnerabilities privately. Do not publish exploit details, proof-of-concept code, credentials or sensitive reproduction steps in a public issue, pull request or discussion.

1. Use GitHub's **Security → Report a vulnerability** option only when private vulnerability reporting is enabled for this repository.
2. If that option is unavailable, request a private reporting route without including technical details. Do not assume that a private advisory channel is enabled.
3. Share only the minimum information needed to identify and reproduce the issue. Use synthetic examples and test data.

## Scope

This policy covers:

- Application source code and dependencies.
- Build scripts, GitHub Actions and release workflows.
- Installers, update packages, download endpoints and signing processes.
- Local data storage, import/export and file handling.
- Repository permissions, secrets and access controls.

Brightdesk products are designed to remain local-first. A security change must not silently introduce telemetry, advertising, analytics, crash reporting, cloud synchronisation, remote AI processing or customer-content uploads.

## Information not to include

Never send real customer documents, personal information, authentication tokens, passwords, private keys, signing certificates, recovery codes, private logs, recordings, transcripts or other sensitive data in a report.

If a credential may have been exposed, revoke or rotate it promptly and record only the minimum non-sensitive evidence needed for follow-up.

## Triage and response

Brightdesk maintainers will assess reports, determine affected versions and components, and coordinate a fix and disclosure where appropriate. Do not assume a response deadline or that a reporting feature is active unless the repository's current settings confirm it.

Keep vulnerability details confidential and share them only with people explicitly approved for the affected repository. Preserve enough non-sensitive evidence to verify the fix, then remove unnecessary copies.

## Repository access

A report, issue, pull request, fork or contribution does not grant repository access. Any collaboration requires explicit Brightdesk owner approval for the specific person, repository, permission level and task. Never share account passwords, passkeys, tokens, signing keys or recovery codes.
