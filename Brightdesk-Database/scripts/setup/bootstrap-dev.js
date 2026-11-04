#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const manifest = require(path.join(root, 'package.json'));
const expectedNode = manifest.engines && manifest.engines.node;

function run(command, args, label) {
  console.log(`\n[Brightdesk setup] ${label}`);
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.error) throw new Error(`${label} could not start: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${label} failed with exit code ${result.status === null ? 'unknown' : result.status}.`);
}

function main() {
  if (!expectedNode || process.versions.node !== expectedNode) {
    throw new Error(`Brightdesk requires Node.js ${expectedNode || '24.22.2'} exactly. Found ${process.version}. Install it with scripts/install-node24.sh or scripts/install-node24.ps1, activate it, then retry.`);
  }

  const lockPath = path.join(root, 'package-lock.json');
  if (!fs.existsSync(lockPath)) {
    run('npm', ['run', 'lock:prepare'], 'Generate a real package-lock.json from the pinned package manifest');
  }

  run('npm', ['run', 'lock:verify'], 'Verify package-lock.json against package.json');
  run('npm', ['ci', '--include=dev', '--no-audit', '--no-fund'], 'Install exact locked dependencies');
  run('npm', ['run', 'verify:licenses'], 'Verify third-party licence notices');
  run('npm', ['test'], 'Run automated tests');
  console.log('\nBrightdesk development dependencies are installed and checks passed.');
}

try {
  main();
} catch (error) {
  console.error(`\nBrightdesk setup blocked: ${error.message}`);
  process.exitCode = 1;
}
