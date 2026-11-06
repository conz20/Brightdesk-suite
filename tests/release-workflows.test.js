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
  assert.doesNotMatch(workflow, /npm run lock:prepare/, 'release builds must not regenerate the committed lock');
  assert.match(workflow, /npm run lock:verify/);
  assert.doesNotMatch(workflow, /brightdesk-dependency-lock/, 'the committed lock is read directly from the checked-out source');
  assert.match(workflow, /npm run release:preflight/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm audit --audit-level=high/);
});

test('signing and notarisation secrets are limited to main and the matching platform', () => {
  const workflow = read('.github/workflows/build-release.yml');
  const buildStep = workflow.split('- name: Build suite installer')[1];
  assert.ok(buildStep, 'build installer step exists');
  for (const secret of ['CSC_LINK', 'CSC_KEY_PASSWORD', 'CSC_INSTALLER_LINK', 'CSC_INSTALLER_KEY_PASSWORD', 'APPLE_ID', 'APPLE_APP_SPECIFIC_PASSWORD', 'APPLE_TEAM_ID']) {
    const line = buildStep.split('\n').find((item) => item.trimStart().startsWith(`${secret}:`));
    assert.ok(line, `${secret} is configured for the build step`);
    assert.match(line, /github\.ref == 'refs\/heads\/main'/, `${secret} is available only on main`);
    assert.doesNotMatch(line, /github\.event_name != 'pull_request'/);
  }
  const installerCert = buildStep.split('\n').find((item) => item.trimStart().startsWith('CSC_INSTALLER_LINK:'));
  const appleId = buildStep.split('\n').find((item) => item.trimStart().startsWith('APPLE_ID:'));
  assert.match(installerCert, /matrix\.platform == 'macOS'/, 'macOS installer certificate is macOS-only');
  assert.match(appleId, /matrix\.platform == 'macOS'/, 'Apple notarisation identity is macOS-only');
});

test('release publishing is manual, disabled by default, and main-only', () => {
  const workflow = read('.github/workflows/build-release.yml');
  assert.match(workflow, /publish_release:\s*[\s\S]*?default: false/);
  assert.ok(workflow.includes("if: github.event_name == 'workflow_dispatch' && inputs.publish_release == true && github.ref == 'refs/heads/main'"));
});

test('release workflow prunes only stale Brightdesk installer artifacts with job-scoped permissions', () => {
  const workflow = read('.github/workflows/build-release.yml');
  const cleanup = workflow.split('  cleanup-artifacts:')[1]?.split('  prepare:')[0] || '';
  assert.ok(cleanup.includes('node scripts/prune-actions-artifacts.js'));
  assert.ok(cleanup.includes('GITHUB_TOKEN: \${{ github.token }}'));
  assert.ok(cleanup.includes('GITHUB_RUN_ID: \${{ github.run_id }}'));
  assert.match(cleanup, /permissions:\s*\n\s+actions: write\s*\n\s+contents: read/);
  assert.match(workflow, /prepare:\s*\n\s+name: Test and lock dependencies\s*\n\s+needs: cleanup-artifacts/);
  assert.equal((workflow.match(/actions: write/g) || []).length, 1, 'only the cleanup job receives Actions write access');
  const cleanupScript = read('scripts/prune-actions-artifacts.js');
  assert.match(cleanupScript, /brightdesk-\(\?:Linux\|Windows\|macOS\)/);
  assert.match(cleanupScript, /DEFAULT_MIN_AGE_MS = DAY_MS/);
  assert.match(cleanupScript, /currentRunId/);
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

test('platform release artifacts retain their platform folders and lock metadata', () => {
  const workflow = read('.github/workflows/build-release.yml');
  for (const platform of ['Linux', 'Windows', 'macOS']) {
    const block = workflow.split(`name: Download verified ${platform} build`)[1]?.split('      - name:')[0] || '';
    assert.ok(block.includes(`name: brightdesk-${platform}`));
    assert.ok(block.includes('path: release'), `${platform} is downloaded into the release root with its archived folder structure`);
  }
  assert.ok(workflow.includes('name: Check out the exact release source'));
  assert.ok(workflow.includes('ref: ${{ github.sha }}'));
  assert.ok(workflow.includes('node-version: 24.22.2'));
  assert.ok(workflow.includes('name: Preserve the committed dependency lock in release metadata'));
  assert.ok(workflow.includes('cp package-lock.json release/build-metadata/package-lock.json'));
  assert.ok(workflow.includes('files: release/**/**'));
  assert.ok(!workflow.includes('merge-multiple: true'));
  const prepare = read('scripts/prepare-release-assets.js');
  assert.ok(prepare.includes('Brightdesk-${label}-LICENSE.txt'));
  const verifier = read('scripts/verify-release-artifacts.js');
  assert.ok(verifier.includes('Brightdesk-SHA256SUMS-${platform.toUpperCase()}'));
});

test('native release workflow builds and verifies all ten product installers on each platform', () => {
  const workflow = read('.github/workflows/build-release.yml');
  const manifest = JSON.parse(read('package.json'));
  const matrix = workflow.split('  build:')[1].split('  collect:')[0];
  const collect = workflow.split('  collect:')[1].split('  publish-release:')[0];
  for (const platform of ['win', 'mac', 'linux']) {
    assert.equal(manifest.scripts[`dist:products:${platform}`], `node scripts/build-apps.js ${platform}`);
    assert.equal(manifest.scripts[`release:verify:products:${platform}`], `node scripts/verify-product-installers.js ${platform} release/apps`);
    assert.equal(manifest.scripts[`release:collect:${platform}`], `node scripts/collect-platform-build.js ${platform}`);
  }
  assert.ok(matrix.includes('npm run dist:products:${{ matrix.script }}'));
  assert.ok(matrix.includes('npm run release:verify:products:${{ matrix.script }}'));
  assert.ok(matrix.includes('node scripts/collect-platform-build.js ${{ matrix.script }}'));
  assert.ok(matrix.includes('release/${{ matrix.platform }}/**'));
  assert.ok(matrix.includes('release/apps/${{ matrix.platform }}/**'));
  assert.ok(!matrix.includes('path: release/**'));
  assert.ok(collect.includes('npm run release:verify:complete -- release'));
  assert.ok(workflow.includes('retention-days: 1'));
  assert.ok(!workflow.includes('Upload complete Brightdesk installer bundle'));
  assert.ok(!workflow.includes('Brightdesk-${{ steps.release-version.outputs.version }}-Installers'));
  const publish = workflow.split('  publish-release:')[1];
  assert.ok(publish.includes('inputs.publish_release == true'));
  assert.ok(publish.includes('npm run release:verify:complete -- release'));
  assert.ok(
    publish.indexOf('npm run release:verify:complete -- release') < publish.indexOf('Publish verified installer files'),
    'publishing must re-verify all downloaded platform artifacts first'
  );
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
  for (const step of ['check:node', 'lock:verify', 'ci', '--no-audit', '--no-fund', 'verify:licenses', 'test', 'rea:inspect', 'release:preflight', 'audit', '--audit-level=high', 'dist:', 'release:prepare', 'release:verify:']) {
    assert.ok(script.includes(step), `local release script includes ${step}`);
  }
  assert.match(script, /process\.versions\.node/);
  assert.match(script, /process\.platform/);
  assert.match(script, /CSC_IDENTITY_AUTO_DISCOVERY/);
  assert.doesNotMatch(script, /publish always|gh release create/i);
});

test('dependency-maintenance workflows use the existing self-hosted runner', () => {
  for (const file of ['.github/workflows/generate-lockfile.yml', '.github/workflows/generate-third-party-notices.yml']) {
    assert.match(read(file), /runs-on: self-hosted/, `${file} must not consume hosted-runner minutes`);
  }
});


test('installer pipeline uses the private native runner for each operating system', () => {
  const workflow = read('.github/workflows/build-release.yml');
  assert.match(workflow, /runner: \["self-hosted", "Linux", "X64"\]/);
  assert.match(workflow, /runner: \["self-hosted", "Windows", "X64"\]/);
  assert.match(workflow, /runner: \["self-hosted", "macOS", "ARM64"\]/);
  assert.match(workflow, /runs-on: self-hosted/);
  assert.doesNotMatch(workflow, /ubuntu-latest|windows-latest|macos-latest/);
});

test('README freshness check uses the existing self-hosted runner', () => {
  const workflow = read('.github/workflows/readme-freshness.yml');
  assert.match(workflow, /runs-on: self-hosted/);
  assert.doesNotMatch(workflow, /ubuntu-latest|windows-latest|macos-latest/);
});

test('README freshness script remains compatible with macOS system Bash 3.2', () => {
  const workflow = read('.github/workflows/readme-freshness.yml');
  assert.doesNotMatch(workflow, /\bmapfile\b/, 'macOS Bash 3.2 does not provide mapfile');
  assert.match(workflow, /while IFS= read -r file; do/, 'changed files are processed with Bash 3.2-compatible syntax');
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

test('the pull-request macOS installer check builds and verifies all ten product installers', () => {
  const workflow = read('.github/workflows/verify-macos-installer.yml');
  assert.match(workflow, /runs-on: \["self-hosted", "macOS", "ARM64"\]/);
  assert.ok(workflow.includes('npm run dist:products:mac'));
  assert.ok(workflow.includes('npm run release:verify:products:mac'));
  assert.ok(
    workflow.indexOf('npm run dist:products:mac') < workflow.indexOf('npm run release:verify:products:mac'),
    'all ten product archives must be built before their checksum manifests are verified'
  );
  for (const changedPath of [
    'electron-builder.app.config.js',
    'scripts/build-app.js',
    'scripts/build-apps.js',
    'scripts/verify-product-installers.js',
    'scripts/verify-complete-release-bundle.js',
    'scripts/collect-platform-build.js',
    'tests/ten-product-release-bundle.test.js'
  ]) {
    assert.ok(workflow.includes(changedPath), 'the native macOS installer check must run when ' + changedPath + ' changes');
  }
  assert.doesNotMatch(workflow, /ubuntu-latest|windows-latest|macos-latest/);
  assert.doesNotMatch(workflow, /publish_release|gh release create|publish always/i);
});
