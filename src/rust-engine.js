'use strict';

const path = require('node:path');
const { createJavaScriptFallback } = require('./rust-engine-fallback');

const REQUIRED_EXPORTS = [
  'engineInfo',
  'normalizeEmbedding',
  'cosineSimilarity',
  'rankEmbeddings',
  'chunkSource',
  'analyzeSource'
];

let nativeEngine = null;
let nativeLoadFailure = null;

try {
  const candidate = require(path.resolve(__dirname, '..', 'native', 'brightdesk_engine.node'));
  for (const name of REQUIRED_EXPORTS) {
    if (typeof candidate[name] !== 'function') {
      throw new Error('Missing native export: ' + name);
    }
  }
  nativeEngine = candidate;
} catch (error) {
  nativeLoadFailure = error;
}

const fallbackEngine = createJavaScriptFallback();
const activeEngine = nativeEngine || fallbackEngine;

module.exports = Object.freeze({
  engineInfo() {
    if (nativeEngine) {
      return { ...nativeEngine.engineInfo(), native: true, fallback: false };
    }
    const info = fallbackEngine.engineInfo();
    return {
      ...info,
      fallbackReason: nativeLoadFailure?.code || 'NATIVE_MODULE_UNAVAILABLE'
    };
  },
  normalizeEmbedding: activeEngine.normalizeEmbedding,
  cosineSimilarity: activeEngine.cosineSimilarity,
  rankEmbeddings: activeEngine.rankEmbeddings,
  chunkSource: activeEngine.chunkSource,
  analyzeSource: activeEngine.analyzeSource
});
