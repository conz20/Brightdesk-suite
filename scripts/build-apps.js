#!/usr/bin/env node
'use strict';

const { spawnSync } = require('node:child_process');
const path = require('node:path');

const platform = process.argv[2];
const apps = ['pages', 'sheets', 'slides', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'loop'];

if (!['win', 'mac', 'linux'].includes(platform)) {
  console.error('Usage: node scripts/build-apps.js <win|mac|linux>');
  process.exit(2);
}

for (const appId of apps) {
  console.log(`\n=== Building Brightdesk ${appId} (${platform}) ===`);
  const result = spawnSync(process.execPath, [path.join(__dirname, 'build-app.js'), appId, platform], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'inherit',
    env: process.env
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
