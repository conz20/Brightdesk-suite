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

test('daily quality workflow checks the integrated suite without publishing a release', () => {
  const workflow = read('.github/workflows/continuous-quality.yml');
  assert.ok(workflow.includes("cron: '15 4 * * *'"));
  assert.ok(workflow.includes("if: github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository"));
  assert.ok(workflow.includes('node-version: 24.22.2'));
  assert.match(workflow, /npm run lock:prepare/);
  assert.match(workflow, /npm run lock:verify/);
  assert.match(workflow, /npm ci --no-audit --no-fund/);
  assert.match(workflow, /npm run verify:licenses/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm run release:preflight/);
  assert.match(workflow, /npm audit --audit-level=high/);
  assert.equal(workflow.includes('softprops/action-gh-release'), false);
  assert.equal(workflow.includes('contents: write'), false);
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
  assert.doesNotMatch(workflow, /^  pull_request:/m, 'expensive installer builds stay off pull requests; continuous-quality.yml is the PR gate');
  assert.ok(workflow.includes('branches: [main, feature/standalone-downloads-all-ten]'));
  assert.match(workflow, /npm run repositories:prepare/);
  assert.match(workflow, /name: Upload product repository folders/);
  assert.match(workflow, /Brightdesk-Product-Repository-Folders/);
  assert.match(workflow, /include-hidden-files: true/);
  assert.match(workflow, /name: Build suite and ten standalone installers/);
  for (const command of ['npm run dist:products:linux', 'npm run dist:products:win', 'npm run dist:products:mac']) {
    assert.ok(workflow.includes(command), `workflow includes ${command}`);
  }
  assert.match(workflow, /name: Upload product desktop installers/);
  assert.ok(workflow.includes('path: release/apps/${{ matrix.platform }}/**'), 'product installer artifacts use platform-specific folders');
});

test('pull-request builds never receive code-signing or notarisation secrets', () => {
  const workflow = read('.github/workflows/build-release.yml');
  const buildStep = workflow.split('- name: Build suite and ten standalone installers')[1];
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
  const buildStep = workflow.split('- name: Build suite and ten standalone installers')[1];
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

test('installer release jobs share the self-hosted Mac and cross-build Windows and Linux in Docker', () => {
  const workflow = read('.github/workflows/build-release.yml');
  assert.equal((workflow.match(/runs-on: \[self-hosted, macOS, ARM64\]/g) || []).length, 4);
  assert.match(workflow, /max-parallel: 1/);
  assert.match(workflow, /uses: actions\/checkout@[a-f0-9]{40}/);
  assert.match(workflow, /uses: actions\/setup-node@[a-f0-9]{40}/);
  assert.doesNotMatch(workflow, /uses: [^\n]+@(v4|v2|main|master)/);
  assert.match(workflow, /docker build --platform linux\/amd64 --pull/);
  assert.match(workflow, /docker run --rm --platform linux\/amd64/);
  assert.match(workflow, /npm run check:node/);
  assert.match(workflow, /brightdesk-electron-builder:24\.22\.2/);
  assert.doesNotMatch(workflow, /ubuntu-latest|windows-latest|macos-latest/);
  const dockerfile = read('.github/docker/electron-builder.Dockerfile');
  assert.match(dockerfile, /FROM electronuserland\/builder:wine@sha256:f3a8d451994c881d0972e7b1846ee4d4fdc15eb41fc6b1f350b38cbf99ca90fe/);
  assert.match(dockerfile, /ARG NODE_VERSION=24\.22\.2/);
  assert.match(dockerfile, /361718c444e49af2ca5a110c83ba6a8901143f23ab285ebbef0341f391f482a9/);
});

test('new automatic installer checks replace stale builds without cancelling manual release runs', () => {
  const workflow = read('.github/workflows/build-release.yml');
  assert.match(workflow, /group: brightdesk-installer-build-\$\{\{ github\.ref \}\}-\$\{\{ github\.event_name \}\}/);
  assert.match(workflow, /cancel-in-progress: \$\{\{ github\.event_name != 'workflow_dispatch' \}\}/);
});
