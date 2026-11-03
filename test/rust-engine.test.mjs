import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const engine = require("../src/rust-engine.js");

test("Node-API exposes the native Brightdesk engine", () => {
  const info = engine.engineInfo();
  assert.equal(info.engine, "Brightdesk Rust Native Engine");
  assert.equal(info.nodeApiVersion, 8);
  assert.ok(info.capabilities.includes("vector-ranking"));
});

test("embedding normalization rejects invalid vectors", () => {
  const normalized = engine.normalizeEmbedding([3, 4]);
  assert.ok(Math.abs(normalized[0] - 0.6) < 1e-10);
  assert.ok(Math.abs(normalized[1] - 0.8) < 1e-10);
  assert.throws(() => engine.normalizeEmbedding([0, 0]), /non-zero/i);
  assert.throws(() => engine.normalizeEmbedding([Number.NaN]), /finite/i);
});

test("cosine similarity and candidate ranking are deterministic", () => {
  assert.equal(engine.cosineSimilarity([1, 0], [2, 0]), 1);
  const ranked = engine.rankEmbeddings([1, 0], [[0, 1], [1, 0], [2, 0]]);
  assert.deepEqual(ranked.map(item => item.index), [1, 2, 0]);
});

test("source chunking preserves UTF-8 text and respects byte limits", () => {
  const source = "🦀".repeat(100);
  const chunks = engine.chunkSource(source, 128);
  assert.ok(chunks.every(chunk => Buffer.byteLength(chunk, "utf8") <= 128));
  assert.equal(chunks.join(""), source);
});

test("source analysis reports bounded statistics", () => {
  const stats = engine.analyzeSource("one two\nthree");
  assert.equal(stats.bytes, 13);
  assert.equal(stats.lines, 2);
  assert.equal(stats.tokenCount, 3);
});
