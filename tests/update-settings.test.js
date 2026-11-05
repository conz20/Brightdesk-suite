'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  DEFAULT_UPDATE_PREFERENCES,
  normalizeUpdatePreferences,
  mergeUpdatePreferences
} = require('../src/update-preferences');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('suite update preferences are visible and use validated IPC handlers', () => {
  const html = read('src/index.html');
  const main = read('src/main.js');
  const preload = read('src/preload.js');
  const settings = read('src/update-settings.js');
  assert.match(html, /id="update-settings-button"/);
  assert.match(html, /id="update-settings-panel"/);
  assert.ok(html.indexOf('update-settings.js') < html.indexOf('app.js'));
  assert.match(preload, /getUpdateSettings/);
  assert.match(preload, /setUpdateSettings/);
  assert.match(main, /updates:settings/);
  assert.match(main, /updates:set-settings/);
  assert.match(settings, /Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace/);
});

test('new installations do not download or install updates automatically', () => {
  assert.deepEqual(DEFAULT_UPDATE_PREFERENCES, {
    schemaVersion: 2,
    autoCheck: true,
    autoDownload: false,
    autoInstall: false
  });
  assert.deepEqual(mergeUpdatePreferences({}), DEFAULT_UPDATE_PREFERENCES);
  assert.match(read('src/update-settings.js'), /autoDownload: false, autoInstall: false/);
});

test('legacy update settings cannot silently retain automatic download or installation', () => {
  assert.deepEqual(normalizeUpdatePreferences({
    autoCheck: false,
    autoDownload: true,
    autoInstall: true
  }), {
    schemaVersion: 2,
    autoCheck: false,
    autoDownload: false,
    autoInstall: false
  });
});

test('current-version update settings preserve explicit user opt-ins', () => {
  assert.deepEqual(normalizeUpdatePreferences({
    schemaVersion: 2,
    autoCheck: true,
    autoDownload: true,
    autoInstall: true
  }), {
    schemaVersion: 2,
    autoCheck: true,
    autoDownload: true,
    autoInstall: true
  });
});

test('partial settings updates default omitted download and install choices to off', () => {
  assert.deepEqual(mergeUpdatePreferences({
    autoCheck: false
  }), {
    schemaVersion: 2,
    autoCheck: false,
    autoDownload: false,
    autoInstall: false
  });
});
