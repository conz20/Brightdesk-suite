'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');

function run(command, args) {
  execFileSync(command, args, {
    cwd: root,
    stdio: 'inherit'
  });
}

function copyNative(source, platform, arch) {
  if (!fs.existsSync(source)) {
    throw new Error(`Native build output not found: ${source}`);
  }

  const destination = path.join(
    root,
    'native',
    `${platform}-${arch}`,
    'brightdesk_native.node'
  );

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  console.log(`Created ${path.relative(root, destination)}`);
}

function buildMac() {
  const targets = [
    { triple: 'aarch64-apple-darwin', arch: 'arm64' },
    { triple: 'x86_64-apple-darwin', arch: 'x64' }
  ];

  const outputs = [];

  for (const target of targets) {
    run('rustup', ['target', 'add', target.triple]);
    run('cargo', [
      'build',
      '--manifest-path', 'rust/Cargo.toml',
      '-p', 'brightdesk-native',
      '--release',
      '--target', target.triple
    ]);

    outputs.push(
      path.join(
        root,
        'rust',
        'target',
        target.triple,
        'release',
        'libbrightdesk_native.dylib'
      )
    );
  }

  const universal = path.join(
    os.tmpdir(),
    `brightdesk-native-${process.pid}.dylib`
  );

  try {
    run('lipo', ['-create', ...outputs, '-output', universal]);

    for (const target of targets) {
      copyNative(universal, 'darwin', target.arch);
    }
  } finally {
    if (fs.existsSync(universal)) fs.unlinkSync(universal);
  }
}

function buildCurrentPlatform() {
  if (!['linux', 'win32'].includes(process.platform)) {
    throw new Error(`Unsupported build platform: ${process.platform}`);
  }

  if (!['x64', 'arm64'].includes(process.arch)) {
    throw new Error(`Unsupported build architecture: ${process.arch}`);
  }

  run('cargo', [
    'build',
    '--manifest-path', 'rust/Cargo.toml',
    '-p', 'brightdesk-native',
    '--release'
  ]);

  const filename = process.platform === 'win32'
    ? 'brightdesk_native.dll'
    : 'libbrightdesk_native.so';

  const output = path.join(
    root,
    'rust',
    'target',
    'release',
    filename
  );

  copyNative(output, process.platform, process.arch);
}

if (process.platform === 'darwin') {
  buildMac();
} else {
  buildCurrentPlatform();
}

console.log('Brightdesk native engine build completed.');
