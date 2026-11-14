'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { captureGuideScreenshot } = require('../src/guide-screenshots');

const approvedProductIds = ['pages', 'sheets'];
const pngBytes = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);

async function withTemporaryDirectory(run) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-guide-screenshots-'));
  try {
    await run(directory);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

function createWindow({ destroyed = false, bytes = pngBytes } = {}) {
  return {
    isDestroyed: () => destroyed,
    webContents: {
      capturePage: async () => ({ toPNG: () => bytes })
    }
  };
}

test('captures a PNG for an approved product using its safe product ID as the file name', async () => {
  await withTemporaryDirectory(async directory => {
    const result = await captureGuideScreenshot({
      window: createWindow(),
      applicationId: 'pages',
      allowedApplicationIds: approvedProductIds,
      outputDirectory: directory
    });

    assert.equal(result.applicationId, 'pages');
    assert.equal(result.filePath, path.join(directory, 'pages.png'));
    assert.equal(result.bytes, pngBytes.length);
    assert.deepEqual(await fs.readFile(result.filePath), pngBytes);
  });
});

test('captures the Suite overview as the dedicated suite.png file', async () => {
  await withTemporaryDirectory(async directory => {
    const result = await captureGuideScreenshot({
      window: createWindow(),
      applicationId: 'suite',
      allowedApplicationIds: approvedProductIds,
      outputDirectory: directory
    });

    assert.equal(path.basename(result.filePath), 'suite.png');
  });
});

test('rejects screenshot names outside the approved product set', async () => {
  await withTemporaryDirectory(async directory => {
    await assert.rejects(
      captureGuideScreenshot({
        window: createWindow(),
        applicationId: '../outside',
        allowedApplicationIds: approvedProductIds,
        outputDirectory: directory
      }),
      /Unsupported Brightdesk guide screenshot target/
    );
  });
});

test('rejects a destroyed or incomplete application window', async () => {
  await withTemporaryDirectory(async directory => {
    await assert.rejects(
      captureGuideScreenshot({
        window: createWindow({ destroyed: true }),
        applicationId: 'pages',
        allowedApplicationIds: approvedProductIds,
        outputDirectory: directory
      }),
      /live Electron window/
    );
  });
});

test('rejects an empty capture instead of saving a misleading screenshot', async () => {
  await withTemporaryDirectory(async directory => {
    await assert.rejects(
      captureGuideScreenshot({
        window: createWindow({ bytes: Buffer.alloc(0) }),
        applicationId: 'pages',
        allowedApplicationIds: approvedProductIds,
        outputDirectory: directory
      }),
      /empty screenshot/
    );
  });
});
