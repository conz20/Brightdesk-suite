'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldRequireFirstLaunchTerms } = require('../src/installer-terms-policy');
const { resolveAppSetup } = require('../src/app-setup-policy');

test('packaged Windows and macOS installs rely on the installer terms agreement', () => {
  assert.equal(shouldRequireFirstLaunchTerms({ platform: 'win32', isPackaged: true }), false);
  assert.equal(shouldRequireFirstLaunchTerms({ platform: 'darwin', isPackaged: true }), false);
});

test('development and Linux builds retain the first-launch agreement where no graphical installer gate exists', () => {
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

test('Suite-launched product windows retain access to the installed product switcher', () => {
  const ids = ['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop'];
  const setup = resolveAppSetup({ schemaVersion: 2, installedApps: ['pages','sheets','todo'] }, 'sheets', ids, true);
  assert.deepEqual(setup.installedApps, ['pages','sheets','todo']);
  assert.equal(setup.setupComplete, true);
});

test('Suite-launched product windows default to all ten products when no Suite preferences exist', () => {
  const ids = ['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop'];
  const setup = resolveAppSetup(null, 'sheets', ids, true);
  assert.deepEqual(setup.installedApps, ids);
});

test('an intentionally empty installed-product selection remains empty after startup', () => {
  const ids = ['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop'];
  const setup = resolveAppSetup({ schemaVersion: 2, installedApps: [], setupComplete: true }, null, ids);
  assert.deepEqual(setup.installedApps, []);
  assert.equal(setup.setupComplete, true);
});

test('removing the final installed product leaves the Suite with no selected products', () => {
  const ids = ['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop'];
  const result = require('../src/app-setup-policy').removeAppSelection(
    ['pages'], ['pages'], 'pages', 'pages', ids
  );
  assert.deepEqual(result, { installedApps: [], hiddenProducts: [], activeAppId: null });
});

test('removing the active product selects another installed product without deleting its data', () => {
  const ids = ['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop'];
  const result = require('../src/app-setup-policy').removeAppSelection(
    ['pages','sheets','todo'], ['pages','todo'], 'pages', 'pages', ids
  );
  assert.deepEqual(result, {
    installedApps: ['sheets','todo'],
    hiddenProducts: ['todo'],
    activeAppId: 'sheets'
  });
});

test('the last installed product may be hidden from the Switch product navigation', () => {
  const result = require('../src/app-setup-policy').setProductVisibility(
    ['pages'], ['pages'], 'pages', true
  );
  assert.deepEqual(result, ['pages']);
});

test('Suite-launched product windows only show other installed and visible products', () => {
  const { getNavigationProducts } = require('../src/app-setup-policy');
  const catalog = ['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop']
    .map(id => ({ id }));
  const result = getNavigationProducts(
    catalog,
    ['pages','sheets','todo'],
    ['todo'],
    'pages',
    true
  );
  assert.deepEqual(result.map(item => item.id), ['sheets']);
});

test('separately installed product windows retain the other product switch options', () => {
  const { getNavigationProducts } = require('../src/app-setup-policy');
  const catalog = ['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop']
    .map(id => ({ id }));
  const result = getNavigationProducts(catalog, ['pages'], [], 'pages', false);
  assert.deepEqual(result.map(item => item.id), ['sheets','slides','notes','database','forms','lists','planner','todo','loop']);
});

test('Suite navigation excludes products that are not installed or are hidden', () => {
  const { getNavigationProducts } = require('../src/app-setup-policy');
  const catalog = ['pages','sheets','slides','notes'].map(id => ({ id }));
  const result = getNavigationProducts(catalog, ['pages','sheets'], ['sheets'], null, false);
  assert.deepEqual(result.map(item => item.id), ['pages']);
});

