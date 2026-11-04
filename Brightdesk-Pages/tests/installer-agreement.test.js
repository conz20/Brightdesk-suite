'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');

const installerRunnable = (() => {
  if (process.platform !== 'linux') return false;
  const probe = spawnSync('bash', ['-c', '[[ "${BASH_VERSINFO:-0}" -ge 4 ]]']);
  return probe.status === 0;
})();
const skipInstaller = installerRunnable
  ? false
  : `Linux installer is Debian/Ubuntu + bash 4 only (host platform: ${process.platform})`;

test('Brightdesk terms clearly preserve free MIT open-source use without activation codes', () => {
  const terms = fs.readFileSync(path.join(root, 'TERMS_AND_CONDITIONS.txt'), 'utf8');
  assert.match(terms, /free of charge/i);
  assert.match(terms, /MIT License/i);
  assert.match(terms, /No activation code, product key/i);
  assert.match(terms, /Nothing in these Terms excludes rights or remedies/i);
});

test('Linux installer stops when the user declines the agreement', { skip: skipInstaller }, () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-installer-no-'));
  try {
    const bin = path.join(temp, 'bin'); fs.mkdirSync(bin);
    fs.writeFileSync(path.join(bin, 'apt-get'), '#!/bin/sh\nexit 0\n');
    fs.chmodSync(path.join(bin, 'apt-get'), 0o755);

    const script = path.join(temp, 'install-linux.sh');
    fs.copyFileSync(path.join(root, 'installer', 'install-linux.sh'), script);
    fs.copyFileSync(path.join(root, 'TERMS_AND_CONDITIONS.txt'), path.join(temp, 'TERMS_AND_CONDITIONS.txt'));
    fs.writeFileSync(path.join(temp, 'brightdesk-0.1.0-x64.deb'), 'test package');

    const result = spawnSync('bash', [script], {
      input: 'no\n',
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}` }
    });
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stdout, /has not been installed/i);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('Linux installer continues only after an explicit Yes response', { skip: skipInstaller }, () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-installer-yes-'));
  try {
    const bin = path.join(temp, 'bin'); fs.mkdirSync(bin);
    fs.writeFileSync(path.join(bin, 'apt-get'), '#!/bin/sh\nexit 0\n');
    fs.chmodSync(path.join(bin, 'apt-get'), 0o755);

    const script = path.join(temp, 'install-linux.sh');
    fs.copyFileSync(path.join(root, 'installer', 'install-linux.sh'), script);
    fs.copyFileSync(path.join(root, 'TERMS_AND_CONDITIONS.txt'), path.join(temp, 'TERMS_AND_CONDITIONS.txt'));
    fs.writeFileSync(path.join(temp, 'brightdesk-0.1.0-x64.deb'), 'test package');

    const log = path.join(temp, 'sudo-args.txt');
    fs.writeFileSync(path.join(bin, 'sudo'), `#!/bin/sh\nprintf '%s\\n' "$@" > '${log}'\n`);
    fs.chmodSync(path.join(bin, 'sudo'), 0o755);

    const result = spawnSync('bash', [script], {
      input: 'yes\n',
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}` }
    });
    assert.equal(result.status, 0, result.stderr);
    const args = fs.readFileSync(log, 'utf8');
    assert.match(args, /apt-get/);
    assert.match(args, /install/);
    assert.match(args, /brightdesk-0\.1\.0-x64\.deb/);
    assert.match(result.stdout, /installation completed/i);
  } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});
