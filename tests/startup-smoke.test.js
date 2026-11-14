'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { assertPackagedVersion, assertMainWindowReady, assertProductWindowReady } = require('../src/startup-smoke');

const root = path.join(__dirname, '..');

test('packaged startup accepts the exact product version from the manifest', () => {
  assert.equal(assertPackagedVersion('0.1.0', '0.1.0'), true);
});

test('packaged startup rejects a missing or mismatched runtime version', () => {
  for (const [runtimeVersion, manifestVersion] of [
    ['', '0.1.0'],
    ['0.1.1', '0.1.0'],
    [null, '0.1.0'],
    ['0.1.0', undefined]
  ]) {
    assert.throws(
      () => assertPackagedVersion(runtimeVersion, manifestVersion),
      /does not match its product manifest/
    );
  }
});

test('packaged startup accepts the loaded Brightdesk navigation shell', () => {
  assert.equal(assertMainWindowReady({
    title: 'Brightdesk Office Suite',
    hasSidebar: true,
    hasAppManager: true,
    hasLanguageManager: true
  }), true);
});

test('packaged startup rejects a partial or unloaded interface', () => {
  for (const state of [
    null,
    { title: 'Brightdesk', hasSidebar: false, hasAppManager: true, hasLanguageManager: true },
    { title: 'Brightdesk', hasSidebar: true, hasAppManager: false, hasLanguageManager: true },
    { title: 'Unexpected page', hasSidebar: true, hasAppManager: true, hasLanguageManager: true }
  ]) {
    assert.throws(
      () => assertMainWindowReady(state),
      /did not load its required workspace controls/
    );
  }
});

test('packaged startup accepts each dedicated product workspace only when its identity is correct', () => {
  assert.equal(assertProductWindowReady({
    title: 'Brightdesk Office Suite',
    appTitle: 'Pages',
    launchAppId: 'pages',
    suiteLaunchedProduct: true,
    hasSidebar: true,
    hasWorkspace: true
  }, 'pages', 'Pages'), true);
});

test('packaged startup rejects a product window with the wrong identity or missing workspace', () => {
  const valid = {
    title: 'Brightdesk Office Suite',
    appTitle: 'Pages',
    launchAppId: 'pages',
    suiteLaunchedProduct: true,
    hasSidebar: true,
    hasWorkspace: true
  };
  for (const patch of [
    { title: 'Unexpected page' },
    { appTitle: 'Sheets' },
    { launchAppId: 'sheets' },
    { suiteLaunchedProduct: false },
    { hasSidebar: false },
    { hasWorkspace: false }
  ]) {
    assert.throws(
      () => assertProductWindowReady({ ...valid, ...patch }, 'pages', 'Pages'),
      /product workspace did not load its required controls/
    );
  }
});

test('the packaged launch path checks the actual hidden window and protected resources', () => {
  const source = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf8');
  assert.match(source, /process\.env\.BRIGHTDESK_STARTUP_SMOKE_TEST === '1'/);
  assert.match(source, /assertPackagedVersion\(app\.getVersion\(\), packageConfig\.version\)/);
  assert.match(source, /await readTerms\(\)/);
  assert.match(source, /await readBundledLanguagePack\('en-AU'\)/);
  assert.match(source, /await createWindow\(\{ show: false \}\)/);
  assert.match(source, /webContents\.executeJavaScript/);
  assert.match(source, /assertMainWindowReady\(startupState\)/);
  assert.match(source, /app\.exit\(0\)/);
  assert.match(source, /app\.exit\(1\)/);
});
