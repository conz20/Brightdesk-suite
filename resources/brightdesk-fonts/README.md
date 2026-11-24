# Brightdesk first-install font package

This directory is the build-time destination for the verified Brightdesk Fonts 0.1.0 package.

Before building any Suite or standalone product installer, place the complete generated contents of `generated/google-fonts-0.1.0` from the approved Brightdesk-Fonts release build here. The directory must contain at least:

- `font-package.json` — complete SHA-256 and file-size manifest;
- `manifest.json` — pinned source and licence-reviewed release record;
- `catalogue/fonts.json` and `catalogue/font-details.json`;
- `fonts.css`;
- all approved font files under `assets/fonts/`;
- every applicable licence text under `licenses/`.

The Suite release preflight validates every listed file and rejects missing, modified, extra, unlicensed or unsafe package content. It intentionally blocks installer creation when the package is absent. Do not put unverified fonts or placeholder binaries here.

The built installers copy this package into their protected application resources. On first launch, Brightdesk verifies it and installs the shared local copy under the operating-system application-data directory used by all ten products. The generated package is a build artifact and is not checked into this repository.
