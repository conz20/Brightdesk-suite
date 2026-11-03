# Rust integration foundation — Brightdesk-suite

## Purpose

This repository participates in one consistent Rust engineering approach across Brightdesk. Rust is an additional implementation tool, not a replacement for the existing JavaScript/Electron application, product identity, workflows or Node.js runtime.

**Current status:** integration contract and future-ready boundary only. This document does not claim that Rust is compiled into this repository, linked to Electron, shipped in installers, or improving performance.

## Repository role

Integrated ten-app desktop suite.

The suite owns the first shared Rust foundation. The existing Rust core proposal is on draft PR #19 and is not yet merged into main or connected to Electron. Keep its current review path intact.

## Shared engineering rules

1. Keep Electron and JavaScript responsible for the existing UI, accessibility, menus, navigation, settings and ordinary application workflows.
2. Use Rust only for a specific workload when profiling demonstrates a meaningful CPU, memory or reliability benefit.
3. Keep Rust platform-independent where practical. Start with safe Rust and forbid `unsafe` unless a separately reviewed, documented need is approved.
4. Do not add network access, telemetry, updater behaviour, installer privileges, credential handling or hidden filesystem access to core libraries.
5. Define narrow, versioned, serialisable input/output contracts, bounded payload sizes and stable error codes.
6. Preserve a JavaScript implementation as a fallback where practical. Require parity tests using the same fixtures before enabling a native path.
7. Do not introduce a Node-API binding (for example, napi-rs) until the workload is benchmarked and the core implementation has tests. Native dependencies must be built and verified on each supported operating system and architecture before packaging.
8. Keep Rust toolchain management separate from the exact Node.js **24.22.2** requirement. Do not change the customer release version **0.1.0** or the existing npm lockfile because Rust is being introduced.
9. Use Cargo's lockfile for executable/workspace builds; review every dependency and its licence. Prefer a small dependency footprint.
10. Never publish releases, upload installers, enable paid services or broaden repository permissions as part of Rust integration.

## Standard checks for a Rust workspace

When a real Rust crate is added, CI must run:

```sh
cargo fmt --all -- --check
cargo clippy --workspace --all-targets --all-features -- -D warnings
cargo test --workspace --all-features
```

The checks must run only when Rust source, Cargo manifests/lockfiles or the Rust workflow changes. CI must use read-only permissions unless a narrowly justified task requires otherwise.

## Staged integration

- **Foundation:** agree on this contract and retain the existing app behaviour unchanged.
- **Workload selection:** profile real representative tasks and record baseline time, memory, input sizes and correctness fixtures.
- **Rust implementation:** implement one isolated, safe crate for a workload with tests and explicit error handling.
- **Bridge prototype:** add a narrow Node-API boundary only after the Rust crate and benchmark justify it; retain a JavaScript fallback.
- **Acceptance:** compare outputs against the JavaScript implementation, test edge cases, build on Windows/macOS/Linux, inspect package contents and measure real performance.
- **Decision:** enable Rust in production only when correctness, security, packaging and performance gates all pass. Otherwise retain the JavaScript path.

## Future repositories

New Brightdesk application repositories (Lists, Planner, To Do and Workspace) must adopt this same contract when they are created. Do not create those repositories automatically and do not copy Rust source into them before their own requirements and workload have been reviewed.

## References

- [Rust getting started](https://rust-lang.org/learn/get-started/)
- [Brightdesk Office Suite](https://github.com/connormolloy12/Brightdesk-suite)

