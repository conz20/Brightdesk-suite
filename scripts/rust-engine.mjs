import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const engine = require("../src/rust-engine.js");
export const engineInfo = engine.engineInfo;
export const normalizeEmbedding = engine.normalizeEmbedding;
export const cosineSimilarity = engine.cosineSimilarity;
export const rankEmbeddings = engine.rankEmbeddings;
export const chunkSource = engine.chunkSource;
export const analyzeSource = engine.analyzeSource;
