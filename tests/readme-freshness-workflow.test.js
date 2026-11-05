'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const workflowPath = path.join(__dirname, '..', '.github', 'workflows', 'readme-freshness.yml');
const workflow = fs.readFileSync(workflowPath, 'utf8');

test('README freshness uses the registered self-hosted macOS ARM64 runner', () => {
  assert.match(
    workflow,
    /runs-on:\s*\[\s*self-hosted,\s*macOS,\s*ARM64\s*\]/,
    'README freshness must use the existing owner-managed Mac runner'
  );
});

test('README freshness shell stays compatible with the macOS system Bash', () => {
  assert.doesNotMatch(
    workflow,
    /\b(?:mapfile|readarray)\b/,
    'macOS system Bash does not provide mapfile/readarray'
  );
});

test('README freshness retains read-only repository access and full history', () => {
  assert.match(workflow, /permissions:\s*\n\s+contents:\s*read/);
  assert.match(workflow, /fetch-depth:\s*0/);
  assert.match(workflow, /git diff --name-only/);
});

test('README freshness pins its checkout action to a full commit SHA', () => {
  assert.match(
    workflow,
    /uses:\\s*actions\\/checkout@[0-9a-f]{40}\\b/,
    'checkout must be pinned to an immutable full-length commit SHA'
  );
  assert.doesNotMatch(workflow, /uses:\\s*actions\\/checkout@v[0-9]/);
});
