'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('a fresh suite install starts with no apps selected or marked installed', () => {
  const app = read('src/app.js');
  assert.match(app, /firstRunSelection:\\s*new Set\\(\\)/);
  assert.match(app, /state\\.installedApps\\s*=\\s*\\[\\]\\s*;/);
  assert.doesNotMatch(app, /state\\.installedApps\\s*=\\s*installableCatalog\\.map/);
});

test('only explicitly selected apps are treated as installed in the suite', () => {
  const app = read('src/app.js');
  assert.match(app, /function installedApp\\(id\\)\\s*\\{\\s*return state\\.installedApps\\.includes\\(id\\);\\s*\\}/);
});

test('every approved app has a dedicated SVG icon asset', () => {
  const catalog = require(path.join(root, 'src', 'app-catalog.js'));
  assert.deepEqual(catalog.map((item) => item.id), [
    'pages', 'sheets', 'slides', 'notes', 'database',
    'forms', 'lists', 'planner', 'todo', 'loop'
  ]);
  for (const item of catalog) {
    assert.equal(typeof item.icon, 'string', item.id);
    assert.match(item.icon, /^assets\\/app-icons\\/[a-z-]+\\.svg$/, item.id);
    const iconPath = path.join(root, 'src', item.icon);
    assert.equal(fs.existsSync(iconPath), true, `Missing SVG icon for ${item.id}`);
    assert.match(fs.readFileSync(iconPath, 'utf8'), /<svg[\\s>]/i, item.id);
  }
});

test('all ten approved apps can be built as separate desktop applications', () => {
  const build = read('scripts/build-app.js');
  const buildAll = read('scripts/build-apps.js');
  const config = read('electron-builder.app.config.js');
  const ids = ['pages', 'sheets', 'slides', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'loop'];
  for (const id of ids) {
    assert.ok(build.includes(`'${id}'`), `build-app.js is missing ${id}`);
    assert.ok(buildAll.includes(`'${id}'`), `build-apps.js is missing ${id}`);
    assert.ok(config.includes(`${id}:`), `standalone product config is missing ${id}`);
  }
});

test('standalone launcher arguments support only the ten approved app ids', () => {
  const main = read('src/main.js');
  const preload = read('src/preload.js');
  for (const id of ['pages', 'sheets', 'slides', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'loop']) {
    assert.ok(main.includes(`'${id}'`), `main process is missing ${id}`);
    assert.ok(preload.includes(`'${id}'`), `preload is missing ${id}`);
  }
});

test('update settings require user confirmation before installing an update', () => {
  const main = read('src/main.js');
  const app = read('src/app.js');
  const html = read('src/index.html');
  assert.match(main, /autoInstallOnAppQuit\\s*=\\s*false/);
  assert.match(app, /update-settings-button[\\s\\S]*?openUpdateSettings/);
  assert.match(html, /id="update-auto-check"/);
  assert.match(app, /update-manual-check/);
  assert.match(app, /update-manual-install/);
});
