'use strict';

const path = require('node:path');

const nativePath = path.resolve(__dirname, '..', 'native', 'brightdesk_engine.node');
let native;
try {
  native = require(nativePath);
} catch (cause) {
  const error = new Error(
    'Brightdesk Rust Native Engine could not be loaded. Run "npm run native:build" with Rust 1.99.1 installed.'
  );
  error.code = 'BRIGHTDESK_NATIVE_ENGINE_UNAVAILABLE';
  error.cause = cause;
  throw error;
}

for (const method of ['engineInfo', 'normalizeEmbedding', 'cosineSimilarity', 'rankEmbeddings', 'chunkSource', 'analyzeSource']) {
  if (typeof native[method] !== 'function') {
    throw new Error('Brightdesk Rust Native Engine is missing required Node-API export: ' + method);
  }
}

module.exports = Object.freeze({
  engineInfo: native.engineInfo,
  normalizeEmbedding: native.normalizeEmbedding,
  cosineSimilarity: native.cosineSimilarity,
  rankEmbeddings: native.rankEmbeddings,
  chunkSource: native.chunkSource,
  analyzeSource: native.analyzeSource
});
