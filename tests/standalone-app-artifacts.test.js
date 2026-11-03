'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { APPROVED_APP_IDS, verifyArtifacts, verifyStandaloneArtifacts } = require('../scripts/verify-release-artifacts');

test('release verification requires a separate installer for each approved app', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-app-artifacts-'));
  try {
    for (const appId of APPROVED_APP_IDS) {
      const appDirectory = path.join(directory, 'apps', appId);
      fs.mkdirSync(appDirectory, { recursive: true });
      fs.writeFileSync(path.join(appDirectory, `brightdesk-${appId}-0.1.0-x64.deb`), 'installer');
    }
    assert.equal(verifyStandaloneArtifacts({ directory, platform: 'linux' }).length, 10);
    fs.rmSync(path.join(directory, 'apps', 'forms'), { recursive: true, force: true });
    assert.throws(
      () => verifyStandaloneArtifacts({ directory, platform: 'linux' }),
      /forms/
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('standalone installers cannot substitute for the separate Suite installer', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-suite-artifacts-'));
  try {
    for (const appId of APPROVED_APP_IDS) {
      const appDirectory = path.join(directory, 'apps', appId);
      fs.mkdirSync(appDirectory, { recursive: true });
      fs.writeFileSync(path.join(appDirectory, `Brightdesk-${appId}-0.1.0-x64.exe`), 'app installer');
    }
    fs.writeFileSync(path.join(directory, 'Brightdesk-Windows-TERMS_AND_CONDITIONS.txt'), 'terms');
    fs.writeFileSync(path.join(directory, 'Brightdesk-Windows-LICENSE.txt'), 'licence');
    fs.writeFileSync(path.join(directory, 'Brightdesk-Windows-THIRD_PARTY_NOTICES.md'), 'notices');

    assert.throws(() => verifyArtifacts({ directory, platform: 'win' }), /Missing expected win release artifact/);

    fs.writeFileSync(path.join(directory, 'Brightdesk-Setup-0.1.0-x64.exe'), 'suite installer');
    const result = verifyArtifacts({ directory, platform: 'win' });
    assert.ok(result.files.some(file => file.file === 'Brightdesk-Setup-0.1.0-x64.exe'));
    assert.equal(result.files.filter(file => file.file.startsWith('apps/')).length, 10);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
