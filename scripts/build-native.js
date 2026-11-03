#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const manifest = path.join(root, 'rust', 'Cargo.toml');
const releaseDir = path.join(root, 'rust', 'target', 'release');
const nativeNames = {
  win32: 'brightdesk_engine.dll',
  darwin: 'libbrightdesk_engine.dylib',
  linux: 'libbrightdesk_engine.so'
};

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    env: process.env
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!nativeNames[process.platform]) {
  console.error('Brightdesk Rust Native Engine does not support this operating system.');
  process.exit(2);
}

const outputDir = path.join(root, 'native');
fs.mkdirSync(outputDir, { recursive: true });
const destination = path.join(outputDir, 'brightdesk_engine.node');

if (process.platform === 'darwin') {
  const targets = ['aarch64-apple-darwin', 'x86_64-apple-darwin'];
  run('rustup', ['target', 'add', ...targets]);

  const libraries = targets.map(target => {
    run('cargo', [
      'build', '--manifest-path', manifest, '--workspace', '--release', '--target', target
    ]);
    const library = path.join(root, 'rust', 'target', target, 'release', nativeNames.darwin);
    if (!fs.existsSync(library)) {
      throw new Error('Rust did not produce the ' + target + ' native library: ' + library);
    }
    return library;
  });

  run('xcrun', ['lipo', '-create', ...libraries, '-output', destination]);
} else {
  run(process.platform === 'win32' ? 'cargo.exe' : 'cargo', [
    'build', '--manifest-path', manifest, '--workspace', '--release'
  ]);
  const library = path.join(releaseDir, nativeNames[process.platform]);
  if (!fs.existsSync(library)) {
    throw new Error('Rust did not produce the native library: ' + library);
  }
  fs.copyFileSync(library, destination);
}

console.log('Built Brightdesk universal/native Node-API module:', destination);
