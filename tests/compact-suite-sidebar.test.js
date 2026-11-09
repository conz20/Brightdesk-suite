'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('Suite desktop navigation keeps original icons, labels and explanatory captions', () => {
  const html = read('src/index.html');
  const css = read('src/styles.css');
  for (const [key, icon] of [['home','home'],['applications','apps'],['files','files']]) {
    assert.ok(html.includes(`data-i18n="sidebar.${key}"`));
    assert.ok(html.includes(`assets/icons/${icon}.svg`));
    assert.ok(html.includes(`data-i18n="sidebar.${key}Description"`));
  }
  assert.ok(css.includes('width: 192px;'));
  assert.ok(css.includes('.sidebar > .nav b {'));
  assert.ok(css.includes('.sidebar .app-icon-image {'));
  assert.ok(css.includes('width: 28px;'));
  assert.match(css, /\.sidebar > \.nav small\s*\{[^}]*display:\s*block;[^}]*white-space:\s*normal;/s);
  assert.match(css, /body\.suite-home \.sidebar > \.nav small\s*\{\s*display:\s*block;/s);
  assert.doesNotMatch(html, /id="sidebar-toggle"/);

  const readme = read('README.md');
  const standard = read('docs/BRIGHTDESK_VISUAL_STANDARD.md');
  assert.ok(readme.includes('desktop-only Brightdesk suite'));
  assert.ok(readme.includes('icon and readable text label together'));
  assert.ok(readme.includes('Mobile and tablet versions are not part of the product scope'));
  assert.ok(standard.includes('desktop-only suite'));
  assert.ok(standard.includes('Windows, macOS and Linux'));
  assert.ok(standard.includes('never replace labels with icon-only navigation'));
  assert.ok(!standard.includes('At 640 px and below'));
});
