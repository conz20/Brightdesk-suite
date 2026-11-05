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
