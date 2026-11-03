'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'styles.css'), 'utf8');

test('App Centre offers accessible grid and list layouts', () => {
  assert.match(html, /role="group" aria-label="Application display"/);
  assert.match(html, /data-i18n="manager.view"/);
  assert.match(html, /data-i18n="manager.gridView"/);
  assert.match(html, /data-i18n="manager.listView"/);
  assert.match(html, /id="manager-grid-view" aria-pressed="true" data-i18n="manager.gridView">Grid/);
  assert.match(html, /id="manager-list-view" aria-pressed="false" data-i18n="manager.listView">List/);
  assert.match(app, /managerView: localStorage\.getItem\('brightdesk-manager-view'\)/);
  assert.match(app, /grid\.classList\.toggle\('list-view', state\.managerView === 'list'\)/);
  assert.match(app, /localStorage\.setItem\('brightdesk-manager-view', state\.managerView\)/);
  assert.match(css, /\.manager-grid\.list-view\{/);
  assert.match(css, /\.manager-grid\.list-view \.app-card\{/);
});

test('first-run app selection provides Select All and Clear All controls', () => {
  assert.match(html, /id="select-all-apps"/);
  assert.match(html, /id="clear-all-apps"/);
  assert.match(app, /\$\('select-all-apps'\)\.addEventListener\('click'/);
  assert.match(app, /state\.firstRunSelection = new Set\(installableCatalog\.map\(item => item\.id\)\)/);
  assert.match(app, /\$\('clear-all-apps'\)\.addEventListener\('click'/);
  assert.match(app, /state\.firstRunSelection\.clear\(\)/);
  assert.match(app, /\$\('select-all-apps'\)\.hidden = state\.setupComplete/);
  assert.match(app, /\$\('clear-all-apps'\)\.hidden = state\.setupComplete/);
});

test('App Centre supports searching and filtering all ten apps by installation state', () => {
  assert.match(html, /id="manager-search"/);
  assert.match(html, /id="manager-filter"/);
  assert.match(html, /value="in-suite"/);
  assert.match(html, /value="desktop-installed"/);
  assert.match(html, /value="not-installed"/);
  assert.match(html, /id="manager-results-count"/);
  assert.match(app, /managerFilter: 'all'/);
  assert.match(app, /managerSearch: ''/);
  assert.match(app, /state\.managerSearch\.trim\(\)\.toLowerCase\(\)/);
  assert.match(app, /state\.managerFilter === 'desktop-installed'/);
  assert.match(app, /state\.managerFilter === 'in-suite'/);
});
