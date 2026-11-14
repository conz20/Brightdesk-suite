'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { SCREENSHOT_TARGETS, createScreenshotEvidence, writeScreenshotEvidence, verifyScreenshotSet } = require('../src/screenshot-evidence');

const imageBytes = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  Buffer.from('test-only PNG signature fixture')
]);
const capture = {
  appVersion: '0.1.0',
  sourceCommit: 'e'.repeat(40),
  operatingSystem: { name: 'macOS', version: '15.0', architecture: 'arm64' },
  capturedAt: '2026-11-14T08:00:00.000Z',
  workflow: 'Open the product workspace.',
  sampleDataDescription: 'Fictional sample content in a disposable profile.'
};

function populateCaptureSet(directory) {
  for (const target of SCREENSHOT_TARGETS) {
    const evidence = createScreenshotEvidence({ ...capture, targetId: target.id, imageBytes });
    writeScreenshotEvidence({ outputDir: directory, targetId: target.id, imageBytes, evidence });
  }
}

test('writer rejects matching PNG bytes when the evidence source commit is missing', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-incomplete-evidence-'));
  try {
    const evidence = createScreenshotEvidence({ ...capture, targetId: 'suite', imageBytes });
    delete evidence.sourceCommit;
    assert.throws(
      () => writeScreenshotEvidence({ outputDir: directory, targetId: 'suite', imageBytes, evidence }),
      /40-character source commit/i
    );
    assert.deepEqual(fs.readdirSync(directory), []);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('capture-set verification rejects missing provenance even when the PNG checksum matches', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-capture-missing-provenance-'));
  try {
    populateCaptureSet(directory);
    const evidencePath = path.join(directory, 'pages-evidence.json');
    const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    delete evidence.sourceCommit;
    fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
    assert.throws(() => verifyScreenshotSet(directory), /40-character source commit/i);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('capture-set verification rejects review flags changed before manual review', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-capture-premature-review-'));
  try {
    populateCaptureSet(directory);
    const evidencePath = path.join(directory, 'suite-evidence.json');
    const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
    evidence.primaryWorkflowInspected = true;
    fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
    assert.throws(() => verifyScreenshotSet(directory), /review flags/i);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('capture-set verification rejects incomplete or altered runtime provenance fields', () => {
  const cases = [
    { name: 'product identity', mutate: evidence => { evidence.productName = 'Different product'; }, expected: /selected target/i },
    { name: 'source repository', mutate: evidence => { evidence.sourceRepository = 'other/repository'; }, expected: /selected target/i },
    { name: 'app version', mutate: evidence => { evidence.appVersion = ''; }, expected: /app version/i },
    { name: 'operating-system details', mutate: evidence => { evidence.operatingSystem.version = ''; }, expected: /operating-system/i },
    { name: 'capture timestamp', mutate: evidence => { evidence.capturedAt = 'November 14'; }, expected: /ISO 8601/i },
    { name: 'workflow description', mutate: evidence => { evidence.workflow = ''; }, expected: /workflow/i },
    { name: 'sample-data description', mutate: evidence => { evidence.sampleDataDescription = ''; }, expected: /sampleDataDescription/i },
    { name: 'capture method', mutate: evidence => { evidence.captureMethod = 'mockup export'; }, expected: /capture method/i },
    { name: 'image checksum', mutate: evidence => { evidence.sha256 = '0'.repeat(64); }, expected: /checksum/i }
  ];

  for (const scenario of cases) {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-capture-provenance-case-'));
    try {
      populateCaptureSet(directory);
      const evidencePath = path.join(directory, 'pages-evidence.json');
      const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));
      scenario.mutate(evidence);
      fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2));
      assert.throws(() => verifyScreenshotSet(directory), scenario.expected, scenario.name);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  }
});
