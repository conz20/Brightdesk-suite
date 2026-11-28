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


test('Brightdesk stays free forever and does not introduce customer identity or billing', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const scope = fs.readFileSync(path.join(root, 'PRODUCT_SCOPE_LOCK.md'), 'utf8');
  assert.match(readme, /Free forever/);
  assert.match(scope, /Free forever/);
  assert.match(scope, /No subscriptions, trials, paid tiers or billing/);
  assert.match(scope, /No customer accounts, sign-in, passwords, profiles, activation codes, serial numbers or licence servers/);
});

test('Brightdesk stays local-first without telemetry, ads, cloud sync or customer text uploads', () => {
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const scope = fs.readFileSync(path.join(root, 'PRODUCT_SCOPE_LOCK.md'), 'utf8');
  assert.match(readme, /No telemetry, analytics, advertising, crash reporting, cloud sync or collaboration/);
  assert.match(scope, /No telemetry, analytics, advertising, crash reporting, cloud sync, collaboration or customer text uploads/);
});


test('the permanent repository register contains all 28 repositories including private Archives', () => {
  const maintenance = fs.readFileSync(path.join(root, 'docs', 'POST_0_1_0_MAINTENANCE.md'), 'utf8');
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const entries = maintenance.match(/^\d+\. Brightdesk-/gm) || [];
  assert.equal(entries.length, 28);
  assert.match(maintenance, /Brightdesk-Archives \(private recovery archive only/);
  assert.match(readme, /GitHub portfolio contains 28 repositories/);
  assert.match(readme, /Brightdesk-Archives/);
  assert.equal(catalogue.length, 10, 'the 28-repository engineering portfolio must not expand the ten customer products');
});
