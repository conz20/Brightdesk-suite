'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../src/rust-engine');

test('Node-API loads the native Rust engine and exposes its capabilities', () => {
  const info = engine.engineInfo();
  assert.equal(info.engine, 'Brightdesk Rust Native Engine');
  assert.equal(info.nodeApiVersion, 8);
  assert.ok(info.capabilities.includes('vector-ranking'));
  assert.ok(info.capabilities.includes('provider-neutral'));
});

test('normalizes embeddings and rejects invalid vectors', () => {
  const normalized = engine.normalizeEmbedding([3, 4]);
  assert.ok(Math.abs(normalized[0] - 0.6) < 1e-10);
  assert.ok(Math.abs(normalized[1] - 0.8) < 1e-10);
  assert.throws(() => engine.normalizeEmbedding([0, 0]), /non-zero/i);
  assert.throws(() => engine.normalizeEmbedding([Number.NaN]), /finite/i);
});

test('calculates cosine similarity and ranks candidates stably', () => {
  assert.equal(engine.cosineSimilarity([1, 0], [2, 0]), 1);
  assert.equal(engine.cosineSimilarity([1, 0], [-1, 0]), -1);
  const ranked = engine.rankEmbeddings([1, 0], [[0, 1], [1, 0], [2, 0]]);
  assert.deepEqual(ranked.map(item => item.index), [1, 2, 0]);
});

test('chunks Unicode source without splitting UTF-8 characters', () => {
  const source = '🦀'.repeat(100);
  const chunks = engine.chunkSource(source, 128);
  assert.ok(chunks.every(chunk => Buffer.byteLength(chunk, 'utf8') <= 128));
  assert.equal(chunks.join(''), source);
});

test('analyzes source size and line counts', () => {
  const stats = engine.analyzeSource('one two\nthree');
  assert.equal(stats.bytes, 13);
  assert.equal(stats.lines, 2);
  assert.equal(stats.tokenCount, 3);
});
