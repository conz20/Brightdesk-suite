'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { assertPackagedVersion, assertMainWindowReady } = require('../src/startup-smoke');

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
    title: 'Brightdesk',
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


test('screenshot capture mode isolates Electron profile paths and invokes the real capture process', () => {
  const source = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf8');
  assert.match(source, /BRIGHTDESK_SCREENSHOT_CAPTURE_TEST === '1'/);
  assert.ok(source.includes("app.setPath('userData', userDataPath)"));
  assert.ok(source.includes("app.setPath('appData', appDataPath)"));
  assert.match(source, /await runScreenshotCaptureTest/);
});

test('main-branch CI uploads only pending-review screenshot evidence', () => {
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'ci.yml'), 'utf8');
  const manifest = require('../package.json');
  assert.equal(manifest.scripts['capture:screenshots'], 'node scripts/capture-suite-screenshots.js');
  assert.ok(workflow.includes("if: github.event_name == 'push' && github.ref == 'refs/heads/main'"));
  assert.match(workflow, /actions\/upload-artifact@[a-f0-9]{40}/);
  assert.ok(workflow.includes('retention-days: 14'));
  assert.ok(workflow.includes('continue-on-error: true'));
});
