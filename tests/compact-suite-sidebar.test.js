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
  assert.ok(html.includes('data-i18n="sidebar.homeDescription"'));
  assert.ok(html.includes('data-i18n="sidebar.applicationsDescription"'));
  assert.ok(html.includes('data-i18n="sidebar.filesDescription"'));
  assert.match(css, /\.sidebar > \.nav small\s*\{[^}]*display:\s*block;[^}]*white-space:\s*normal;/s);
  assert.match(css, /@media \(max-width: 720px\)\s*\{[^}]*\.sidebar > \.nav\s*\{[^}]*display:\s*flex;/s);
  assert.doesNotMatch(html, /id="sidebar-toggle"/);
  assert.ok(css.includes('@media (max-width: 700px)'));
  const readme = read('README.md');
  const standard = read('docs/BRIGHTDESK_VISUAL_STANDARD.md');
  assert.ok(readme.includes('slim 192 px navigation rail'));
  assert.ok(readme.includes('icon and readable text label together'));
  assert.ok(readme.includes('must not collapse to an icon-only rail'));
  assert.ok(standard.includes('slim 192 px rail'));
  assert.ok(standard.includes('never replace labels with icon-only navigation'));
  assert.ok(standard.includes('640 px and below'));
});

test('mobile Suite navigation overrides the desktop rail width and minimum width', () => {
  const css = read('src/styles.css');
  assert.match(
    css,
    /@media\s*\(max-width:\s*720px\)\s*\{[\s\S]*?\.sidebar\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;[^}]*\}/s
  );
});

test('the 720px full-width sidebar breakpoint also stacks the Suite body', () => {
  const css = read('src/styles.css');
  assert.match(
    css,
    /@media\s*\(max-width:\s*720px\)\s*\{\s*body\s*\{\s*display:\s*block;\s*\}\s*\.sidebar\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;/s
  );
});


test('mobile Suite navigation retains its section heading and bottom explanatory labels', () => {
  const css = read('src/styles.css');
  const mobileRule = css.slice(css.lastIndexOf('@media (max-width: 700px)'));
  assert.match(mobileRule, /\.sidebar \.section-label\s*\{\s*display:\s*block;/);
  assert.match(mobileRule, /\.sidebar-bottom\s*\{\s*display:\s*flex;/);
  assert.match(mobileRule, /\.sidebar-bottom small\s*\{\s*display:\s*block;/);
});
