'use strict';

const { spawnSync, execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { verifyScreenshotSet } = require('../src/screenshot-evidence');

const root = path.resolve(__dirname, '..');

function runCapture() {
  if (process.platform !== 'darwin') {
    throw new Error('Automated Brightdesk screenshot capture currently runs on the private macOS runner only.');
  }
  const outputDir = process.env.BRIGHTDESK_SCREENSHOT_OUTPUT_DIR;
  if (!outputDir || !path.isAbsolute(outputDir)) {
    throw new Error('Set BRIGHTDESK_SCREENSHOT_OUTPUT_DIR to an absolute artifact directory.');
  }
  if (fs.existsSync(outputDir) && fs.readdirSync(outputDir).length) {
    throw new Error('Screenshot output directory must be empty to prevent stale files being mixed into this run.');
  }
  fs.mkdirSync(outputDir, { recursive: true });

  const sourceCommit = process.env.GITHUB_SHA ||
    execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  if (!/^[a-f0-9]{40}$/i.test(sourceCommit)) {
    throw new Error('Could not determine the exact 40-character source commit.');
  }

  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-screenshot-profile-'));
  try {
    const electronBinary = require('electron');
    if (typeof electronBinary !== 'string' || !electronBinary) {
      throw new Error('The Electron executable is unavailable after dependency installation.');
    }
    const result = spawnSync(electronBinary, ['.'], {
      cwd: root,
      env: {
        ...process.env,
        GITHUB_SHA: sourceCommit,
        BRIGHTDESK_SCREENSHOT_CAPTURE_TEST: '1',
        BRIGHTDESK_SCREENSHOT_OUTPUT_DIR: outputDir,
        BRIGHTDESK_SCREENSHOT_TEST_DATA_DIR: profileDir
      },
      stdio: 'inherit',
      timeout: 180000
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error('The Electron screenshot capture process exited with code ' + (result.status ?? 1) + '.');
    }
    const evidence = verifyScreenshotSet(outputDir);
    console.log('Screenshot artifact structure passed:', evidence.screenshotCount, 'PNGs and', evidence.files.length - evidence.screenshotCount, 'evidence files.');
  } finally {
    fs.rmSync(profileDir, { recursive: true, force: true });
  }
}

try {
  runCapture();
} catch (error) {
  console.error('Brightdesk screenshot capture runner failed:', error.stack || error.message);
  process.exitCode = 1;
}
