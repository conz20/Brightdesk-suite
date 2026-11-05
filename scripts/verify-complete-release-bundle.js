#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { APP_SLUGS } = require('../src/standalone-downloads');
const { expectedFilename } = require('./verify-standalone-apps');

const PLATFORMS = Object.freeze({
  win: {
    directory: 'Windows',
    checksum: 'Brightdesk-SHA256SUMS-WIN.txt',
    productManifest: appId => `Brightdesk-${appId}-SHA256SUMS-WIN.txt`
  },
  mac: {
    directory: 'macOS',
    checksum: 'Brightdesk-SHA256SUMS-MAC.txt',
    productManifest: appId => `Brightdesk-${appId}-SHA256SUMS-MAC.txt`
  },
  linux: {
    directory: 'Linux',
    checksum: 'Brightdesk-SHA256SUMS-LINUX.txt',
    productManifest: appId => `Brightdesk-${appId}-SHA256SUMS-LINUX.txt`
  }
});

const LEGAL_FILES = Object.freeze({
  win: [
    'Brightdesk-Windows-TERMS_AND_CONDITIONS.txt',
    'Brightdesk-Windows-LICENSE.txt',
    'Brightdesk-Windows-THIRD_PARTY_NOTICES.md'
  ],
  mac: [
    'Brightdesk-macOS-TERMS_AND_CONDITIONS.txt',
    'Brightdesk-macOS-LICENSE.txt',
    'Brightdesk-macOS-THIRD_PARTY_NOTICES.md'
  ],
  linux: [
    'Brightdesk-Linux-TERMS_AND_CONDITIONS.txt',
    'Brightdesk-Linux-LICENSE.txt',
    'Brightdesk-Linux-THIRD_PARTY_NOTICES.md',
    'Brightdesk-Install-Linux.sh'
  ]
});

function sha256File(file) {
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(file, 'r');
  const buffer = Buffer.allocUnsafe(1024 * 1024);
  try {
    let bytesRead;
    do {
      bytesRead = fs.readSync(fd, buffer, 0, buffer.length, null);
      if (bytesRead > 0) hash.update(buffer.subarray(0, bytesRead));
    } while (bytesRead > 0);
  } finally {
    fs.closeSync(fd);
  }
  return hash.digest('hex');
}

function requireNonEmptyFile(directory, filename, label) {
  const fullPath = path.join(directory, filename);
  let stat;
  try {
    stat = fs.lstatSync(fullPath);
  } catch {
    throw new Error(`Missing ${label}: ${filename}`);
  }
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size <= 0) {
    throw new Error(`${label} must be a non-empty regular file: ${filename}`);
  }
  return fullPath;
}

function requireOneFilename(directory, pattern, label) {
  const matches = fs.readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isFile() && pattern.test(entry.name))
    .map(entry => entry.name);
  if (matches.length !== 1) {
    throw new Error(`Expected exactly one ${label}; found ${matches.length}.`);
  }
  return matches[0];
}

function verifyChecksumManifest({ directory, manifestName, expectedFiles, label }) {
  const manifestPath = requireNonEmptyFile(directory, manifestName, `${label} SHA-256 manifest`);
  const lines = fs.readFileSync(manifestPath, 'utf8').split(/\r?\n/);
  if (lines.at(-1) === '') lines.pop();
  if (!lines.length) throw new Error(`${label} SHA-256 manifest is empty.`);

  const entries = [];
  const seen = new Set();
  for (const line of lines) {
    const match = /^([a-f0-9]{64})  ([A-Za-z0-9][A-Za-z0-9._-]*)$/.exec(line);
    if (!match) throw new Error(`Invalid or unsafe ${label} checksum manifest row: ${line}`);
    const [, expectedHash, filename] = match;
    if (seen.has(filename)) throw new Error(`Duplicate ${label} checksum entry: ${filename}`);
    seen.add(filename);
    entries.push({ filename, expectedHash });
  }

  const expected = new Set(expectedFiles);
  if (entries.length !== expected.size || entries.some(entry => !expected.has(entry.filename))) {
    const missing = [...expected].filter(filename => !seen.has(filename));
    const unexpected = [...seen].filter(filename => !expected.has(filename));
    throw new Error(`${label} checksum manifest does not match its expected files. Missing: ${missing.join(', ') || 'none'}; unexpected: ${unexpected.join(', ') || 'none'}.`);
  }

  for (const entry of entries) {
    const filePath = requireNonEmptyFile(directory, entry.filename, `${label} checksum target`);
    const actualHash = sha256File(filePath);
    if (actualHash !== entry.expectedHash) {
      throw new Error(`SHA-256 mismatch for ${label} artifact ${entry.filename}: expected ${entry.expectedHash}, received ${actualHash}.`);
    }
  }

  return { fileCount: entries.length, files: entries.map(entry => entry.filename) };
}

function expectedSuiteInstallerFiles({ directory, platform, version }) {
  const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const required = [...LEGAL_FILES[platform]];

  if (platform === 'win') {
    required.unshift(requireOneFilename(
      directory,
      new RegExp(`^Brightdesk-Setup-${escapedVersion}-x64\\.exe$`),
      'Windows Suite x64 installer'
    ));
  } else if (platform === 'mac') {
    required.unshift(
      `Brightdesk-${version}-universal.dmg`,
      `Brightdesk-${version}-universal.pkg`,
      `Brightdesk-${version}-universal.zip`
    );
  } else {
    required.unshift(
      requireOneFilename(
        directory,
        new RegExp(`^Brightdesk-${escapedVersion}-(?:x64|x86_64)\\.AppImage$`),
        'Linux Suite AppImage'
      ),
      requireOneFilename(
        directory,
        new RegExp(`^brightdesk-${escapedVersion}-(?:x64|x86_64|amd64)\\.deb$`, 'i'),
        'Linux Suite Debian package'
      )
    );
  }

  for (const filename of required) requireNonEmptyFile(directory, filename, `${platform} Suite artifact`);
  return required;
}

function verifySuitePlatform({ releaseDir, platform, version }) {
  const config = PLATFORMS[platform];
  const directory = path.join(releaseDir, config.directory);
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
    throw new Error(`Missing Suite output directory for ${config.directory}.`);
  }

  const expectedFiles = expectedSuiteInstallerFiles({ directory, platform, version });
  const checksum = verifyChecksumManifest({
    directory,
    manifestName: config.checksum,
    expectedFiles,
    label: `${config.directory} Suite`
  });

  return { suiteInstallerCount: platform === 'win' ? 1 : platform === 'mac' ? 3 : 2, checksumFileCount: checksum.fileCount };
}

function verifyProductPlatform({ releaseDir, platform, version }) {
  const config = PLATFORMS[platform];
  const platformLabel = config.directory;
  const directory = path.join(releaseDir, 'apps', platformLabel);
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
    throw new Error(`Missing product output directory for ${platformLabel}.`);
  }

  const expectedIds = Object.keys(APP_SLUGS).sort();
  const actualIds = fs.readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => entry.name)
    .sort();
  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds)) {
    throw new Error(`The ${platformLabel} platform has missing or unexpected approved product directories. Expected: ${expectedIds.join(', ')}; found: ${actualIds.join(', ') || 'none'}.`);
  }

  let productInstallerCount = 0;
  for (const appId of expectedIds) {
    const appDirectory = path.join(directory, appId);
    const installerFiles = expectedFilename(appId, platform, version);
    for (const filename of installerFiles) requireNonEmptyFile(appDirectory, filename, `Brightdesk ${APP_SLUGS[appId]} installer`);
    verifyChecksumManifest({
      directory: appDirectory,
      manifestName: config.productManifest(appId),
      expectedFiles: installerFiles,
      label: `Brightdesk ${APP_SLUGS[appId]} ${platformLabel}`
    });
    productInstallerCount += installerFiles.length;
  }

  return { productCount: expectedIds.length, productInstallerCount };
}

function verifyCompleteReleaseBundle({ releaseDir = path.resolve(__dirname, '..', 'release'), version = require('../package.json').version } = {}) {
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error('A valid Brightdesk release version is required.');
  }
  if (!fs.existsSync(releaseDir) || !fs.statSync(releaseDir).isDirectory()) {
    throw new Error(`Complete release folder does not exist: ${releaseDir}`);
  }

  const lockPath = requireNonEmptyFile(path.join(releaseDir, 'build-metadata'), 'package-lock.json', 'release dependency lock');
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  if (!lock || !Number.isInteger(lock.lockfileVersion)) {
    throw new Error('The collected dependency package-lock.json is invalid or has no lockfileVersion.');
  }

  const platforms = {};
  let installerCount = 0;
  for (const platform of Object.keys(PLATFORMS)) {
    const suite = verifySuitePlatform({ releaseDir, platform, version });
    const products = verifyProductPlatform({ releaseDir, platform, version });
    platforms[platform] = { ...suite, ...products };
    installerCount += suite.suiteInstallerCount + products.productInstallerCount;
  }

  if (installerCount !== 66) {
    throw new Error(`Expected 66 installer/archive outputs across the Suite and ten products; verified ${installerCount}.`);
  }

  return { version, installerCount, platforms, productIds: Object.keys(APP_SLUGS) };
}

if (require.main === module) {
  const releaseDir = path.resolve(process.argv[2] || path.join(__dirname, '..', 'release'));
  try {
    const result = verifyCompleteReleaseBundle({ releaseDir });
    console.log(`Verified Brightdesk ${result.version}: ${result.installerCount} Suite and product installer/archive outputs.`);
    for (const [platform, item] of Object.entries(result.platforms)) {
      console.log(`- ${platform}: ${item.suiteInstallerCount} Suite files, ${item.productCount} products, ${item.productInstallerCount} product files; checksum manifests matched.`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  PLATFORMS,
  LEGAL_FILES,
  sha256File,
  verifyChecksumManifest,
  expectedSuiteInstallerFiles,
  verifySuitePlatform,
  verifyProductPlatform,
  verifyCompleteReleaseBundle
};
