'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('Suite navigation stays compact while retaining original icons and readable labels', () => {
  const html = read('src/index.html');
  const css = read('src/styles.css');
  for (const [label, icon] of [['Home','home'],['Apps','apps'],['Files','files']]) {
    assert.match(html, new RegExp(`data-i18n="sidebar\\.${label.toLowerCase()}"`,'i'));
    assert.match(html, new RegExp(`assets/icons/${icon}\\.svg`));
  }
  assert.match(css, /\.sidebar\s*\{[^}]*width:\s*192px/s);
  assert.match(css, /\.sidebar\s*\.nav\s+b\s*\{[^}]*font-size:\s*12px/s);
  assert.match(css, /\.sidebar\s*\.app-icon-image\s*\{[^}]*width:\s*30px/s);
  assert.doesNotMatch(html, /id="sidebar-toggle"/);
  assert.match(css, /@media\s*\(max-width:\s*700px\)/);
});
