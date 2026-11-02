#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const PLATFORMS = Object.freeze({
  linux: 'Linux',
  win: 'Windows',
  mac: 'macOS'
});

function moveFile(source, destination) {
  if (fs.existsSync(destination)) {
    throw new Error(`Refusing to overwrite an existing release file: ${destination}`);
  }
  fs.renameSync(source, destination);
}

function moveDirectory(source, destination) {
  if (fs.existsSync(destination)) {
    throw new Error(`Refusing to overwrite an existing app release folder: ${destination}`);
  }
  fs.renameSync(source, destination);
}

function collectPlatformBuild({ rootDir, platform }) {
  const label = PLATFORMS[platform];
  if (!label) throw new Error(`Unsupported platform: ${platform}`);

  const releaseDir = path.join(rootDir, 'release');
  if (!fs.existsSync(releaseDir) || !fs.statSync(releaseDir).isDirectory()) {
    throw new Error(`Release output folder is missing: ${releaseDir}`);
  }

  const platformDir = path.join(releaseDir, label);
  fs.mkdirSync(platformDir, { recursive: true });

  let suiteFiles = 0;
  for (const entry of fs.readdirSync(releaseDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    moveFile(path.join(releaseDir, entry.name), path.join(platformDir, entry.name));
    suiteFiles += 1;
  }

  const appsDir = path.join(releaseDir, 'apps');
  let appFolders = 0;
  if (fs.existsSync(appsDir)) {
    const platformAppsDir = path.join(appsDir, label);
    fs.mkdirSync(platformAppsDir, { recursive: true });
    const existingPlatformFolders = new Set(Object.values(PLATFORMS));

    for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || existingPlatformFolders.has(entry.name)) continue;
      moveDirectory(path.join(appsDir, entry.name), path.join(platformAppsDir, entry.name));
      appFolders += 1;
    }
  }

  return { platform: label, suiteFiles, appFolders, platformDir };
}

if (require.main === module) {
  try {
    const platform = process.argv[2];
    const rootDir = path.resolve(__dirname, '..');
    const result = collectPlatformBuild({ rootDir, platform });
    console.log(`Collected ${result.suiteFiles} ${result.platform} suite file(s) and ${result.appFolders} standalone app folder(s).`);
    console.log(`Platform output: ${result.platformDir}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { PLATFORMS, collectPlatformBuild };
