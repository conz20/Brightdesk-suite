'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { captureGuideScreenshot, buildGuideScreenshotManifest } = require('../src/guide-screenshots');

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
    assert.equal(result.sha256, crypto.createHash('sha256').update(pngBytes).digest('hex'));
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


const allApprovedCaptureIds = [
  'suite', 'pages', 'sheets', 'slides', 'notes', 'database',
  'forms', 'lists', 'planner', 'todo', 'loop'
];

function createCaptureRecords() {
  return allApprovedCaptureIds.map(applicationId => ({
    applicationId,
    bytes: 2048,
    sha256: 'a'.repeat(64)
  }));
}

function createCaptureManifestInput(overrides = {}) {
  return {
    captures: createCaptureRecords(),
    repository: 'conz20/Brightdesk-suite',
    appVersion: '0.1.0',
    workflowCommit: '1'.repeat(40),
    pullRequestHeadCommit: '2'.repeat(40),
    pullRequestBaseCommit: '3'.repeat(40),
    platform: 'darwin',
    architecture: 'arm64',
    runnerOS: 'macOS',
    runnerArchitecture: 'ARM64',
    workflowName: 'Brightdesk Suite CI',
    workflowRunId: '43542408989',
    workflowRunUrl: 'https://github.com/conz20/Brightdesk-suite/actions/runs/43542408989',
    capturedAt: '2026-11-14T07:00:00.000Z',
    ...overrides
  };
}

test('builds a provenance manifest for the Suite and exactly ten product screenshots', () => {
  const manifest = buildGuideScreenshotManifest(createCaptureManifestInput());

  assert.equal(manifest.schemaVersion, 1);
  assert.equal(manifest.captureMode, 'source-runtime');
  assert.equal(manifest.repository, 'conz20/Brightdesk-suite');
  assert.equal(manifest.appVersion, '0.1.0');
  assert.equal(manifest.capturedAt, '2026-11-14T07:00:00.000Z');
  assert.deepEqual(manifest.source, {
    workflowCommit: '1'.repeat(40),
    pullRequestHeadCommit: '2'.repeat(40),
    pullRequestBaseCommit: '3'.repeat(40)
  });
  assert.deepEqual(manifest.runner, {
    platform: 'darwin',
    architecture: 'arm64',
    os: 'macOS',
    architectureLabel: 'ARM64'
  });
  assert.deepEqual(manifest.workflow, {
    name: 'Brightdesk Suite CI',
    runId: '43542408989',
    runUrl: 'https://github.com/conz20/Brightdesk-suite/actions/runs/43542408989'
  });
  assert.equal(manifest.screenshots.length, 11);
  assert.deepEqual(manifest.screenshots.map(item => item.applicationId), allApprovedCaptureIds);
  assert.equal(manifest.screenshots[0].fileName, 'suite.png');
  assert.equal(manifest.screenshots.find(item => item.applicationId === 'slides').productName, 'Decks');
  assert.equal(manifest.screenshots.find(item => item.applicationId === 'slides').fileName, 'decks.png');
  assert.equal(manifest.screenshots.find(item => item.applicationId === 'loop').productName, 'Workspace');
  assert.equal(manifest.screenshots.find(item => item.applicationId === 'loop').fileName, 'workspace.png');
  assert.equal(manifest.screenshots[0].sha256, 'a'.repeat(64));
  assert.equal(manifest.screenshots[0].bytes, 2048);
});

test('rejects a provenance manifest unless every approved product has exactly one screenshot', () => {
  const missing = createCaptureRecords().slice(1);
  const duplicate = createCaptureRecords();
  duplicate[1] = { ...duplicate[1], applicationId: 'suite' };

  assert.throws(
    () => buildGuideScreenshotManifest(createCaptureManifestInput({ captures: missing })),
    /exactly the Suite and ten approved products/
  );
  assert.throws(
    () => buildGuideScreenshotManifest(createCaptureManifestInput({ captures: duplicate })),
    /exactly the Suite and ten approved products/
  );
});

test('rejects screenshot provenance when commit, hash or workflow evidence is invalid', () => {
  const invalidHash = createCaptureRecords();
  invalidHash[0] = { ...invalidHash[0], sha256: 'not-a-checksum' };

  assert.throws(
    () => buildGuideScreenshotManifest(createCaptureManifestInput({ workflowCommit: 'unknown' })),
    /workflow commit/
  );
  assert.throws(
    () => buildGuideScreenshotManifest(createCaptureManifestInput({ captures: invalidHash })),
    /SHA-256/
  );
  assert.throws(
    () => buildGuideScreenshotManifest(createCaptureManifestInput({ workflowRunUrl: 'http://example.com/run' })),
    /HTTPS workflow run URL/
  );
});
