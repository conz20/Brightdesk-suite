'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { SCREENSHOT_TARGETS, createScreenshotEvidence, writeScreenshotEvidence, verifyScreenshotSet } = require('../src/screenshot-evidence');

const png = Buffer.concat([Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]), Buffer.from('test-only PNG signature fixture')]);
const base = {
  appVersion: '0.1.0',
  sourceCommit: 'e'.repeat(40),
  operatingSystem: { name: 'macOS', version: '15.0', architecture: 'arm64' },
  capturedAt: '2026-11-14T08:00:00.000Z',
  workflow: 'Open the product workspace.',
  sampleDataDescription: 'Fictional sample content in a disposable profile.'
};

test('the capture plan contains the Suite and exactly the ten approved products', () => {
  assert.equal(SCREENSHOT_TARGETS.length, 15);
  assert.deepEqual(SCREENSHOT_TARGETS.map(item => item.id), ['suite','suite-apps','suite-files','suite-settings','suite-notifications','pages','sheets','decks','notes','database','forms','lists','planner','todo','workspace']);
});

test('evidence records identify the product, exact commit and image checksum', () => {
  const evidence = createScreenshotEvidence({ ...base, targetId: 'pages', imageBytes: png });
  assert.equal(evidence.productName, 'Brightdesk Pages');
  assert.equal(evidence.sourceCommit, 'e'.repeat(40));
  assert.equal(evidence.sha256, crypto.createHash('sha256').update(png).digest('hex'));
  assert.equal(evidence.verified, false);
  assert.equal(evidence.status, 'captured-pending-review');
  assert.equal(evidence.primaryWorkflowInspected, false);
  assert.equal(evidence.reviewedForSensitiveData, false);
});

test('evidence creation rejects an unknown product target', () => {
  assert.throws(() => createScreenshotEvidence({ ...base, targetId: 'outlook', imageBytes: png }), /unsupported.*target/i);
});

test('evidence creation rejects non-PNG images and incomplete provenance', () => {
  assert.throws(() => createScreenshotEvidence({ ...base, targetId: 'suite', imageBytes: Buffer.from('not png') }), /valid PNG/i);
  assert.throws(() => createScreenshotEvidence({ ...base, targetId: 'suite', imageBytes: png, sourceCommit: 'main' }), /40-character source commit/i);
  assert.throws(() => createScreenshotEvidence({ ...base, targetId: 'suite', imageBytes: png, operatingSystem: { name: 'macOS' } }), /operating-system name, version and architecture/i);
});

test('evidence writer prevents overwriting and preserves pending-review status', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-evidence-'));
  try {
    const evidence = createScreenshotEvidence({ ...base, targetId: 'suite', imageBytes: png });
    const written = writeScreenshotEvidence({ outputDir: directory, targetId: 'suite', imageBytes: png, evidence });
    assert.ok(fs.existsSync(written.imagePath));
    assert.ok(fs.existsSync(written.evidencePath));
    assert.throws(() => writeScreenshotEvidence({ outputDir: directory, targetId: 'suite', imageBytes: png, evidence }), /already exists/i);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('capture-set verifier requires all fifteen matching PNG and evidence pairs', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-capture-set-'));
  try {
    for (const target of SCREENSHOT_TARGETS) {
      const evidence = createScreenshotEvidence({ ...base, targetId: target.id, imageBytes: png });
      writeScreenshotEvidence({ outputDir: directory, targetId: target.id, imageBytes: png, evidence });
    }
    const result = verifyScreenshotSet(directory);
    assert.equal(result.screenshotCount, 15);
    assert.equal(result.files.length, 30);
    fs.writeFileSync(path.join(directory, 'unexpected.txt'), 'not an image');
    assert.throws(() => verifyScreenshotSet(directory), /exactly 30 expected image and evidence files/i);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
