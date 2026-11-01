'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');

test('Node.js 24.22.2 remains the single exact Brightdesk runtime', () => {
  const manifest = JSON.parse(read('package.json'));
  assert.equal(manifest.engines.node, '24.22.2');
  assert.equal(read('.nvmrc').trim(), '24.22.2');
  assert.equal(read('.node-version').trim(), '24.22.2');
  assert.match(read('.npmrc'), /engine-strict=true/);
  assert.match(read('.devcontainer/Dockerfile'), /^FROM node:24\.22\.2-bookworm/m);
  assert.match(read('.devcontainer/devcontainer.json'), /npm run setup:dev/);
  assert.match(read('.github/workflows/build-release.yml'), /node-version: 24\.22\.2/);
  assert.match(read('.github/workflows/security-audit.yml'), /node-version: 24\.22\.2/);
  assert.match(read('AGENTS.md'), /exactly Node\.js \*\*24\.22\.2 LTS\*\*/);
  assert.match(read('PROJECT_MEMORY.md'), /standing project requirement/);
});

test('macOS and Linux runtime installer downloads official archives and verifies SHA-256 before extraction', () => {
  const script = read('scripts/install-node24.sh');
  assert.match(script, /https:\/\/nodejs\.org\/dist\/v\$\{NODE_VERSION\}/);
  assert.match(script, /SHASUMS256\.txt/);
  assert.match(script, /sha256sum|shasum -a 256/);
  assert.match(script, /checksum mismatch/i);
  assert.match(script, /tar -xJf/);
  assert.match(script, /linux\|darwin|Darwin/);
  assert.match(script, /x64|arm64/);
  assert.doesNotMatch(script, /curl[^\n]*\|[^\n]*(sh|bash)/);
});

test('Windows runtime installer verifies the official archive hash and activates Node for PowerShell', () => {
  const script = read('scripts/install-node24.ps1');
  assert.match(script, /SHASUMS256\.txt/);
  assert.match(script, /Get-FileHash[^\n]*SHA256/);
  assert.match(script, /checksum mismatch/i);
  assert.match(script, /Expand-Archive/);
  assert.match(script, /\$env:Path/);
  assert.match(script, /24\.22\.2/);
});

test('developer bootstrap creates a real lock only when needed, verifies it, then uses npm ci', () => {
  const manifest = JSON.parse(read('package.json'));
  assert.equal(manifest.scripts['setup:dev'], 'node scripts/setup/bootstrap-dev.js');
  const bootstrap = read('scripts/setup/bootstrap-dev.js');
  assert.match(bootstrap, /process\.versions\.node !== expectedNode/);
  assert.match(bootstrap, /npm.*lock:prepare/);
  assert.match(bootstrap, /lock:verify/);
  assert.match(bootstrap, /ci.*--include=dev/);
  assert.match(bootstrap, /verify:licenses/);
  assert.match(bootstrap, /\['test'\]/);
});

test('platform dependency setup attempts verified Node provisioning before setup', () => {
  assert.match(read('scripts/setup/install-dependencies.sh'), /scripts\/install-node24\.sh/);
  assert.match(read('scripts/setup/install-dependencies.sh'), /scripts\/activate-node24\.sh/);
  assert.match(read('scripts/setup/install-dependencies.sh'), /npm run setup:dev/);
  assert.match(read('scripts/use-node24.sh'), /scripts\/install-node24\.sh/);
  assert.match(read('scripts/use-node24.sh'), /activate-node24/);
  assert.match(read('scripts/setup/install-dependencies.ps1'), /scripts\/install-node24\.ps1/);
  assert.match(read('scripts/setup/install-dependencies.ps1'), /npm run setup:dev/);
});
