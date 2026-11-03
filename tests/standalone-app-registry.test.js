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
