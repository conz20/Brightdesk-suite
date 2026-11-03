'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const preload = fs.readFileSync(path.join(root, 'src', 'preload.js'), 'utf8');

test('Suite has a dedicated Downloads destination separate from the App Centre', () => {
  assert.match(html, /id="downloads-nav"/);
  assert.match(html, /id="downloads-panel"/);
  assert.match(html, /id="downloads-app-grid"/);
  assert.match(html, /id="downloads-platform-name"/);
  assert.match(html, /id="downloads-platform-details"/);
  assert.match(app, /state\.view === 'downloads'/);
  assert.match(app, /function renderDownloads\(\)/);
  assert.match(app, /stageStandaloneAppFromCentre\(item\.id, item\.name\)/);
});

test('Downloads displays only approved products and platform architecture supplied by the desktop shell', () => {
  assert.match(app, /catalog\.forEach\(item => \{/);
  assert.match(app, /window\.brightdesk\.architecture/);
  assert.match(app, /APPROVED|approved/i);
  assert.match(preload, /architecture: process\.arch/);
});

test('Downloads separates standalone OS installation from the in-suite selection state', () => {
  assert.match(app, /Download desktop app/);
  assert.match(app, /Open desktop app/);
  assert.match(app, /Add to suite/);
  assert.match(app, /downloads-nav/);
  assert.match(app, /downloads-panel/);
});

test('standalone app windows do not display Suite navigation or Suite Downloads', () => {
  assert.match(app, /\$\('downloads-nav'\)\.hidden = Boolean\(launchAppId\)/);
});
