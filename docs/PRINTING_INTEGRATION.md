# Brightdesk Printing in the Suite

The Suite and its ten product windows use the shared adapter from the private
`Brightdesk-Printing` repository.

## Shared source

- Upstream: `conz20/Brightdesk-Printing`
- Mirrored source revision: `70d41095616c6d1cd3473c0ad73a6ecb5a596c05`
- Snapshot location: `src/printing-package/`
- Provenance: `src/printing-package/UPSTREAM.json`

The Printing repository remains the canonical source. Update the checked-in
snapshot from a reviewed upstream commit. The snapshot has no runtime npm
dependencies and is bundled inside the desktop application; customers do not
need registry access or a network connection to use configured system queues.

## Runtime path

The Electron main process creates one adapter per trusted product window.
A narrow preload bridge exposes printer listing, discovery, pairing,
capability reporting, printer settings and print submission. Every IPC
operation checks that its sender is one of Brightdesk's registered application
windows before it reaches the adapter.

The Print action is available in each of the ten product windows. It lists
configured operating-system queues before opening Electron's visible print
dialog. Printer settings is a separate, user-selected hand-off to the operating
system. No printer queue or driver is installed silently.

A successful print submission means the operating system accepted the job. It
does not prove that paper was physically printed.

## Current boundary

The shared adapter source is bundled. The native macOS and Windows network
discovery helper binaries are not yet built and bundled by the Suite packaging
workflow. Until that separate packaging work is completed, network discovery
may return a clear unavailable result; configured system queues and the visible
print dialog remain the first integration path. Linux discovery depends on the
host's `ippfind` utility. Hardware-free tests are used for integration checks.
