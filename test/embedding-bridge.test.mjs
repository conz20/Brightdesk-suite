'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createEmbeddingBridge } = require('../src/embedding-bridge');

test('provider-neutral bridge normalizes vectors from any injected provider', async () => {
  const bridge = createEmbeddingBridge({ async embed(text) { return text === 'query' ? [3, 4] : [0, 2]; } });
  const vector = await bridge.embed('query');
  assert.ok(Math.abs(vector[0] - 0.6) < 1e-10);
  assert.ok(Math.abs(vector[1] - 0.8) < 1e-10);
});

test('provider-neutral bridge ranks provider embeddings through the Rust core', async () => {
  const bridge = createEmbeddingBridge({
    async embed(text) {
      return ({ query: [1, 0], close: [1, 0], sideways: [0, 1], opposite: [-1, 0] })[text];
    }
  });
  const ranked = await bridge.rank('query', ['sideways', 'close', 'opposite']);
  assert.deepEqual(ranked.map(item => item.index), [1, 0, 2]);
});

test('provider-neutral bridge rejects missing or malformed providers', () => {
  assert.throws(() => createEmbeddingBridge(null), TypeError);
  assert.throws(() => createEmbeddingBridge({}), TypeError);
});
