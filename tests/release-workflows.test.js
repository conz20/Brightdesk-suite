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

test('release workflow builds all three platforms sequentially on the self-hosted Mac without GitHub artifacts', () => {
  const workflow = read('.github/workflows/build-release.yml');
  assert.ok(workflow.includes('runs-on: [self-hosted, macOS, ARM64]'));
  assert.equal((workflow.match(/runs-on: \[self-hosted, macOS, ARM64\]/g) || []).length, 1);
  assert.ok(workflow.includes('branches: [main, feature/standalone-downloads-all-ten]'));
  assert.equal(workflow.includes('pull_request:'), false);
  assert.match(workflow, /node-version: 24\.22\.2/);
  for (const command of ['npm run lock:prepare', 'npm run lock:verify', 'npm ci --no-audit --no-fund', 'npm test', 'npm run verify:licenses', 'npm run release:preflight', 'npm audit --audit-level=high']) {
    assert.ok(workflow.includes(command), `workflow includes ${command}`);
  }
  const dockerHelper = read('scripts/build-in-docker.sh');
  for (const platform of ['linux', 'win']) {
    assert.ok(dockerHelper.includes(`npm run release:verify:${platform}`), `${platform} suite verifier is included`);
    assert.ok(dockerHelper.includes(`npm run release:verify:products:${platform}`), `${platform} product verifier is included`);
    assert.ok(dockerHelper.includes(`npm run dist:products:${platform}`), `${platform} product build is included`);
    assert.ok(workflow.includes(`bash scripts/build-in-docker.sh ${platform}`), `${platform} container helper is called`);
  }
  for (const command of ['npm run dist:mac', 'npm run release:verify:mac', 'npm run dist:products:mac', 'npm run release:verify:products:mac']) {
    assert.ok(workflow.includes(command), `workflow includes ${command}`);
  }
  for (const platform of ['linux', 'win', 'mac']) {
    assert.ok(workflow.includes(`node scripts/collect-platform-build.js ${platform}`), `${platform} files are collected locally`);
  }
  assert.ok(workflow.includes('name: Save verified build output on this Mac'));
  assert.ok(workflow.includes('Brightdesk-Builds'));
  assert.equal(workflow.includes('actions/upload-artifact'), false);
  assert.equal(workflow.includes('actions/download-artifact'), false);
  assert.match(workflow, /Detect and expose Docker Desktop CLI/);
  assert.match(workflow, /\/Applications\/Docker\.app\/Contents\/Resources\/bin/);
  assert.match(workflow, /\$GITHUB_PATH/);
  assert.match(workflow, /docker version/);
  assert.equal(workflow.includes('publish-release:'), false);
});

test('code-signing secrets are limited to their relevant platform build steps', () => {
  const workflow = read('.github/workflows/build-release.yml');
  assert.equal(workflow.includes('pull_request:'), false);
  const windows = workflow.split('- name: Build Windows suite and all ten standalone apps')[1].split('- name: Build Linux suite and all ten standalone apps')[0];
  const linux = workflow.split('- name: Build Linux suite and all ten standalone apps')[1].split('- name: Build macOS suite and all ten standalone apps')[0];
  const mac = workflow.split('- name: Build macOS suite and all ten standalone apps')[1].split('- name: Save verified build output on this Mac')[0];
  assert.ok(linux && windows && mac, 'all three platform build steps exist');
  assert.doesNotMatch(linux, /secrets\./);
  assert.match(windows, /secrets\.WIN_CSC_LINK/);
  assert.match(windows, /secrets\.WIN_CSC_KEY_PASSWORD/);
  assert.match(mac, /secrets\.MAC_APP_CSC_LINK/);
  assert.match(mac, /secrets\.MAC_INSTALLER_CSC_LINK/);
  assert.match(mac, /secrets\.APPLE_APP_SPECIFIC_PASSWORD/);
});

test('Windows cross-build uses Wine 10.4 to avoid the Apple Silicon Docker memory assertion', () => {
  const helper = read('scripts/build-in-docker.sh');
  assert.match(helper, /docker run --rm --platform linux\/amd64/);
  assert.match(helper, /--user/);
  assert.match(helper, /npm run check:node/);
  assert.match(helper, /--env DISPLAY=/);
  assert.match(helper, /--env WINEDLLOVERRIDES=mscoree,mshtml=/);
  assert.match(helper, /npm ci --no-audit --no-fund/);
  assert.match(helper, /node scripts\/patch-electron-builder-nsis\.js/);
  const nsisPatch = read('scripts/patch-electron-builder-nsis.js');
  assert.match(nsisPatch, /Expected app-builder-lib 26\.18\.0/);
  assert.match(nsisPatch, /UninstallerReader/);
  assert.match(helper, /linux\) builder_image="brightdesk-electron-builder:24\.22\.2-linux"/);
  assert.match(helper, /win\) builder_image="brightdesk-electron-builder:24\.22\.2-windows"/);
  assert.ok(helper.includes('"$builder_image"'), 'the selected build image is passed to Docker');
  for (const command of ['npm run dist:win', 'npm run dist:linux', 'npm run dist:products:win', 'npm run dist:products:linux']) {
    assert.ok(helper.includes(command), `container helper includes ${command}`);
  }

  const linuxDockerfile = read('.github/docker/electron-builder.Dockerfile');
  assert.match(linuxDockerfile, /FROM electronuserland\/builder:wine@sha256:f3a8d451994c881d0972e7b1846ee4d4fdc15eb41fc6b1f350b38cbf99ca90fe/);
  assert.match(linuxDockerfile, /ARG NODE_VERSION=24\.22\.2/);
  assert.match(linuxDockerfile, /361718c444e49af2ca5a110c83ba6a8901143f23ab285ebbef0341f391f482a9/);

  const windowsDockerfile = read('.github/docker/electron-builder-windows.Dockerfile');
  assert.match(windowsDockerfile, /FROM scottyhardy\/docker-wine:devel-10\.4/);
  assert.match(windowsDockerfile, /ARG NODE_VERSION=24\.22\.2/);
  assert.match(windowsDockerfile, /test "\$\(wine --version\)" = "wine-10\.4"/);

  const workflow = read('.github/workflows/build-release.yml');
  assert.match(workflow, /brightdesk-electron-builder:24\.22\.2-linux/);
  assert.match(workflow, /brightdesk-electron-builder:24\.22\.2-windows/);
  assert.ok(workflow.indexOf('Build Windows suite and all ten standalone apps') < workflow.indexOf('Build Linux suite and all ten standalone apps'), 'Windows is tested first so Wine failures are found before the longer Linux build');
  assert.equal(workflow.includes('wineboot --init'), false, 'the actual Windows packaging run is the Wine integration test');
});

test('platform installer folders are assembled locally with dependency lock metadata retained', () => {
  const workflow = read('.github/workflows/build-release.yml');
  const collector = read('scripts/collect-platform-build.js');
  for (const label of ['Linux', 'Windows', 'macOS']) assert.ok(collector.includes(label));
  assert.match(workflow, /release\/build-metadata/);
  assert.match(workflow, /Brightdesk-Builds/);
  assert.match(workflow, /ditto -c -k/);
  assert.match(collector, /Refusing to overwrite/);
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

test('new automatic installer checks replace stale builds without cancelling manual release runs', () => {
  const workflow = read('.github/workflows/build-release.yml');
  assert.match(workflow, /group: brightdesk-installer-build-\$\{\{ github\.ref \}\}-\$\{\{ github\.event_name \}\}/);
  assert.match(workflow, /cancel-in-progress: \$\{\{ github\.event_name != 'workflow_dispatch' \}\}/);
});
