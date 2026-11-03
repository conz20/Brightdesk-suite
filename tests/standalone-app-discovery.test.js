'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { discoverStandaloneApps } = require('../src/standalone-app-discovery');

test('macOS discovery finds a Brightdesk app bundle before the app has been opened', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-discovery-mac-'));
  try {
    const bundle = path.join(root, 'Brightdesk Pages.app');
    const contents = path.join(bundle, 'Contents');
    const executable = path.join(contents, 'MacOS', 'Brightdesk Pages');
    await fs.mkdir(path.dirname(executable), { recursive: true });
    await fs.writeFile(executable, 'app binary');
    await fs.writeFile(path.join(contents, 'Info.plist'), `<?xml version="1.0"?>
<plist><dict>
<key>CFBundleExecutable</key><string>Brightdesk Pages</string>
<key>CFBundleShortVersionString</key><string>0.1.0</string>
</dict></plist>`);

    const installed = await discoverStandaloneApps({
      platform: 'darwin',
      homeDirectory: root,
      searchDirectories: { macApplications: [root] }
    });
    assert.equal(installed.length, 1);
    assert.equal(installed[0].id, 'pages');
    assert.equal(installed[0].version, '0.1.0');
    assert.equal(installed[0].executablePath, bundle);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('Windows discovery finds a standard per-user install without opening the application', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-discovery-win-'));
  try {
    const install = path.join(root, 'Brightdesk Pages');
    const executable = path.join(install, 'Brightdesk Pages.exe');
    await fs.mkdir(install, { recursive: true });
    await fs.writeFile(executable, 'app binary');

    const installed = await discoverStandaloneApps({
      platform: 'win32',
      homeDirectory: root,
      environment: { LOCALAPPDATA: root },
      searchDirectories: { windowsInstallRoots: [root] },
      runCommand: async () => { throw new Error('Registry lookup not available in this test.'); }
    });
    assert.equal(installed.length, 1);
    assert.equal(installed[0].id, 'pages');
    assert.equal(installed[0].executablePath, executable);
    assert.equal(installed[0].version, 'unknown');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('Linux discovery resolves a packaged Brightdesk desktop entry and its installed version', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-discovery-linux-'));
  try {
    const desktop = path.join(root, 'brightdesk-pages.desktop');
    const executable = path.join(root, 'brightdesk-pages');
    await fs.writeFile(executable, 'app binary');
    await fs.writeFile(desktop, `[Desktop Entry]
Type=Application
Name=Brightdesk Pages
Exec=brightdesk-pages %U
X-Brightdesk-Version=0.1.0
`);

    const installed = await discoverStandaloneApps({
      platform: 'linux',
      homeDirectory: root,
      searchDirectories: { linuxDesktopDirectories: [root] },
      runCommand: async (command, args) => {
        assert.equal(command, 'which');
        assert.deepEqual(args, ['brightdesk-pages']);
        return executable;
      }
    });
    assert.equal(installed.length, 1);
    assert.equal(installed[0].id, 'pages');
    assert.equal(installed[0].version, '0.1.0');
    assert.equal(installed[0].executablePath, executable);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('Linux discovery ignores desktop entries that do not launch the matching Brightdesk app', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-discovery-invalid-'));
  try {
    await fs.writeFile(path.join(root, 'other.desktop'), `[Desktop Entry]
Type=Application
Name=Brightdesk Pages
Exec=some-other-program %U
`);
    const installed = await discoverStandaloneApps({
      platform: 'linux',
      homeDirectory: root,
      searchDirectories: { linuxDesktopDirectories: [root] },
      runCommand: async () => { throw new Error('A non-Brightdesk executable must not be resolved.'); }
    });
    assert.deepEqual(installed, []);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('discovery rejects unsupported operating systems rather than guessing', async () => {
  await assert.rejects(() => discoverStandaloneApps({ platform: 'freebsd' }), /not supported/);
});
