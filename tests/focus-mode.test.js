'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');

function extractFunction(name) {
  const match = source.match(new RegExp('^function ' + name + '\\([^\\n]*\\) \\{[\\s\\S]*?^\\}', 'm'));
  assert.ok(match, name + ' function exists in src/app.js');
  return match[0];
}

function extractFocusModeHandler() {
  const renderToolbar = extractFunction('renderToolbar');
  const re = /addButton\(\s*view\s*,\s*label\('focusMode'\)\s*,\s*\(\)\s*=>\s*\{([\s\S]*?)\}\s*\)/;
  const match = renderToolbar.match(re);
  assert.ok(match, 'Pages → View → Focus Mode handler exists inside renderToolbar()');
  return match[1];
}

test('Pages → View → Focus Mode handler does not reference out-of-scope identifiers', () => {
  const handler = extractFocusModeHandler();
  assert.doesNotMatch(handler, /\bisTodo\b/,
    'focus mode handler must not reference isTodo, which is only in scope inside render()');
  assert.doesNotMatch(handler, /\btodo-mode\b/,
    'focus mode handler must not toggle the dead todo-mode class');
});

test('Pages → View → Focus Mode handler toggles state.focusMode and the focus-mode class', () => {
  const handler = extractFocusModeHandler();
  assert.match(handler, /state\.focusMode\s*=\s*!state\.focusMode/);
  assert.match(handler, /classList\.toggle\(\s*['"]focus-mode['"]\s*,\s*state\.focusMode\s*\)/);
});

test('renderToolbar() does not reference render()-scoped isTodo', () => {
  const renderToolbar = extractFunction('renderToolbar');
  assert.doesNotMatch(renderToolbar, /\bisTodo\b/,
    'renderToolbar() must not reference isTodo; it is declared inside render()');
});
