#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');
const path = require('node:path');
const packageConfig = require('../package.json');

const requiredNode = packageConfig.engines?.node || '24.22.2';
if (process.versions.node !== requiredNode) {
  console.error(`Brightdesk requires Node.js ${requiredNode}; found ${process.versions.node}.`);
  process.exit(1);
}

const platforms = { darwin: 'mac', win32: 'win', linux: 'linux' };
const platform = platforms[process.platform];
if (!platform) {
  console.error('Brightdesk local release builds require macOS, Windows or Linux.');
  process.exit(1);
}

const root = path.resolve(__dirname, '..');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(args) {
  const command = [npm, ...args].join(' ');
  console.log(`\\n=== ${command} ===`);
  const result = spawnSync(npm, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    console.error(`\\nStopped: ${command} failed with exit code ${result.status ?? 1}.`);
    process.exit(result.status ?? 1);
  }
}

console.log(`Brightdesk local ${platform} release verification — Node.js ${requiredNode}`);
console.log('This process builds locally. It does not upload files or publish a release.');

run(['run', 'check:node']);
run(['run', 'lock:verify']);
run(['ci', '--no-audit', '--no-fund']);
run(['run', 'verify:licenses']);
run(['test']);
run(['run', 'release:preflight']);
run(['audit', '--audit-level=high']);
run(['run', `dist:${platform}`]);
run(['run', 'release:prepare', '--', platform]);
run(['run', `release:verify:${platform}`]);

console.log(`\\nBrightdesk ${platform} build and local release checks completed. Review the release/ folder and checksum file before distributing anything.`);
