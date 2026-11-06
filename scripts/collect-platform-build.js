#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const PLATFORMS = Object.freeze({
  linux: 'Linux',
  win: 'Windows',
  mac: 'macOS'
});
const PLATFORM_DIRECTORIES = new Set(Object.values(PLATFORMS));

function moveFile(source, destination) {
  if (fs.existsSync(destination)) throw new Error(`Refusing to overwrite an existing release file: ${destination}`);
  fs.renameSync(source, destination);
}

function moveDirectory(source, destination) {
  if (fs.existsSync(destination)) throw new Error(`Refusing to overwrite an existing product folder: ${destination}`);
  fs.renameSync(source, destination);
}

function collectPlatformBuild({ rootDir = path.resolve(__dirname, '..'), platform }) {
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
  let productFolders = 0;
  if (fs.existsSync(appsDir)) {
    const platformAppsDir = path.join(appsDir, label);
    fs.mkdirSync(platformAppsDir, { recursive: true });
    for (const entry of fs.readdirSync(appsDir, { withFileTypes: true })) {
      if (!entry.isDirectory() || PLATFORM_DIRECTORIES.has(entry.name)) continue;
      moveDirectory(path.join(appsDir, entry.name), path.join(platformAppsDir, entry.name));
      productFolders += 1;
    }
  }

  return { platform: label, suiteFiles, productFolders, platformDir };
}

if (require.main === module) {
  try {
    const result = collectPlatformBuild({ platform: process.argv[2] });
    console.log(`Collected ${result.suiteFiles} Suite file(s) and ${result.productFolders} product folder(s) for ${result.platform}.`);
    console.log(`Platform output: ${result.platformDir}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { PLATFORMS, collectPlatformBuild };
