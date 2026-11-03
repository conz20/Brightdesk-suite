'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const manifest = path.join(root, 'rust', 'Cargo.toml');
const executable = process.platform === 'win32' ? 'brightdesk-rust-engine.exe' : 'brightdesk-rust-engine';
const built = path.join(root, 'rust', 'target', 'release', executable);
const outputDirectory = path.join(root, 'native');
const output = path.join(outputDirectory, executable);

const result = spawnSync('cargo', ['build', '--manifest-path', manifest, '--release', '--bin', 'brightdesk-rust-engine'], {
  cwd: root,
  stdio: 'inherit',
  env: process.env,
  shell: process.platform === 'win32'
});

if (result.error) {
  console.error(`Could not start Cargo: ${result.error.message}`);
  process.exit(1);
}
if (result.status !== 0) process.exit(result.status || 1);
if (!fs.existsSync(built)) {
  console.error(`Cargo completed but the Rust engine binary was not found at ${built}`);
  process.exit(1);
}

fs.mkdirSync(outputDirectory, { recursive: true });
fs.copyFileSync(built, output);
if (process.platform !== 'win32') fs.chmodSync(output, 0o755);
console.log(`Built Brightdesk Rust engine: ${path.relative(root, output)}`);
