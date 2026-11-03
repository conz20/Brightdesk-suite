'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const {
  readSharedUpdateSettings,
  writeSharedUpdateSettings,
  DEFAULT_UPDATE_SETTINGS
} = require('../src/update-preferences');

test('the Suite and all standalone products share one update preference file', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-update-preferences-'));
  try {
    const appDataPath = path.join(root, 'shared-app-data');
    const suiteSettings = await writeSharedUpdateSettings({
      appDataPath,
      settings: { autoCheck: true, autoDownload: false, autoInstall: true }
    });
    const standaloneSettings = await readSharedUpdateSettings({
      appDataPath,
      legacyUserDataPath: path.join(root, 'standalone-pages')
    });
    assert.equal(suiteSettings.autoCheck, true);
    assert.equal(suiteSettings.autoDownload, false);
    assert.equal(suiteSettings.autoInstall, false);
    assert.deepEqual(standaloneSettings, suiteSettings);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('legacy per-app settings migrate to the shared Brightdesk preference file', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-update-migration-'));
  const appDataPath = path.join(root, 'app-data');
  const legacyUserDataPath = path.join(root, 'legacy-suite-user-data');
  try {
    await fs.mkdir(legacyUserDataPath, { recursive: true });
    await fs.writeFile(
      path.join(legacyUserDataPath, 'update-settings.json'),
      JSON.stringify({ autoCheck: true, autoDownload: true, autoInstall: true })
    );

    const migrated = await readSharedUpdateSettings({ appDataPath, legacyUserDataPath });
    assert.equal(migrated.autoCheck, true);
    assert.equal(migrated.autoDownload, true);
    assert.equal(migrated.autoInstall, false);

    const shared = JSON.parse(await fs.readFile(path.join(appDataPath, 'Brightdesk', 'update-settings.json'), 'utf8'));
    assert.deepEqual(shared, migrated);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('missing shared and legacy settings use the safe manual defaults', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-update-defaults-'));
  try {
    const settings = await readSharedUpdateSettings({
      appDataPath: path.join(root, 'app-data'),
      legacyUserDataPath: path.join(root, 'missing-legacy')
    });
    assert.deepEqual(settings, DEFAULT_UPDATE_SETTINGS);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('invalid legacy preference values are not migrated or enabled', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-update-invalid-'));
  const appDataPath = path.join(root, 'app-data');
  const legacyUserDataPath = path.join(root, 'legacy');
  try {
    await fs.mkdir(legacyUserDataPath, { recursive: true });
    await fs.writeFile(path.join(legacyUserDataPath, 'update-settings.json'), JSON.stringify({
      autoCheck: 'yes', autoDownload: 1, autoInstall: true
    }));
    const settings = await readSharedUpdateSettings({ appDataPath, legacyUserDataPath });
    assert.deepEqual(settings, DEFAULT_UPDATE_SETTINGS);
    await assert.rejects(fs.access(path.join(appDataPath, 'Brightdesk', 'update-settings.json')));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
