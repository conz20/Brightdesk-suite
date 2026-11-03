'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { registerStandaloneApp, listInstalledStandaloneApps } = require('../src/standalone-app-registry');

test('standalone app registry records only approved apps and their versions', async () => {
  const basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-registry-'));
  const executablePath = path.join(basePath, 'Brightdesk Pages');
  await fs.writeFile(executablePath, 'test executable');
  try {
    const record = await registerStandaloneApp({
      appDataPath: basePath, appId: 'pages', version: '0.1.0',
      executablePath, platform: 'darwin'
    });
    assert.equal(record.id, 'pages');
    assert.equal(record.version, '0.1.0');
    assert.deepEqual(await listInstalledStandaloneApps({ appDataPath: basePath }), [record]);
    await assert.rejects(() => registerStandaloneApp({
      appDataPath: basePath, appId: 'outlook', version: '1.0.0',
      executablePath, platform: 'darwin'
    }), /not in the approved catalogue/i);
  } finally {
    await fs.rm(basePath, { recursive: true, force: true });
  }
});

test('standalone app registry removes entries when the application executable is missing', async () => {
  const basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-registry-'));
  try {
    await registerStandaloneApp({
      appDataPath: basePath, appId: 'sheets', version: '0.1.0',
      executablePath: path.join(basePath, 'missing-app'), platform: 'darwin'
    });
    assert.deepEqual(await listInstalledStandaloneApps({ appDataPath: basePath }), []);
  } finally {
    await fs.rm(basePath, { recursive: true, force: true });
  }
});

test('launcher registry discovers a Linux desktop package before its first launch', async () => {
  const basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-registry-discovery-'));
  try {
    const executablePath = path.join(basePath, 'brightdesk-pages');
    const desktopPath = path.join(basePath, 'brightdesk-pages.desktop');
    await fs.writeFile(executablePath, 'test executable');
    await fs.writeFile(desktopPath, `[Desktop Entry]
Type=Application
Name=Brightdesk Pages
Exec=${executablePath} %U
X-Brightdesk-Version=0.1.0
`);

    const installed = await listInstalledStandaloneApps({
      appDataPath: basePath,
      platform: 'linux',
      homeDirectory: basePath,
      searchDirectories: { linuxDesktopDirectories: [basePath] }
    });
    assert.equal(installed.length, 1);
    assert.equal(installed[0].id, 'pages');
    assert.equal(installed[0].version, '0.1.0');
    assert.equal(installed[0].source, 'system-discovery');

    const persisted = JSON.parse(await fs.readFile(path.join(basePath, 'Brightdesk', 'installed-apps.json'), 'utf8'));
    assert.equal(persisted.apps.pages.executablePath, executablePath);
  } finally {
    await fs.rm(basePath, { recursive: true, force: true });
  }
});

test('unknown discovered app versions are retained without inventing an update version', async () => {
  const basePath = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-registry-unknown-version-'));
  try {
    const executablePath = path.join(basePath, 'Brightdesk Pages.exe');
    await fs.writeFile(executablePath, 'test executable');
    const record = await registerStandaloneApp({
      appDataPath: basePath, appId: 'pages', version: 'unknown',
      executablePath, platform: 'win32'
    });
    assert.equal(record.version, 'unknown');
    const installed = await listInstalledStandaloneApps({
      appDataPath: basePath, platform: 'freebsd'
    }).catch(error => { throw error; });
    assert.equal(installed.length, 1);
    assert.equal(installed[0].version, 'unknown');
  } finally {
    await fs.rm(basePath, { recursive: true, force: true });
  }
});
