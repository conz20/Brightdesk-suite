'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'styles.css'), 'utf8');

test('Product Centre has accessible, localized grid and list controls', () => {
  assert.match(html, /role="group" aria-label="Product display"/);
  for (const key of ['view', 'gridView', 'listView']) {
    assert.match(html, new RegExp(`data-i18n="manager\\.${key}"`));
  }
  assert.match(html, /id="manager-grid-view" aria-pressed="true" data-i18n="manager.gridView">Grid/);
  assert.match(html, /id="manager-list-view" aria-pressed="false" data-i18n="manager.listView">List/);
});

test('grid and list choices are saved and restored locally', () => {
  assert.match(app, /managerView: localStorage\.getItem\('brightdesk-manager-view'\) === 'list' \? 'list' : 'grid'/);
  assert.match(app, /grid\.classList\.toggle\('list-view', state\.managerView === 'list'\)/);
  assert.match(app, /manager-grid-view'\)\.addEventListener\('click',[\s\S]*?localStorage\.setItem\('brightdesk-manager-view', state\.managerView\)/);
  assert.match(app, /manager-list-view'\)\.addEventListener\('click',[\s\S]*?localStorage\.setItem\('brightdesk-manager-view', state\.managerView\)/);
  assert.match(app, /manager-grid-view'\)\.setAttribute\('aria-pressed', String\(state\.managerView === 'grid'\)\)/);
  assert.match(app, /manager-list-view'\)\.setAttribute\('aria-pressed', String\(state\.managerView === 'list'\)\)/);
  assert.match(css, /\.manager-grid\.list-view\{/);
  assert.match(css, /\.manager-grid\.list-view \.app-card\{/);
});
