'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  compareVersions,
  checkStandaloneAppUpdates,
  getStandaloneAppDownload
} = require('../src/app-update-service');

test('app version comparison handles stable versions and prereleases', () => {
  assert.equal(compareVersions('0.2.0', '0.1.9'), 1);
  assert.equal(compareVersions('0.1.0', '0.1.0'), 0);
  assert.equal(compareVersions('0.1.0', '0.2.0'), -1);
  assert.equal(compareVersions('0.2.0', '0.2.0-beta.1'), 1);
  assert.equal(compareVersions('invalid', '0.1.0'), null);
});

test('update check reports a standalone app update only when its platform installer exists', async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({
      tag_name: 'v0.2.0',
      html_url: 'https://github.com/connormolloy12/Brightdesk-suite/releases/tag/v0.2.0',
      assets: [{
        name: 'Brightdesk-Pages-0.2.0-x64.exe',
        browser_download_url: 'https://github.com/connormolloy12/Brightdesk-suite/releases/download/v0.2.0/Brightdesk-Pages-0.2.0-x64.exe'
      }]
    })
  });
  const result = await checkStandaloneAppUpdates({
    installedApps: [{ id: 'pages', version: '0.1.0' }],
    platform: 'win32',
    fetchImpl
  });
  assert.equal(result.ok, true);
  assert.equal(result.apps[0].updateAvailable, true);
  assert.equal(result.apps[0].currentVersion, '0.1.0');
  assert.equal(result.apps[0].availableVersion, '0.2.0');
  assert.ok(result.apps[0].downloadUrl.endsWith('.exe'));
});

test('the launcher download action resolves the exact app installer for the current OS', async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({
      tag_name: 'v0.2.0',
      html_url: 'https://github.com/connormolloy12/Brightdesk-suite/releases/tag/v0.2.0',
      assets: [
        {
          name: 'Brightdesk-Pages-0.2.0-universal.dmg',
          browser_download_url: 'https://github.com/connormolloy12/Brightdesk-suite/releases/download/v0.2.0/Brightdesk-Pages-0.2.0-universal.dmg'
        },
        {
          name: 'Brightdesk-Pages-0.2.0-universal.pkg',
          browser_download_url: 'https://github.com/connormolloy12/Brightdesk-suite/releases/download/v0.2.0/Brightdesk-Pages-0.2.0-universal.pkg',
          size: 2048
        },
        {
          name: 'Brightdesk-Sheets-0.2.0-universal.pkg',
          browser_download_url: 'https://github.com/connormolloy12/Brightdesk-suite/releases/download/v0.2.0/Brightdesk-Sheets-0.2.0-universal.pkg'
        },
        {
          name: 'Brightdesk-SHA256SUMS-MAC.txt',
          browser_download_url: 'https://github.com/connormolloy12/Brightdesk-suite/releases/download/v0.2.0/Brightdesk-SHA256SUMS-MAC.txt'
        }
      ]
    })
  });
  const manifest = '0123456789abcdef'.repeat(4) + '  apps/pages/Brightdesk-Pages-0.2.0-universal.pkg\n';
  const originalFetch = fetchImpl;
  const verifiedFetch = async (url, options) => {
    if (String(url).endsWith('Brightdesk-SHA256SUMS-MAC.txt')) {
      return { ok: true, text: async () => manifest };
    }
    return originalFetch(url, options);
  };
  const result = await getStandaloneAppDownload({ appId: 'pages', platform: 'darwin', fetchImpl: verifiedFetch });
  assert.equal(result.appId, 'pages');
  assert.equal(result.version, '0.2.0');
  assert.ok(result.fileName.endsWith('.pkg'));
  assert.ok(result.downloadUrl.includes('Brightdesk-Pages-'));
  assert.equal(result.expectedSize, 2048);
  assert.equal(result.sha256, '0123456789abcdef'.repeat(4));
});

test('update check does not offer an update when the platform package is missing', async () => {
  const fetchImpl = async () => ({
    ok: true,
    json: async () => ({ tag_name: 'v0.2.0', assets: [] })
  });
  const result = await checkStandaloneAppUpdates({
    installedApps: [{ id: 'database', version: '0.1.0' }],
    platform: 'darwin',
    fetchImpl
  });
  assert.equal(result.ok, true);
  assert.equal(result.apps[0].updateAvailable, false);
  assert.equal(result.apps[0].downloadUrl, '');
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
      fetchImpl: async () => ({ ok: true, json: async () => ({}) })
    }),
    /not in the approved Brightdesk catalogue/
  );
});
