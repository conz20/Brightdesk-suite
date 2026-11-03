'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { createRustEngine, fallbackAnalyzeText, parseMetricsLine } = require('../src/rust-engine');

test('Rust engine response parser validates request IDs and metric values', () => {
  assert.deepEqual(parseMetricsLine('7\t7\t2\t1'), {
    id: 7,
    metrics: { characters: 7, words: 2, lines: 1 }
  });
  assert.throws(() => parseMetricsLine('bad\t1\t2\t3'), /Invalid response/);
  assert.throws(() => parseMetricsLine('7\t-1\t2\t1'), /invalid text metrics/i);
});

test('JavaScript fallback preserves Unicode and line metrics', () => {
  assert.deepEqual(fallbackAnalyzeText('Café 世界\nBrightdesk'), {
    characters: 16,
    words: 3,
    lines: 2
  });
  assert.deepEqual(fallbackAnalyzeText(''), { characters: 0, words: 0, lines: 0 });
});

test('Rust sidecar processes Unicode text through the Node bridge', async t => {
  const executable = process.platform === 'win32' ? 'brightdesk-rust-engine.exe' : 'brightdesk-rust-engine';
  const binaryPath = path.join(__dirname, '..', 'rust', 'target', 'release', executable);
  if (!fs.existsSync(binaryPath)) {
    t.skip('Rust sidecar is built by the pretest hook in development and CI.');
    return;
  }
  const engine = createRustEngine({ binaryPath });
  try {
    assert.deepEqual(await engine.analyzeText('Café 世界\nBrightdesk'), {
      characters: 16,
      words: 3,
      lines: 2
    });
    assert.deepEqual(engine.status(), { engine: 'rust-native', available: true });
  } finally {
    engine.close();
  }
});
