# Brightdesk Rust engine roadmap

Date: 2026-11-03

## Decision
Use Rust selectively for performance-critical, platform-independent work. Keep the current Electron shell and JavaScript UI. Do not rewrite the product in Rust merely to match another project's technology choice.

A Rust component is justified only when profiling identifies a hot path and a benchmark demonstrates meaningful improvement without reducing correctness, accessibility, portability or maintainability.

## Proposed boundaries
- Electron / JavaScript: windows, menus, navigation, accessibility, app catalogue, settings, dialogs, installer orchestration and ordinary UI state.
- Rust core: candidate workloads include spreadsheet formula evaluation, large-table transforms, document parsing/indexing, archive validation and checksum-heavy file operations.
- Bridge: expose a small, versioned API through a Node-API binding such as napi-rs only after the Rust core has stable tests and a measured use case. Keep a JavaScript fallback where practical.
- Data contract: explicit serialisable inputs/outputs, stable error codes, bounded payload sizes and no hidden network access.

## Staged implementation

### Stage 0 — Foundation
- Create a Cargo workspace and a safe, dependency-light brightdesk-core crate.
- Establish formatting, linting and unit-test CI.
- Keep the crate independent of Electron and the operating system.
- Do not claim that the current app uses Rust yet.

### Stage 1 — Benchmark
- Profile representative Brightdesk workloads on real project data.
- Record baseline wall time, memory use, input size and correctness fixtures.
- Select one workload only if it is demonstrably CPU-bound.

### Stage 2 — Native bridge prototype
- Add a Node-API binding for the selected workload.
- Build/test on Windows x64, macOS universal where supported and Linux x64.
- Add architecture-specific native artifacts and packaging checks.
- Preserve a JS fallback and test parity against the same fixtures.

### Stage 3 — Production decision
Promote the Rust path only if it passes correctness, security, packaging and performance acceptance criteria. Otherwise keep the tested JavaScript implementation and record the benchmark result.

## Safety and quality requirements
- Forbid unsafe Rust in the initial core crate.
- No network, telemetry, updater, installer or filesystem privilege behaviour inside the core library.
- Validate lengths, indices, numeric edge cases and malformed input.
- Run cargo fmt --check, cargo clippy --workspace --all-targets --all-features -- -D warnings and cargo test --workspace.
- Keep the exact Node.js 24.22.2 pin unchanged.
- Manage Rust toolchain versions independently from Node.js.

## Exit criteria
The Rust foundation is not a performance claim. Production integration requires a benchmark report, test parity, supported-target builds, package inclusion tests and an explicit release-readiness result.
