'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createStandaloneDownload, APP_SLUGS } = require('../src/standalone-downloads');

const expected = {
  pages: 'Pages',
  sheets: 'Sheets',
  slides: 'Decks',
  notes: 'Notes',
  database: 'Database',
  forms: 'Forms',
  lists: 'Lists',
  planner: 'Planner',
  todo: 'To-Do',
  loop: 'Workspace'
};

test('standalone download map covers exactly the approved ten apps', () => {
  assert.deepEqual(APP_SLUGS, expected);
});

test('each app resolves to its own release asset on Windows, macOS and Linux', () => {
  for (const [appId, slug] of Object.entries(expected)) {
    const cases = [
      ['win32', `Brightdesk-${slug}-0.1.0-x64.exe`],
      ['darwin', `Brightdesk-${slug}-0.1.0-universal.dmg`],
      ['linux', `brightdesk-${slug.toLowerCase()}-0.1.0-x86_64.AppImage`]
    ];
    for (const [platform, filename] of cases) {
      const result = createStandaloneDownload({ appId, platform, version: '0.1.0' });
      assert.equal(result.filename, filename, `${appId} on ${platform}`);
      assert.equal(result.url, `https://github.com/connormolloy12/Brightdesk-suite/releases/latest/download/${encodeURIComponent(filename)}`);
    }
  }
});


test('Linux product package verification matches Electron Builder architecture names',()=>{
  const { expectedFilename } = require('../scripts/verify-standalone-apps');
  assert.deepEqual(expectedFilename('pages','linux','0.1.0'),[
    'brightdesk-pages-0.1.0-x86_64.AppImage',
    'brightdesk-pages-0.1.0-amd64.deb'
  ]);
});

test('standalone download rejects apps outside the approved catalogue', () => {
  assert.throws(() => createStandaloneDownload({ appId: 'outlook', platform: 'darwin', version: '0.1.0' }), /not available/);
});

test('standalone download rejects unsupported operating systems', () => {
  assert.throws(() => createStandaloneDownload({ appId: 'pages', platform: 'freebsd', version: '0.1.0' }), /not supported/);
});

test('standalone download validates the release version before building a URL', () => {
  assert.throws(() => createStandaloneDownload({ appId: 'pages', platform: 'win32', version: '../latest' }), /valid release version/);
});

test('standalone verifier can verify one app repository without requiring the other nine apps', () => {
  const fs = require('node:fs');
  const os = require('node:os');
  const path = require('node:path');
  const { expectedFilename, verifyStandaloneApps } = require('../scripts/verify-standalone-apps');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-one-app-'));
  try {
    const appDirectory = path.join(directory, 'pages');
    fs.mkdirSync(appDirectory, { recursive: true });
    for (const filename of expectedFilename('pages', 'mac', '0.1.0')) {
      fs.writeFileSync(path.join(appDirectory, filename), 'verified test installer');
    }
    const result = verifyStandaloneApps({ directory, platform: 'mac', version: '0.1.0', appId: 'pages' });
    assert.equal(result.appCount, 1);
    assert.equal(result.apps[0].appId, 'pages');
    assert.equal(result.fileCount, 3);
    assert.ok(fs.existsSync(path.join(appDirectory, 'Brightdesk-pages-SHA256SUMS-MAC.txt')));
    assert.throws(() => verifyStandaloneApps({ directory, platform: 'mac', version: '0.1.0', appId: 'outlook' }), /approved Brightdesk app/);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
