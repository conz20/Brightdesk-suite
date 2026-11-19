'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const catalogue = require('../src/app-catalog');

test('customer catalogue is exactly the ten approved Brightdesk products', () => {
  assert.deepEqual(catalogue.map(item => item.name), [
    'Brightdesk Pages',
    'Brightdesk Sheets',
    'Brightdesk Decks',
    'Brightdesk Notes',
    'Brightdesk Database',
    'Brightdesk Forms',
    'Brightdesk Lists',
    'Brightdesk Planner',
    'Brightdesk To Do',
    'Brightdesk Workspace'
  ]);
});

test('internal architecture Wiki uses the integrated product-window and original-design rules', () => {
  const wiki = fs.readFileSync(path.join(root, 'apps', 'wiki', 'index.html'), 'utf8');
  assert.match(wiki, /ten approved product workspaces/);
  assert.match(wiki, /separate top-level windows inside the Suite process/);
  assert.match(wiki, /own native application identity/);
  assert.match(wiki, /original Brightdesk design system/);
  assert.match(wiki, /Microsoft productivity conventions/);
  assert.doesNotMatch(wiki, /Adobe|Craft|Standalone Apps|standalone productivity applications|Adobe design standards/i);
});

test('the Suite Wiki does not add unapproved customer products', () => {
  const wiki = fs.readFileSync(path.join(root, 'apps', 'wiki', 'index.html'), 'utf8');
  assert.doesNotMatch(wiki, /Outlook|OneDrive|Teams/);
});
