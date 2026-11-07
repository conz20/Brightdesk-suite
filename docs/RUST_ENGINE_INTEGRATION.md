# Rust Node-API engine integration

Brightdesk builds the shared Rust engine as a Node-API 8 native library in each desktop repository. Electron and Node.js retain application orchestration, UI state, file I/O, and provider selection. Rust performs bounded source chunking and analysis plus deterministic embedding-vector operations.

## Native boundary and app API

- The Electron main process loads `native/brightdesk_engine.node`; the renderer never loads native code directly.
- Each `native:*` IPC handler verifies that its sender is the trusted main application window before dispatching to Rust.
- The context-isolated preload exposes the following methods on `window.brightdesk`:
  - `getNativeEngineInfo()`
  - `chunkSource(source, maxBytes?)`
  - `analyzeSource(source)`
  - `normalizeEmbedding(values)`
  - `cosineSimilarity(left, right)`
  - `rankEmbeddings(query, candidates, limit?)`
- The native library is packaged outside Electron ASAR. The generated binary is not committed.

Rust enforces bounded source input, valid finite vector values, vector-dimension limits, candidate limits, and stable ranking. UI code can use these methods through the preload without receiving Node.js or native-module access.

## Model and code-embedding collaboration

Application code and model selection remain in JavaScript. The provider-neutral `createEmbeddingBridge(provider)` accepts an injected provider implementing `embed(text)`. Any explicitly configured model or code-embedding provider can return vectors through the same adapter; Rust normalizes, compares, and ranks those vectors.

The bridge is implemented and unit-tested, but it currently has no production call site in the Suite product code or Brightdesk-AI, and no semantic-embedding provider is configured. It is an integration interface, not evidence that semantic AI features are already active. A future integration must explicitly select and configure a provider and pass its returned vectors through this adapter.

The Rust engine does **not** generate semantic embeddings or call language models. Vector math is not a substitute for a semantic embedding model. No remote model provider, credential, paid API, or remote source upload is enabled. A remote provider requires separate owner approval for provider identity, data handling, retention, endpoint, and cost before source text is sent.

Brightdesk-AI remains a private control plane and is not bundled into customer applications. Customer apps work independently and do not need an AI account, private credential, subscription, or remote model.

## Build and packaging

- `npm run native:build` compiles the Node-API module.
- `npm run rust:fmt` formats the Rust workspace.
- `npm run rust:test` runs Rust unit tests.
- `npm run rust:check` runs formatting, Clippy, tests, and native compilation.
- Installer build scripts compile the native addon before packaging. Run `npm run native:build` when you want to build it explicitly during development.
- Ordinary `npm start` and `npm test` remain available without a compiled addon and use the bounded JavaScript fallback when native loading is unavailable.

The fallback preserves the same host-facing source-analysis and vector-operation contract. It does not replace native verification: a platform is not verified until its native Node-API module loads with `native: true` and passes the native-required tests.
- Windows and Linux build the native addon for the runner architecture. macOS builds both `aarch64-apple-darwin` and `x86_64-apple-darwin` libraries and combines them into a universal module for the universal desktop installer.
- The manual release workflow has separate self-hosted Linux x64, Windows x64 and macOS ARM64 build jobs. Each job now runs the Rust engine and provider-bridge tests with `BRIGHTDESK_REQUIRE_NATIVE_ENGINE=1` after building its platform addon. Those checks are evidence only after the corresponding runner actually executes them successfully.
- The release-artifact verifier checks expected installer files, non-zero sizes and SHA-256 hashes. It does not itself install or launch the packaged product.

The Rust toolchain is pinned to 1.99.1. The dedicated Rust engine workflow runs on the available self-hosted runner; the release matrix supplies the additional per-platform native-load checks. The separately maintained product repositories still have their own `brightdesk_native.node` builds and loaders. They are distinct from the Suite's `brightdesk_engine.node` and are not yet proven to share the same implementation.
When `BRIGHTDESK_REQUIRE_NATIVE_ENGINE=1` is set, a missing or incompatible native addon is fatal instead of selecting the fallback. The Rust engine workflow and each release-matrix platform check set this flag. Ordinary development and customer startup remain fallback-tolerant when the native library cannot load.
