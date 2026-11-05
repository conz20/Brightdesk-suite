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
  assert.match(css, /\.sidebar\s*\{[^}]*background:\s*linear-gradient\(180deg,\s*#14233f\s+0%,\s*#0d1930\s+100%\)/i);
  assert.match(css, /\.sidebar \.nav\s*\{[^}]*color:\s*#bcc8df/i);
  assert.match(css, /\.sidebar \.nav\.active,\s*\.sidebar \.manager-nav\.active\s*\{\s*background:\s*#293b60;\s*color:\s*#ffffff;/i);
  assert.doesNotMatch(css, /\.sidebar\s*\{\s*background:\s*#17243e/i);
  assert.doesNotMatch(css, /\.sidebar \.nav\.active\s*\{\s*background:\s*#e9e7ff/i);
});

test('sidebar text and its divider retain contrast on the dark navigation surface', () => {
  assert.match(css, /\.sidebar \.brand b\s*\{[^}]*color:\s*#ffffff/i);
  assert.match(css, /\.sidebar \.sidebar-divider\s*\{[^}]*background:\s*#344766/i);
});
