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
      ['linux', `brightdesk-${slug.toLowerCase()}-0.1.0-x64.AppImage`]
    ];
    for (const [platform, filename] of cases) {
      const result = createStandaloneDownload({ appId, platform, version: '0.1.0' });
      assert.equal(result.filename, filename, `${appId} on ${platform}`);
      assert.equal(result.url, `https://github.com/connormolloy12/Brightdesk-suite/releases/latest/download/${encodeURIComponent(filename)}`);
    }
  }
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
