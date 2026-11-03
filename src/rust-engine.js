'use strict';

const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline');

function fallbackAnalyzeText(input) {
  if (typeof input !== 'string') throw new TypeError('Text must be a string.');
  const lines = input.length === 0
    ? 0
    : input.split(/\r\n|\r|\n/).length - (/(?:\r\n|\r|\n)$/.test(input) ? 1 : 0);
  return {
    characters: Array.from(input).length,
    words: input.trim() ? input.trim().split(/\s+/u).length : 0,
    lines
  };
}

function parseMetricsLine(line) {
  const parts = line.split('\t');
  if (parts.length !== 4 || !/^\d+$/.test(parts[0])) {
    throw new Error('Invalid response from the Brightdesk Rust engine.');
  }
  const values = parts.slice(1).map(Number);
  if (values.some(value => !Number.isSafeInteger(value) || value < 0)) {
    throw new Error('The Brightdesk Rust engine returned invalid text metrics.');
  }
  return { id: Number(parts[0]), metrics: { characters: values[0], words: values[1], lines: values[2] } };
}

function defaultBinaryPath() {
  const executable = process.platform === 'win32' ? 'brightdesk-rust-engine.exe' : 'brightdesk-rust-engine';
  if (process.versions.electron && process.resourcesPath) {
    return path.join(process.resourcesPath, 'native', executable);
  }
  return path.join(__dirname, '..', 'rust', 'target', 'release', executable);
}

function createRustEngine({ binaryPath = defaultBinaryPath(), spawnProcess = spawn } = {}) {
  let child = null;
  let state = 'javascript-fallback';
  let nextId = 1;
  let closed = false;
  const pending = new Map();

  function fallbackPending() {
    for (const [id, request] of pending) {
      pending.delete(id);
      request.resolve(fallbackAnalyzeText(request.input));
    }
  }

  function failToFallback() {
    if (state === 'javascript-fallback') return;
    state = 'javascript-fallback';
    fallbackPending();
    child = null;
  }

  function start() {
    if (child || closed || !fs.existsSync(binaryPath)) return child;
    try {
      child = spawnProcess(binaryPath, [], { stdio: ['pipe', 'pipe', 'ignore'], windowsHide: true });
      state = 'rust-native';
      const output = readline.createInterface({ input: child.stdout });
      output.on('line', line => {
        try {
          const response = parseMetricsLine(line);
          const request = pending.get(response.id);
          if (!request) return;
          pending.delete(response.id);
          request.resolve(response.metrics);
        } catch {
          failToFallback();
        }
      });
      child.once('error', failToFallback);
      child.once('exit', failToFallback);
    } catch {
      failToFallback();
    }
    return child;
  }

  function analyzeText(input) {
    if (typeof input !== 'string') return Promise.reject(new TypeError('Text must be a string.'));
    const processHandle = start();
    if (!processHandle || state !== 'rust-native') return Promise.resolve(fallbackAnalyzeText(input));
    const id = nextId++;
    return new Promise(resolve => {
      pending.set(id, { input, resolve });
      processHandle.stdin.write(`${id}\t${Buffer.from(input, 'utf8').toString('hex')}\n`, error => {
        if (error) failToFallback();
      });
    });
  }

  function status() {
    return { engine: state, available: state === 'rust-native' };
  }

  function close() {
    closed = true;
    if (child && !child.killed) child.kill();
    child = null;
    fallbackPending();
    state = 'closed';
  }

  return { analyzeText, status, close };
}

module.exports = { createRustEngine, fallbackAnalyzeText, parseMetricsLine };
