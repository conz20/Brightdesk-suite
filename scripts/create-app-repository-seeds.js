#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../src/app-catalog');

const REPOSITORY_NAMES = Object.freeze({
  pages: 'Brightdesk-Pages',
  sheets: 'Brightdesk-Sheets',
  slides: 'Brightdesk-Decks',
  notes: 'Brightdesk-Notes',
  database: 'Brightdesk-Database',
  forms: 'Brightdesk-Forms',
  lists: 'Brightdesk-Lists',
  planner: 'Brightdesk-Planner',
  todo: 'Brightdesk-To-Do',
  loop: 'Brightdesk-Workspace'
});

const PACKAGE_NAMES = Object.freeze({
  pages: 'brightdesk-pages',
  sheets: 'brightdesk-sheets',
  slides: 'brightdesk-decks',
  notes: 'brightdesk-notes',
  database: 'brightdesk-database',
  forms: 'brightdesk-forms',
  lists: 'brightdesk-lists',
  planner: 'brightdesk-planner',
  todo: 'brightdesk-to-do',
  loop: 'brightdesk-workspace'
});

const APP_REPOSITORIES = Object.freeze(catalog.map(app => Object.freeze({
  appId: app.id,
  name: app.name,
  description: app.description,
  repository: REPOSITORY_NAMES[app.id],
  packageName: PACKAGE_NAMES[app.id]
})));

const excludedDirectories = new Set(['.git', 'node_modules', 'release', 'reports', 'coverage', '.next', 'dist']);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  }[character]));
}

function socialPreview(app) {
  const accent = ({
    pages: '#e3a23d', sheets: '#51b887', slides: '#e66a75', notes: '#7194e8',
    database: '#49b6c8', forms: '#bd83e8', lists: '#6aa8d8', planner: '#d98c50',
    todo: '#76b46c', loop: '#9a91e8'
  })[app.appId] || '#6f8ee8';
  const mark = catalog.find(item => item.id === app.appId)?.icon || 'B';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="640" viewBox="0 0 1280 640" role="img" aria-labelledby="title desc">
  <title id="title">${escapeHtml(app.name)} — Brightdesk</title>
  <desc id="desc">Original Brightdesk repository banner for ${escapeHtml(app.name)}.</desc>
  <defs>
    <linearGradient id="background" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#111a31"/><stop offset="1" stop-color="#27324e"/></linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="#ffffff" stop-opacity=".65"/></linearGradient>
  </defs>
  <rect width="1280" height="640" rx="36" fill="url(#background)"/>
  <circle cx="1150" cy="75" r="290" fill="${accent}" opacity=".13"/>
  <circle cx="860" cy="610" r="230" fill="${accent}" opacity=".11"/>
  <rect x="82" y="92" width="82" height="82" rx="24" fill="url(#accent)"/>
  <text x="123" y="147" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#152039">${escapeHtml(mark)}</text>
  <text x="190" y="145" font-family="Arial, sans-serif" font-size="24" letter-spacing="5" font-weight="700" fill="#d9e2f4">BRIGHTDESK</text>
  <text x="86" y="318" font-family="Arial, sans-serif" font-size="72" font-weight="700" fill="#ffffff">${escapeHtml(app.name)}</text>
  <text x="90" y="390" font-family="Arial, sans-serif" font-size="27" fill="#d7e0f2">${escapeHtml(app.description)}</text>
  <rect x="88" y="460" width="238" height="56" rx="28" fill="${accent}"/>
  <text x="207" y="496" text-anchor="middle" font-family="Arial, sans-serif" font-size="19" font-weight="700" fill="#142039">STANDALONE APP</text>
  <g transform="translate(830 120)">
    <rect x="0" y="0" width="350" height="380" rx="28" fill="#ffffff" opacity=".08" stroke="#ffffff" stroke-opacity=".22"/>
    <rect x="24" y="24" width="302" height="332" rx="18" fill="#f7f8fc"/>
    <rect x="46" y="47" width="90" height="12" rx="6" fill="${accent}"/>
    <rect x="46" y="78" width="248" height="7" rx="3.5" fill="#d9deeb"/>
    <rect x="46" y="96" width="216" height="7" rx="3.5" fill="#e4e7ef"/>
    <rect x="46" y="134" width="258" height="150" rx="12" fill="${accent}" opacity=".16"/>
    <rect x="64" y="153" width="140" height="12" rx="6" fill="${accent}" opacity=".8"/>
    <rect x="64" y="178" width="220" height="7" rx="3.5" fill="#c6ccda"/>
    <rect x="64" y="196" width="190" height="7" rx="3.5" fill="#c6ccda"/>
    <rect x="64" y="230" width="72" height="36" rx="8" fill="${accent}" opacity=".85"/>
    <rect x="46" y="308" width="180" height="7" rx="3.5" fill="#d9deeb"/>
  </g>
</svg>
`;
}

function repositoryBundleReadme() {
  const folders = APP_REPOSITORIES.map(app => `- ${app.repository} — ${app.name}`).join('\n');
  return `# Brightdesk standalone app repositories

This bundle contains ten separate repository folders. Each folder is a standalone edition of one approved Brightdesk app, with its own package files, README, original app artwork, repository banner and GitHub Actions release workflow.

## Repository folders

${folders}

## Add a folder to GitHub

1. Create an empty GitHub repository using the matching folder name.
2. Upload the contents of that folder to the repository root on the main branch. Keep hidden files, including .github/workflows/standalone-app.yml.
3. Check that the repository shows its README and app artwork, and that its standalone release workflow is present.

The standalone repositories are separate product homes. **Brightdesk-suite remains the complete ten-app desktop suite.**

## Fixed product scope

The bundle includes Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace only. Outlook, OneDrive and Teams are excluded.

Brightdesk is an independent product with original names, code, branding and artwork.
`;
}

function repositoryReadme(app) {
  return `# ${app.name}

![${app.name} repository banner](assets/social-preview.svg)

![${app.name} app artwork](assets/brightdesk-app.svg)

${app.description}

Brightdesk is an independent desktop product. This repository is the standalone edition of **${app.name}**. It uses the shared Brightdesk desktop engine and opens directly into this app, with app switching disabled.

## What this app does

${app.description}

## Download

The latest standalone installers are published from this repository's verified release workflow when a release is approved.

| Platform | Installer |
| --- | --- |
| Windows | Windows x64 installer (.exe) |
| macOS | Universal installer (.dmg), package (.pkg) and archive (.zip) |
| Linux | x64 AppImage and Debian package (.deb) |

The complete ten-app desktop suite remains available from [Brightdesk-suite](https://github.com/connormolloy12/Brightdesk-suite).

## Run from source

Use Node.js **24.22.2**.

\`\`\`sh
npm ci
npm start
\`\`\`

To build an installer on its native operating system:

\`\`\`sh
npm run dist:app:mac
npm run verify:app:mac
\`\`\`

Use \`win\` on Windows or \`linux\` on Linux instead of \`mac\`.

## Project structure

- \`src/\` — Brightdesk desktop renderer and app modules.
- \`assets/brightdesk-app.svg\` — original preview artwork for this app.
- \`scripts/\` — build and release verification tools.
- \`tests/\` — automated app and shared-engine tests.

## Related project

[Brightdesk Office Suite](https://github.com/connormolloy12/Brightdesk-suite) brings all ten approved Brightdesk apps together in one desktop installer.

## Identity and licence

Brightdesk is independent and is not affiliated with Microsoft. It uses original product names, code, interface design and artwork. See [LICENSE](LICENSE), [TERMS_AND_CONDITIONS.txt](TERMS_AND_CONDITIONS.txt), and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
`;
}

function standaloneWorkflow(app) {
  return `name: Build ${app.name} standalone installers

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      publish_release:
        description: Publish a GitHub Release after all standalone installers pass verification
        type: boolean
        required: true
        default: false
      release_tag:
        description: Release tag
        type: string
        required: true
        default: v0.1.0

permissions:
  contents: read
  actions: read

jobs:
  test:
    name: Test ${app.name}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24.22.2
          cache: npm
      - run: npm ci --no-audit --no-fund
      - run: npm test

  build:
    name: Build \${{ matrix.platform }} installer
    if: github.event_name == 'workflow_dispatch'
    needs: test
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: win
            runner: windows-latest
          - platform: mac
            runner: macos-latest
          - platform: linux
            runner: ubuntu-latest
    runs-on: \${{ matrix.runner }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 24.22.2
          cache: npm
      - run: npm ci --no-audit --no-fund
      - run: npm run dist:app:\${{ matrix.platform }}
      - run: npm run verify:app:\${{ matrix.platform }}
      - uses: actions/upload-artifact@v4
        with:
          name: ${app.repository}-\${{ matrix.platform }}
          path: release/apps/${app.appId}/**
          if-no-files-found: error
          retention-days: 14

  publish:
    name: Publish approved standalone release
    if: github.event_name == 'workflow_dispatch' && inputs.publish_release == true
    needs: build
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/download-artifact@v4
        with:
          pattern: ${app.repository}-*
          path: release
          merge-multiple: true
      - uses: softprops/action-gh-release@v2
        with:
          tag_name: \${{ inputs.release_tag }}
          name: ${app.name} \${{ inputs.release_tag }}
          generate_release_notes: true
          files: release/**
`;
}

function shouldCopy(source, destination, outputDir) {
  const name = path.basename(source);
  if (excludedDirectories.has(name) || name === '.DS_Store') return false;
  const resolvedOutput = path.resolve(outputDir);
  const resolvedSource = path.resolve(source);
  if (resolvedSource === resolvedOutput || resolvedSource.startsWith(resolvedOutput + path.sep)) return false;
  if (name === '.github') return false;
  return true;
}

function makePackage(app, target) {
  const manifestPath = path.join(target, 'package.json');
  const lockPath = path.join(target, 'package-lock.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));

  manifest.name = app.packageName;
  manifest.description = `${app.name} — standalone native desktop productivity app`;
  manifest.brightdeskAppId = app.appId;
  manifest.author = { name: 'Brightdesk', email: 'noreply@github.com' };
  manifest.build.appId = `org.brightdesk.${app.appId}`;
  manifest.build.productName = app.name;
  manifest.build.directories = { ...(manifest.build.directories || {}), output: 'release' };
  manifest.build.publish = [];
  manifest.scripts['dist:app:win'] = `node scripts/build-app.js ${app.appId} win`;
  manifest.scripts['dist:app:mac'] = `node scripts/build-app.js ${app.appId} mac`;
  manifest.scripts['dist:app:linux'] = `node scripts/build-app.js ${app.appId} linux`;
  manifest.scripts['verify:app:win'] = `node scripts/verify-standalone-apps.js win release/apps ${app.appId}`;
  manifest.scripts['verify:app:mac'] = `node scripts/verify-standalone-apps.js mac release/apps ${app.appId}`;
  manifest.scripts['verify:app:linux'] = `node scripts/verify-standalone-apps.js linux release/apps ${app.appId}`;

  lock.name = app.packageName;
  if (lock.packages && lock.packages['']) {
    lock.packages[''].name = app.packageName;
    lock.packages[''].version = manifest.version;
  }

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
}

function createAppRepositorySeeds({ rootDir = path.resolve(__dirname, '..'), outputDir = path.join(rootDir, 'release', 'app-repository-seeds') } = {}) {
  const sourceRoot = path.resolve(rootDir);
  const destinationRoot = path.resolve(outputDir);
  if (sourceRoot === destinationRoot || destinationRoot.startsWith(sourceRoot + path.sep) === false && sourceRoot.startsWith(destinationRoot + path.sep)) {
    throw new Error('The repository seed output must not replace or contain the Brightdesk source root.');
  }

  fs.mkdirSync(destinationRoot, { recursive: true });
  fs.writeFileSync(path.join(destinationRoot, 'README-START-HERE.md'), repositoryBundleReadme());
  const results = [];

  for (const app of APP_REPOSITORIES) {
    const target = path.join(destinationRoot, app.repository);
    fs.rmSync(target, { recursive: true, force: true });
    for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
      const source = path.join(sourceRoot, entry.name);
      if (!shouldCopy(source, target, destinationRoot)) continue;
      fs.cpSync(source, path.join(target, entry.name), {
        recursive: true,
        filter: nestedSource => shouldCopy(nestedSource, target, destinationRoot)
      });
    }

    makePackage(app, target);
    const artworkSource = path.join(sourceRoot, 'src', 'assets', 'apps', `${app.appId}.svg`);
    if (!fs.existsSync(artworkSource)) throw new Error(`Original preview artwork is missing for ${app.name}: ${artworkSource}`);
    const assets = path.join(target, 'assets');
    const workflowDirectory = path.join(target, '.github', 'workflows');
    fs.mkdirSync(assets, { recursive: true });
    fs.mkdirSync(workflowDirectory, { recursive: true });
    fs.copyFileSync(artworkSource, path.join(assets, 'brightdesk-app.svg'));
    fs.writeFileSync(path.join(assets, 'social-preview.svg'), socialPreview(app));
    fs.writeFileSync(path.join(target, 'README.md'), repositoryReadme(app));
    fs.writeFileSync(path.join(target, '.github', 'workflows', 'standalone-app.yml'), standaloneWorkflow(app));
    fs.writeFileSync(path.join(target, 'REPOSITORY_INFO.md'), `# ${app.repository}

- Product: ${app.name}
- App ID: \`${app.appId}\`
- Repository visibility: choose when creating the GitHub repository
- Description: ${app.description}
- Main suite: https://github.com/connormolloy12/Brightdesk-suite

This seed is ready to push to a GitHub repository named \`${app.repository}\`. It is a standalone edition locked to ${app.name}. The shared suite keeps the complete ten-app experience.
`);
    results.push({ ...app, path: target });
  }

  return { outputDir: destinationRoot, repositories: results };
}

if (require.main === module) {
  try {
    const result = createAppRepositorySeeds();
    console.log(`Prepared ${result.repositories.length} standalone app repository seeds in ${result.outputDir}`);
    for (const repository of result.repositories) console.log(`- ${repository.repository}`);
  } catch (error) {
    console.error(`Could not prepare app repositories: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { APP_REPOSITORIES, createAppRepositorySeeds, repositoryBundleReadme, repositoryReadme, socialPreview, standaloneWorkflow };
