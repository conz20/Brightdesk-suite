'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('standalone Rust builder supports exactly the ten approved Brightdesk product IDs', () => {
  const config = read('electron-builder.app.config.js');
  const builder = read('scripts/build-app.js');
  const buildAll = read('scripts/build-apps.js');
  const expected = ['pages', 'sheets', 'slides', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'loop'];

  for (const id of expected) {
    assert.ok(config.includes(id + ':'), 'builder config includes ' + id);
    assert.ok(builder.includes("'" + id + "'"), 'single-app builder accepts ' + id);
    assert.ok(buildAll.includes("'" + id + "'"), 'batch builder includes ' + id);
  }
  assert.match(config, /files: \[[^\]]*native\/brightdesk_engine\.node/);
  assert.ok(config.includes("asarUnpack: ['native/brightdesk_engine.node']"));
});

test('standalone product build scripts build the Rust addon once before Electron Builder', () => {
  const manifest = JSON.parse(read('package.json'));
  const allApps = ['pages', 'sheets', 'decks', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'workspace'];
  for (const app of allApps) {
    for (const platform of ['win', 'mac', 'linux']) {
      const key = 'dist:' + app + ':' + platform;
      assert.ok(manifest.scripts[key], key + ' exists');
      assert.ok(manifest.scripts[key].startsWith('npm run native:build && '), key + ' builds native engine first');
    }
  }
  assert.ok(manifest.scripts['dist:apps:win'].startsWith('npm run native:build && '));
  assert.ok(manifest.scripts['dist:apps:mac'].startsWith('npm run native:build && '));
  assert.ok(manifest.scripts['dist:apps:linux'].startsWith('npm run native:build && '));
  assert.doesNotMatch(read('scripts/build-app.js'), /build-native\.js/);
});

test('repository ignores Rust target output and native Node-API binaries in embedded products', () => {
  const ignore = read('.gitignore');
  assert.match(ignore, /^\/rust\/target\/$/m);
  assert.match(ignore, /^\*\*\/rust\/target\/$/m);
  assert.match(ignore, /^\*\*\/target\/$/m);
  assert.match(ignore, /^\*\*\/native\/\*\.node$/m);
  assert.match(ignore, /^\*\*\/native\/\*\*\/\*\.node$/m);
  assert.match(ignore, /^\*\*\/node_modules\/$/m);
});
