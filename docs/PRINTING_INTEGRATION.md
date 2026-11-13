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

## Platform-native discovery and packaging

The shared source snapshot includes the native macOS and Windows discovery
helpers and their build scripts:

- **macOS:** `npm run native:build` compiles the Bonjour helper with the Xcode
  Swift compiler. The Suite and product electron-builder configurations
  include the helper and unpack it outside ASAR so Electron can execute it.
  Their macOS Info.plists declare `_ipp._tcp`, `_ipps._tcp` and
  `_printer._tcp`, along with the local-network permission explanation.
- **Windows:** `npm run native:build` compiles the WinDNS and WSD helper with
  the Windows SDK and Visual C++ Build Tools. The generated executable is
  included and unpacked outside ASAR. The build must run on Windows with the
  required native toolchain available.
- **Linux:** the adapter uses the host's CUPS `ippfind` utility for IPP/IPPS
  and legacy LPD discovery. Brightdesk does not bundle or install CUPS,
  `ippfind`, drivers or vendor packages. Configured queues remain available
  when `ippfind` is absent, and the user can open the Linux printer settings
  route to add a printer.

A discovered network device is not automatically a usable print queue. The
user adds or pairs it through the operating system, then Brightdesk refreshes
the configured queue list. Brightdesk does not silently create queues or
install drivers.

## Verification boundary

The Suite integration includes virtual-printer tests and source/configuration
checks. Native helper compilation must be verified on its matching operating
system, and real printer discovery, setup, capability reporting and physical
print acceptance still require platform hardware testing on macOS, Windows and
Linux. A virtual queue or successful OS submission callback is not evidence
that a physical page printed.

Do not merge the integration until the current branch's checks pass and the
three platform build and hardware acceptance gaps have been recorded honestly.
