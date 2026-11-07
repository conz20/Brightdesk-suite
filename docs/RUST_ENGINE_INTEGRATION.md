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

The bridge in this Suite repository is implemented and unit-tested, but it is not currently called by a customer-facing Suite product feature. Separately, Brightdesk-AI has an opt-in local Qwen3-Embedding 0.6B provider. Its `createBrightdeskCollaborator()` runtime exposes `embed()` and `rank()` through the AI repository's own JavaScript bridge, with Rust processing provider-produced vectors. The live local embedding smoke test passed on the owner-managed macOS ARM64 runner in Brightdesk-AI PR #17 (run [41774015452](https://github.com/connormolloy12/Brightdesk-AI/actions/runs/41774015452)); the real 1024-dimensional Qwen vector was normalized by the native Rust engine. The provider remains disabled by default and requires explicit opt-in plus the local loopback embedding server. This is an AI engineering capability, not a customer-product feature or a shared runtime module between the two repositories.

## Separately maintained product repositories

The ten product repositories currently contain their own `brightdesk_native.node` Node-API wrappers, but source inspection shows those wrappers export only `engineInfo()`. Their Electron main-process/preload bridge only requests that metadata. Their repeated `brightdesk-core` foundation currently contains an A1 cell-address helper and explicitly states that it is not yet linked into Electron. Therefore, those product-repository-local binaries do not currently provide the Suite engine's source-analysis or vector APIs to product JavaScript. This does not affect the integrated Suite product installers built by this repository: those installers include the shared `native/brightdesk_engine.node` module through `electron-builder.app.config.js`. The independent product repositories need a deliberate shared-engine adoption or product-specific Rust integration before their own builds can claim the same capability.

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
