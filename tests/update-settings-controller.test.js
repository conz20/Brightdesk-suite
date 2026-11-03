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

test('a standalone app opens only its own Updates row and does not call the Suite updater', () => {
  const app = read('src/app.js');
  const main = read('src/main.js');

  assert.match(app, /if \(!launchAppId\) host\.append\(suiteRow\)/);
  assert.match(app, /catalog\.filter\(item => !launchAppId \|\| item\.id === launchAppId\)\.forEach/);
  assert.match(app, /launchAppId \? Promise\.resolve\(\{ ok: true, status: 'standalone' \}\) : window\.brightdesk\.checkForUpdates\(\)/);
  assert.match(main, /if \(applicationId\) return refreshStandaloneAppUpdates\(\{ notify: true \}\)/);
  assert.match(main, /if \(applicationId\) \{[\s\S]*?shared verified app update service/);
  assert.match(main, /const allInstalledApps = await listInstalledStandaloneApps/);
  assert.match(main, /allInstalledApps\.filter\(item => item\.id === applicationId\)/);
});
