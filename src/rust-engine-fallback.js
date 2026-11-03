'use strict';

const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
const MAX_DIMS = 16_384;
const MAX_CANDIDATES = 10_000;
const MAX_VALUES = 1_000_000;
const CAPABILITIES = Object.freeze([
  'source-chunking',
  'source-analysis',
  'embedding-normalization',
  'cosine-similarity',
  'vector-ranking',
  'provider-neutral'
]);

function assertSource(source) {
  if (typeof source !== 'string') throw new TypeError('Source text must be a string.');
  if (Buffer.byteLength(source, 'utf8') > MAX_SOURCE_BYTES) {
    throw new RangeError('Source text exceeds 8 MiB.');
  }
}

function toVector(values) {
  if (!Array.isArray(values) && !ArrayBuffer.isView(values)) {
    throw new TypeError('Embedding values must be an array or typed array.');
  }
  if (values instanceof DataView) throw new TypeError('Embedding values must be a numeric array.');
  if (values.length < 1 || values.length > MAX_DIMS) {
    throw new RangeError('Embedding dimensions must be between 1 and 16384.');
  }
  const vector = Array.from(values);
  if (vector.some(value => typeof value !== 'number' || !Number.isFinite(value))) {
    throw new TypeError('Embedding values must be finite numbers.');
  }
  return vector;
}

function vectorNorm(values) {
  const vector = toVector(values);
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!Number.isFinite(magnitude) || magnitude <= Number.EPSILON) {
    throw new RangeError('Embedding vector must have non-zero magnitude.');
  }
  return { vector, magnitude };
}

function normalizeEmbedding(values) {
  const { vector, magnitude } = vectorNorm(values);
  return vector.map(value => value / magnitude);
}

function cosineSimilarity(left, right) {
  const a = vectorNorm(left);
  const b = vectorNorm(right);
  if (a.vector.length !== b.vector.length) {
    throw new RangeError('Embedding vectors must have matching dimensions.');
  }
  const dot = a.vector.reduce((sum, value, index) => sum + value * b.vector[index], 0);
  return Math.max(-1, Math.min(1, dot / (a.magnitude * b.magnitude)));
}

function rankEmbeddings(query, candidates, limit) {
  const q = toVector(query);
  if (!Array.isArray(candidates)) throw new TypeError('Embedding candidates must be an array.');
  if (candidates.length > MAX_CANDIDATES) {
    throw new RangeError('Embedding ranking request exceeds configured limits.');
  }
  const totalValues = q.length + candidates.reduce((sum, candidate) => {
    if (!Array.isArray(candidate) && !ArrayBuffer.isView(candidate)) {
      throw new TypeError('Each embedding candidate must be a numeric array.');
    }
    return sum + candidate.length;
  }, 0);
  if (totalValues > MAX_VALUES) {
    throw new RangeError('Embedding ranking request exceeds configured limits.');
  }
  if (limit !== undefined && limit !== null &&
      (!Number.isInteger(limit) || limit < 0 || limit > 0xffff_ffff)) {
    throw new TypeError('Ranking limit must be a non-negative 32-bit integer.');
  }
  const ranked = candidates.map((candidate, index) => ({
    index,
    score: cosineSimilarity(q, candidate)
  }));
  ranked.sort((a, b) => (b.score - a.score) || (a.index - b.index));
  return ranked.slice(0, limit === undefined || limit === null ? ranked.length : limit);
}

function chunkSource(source, maxBytes = 2400) {
  assertSource(source);
  if (!Number.isInteger(maxBytes) || maxBytes < 128 || maxBytes > 16_000) {
    throw new RangeError('Chunk size must be between 128 and 16000 bytes.');
  }
  const chunks = [];
  let start = 0;
  while (start < source.length) {
    let cursor = start;
    let bytes = 0;
    while (cursor < source.length) {
      const point = String.fromCodePoint(source.codePointAt(cursor));
      const pointBytes = Buffer.byteLength(point, 'utf8');
      if (bytes + pointBytes > maxBytes) break;
      bytes += pointBytes;
      cursor += point.length;
    }
    if (cursor < source.length) {
      const newline = source.lastIndexOf('\n', cursor - 1);
      if (newline >= start) {
        const preferredEnd = newline + 1;
        if (Buffer.byteLength(source.slice(start, preferredEnd), 'utf8') > maxBytes / 2) {
          cursor = preferredEnd;
        }
      }
    }
    if (cursor === start) {
      cursor += String.fromCodePoint(source.codePointAt(cursor)).length;
    }
    chunks.push(source.slice(start, cursor));
    start = cursor;
  }
  return chunks;
}

function analyzeSource(source) {
  assertSource(source);
  return {
    bytes: Buffer.byteLength(source, 'utf8'),
    lines: source.length === 0 ? 0 : source.split('\n').length - (source.endsWith('\n') ? 1 : 0),
    tokenCount: source.split(/\p{White_Space}+/u).filter(Boolean).length
  };
}

function createJavaScriptFallback() {
  return Object.freeze({
    engineInfo() {
      return {
        engine: 'Brightdesk JavaScript Fallback',
        version: '0.1.0',
        nodeApiVersion: 0,
        native: false,
        fallback: true,
        capabilities: [...CAPABILITIES]
      };
    },
    normalizeEmbedding,
    cosineSimilarity,
    rankEmbeddings,
    chunkSource,
    analyzeSource
  });
}

module.exports = { createJavaScriptFallback };
