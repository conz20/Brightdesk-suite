'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'src', 'styles.css'), 'utf8');
const standard = fs.readFileSync(path.join(root, 'docs', 'BRIGHTDESK_VISUAL_STANDARD.md'), 'utf8');

test('suite navigation follows the canonical Brightdesk navy design contract', () => {
  assert.match(standard, /Canonical design contract/i);
  assert.match(css, /--bd-nav-gradient:\s*linear-gradient\(180deg,#14233F 0%,#0D1930 100%\)/i);
  assert.match(css, /\.sidebar\s*\{[^}]*background:var\(--bd-nav-gradient\)/s);
  assert.match(css, /\.nav\.active\s*\{background:var\(--bd-nav-active\);color:#fff;box-shadow:inset 3px 0 0 var\(--bd-accent\)\}/);
  assert.doesNotMatch(css, /\.sidebar \.nav\.active[^}]*#e9e7ff/i);
  assert.doesNotMatch(css, /\.sidebar \.nav\.active[^}]*#293b60/i);
});

test('shared navigation keeps readable light labels and accessible focus', () => {
  assert.match(css, /--bd-nav-text:#EEF3FB/);
  assert.match(css, /--bd-nav-muted:#A8B6D0/);
  assert.match(css, /--bd-nav-active:rgba\(255,255,255,\.12\)/);
  assert.match(css, /--bd-accent:#526FE0/);
  assert.match(css, /\.top-notifications-button:focus-visible[^}]*outline:2px solid #526FE0/);
});
