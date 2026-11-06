import { readFileSync } from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";
import * as engine from "../scripts/rust-engine.mjs";

test("loads the native engine or a compatible JavaScript fallback", () => {
  const info = engine.engineInfo();
  assert.ok(info.native === true || info.fallback === true);
  assert.equal(typeof info.engine, "string");
  if (process.env.BRIGHTDESK_REQUIRE_NATIVE_ENGINE === "1") {
    assert.equal(info.native, true);
    assert.equal(info.nodeApiVersion, 8);
    assert.ok(info.capabilities.includes("vector-ranking"));
  }
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

import fallbackModule from "../src/rust-engine-fallback.js";
const { createJavaScriptFallback } = fallbackModule;

test("JavaScript fallback matches the native engine's core contract", () => {
  const fallback = createJavaScriptFallback();
  const info = fallback.engineInfo();
  assert.equal(info.engine, "Brightdesk JavaScript Fallback");
  assert.equal(info.native, false);
  assert.equal(info.nodeApiVersion, 0);
  assert.deepEqual(fallback.analyzeSource("one two\nthree"), {
    bytes: 13,
    lines: 2,
    tokenCount: 3
  });
  assert.deepEqual(fallback.normalizeEmbedding([3, 4]), [0.6, 0.8]);
  assert.equal(fallback.cosineSimilarity([1, 0], [2, 0]), 1);
  assert.deepEqual(
    fallback.rankEmbeddings([1, 0], [[0, 1], [1, 0], [2, 0]]).map(item => item.index),
    [1, 2, 0]
  );
});

test("JavaScript fallback chunks Unicode within the byte limit", () => {
  const fallback = createJavaScriptFallback();
  const source = "🦀".repeat(100);
  const chunks = fallback.chunkSource(source, 128);
  assert.ok(chunks.every(chunk => Buffer.byteLength(chunk) <= 128));
  assert.equal(chunks.join(""), source);
});

test("JavaScript fallback rejects unsafe vector and chunk inputs", () => {
  const fallback = createJavaScriptFallback();
  assert.throws(() => fallback.normalizeEmbedding([0, 0]), /non-zero/i);
  assert.throws(() => fallback.normalizeEmbedding([Number.NaN]), /finite/i);
  assert.throws(() => fallback.cosineSimilarity([1], [1, 2]), /matching dimensions/i);
  assert.throws(() => fallback.chunkSource("text", 64), /between 128 and 16000/i);
});


const rustWorkflowSource = readFileSync(
  new URL("../.github/workflows/rust-engine.yml", import.meta.url),
  "utf8"
);
test("Rust CI uses verified immutable action pins and requires the native engine", () => {
  assert.ok(rustWorkflowSource.includes("actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683"));
  assert.ok(rustWorkflowSource.includes("actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1"));
  assert.ok(rustWorkflowSource.includes("dtolnay/rust-toolchain@683b588c487a69d01f6c6ddf40f036ff682cc2c8"));
  assert.equal(rustWorkflowSource.includes("a26af69be951a213d495a4c3e4e4022e16d87065"), false);
  assert.ok(rustWorkflowSource.includes('BRIGHTDESK_REQUIRE_NATIVE_ENGINE: "1"'));
  assert.ok(rustWorkflowSource.includes("npm run native:build"));
});
