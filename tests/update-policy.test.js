const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { DEFAULT_UPDATE_SETTINGS, normalizeUpdateSettings, getUpdaterPreferences } = require('../src/update-policy');

test('automatic checking is enabled by default but downloads and installation require approval', () => {
  assert.deepEqual(normalizeUpdateSettings(), {
    autoCheck: true,
    autoDownload: false,
    autoInstall: false
  });
});

test('legacy saved preferences cannot silently enable automatic download or installation', () => {
  assert.deepEqual(normalizeUpdateSettings({
    autoCheck: true,
    autoDownload: true,
    autoInstall: true
  }), {
    autoCheck: true,
    autoDownload: false,
    autoInstall: false
  });
});

test('customers can turn automatic checking off without changing approval requirements', () => {
  assert.deepEqual(normalizeUpdateSettings({
    autoCheck: false,
    autoDownload: true,
    autoInstall: true
  }), {
    autoCheck: false,
    autoDownload: false,
    autoInstall: false
  });
});

test('electron updater is always configured to wait for explicit download and install actions', () => {
  assert.deepEqual(getUpdaterPreferences(), {
    autoDownload: false,
    autoInstallOnAppQuit: false
  });
});

test('default settings are immutable and preserve the safe defaults', () => {
  assert.deepEqual(DEFAULT_UPDATE_SETTINGS, {
    autoCheck: true,
    autoDownload: false,
    autoInstall: false
  });
});

test('the Electron main process cannot enable background updates', () => {
  const main = fs.readFileSync(require('node:path').join(__dirname, '../src/main.js'), 'utf8');
  assert.ok(main.includes('Object.assign(autoUpdater, getUpdaterPreferences())'));
  assert.ok(!main.includes('autoUpdater.autoDownload = true'));
  assert.ok(!main.includes('autoUpdater.autoInstallOnAppQuit = true'));
});

test('the app exposes separate customer actions to download and install an update', () => {
  const path = require('node:path');
  const uiPath = fs.existsSync(path.join(__dirname, '../src/update-settings.js'))
    ? path.join(__dirname, '../src/update-settings.js')
    : path.join(__dirname, '../src/app.js');
  const ui = fs.readFileSync(uiPath, 'utf8');
  assert.match(ui, /update-manual-download|Download update/);
  assert.match(ui, /update-manual-install|Install update/);
});

test('turning automatic checks off stops focus and scheduled background checks', () => {
  const main = fs.readFileSync(require('node:path').join(__dirname, '../src/main.js'), 'utf8');
  assert.match(main, /if \(autoUpdater && automaticUpdateChecksEnabled\)/);
  assert.match(main, /clearTimeout\(updateCheckTimeout\)/);
  assert.match(main, /clearInterval\(updateCheckInterval\)/);
  assert.match(main, /configureAutomaticUpdateChecks\(settings\.autoCheck !== false\)/);
  assert.match(main, /configureAutomaticUpdateChecks\(settings\.autoCheck\)/);
});

test('Suite update settings identifies all ten included products', () => {
  const ui = fs.readFileSync(require('node:path').join(__dirname, '../src/update-settings.js'), 'utf8');
  for (const product of [
    'Pages', 'Sheets', 'Decks', 'Notes', 'Database',
    'Forms', 'Lists', 'Planner', 'To Do', 'Workspace'
  ]) {
    assert.ok(ui.includes(product), 'update settings should identify ' + product);
  }
  assert.match(ui, /All ten products are updated with the Brightdesk Office Suite release/i);
  assert.doesNotMatch(ui, /Pages, Sheets, Decks and Notes are updated with the Brightdesk Office Suite release/);
});
