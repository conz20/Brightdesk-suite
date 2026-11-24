'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { FontLibraryService } = require('../src/font-library-service');

function hash(bytes) {
  return require('node:crypto').createHash('sha256').update(bytes).digest('hex');
}

function createFontPackage(t, { family = 'Test Sans', version = '0.1.0', bytes = Buffer.from('test-font') } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-font-source-'));
  const asset = 'assets/fonts/test/TestSans-Regular.ttf';
  const license = 'licenses/test-OFL.txt';
  fs.mkdirSync(path.join(root, 'assets', 'fonts', 'test'), { recursive: true });
  fs.mkdirSync(path.join(root, 'licenses'), { recursive: true });
  fs.writeFileSync(path.join(root, asset), bytes);
  fs.writeFileSync(path.join(root, license), 'SIL OPEN FONT LICENSE Version 1.1\n');
  fs.writeFileSync(path.join(root, 'fonts.css'), '@font-face { font-family: "Test Sans"; src: url("./' + asset + '"); }\n');
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
    name: '@brightdesk/fonts',
    version,
    private: true,
    main: 'index.cjs',
    files: ['assets', 'catalogue.json', 'fonts.css', 'index.cjs', 'licenses']
  }, null, 2) + '\n');
  fs.writeFileSync(path.join(root, 'index.cjs'), 'module.exports = {};\n');
  const catalogue = {
    schemaVersion: 1,
    fonts: [{
      id: family.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      family,
      version: '1.0.0',
      source: { publisher: 'Test Foundry', repository: 'https://example.invalid/fonts', revision: 'a'.repeat(40) },
      license: {
        spdxId: 'OFL-1.1',
        textFile: license,
        licenseUrl: 'https://example.invalid/license',
        copyright: 'Copyright Test Foundry',
        author: 'Test Foundry',
        redistributionAllowed: true,
        applicationEmbeddingAllowed: true,
        modificationAllowed: true,
        reservedFontName: false
      },
      styles: ['Normal'],
      scripts: ['Latin'],
      files: [{
        path: asset,
        format: 'ttf',
        sha256: hash(bytes),
        face: { id: family.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-regular', style: 'normal', weight: 400, italic: false, oblique: false, axes: [] }
      }]
    }]
  };
  fs.writeFileSync(path.join(root, 'catalogue.json'), JSON.stringify(catalogue, null, 2) + '\n');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root, asset, bytes, family, version };
}

function makeStore(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-font-store-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

test('verifies every bundled font binary and installs it into shared local storage', t => {
  const source = createFontPackage(t);
  const shared = makeStore(t);
  const service = new FontLibraryService({ bundledRoot: source.root, sharedRoot: shared });

  const result = service.initialize();

  assert.equal(result.available, true);
  assert.equal(result.familyCount, 1);
  assert.deepEqual(result.installedPackageIds, ['test-sans']);
  assert.deepEqual(fs.readFileSync(path.join(shared, 'packages', '0.1.0', source.asset)), source.bytes);
  assert.equal(fs.existsSync(path.join(shared, 'packages', '0.1.0', 'fonts.css')), true);
  assert.equal(service.getStylesheetUrls().length, 1);
});

test('rejects a font binary whose checksum no longer matches the approved catalogue', t => {
  const source = createFontPackage(t);
  fs.writeFileSync(path.join(source.root, source.asset), 'tampered');
  const shared = makeStore(t);
  const service = new FontLibraryService({ bundledRoot: source.root, sharedRoot: shared });

  assert.throws(() => service.initialize(), /SHA-256/i);
  assert.equal(fs.existsSync(path.join(shared, 'packages', '0.1.0')), false);
});

test('rejects missing licence notices and fonts without explicit redistribution and embedding rights', t => {
  const source = createFontPackage(t);
  const cataloguePath = path.join(source.root, 'catalogue.json');
  const catalogue = JSON.parse(fs.readFileSync(cataloguePath, 'utf8'));
  catalogue.fonts[0].license.applicationEmbeddingAllowed = false;
  fs.writeFileSync(cataloguePath, JSON.stringify(catalogue, null, 2));
  const shared = makeStore(t);
  const service = new FontLibraryService({ bundledRoot: source.root, sharedRoot: shared });

  assert.throws(() => service.initialize(), /embedding/i);
});

test('renderer data contains family metadata but no file paths, hashes or upstream URLs', t => {
  const source = createFontPackage(t);
  const shared = makeStore(t);
  const service = new FontLibraryService({ bundledRoot: source.root, sharedRoot: shared });
  service.initialize();
  const data = service.list();

  assert.equal(data.families[0].familyName, 'Test Sans');
  assert.equal(data.families[0].availability, 'ready');
  assert.doesNotMatch(JSON.stringify(data), /assets\/fonts|sha256|https:\/\//i);
});

test('keeps existing font families available when a later version adds a new family', t => {
  const first = createFontPackage(t, { family: 'Inter', version: '0.1.0', bytes: Buffer.from('inter') });
  const second = createFontPackage(t, { family: 'Open Sans', version: '0.2.0', bytes: Buffer.from('open-sans') });
  const shared = makeStore(t);
  const service = new FontLibraryService({ bundledRoot: first.root, sharedRoot: shared });
  service.initialize();
  service.installPackage(second.root);

  assert.deepEqual(service.list().families.map(font => font.familyName), ['Inter', 'Open Sans']);
  assert.equal(service.list().packages.length, 2);
  assert.deepEqual(fs.readFileSync(path.join(shared, 'packages', '0.1.0', first.asset)), first.bytes);
});

test('refuses to replace the same package version with different files', t => {
  const first = createFontPackage(t, { version: '0.1.0', bytes: Buffer.from('first') });
  const replacement = createFontPackage(t, { version: '0.1.0', bytes: Buffer.from('second') });
  const shared = makeStore(t);
  const service = new FontLibraryService({ bundledRoot: first.root, sharedRoot: shared });
  service.initialize();

  assert.throws(() => service.installPackage(replacement.root), /cannot be replaced/i);
});


test('release preflight blocks an undersized Google font collection even when its binaries are valid', t => {
  const { checkFontPackage } = require('../scripts/release-preflight');
  const source = createFontPackage(t, { family: 'Google Sans Test' });
  const cataloguePath = path.join(source.root, 'catalogue.json');
  const catalogue = JSON.parse(fs.readFileSync(cataloguePath, 'utf8'));
  catalogue.fonts[0].source.publisher = 'Google Fonts';
  fs.writeFileSync(cataloguePath, JSON.stringify(catalogue, null, 2) + '\\n');

  const blocked = checkFontPackage(source.root, 1900);
  assert.equal(blocked.passed, false);
  assert.equal(blocked.googleFamilyCount, 1);
  assert.match(blocked.detail, /at least 1900/i);

  const fixtureMinimum = checkFontPackage(source.root, 1);
  assert.equal(fixtureMinimum.passed, true);
});

test('renderer receives no raw catalogue paths, checksums or upstream source URLs', () => {
  const preload = fs.readFileSync(path.join(__dirname, '../src/preload.js'), 'utf8');
  const renderer = fs.readFileSync(path.join(__dirname, '../src/app.js'), 'utf8');

  assert.doesNotMatch(preload, /require\(['"]\.\.\/packages\/fonts\/catalogue\.json['"]\)/);
  assert.doesNotMatch(preload, /fontCatalogue,/);
  assert.match(preload, /listFonts: \(\) => ipcRenderer\.invoke\('fonts:list'\)/);
  assert.match(preload, /getFontStylesheetUrls: \(\) => ipcRenderer\.invoke\('fonts:stylesheet-urls'\)/);
  assert.match(renderer, /state\.fontLibrary\.families/);
});
