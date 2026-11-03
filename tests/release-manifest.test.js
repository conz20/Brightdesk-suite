'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  APP_IDS,
  compareVersions,
  validateReleaseManifest,
  selectArtifact,
  resolveReleaseAsset
} = require('../src/release-manifest');

function makeManifest() {
  const apps = Object.fromEntries(APP_IDS.map((id, index) => [id, {
    id,
    name: `Brightdesk ${id}`,
    version: index === 0 ? '1.3.0' : '1.2.0',
    platforms: {
      win32: { x64: [{ fileName: `Brightdesk-${id}-${index === 0 ? '1.3.0' : '1.2.0'}-x64.exe`, packageType: 'nsis', architecture: 'x64', size: 1000 + index, sha256: 'a'.repeat(64) }] },
      darwin: { universal: [{ fileName: `Brightdesk-${id}-${index === 0 ? '1.3.0' : '1.2.0'}-universal.pkg`, packageType: 'pkg', architecture: 'universal', size: 2000 + index, sha256: 'b'.repeat(64) }] },
      linux: { x64: [{ fileName: `brightdesk-${id}-${index === 0 ? '1.3.0' : '1.2.0'}-x64.deb`, packageType: 'deb', architecture: 'x64', size: 3000 + index, sha256: 'c'.repeat(64) }] }
    }
  }]));
  return {
    schemaVersion: 1,
    generatedAt: '2026-11-03T00:00:00.000Z',
    release: { tag: 'v1.2.0', version: '1.2.0' },
    suite: {
      version: '1.2.0',
      platforms: {
        win32: { x64: [{ fileName: 'Brightdesk-Setup-1.2.0-x64.exe', packageType: 'nsis', architecture: 'x64', size: 4000, sha256: 'd'.repeat(64) }] },
        darwin: { universal: [{ fileName: 'Brightdesk-1.2.0-universal.pkg', packageType: 'pkg', architecture: 'universal', size: 5000, sha256: 'e'.repeat(64) }] },
        linux: { x64: [{ fileName: 'Brightdesk-1.2.0-x64.deb', packageType: 'deb', architecture: 'x64', size: 6000, sha256: 'f'.repeat(64) }] }
      }
    },
    apps
  };
}

test('release manifest is restricted to the exact ten approved Brightdesk apps', () => {
  const manifest = makeManifest();
  assert.deepEqual(Object.keys(validateReleaseManifest(manifest).apps).sort(), [...APP_IDS].sort());
  const withExtraApp = { ...manifest, apps: { ...manifest.apps, outlook: { id: 'outlook' } } };
  assert.throws(() => validateReleaseManifest(withExtraApp), /exactly the ten approved apps/);
});

test('release manifest rejects invalid hashes, sizes, versions and package identities', () => {
  const badHash = makeManifest();
  badHash.apps.pages.platforms.win32.x64[0].sha256 = 'not-a-checksum';
  assert.throws(() => validateReleaseManifest(badHash), /SHA-256/);

  const badSize = makeManifest();
  badSize.apps.pages.platforms.win32.x64[0].size = 0;
  assert.throws(() => validateReleaseManifest(badSize), /release size/);

  const badVersion = makeManifest();
  badVersion.apps.pages.version = 'latest';
  assert.throws(() => validateReleaseManifest(badVersion), /invalid metadata/);
});

test('release manifest selects the package for the current OS and architecture', () => {
  const manifest = makeManifest();
  assert.equal(selectArtifact({ manifest, appId: 'pages', platform: 'win32', architecture: 'x64' }).packageType, 'nsis');
  assert.equal(selectArtifact({ manifest, appId: 'pages', platform: 'darwin', architecture: 'universal' }).packageType, 'pkg');
  assert.equal(selectArtifact({ manifest, appId: 'pages', platform: 'linux', architecture: 'x64' }).packageType, 'deb');
  assert.equal(selectArtifact({ manifest, appId: 'pages', platform: 'linux', architecture: 'arm64' }), null);
});

test('release manifest does not offer unapproved apps or untrusted download origins', () => {
  const manifest = makeManifest();
  assert.throws(() => selectArtifact({ manifest, appId: 'outlook', platform: 'darwin', architecture: 'universal' }), /not in the approved/);

  const artifact = selectArtifact({ manifest, appId: 'pages', platform: 'win32', architecture: 'x64' });
  const badAssets = [{ name: artifact.fileName, browser_download_url: 'https://example.com/installer.exe', size: artifact.size }];
  assert.throws(() => resolveReleaseAsset({ artifact, assets: badAssets }), /trusted download/);
});

test('release manifest requires the GitHub release asset size to match', () => {
  const manifest = makeManifest();
  const artifact = selectArtifact({ manifest, appId: 'pages', platform: 'win32', architecture: 'x64' });
  const assets = [{
    name: artifact.fileName,
    browser_download_url: `https://github.com/connormolloy12/Brightdesk-suite/releases/download/v1.2.0/${artifact.fileName}`,
    size: artifact.size + 1
  }];
  assert.throws(() => resolveReleaseAsset({ artifact, assets }), /size does not match/);
});

test('semantic version comparison handles stable and prerelease versions', () => {
  assert.equal(compareVersions('1.3.0', '1.2.0'), 1);
  assert.equal(compareVersions('1.2.0', '1.2.0'), 0);
  assert.equal(compareVersions('1.2.0', '1.2.0-beta.1'), 1);
  assert.equal(compareVersions('invalid', '1.2.0'), null);
});

test('Suite version is independent from individual app module versions', () => {
  const manifest = makeManifest();
  assert.equal(manifest.suite.version, '1.2.0');
  assert.equal(manifest.apps.pages.version, '1.3.0');
  assert.equal(manifest.apps.sheets.version, '1.2.0');
});
