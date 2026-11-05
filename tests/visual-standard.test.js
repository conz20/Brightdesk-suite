'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'src', 'styles.css'), 'utf8');
const standard = fs.readFileSync(path.join(root, 'docs', 'BRIGHTDESK_VISUAL_STANDARD.md'), 'utf8');

test('suite navigation follows the approved deep-navy Brightdesk visual standard', () => {
  assert.match(standard, /deep navy navigation/i);
  assert.match(css, /\.sidebar\s*\{[^}]*background:\s*#17243e/i);
  assert.match(css, /\.sidebar \.nav\s*\{[^}]*color:\s*#e1e8f4/i);
  assert.match(css, /\.sidebar \.nav\.active\s*\{[^}]*background:\s*#e9e7ff/i);
});

test('sidebar text and its divider retain contrast on the dark navigation surface', () => {
  assert.match(css, /\.sidebar \.brand b\s*\{[^}]*color:\s*#f7f9ff/i);
  assert.match(css, /\.sidebar \.sidebar-divider\s*\{[^}]*background:\s*#344563/i);
});
