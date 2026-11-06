# Cross-platform release verification

This document defines the final installer-bundle checks for a Brightdesk release. The approved scope remains the ten named products: Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace.

## Native build matrix

The release workflow builds each target on its native operating-system runner, from the same candidate commit and the same dependency lock:

| Platform | Suite outputs | Individual product outputs |
| --- | --- | --- |
| Windows | Brightdesk Office Suite x64 NSIS installer (.exe) | 10 x64 NSIS installers (.exe) |
| macOS | Universal DMG, PKG and ZIP | 10 × universal DMG, PKG and ZIP |
| Linux | AppImage and Debian package (.deb) | 10 × AppImage and Debian package (.deb) |

The intended output count is 66: one Windows Suite file, three macOS Suite files, two Linux Suite files, plus 60 individual-product files. This count is an acceptance target, not evidence of completed builds.

## Per-platform checks

For each platform, the workflow must:

1. Verify the Suite installer names, required legal files and non-empty files.
2. Generate a Suite SHA-256 manifest.
3. Build each of the ten product installers using the product-specific Electron identity and launch restriction.
4. Verify each expected product filename and non-empty file.
5. Generate and re-read a SHA-256 manifest for every product output folder.
6. Preserve the same Terms and Conditions agreement in every Windows NSIS installer and macOS DMG/PKG installer; the Linux packages use the shared first-launch agreement in the product shell.
7. Collect Suite output files and the ten product folders into the platform-specific bundle.
8. Upload the platform bundle only when all preceding commands succeed.

The local `npm run verify:local-release` command follows this sequence on the machine's native operating system. It verifies only that one platform.

## Final combined-bundle checks

After the Linux, Windows and macOS platform artifacts are downloaded into one release directory, the collector runs `npm run release:verify:complete -- release`. The workflow does not upload a second combined Actions artifact. If publishing was explicitly selected, the publish job downloads the three platform artifacts again and repeats the complete verification before attaching the files to the GitHub Release.

The final verifier checks:

- The requested release version matches the root `package.json` and the downloaded lock's root version.
- The downloaded dependency lock is valid JSON and uses lockfile version 3.
- The exact versioned Suite installers and required legal documents exist for each operating system.
- Each platform has exactly the ten approved product folders, with no missing or unapproved folders.
- Every expected product installer/archive is present, non-empty and has the correct product, version and platform filename.
- All three Suite checksum manifests and all thirty product checksum manifests contain exactly the expected file names.
- Every SHA-256 value matches the actual bytes after the platform artifacts have been transferred to the final collector.
- The combined total is exactly 66 installer/archive outputs.

The final combined bundle is not uploaded when any check fails. These file and checksum checks do not replace live installation, first launch, upgrade, removal, code-signing, macOS notarisation, accessibility or local-data-preservation acceptance tests.

## Release and update controls

The installer workflow runs only when manually dispatched. At the start of the run, a cleanup job paginates the repository's Actions artifact list and removes only the Brightdesk platform bundles and versioned aggregate installer bundles that are at least 24 hours old. It never selects unrelated artifacts and excludes artifacts belonging to the current workflow run. The job uses the built-in workflow token and is the only job granted `actions: write`; preparation, platform builds, verification and publication retain their existing read-only permissions. If the GitHub API denies cleanup, the workflow stops before consuming more artifact storage.

Platform artifacts are retained for one day. Their storage is reused for final verification and, when separately authorised, release publication; no second combined Actions artifact is created. This is a quota-reduction measure, not a guarantee that the repository has enough capacity if other artifacts or caches remain stored.

Publishing a GitHub Release is a separate manual input and defaults to false. A release is not published by this verification task.

The electron-builder publishing provider remains unconfigured (`publish: []`). A manually published GitHub Release download bundle is not the same as a working in-product update channel. Do not claim automatic update availability until the provider, versioned channel, signed metadata and update/download/install/rollback flows have passed acceptance for Suite and all ten products on Windows, macOS and Linux.

## Evidence status

The scripts and workflow define the checks to be executed. Their existence is not a CI pass. A candidate is release-ready only after the latest commit has successful test and quality gates, all three native builds and the final combined verification, followed by the required real installation and upgrade acceptance checks. No package should be described as published or verified without that evidence.
