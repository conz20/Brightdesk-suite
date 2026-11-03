# Rust Node-API engine integration

Brightdesk uses one shared Rust engine through a small Node-API native library. Electron and Node.js retain application orchestration, file I/O, UI state, and provider selection. Rust handles bounded source chunking and statistics plus embedding normalization, cosine similarity, and deterministic candidate ranking.

## Native boundary

- Rust is compiled as a Node-API 8-compatible dynamic library and loaded in the Electron main process.
- The renderer never loads a native addon directly. The existing context-isolated preload exposes only a read-only engine information call.
- The same Rust source builds independently in each desktop repository, so the suite and standalone products do not depend on a private runtime service.
- The compiled `native/brightdesk_engine.node` file is generated locally and unpacked from Electron ASAR at packaging time. It is not committed.

## Language-model and embedding collaboration

Provider selection and model requests remain in the existing JavaScript/Node orchestration layer. Any explicitly configured embedding provider can return vectors to the same Rust normalization, similarity, and ranking functions. This allows different models and code-embedding providers to work through one common contract without coupling the engine to a vendor.

The native engine does **not** generate semantic embeddings or call a language model. Deterministic vector operations are not semantic embeddings. No remote provider, credential, paid API, or remote source upload is enabled by this integration. An external provider must be separately approved for data handling, retention, and cost before source text is sent to it.

Brightdesk-AI remains a private control plane and is not bundled into customer applications. Customer apps continue to run without an AI account or private AI credential.

## Build and verification

- `npm run native:build` builds the Node-API module with Rust 1.99.1.
- `npm run rust:fmt` checks formatting.
- `npm run rust:test` runs Rust unit tests.
- `npm run rust:check` runs formatting, Clippy, tests, and the native build.
- `npm start`, `npm test`, and installer build scripts compile the native addon before use.
- CI builds and tests on Linux, Windows, and macOS.

Tests cover the Node-API boundary, invalid vectors, Unicode-safe chunking, ranking order, provider-neutral embedding normalization, and the Electron main/preload boundary. The actual native module must pass the platform CI matrix before this integration is considered verified.
