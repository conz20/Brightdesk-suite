'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'styles.css'), 'utf8');
const toggleIcon = fs.readFileSync(path.join(root, 'src', 'assets', 'icons', 'sidebar-toggle.svg'), 'utf8');

test('Suite navigation has accessible desktop collapse and mobile open controls', () => {
  assert.match(html, /id="toggle-sidebar"/);
  assert.match(html, /aria-label="Collapse navigation"/);
  assert.match(html, /id="open-sidebar"/);
  assert.match(html, /aria-controls="suite-sidebar"/);
  assert.match(html, /id="sidebar-backdrop"/);
  assert.match(html, /id="suite-sidebar"/);
});

test('sidebar mode is saved and restored without changing product visibility', () => {
  assert.match(app, /brightdesk-sidebar-mode/);
  assert.match(app, /function applySidebarMode\(/);
  assert.match(app, /data-sidebar-mode/);
  assert.match(app, /localStorage\.setItem\('brightdesk-sidebar-mode'/);
  assert.match(app, /aria-label.*Expand navigation/);
});

test('sidebar controls support compact mode, mobile overlay and Escape dismissal', () => {
  assert.match(app, /toggle-sidebar/);
  assert.match(app, /open-sidebar/);
  assert.match(app, /sidebar-backdrop/);
  assert.match(app, /sidebar-open/);
  assert.match(app, /event\.key !== 'Escape'/);
});

test('expanded navigation keeps product names visible and compact navigation retains icon access', () => {
  assert.match(css, /\.sidebar\s*\{[^}]*width:\s*19[0-9]px/s);
  assert.match(css, /data-sidebar-mode="compact".*\.sidebar/s);
  assert.match(css, /data-sidebar-mode="compact".*\.app-icon-image/s);
  assert.match(css, /\.sidebar-backdrop/);
  assert.match(css, /@media\s*\(max-width:\s*720px\)/);
  assert.match(css, /prefers-reduced-motion/);
});

test('sidebar toggle uses original local SVG artwork', () => {
  assert.match(toggleIcon, /<svg\b/);
  assert.match(html, /assets\/icons\/sidebar-toggle\.svg/);
  assert.doesNotMatch(toggleIcon, /https?:\/\//);
});
