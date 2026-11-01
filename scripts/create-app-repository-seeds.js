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

const PRODUCT_REPOSITORIES = Object.freeze(catalog.map(product => Object.freeze({
  appId: product.id,
  name: product.name,
  description: product.description,
  repository: REPOSITORY_NAMES[product.id],
  packageName: PACKAGE_NAMES[product.id]
})));

// Backwards-compatible internal alias used by the existing Pages test harness.
const APP_REPOSITORIES = PRODUCT_REPOSITORIES;

const PRODUCT_TEST_FILES = Object.freeze([
  'tests/app-repository-seeds.test.js',
  'tests/database-service.test.js',
  'tests/database-ui-integration.test.js',
  'tests/dictionary-service.test.js',
  'tests/file-service.test.js',
  'tests/forms-service.test.js',
  'tests/forms-ui-integration.test.js',
  'tests/formula.test.js',
  'tests/installer-agreement.test.js',
  'tests/integrated-app-shell.test.js',
  'tests/language-service.test.js',
  'tests/license-verification.test.js',
  'tests/lists-service.test.js',
  'tests/lists-ui-integration.test.js',
  'tests/node-runtime-setup.test.js',
  'tests/page-layout.test.js',
  'tests/planner-service.test.js',
  'tests/planner-ui-integration.test.js',
  'tests/rea-bench.test.js',
  'tests/release-readiness.test.js',
  'tests/resource-protection.test.js',
  'tests/standalone-downloads.test.js',
  'tests/standalone-pages.test.js',
  'tests/todo-service.test.js',
  'tests/todo-ui-integration.test.js',
  'tests/workspace-service.test.js',
  'tests/workspace-ui-integration.test.js'
]);

const excludedDirectories = new Set(['.git', 'node_modules', 'release', 'reports', 'coverage', '.next', 'dist']);

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;'
  }[character]));
}

function socialPreview(product) {
  const accent = ({
    pages: '#e3a23d', sheets: '#51b887', slides: '#e66a75', notes: '#7194e8',
    database: '#49b6c8', forms: '#bd83e8', lists: '#6aa8d8', planner: '#d98c50',
    todo: '#76b46c', loop: '#9a91e8'
  })[product.appId] || '#6f8ee8';
  const mark = catalog.find(item => item.id === product.appId)?.icon || 'B';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="640" viewBox="0 0 1280 640" role="img" aria-labelledby="title desc">
  <title id="title">${escapeHtml(product.name)} — Brightdesk</title>
  <desc id="desc">Original Brightdesk repository banner for ${escapeHtml(product.name)}.</desc>
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
  <text x="86" y="318" font-family="Arial, sans-serif" font-size="72" font-weight="700" fill="#ffffff">${escapeHtml(product.name)}</text>
  <text x="90" y="390" font-family="Arial, sans-serif" font-size="27" fill="#d7e0f2">${escapeHtml(product.description)}</text>
  <rect x="88" y="460" width="238" height="56" rx="28" fill="${accent}"/>
  <text x="207" y="496" text-anchor="middle" font-family="Arial, sans-serif" font-size="19" font-weight="700" fill="#142039">DESKTOP EDITION</text>
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
  const folders = APP_REPOSITORIES.map(product => '- ' + product.repository + ' — ' + product.name).join('\n');
  return [
    '# Brightdesk product repositories',
    '',
    'This bundle contains ten product folders. Each folder is prepared as a dedicated product repository, with package files, a README, original product artwork, a repository banner and a GitHub Actions desktop-installer workflow.',
    '',
    '## Repository folders',
    '',
    folders,
    '',
    '## Add a product repository to GitHub',
    '',
    '1. Create an empty GitHub repository using the matching folder name.',
    '2. Upload the folder contents to the repository root on the main branch. Keep hidden files, including .github/workflows/product-installers.yml.',
    '3. Confirm the repository shows its README, product artwork and desktop-installer workflow.',
    '',
    'Each product repository is a separate home for its named product. Brightdesk-suite remains the complete ten-product desktop suite.',
    '',
    '## Fixed product scope',
    '',
    'The bundle includes Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace only. Outlook, OneDrive and Teams are excluded.',
    '',
    'Brightdesk is an independent product with original names, code, branding and artwork.'
  ].join('\n') + '\n';
}

function repositoryReadme(product) {
  return [
    '# ' + product.name,
    '',
    '![' + product.name + ' repository banner](assets/social-preview.svg)',
    '',
    '![' + product.name + ' product artwork](assets/brightdesk-product.svg)',
    '',
    product.description,
    '',
    'Brightdesk is an independent desktop product. This repository is the dedicated desktop version of **' + product.name + '**. It uses the shared Brightdesk desktop engine and opens directly into this product, with product switching disabled.',
    '',
    '## What this product does',
    '',
    product.description,
    '',
    '## Download',
    '',
    'The latest desktop installers are published from this repository’s verified release workflow when a release is approved.',
    '',
    '| Platform | Installer |',
    '| --- | --- |',
    '| Windows | Windows x64 installer (.exe) |',
    '| macOS | Universal installer (.dmg), package (.pkg) and archive (.zip) |',
    '| Linux | x64 AppImage and Debian package (.deb) |',
    '',
    'The complete ten-product desktop suite remains available from [Brightdesk-suite](https://github.com/connormolloy12/Brightdesk-suite).',
    '',
    '## Quality and security',
    '',
    'Pull requests and pushes run the product and shared-engine test suite, verify the dependency lock and third-party licences, check release preflight and block high-severity dependency vulnerabilities. The same checks repeat daily. Dependabot checks npm packages and GitHub Actions weekly.',
    '',
    'Installer builds are started manually. Publishing a GitHub Release is a separate manual choice and is disabled by default.',
    '',
    '## Run from source',
    '',
    'Use Node.js **24.22.2**.',
    '',
    '    npm ci',
    '    npm start',
    '',
    'To build an installer on its native operating system:',
    '',
    '    npm run dist:product:mac',
    '    npm run verify:product:mac',
    '',
    'Use win on Windows or linux on Linux instead of mac.',
    '',
    '## Project structure',
    '',
    '- src/ — Brightdesk desktop renderer and product modules.',
    '- assets/brightdesk-product.svg — original product artwork.',
    '- scripts/ — build and release verification tools.',
    '- tests/ — automated product and shared-engine tests.',
    '',
    '## Related project',
    '',
    '[Brightdesk Office Suite](https://github.com/connormolloy12/Brightdesk-suite) brings all ten approved Brightdesk products together in one desktop installer.',
    '',
    '## Identity and licence',
    '',
    'Brightdesk is independent and is not affiliated with Microsoft. It uses original product names, code, interface design and artwork. See LICENSE, TERMS_AND_CONDITIONS.txt and THIRD_PARTY_NOTICES.md.'
  ].join('\n') + '\n';
}

function productWorkflow(product) {
  const matrixPlatform = '$' + '{{ matrix.platform }}';
  const releaseTag = '$' + '{{ inputs.release_tag }}';
  return [
    'name: Build ' + product.name + ' desktop installers',
    '',
    'on:',
    '  pull_request:',
    '    branches: [main]',
    '  push:',
    '    branches: [main]',
    '  schedule:',
    "    - cron: '17 4 * * *'",
    '  workflow_dispatch:',
    '    inputs:',
    '      build_installers:',
    '        description: Build the Windows, macOS and Linux desktop installers',
    '        type: boolean',
    '        required: true',
    '        default: true',
    '      publish_release:',
    '        description: Publish a GitHub Release after all product installers pass verification',
    '        type: boolean',
    '        required: true',
    '        default: false',
    '      release_tag:',
    '        description: Release tag',
    '        type: string',
    '        required: true',
    '        default: v0.1.0',
    '',
    'permissions:',
    '  contents: read',
    '  actions: read',
    '',
    'jobs:',
    '  test:',
    '    name: Test ' + product.name,
    '    runs-on: ubuntu-latest',
    '    steps:',
    '      - uses: actions/checkout@v4',
    '      - uses: actions/setup-node@v4',
    '        with:',
    '          node-version: 24.22.2',
    '          cache: npm',
    '      - run: npm run lock:verify',
    '      - run: npm ci --no-audit --no-fund',
    '      - run: npm run verify:licenses',
    '      - run: npm test',
    '      - run: npm run release:preflight',
    '      - run: npm audit --audit-level=high',
    '',
    '  build:',
    '    name: Build ' + matrixPlatform + ' desktop installer',
    '    if: github.event_name == \'workflow_dispatch\' && inputs.build_installers == true',
    '    needs: test',
    '    strategy:',
    '      fail-fast: false',
    '      matrix:',
    '        include:',
    '          - platform: win',
    '            runner: windows-latest',
    '          - platform: mac',
    '            runner: macos-latest',
    '          - platform: linux',
    '            runner: ubuntu-latest',
    '    runs-on: ' + '$' + '{{ matrix.runner }}',
    '    steps:',
    '      - uses: actions/checkout@v4',
    '      - uses: actions/setup-node@v4',
    '        with:',
    '          node-version: 24.22.2',
    '          cache: npm',
    '      - run: npm ci --no-audit --no-fund',
    '      - run: npm run dist:product:' + matrixPlatform,
    '      - run: npm run verify:product:' + matrixPlatform,
    '      - uses: actions/upload-artifact@v4',
    '        with:',
    '          name: ' + product.repository + '-' + matrixPlatform,
    '          path: release/apps/' + product.appId + '/**',
    '          if-no-files-found: error',
    '          retention-days: 14',
    '',
    '  publish:',
    '    name: Publish approved ' + product.name + ' release',
    '    if: github.event_name == \'workflow_dispatch\' && inputs.publish_release == true && inputs.build_installers == true',
    '    needs: build',
    '    runs-on: ubuntu-latest',
    '    permissions:',
    '      contents: write',
    '    steps:',
    '      - uses: actions/download-artifact@v4',
    '        with:',
    '          pattern: ' + product.repository + '-*',
    '          path: release',
    '          merge-multiple: true',
    '      - uses: softprops/action-gh-release@v2',
    '        with:',
    '          tag_name: ' + releaseTag,
    '          name: ' + product.name + ' ' + releaseTag,
    '          generate_release_notes: true',
    '          files: release/**'
  ].join('\n') + '\n';
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

function makePackage(product, target) {
  const manifestPath = path.join(target, 'package.json');
  const lockPath = path.join(target, 'package-lock.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));

  manifest.name = product.packageName;
  manifest.description = `${product.name} — native desktop productivity product`;
  manifest.brightdeskAppId = product.appId;
  manifest.author = { name: 'Brightdesk', email: 'noreply@github.com' };
  manifest.build.appId = `org.brightdesk.${product.appId}`;
  manifest.build.productName = product.name;
  manifest.build.directories = { ...(manifest.build.directories || {}), output: 'release' };
  manifest.build.publish = [];
  manifest.scripts.test = 'node --test ' + PRODUCT_TEST_FILES.join(' ');
  manifest.scripts['dist:product:win'] = `node scripts/build-app.js ${product.appId} win`;
  manifest.scripts['dist:product:mac'] = `node scripts/build-app.js ${product.appId} mac`;
  manifest.scripts['dist:product:linux'] = `node scripts/build-app.js ${product.appId} linux`;
  manifest.scripts['verify:product:win'] = `node scripts/verify-standalone-apps.js win release/apps ${product.appId}`;
  manifest.scripts['verify:product:mac'] = `node scripts/verify-standalone-apps.js mac release/apps ${product.appId}`;
  manifest.scripts['verify:product:linux'] = `node scripts/verify-standalone-apps.js linux release/apps ${product.appId}`;

  lock.name = product.packageName;
  if (lock.packages && lock.packages['']) {
    lock.packages[''].name = product.packageName;
    lock.packages[''].version = manifest.version;
  }

  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  fs.writeFileSync(lockPath, `${JSON.stringify(lock, null, 2)}\n`);
}

function createProductRepositorySeeds({ rootDir = path.resolve(__dirname, '..'), outputDir = path.join(rootDir, 'release', 'product-repository-folders') } = {}) {
  const sourceRoot = path.resolve(rootDir);
  const destinationRoot = path.resolve(outputDir);
  if (sourceRoot === destinationRoot || destinationRoot.startsWith(sourceRoot + path.sep) === false && sourceRoot.startsWith(destinationRoot + path.sep)) {
    throw new Error('The repository seed output must not replace or contain the Brightdesk source root.');
  }

  fs.mkdirSync(destinationRoot, { recursive: true });
  fs.writeFileSync(path.join(destinationRoot, 'README-START-HERE.md'), repositoryBundleReadme());
  const results = [];

  for (const product of PRODUCT_REPOSITORIES) {
    const target = path.join(destinationRoot, product.repository);
    fs.rmSync(target, { recursive: true, force: true });
    for (const entry of fs.readdirSync(sourceRoot, { withFileTypes: true })) {
      const source = path.join(sourceRoot, entry.name);
      if (!shouldCopy(source, target, destinationRoot)) continue;
      fs.cpSync(source, path.join(target, entry.name), {
        recursive: true,
        filter: nestedSource => shouldCopy(nestedSource, target, destinationRoot)
      });
    }

    makePackage(product, target);
    const artworkSource = path.join(sourceRoot, 'src', 'assets', 'apps', `${product.appId}.svg`);
    if (!fs.existsSync(artworkSource)) throw new Error(`Original product artwork is missing for ${product.name}: ${artworkSource}`);
    const assets = path.join(target, 'assets');
    const workflowDirectory = path.join(target, '.github', 'workflows');
    fs.mkdirSync(assets, { recursive: true });
    fs.mkdirSync(workflowDirectory, { recursive: true });
    fs.copyFileSync(artworkSource, path.join(assets, 'brightdesk-product.svg'));
    fs.writeFileSync(path.join(assets, 'social-preview.svg'), socialPreview(product));
    fs.writeFileSync(path.join(target, 'README.md'), repositoryReadme(product));
    fs.writeFileSync(path.join(target, '.github', 'workflows', 'product-installers.yml'), productWorkflow(product));
    fs.writeFileSync(path.join(target, '.github', 'dependabot.yml'), [
      'version: 2',
      'updates:',
      '  - package-ecosystem: npm',
      '    directory: /',
      '    schedule:',
      '      interval: weekly',
      '    open-pull-requests-limit: 5',
      '    labels: [dependencies, security]',
      '',
      '  - package-ecosystem: github-actions',
      '    directory: /',
      '    schedule:',
      '      interval: weekly',
      '    open-pull-requests-limit: 5',
      '    labels: [dependencies, ci]',
      ''
    ].join('\n'));
    fs.writeFileSync(path.join(target, 'REPOSITORY_INFO.md'), `# ${product.repository}

- Product: ${product.name}
- Product ID: \`${product.appId}\`
- Repository visibility: choose when creating the GitHub repository
- Description: ${product.description}
- Main suite: https://github.com/connormolloy12/Brightdesk-suite

This product folder is ready to upload to a GitHub repository named \`${product.repository}\`. It is the dedicated desktop edition of ${product.name}. The shared suite keeps the complete ten-product experience.
`);
    results.push({ ...product, path: target });
  }

  return { outputDir: destinationRoot, repositories: results };
}

if (require.main === module) {
  try {
    const result = createProductRepositorySeeds();
    console.log(`Prepared ${result.repositories.length} product repository folders in ${result.outputDir}`);
    for (const repository of result.repositories) console.log(`- ${repository.repository}`);
  } catch (error) {
    console.error(`Could not prepare product repositories: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  PRODUCT_REPOSITORIES,
  APP_REPOSITORIES,
  createProductRepositorySeeds,
  createAppRepositorySeeds: createProductRepositorySeeds,
  repositoryBundleReadme,
  repositoryReadme,
  socialPreview,
  productWorkflow,
  standaloneWorkflow: productWorkflow
};
