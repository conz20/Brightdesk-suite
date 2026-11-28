'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const sameRepositoryOnly = "if: github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository";

test('every self-hosted pull-request workflow rejects code from external forks', () => {
  const workflows = [
    '.github/workflows/ci.yml',
    '.github/workflows/quality.yml',
    '.github/workflows/readme-freshness.yml',
    '.github/workflows/rust-engine.yml',
    '.github/workflows/verify-macos-installer.yml'
  ];
  for (const file of workflows) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    assert.ok(source.includes(sameRepositoryOnly), file + ' must restrict self-hosted execution to same-repository pull requests');
    assert.match(source, /runs-on:\s*(?:self-hosted|\[.*self-hosted.*\])/);
  }
});
