#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const appId = process.argv[2];
const platform = process.argv[3];
const publishMode = process.argv[4] === 'always' ? 'always' : 'never';
const apps = new Set(['pages', 'sheets', 'slides', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'loop']);
const targets = {
  win: ['--win', 'nsis', '--x64'],
  mac: ['--mac', 'dmg', 'pkg', 'zip', '--universal'],
  linux: ['--linux', 'AppImage', 'deb', '--x64']
};
if (!apps.has(appId) || !targets[platform]) {
  console.error('Usage: node scripts/build-app.js <app-id> <win|mac|linux> [never|always]');
  process.exit(2);
}
const npmExec = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(npmExec, ['electron-builder', ...targets[platform], '--publish', publishMode, '--config', path.resolve(__dirname, '..', 'electron-builder.app.config.js')], {
  cwd: path.resolve(__dirname, '..'), stdio: 'inherit', shell: process.platform === 'win32',
  env: { ...process.env, BRIGHTDESK_APP_ID: appId }
});
if (result.error) throw result.error;
process.exit(result.status ?? 1);
