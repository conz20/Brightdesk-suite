'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const approvedApps = ['pages', 'sheets', 'slides', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'loop'];

test('a fresh suite install starts with no apps selected or marked installed', () => {
  const app = read('src/app.js');
  assert.ok(app.includes('firstRunSelection: new Set()'));
  assert.ok(app.includes('state.installedApps = launchAppId ? [launchAppId] : [];'));
  assert.ok(!app.includes('state.installedApps = launchAppId ? [launchAppId] : installableCatalog.map'));
});

test('only explicitly selected apps are treated as installed in the suite', () => {
  const app = read('src/app.js');
  assert.ok(app.includes('function installedApp(id) { return state.installedApps.includes(id); }'));
});

test('every approved app has a dedicated SVG icon asset', () => {
  const catalog = require(path.join(root, 'src', 'app-catalog.js'));
  assert.deepEqual(catalog.map((item) => item.id), approvedApps);
  for (const item of catalog) {
    assert.ok(item.icon.startsWith('assets/app-icons/'), item.id);
    assert.ok(item.icon.endsWith('.svg'), item.id);
    const iconPath = path.join(root, 'src', item.icon);
    assert.equal(fs.existsSync(iconPath), true, `Missing SVG icon for ${item.id}`);
    assert.ok(fs.readFileSync(iconPath, 'utf8').includes('<svg'), item.id);
  }
});

test('all ten approved apps can be built as separate desktop applications', () => {
  const build = read('scripts/build-app.js');
  const buildAll = read('scripts/build-apps.js');
  const config = read('electron-builder.app.config.js');
  for (const id of approvedApps) {
    assert.ok(build.includes(`'${id}'`), `build-app.js is missing ${id}`);
    assert.ok(buildAll.includes(`'${id}'`), `build-apps.js is missing ${id}`);
    assert.ok(config.includes(`${id}:`), `standalone product config is missing ${id}`);
  }
});

test('standalone launcher arguments support only the ten approved app ids', () => {
  const main = read('src/main.js');
  const preload = read('src/preload.js');
  for (const id of approvedApps) {
    assert.ok(main.includes(`'${id}'`), `main process is missing ${id}`);
    assert.ok(preload.includes(`'${id}'`), `preload is missing ${id}`);
  }
});

test('update settings require user confirmation before installing an update', () => {
  const main = read('src/main.js');
  const app = read('src/app.js');
  const html = read('src/index.html');
  assert.ok(main.includes('autoUpdater.autoInstallOnAppQuit = false'));
  assert.ok(app.includes("$('update-settings-button').addEventListener('click', openUpdateSettings)"));
  assert.ok(html.includes('id="update-auto-check"'));
  assert.ok(app.includes("$('update-manual-check').addEventListener('click', checkForUpdatesManually)"));
  assert.ok(app.includes("$('update-manual-install').addEventListener('click', installDownloadedUpdate)"));
});
