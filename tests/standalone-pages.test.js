'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { APP_REPOSITORIES, createAppRepositorySeeds } = require('../scripts/create-app-repository-seeds');
const { createStandaloneDownload } = require('../src/standalone-downloads');

test('Brightdesk Pages has a dedicated standalone repository contract', () => {
  const pages = APP_REPOSITORIES.find(item => item.appId === 'pages');
  assert.ok(pages);
  assert.equal(pages.repository, 'Brightdesk-Pages');
  assert.equal(pages.packageName, 'brightdesk-pages');
  assert.equal(pages.name, 'Brightdesk Pages');
});

test('Brightdesk Pages standalone seed is locked to Pages', () => {
  const root = path.resolve(__dirname, '..');
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-pages-'));
  try {
    const result = createAppRepositorySeeds({ rootDir: root, outputDir: output });
    const pages = result.repositories.find(item => item.appId === 'pages');
    assert.ok(pages);
    const destination = pages.path;
    const pkg = JSON.parse(fs.readFileSync(path.join(destination, 'package.json'), 'utf8'));
    assert.equal(pkg.name, 'brightdesk-pages');
    assert.equal(pkg.brightdeskAppId, 'pages');
    assert.equal(pkg.build.appId, 'org.brightdesk.pages');
    assert.equal(pkg.build.productName, 'Brightdesk Pages');
    assert.equal(JSON.parse(fs.readFileSync(path.join(destination, 'package-lock.json'), 'utf8')).name, 'brightdesk-pages');
    assert.ok(fs.statSync(path.join(destination, 'assets', 'brightdesk-app.svg')).size > 0);
    assert.ok(fs.statSync(path.join(destination, 'assets', 'social-preview.svg')).size > 0);
    assert.ok(fs.existsSync(path.join(destination, '.github', 'workflows', 'standalone-app.yml')));
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});

test('Brightdesk Pages standalone download resolves to the Pages release asset', () => {
  const download = createStandaloneDownload({ appId: 'pages', platform: 'darwin', version: '0.1.0' });
  assert.equal(download.appId, 'pages');
  assert.equal(download.filename, 'Brightdesk-Pages-0.1.0-universal.dmg');
  assert.match(download.url, /Brightdesk-Pages-0\.1\.0-universal\.dmg$/);
});
