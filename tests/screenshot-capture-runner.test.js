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

test('screenshot capture runs on pull requests and main pushes, using the exact source commit', () => {
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'ci.yml'), 'utf8');
  const manifest = require('../package.json');
  assert.equal(manifest.scripts['capture:screenshots'], 'node scripts/capture-suite-screenshots.js');
  assert.ok(workflow.includes("github.event_name == 'pull_request' && github.event.pull_request.head.repo.full_name == github.repository"));
  assert.ok(workflow.includes('ref: ${{ github.event.pull_request.head.sha || github.sha }}'));
  assert.ok(workflow.includes('BRIGHTDESK_SOURCE_COMMIT: ${{ github.event.pull_request.head.sha || github.sha }}'));
  assert.doesNotMatch(workflow, /^\s*GITHUB_SHA:/m);
  const capture = fs.readFileSync(path.join(root, 'src', 'screenshot-capture.js'), 'utf8');
  assert.match(capture, /process\.env\.BRIGHTDESK_SOURCE_COMMIT/);
  assert.doesNotMatch(capture, /process\.env\.GITHUB_SHA/);
  assert.ok(workflow.includes("github.event_name == 'push' && github.ref == 'refs/heads/main'"));
  assert.match(workflow, /actions\/upload-artifact@[a-f0-9]{40}/);
  assert.match(workflow, /retention-days: 14/);
  assert.ok(workflow.includes("continue-on-error: ${{ github.event_name == 'push' }}"));
});

test('screenshot capture targets the real Suite product windows instead of switching the Home renderer', () => {
  const capture = fs.readFileSync(path.join(root, 'src', 'screenshot-capture.js'), 'utf8');
  const main = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf8');
  assert.match(main, /openProductWindow:\s*async\s+applicationId\s*=>\s*\{/);
  assert.match(main, /productWindowManager\.open\(applicationId\)/);
  assert.match(capture, /openProductWindow\(target\.appId\)/);
  assert.match(capture, /captureWindow = activeProductWindow/);
  assert.match(capture, /captureWindow\.webContents\.capturePage\(undefined, \{ stayHidden: true \}\)/);
  assert.doesNotMatch(capture, /switchToProduct/);
});
