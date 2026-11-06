#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {
  PRODUCTS,
  PLATFORMS,
  resolveProductFiles,
  requireNonEmptyFile,
  verifyChecksumManifest
} = require('./verify-product-installers');

function moveFile(source, destination) {
  if (fs.existsSync(destination)) throw new Error(`Refusing to overwrite an existing release file: ${destination}`);
  fs.renameSync(source, destination);
}

function readVerifiedManifestFiles(directory, manifestName, label) {
  const manifestPath = requireNonEmptyFile(directory, manifestName, `${label} SHA-256 manifest`);
  const lines = fs.readFileSync(manifestPath, 'utf8').split(/\r?\n/).filter(Boolean);
  const expectedFiles = lines.map(line => {
    const match = /^([a-f0-9]{64})  ([A-Za-z0-9][A-Za-z0-9._-]*)$/.exec(line);
    if (!match) throw new Error(`Invalid or unsafe checksum manifest row in ${label}: ${line}`);
    return match[2];
  });
  return verifyChecksumManifest({
    directory,
    manifestName,
    expectedFiles,
    label
  }).files;
}

function copyVerifiedFile(sourceDirectory, destinationDirectory, filename, label) {
  const source = requireNonEmptyFile(sourceDirectory, filename, label);
  const destination = path.join(destinationDirectory, filename);
  if (fs.existsSync(destination)) throw new Error(`Refusing to overwrite an existing release file: ${destination}`);
  fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
}

function collectPlatformBuild({ rootDir = path.resolve(__dirname, '..'), platform, version = require('../package.json').version }) {
  const platformConfig = PLATFORMS[platform];
  if (!platformConfig) throw new Error(`Unsupported platform: ${platform}`);
  const label = platformConfig.directory;
  const releaseDir = path.join(rootDir, 'release');
  if (!fs.existsSync(releaseDir) || !fs.statSync(releaseDir).isDirectory()) {
    throw new Error(`Release output folder is missing: ${releaseDir}`);
  }

  // Only move Suite files covered by the verified manifest. Unpacked app
  // folders and other build intermediates stay outside the uploaded bundle.
  const suiteFiles = readVerifiedManifestFiles(
    releaseDir,
    platformConfig.checksum,
    `${label} Suite`
  );
  const platformDir = path.join(releaseDir, label);
  fs.mkdirSync(platformDir, { recursive: true });
  for (const filename of suiteFiles) {
    moveFile(path.join(releaseDir, filename), path.join(platformDir, filename));
  }
  moveFile(
    path.join(releaseDir, platformConfig.checksum),
    path.join(platformDir, platformConfig.checksum)
  );

  const appsDir = path.join(releaseDir, 'apps');
  let productFolders = 0;
  let productFiles = 0;
  if (fs.existsSync(appsDir)) {
    const appsStat = fs.lstatSync(appsDir);
    if (!appsStat.isDirectory() || appsStat.isSymbolicLink()) {
      throw new Error(`Product build output must be a real directory: ${appsDir}`);
    }
    const platformAppsDir = path.join(appsDir, label);
    fs.mkdirSync(platformAppsDir, { recursive: true });
    for (const [productId, productName] of Object.entries(PRODUCTS)) {
      const sourceDirectory = path.join(appsDir, productId);
      if (!fs.existsSync(sourceDirectory)) {
        throw new Error(`Missing product build output for Brightdesk ${productName}: ${sourceDirectory}`);
      }
      const sourceStat = fs.lstatSync(sourceDirectory);
      if (!sourceStat.isDirectory() || sourceStat.isSymbolicLink()) {
        throw new Error(`Product build output must be a real directory: ${sourceDirectory}`);
      }
      const files = resolveProductFiles(sourceDirectory, productId, platform, version);
      const manifestName = `Brightdesk-${productId}-SHA256SUMS-${platform.toUpperCase()}.txt`;
      verifyChecksumManifest({
        directory: sourceDirectory,
        manifestName,
        expectedFiles: files,
        label: `Brightdesk ${productName} ${label}`
      });

      const destinationDirectory = path.join(platformAppsDir, productId);
      if (fs.existsSync(destinationDirectory)) {
        throw new Error(`Refusing to overwrite an existing product bundle: ${destinationDirectory}`);
      }
      fs.mkdirSync(destinationDirectory, { recursive: true });
      for (const filename of files) {
        copyVerifiedFile(sourceDirectory, destinationDirectory, filename, `Brightdesk ${productName} installer`);
        productFiles += 1;
      }
      copyVerifiedFile(sourceDirectory, destinationDirectory, manifestName, `Brightdesk ${productName} SHA-256 manifest`);
      productFolders += 1;
    }
  }

  return { platform: label, suiteFiles: suiteFiles.length, productFolders, productFiles, platformDir };
}

if (require.main === module) {
  try {
    const result = collectPlatformBuild({ platform: process.argv[2] });
    console.log(`Collected ${result.suiteFiles} Suite file(s), ${result.productFiles} product installer/archive file(s) across ${result.productFolders} product folders for ${result.platform}.`);
    console.log(`Verified platform output: ${result.platformDir}`);
    console.log(`Product output: ${path.join(path.dirname(result.platformDir), 'apps', result.platform)}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { collectPlatformBuild, readVerifiedManifestFiles };
