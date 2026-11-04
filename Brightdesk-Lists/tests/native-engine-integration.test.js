const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('Rust native engine is connected through the secure Electron main process', () => {
  const main = read('src/main.js');
  const preload = read('src/preload.js');

  assert.match(main, /native-engine/);
  assert.match(main, /ipcMain\.handle\('native:engine-info'/);
  assert.match(main, /senderIsMain\(event\)/);
  assert.match(preload, /getNativeEngineInfo/);
  assert.match(preload, /ipcRenderer\.invoke\('native:engine-info'\)/);

  assert.match(main, /contextIsolation/);
  assert.match(preload, /contextBridge\.exposeInMainWorld/);
});

test('Rust native engine is included in suite and standalone installers', () => {
  const suite = read('package.json');
  const standalone = read('electron-builder.app.config.js');

  for (const config of [suite, standalone]) {
    assert.match(config, /asarUnpack/);
    assert.match(config, /\.node/);
  }
});

test('Rust native engine has its own Node-API crate in the workspace', () => {
  const workspace = read('rust/Cargo.toml');

  assert.match(workspace, /brightdesk-native/);
  assert.ok(fs.existsSync(path.join(root, 'rust', 'brightdesk-native', 'Cargo.toml')));
});
