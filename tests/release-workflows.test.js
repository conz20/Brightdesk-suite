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

test('release workflow builds and verifies all three desktop platforms', () => {
  const workflow = read('.github/workflows/build-release.yml');
  for (const platform of ['Linux', 'Windows', 'macOS']) {
    assert.match(workflow, new RegExp(`platform: ${platform}`));
  }
  for (const command of ['dist:linux', 'dist:win', 'dist:mac', 'release:verify:linux', 'release:verify:win', 'release:verify:mac']) {
    assert.ok(workflow.includes(command), `workflow includes ${command}`);
  }
  assert.match(workflow, /node-version: 24\.22\.2/);
  assert.match(workflow, /\non:\s*\n\s*workflow_dispatch:/);
  assert.doesNotMatch(workflow, /^\s+push:/m, 'installer builds must be manual, not automatic on push');
  assert.match(workflow, /npm run lock:prepare/);
  assert.match(workflow, /npm run lock:verify/);
  assert.match(workflow, /brightdesk-dependency-lock/);
  assert.match(workflow, /npm run release:preflight/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm audit --audit-level=high/);
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
  assert.match(matrixBuild, /release\/apps\/\$\{\{ matrix\.platform \}\}\/\*\*/);
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
