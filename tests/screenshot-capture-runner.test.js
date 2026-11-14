'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');

test('screenshot runner uses a fresh disposable profile and does not publish anything', () => {
  const runner = fs.readFileSync(path.join(root, 'scripts', 'capture-suite-screenshots.js'), 'utf8');
  assert.match(runner, /mkdtempSync\(path\.join\(os\.tmpdir\(\), 'brightdesk-screenshot-profile-'/);
  assert.match(runner, /BRIGHTDESK_SCREENSHOT_TEST_DATA_DIR/);
  assert.match(runner, /fs\.rmSync\(profileDir, \{ recursive: true, force: true \}\)/);
  assert.match(runner, /verifyScreenshotSet\(outputDir\)/);
  assert.doesNotMatch(runner, /gh release create|createRelease|uploadReleaseAsset/);
});

test('screenshot capture is optional CI evidence and only runs on main pushes', () => {
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'ci.yml'), 'utf8');
  const manifest = require('../package.json');
  assert.equal(manifest.scripts['capture:screenshots'], 'node scripts/capture-suite-screenshots.js');
  assert.match(workflow, /github\.event_name == 'push' && github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /actions\/upload-artifact@[a-f0-9]{40}/);
  assert.match(workflow, /retention-days: 14/);
  assert.match(workflow, /continue-on-error: true/);
});
