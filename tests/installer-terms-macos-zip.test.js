'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { shouldRequireFirstLaunchTerms } = require('../src/installer-terms-policy');

const root = path.resolve(__dirname, '..');

test('packaged macOS ZIP is documented for updates, not first-time installation', () => {
  assert.equal(
    shouldRequireFirstLaunchTerms({ platform: 'darwin', isPackaged: true }),
    false,
    'DMG and PKG already collect acceptance before first installation'
  );
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const installation = fs.readFileSync(path.join(root, 'docs', 'INSTALLATION.md'), 'utf8');
  assert.match(readme, /For a first-time Mac installation, use the DMG or PKG rather than the update ZIP/i);
  assert.match(installation, /For a first-time Mac installation, use the DMG or PKG rather than the ZIP archive/i);
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
