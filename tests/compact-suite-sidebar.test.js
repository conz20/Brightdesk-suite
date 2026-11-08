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
  assert.ok(css.includes('width: 28px;'));
  assert.doesNotMatch(html, /id="sidebar-toggle"/);
  assert.ok(css.includes('@media (max-width: 700px)'));
  const readme = read('README.md');
  const standard = read('docs/BRIGHTDESK_VISUAL_STANDARD.md');
  assert.ok(readme.includes('232 px expanded rail at 1008 px and wider'));
  assert.ok(readme.includes('76 px compact icon rail at 641–1007 px'));
  assert.ok(readme.includes('menu button at 640 px and below'));
  assert.ok(standard.includes('expanded 232 px rail at 1008 px'));
  assert.ok(standard.includes('76 px icon rail'));
  assert.ok(standard.includes('641–1007 px'));
  assert.ok(standard.includes('640 px and below'));
});

test('mobile Suite navigation overrides the desktop rail width and minimum width', () => {
  const css = read('src/styles.css');
  assert.match(
    css,
    /@media\s*\(max-width:\s*720px\)\s*\{[^}]*\.sidebar\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;[^}]*\}/s
  );
});

test('the 720px full-width sidebar breakpoint also stacks the Suite body', () => {
  const css = read('src/styles.css');
  assert.match(
    css,
    /@media\\s*\\(max-width:\\s*720px\\)\\s*\\{\\s*body\\s*\\{\\s*display:\\s*block;\\s*\\}\\s*\\.sidebar\\s*\\{[^}]*width:\\s*100%;[^}]*min-width:\\s*0;/s
  );
});
