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

test('one consolidated quality gate uses the self-hosted runner and verifies the committed dependency lock', () => {
  const workflow = read('.github/workflows/quality.yml');
  assert.match(workflow, /pull_request:\s*\n\s*branches: \[main\]/);
  assert.match(workflow, /cron:/);
  assert.match(workflow, /runs-on: self-hosted/);
  assert.match(workflow, /node-version: 24\.22\.2/);
  for (const command of [
    'npm run check:node',
    'npm run lock:verify',
    'npm ci --no-audit --no-fund',
    'npm run verify:licenses',
    'npm test',
    'npm run release:preflight',
    'npm audit --audit-level=high'
  ]) assert.ok(workflow.includes(command), `quality gate includes ${command}`);
  assert.ok(workflow.indexOf('npm run lock:verify') < workflow.indexOf('npm ci --no-audit --no-fund'));
  assert.doesNotMatch(workflow, /npm run lock:prepare/);
  for (const obsolete of ['integration-ci.yml', 'lists-ci.yml', 'security-audit.yml', 'todo-ci.yml']) {
    assert.equal(fs.existsSync(path.join(root, '.github', 'workflows', obsolete)), false, `${obsolete} must not duplicate the consolidated gate`);
  }
});

test('release workflow builds on private native runners using the committed lock', () => {
  const workflow = read('.github/workflows/build-release.yml');
  for (const platform of ['Linux', 'Windows', 'macOS']) assert.match(workflow, new RegExp('platform: ' + platform));
  for (const command of ['dist:linux', 'dist:win', 'dist:mac', 'release:verify:linux', 'release:verify:win', 'release:verify:mac']) {
    assert.ok(workflow.includes(command), 'workflow includes ' + command);
  }
  assert.match(workflow, /node-version: 24\.22\.2/);
  assert.match(workflow, /\non:\s*\n\s*workflow_dispatch:/);
  assert.doesNotMatch(workflow, /^\s+push:/m, 'installer builds must be manual');
  assert.doesNotMatch(workflow, /npm run lock:prepare/);
  assert.match(workflow, /npm run lock:verify/);
  assert.doesNotMatch(workflow, /brightdesk-dependency-lock/);
  assert.match(workflow, /npm run release:preflight/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm audit --audit-level=high/);
  assert.ok(workflow.includes('runner: ["self-hosted", "Linux", "X64"]'));
  assert.ok(workflow.includes('runner: ["self-hosted", "Windows", "X64"]'));
  assert.ok(workflow.includes('runner: ["self-hosted", "macOS", "ARM64"]'));
});

test('signing and notarisation secrets are restricted to the main branch', () => {
  const workflow = read('.github/workflows/build-release.yml');
  const buildStep = workflow.split('- name: Build suite installer')[1];
  assert.ok(buildStep, 'build installer step exists');
  for (const secret of ['CSC_LINK', 'CSC_KEY_PASSWORD', 'CSC_INSTALLER_LINK', 'CSC_INSTALLER_KEY_PASSWORD', 'APPLE_ID', 'APPLE_APP_SPECIFIC_PASSWORD', 'APPLE_TEAM_ID']) {
    const line = buildStep.split('\n').find((item) => item.trimStart().startsWith(`${secret}:`));
    assert.ok(line, `${secret} is configured for the build step`);
    assert.match(line, /github\.ref == 'refs\/heads\/main'/, `${secret} is available only on main`);
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

test('platform artifacts retain Suite and ten product folders through full-bundle verification', () => {
  const workflow = read('.github/workflows/build-release.yml');
  const matrixBuild = workflow.split('  build:')[1].split('  collect:')[0];
  const collect = workflow.split('  collect:')[1].split('  publish-release:')[0];
  for (const platform of ['Linux', 'Windows', 'macOS']) {
    const downloadName = 'name: Download verified ' + platform + ' build';
    const start = collect.indexOf(downloadName);
    const next = collect.indexOf('\n      - name:', start + downloadName.length);
    const download = collect.slice(start, next < 0 ? collect.length : next);
    assert.match(download, /path: release\s*$/m);
  }
  assert.match(matrixBuild, /path: release\/\*\*/);
  assert.match(collect, /name: Preserve the committed dependency lock in release metadata[\s\S]*?cp package-lock.json release\/build-metadata\/package-lock.json/);
  assert.match(collect, /npm run release:verify:complete -- release/);
  assert.ok(collect.indexOf('npm run release:verify:complete -- release') < collect.indexOf('Upload complete Brightdesk installer bundle'));
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
  assert.match(read('.github/workflows/quality.yml'), /node-version: 24\.22\.2/);
});

test('individual app installer builds explicitly disable implicit publishing', () => {
  const builder = read('scripts/build-app.js');
  assert.match(builder, /'--publish', 'never'/);
});

test('all customer installer build commands explicitly disable implicit publishing', () => {
  const manifest = JSON.parse(read('package.json'));
  for (const name of ['dist', 'dist:win', 'dist:mac', 'dist:linux', 'release']) {
    assert.match(manifest.scripts[name], /--publish never$/, `${name} must build locally without publishing`);
  }
});

test('local release verification runs tests and builds only for the current native platform', () => {
  const manifest = JSON.parse(read('package.json'));
  assert.equal(manifest.scripts['verify:local-release'], 'node scripts/verify-local-release.js');
  const script = read('scripts/verify-local-release.js');
  for (const step of ['check:node', 'lock:verify', 'ci', '--no-audit', '--no-fund', 'verify:licenses', 'test', 'rea:inspect', 'release:preflight', 'audit', '--audit-level=high', 'dist:', 'release:prepare', 'release:verify:', 'dist:products:', 'release:verify:products:', 'release:collect:']) {
    assert.ok(script.includes(step), `local release script includes ${step}`);
  }
  assert.match(script, /process\.versions\.node/);
  assert.match(script, /process\.platform/);
  assert.match(script, /CSC_IDENTITY_AUTO_DISCOVERY/);
  for (const platform of ['win', 'mac', 'linux']) {
    assert.ok(manifest.scripts[`dist:products:${platform}`]);
    assert.ok(manifest.scripts[`release:verify:products:${platform}`]);
    assert.ok(manifest.scripts[`release:collect:${platform}`]);
  }
  assert.match(script, /release:verify:products/);
  assert.match(script, /release:collect/);
  assert.doesNotMatch(script, /publish always|gh release create/i);
});

test('GitHub Release publishing is manual, main-only and disabled by default', () => {
  const workflow = read('.github/workflows/build-release.yml');
  assert.match(workflow, /publish_release:[\s\S]*?default: false/);
  assert.match(workflow, /if: github\.event_name == 'workflow_dispatch' && inputs\.publish_release == true && github\.ref == 'refs\/heads\/main'/);
  const releaseJob = workflow.split('  publish-release:')[1];
  assert.match(releaseJob, /permissions:\n      contents: write/);
});

test('README freshness validation uses the private runner and Bash 3.2-compatible commands', () => {
  const workflow = read('.github/workflows/readme-freshness.yml');
  assert.match(workflow, /runs-on: self-hosted/);
  assert.doesNotMatch(workflow, /runs-on: ubuntu-latest|\bmapfile\b/);
  assert.match(workflow, /changed_files="\$\(git diff --name-only/);
  assert.match(workflow, /while IFS= read -r file/);
  assert.match(workflow, /actions\/checkout@11bd71901bbe5b1630ceea73d27597364c9af683/);
});

test('dependency-maintenance workflows use the existing self-hosted runner', () => {
  for (const file of ['.github/workflows/generate-lockfile.yml', '.github/workflows/generate-third-party-notices.yml']) {
    assert.match(read(file), /runs-on: self-hosted/, `${file} must not consume hosted-runner minutes`);
  }
});



test('native release matrix builds and collects all ten product installers before upload', () => {
  const workflow = read('.github/workflows/build-release.yml');
  const manifest = JSON.parse(read('package.json'));
  const matrixBuild = workflow.split('  build:')[1].split('  collect:')[0];
  const collect = workflow.split('  collect:')[1].split('  publish-release:')[0];

  for (const platform of ['win', 'mac', 'linux']) {
    assert.equal(manifest.scripts[`dist:products:${platform}`], `node scripts/build-apps.js ${platform}`);
    assert.equal(manifest.scripts[`release:verify:products:${platform}`], `node scripts/verify-product-installers.js ${platform} release/apps`);
  }
  assert.match(matrixBuild, /npm run dist:products:\$\{\{ matrix\.script \}\}/);
  assert.match(matrixBuild, /npm run release:verify:products:\$\{\{ matrix\.script \}\}/);
  assert.match(matrixBuild, /node scripts\/collect-platform-build\.js \$\{\{ matrix\.script \}\}/);
  assert.match(matrixBuild, /path: release\/\*\*/);
  for (const platform of ['Linux', 'Windows', 'macOS']) {
    const download = collect.split(`name: brightdesk-${platform}`)[1].split('\n      - name:')[0];
    assert.match(download, /path: release/);
  }

  assert.match(collect, /node-version: 24\.22\.2/);
  assert.match(collect, /npm run release:verify:complete -- release/);
  assert.ok(
    collect.indexOf('npm run release:verify:complete -- release') <
      collect.indexOf('Upload complete Brightdesk installer bundle'),
    'the combined artifact must be uploaded only after the complete integrity check'
  );
  assert.equal(
    manifest.scripts['release:verify:complete'],
    'node scripts/verify-complete-release-bundle.js'
  );
});

test('product verifier is wired to the ten approved outputs and their post-transfer SHA-256 manifests', () => {
  const verifier = read('scripts/verify-product-installers.js');
  const complete = read('scripts/verify-complete-release-bundle.js');
  for (const id of ['pages', 'sheets', 'slides', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'loop']) {
    assert.match(verifier, new RegExp(`\\b${id}: '`));
  }
  assert.match(verifier, /verifyChecksumManifest\(/);
  assert.match(complete, /verifyChecksumManifest\(/);
  assert.match(complete, /installerCount !== 66/);
  assert.match(complete, /lock\.packages\?\.\[''\]\?\.version/);
});

test('README freshness workflow protects the private runner from forked pull requests', () => {
  const workflow = read('.github/workflows/readme-freshness.yml');
  const guard = /if:\s*github\.event_name != 'pull_request' \|\| github\.event\.pull_request\.head\.repo\.full_name == github\.repository/;
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /runs-on:\s*self-hosted/);
  assert.match(workflow, guard);
});

test('all third-party workflow actions are pinned to full commit SHAs', () => {
  const workflowDirectory = path.join(root, '.github', 'workflows');
  const workflowFiles = fs.readdirSync(workflowDirectory).filter(file => file.endsWith('.yml'));
  for (const file of workflowFiles) {
    const workflow = read('.github/workflows/' + file);
    for (const line of workflow.split(/\r?\n/)) {
      const match = /^\s*uses:\s*([^\s#]+)/.exec(line);
      if (!match || match[1].startsWith('./')) continue;
      assert.match(match[1], /@[0-9a-f]{40}$/, file + ' must pin ' + match[1] + ' to a full commit SHA');
    }
  }
});

test('ten-product installer builds receive signing credentials only on main for the matching platform', () => {
  const workflow = read('.github/workflows/build-release.yml');
  const step = workflow.split('- name: Build all ten product installers on this native platform')[1];
  assert.ok(step, 'product installer build step exists');
  for (const key of ['CSC_LINK', 'CSC_KEY_PASSWORD', 'CSC_INSTALLER_LINK', 'CSC_INSTALLER_KEY_PASSWORD', 'APPLE_ID', 'APPLE_APP_SPECIFIC_PASSWORD', 'APPLE_TEAM_ID']) {
    const line = step.split('\n').find(item => item.trimStart().startsWith(key + ':'));
    assert.ok(line, key + ' must be passed to the product build');
    assert.match(line, /github\.ref == 'refs\/heads\/main'/);
  }
  assert.match(step, /matrix\.platform == 'Windows'/);
  assert.match(step, /matrix\.platform == 'macOS'/);
});

