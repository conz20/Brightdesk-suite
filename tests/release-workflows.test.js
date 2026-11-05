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

test('scheduled dependency audit uses hosted Ubuntu and blocks high severity vulnerabilities', () => {
  const workflow = read('.github/workflows/security-audit.yml');
  assert.match(workflow, /cron:/);
  assert.match(workflow, /runs-on: ubuntu-latest/);
  assert.match(workflow, /node-version: 24\.22\.2/);
  assert.doesNotMatch(workflow, /npm run lock:prepare/);
  const requiredOrder = [
    'npm ci --no-audit --no-fund',
    'npm run lock:verify',
    'npm run verify:licenses',
    'npm test',
    'npm audit --audit-level=high'
  ];
  let previousIndex = -1;
  for (const command of requiredOrder) {
    const currentIndex = workflow.indexOf(command);
    assert.ok(currentIndex > previousIndex, 'security workflow runs ' + command + ' in order');
    previousIndex = currentIndex;
  }
  assert.equal(workflow.includes('self-hosted'), false);
});

test('daily quality workflow uses hosted Ubuntu and never publishes a release', () => {
  const workflow = read('.github/workflows/continuous-quality.yml');
  assert.ok(workflow.includes("cron: '15 4 * * *'"));
  assert.match(workflow, /runs-on: ubuntu-latest/);
  assert.ok(workflow.includes('node-version: 24.22.2'));
  assert.doesNotMatch(workflow, /npm run lock:prepare/);
  const requiredOrder = [
    'npm ci --no-audit --no-fund',
    'npm run lock:verify',
    'npm run verify:licenses',
    'npm test',
    'npm run release:preflight',
    'npm audit --audit-level=high'
  ];
  let previousIndex = -1;
  for (const command of requiredOrder) {
    const currentIndex = workflow.indexOf(command);
    assert.ok(currentIndex > previousIndex, 'quality workflow runs ' + command + ' in order');
    previousIndex = currentIndex;
  }
  assert.equal(workflow.includes('pull_request:'), false);
  assert.equal(workflow.includes('softprops/action-gh-release'), false);
  assert.equal(workflow.includes('contents: write'), false);
  assert.equal(workflow.includes('self-hosted'), false);
});

test('installer workflow builds suite and all ten standalone apps on native hosted runners', () => {
  const workflow = read('.github/workflows/build-release.yml');
  assert.ok(workflow.includes('runs-on: ${{ matrix.runner }}'));
  for (const runner of ['ubuntu-latest', 'windows-latest', 'macos-latest']) {
    assert.ok(workflow.includes(runner), runner + ' runner is configured');
  }
  for (const command of [
    'npm run check:node',
    'npm run lock:verify',
    'npm ci --no-audit --no-fund',
    'npm run verify:licenses',
    'npm test',
    'npm run repositories:prepare',
    'npm run release:preflight',
    'npm audit --audit-level=high',
    'npm run dist:win',
    'npm run release:verify:win',
    'npm run dist:products:win',
    'npm run release:verify:products:win',
    'npm run dist:linux',
    'npm run release:verify:linux',
    'npm run dist:products:linux',
    'npm run release:verify:products:linux',
    'npm run dist:mac',
    'npm run release:verify:mac',
    'npm run dist:products:mac',
    'npm run release:verify:products:mac'
  ]) {
    assert.ok(workflow.includes(command), 'workflow includes ' + command);
  }

  const prepare = workflow.split('  build:')[0];
  const requiredPrepareOrder = [
    'npm ci --no-audit --no-fund',
    'npm run lock:verify',
    'npm run verify:licenses',
    'npm test',
    'npm run release:preflight',
    'npm audit --audit-level=high'
  ];
  let previousPrepareIndex = -1;
  for (const command of requiredPrepareOrder) {
    const currentIndex = prepare.indexOf(command);
    assert.ok(currentIndex > previousPrepareIndex, 'prepare job runs ' + command + ' in the required order');
    previousPrepareIndex = currentIndex;
  }
  assert.equal(prepare.includes('npm run lock:prepare'), false, 'release validation must never regenerate the committed lockfile');

  const platformBuild = workflow.split('  build:')[1].split('  collect:')[0];
  assert.ok(platformBuild.indexOf('npm ci --no-audit --no-fund') < platformBuild.indexOf('npm run lock:verify'), 'platform jobs install from the committed lock before verifying it');
  assert.ok(workflow.includes('node scripts/collect-platform-build.js win'));
  assert.ok(workflow.includes('node scripts/collect-platform-build.js linux'));
  assert.ok(workflow.includes('node scripts/collect-platform-build.js mac'));
  assert.ok(workflow.includes('Brightdesk-Product-Repositories-0.1.0'));
  assert.ok(workflow.includes('include-hidden-files: true'));
  assert.ok(workflow.includes('Brightdesk-0.1.0-Installers'));
  assert.ok(workflow.includes('retention-days: 14'));
  assert.equal(workflow.includes('self-hosted'), false);
  assert.equal(workflow.includes('build-in-docker.sh'), false);
  assert.equal(workflow.includes('docker build'), false);
});

test('code-signing secrets are limited to their relevant platform on main', () => {
  const workflow = read('.github/workflows/build-release.yml');
  const windows = workflow.split('Build Windows suite and all ten product installers')[1].split('Build Linux suite and all ten product installers')[0];
  const linux = workflow.split('Build Linux suite and all ten product installers')[1].split('Build macOS suite and all ten product installers')[0];
  const mac = workflow.split('Build macOS suite and all ten product installers')[1].split('Upload verified platform installer bundle')[0];
  assert.ok(linux && windows && mac, 'all three platform build steps exist');
  assert.doesNotMatch(linux, /secrets\./);
  assert.match(windows, /secrets\.WIN_CSC_LINK/);
  assert.match(windows, /secrets\.WIN_CSC_KEY_PASSWORD/);
  assert.match(mac, /secrets\.MAC_APP_CSC_LINK/);
  assert.match(mac, /secrets\.MAC_INSTALLER_CSC_LINK/);
  assert.match(mac, /secrets\.APPLE_APP_SPECIFIC_PASSWORD/);
  for (const block of [windows, mac]) {
    assert.match(block, /github\.ref == 'refs\/heads\/main'/);
  }
});

test('release publishing is manual, main-only and version-matched', () => {
  const workflow = read('.github/workflows/build-release.yml');
  assert.match(workflow, /publish_release:[\s\S]*?default: false/);
  assert.match(workflow, /github\.event_name == 'workflow_dispatch'/);
  assert.match(workflow, /inputs\.publish_release == true/);
  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.ok(workflow.includes('version=$(node -p "require(\'./package.json\').version")'));
  assert.ok(workflow.includes('expected_tag="v${version}"'));
  assert.match(workflow, /fail_on_unmatched_files: true/);
  assert.match(workflow, /contents: write/);
});
