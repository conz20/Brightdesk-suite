'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  getStandaloneAppDownload,
  checkStandaloneAppUpdates
} = require('../src/app-update-service');

const APP_IDS = ['pages', 'sheets', 'slides', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'loop'];
const BASE = 'https://github.com/connormolloy12/Brightdesk-suite/releases/download/v1.2.0/';

function makeReleaseData() {
  const apps = Object.fromEntries(APP_IDS.map((id, index) => {
    const version = id === 'pages' ? '1.3.0' : '1.2.0';
    return [id, {
      id,
      name: `Brightdesk ${id}`,
      version,
      platforms: {
        win32: { x64: [{ fileName: `Brightdesk-${id}-${version}-x64.exe`, packageType: 'nsis', architecture: 'x64', size: 1000 + index, sha256: 'a'.repeat(64) }] },
        darwin: { universal: [{ fileName: `Brightdesk-${id}-${version}-universal.pkg`, packageType: 'pkg', architecture: 'universal', size: 2000 + index, sha256: 'b'.repeat(64) }] },
        linux: { x64: [{ fileName: `brightdesk-${id}-${version}-x64.deb`, packageType: 'deb', architecture: 'x64', size: 3000 + index, sha256: 'c'.repeat(64) }] }
      }
    }];
  }));
  const manifest = {
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
  const assets = [{ name: 'Brightdesk-Release-Manifest.json', browser_download_url: `${BASE}Brightdesk-Release-Manifest.json`, size: 7000 }];
  for (const [id, app] of Object.entries(apps)) {
    for (const [platform, architectures] of Object.entries(app.platforms)) {
      for (const packages of Object.values(architectures)) {
        for (const item of packages) assets.push({
          name: item.fileName,
          browser_download_url: `${BASE}${item.fileName}`,
          size: item.size
        });
      }
    }
  }
  return { manifest, assets };
}

function releaseFetch({ manifestOverride, releaseTag = 'v1.2.0', assetOverrides = [] } = {}) {
  const data = makeReleaseData();
  const manifest = manifestOverride || data.manifest;
  const assets = [...data.assets.filter(item => !assetOverrides.some(override => override.name === item.name)), ...assetOverrides];
  return async url => {
    if (String(url).endsWith('/releases/latest')) {
      return {
        ok: true,
        json: async () => ({
          tag_name: releaseTag,
          html_url: 'https://github.com/connormolloy12/Brightdesk-suite/releases/tag/v1.2.0',
          assets
        })
      };
    }
    if (String(url).endsWith('Brightdesk-Release-Manifest.json')) {
      return { ok: true, json: async () => manifest };
    }
    return { ok: false, status: 404 };
  };
}

test('standalone update checks use each app module version instead of the shared Suite version', async () => {
  const result = await checkStandaloneAppUpdates({
    installedApps: [
      { id: 'pages', version: '1.2.0' },
      { id: 'sheets', version: '1.2.0' }
    ],
    platform: 'win32',
    fetchImpl: releaseFetch()
  });
  assert.equal(result.ok, true);
  assert.equal(result.releaseVersion, '1.2.0');
  assert.equal(result.apps[0].availableVersion, '1.3.0');
  assert.equal(result.apps[0].updateAvailable, true);
  assert.equal(result.apps[1].availableVersion, '1.2.0');
  assert.equal(result.apps[1].updateAvailable, false);
});

test('standalone download resolution selects the matching OS package and verifies its size and hash metadata', async () => {
  const result = await getStandaloneAppDownload({
    appId: 'pages',
    platform: 'darwin',
    fetchImpl: releaseFetch()
  });
  assert.equal(result.appId, 'pages');
  assert.equal(result.version, '1.3.0');
  assert.equal(result.packageType, 'pkg');
  assert.equal(result.architecture, 'universal');
  assert.ok(result.fileName.endsWith('.pkg'));
  assert.equal(result.expectedSize, 2000);
  assert.equal(result.sha256, 'b'.repeat(64));
});

test('update check does not offer an app when its platform package asset is missing', async () => {
  const data = makeReleaseData();
  const missingName = 'brightdesk-database-1.2.0-x64.deb';
  const fetchImpl = releaseFetch({ assetOverrides: [{ name: 'Brightdesk-Release-Manifest.json', browser_download_url: `${BASE}Brightdesk-Release-Manifest.json`, size: 7000 }] });
  const original = fetchImpl;
  const result = await checkStandaloneAppUpdates({
    installedApps: [{ id: 'database', version: '1.0.0' }],
    platform: 'linux',
    fetchImpl: async url => {
      const response = await original(url);
      if (String(url).endsWith('/releases/latest')) {
        const value = await response.json();
        value.assets = value.assets.filter(item => item.name !== missingName);
        return { ok: true, json: async () => value };
      }
      return response;
    }
  });
  assert.equal(result.ok, true);
  assert.equal(result.apps[0].updateAvailable, false);
  assert.equal(result.apps[0].installerAvailable, false);
});

test('no published release is reported clearly', async () => {
  const result = await checkStandaloneAppUpdates({
    installedApps: [],
    platform: 'linux',
    fetchImpl: async () => ({ ok: false, status: 404 })
  });
  assert.equal(result.ok, false);
  assert.match(result.message, /No Brightdesk release/);
});

test('unapproved app IDs cannot be used to locate an installer', async () => {
  await assert.rejects(
    () => getStandaloneAppDownload({
      appId: 'outlook',
      platform: 'darwin',
      fetchImpl: releaseFetch()
    }),
    /not in the approved Brightdesk catalogue/
  );
});

test('the release manifest version must match the tagged GitHub release', async () => {
  const result = await checkStandaloneAppUpdates({
    installedApps: [{ id: 'pages', version: '1.0.0' }],
    platform: 'win32',
    fetchImpl: releaseFetch({ releaseTag: 'v1.4.0' })
  });
  assert.equal(result.ok, false);
  assert.match(result.message, /tag and shared release manifest version do not match/);
});

test('a package with an untrusted release origin is not offered', async () => {
  const result = await checkStandaloneAppUpdates({
    installedApps: [{ id: 'pages', version: '1.0.0' }],
    platform: 'win32',
    fetchImpl: releaseFetch({
      assetOverrides: [{
        name: 'Brightdesk-pages-1.2.0-x64.exe',
        browser_download_url: 'https://example.com/Brightdesk-pages-1.2.0-x64.exe',
        size: 1000
      }]
    })
  });
  assert.equal(result.ok, true);
  assert.equal(result.apps[0].updateAvailable, false);
});
