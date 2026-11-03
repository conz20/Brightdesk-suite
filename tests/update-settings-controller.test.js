'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('the suite has one update-settings controller and does not load the legacy duplicate', () => {
  const html = read('src/index.html');
  const app = read('src/app.js');

  assert.doesNotMatch(html, /<script src="update-settings\.js"><\/script>/);
  assert.match(html, /id="update-settings-panel"/);
  assert.match(html, /id="update-auto-check"/);
  assert.match(html, /id="update-auto-download"/);
  assert.match(app, /\$\('update-settings-button'\)\.addEventListener\('click', openUpdateSettings\)/);
});

test('automatic update installation is never offered or enabled', () => {
  const html = read('src/index.html');
  const app = read('src/app.js');
  const main = read('src/main.js');

  assert.doesNotMatch(html, /id="update-auto-install"/);
  assert.match(html, /An update is never installed until you approve it/);
  assert.match(app, /autoInstall: false/);
  assert.match(main, /autoInstall: false/);
  assert.match(main, /autoUpdater\.autoInstallOnAppQuit = false/);
});

test('the Suite update notification review action opens the Updates Centre', () => {
  const app = read('src/app.js');

  assert.match(app, /async function reviewAvailableUpdates\(\)/);
  assert.match(app, /label: 'Review update', run: reviewAvailableUpdates/);
  assert.match(app, /reviewAvailableUpdates[\s\S]*?app-updates-panel[\s\S]*?checkForUpdatesManually/);
  assert.doesNotMatch(app, /label: 'Review update', run: openUpdateSettings/);
});
