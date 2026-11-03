'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');

test('Home, Apps and Downloads are separate Suite destinations', () => {
  assert.match(html, /id="home-nav"/);
  assert.match(html, /id="home-panel"/);
  assert.match(html, /id="manage-apps"/);
  assert.match(html, /id="downloads-nav"/);
  assert.match(html, /id="downloads-panel"/);
  assert.match(app, /function renderHome\(\)/);
  assert.match(app, /state\.view === 'home'/);
  assert.match(app, /state\.view === 'manager'/);
  assert.match(app, /state\.view === 'downloads'/);
});

test('Home distinguishes apps added to the Suite from independent desktop installations', () => {
  assert.match(html, /id="home-app-grid"/);
  assert.match(html, /id="home-desktop-app-list"/);
  assert.match(html, /id="home-suite-app-count"/);
  assert.match(html, /id="home-desktop-app-count"/);
  assert.match(app, /state\.installedApps/);
  assert.match(app, /state\.standaloneApps/);
  assert.match(app, /Open in suite/);
  assert.match(app, /Open desktop app/);
});

test('first-run selection remains the first-run destination, then a completed setup opens Home', () => {
  assert.match(app, /else if \(!state\.setupComplete\) \{[\s\S]*?state\.view = 'manager'/);
  assert.match(app, /state\.view = 'home'/);
  assert.match(app, /function completeAppSetup\(\)[\s\S]*?state\.view = 'home'/);
});

test('Home can refresh desktop app discovery without leaving the dashboard', () => {
  assert.match(html, /id="home-refresh-apps"/);
  assert.match(app, /\$\('home-refresh-apps'\)\.addEventListener\('click', refreshInstalledAppList\)/);
  assert.match(app, /if \(state\.view === 'home'\) renderHome\(\)/);
  assert.match(app, /else if \(state\.view === 'downloads'\) renderDownloads\(\)/);
  assert.match(app, /else if \(state\.view === 'manager'\) renderAppManager\(\)/);
});
