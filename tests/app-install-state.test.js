'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  INSTALLATION_SCHEMA_VERSION,
  normalizeInstallationState,
  isAppInstalled,
  serializeInstallationState
} = require('../src/app-install-state');

const appIds = ['pages', 'sheets', 'slides', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'loop'];

test('a fresh suite install starts with no apps selected or marked installed', () => {
  assert.deepEqual(normalizeInstallationState(null, appIds), {
    schemaVersion: INSTALLATION_SCHEMA_VERSION,
    installedApps: [],
    setupComplete: false
  });
});

test('legacy bundled-app state is reset instead of claiming every bundled app is installed', () => {
  const legacy = { installedApps: appIds, setupComplete: true };
  assert.deepEqual(normalizeInstallationState(legacy, appIds).installedApps, []);
  assert.equal(normalizeInstallationState(legacy, appIds).setupComplete, false);
});

test('only the saved, valid app selection is restored', () => {
  const saved = { schemaVersion: INSTALLATION_SCHEMA_VERSION, installedApps: ['pages', 'todo', 'unknown', 'pages'], setupComplete: true };
  assert.deepEqual(normalizeInstallationState(saved, appIds).installedApps, ['pages', 'todo']);
});

test('an individual app build is restricted to its own app', () => {
  assert.deepEqual(normalizeInstallationState({ installedApps: appIds, setupComplete: true }, appIds, 'sheets').installedApps, ['sheets']);
  assert.equal(isAppInstalled('sheets', [], 'sheets'), true);
  assert.equal(isAppInstalled('pages', [], 'sheets'), false);
});

test('an unselected app is never treated as installed by a special-case fallback', () => {
  assert.equal(isAppInstalled('database', ['pages']), false);
  assert.equal(isAppInstalled('pages', ['pages']), true);
});

test('saved installation state records only the chosen app ids', () => {
  assert.deepEqual(serializeInstallationState(['pages', 'sheets', 'pages'], true), {
    schemaVersion: INSTALLATION_SCHEMA_VERSION,
    installedApps: ['pages', 'sheets'],
    setupComplete: true
  });
});
