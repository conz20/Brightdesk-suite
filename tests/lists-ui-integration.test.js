'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const renderer = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'styles.css'), 'utf8');
const catalog = require('../src/app-catalog');

test('Lists has its own workspace rather than the generic rich-text editor', () => {
  assert.match(html, /id="lists-wrap"/);
  assert.match(html, /id="lists-sidebar-items"/);
  assert.match(html, /id="lists-table"/);
  assert.match(renderer, /function renderListsWorkspace\(\)/);
  assert.match(renderer, /if \(isLists\) renderListsWorkspace\(\)/);
  assert.match(renderer, /lists: \{ title: 'My lists', lists: \[\] \}/);
  assert.ok(html.indexOf('src="lists-service.js"') < html.indexOf('src="app.js"'));
});

test('Lists UI is connected to the validated local data service', () => {
  for (const method of ['createList','renameList','addColumn','addItem','updateItem','deleteItem','filterItems','sortItems']) {
    assert.ok(renderer.includes('BrightdeskListsService.' + method), method + ' is wired');
  }
  assert.match(renderer, /function saveLists\(\) \{ persist\(\)/);
  assert.match(renderer, /function addBrightdeskListColumn/);
  assert.match(renderer, /function saveListRecord/);
});

test('Lists has accessible names and responsive table layout', () => {
  assert.match(html, /aria-label="New list name"/);
  assert.match(html, /aria-label="Search this list"/);
  assert.match(html, /id="lists-status" role="status"/);
  assert.match(css, /\.lists-app\{/);
  assert.match(css, /@media\(max-width:760px\)\{\.lists-app/);
});

test('Lists is registered under the approved Brightdesk app name', () => {
  const item = catalog.find(entry => entry.id === 'lists');
  assert.ok(item);
  assert.equal(item.name, 'Brightdesk Lists');
  assert.equal(item.microsoftReference, 'Lists');
});
