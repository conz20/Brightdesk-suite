'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldRequireFirstLaunchTerms } = require('../src/installer-terms-policy');
const { resolveAppSetup } = require('../src/app-setup-policy');

test('Windows installer gate and macOS ZIP first-launch fallback both protect Terms acceptance', () => {
  assert.equal(shouldRequireFirstLaunchTerms({ platform: 'win32', isPackaged: true }), false);
  assert.equal(shouldRequireFirstLaunchTerms({ platform: 'darwin', isPackaged: true }), true);
});

test('development and Linux packages retain the first-launch agreement where required', () => {
  assert.equal(shouldRequireFirstLaunchTerms({ platform: 'win32', isPackaged: false }), true);
  assert.equal(shouldRequireFirstLaunchTerms({ platform: 'darwin', isPackaged: false }), true);
  assert.equal(shouldRequireFirstLaunchTerms({ platform: 'linux', isPackaged: true }), true);
});

test('a legacy single-product selection migrates to all ten integrated products', () => {
  const ids = ['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop'];
  const setup = resolveAppSetup({ installedApps: ['pages'], setupComplete: true }, null, ids);
  assert.deepEqual(setup.installedApps, ids);
  assert.equal(setup.setupComplete, true);
  assert.equal(setup.schemaVersion, 2);
});

test('current suite preferences are retained after the migration', () => {
  const ids = ['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop'];
  const setup = resolveAppSetup({ schemaVersion: 2, installedApps: ['pages','sheets'], setupComplete: true }, null, ids);
  assert.deepEqual(setup.installedApps, ['pages','sheets']);
  assert.equal(setup.setupComplete, true);
});

test('single-product builds remain restricted to their selected product', () => {
  const ids = ['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop'];
  const setup = resolveAppSetup({ schemaVersion: 2, installedApps: ids }, 'sheets', ids);
  assert.deepEqual(setup.installedApps, ['sheets']);
  assert.equal(setup.setupComplete, true);
});
