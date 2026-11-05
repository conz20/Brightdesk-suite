'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldRequireFirstLaunchTerms } = require('../src/installer-terms-policy');
const { resolveAppSetup } = require('../src/app-setup-policy');

const suiteIds = ['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop'];

test('packaged Windows installs rely on the installer terms agreement', () => {
  assert.equal(shouldRequireFirstLaunchTerms({ platform: 'win32', isPackaged: true }), false);
});

test('development and non-Windows builds retain the first-launch terms agreement', () => {
  assert.equal(shouldRequireFirstLaunchTerms({ platform: 'win32', isPackaged: false }), true);
  assert.equal(shouldRequireFirstLaunchTerms({ platform: 'darwin', isPackaged: true }), true);
  assert.equal(shouldRequireFirstLaunchTerms({ platform: 'linux', isPackaged: true }), true);
});

test('legacy single-product selection migrates to all ten integrated products', () => {
  const setup = resolveAppSetup({ installedApps: ['pages'], setupComplete: true }, null, suiteIds);
  assert.deepEqual(setup.installedApps, suiteIds);
  assert.equal(setup.setupComplete, true);
  assert.equal(setup.schemaVersion, 3);
  assert.equal(setup.initialView, 'home');
});

test('older version-2 suite selections migrate to all ten products', () => {
  const setup = resolveAppSetup({
    schemaVersion: 2,
    installedApps: ['pages','sheets','slides','notes'],
    setupComplete: true
  }, null, suiteIds);
  assert.deepEqual(setup.installedApps, suiteIds);
  assert.equal(setup.setupComplete, true);
  assert.equal(setup.schemaVersion, 3);
  assert.equal(setup.initialView, 'home');
});

test('version-3 suite preferences are retained after migration', () => {
  const setup = resolveAppSetup({
    schemaVersion: 3,
    installedApps: ['pages','sheets'],
    setupComplete: true
  }, null, suiteIds);
  assert.deepEqual(setup.installedApps, ['pages','sheets']);
  assert.equal(setup.setupComplete, true);
  assert.equal(setup.schemaVersion, 3);
  assert.equal(setup.initialView, 'home');
});

test('single-product builds remain restricted to their selected product', () => {
  const setup = resolveAppSetup({ schemaVersion: 2, installedApps: suiteIds }, 'sheets', suiteIds);
  assert.deepEqual(setup.installedApps, ['sheets']);
  assert.equal(setup.setupComplete, true);
  assert.equal(setup.schemaVersion, 3);
  assert.equal(setup.initialView, 'workspace');
});
