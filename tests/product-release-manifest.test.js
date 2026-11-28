'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  PRODUCT_REPOSITORIES,
  RELEASE_ASSET_REPOSITORY,
  validateProductReleaseManifest
} = require('../src/product-release-manifest');

const digest = 'a'.repeat(64);

function packageRecord(overrides = {}) {
  const record = {
    productId: 'pages',
    sourceRepository: 'conz20/Brightdesk-Pages',
    version: '0.1.0',
    platform: 'windows',
    architecture: 'x64',
    format: 'nsis-exe',
    fileName: 'Brightdesk-Pages-0.1.0-x64.exe',
    downloadUrl: 'https://github.com/conz20/Brightdesk-suite/releases/download/v0.1.0/Brightdesk-Pages-0.1.0-x64.exe',
    sizeBytes: 1024,
    sha256: digest
  };
  return { ...record, ...overrides };
}

function manifest(...packages) {
  return { schemaVersion: 1, packages: packages.length ? packages : [packageRecord()] };
}

test('accepts a valid Brightdesk package and normalises its digest', () => {
  const result = validateProductReleaseManifest(manifest(packageRecord({ sha256: digest.toUpperCase() })));
  assert.equal(result.schemaVersion, 1);
  assert.equal(result.packages.length, 1);
  assert.equal(result.packages[0].sha256, digest);
  assert.equal(Object.isFrozen(result), true);
  assert.equal(Object.isFrozen(result.packages), true);
  assert.equal(Object.isFrozen(result.packages[0]), true);
  assert.equal(RELEASE_ASSET_REPOSITORY, 'conz20/Brightdesk-suite');
});

test('the source repository map contains exactly the ten approved products', () => {
  assert.deepEqual(Object.keys(PRODUCT_REPOSITORIES), [
    'pages', 'sheets', 'slides', 'notes', 'database',
    'forms', 'lists', 'planner', 'todo', 'loop'
  ]);
  assert.equal(PRODUCT_REPOSITORIES.slides, 'conz20/Brightdesk-Decks');
  assert.equal(PRODUCT_REPOSITORIES.todo, 'conz20/Brightdesk-To-Do');
  assert.equal(PRODUCT_REPOSITORIES.loop, 'conz20/Brightdesk-Workspace');
});

test('accepts the approved Windows, macOS and Linux package formats', () => {
  const packages = [
    packageRecord(),
    packageRecord({
      platform: 'macos',
      architecture: 'universal',
      format: 'dmg',
      fileName: 'Brightdesk-Pages-0.1.0-universal.dmg',
      downloadUrl: 'https://github.com/conz20/Brightdesk-suite/releases/download/v0.1.0/Brightdesk-Pages-0.1.0-universal.dmg'
    }),
    packageRecord({
      platform: 'macos',
      architecture: 'universal',
      format: 'pkg',
      fileName: 'Brightdesk-Pages-0.1.0-universal.pkg',
      downloadUrl: 'https://github.com/conz20/Brightdesk-suite/releases/download/v0.1.0/Brightdesk-Pages-0.1.0-universal.pkg'
    }),
    packageRecord({
      platform: 'macos',
      architecture: 'universal',
      format: 'zip',
      fileName: 'Brightdesk-Pages-0.1.0-universal.zip',
      downloadUrl: 'https://github.com/conz20/Brightdesk-suite/releases/download/v0.1.0/Brightdesk-Pages-0.1.0-universal.zip'
    }),
    packageRecord({
      platform: 'linux',
      architecture: 'x64',
      format: 'AppImage',
      fileName: 'brightdesk-pages-0.1.0-x64.AppImage',
      downloadUrl: 'https://github.com/conz20/Brightdesk-suite/releases/download/v0.1.0/brightdesk-pages-0.1.0-x64.AppImage'
    }),
    packageRecord({
      platform: 'linux',
      architecture: 'x64',
      format: 'deb',
      fileName: 'brightdesk-pages-0.1.0-x64.deb',
      downloadUrl: 'https://github.com/conz20/Brightdesk-suite/releases/download/v0.1.0/brightdesk-pages-0.1.0-x64.deb'
    })
  ];
  assert.equal(validateProductReleaseManifest(manifest(...packages)).packages.length, 6);
});

test('all ten approved products can have separately traceable package records', () => {
  const packages = Object.entries(PRODUCT_REPOSITORIES).map(([productId, sourceRepository]) => {
    const fileName = `Brightdesk-${productId}-0.1.0-x64.exe`;
    return packageRecord({
      productId,
      sourceRepository,
      fileName,
      downloadUrl: `https://github.com/conz20/Brightdesk-suite/releases/download/v0.1.0/${fileName}`
    });
  });
  assert.equal(validateProductReleaseManifest(manifest(...packages)).packages.length, 10);
});

test('rejects unknown products and incorrect product source repositories', () => {
  assert.throws(() => validateProductReleaseManifest(manifest(packageRecord({ productId: 'outlook' }))), /unsupported product/);
  assert.throws(() => validateProductReleaseManifest(manifest(packageRecord({ sourceRepository: 'conz20/Brightdesk-suite' }))), /unexpected source repository/);
});

test('rejects unsupported operating systems, architectures and package formats', () => {
  assert.throws(() => validateProductReleaseManifest(manifest(packageRecord({ platform: 'freebsd' }))), /unsupported platform/);
  assert.throws(() => validateProductReleaseManifest(manifest(packageRecord({ architecture: 'arm64' }))), /unsupported architecture/);
  assert.throws(() => validateProductReleaseManifest(manifest(packageRecord({ format: 'zip' }))), /unsupported package format/);
});

test('rejects external, insecure, private-repository and mismatched release URLs', () => {
  const urls = [
    'http://github.com/conz20/Brightdesk-suite/releases/download/v0.1.0/Brightdesk-Pages-0.1.0-x64.exe',
    'https://example.com/conz20/Brightdesk-suite/releases/download/v0.1.0/Brightdesk-Pages-0.1.0-x64.exe',
    'https://github.com/conz20/Brightdesk-Notes/releases/download/v0.1.0/Brightdesk-Pages-0.1.0-x64.exe',
    'https://github.com/conz20/Brightdesk-suite/releases/download/v0.2.0/Brightdesk-Pages-0.1.0-x64.exe',
    'https://github.com/conz20/Brightdesk-suite/releases/download/v0.1.0/another.exe?download=1'
  ];
  for (const downloadUrl of urls) {
    assert.throws(() => validateProductReleaseManifest(manifest(packageRecord({ downloadUrl }))), /approved Brightdesk Suite release asset URL/);
  }
});

test('rejects malformed versions, filenames, package sizes and SHA-256 digests', () => {
  assert.throws(() => validateProductReleaseManifest(manifest(packageRecord({ version: 'latest' }))), /invalid release version/);
  assert.throws(() => validateProductReleaseManifest(manifest(packageRecord({ fileName: '../payload.exe' }))), /unsafe or mismatched file name/);
  assert.throws(() => validateProductReleaseManifest(manifest(packageRecord({ fileName: 'Brightdesk-Pages-0.1.0-x64.zip' }))), /unsafe or mismatched file name/);
  assert.throws(() => validateProductReleaseManifest(manifest(packageRecord({ sizeBytes: 0 }))), /invalid package size/);
  assert.throws(() => validateProductReleaseManifest(manifest(packageRecord({ sha256: 'not-a-hash' }))), /invalid SHA-256 digest/);
});

test('rejects duplicate package identities and duplicate download URLs', () => {
  const first = packageRecord();
  assert.throws(() => validateProductReleaseManifest(manifest(first, { ...first, sizeBytes: 2048 })), /duplicate package entry/);
  assert.throws(() => validateProductReleaseManifest(manifest(first, packageRecord({ productId: 'sheets', sourceRepository: 'conz20/Brightdesk-Sheets' }))), /duplicate package download URL/);
});

test('rejects malformed or unsupported manifest roots', () => {
  assert.throws(() => validateProductReleaseManifest(null), /root value must be an object/);
  assert.throws(() => validateProductReleaseManifest({ schemaVersion: 2, packages: [packageRecord()] }), /schemaVersion must be 1/);
  assert.throws(() => validateProductReleaseManifest({ schemaVersion: 1, packages: [] }), /non-empty array/);
});
