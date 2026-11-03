'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('native installer workflow uses stable supported OS runner labels', () => {
  const workflow = read('.github/workflows/build-release.yml');
  assert.match(workflow, /runner: ubuntu-24\.04/);
  assert.match(workflow, /runner: windows-2025/);
  assert.match(workflow, /runner: macos-15/);
  assert.doesNotMatch(workflow, /runner: (?:ubuntu|windows|macos)-latest/);
  const audit = read('.github/workflows/security-audit.yml');
  assert.match(audit, /runs-on: ubuntu-24\.04/);
  assert.doesNotMatch(audit, /runs-on: ubuntu-latest/);
});

test('feature quality workflow uses one pull-request run and the pinned Node runtime', () => {
  const workflow = read('.github/workflows/brightdesk-feature-quality.yml');
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /feature\/complete-suite-launcher-apps/);
  assert.doesNotMatch(workflow, /^  push:/m);
  assert.match(workflow, /runs-on: ubuntu-24\.04/);
  assert.match(workflow, /node-version: 24\.22\.2/);
  assert.match(workflow, /npm run check:node/);
  assert.match(workflow, /runs-on: \\[self-hosted, macOS, ARM64\\]/);
  for (const file of ['src/release-manifest.js', 'src/update-preferences.js', 'src/standalone-app-discovery.js', 'scripts/generate-release-manifest.js']) {
    assert.ok(workflow.includes('node --check ' + file), `missing syntax check for ${file}`);
  }
});

test('expensive cross-platform installer matrix is kept to main or deliberate manual release candidates', () => {
  const workflow = read('.github/workflows/build-release.yml');
  assert.match(workflow, /branches: \[main, feature\/storytold-inspired-engine-launcher\]/);
  assert.doesNotMatch(workflow, /feature\/complete-suite-launcher-apps/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /publish_release:/);
});

test('PR quality tests retain dependency auditing without launching a second audit workflow', () => {
  const workflow = read('.github/workflows/brightdesk-feature-quality.yml');
  assert.match(workflow, /npm audit --audit-level=high/);
  const audit = read('.github/workflows/security-audit.yml');
  assert.doesNotMatch(audit, /^  pull_request:/m);
  assert.match(audit, /schedule:/);
});
