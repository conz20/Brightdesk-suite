# Brightdesk release gate

This document is the single checklist that must be completed before any Brightdesk suite or product release is published. It consolidates automated gates, manual QA, the dependency-advisory decision and owner sign-off. A release is approved only when every applicable BLOCKER item is checked and the sign-off table is complete.

## 1. Release identity

- [ ] Suite version: ______
- [ ] Products included: ten approved only (Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do, Workspace)
- [ ] Excluded products absent (Outlook, OneDrive, Teams): confirmed
- [ ] Release commit SHA: ______
- [ ] Release owner: ______
- [ ] Release scope: suite / product(s): ______

## 2. Automated gates — BLOCKER

Run on the release commit in the suite and in each product repository whose installer is being published:

- [ ] `npm run check:node` confirms Node.js 24.22.2.
- [ ] `npm run lock:verify`.
- [ ] `npm ci --no-audit --no-fund` from a clean checkout.
- [ ] `npm run verify:licenses`.
- [ ] `npm test` — full suite, including upgrade-preservation, dependency-security compatibility, native-engine integration, NSIS-uninstaller and Focus Mode regression coverage.
- [ ] `cargo test --manifest-path rust/Cargo.toml --workspace --locked`.
- [ ] `cargo fmt --manifest-path rust/Cargo.toml --all -- --check`.
- [ ] `cargo clippy --manifest-path rust/Cargo.toml --workspace --all-targets --locked -- -D warnings`.
- [ ] `npm run release:preflight`.
- [ ] `npm audit --audit-level=high` — no high or critical findings.
- [ ] Product test jobs have executed successfully on their release commits, or a documented owner-approved alternative verification path and its evidence are attached. A workflow run with no assigned runner and no executed steps is not a test pass.

Do not mark native-engine approval solely because Rust tests pass or a native module loads. The Rust core and Node-API bridge are separate concerns. Before shipping or relying on the Node-API bridge, record the architecture decision and representative CPU-heavy benchmark/parity evidence. Until that approval exists, verify the safe Rust core and the application's graceful fallback; make no performance claim.

## 3. Artifact verification — BLOCKER

On native Windows, macOS and Linux build hosts, for the suite and every product being published:

- [ ] The appropriate `dist:*` or `dist:product:*` command produces the expected platform file set.
- [ ] The corresponding `verify:*` or `verify:product:*` command passes without bypasses or verifier changes.
- [ ] Product artifact filenames match `src/standalone-downloads.js` and `scripts/verify-standalone-apps.js`.
- [ ] SHA-256 manifest is re-read and verified against the exact installer bytes.
- [ ] Legal files are present in every installer: `TERMS_AND_CONDITIONS.txt`, `LICENSE` and `THIRD_PARTY_NOTICES.md`.
- [ ] Signing and notarisation status is reported truthfully. Do not claim signing or notarisation without actual credentials and verification.
- [ ] Windows installer completes and the NSIS uninstaller patch is present.
- [ ] No installer is described as ready unless its actual platform build, legal files, checksum and release-test evidence exist.

## 4. Manual QA — BLOCKER

Complete for each product and each platform being released. Record the platform, OS version, product version, tester, date and result.

- [ ] * Clean install and first launch succeed.
- [ ] * Product name and original product artwork are correct in the installer and application window.
- [ ] * Only the named product is reachable from a product-specific installer.
- [ ] * First-launch terms gate works and its acceptance record persists in the expected user-data location.
- [ ] * No unexpected Electron DevTools console errors occur at launch.
- [ ] * The product's primary surface can create and save a representative document, record or task without an error.
- [ ] * Upgrade from the previous supported version preserves user documents and product identity.
- [ ] * Upgrade creates no duplicate Start menu, Applications or desktop entries.
- [ ] * Uninstall removes the application and its menu entries without deleting user documents.
- [ ] * Native-engine behaviour matches the approved architecture decision in section 2; record the exact `getNativeEngineInfo()` output where the API is present.
- [ ] Windows: uninstaller entry is present and uninstall does not hang.

Focus Mode is a Pages feature. Test it in the integrated suite or a Pages build, not inside To Do or Workspace installers whose launch ID locks the interface to a single product:

- [ ] * In Pages, open View and toggle Focus Mode on. Confirm the document bar, ribbon tabs and toolbar hide while the editor remains visible.
- [ ] * Toggle Focus Mode off. Confirm the document bar, ribbon tabs and toolbar return.
- [ ] * No ReferenceError or other console error occurs during either toggle.

Do not require the Pages Focus Mode control to appear inside product-locked To Do or Workspace interfaces.

## 5. Dependency-advisory decision — BLOCKER

Choose exactly one and attach the matching evidence:

- [ ] (a) Remediated: `npm audit --json` reports zero moderate-or-higher advisories on the release commit. Attach the audit summary.
- [ ] (b) Override applied: `npm audit --json` reports zero moderate-or-higher advisories; the override and rationale are documented; the full test suite and relevant dependency round-trip tests pass.
- [ ] (c) Exception approved: every remaining advisory is listed with affected dependency paths, impact assessment, evidence, named approving owner, expiry/review date and remediation plan.

Exception record:

- Advisories remaining: ______
- Advisory IDs and dependency paths: ______
- Evidence and impact assessment: ______
- Remediation plan: ______
- Approving owner: ______
- Review date / expiry: ______

Current scoped overrides replace ExcelJS's `uuid@8.3.2` with `uuid@11.1.1`, and app-builder-lib's `minimatch@10.2.6` with `minimatch@11.0.4`. The compatibility tests must pass on the release lockfile. Older nested `minimatch@3.1.5` and `minimatch@5.1.9` remain intentionally unforced because of their legacy CommonJS API contract. The wider GitHub Advisory Database range is under review in [issue #10811](https://github.com/github/advisory-database/issues/10811); this is not a formal advisory correction. Do not infer the current advisory count from an earlier report. Use the actual `npm audit --json` result from the release commit and record the exact remaining package paths.

## 6. Documentation consistency — BLOCKER for product releases

- [ ] `docs/PRODUCT-REPOSITORIES.md` matches the current remote repository and source-population state.
- [ ] Each published product README has correct product identity, installer instructions and the shared-engine trade-off paragraph.
- [ ] Release notes use the first-post-fix template and report actual advisory status and artifact filenames.
- [ ] Known limitations, including any unverified platform or native-engine behaviour, are disclosed.

## 7. Publication controls

- [ ] Release tag matches the approved version and release commit.
- [ ] Publication is a separate, explicit owner action; workflow publication defaults to disabled.
- [ ] Before enabling publication, the release owner manually confirms that the completed release identity, automated results, artifact checks, manual QA, dependency decision and platform sign-offs are recorded in this document and backed by evidence.
- [ ] Release assets and checksums are inspected before publication.

Publication is a manual owner-controlled step. The current workflow exposes a separate `workflow_dispatch` input whose default is `false`; it does not independently validate the sign-off table or human signatures. Do not enable that input until the release owner has reviewed and recorded every applicable BLOCKER item above. A skipped check, a runner failure before any steps execute, or an `npm audit --audit-level=high` pass with moderate findings is not release approval.

## 8. Sign-off

| Role | Name | Date | Signature / evidence reference |
|---|---|---|---|
| Release owner | | | |
| Build verifier (Windows) | | | |
| Build verifier (macOS) | | | |
| Build verifier (Linux) | | | |

A release is approved only when every applicable BLOCKER item is checked, section 5 has a recorded decision, required manual QA is complete, and sign-off is recorded. Unavailable runners, skipped tests, missing installers or incomplete evidence are not passes.
