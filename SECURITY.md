# Bright Desk Security Policy

## Reporting a vulnerability

- **Public repositories:** Use the repository's **Security → Report a vulnerability** option only when GitHub private vulnerability reporting is enabled.
- If that private reporting option is unavailable, do not publish exploit details in a public issue, pull request, discussion, or commit. Request a private reporting route without including technical details.
- **Private repositories:** Keep reports within the repository's existing owner-approved private channel. Do not copy source code, credentials, customer content, or private build output to an external service.
- Use a minimal synthetic example. Never attach real customer files, personal information, authentication tokens, passwords, signing keys, recovery codes, private logs, recordings, transcripts, or other sensitive data.

## Scope

This policy covers source code, dependencies, build and release workflows, installers, update/download paths, local data handling, and repository configuration.

Bright Desk software is intended to remain local-first. Security changes must not silently introduce telemetry, advertising, cloud synchronisation, remote AI processing, or customer-content uploads.

## Response and handling

- Treat reports as confidential and share details only with people explicitly approved by Bright Desk.
- Preserve the minimum non-sensitive evidence needed to investigate and reproduce the issue.
- Revoke or rotate any credential that may have been exposed.
- Record the affected component, fix, and verification without retaining unnecessary sensitive material.
- Do not claim that a vulnerability-reporting feature is enabled unless its GitHub setting has been checked.

## Repository access

A report, issue, pull request, fork, or contribution does not grant repository access. Collaboration permissions remain repository-specific and require explicit Bright Desk owner approval.
