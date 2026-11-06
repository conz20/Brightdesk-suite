'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldRequireFirstLaunchTerms } = require('../src/installer-terms-policy');

test('packaged macOS ZIP downloads require first-launch Terms acceptance', () => {
  assert.equal(
    shouldRequireFirstLaunchTerms({ platform: 'darwin', isPackaged: true }),
    true,
    'the runnable ZIP does not show the DMG or PKG installer agreement'
  );
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
