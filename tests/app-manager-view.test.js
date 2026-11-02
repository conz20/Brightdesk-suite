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
  assert.match(html, /id="manager-grid-view" aria-pressed="true">Grid/);
  assert.match(html, /id="manager-list-view" aria-pressed="false">List/);
  assert.match(app, /managerView: localStorage\.getItem\('brightdesk-manager-view'\)/);
  assert.match(app, /grid\.classList\.toggle\('list-view', state\.managerView === 'list'\)/);
  assert.match(app, /localStorage\.setItem\('brightdesk-manager-view', state\.managerView\)/);
  assert.match(css, /\.manager-grid\.list-view\{/);
  assert.match(css, /\.manager-grid\.list-view \.app-card\{/);
});
