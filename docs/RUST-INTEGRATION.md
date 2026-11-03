# Rust integration standard

## Purpose

Rust is being added as a complementary core for deterministic, performance-sensitive and security-sensitive domain logic. It is not a replacement for the existing Electron, Node.js, HTML, CSS or JavaScript application.

## Initial integration boundary

- The existing Electron main process, preload bridge, renderer isolation, user data, installers and release version remain unchanged.
- The `rust/` directory is a standalone Cargo library foundation. It currently exposes only engine identity and a versioned host-protocol contract; no existing app feature has been rewritten in Rust.
- The crate has no third-party Rust dependencies and forbids unsafe Rust.
- Rust code must not access the network, write user files, read secrets, spawn processes, or bypass the existing Electron IPC boundary.
- Brightdesk-AI remains a separate private development project and must never be bundled into customer products.

This first step intentionally does not build or ship a native addon or sidecar executable. A Node-API/NAPI-RS or sidecar bridge can be introduced for a specific feature only after the Electron ABI, platform packaging, startup, permissions and failure-recovery behavior have been tested on Windows, macOS and Linux.

## Toolchain and checks

The repository pins Rust **1.99.1** in `rust-toolchain.toml`. The current crate requires Rust 1.88 or newer, has no external dependencies, and commits its Cargo lockfile.

From the repository root, run:

```sh
rustup toolchain install 1.99.1 --profile minimal --component rustfmt --component clippy
cargo fmt --manifest-path rust/Cargo.toml --all -- --check
cargo clippy --manifest-path rust/Cargo.toml --locked --all-targets -- -D warnings
cargo test --manifest-path rust/Cargo.toml --locked
```

The existing Brightdesk-Pages maintenance controller runs the Rust checks for the suite and private app repositories. Brightdesk-Pages checks its own Rust crate in its controller validation job. Brightdesk-AI runs its Rust tests in a separate network-isolated container. These checks are additive to, not replacements for, the existing Node.js checks.

## Future app repositories

Brightdesk-Lists, Brightdesk-Planner, Brightdesk-To-Do and Brightdesk-Workspace are not created by this change. When the owner creates them, they should adopt this same pinned toolchain, `rust/` crate structure, lockfile, protocol contract and validation commands before app-specific Rust code is introduced. Only after a repository exists and is accessible should its exact name be added to `matrix.project` in `Brightdesk-Pages/.github/workflows/brightdesk-private-maintenance.yml`; the existing controller will then pick up its conditional Rust formatting, Clippy and Cargo test checks. Do not add future repository names to the active matrix before those repositories exist.

## Change control

Do not change customer-facing version 0.1.0, npm dependencies, `package-lock.json`, installer configuration, release workflows or existing application behavior as part of this foundation. Any runtime bridge or migration of JavaScript behavior requires separate tests and review.
