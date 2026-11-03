'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { APPROVED_APP_IDS, verifyStandaloneArtifacts } = require('../scripts/verify-release-artifacts');

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
