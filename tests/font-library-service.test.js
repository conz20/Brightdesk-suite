'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { FontLibraryService } = require('../src/font-library-service');

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function createPackageFixture(t, { fontBytes = Buffer.from('font-binary'), css = '@font-face { font-family: "Inter"; }\n' } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-fonts-fixture-'));
  const fontPath = 'assets/fonts/inter/Inter-Regular.ttf';
  const licensePath = 'licenses/inter-OFL.txt';
  const files = [
    { path: 'catalogue/fonts.json', content: null },
    { path: 'fonts.css', content: css },
    { path: fontPath, content: fontBytes },
    { path: licensePath, content: 'SIL OPEN FONT LICENSE Version 1.1\n' }
  ];
  const font = {
    id: 'google-inter',
    family: 'Inter',
    version: 'google-fonts-06bfe0d6',
    source: {
      name: 'Google Fonts official pinned revision',
      url: 'https://github.com/google/fonts/tree/06bfe0d62a98375cb09c942fa18e68bd32cff057/ofl/inter',
      retrievedAt: '2026-11-24'
    },
    license: {
      spdxId: 'OFL-1.1',
      textFile: licensePath,
      licenseUrl: 'https://openfontlicense.org/open-font-license-official-text/',
      copyright: 'Copyright 2026 The Inter Project Authors',
      author: 'Rasmus Andersson',
      redistributionAllowed: true,
      embeddingAllowed: true,
      modificationAllowed: true,
      reservedFontName: false
    },
    styles: ['normal'],
    scripts: ['Latin'],
    files: [{
      path: fontPath,
      format: 'ttf',
      sha256: sha256(fontBytes),
      face: {
        id: 'inter-regular',
        style: 'normal',
        weight: 400,
        italic: false,
        oblique: false,
        axes: []
      }
    }]
  };
  const details = {
    schemaVersion: 1,
    families: [{
      id: 'google-inter',
      family: 'Inter',
      files: [{ path: fontPath, fullName: 'Inter Regular', postScriptName: 'Inter-Regular' }]
    }]
  };
  const catalogue = { schemaVersion: 1, fonts: [font] };
  files[0].content = JSON.stringify(catalogue, null, 2) + '\n';

  for (const item of files) {
    const destination = path.join(root, ...item.path.split('/'));
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, item.content);
  }
  fs.mkdirSync(path.join(root, 'catalogue'), { recursive: true });
  fs.writeFileSync(path.join(root, 'catalogue', 'font-details.json'), JSON.stringify(details, null, 2) + '\n');

  const packageFiles = [
    ...files.map(item => {
      const bytes = Buffer.isBuffer(item.content) ? item.content : Buffer.from(item.content);
      return { path: item.path, size: bytes.length, sha256: sha256(bytes) };
    }),
    (() => {
      const bytes = Buffer.from(JSON.stringify(details, null, 2) + '\n');
      return { path: 'catalogue/font-details.json', size: bytes.length, sha256: sha256(bytes) };
    })()
  ].sort((left, right) => left.path.localeCompare(right.path, 'en'));
  const manifest = {
    schemaVersion: 1,
    packageId: 'brightdesk-font-library',
    version: '0.1.0',
    releaseProfile: '0.1.0',
    integrity: 'SHA-256',
    catalogue: {
      path: 'catalogue/fonts.json',
      sha256: packageFiles.find(file => file.path === 'catalogue/fonts.json').sha256,
      familyCount: 1,
      fontFileCount: 1
    },
    fileCount: packageFiles.length,
    totalBytes: packageFiles.reduce((sum, file) => sum + file.size, 0),
    files: packageFiles
  };
  fs.writeFileSync(path.join(root, 'font-package.json'), JSON.stringify(manifest, null, 2) + '\n');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root, manifest, fontPath, fontBytes };
}

test('verifies package hashes and installs the first-release font collection in the shared Brightdesk store', t => {
  const bundle = createPackageFixture(t);
  const shared = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-font-store-'));
  t.after(() => fs.rmSync(shared, { recursive: true, force: true }));
  const service = new FontLibraryService({ bundledRoot: bundle.root, sharedRoot: shared });

  const result = service.initialize();

  assert.equal(result.available, true);
  assert.equal(result.packageVersion, '0.1.0');
  assert.deepEqual(result.installedPackageIds, ['google-inter']);
  const installed = path.join(shared, 'packages', '0.1.0', ...bundle.fontPath.split('/'));
  assert.deepEqual(fs.readFileSync(installed), bundle.fontBytes);
  assert.equal(service.list().families[0].familyName, 'Inter');
});

test('rejects a modified binary before installing any package files', t => {
  const bundle = createPackageFixture(t);
  fs.writeFileSync(path.join(bundle.root, ...bundle.fontPath.split('/')), 'tampered font');
  const shared = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-font-store-'));
  t.after(() => fs.rmSync(shared, { recursive: true, force: true }));
  const service = new FontLibraryService({ bundledRoot: bundle.root, sharedRoot: shared });

  assert.throws(() => service.initialize(), /SHA-256|size mismatch/i);
  assert.equal(fs.existsSync(path.join(shared, 'packages', '0.1.0')), false);
});

test('rejects unsafe package paths before copying files outside the shared store', t => {
  const bundle = createPackageFixture(t);
  const manifestPath = path.join(bundle.root, 'font-package.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.files[0].path = '../outside.txt';
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  const shared = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-font-store-'));
  t.after(() => fs.rmSync(shared, { recursive: true, force: true }));
  const service = new FontLibraryService({ bundledRoot: bundle.root, sharedRoot: shared });

  assert.throws(() => service.initialize(), /unsafe|path/i);
  assert.equal(fs.existsSync(path.join(path.dirname(shared), 'outside.txt')), false);
});

test('keeps the current shared package intact when an update package fails verification', t => {
  const first = createPackageFixture(t);
  const second = createPackageFixture(t, { fontBytes: Buffer.from('different') });
  fs.writeFileSync(path.join(second.root, 'font-package.json'), JSON.stringify({
    ...second.manifest,
    version: '../bad'
  }, null, 2));
  const shared = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-font-store-'));
  t.after(() => fs.rmSync(shared, { recursive: true, force: true }));
  const service = new FontLibraryService({ bundledRoot: first.root, sharedRoot: shared });
  service.initialize();
  const installed = path.join(shared, 'packages', '0.1.0', ...first.fontPath.split('/'));

  assert.throws(() => service.installPackage(second.root), /version|path/i);
  assert.deepEqual(fs.readFileSync(installed), first.fontBytes);
  assert.equal(service.list().packageVersion, '0.1.0');
});

test('all ten product windows receive the same authorised local font library APIs', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const main = fs.readFileSync(path.join(__dirname, '../src/main.js'), 'utf8');
  const preload = fs.readFileSync(path.join(__dirname, '../src/preload.js'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '../src/app.js'), 'utf8');

  assert.match(main, /ipcMain\.handle\('fonts:list', event => \{/);
  assert.match(main, /if \(!senderIsMain\(event\)\) throw new Error\('Invalid sender\.'\);/);
  assert.match(main, /fontLibraryService\.initialize\(\{ required: app\.isPackaged \}\)/);
  assert.match(preload, /listFonts: \(\) => ipcRenderer\.invoke\('fonts:list'\)/);
  assert.match(preload, /getFontStylesheetUrls: \(\) => ipcRenderer\.invoke\('fonts:stylesheet-urls'\)/);
  for (const applicationId of ['pages', 'sheets', 'slides', 'notes', 'todo', 'lists', 'forms', 'planner', 'database', 'loop']) {
    assert.ok(app.includes(applicationId + ':'), 'the shared font selector must target ' + applicationId);
  }
  assert.match(app, /font-library-select/);
  assert.match(app, /font-library-search/);
  assert.match(app, /visibleFamilies/);
  assert.match(app, /applySelectedFont\(\)/);
});

test('release preflight accepts only a complete verified first-install font package', t => {
  const { checkFontPackage } = require('../scripts/release-preflight');
  const bundle = createPackageFixture(t);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-font-preflight-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const destination = path.join(root, 'resources', 'brightdesk-fonts');
  fs.mkdirSync(destination, { recursive: true });
  fs.cpSync(bundle.root, destination, { recursive: true });

  const ready = checkFontPackage(root);
  assert.equal(ready.passed, true);
  assert.match(ready.detail, /1 families and 1 font files/);

  fs.writeFileSync(path.join(destination, ...bundle.fontPath.split('/')), 'changed');
  const blocked = checkFontPackage(root);
  assert.equal(blocked.passed, false);
  assert.match(blocked.detail, /SHA-256|size mismatch/i);
});

test('release preflight blocks a missing first-install font package', t => {
  const { checkFontPackage } = require('../scripts/release-preflight');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-font-preflight-empty-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = checkFontPackage(root);
  assert.equal(result.passed, false);
  assert.match(result.detail, /complete, integrity-checked Brightdesk 0.1.0 font package is required/i);
});

test('returns no file paths or hashes to the renderer', t => {
  const bundle = createPackageFixture(t);
  const shared = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-font-store-'));
  t.after(() => fs.rmSync(shared, { recursive: true, force: true }));
  const service = new FontLibraryService({ bundledRoot: bundle.root, sharedRoot: shared });
  service.initialize();

  const payload = JSON.stringify(service.list());
  assert.match(payload, /Inter/);
  assert.doesNotMatch(payload, /assets\/fonts|sha256|licenses\/|https:\/\//i);
});
