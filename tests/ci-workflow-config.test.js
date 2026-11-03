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
  assert.match(audit, /runs-on: ubuntu-24\\.04/);
  assert.doesNotMatch(audit, /runs-on: ubuntu-latest/);
});

test('feature quality workflow uses a fixed Ubuntu image and the pinned Node runtime', () => {
  const workflow = read('.github/workflows/brightdesk-feature-quality.yml');
  assert.match(workflow, /runs-on: ubuntu-24\.04/);
  assert.match(workflow, /node-version: 24\.22\.2/);
  assert.match(workflow, /npm run check:node/);
  for (const file of ['src/release-manifest.js', 'src/update-preferences.js', 'src/standalone-app-discovery.js', 'scripts/generate-release-manifest.js']) {
    assert.ok(workflow.includes('node --check ' + file), `missing syntax check for ${file}`);
  }
});

test('the cross-platform artifact collection generates and publishes the shared release manifest', () => {
  const workflow = read('.github/workflows/build-release.yml');
  assert.match(workflow, /npm run release:manifest -- release/);
  assert.match(workflow, /Brightdesk-Release-Manifest\.json/);
  assert.match(workflow, /path: release\/\*\*/);
  assert.match(workflow, /files: release\/\*\*/);
});

test('the native installer workflow runs for the selective-install pull request base', () => {
  const workflow = read('.github/workflows/build-release.yml');
  assert.match(workflow, /feature\/complete-suite-launcher-apps/);
  const quality = read('.github/workflows/brightdesk-feature-quality.yml');
  assert.match(quality, /feature\/complete-suite-launcher-apps/);
});
