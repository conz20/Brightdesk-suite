'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  PRODUCT_MANIFEST,
  buildProductLaunchRequest
} = require('../src/product-launcher');

const ids = ['pages', 'sheets', 'slides', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'loop'];

test('the native launcher manifest contains exactly the ten approved products', () => {
  assert.deepEqual(Object.keys(PRODUCT_MANIFEST), ids);
  for (const id of ids) {
    const entry = PRODUCT_MANIFEST[id];
    assert.ok(entry.name, `missing display name for ${id}`);
    assert.equal(entry.bundleId, `org.brightdesk.${id}`);
    assert.equal(entry.desktopFile, `org.brightdesk.${id}.desktop`);
    assert.equal(entry.startMenuShortcut, `Brightdesk ${entry.name}.lnk`);
    assert.ok(entry.iconAsset.endsWith('.svg'));
  }
});

test('macOS launches each product through its registered bundle identifier', () => {
  const request = buildProductLaunchRequest('pages', {
    platform: 'darwin'
  });
  assert.deepEqual(request, {
    command: 'open',
    args: ['-b', 'org.brightdesk.pages'],
    kind: 'macos-bundle'
  });
});

test('Windows launches the product Start Menu shortcut from the user or machine menu', () => {
  const existing = new Set([
    'C:\\Users\\Conz\\AppData\\Roaming\\Microsoft\\Windows\\Start Menu\\Programs\\Brightdesk\\Brightdesk Pages.lnk'
  ]);
  const request = buildProductLaunchRequest('pages', {
    platform: 'win32',
    homeDir: 'C:\\Users\\Conz',
    env: { APPDATA: 'C:\\Users\\Conz\\AppData\\Roaming', ProgramData: 'C:\\ProgramData' },
    exists: candidate => existing.has(candidate)
  });
  assert.deepEqual(request, {
    command: 'explorer.exe',
    args: [...existing],
    kind: 'windows-shortcut'
  });
});

test('Windows falls back to the all-users Start Menu shortcut', () => {
  const shortcut = 'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Brightdesk\\Brightdesk Sheets.lnk';
  const request = buildProductLaunchRequest('sheets', {
    platform: 'win32',
    homeDir: 'C:\\Users\\Conz',
    env: { APPDATA: 'C:\\Users\\Conz\\AppData\\Roaming', ProgramData: 'C:\\ProgramData' },
    exists: candidate => candidate === shortcut
  });
  assert.equal(request.args[0], shortcut);
});

test('Linux launches the registered product desktop entry by its installed path', () => {
  const desktopFile = '/home/conz/.local/share/applications/org.brightdesk.notes.desktop';
  const request = buildProductLaunchRequest('notes', {
    platform: 'linux',
    homeDir: '/home/conz',
    env: { XDG_DATA_HOME: '/home/conz/.local/share' },
    exists: candidate => candidate === desktopFile
  });
  assert.deepEqual(request, {
    command: 'gio',
    args: ['launch', desktopFile],
    kind: 'linux-desktop-entry'
  });
});

test('Linux falls back to the system desktop-entry directory', () => {
  const desktopFile = '/usr/share/applications/org.brightdesk.forms.desktop';
  const request = buildProductLaunchRequest('forms', {
    platform: 'linux',
    homeDir: '/home/conz',
    env: {},
    exists: candidate => candidate === desktopFile
  });
  assert.equal(request.args[1], desktopFile);
});

test('missing Linux AppImage integration is reported rather than guessed', () => {
  assert.throws(
    () => buildProductLaunchRequest('planner', {
      platform: 'linux',
      homeDir: '/home/conz',
      env: {},
      exists: () => false
    }),
    error => error.code === 'PRODUCT_NOT_INSTALLED' && /integrate its AppImage into your desktop menu or install its DEB package/i.test(error.message)
  );
});

test('unknown product identifiers and unsupported platforms are rejected', () => {
  assert.throws(() => buildProductLaunchRequest('outlook', { platform: 'darwin' }), /Unsupported Brightdesk product/);
  assert.throws(() => buildProductLaunchRequest('pages', { platform: 'freebsd' }), /Unsupported operating system/);
});

test('native launch uses argument arrays and never invokes a shell', async () => {
  const { EventEmitter } = require('node:events');
  const { launchProduct } = require('../src/product-launcher');
  const child = new EventEmitter();
  let captured;
  const resultPromise = launchProduct('pages', {
    platform: 'darwin',
    spawn: (command, args, options) => {
      captured = { command, args, options };
      queueMicrotask(() => child.emit('close', 0));
      return child;
    }
  });
  const result = await resultPromise;
  assert.deepEqual(result, { ok: true, applicationId: 'pages', kind: 'macos-bundle' });
  assert.equal(captured.command, 'open');
  assert.deepEqual(captured.args, ['-b', 'org.brightdesk.pages']);
  assert.equal(captured.options.shell, false);
  assert.equal(captured.options.detached, true);
});

test('the product packager creates native launch registrations matching the launcher manifest', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const config = fs.readFileSync(path.join(__dirname, '..', 'electron-builder.app.config.js'), 'utf8');
  assert.match(config, /appId: `org\.brightdesk\.\$\{appId\}`/);
  assert.match(config, /extraMetadata: \{ name: 'brightdesk-' \+ appId/);
  assert.match(config, /desktopName: `org\.brightdesk\.\$\{appId\}\.desktop`/);
  assert.match(config, /menuCategory: 'Brightdesk'/);
  assert.match(config, /shortcutName: 'Brightdesk ' \+ appName/);
  assert.match(config, /createStartMenuShortcut: true/);
});

test('a failed native launch returns an actionable not-installed result', async () => {
  const { EventEmitter } = require('node:events');
  const { launchProduct } = require('../src/product-launcher');
  const child = new EventEmitter();
  const result = launchProduct('pages', {
    platform: 'darwin',
    spawn: () => {
      queueMicrotask(() => child.emit('close', 1));
      return child;
    }
  });
  await assert.rejects(result, error =>
    error.code === 'PRODUCT_NOT_INSTALLED' && /Install it with its Brightdesk product installer/i.test(error.message)
  );
});
