#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const manifest = path.join(root, 'rust', 'Cargo.toml');
const releaseDir = path.join(root, 'rust', 'target', 'release');
const outputDir = path.join(root, 'native');
const nativeNames = {
  win32: 'brightdesk_engine.dll',
  darwin: 'libbrightdesk_engine.dylib',
  linux: 'libbrightdesk_engine.so'
};

const libraryName = nativeNames[process.platform];
if (!libraryName) {
  console.error('Brightdesk native engine does not support this operating system.');
  process.exit(2);
}
const cargo = process.platform === 'win32' ? 'cargo.exe' : 'cargo';
const result = spawnSync(cargo, ['build', '--manifest-path', manifest, '--workspace', '--release'], {
  cwd: root,
  stdio: 'inherit',
  shell: process.platform === 'win32',
  env: process.env
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const source = path.join(releaseDir, libraryName);
if (!fs.existsSync(source)) {
  console.error('Cargo completed but the expected native library was not produced:', source);
  process.exit(1);
}
fs.mkdirSync(outputDir, { recursive: true });
const destination = path.join(outputDir, 'brightdesk_engine.node');
fs.copyFileSync(source, destination);
console.log('Built Brightdesk Node-API module:', destination);
