'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Dependabot checks npm dependencies and GitHub Actions weekly', () => {
  const workflow = read('.github/dependabot.yml');
  assert.match(workflow, /package-ecosystem: npm/);
  assert.match(workflow, /package-ecosystem: github-actions/);
  assert.equal((workflow.match(/interval: weekly/g) || []).length, 2);
});

test('scheduled dependency audit prepares and verifies a lockfile before blocking high severity vulnerabilities', () => {
  const workflow = read('.github/workflows/security-audit.yml');
  assert.match(workflow, /cron:/);
  assert.match(workflow, /node-version: 24\.22\.2/);
  assert.match(workflow, /npm run lock:prepare/);
  assert.match(workflow, /npm run lock:verify/);
  assert.match(workflow, /npm ci --no-audit --no-fund/);
  assert.match(workflow, /npm audit --audit-level=high/);
});

test('release workflow builds and verifies all three desktop platforms', () => {
  const workflow = read('.github/workflows/build-release.yml');
  for (const platform of ['Linux', 'Windows', 'macOS']) {
    assert.match(workflow, new RegExp(`platform: ${platform}`));
  }
  for (const command of ['dist:linux', 'dist:win', 'dist:mac', 'release:verify:linux', 'release:verify:win', 'release:verify:mac']) {
    assert.ok(workflow.includes(command), `workflow includes ${command}`);
  }
  assert.match(workflow, /node-version: 24\.22\.2/);
  assert.match(workflow, /npm run lock:prepare/);
  assert.match(workflow, /npm run lock:verify/);
  assert.match(workflow, /brightdesk-dependency-lock/);
  assert.match(workflow, /npm run release:preflight/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm audit --audit-level=high/);
  assert.match(workflow, /pull_request:\s*branches: \[main\]/, 'standalone installer workflow runs on pull requests');
  assert.match(workflow, /npm run repositories:prepare/);
  assert.match(workflow, /name: Upload standalone app repository seeds/);
  assert.match(workflow, /Brightdesk-App-Repository-Seeds/);
  assert.match(workflow, /include-hidden-files: true/);
  assert.match(workflow, /name: Build standalone app installers/);
  assert.match(workflow, /npm run dist:apps:\$\{\{ matrix\.script \}\}/);
  assert.match(workflow, /name: Upload standalone app installers/);
  assert.ok(workflow.includes('path: release/apps/${{ matrix.platform }}/**'), 'standalone app artifacts use platform-specific folders');
});

test('pull-request builds never receive code-signing or notarisation secrets', () => {
  const workflow = read('.github/workflows/build-release.yml');
  const buildStep = workflow.split('- name: Build suite installer')[1];
  assert.ok(buildStep, 'build installer step exists');
  for (const secret of ['CSC_LINK', 'CSC_KEY_PASSWORD', 'CSC_INSTALLER_LINK', 'CSC_INSTALLER_KEY_PASSWORD', 'APPLE_ID', 'APPLE_APP_SPECIFIC_PASSWORD', 'APPLE_TEAM_ID']) {
    const line = buildStep.split('\n').find((item) => item.trimStart().startsWith(`${secret}:`));
    assert.ok(line, `${secret} is configured for the build step`);
    assert.match(line, /github\.event_name != 'pull_request'/, `${secret} is blank for pull requests`);
  }
  const installerCert = buildStep.split('\n').find((item) => item.trimStart().startsWith('CSC_INSTALLER_LINK:'));
  const appleId = buildStep.split('\n').find((item) => item.trimStart().startsWith('APPLE_ID:'));
  assert.match(installerCert, /matrix\.platform == 'macOS'/, 'macOS installer certificate is macOS-only');
  assert.match(appleId, /matrix\.platform == 'macOS'/, 'Apple notarisation identity is macOS-only');
});

test('Linux builds do not receive Windows or macOS signing credentials', () => {
  const workflow = read('.github/workflows/build-release.yml');
  const buildStep = workflow.split('- name: Build suite installer')[1];
  for (const key of ['CSC_LINK', 'CSC_KEY_PASSWORD']) {
    const line = buildStep.split('\n').find((item) => item.trimStart().startsWith(`${key}:`));
    assert.match(line, /matrix\.platform == 'Windows'/);
    assert.match(line, /matrix\.platform == 'macOS'/);
    assert.match(line, /\|\| ''/);
  }
});

test('platform release artifacts remain in separate folders and release lock metadata is retained', () => {
  const workflow = read('.github/workflows/build-release.yml');
  for (const [platform, folder] of [['Linux', 'release/Linux'], ['Windows', 'release/Windows'], ['macOS', 'release/macOS']]) {
    assert.match(workflow, new RegExp(`name: Download verified ${platform} build`));
    assert.ok(workflow.includes(`path: ${folder}`), `${platform} is downloaded into its own folder`);
  }
  assert.match(workflow, /name: Download the exact dependency lock used for this release[\s\S]*?path: release\/build-metadata/);
  assert.match(workflow, /files: release\/\*\*\/\*/);
  assert.doesNotMatch(workflow, /merge-multiple: true/);
  const prepare = read('scripts/prepare-release-assets.js');
  assert.match(prepare, /Brightdesk-\$\{label\}-LICENSE\.txt/);
  const verifier = read('scripts/verify-release-artifacts.js');
  assert.match(verifier, /Brightdesk-SHA256SUMS-\$\{platform\.toUpperCase\(\)\}/);
});

test('Node.js runtime is pinned consistently to the current 24 LTS patch', () => {
  const manifest = JSON.parse(read('package.json'));
  assert.equal(manifest.engines.node, '24.22.2');
  assert.equal(read('.nvmrc').trim(), '24.22.2');
  assert.equal(read('.node-version').trim(), '24.22.2');
  assert.match(read('.devcontainer/Dockerfile'), /^FROM node:24\.22\.2-bookworm/m);
  assert.match(read('.github/workflows/build-release.yml'), /node-version: 24\.22\.2/);
  assert.match(read('.github/workflows/security-audit.yml'), /node-version: 24\.22\.2/);
});

test('individual app installer builds explicitly disable implicit publishing', () => {
  const builder = read('scripts/build-app.js');
  assert.match(builder, /'--publish', 'never'/);
});

test('all customer installer build commands explicitly disable implicit publishing', () => {
  const manifest = JSON.parse(read('package.json'));
  for (const name of ['dist', 'dist:win', 'dist:mac', 'dist:linux']) {
    assert.match(manifest.scripts[name], /--publish never$/, `${name} must build locally without publishing`);
  }
});
