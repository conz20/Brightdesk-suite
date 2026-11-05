'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { APP_SLUGS } = require('../src/standalone-downloads');
const { expectedFilename } = require('../scripts/verify-standalone-apps');
const { verifyCompleteReleaseBundle } = require('../scripts/verify-complete-release-bundle');

const VERSION = '0.1.0';
const PRODUCT_IDS = Object.keys(APP_SLUGS);
const SUITE_MANIFESTS = {
  win: 'Brightdesk-SHA256SUMS-WIN.txt',
  mac: 'Brightdesk-SHA256SUMS-MAC.txt',
  linux: 'Brightdesk-SHA256SUMS-LINUX.txt'
};
const PRODUCT_MANIFEST = (appId, platform) =>
  `Brightdesk-${appId}-SHA256SUMS-${platform.toUpperCase()}.txt`;

function writeFile(directory, filename, content = `fixture:${filename}`) {
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, filename), content);
}

function writeManifest(directory, filename, files) {
  const rows = files.map(file => {
    const bytes = fs.readFileSync(path.join(directory, file));
    return `${crypto.createHash('sha256').update(bytes).digest('hex')}  ${file}`;
  });
  writeFile(directory, filename, `${rows.join('\\n')}\\n`);
}

function createCompleteBundle() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-complete-bundle-'));
  const release = path.join(root, 'release');
  writeFile(path.join(release, 'build-metadata'), 'package-lock.json', JSON.stringify({
    name: 'brightdesk', version: VERSION, lockfileVersion: 3
  }));

  const suiteFiles = {
    win: [
      `Brightdesk-Setup-${VERSION}-x64.exe`,
      'Brightdesk-Windows-TERMS_AND_CONDITIONS.txt',
      'Brightdesk-Windows-LICENSE.txt',
      'Brightdesk-Windows-THIRD_PARTY_NOTICES.md'
    ],
    mac: [
      `Brightdesk-${VERSION}-universal.dmg`,
      `Brightdesk-${VERSION}-universal.pkg`,
      `Brightdesk-${VERSION}-universal.zip`,
      'Brightdesk-macOS-TERMS_AND_CONDITIONS.txt',
      'Brightdesk-macOS-LICENSE.txt',
      'Brightdesk-macOS-THIRD_PARTY_NOTICES.md'
    ],
    linux: [
      `Brightdesk-${VERSION}-x64.AppImage`,
      `brightdesk-${VERSION}-amd64.deb`,
      'Brightdesk-Install-Linux.sh',
      'Brightdesk-Linux-TERMS_AND_CONDITIONS.txt',
      'Brightdesk-Linux-LICENSE.txt',
      'Brightdesk-Linux-THIRD_PARTY_NOTICES.md'
    ]
  };

  for (const platform of Object.keys(suiteFiles)) {
    const directory = path.join(release, { win: 'Windows', mac: 'macOS', linux: 'Linux' }[platform]);
    for (const filename of suiteFiles[platform]) writeFile(directory, filename);
    writeManifest(directory, SUITE_MANIFESTS[platform], suiteFiles[platform]);
  }

  for (const platform of Object.keys(suiteFiles)) {
    for (const appId of PRODUCT_IDS) {
      const directory = path.join(release, 'apps', { win: 'Windows', mac: 'macOS', linux: 'Linux' }[platform], appId);
      const filenames = expectedFilename(appId, platform, VERSION);
      for (const filename of filenames) writeFile(directory, filename);
      writeManifest(directory, PRODUCT_MANIFEST(appId, platform), filenames);
    }
  }

  return { root, release, suiteFiles };
}

test('complete bundle verification accepts all 66 checksummed outputs and ten product folders per OS', () => {
  const fixture = createCompleteBundle();
  try {
    const result = verifyCompleteReleaseBundle({ releaseDir: fixture.release, version: VERSION });
    assert.equal(result.version, VERSION);
    assert.equal(result.installerCount, 66);
    assert.equal(result.platforms.win.suiteInstallerCount, 1);
    assert.equal(result.platforms.mac.suiteInstallerCount, 3);
    assert.equal(result.platforms.linux.suiteInstallerCount, 2);
    for (const platform of ['win', 'mac', 'linux']) {
      assert.equal(result.platforms[platform].productCount, 10);
      assert.equal(result.platforms[platform].productInstallerCount, {
        win: 10, mac: 30, linux: 20
      }[platform]);
    }
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('complete bundle verification rejects a checksum mismatch after artifact collection', () => {
  const fixture = createCompleteBundle();
  try {
    const file = path.join(fixture.release, 'apps', 'Windows', 'pages',
      expectedFilename('pages', 'win', VERSION)[0]);
    fs.writeFileSync(file, 'changed after platform upload');
    assert.throws(
      () => verifyCompleteReleaseBundle({ releaseDir: fixture.release, version: VERSION }),
      /SHA-256 mismatch/
    );
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('complete bundle verification rejects a missing product directory', () => {
  const fixture = createCompleteBundle();
  try {
    fs.rmSync(path.join(fixture.release, 'apps', 'Linux', 'loop'), { recursive: true, force: true });
    assert.throws(
      () => verifyCompleteReleaseBundle({ releaseDir: fixture.release, version: VERSION }),
      /missing or unexpected approved product directories/i
    );
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('complete bundle verification rejects a wrong-version Suite installer', () => {
  const fixture = createCompleteBundle();
  try {
    const directory = path.join(fixture.release, 'Windows');
    fs.rmSync(path.join(directory, `Brightdesk-Setup-${VERSION}-x64.exe`));
    const wrong = 'Brightdesk-Setup-9.9.9-x64.exe';
    writeFile(directory, wrong);
    fixture.suiteFiles.win[0] = wrong;
    writeManifest(directory, SUITE_MANIFESTS.win, fixture.suiteFiles.win);
    assert.throws(
      () => verifyCompleteReleaseBundle({ releaseDir: fixture.release, version: VERSION }),
      /expected Suite installer/i
    );
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('complete bundle verification rejects unsafe checksum paths', () => {
  const fixture = createCompleteBundle();
  try {
    const directory = path.join(fixture.release, 'Linux');
    const manifest = path.join(directory, SUITE_MANIFESTS.linux);
    const original = fs.readFileSync(manifest, 'utf8');
    fs.writeFileSync(manifest, original.replace(/  [^\\n]+/, '  ../outside.AppImage'));
    assert.throws(
      () => verifyCompleteReleaseBundle({ releaseDir: fixture.release, version: VERSION }),
      /invalid|unsafe.*checksum|manifest row/i
    );
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});

test('complete bundle verification requires the exact ten-product directory set', () => {
  const fixture = createCompleteBundle();
  try {
    fs.mkdirSync(path.join(fixture.release, 'apps', 'Windows', 'outlook'), { recursive: true });
    assert.throws(
      () => verifyCompleteReleaseBundle({ releaseDir: fixture.release, version: VERSION }),
      /missing or unexpected approved product directories/i
    );
  } finally {
    fs.rmSync(fixture.root, { recursive: true, force: true });
  }
});
