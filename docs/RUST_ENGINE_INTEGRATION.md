# Rust engine integration

Brightdesk-suite now contains a local Rust workspace and a Node.js process bridge. Rust owns bounded source chunking, lightweight source statistics and deterministic lexical feature vectors. The Electron application and JavaScript services remain the orchestration and compatibility layer.

## Runtime boundary

The bridge communicates with the Rust executable using one JSON request and one JSON response over standard input/output. Diagnostics use standard error. The bridge has a request timeout and returns a clear `RUST_ENGINE_NOT_BUILT` error when the native executable is absent, allowing the existing JavaScript path to remain available.

## Build and verify

- `npm run rust:fmt` checks formatting.
- `npm run rust:test` runs Rust unit tests.
- `npm run rust:build` builds the release executable.
- `npm run rust:check` runs formatting, lint, tests and build.

The CI matrix targets Linux, Windows and macOS. No Rust binary is committed; it is built from source on the target platform.

## Model and embedding boundary

The current 384-dimensional feature vector is deterministic lexical hashing, **not** a semantic embedding. No language-model provider or remote embedding API is enabled. Future adapters must be provider-neutral, local-first where possible, explicitly configured, and must not upload customer documents or private source without separate approval.

Brightdesk-AI remains a separate private control plane and is not bundled into customer installers. No customer feature depends on Brightdesk-AI credentials or a paid model service.
