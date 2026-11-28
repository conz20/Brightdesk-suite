'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const sameRepositoryOnly = "if: github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository";

test('private self-hosted fallbacks reject code from external forks while public jobs use free hosted runners', () => {
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
    assert.match(source, /runs-on:\s*\$\{\{\s*github\.event\.repository\.private == false/);
    assert.ok(source.includes('self-hosted'), file + ' must retain the no-cost private fallback');
  }
});
