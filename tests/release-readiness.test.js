'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { versionAtLeast, runPreflight, APPROVED_IDS } = require('../scripts/release-preflight');
const { verifyArtifacts } = require('../scripts/verify-release-artifacts');

test('version comparison handles major, minor and patch versions', () => {
  assert.equal(versionAtLeast('24.0.0', '24.0.0'), true);
  assert.equal(versionAtLeast('24.1.0', '24.0.0'), true);
  assert.equal(versionAtLeast('23.99.99', '24.0.0'), false);
  assert.equal(versionAtLeast('24.0.0', '24.1.0'), false);
});

test('release preflight blocks an old runtime before validating the dependency lock', () => {
  const root = path.resolve(__dirname, '..');
  const result = runPreflight({ rootDir: root, nodeVersion: '22.16.0', platform: 'linux' });
  assert.equal(result.ready, false);
  assert.ok(result.blockers.some(item => item.name === 'Node.js version'));
  assert.ok(result.blockers.some(item => item.name === 'Dependency lockfile'), 'lock validation must not run under an unsupported Node.js version');
  assert.deepEqual(require('../src/app-catalog').map(item => item.id), APPROVED_IDS);
});

test('release preflight treats all ten approved apps as release-ready implementations', () => {
  const root = path.resolve(__dirname, '..');
  const result = runPreflight({ rootDir: root, nodeVersion: '24.22.2', platform: 'linux' });
  const check = result.checks.find(item => item.name === 'All ten approved apps available');
  assert.ok(check, 'preflight must include the integrated ten-app availability check');
  assert.equal(check.passed, true);
  assert.ok(result.checks.some(item => item.name === 'Dependency lockfile' && item.passed), 'the matching lockfile passes under the pinned Node.js runtime');
  assert.match(check.detail, /pages, sheets, slides, notes, database, forms, lists, planner, todo, loop/);
});

test('artifact verification requires all expected installer formats and writes SHA-256 sums', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-release-'));
  try {
    fs.writeFileSync(path.join(directory, 'Brightdesk-1.0.0.dmg'), 'mac-disk-image');
    fs.writeFileSync(path.join(directory, 'Brightdesk-1.0.0.zip'), 'mac-archive');
    fs.writeFileSync(path.join(directory, 'Brightdesk-1.0.0.pkg'), 'mac-installer');
    assert.throws(() => verifyArtifacts({ directory, platform: 'mac' }), /Missing expected/);
    fs.writeFileSync(path.join(directory, 'Brightdesk-macOS-TERMS_AND_CONDITIONS.txt'), 'agreement');
    fs.writeFileSync(path.join(directory, 'Brightdesk-macOS-LICENSE.txt'), 'MIT');
    fs.writeFileSync(path.join(directory, 'Brightdesk-macOS-THIRD_PARTY_NOTICES.md'), 'notices');
    const result = verifyArtifacts({ directory, platform: 'mac' });
    assert.equal(result.files.length, 6);
    assert.match(result.checksumFile, /Brightdesk-SHA256SUMS-MAC\.txt$/);
    assert.match(fs.readFileSync(result.checksumFile, 'utf8'), /[a-f0-9]{64}/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('Suite artifact checksums exclude nested product installers and unpacked build scratch', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-suite-checksums-'));
  try {
    for (const [name, contents] of [
      ['Brightdesk-1.0.0.dmg', 'Suite disk image'],
      ['Brightdesk-1.0.0.pkg', 'Suite package'],
      ['Brightdesk-1.0.0.zip', 'Suite archive'],
      ['Brightdesk-macOS-TERMS_AND_CONDITIONS.txt', 'agreement'],
      ['Brightdesk-macOS-LICENSE.txt', 'MIT'],
      ['Brightdesk-macOS-THIRD_PARTY_NOTICES.md', 'notices']
    ]) fs.writeFileSync(path.join(directory, name), contents);

    const productScratch = path.join(directory, 'apps', 'org.brightdesk.pages');
    const suiteScratch = path.join(directory, 'mac-unpacked');
    fs.mkdirSync(productScratch, { recursive: true });
    fs.mkdirSync(suiteScratch, { recursive: true });
    fs.writeFileSync(path.join(productScratch, 'Brightdesk-Pages-1.0.0-universal.dmg'), 'product installer');
    fs.writeFileSync(path.join(productScratch, 'unpacked.pkg'), 'product build scratch');
    fs.writeFileSync(path.join(suiteScratch, 'runtime.zip'), 'Suite build scratch');

    const result = verifyArtifacts({ directory, platform: 'mac' });
    const manifest = fs.readFileSync(result.checksumFile, 'utf8');
    assert.equal(result.files.length, 6, 'only the six top-level Suite/legal files are checksummed');
    assert.equal(manifest.includes('apps/'), false, 'product installers have their separate product manifest');
    assert.equal(manifest.includes('mac-unpacked/'), false, 'unpacked build output is not listed as a release artifact');
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('release terms are wired into native installers and the first-launch agreement gate', () => {
  const manifest = require('../package.json');
  assert.equal(manifest.build.nsis.license, 'TERMS_AND_CONDITIONS.txt');
  assert.equal(manifest.build.pkg.license, 'TERMS_AND_CONDITIONS.txt');
  assert.ok(manifest.build.mac.target.includes('pkg'));
  assert.ok(manifest.build.mac.target.includes('dmg'));
  assert.ok(manifest.build.files.includes('TERMS_AND_CONDITIONS.txt'));
  for (const file of ['TERMS_AND_CONDITIONS.txt','installer/install-linux.sh','src/terms.html','src/terms.js','src/terms-preload.js']) assert.ok(fs.existsSync(path.resolve(__dirname, '..', file)), `${file} exists`);
  const main = fs.readFileSync(path.resolve(__dirname, '../src/main.js'), 'utf8');
  assert.match(main, /terms:accept/);
  assert.match(main, /termsSha256/);
  assert.match(main, /createAgreementWindow/);
});

test('exact Node.js 24.22.2 runtime is required for release preflight', () => {
  const root = path.resolve(__dirname, '..');
  const result = runPreflight({ rootDir: root, nodeVersion: '24.22.1', platform: 'linux' });
  assert.equal(result.ready, false);
  assert.ok(result.blockers.some(item => item.name === 'Node.js version' && /24\.22\.2/.test(item.detail)));
});

test('lockfile verifier rejects a missing or mismatched lockfile', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-lock-'));
  try {
    fs.mkdirSync(path.join(directory, 'scripts'));
    fs.writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ name: 'brightdesk-suite', version: '0.1.0', dependencies: { alpha: '1.0.0' } }));
    const { verifyLockfile } = require('../scripts/verify-lockfile');
    assert.throws(() => verifyLockfile(directory), /package-lock.json is missing/);
    fs.writeFileSync(path.join(directory, 'package-lock.json'), JSON.stringify({ lockfileVersion: 3, packages: { '': { name: 'brightdesk-suite', version: '0.1.0', dependencies: { alpha: '2.0.0' } }, 'node_modules/alpha': { version: '2.0.0' } } }));
    assert.throws(() => verifyLockfile(directory), /dependencies do not match/);
    fs.writeFileSync(path.join(directory, 'package-lock.json'), JSON.stringify({ lockfileVersion: 3, packages: { '': { name: 'brightdesk-suite', version: '0.1.0', dependencies: { alpha: '1.0.0' } }, 'node_modules/alpha': { version: '1.0.0' } } }));
    assert.deepEqual(verifyLockfile(directory), { name: 'brightdesk-suite', version: '0.1.0', lockfileVersion: 3, dependencyCount: 1 });
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
