'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { collectPlatformBuild } = require('../scripts/collect-platform-build');

function createReleaseTree() {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-collector-'));
  const release = path.join(rootDir, 'release');
  fs.mkdirSync(path.join(release, 'apps', 'pages'), { recursive: true });
  fs.mkdirSync(path.join(release, 'apps', 'Linux', 'pages'), { recursive: true });
  fs.mkdirSync(path.join(release, 'build-metadata'), { recursive: true });
  fs.mkdirSync(path.join(release, 'product-repository-folders', 'Brightdesk-Pages'), { recursive: true });
  fs.writeFileSync(path.join(release, 'Brightdesk-Setup.exe'), 'windows-suite');
  fs.writeFileSync(path.join(release, 'apps', 'pages', 'Brightdesk-Pages-Setup.exe'), 'windows-pages');
  fs.writeFileSync(path.join(release, 'apps', 'Linux', 'pages', 'brightdesk-pages-0.1.0-x86_64.AppImage'), 'linux-pages');
  fs.writeFileSync(path.join(release, 'build-metadata', 'package-lock.json'), '{}');
  fs.writeFileSync(path.join(release, 'product-repository-folders', 'Brightdesk-Pages', 'README.md'), 'Pages seed');
  return rootDir;
}

test('platform collector moves suite installer files without moving release metadata', () => {
  const rootDir = createReleaseTree();
  try {
    const result = collectPlatformBuild({ rootDir, platform: 'win' });
    const release = path.join(rootDir, 'release');
    assert.equal(result.platform, 'Windows');
    assert.equal(result.suiteFiles, 1);
    assert.equal(result.appFolders, 1);
    assert.equal(fs.readFileSync(path.join(release, 'Windows', 'Brightdesk-Setup.exe'), 'utf8'), 'windows-suite');
    assert.equal(fs.existsSync(path.join(release, 'Brightdesk-Setup.exe')), false);
    assert.equal(fs.existsSync(path.join(release, 'build-metadata', 'package-lock.json')), true);
    assert.equal(fs.existsSync(path.join(release, 'product-repository-folders', 'Brightdesk-Pages', 'README.md')), true);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test('platform collector moves only uncollected product folders and preserves earlier platforms', () => {
  const rootDir = createReleaseTree();
  try {
    const result = collectPlatformBuild({ rootDir, platform: 'win' });
    const release = path.join(rootDir, 'release');
    assert.equal(result.appFolders, 1);
    assert.equal(fs.readFileSync(path.join(release, 'apps', 'Windows', 'pages', 'Brightdesk-Pages-Setup.exe'), 'utf8'), 'windows-pages');
    assert.equal(fs.readFileSync(path.join(release, 'apps', 'Linux', 'pages', 'brightdesk-pages-0.1.0-x86_64.AppImage'), 'utf8'), 'linux-pages');
    assert.equal(fs.existsSync(path.join(release, 'apps', 'pages')), false);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});

test('platform collector rejects unsupported operating systems', () => {
  const rootDir = createReleaseTree();
  try {
    assert.throws(() => collectPlatformBuild({ rootDir, platform: 'android' }), /Unsupported platform/);
  } finally {
    fs.rmSync(rootDir, { recursive: true, force: true });
  }
});
