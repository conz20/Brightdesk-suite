'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  PRODUCTS,
  expectedProductFiles,
  resolveProductFiles,
  verifyProductInstallers
} = require('../scripts/verify-product-installers');
const { collectPlatformBuild } = require('../scripts/collect-platform-build');
const { expectedSuiteFiles, verifyCompleteReleaseBundle } = require('../scripts/verify-complete-release-bundle');

const VERSION = '0.1.0';
const SUITE_MANIFEST = {
  win: 'Brightdesk-SHA256SUMS-WIN.txt',
  mac: 'Brightdesk-SHA256SUMS-MAC.txt',
  linux: 'Brightdesk-SHA256SUMS-LINUX.txt'
};

function writeFile(directory, filename, value = `fixture:${filename}`) {
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, filename), value);
}

function writeManifest(directory, filename, files) {
  const rows = files.map(filename => {
    const bytes = fs.readFileSync(path.join(directory, filename));
    return `${crypto.createHash('sha256').update(bytes).digest('hex')}  ${filename}`;
  });
  writeFile(directory, filename, `${rows.join('\n')}\n`);
}

function suiteFiles(platform) {
  if (platform === 'win') {
    return [
      `Brightdesk-Office-Suite-${VERSION}-x64.exe`,
      'Brightdesk-Windows-TERMS_AND_CONDITIONS.txt',
      'Brightdesk-Windows-LICENSE.txt',
      'Brightdesk-Windows-THIRD_PARTY_NOTICES.md'
    ];
  }
  if (platform === 'mac') {
    return [
      `Brightdesk-Office-Suite-${VERSION}-universal.dmg`,
      `Brightdesk-Office-Suite-${VERSION}-universal.pkg`,
      `Brightdesk-Office-Suite-${VERSION}-universal.zip`,
      'Brightdesk-macOS-TERMS_AND_CONDITIONS.txt',
      'Brightdesk-macOS-LICENSE.txt',
      'Brightdesk-macOS-THIRD_PARTY_NOTICES.md'
    ];
  }
  return [
    `Brightdesk-Office-Suite-${VERSION}-x64.AppImage`,
    `brightdesk-office-suite-${VERSION}-amd64.deb`,
    'Brightdesk-Install-Linux.sh',
    'Brightdesk-Linux-TERMS_AND_CONDITIONS.txt',
    'Brightdesk-Linux-LICENSE.txt',
    'Brightdesk-Linux-THIRD_PARTY_NOTICES.md'
  ];
}

function createCompleteBundle() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-66-installer-'));
  const release = path.join(root, 'release');
  fs.mkdirSync(path.join(release, 'build-metadata'), { recursive: true });
  writeFile(path.join(release, 'build-metadata'), 'package-lock.json', JSON.stringify({
    name: 'brightdesk-office-suite',
    version: VERSION,
    lockfileVersion: 3,
    packages: { '': { version: VERSION } }
  }));

  for (const platform of ['win', 'mac', 'linux']) {
    const label = { win: 'Windows', mac: 'macOS', linux: 'Linux' }[platform];
    const directory = path.join(release, label);
    const files = suiteFiles(platform);
    for (const filename of files) writeFile(directory, filename);
    writeManifest(directory, SUITE_MANIFEST[platform], files);
  }

  for (const platform of ['win', 'mac', 'linux']) {
    const label = { win: 'Windows', mac: 'macOS', linux: 'Linux' }[platform];
    for (const productId of Object.keys(PRODUCTS)) {
      const directory = path.join(release, 'apps', label, productId);
      const files = expectedProductFiles(productId, platform, VERSION);
      for (const filename of files) writeFile(directory, filename);
      writeManifest(directory, `Brightdesk-${productId}-SHA256SUMS-${platform.toUpperCase()}.txt`, files);
    }
  }
  return { root, release };
}

test('product verifier expects the approved ten products and platform-specific installer sets', () => {
  assert.deepEqual(Object.keys(PRODUCTS), [
    'pages', 'sheets', 'slides', 'notes', 'database',
    'forms', 'lists', 'planner', 'todo', 'loop'
  ]);
  assert.deepEqual(expectedProductFiles('pages', 'win', VERSION), [
    'Brightdesk-Pages-0.1.0-x64.exe'
  ]);
  assert.deepEqual(expectedProductFiles('pages', 'mac', VERSION), [
    'Brightdesk-Pages-0.1.0-universal.dmg',
    'Brightdesk-Pages-0.1.0-universal.pkg',
    'Brightdesk-Pages-0.1.0-universal.zip'
  ]);
  assert.deepEqual(expectedProductFiles('pages', 'linux', VERSION), [
    'brightdesk-pages-0.1.0-x86_64.AppImage',
    'brightdesk-pages-0.1.0-amd64.deb'
  ]);
});

test('Linux product resolver accepts a single known Electron Builder x64 naming variant', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-linux-arch-'));
  try {
    writeFile(root, 'brightdesk-pages-0.1.0-x64.AppImage');
    writeFile(root, 'brightdesk-pages-0.1.0-x64.deb');
    assert.deepEqual(
      resolveProductFiles(root, 'pages', 'linux', VERSION),
      ['brightdesk-pages-0.1.0-x64.AppImage', 'brightdesk-pages-0.1.0-x64.deb']
    );
    writeFile(root, 'brightdesk-pages-0.1.0-x86_64.AppImage');
    assert.throws(
      () => resolveProductFiles(root, 'pages', 'linux', VERSION),
      /exactly one Brightdesk Pages Linux AppImage/
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('product verifier checks every expected installer and writes verifiable SHA-256 manifests', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-product-verify-'));
  try {
    const directory = path.join(root, 'apps');
    for (const productId of Object.keys(PRODUCTS)) {
      const productDirectory = path.join(directory, productId);
      for (const filename of expectedProductFiles(productId, 'mac', VERSION)) {
        writeFile(productDirectory, filename);
      }
    }
    const result = verifyProductInstallers({ directory, platform: 'mac', version: VERSION });
    assert.equal(result.productCount, 10);
    assert.equal(result.fileCount, 30);
    for (const item of result.products) {
      assert.equal(item.checksumVerification.fileCount, 3);
      assert.ok(fs.existsSync(item.checksumFile));
    }
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('platform collector stages only verified installer files and excludes build intermediates', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-platform-collector-'));
  try {
    const release = path.join(root, 'release');
    const suiteFilename = 'Brightdesk-Office-Suite-0.1.0-x64.exe';
    writeFile(release, suiteFilename);
    writeManifest(release, SUITE_MANIFEST.win, [suiteFilename]);
    writeFile(path.join(release, 'win-unpacked'), 'Brightdesk.exe', 'temporary Suite build output');
    writeFile(path.join(release, 'build-metadata'), 'package-lock.json', '{}');

    for (const productId of Object.keys(PRODUCTS)) {
      const productDirectory = path.join(release, 'apps', productId);
      const files = expectedProductFiles(productId, 'win', VERSION);
      for (const filename of files) writeFile(productDirectory, filename);
      writeManifest(productDirectory, `Brightdesk-${productId}-SHA256SUMS-WIN.txt`, files);
      writeFile(path.join(productDirectory, 'win-unpacked'), 'temporary.exe', 'temporary product build output');
    }

    const result = collectPlatformBuild({ rootDir: root, platform: 'win', version: VERSION });
    assert.equal(result.suiteFiles, 1);
    assert.equal(result.productFolders, 10);
    assert.equal(result.productFiles, 10);
    assert.ok(fs.existsSync(path.join(release, 'Windows', suiteFilename)));
    assert.ok(fs.existsSync(path.join(release, 'Windows', SUITE_MANIFEST.win)));
    assert.ok(fs.existsSync(path.join(release, 'apps', 'Windows', 'pages', 'Brightdesk-Pages-0.1.0-x64.exe')));
    assert.ok(fs.existsSync(path.join(release, 'apps', 'Windows', 'pages', 'Brightdesk-pages-SHA256SUMS-WIN.txt')));
    assert.ok(!fs.existsSync(path.join(release, 'apps', 'Windows', 'pages', 'win-unpacked')));
    assert.ok(fs.existsSync(path.join(release, 'apps', 'pages', 'win-unpacked', 'temporary.exe')));
    assert.ok(fs.existsSync(path.join(release, 'win-unpacked', 'Brightdesk.exe')));
    assert.ok(fs.existsSync(path.join(release, 'build-metadata', 'package-lock.json')));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('Windows Suite filename verification treats release dots literally', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-suite-version-regex-'));
  try {
    const wrong = 'Brightdesk-Office-Suite-0x1x0-x64.exe';
    writeFile(root, wrong);
    for (const filename of [
      'Brightdesk-Windows-TERMS_AND_CONDITIONS.txt',
      'Brightdesk-Windows-LICENSE.txt',
      'Brightdesk-Windows-THIRD_PARTY_NOTICES.md'
    ]) writeFile(root, filename);
    assert.throws(
      () => expectedSuiteFiles({ directory: root, platform: 'win', version: VERSION }),
      /Expected exactly one Windows Brightdesk Office Suite x64 installer; found 0/
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('Linux Suite verifier accepts the configured lower-case AppImage artifact name', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-suite-linux-name-'));
  try {
    const files = suiteFiles('linux');
    const uppercase = `Brightdesk-Office-Suite-${VERSION}-x64.AppImage`;
    const lowercase = `brightdesk-office-suite-${VERSION}-x64.AppImage`;
    for (const filename of files) writeFile(root, filename);
    fs.renameSync(path.join(root, uppercase), path.join(root, lowercase));
    const result = expectedSuiteFiles({ directory: root, platform: 'linux', version: VERSION });
    assert.ok(result.includes(lowercase));
    assert.equal(result.includes(uppercase), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('complete release verifier accepts all 66 Suite and product installer/archive files', () => {
  const fixture = createCompleteBundle();
  try {
    const result = verifyCompleteReleaseBundle({ releaseDir: fixture.release, version: VERSION });
    assert.equal(result.installerCount, 66);
    assert.equal(result.suiteInstallerCount, 6);
    assert.equal(result.productCount, 10);
    assert.equal(result.productInstallerCount, 60);
    for (const platform of ['win', 'mac', 'linux']) {
      assert.equal(result.platforms[platform].productCount, 10);
    }
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('complete release verifier rejects a checksum mismatch after platform artifact transfer', () => {
  const fixture = createCompleteBundle();
  try {
    const file = path.join(fixture.release, 'apps', 'Windows', 'pages',
      expectedProductFiles('pages', 'win', VERSION)[0]);
    fs.writeFileSync(file, 'modified after transfer');
    assert.throws(
      () => verifyCompleteReleaseBundle({ releaseDir: fixture.release, version: VERSION }),
      /SHA-256 mismatch/
    );
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('complete release verifier rejects extra files in Suite installer folders', () => {
  const fixture = createCompleteBundle();
  try {
    writeFile(path.join(fixture.release, 'Windows'), 'unexpected-debug.log', 'internal build log');
    assert.throws(
      () => verifyCompleteReleaseBundle({ releaseDir: fixture.release, version: VERSION }),
      /unexpected files/
    );
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('complete release verifier rejects extra files in individual product folders', () => {
  const fixture = createCompleteBundle();
  try {
    writeFile(path.join(fixture.release, 'apps', 'macOS', 'pages'), 'unexpected-debug.log', 'internal build log');
    assert.throws(
      () => verifyCompleteReleaseBundle({ releaseDir: fixture.release, version: VERSION }),
      /unexpected files/
    );
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('complete release verifier rejects missing or unexpected product folders', () => {
  const fixture = createCompleteBundle();
  try {
    fs.rmSync(path.join(fixture.release, 'apps', 'Linux', 'loop'), { recursive: true, force: true });
    assert.throws(
      () => verifyCompleteReleaseBundle({ releaseDir: fixture.release, version: VERSION }),
      /missing or unexpected product folders/
    );
    fs.mkdirSync(path.join(fixture.release, 'apps', 'Linux', 'outlook'), { recursive: true });
    assert.throws(
      () => verifyCompleteReleaseBundle({ releaseDir: fixture.release, version: VERSION }),
      /missing or unexpected product folders/
    );
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('complete release verifier rejects unexpected files and directories in the published bundle root', () => {
  const fixture = createCompleteBundle();
  try {
    writeFile(fixture.release, 'internal-debug.log', 'private build output');
    assert.throws(
      () => verifyCompleteReleaseBundle({ releaseDir: fixture.release, version: VERSION }),
      /unexpected files or directories/
    );
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('complete release verifier rejects unexpected files in product and metadata staging folders', () => {
  const fixture = createCompleteBundle();
  try {
    writeFile(path.join(fixture.release, 'apps'), 'unexpected-marker.txt', 'not a product platform folder');
    assert.throws(
      () => verifyCompleteReleaseBundle({ releaseDir: fixture.release, version: VERSION }),
      /unexpected files or directories/
    );
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('complete release verifier rejects wrong versions and unsafe checksum paths', () => {
  const fixture = createCompleteBundle();
  try {
    const directory = path.join(fixture.release, 'Windows');
    const checksum = path.join(directory, SUITE_MANIFEST.win);
    const original = fs.readFileSync(checksum, 'utf8');
    fs.writeFileSync(checksum, original.replace(/  [^\n]+/, '  ../outside.exe'));
    assert.throws(
      () => verifyCompleteReleaseBundle({ releaseDir: fixture.release, version: VERSION }),
      /invalid or unsafe checksum manifest row/i
    );
    fs.writeFileSync(checksum, original);
    assert.throws(
      () => verifyCompleteReleaseBundle({ releaseDir: fixture.release, version: '9.9.9' }),
      /version mismatch/
    );
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});
