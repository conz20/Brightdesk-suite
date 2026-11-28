# Brightdesk Collaboration Architecture and Ten-Product Rust Rollout

**Status:** Proposed architecture — collaboration is not implemented yet  
**Date:** 2026-11-05  
**Scope:** Exactly the ten approved Brightdesk products

## Decision

Keep local-first use as the default and design opt-in, authenticated real-time collaboration around one shared, versioned protocol and service. Each product keeps its own UI and domain model while reusing common identity, membership, permissions, transport, presence, sync, and recovery components.

Rust is the shared native processing engine, not the collaboration server, identity provider, or document merge model.

## Verified Rust inventory

- Brightdesk Suite has a shared Rust Node-API 8 engine merged to main (PR #38).
- Rust source exists in Brightdesk-Lists, Brightdesk-Planner, Brightdesk-To-Do, and Brightdesk-Workspace.
- Rust source is absent from the current main branches of Brightdesk-Pages, Brightdesk-Sheets, Brightdesk-Decks, Brightdesk-Notes, Brightdesk-Database, and Brightdesk-Forms.
- A Rust folder alone does not prove runtime integration. Each repo must build and load the native addon, expose it only through validated main-process IPC and context-isolated preload, package it, and pass native-required CI.

## Architecture

```text
Product UI + domain model
  -> product collaboration adapter
  -> local persistence + offline outbox
  -> isolated preload API
  -> Electron main-process transport
  -> TLS + authenticated, versioned protocol
  -> Collaboration service
       identity/session validation
       membership + resource permissions
       operation validation + rate limits
       presence + room fan-out
       durable operation log + snapshots
       audit + revocation
  -> durable database + event transport
```

The server is authoritative for identity, membership, access control, accepted operations, audit, and revocation. Presence is ephemeral; operations and snapshots are durable.

## Product-specific merge rules

Do not force one generic CRDT onto every data model. Select and test a suitable model per product:
- Pages and Notes: text/block editing with stable block identifiers.
- Sheets: cell operations and explicit rules for same-cell, formula, range, and structural conflicts.
- Decks: slide/element operations with stable IDs and deterministic ordering.
- Database and Lists: record/field operations with uniqueness and validation constraints.
- Forms: schema versions separated from response submissions.
- Planner and To Do: task operations with explicit status, assignee, and due-date conflict rules.
- Workspace: page/block operations and references to shared resources.

## Security and privacy

- TLS, short-lived sessions, refresh and revocation.
- Server-side authorisation on every read, write, room join, subscription, export, and invitation.
- Least-privilege roles, auditable membership changes, schema validation, payload limits, and rate limits.
- Encrypt durable sensitive data at rest; define key management, retention, backup, and deletion before production.
- Never log document bodies, credentials, or tokens.
- Local-only mode must not initiate a network connection.
- Collaboration must be opt-in with visible local/shared/syncing/offline/conflict states.
- Revocation must terminate active subscriptions and reject subsequent operations.

## Rust standard for all ten product repositories

Each repository must contain:
- Pinned Rust toolchain and committed Cargo.lock.
- Engine source/API aligned with the Suite baseline.
- Node-API 8 native build script and platform packaging.
- Main-process-only native loading and sender-validated IPC.
- Narrow context-isolated preload API with argument validation.
- JavaScript fallback for ordinary development; native-required CI for proof.
- Rust unit tests, JS parity/contract tests, and native-required integration tests.
- CI for formatting, Clippy, Cargo tests, native compilation, and bridge tests.
- Ignore rules for every Cargo target directory and generated .node files.

## Delivery phases

1. **Rust parity:** bring Pages, Sheets, Decks, Notes, Database, and Forms to the shared baseline; audit Lists, Planner, To Do, and Workspace for actual runtime parity.
2. **Collaboration foundation:** implement authentication, invitations, membership, permissions, room lifecycle, presence, durable operations, reconnect, revocation, and observability.
3. **Pilot:** select one product after reviewing its data model; prove two-client edits, offline outbox/replay, reconnect, conflict handling, denial, revocation, audit, and recovery.
4. **Ten-product rollout:** implement product-specific adapters and run shared protocol contract tests plus product workflow tests.
5. **Release readiness:** update README claims and capture real screenshots only after implementation and current-build tests pass. Release publishing remains manual.

## Acceptance gates

- All ten repos build and load native Rust on supported platforms; CI requires native mode and cannot silently pass on fallback.
- Two clients converge after concurrent edits; reconnect replays operations exactly once.
- Local-only mode never uploads data.
- Unauthorised and revoked users cannot read, join, subscribe, edit, export, or invite.
- Malformed, oversized, stale-version, and replayed operations are rejected.
- Restart recovery works from durable snapshots and operation logs.
- All ten adapters pass the same protocol contract tests.
- Documentation and screenshots match verified behaviour.

## Decisions still required before production

Hosting provider/region/cost, identity provider, database and event transport, encryption/key management, retention/deletion, guest access, pilot product, and availability/performance targets. No real user content should be sent to a hosted service before these decisions and privacy/security reviews are complete.
