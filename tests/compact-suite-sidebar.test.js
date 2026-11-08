'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('Suite navigation stays compact while retaining original icons and readable labels', () => {
  const html = read('src/index.html');
  const css = read('src/styles.css');
  for (const [label, key, icon] of [['Home','home','home'],['Apps','applications','apps'],['Files','files','files']]) {
    assert.ok(html.includes(`data-i18n="sidebar.${key}"`));
    assert.ok(html.includes(`assets/icons/${icon}.svg`));
  }
  assert.ok(css.includes('width: 192px;'));
  assert.ok(css.includes('.sidebar > .nav b {'));
  assert.ok(css.includes('.sidebar .app-icon-image {'));
  assert.ok(css.includes('width: 30px;'));
  assert.doesNotMatch(html, /id="sidebar-toggle"/);
  assert.ok(css.includes('@media (max-width: 700px)'));
});
