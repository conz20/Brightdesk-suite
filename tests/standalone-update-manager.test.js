'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { Readable } = require('node:stream');
const {
  stageStandaloneAppUpdate,
  listStagedStandaloneAppUpdates,
  removeStagedStandaloneAppUpdate
} = require('../src/standalone-update-manager');

const installerBytes = Buffer.from('Brightdesk test installer package');
const sha256 = crypto.createHash('sha256').update(installerBytes).digest('hex');

function downloadResponse(bytes = installerBytes) {
  return {
    ok: true,
    status: 200,
    body: Readable.from([bytes])
  };
}

test('stages an installer only after its size and SHA-256 are verified', async () => {
  const appDataPath = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-stage-'));
  try {
    const record = await stageStandaloneAppUpdate({
      appDataPath,
      appId: 'pages',
      version: '0.2.0',
      fileName: 'Brightdesk-Pages-0.2.0-universal.pkg',
      downloadUrl: 'https://github.com/connormolloy12/Brightdesk-suite/releases/download/v0.2.0/Brightdesk-Pages-0.2.0-universal.pkg',
      sha256,
      expectedSize: installerBytes.length,
      platform: 'darwin',
      fetchImpl: async () => downloadResponse()
    });
    assert.equal(record.appId, 'pages');
    assert.equal(record.version, '0.2.0');
    assert.equal((await fs.readFile(record.filePath)).toString(), installerBytes.toString());
    assert.deepEqual(await listStagedStandaloneAppUpdates({ appDataPath }), [record]);
  } finally {
    await fs.rm(appDataPath, { recursive: true, force: true });
  }
});

test('rejects a corrupted installer and removes the partial download', async () => {
  const appDataPath = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-stage-'));
  try {
    await assert.rejects(() => stageStandaloneAppUpdate({
      appDataPath,
      appId: 'pages',
      version: '0.2.0',
      fileName: 'Brightdesk-Pages-0.2.0-universal.pkg',
      downloadUrl: 'https://github.com/connormolloy12/Brightdesk-suite/releases/download/v0.2.0/Brightdesk-Pages-0.2.0-universal.pkg',
      sha256: '0'.repeat(64),
      expectedSize: installerBytes.length,
      platform: 'darwin',
      fetchImpl: async () => downloadResponse()
    }), /SHA-256/);
    assert.deepEqual(await listStagedStandaloneAppUpdates({ appDataPath }), []);
  } finally {
    await fs.rm(appDataPath, { recursive: true, force: true });
  }
});

test('rejects unapproved apps and untrusted installer URLs', async () => {
  const appDataPath = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-stage-'));
  try {
    const base = {
      appDataPath,
      version: '0.2.0',
      fileName: 'Brightdesk-Pages-0.2.0-universal.pkg',
      downloadUrl: 'https://github.com/connormolloy12/Brightdesk-suite/releases/download/v0.2.0/file.pkg',
      sha256,
      expectedSize: installerBytes.length,
      platform: 'darwin',
      fetchImpl: async () => downloadResponse()
    };
    await assert.rejects(() => stageStandaloneAppUpdate({ ...base, appId: 'outlook' }), /approved Brightdesk/);
    await assert.rejects(() => stageStandaloneAppUpdate({ ...base, appId: 'pages', downloadUrl: 'https://example.com/file.pkg' }), /trusted Brightdesk/);
  } finally {
    await fs.rm(appDataPath, { recursive: true, force: true });
  }
});

test('staged installers can be removed from the update queue', async () => {
  const appDataPath = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-stage-'));
  try {
    await stageStandaloneAppUpdate({
      appDataPath,
      appId: 'sheets',
      version: '0.2.0',
      fileName: 'Brightdesk-Sheets-0.2.0-universal.pkg',
      downloadUrl: 'https://github.com/connormolloy12/Brightdesk-suite/releases/download/v0.2.0/Brightdesk-Sheets-0.2.0-universal.pkg',
      sha256,
      expectedSize: installerBytes.length,
      platform: 'darwin',
      fetchImpl: async () => downloadResponse()
    });
    assert.deepEqual(await removeStagedStandaloneAppUpdate({ appDataPath, appId: 'sheets' }), { removed: true });
    assert.deepEqual(await listStagedStandaloneAppUpdates({ appDataPath }), []);
  } finally {
    await fs.rm(appDataPath, { recursive: true, force: true });
  }
});
