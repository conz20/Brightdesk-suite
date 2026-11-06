'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { shouldRequireFirstLaunchTerms } = require('../src/installer-terms-policy');

const root = path.resolve(__dirname, '..');

test('packaged macOS ZIP launches cannot bypass first-launch Terms acceptance', () => {
  assert.equal(
    shouldRequireFirstLaunchTerms({ platform: 'darwin', isPackaged: true }),
    true,
    'a ZIP can be launched directly without the DMG or PKG installer agreement'
  );
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const installation = fs.readFileSync(path.join(root, 'docs', 'INSTALLATION.md'), 'utf8');
  assert.ok(readme.includes('The packaged macOS product also checks consent on first launch for every package type'));
  assert.ok(installation.includes('The packaged macOS product also checks the agreement on first launch for every package type'));
});

test('packaged Windows and Linux keep their existing agreement routes', () => {
  assert.equal(shouldRequireFirstLaunchTerms({ platform: 'win32', isPackaged: true }), false);
  assert.equal(shouldRequireFirstLaunchTerms({ platform: 'linux', isPackaged: true }), true);
});

test('development builds still require first-launch Terms on every platform', () => {
  for (const platform of ['win32', 'darwin', 'linux']) {
    assert.equal(shouldRequireFirstLaunchTerms({ platform, isPackaged: false }), true);
  }
});
