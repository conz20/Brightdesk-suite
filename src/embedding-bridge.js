'use strict';

const engine = require('./rust-engine');

function toVector(value) {
  if (!Array.isArray(value) && !ArrayBuffer.isView(value)) {
    throw new TypeError('Embedding providers must return an array or typed array of numbers.');
  }
  return Array.from(value, Number);
}

function createEmbeddingBridge(provider) {
  if (!provider || typeof provider.embed !== 'function') {
    throw new TypeError('An embedding provider with an async embed(text) function is required.');
  }

  return Object.freeze({
    async embed(text) {
      if (typeof text !== 'string') throw new TypeError('Embedding input must be text.');
      return engine.normalizeEmbedding(toVector(await provider.embed(text)));
    },

    async rank(query, candidates, limit) {
      if (typeof query !== 'string' || !Array.isArray(candidates) || candidates.some(item => typeof item !== 'string')) {
        throw new TypeError('Ranking requires a text query and an array of text candidates.');
      }
      const [queryVector, ...candidateVectors] = await Promise.all([
        provider.embed(query),
        ...candidates.map(candidate => provider.embed(candidate))
      ]);
      return engine.rankEmbeddings(
        engine.normalizeEmbedding(toVector(queryVector)),
        candidateVectors.map(toVector),
        limit
      );
    }
  });
}

module.exports = { createEmbeddingBridge };
