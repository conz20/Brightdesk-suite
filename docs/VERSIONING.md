# Brightdesk product versioning

## Official customer-facing version

The Brightdesk Office Suite release version is the one in the suite repository's root `package.json`. That file is the single source of truth for the customer-facing product version.

The first official customer release is **0.1.0**. All customer-visible version labels and downloadable installer filenames must use that release version. Internal development revisions, branch names, commit numbers, test-tool versions and AI maintenance details are not Brightdesk product versions and must never be shown as the customer release number.

## How the version reaches customers

- Electron reads the packaged application version from the suite package manifest.
- The desktop preload bridge obtains the authoritative version from Electron's `app.getVersion()`.
- The app catalogue uses that runtime version for every integrated app module.
- The About/version label and footer use the same runtime version.
- Electron Builder substitutes the suite package version into installer artifact names.
- The root `package-lock.json` version and root package entry must match `package.json`.

The version consistency test checks these links. A mismatch must fail the test suite and block release verification.

## Future customer updates

When an approved customer update is ready, update the root `package.json` version and regenerate/update the root `package-lock.json` together. The app catalogue and desktop labels then inherit the new packaged version; do not manually assign different versions to individual apps.

Use the same new version for release notes, release tags, installer names, checksums, download pages and update metadata. Do not change the customer-facing version merely because internal development continues.

## Brightdesk-AI relationship

Brightdesk-AI is a private maintenance and compatibility tool, not a customer product. It has no Brightdesk customer release number and is never bundled with customer installers or update feeds. It reads and reports the version declared by each Brightdesk product repository; it must not impose its own version on the suite or require customers to use an AI service.

The AI repository's private tooling metadata is deliberately separate from the Brightdesk Office Suite release identity. Compatibility is based on the suite's declared product version and verified interfaces, not matching version numbers between the AI tool and customer application.
