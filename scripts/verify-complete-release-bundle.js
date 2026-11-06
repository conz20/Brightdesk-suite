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

const SUITE_LEGAL_FILES = Object.freeze({
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

function escapeRegExp(value) {
  const specialCharacters = '.*+?^$()|[]{}';
  const backslash = String.fromCharCode(92);
  let escaped = '';
  for (const character of value) {
    if (specialCharacters.includes(character) || character === backslash) escaped += backslash;
    escaped += character;
  }
  return escaped;
}

function requireExactlyOneMatch(directory, pattern, label) {
  const matches = fs.readdirSync(directory, { withFileTypes: true })
    .filter(entry => entry.isFile() && pattern.test(entry.name))
    .map(entry => entry.name);

  if (matches.length !== 1) {
    throw new Error(
      'Expected exactly one ' + label + '; found ' + matches.length + ': ' +
      (matches.join(', ') || 'none') + '.'
    );
  }

  return matches[0];
}

function expectedSuiteFiles(options) {
  const directory = options.directory;
  const platform = options.platform;
  const version = options.version;
  if (!PLATFORMS[platform]) throw new Error('Unsupported platform: ' + platform);
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error('A valid Brightdesk release version is required.');
  }

  const escaped = escapeRegExp(version);
  const required = [...SUITE_LEGAL_FILES[platform]];

  if (platform === 'win') {
    required.unshift(requireExactlyOneMatch(
      directory,
      new RegExp('^Brightdesk-Office-Suite-' + escaped + '-x64\\.exe$'),
      'Windows Brightdesk Office Suite x64 installer'
    ));
  } else if (platform === 'mac') {
    required.unshift(
      'Brightdesk-Office-Suite-' + version + '-universal.dmg',
      'Brightdesk-Office-Suite-' + version + '-universal.pkg',
      'Brightdesk-Office-Suite-' + version + '-universal.zip'
    );
  } else {
    required.unshift(
      requireExactlyOneMatch(
        directory,
        new RegExp('^(?:Brightdesk-Office-Suite|brightdesk-office-suite)-' + escaped + '-(?:x64|x86_64)\\.AppImage$'),
        'Linux Brightdesk Office Suite AppImage'
      ),
      requireExactlyOneMatch(
        directory,
        new RegExp('^brightdesk-office-suite-' + escaped + '-(?:x64|amd64)\\.deb$', 'i'),
        'Linux Brightdesk Office Suite Debian package'
      )
    );
  }

  for (const filename of required) {
    requireNonEmptyFile(directory, filename, platform + ' Suite artifact');
  }

  return required;
}

function verifyExactDirectoryContents(options) {
  const directory = options.directory;
  const expectedFiles = options.expectedFiles;
  const manifestName = options.manifestName;
  const label = options.label;
  const allowedFiles = new Set([...expectedFiles, manifestName]);
  const unexpected = fs.readdirSync(directory, { withFileTypes: true })
    .filter(entry => !entry.isFile() || !allowedFiles.has(entry.name))
    .map(entry => entry.name);

  if (unexpected.length) {
    throw new Error(
      label + ' contains unexpected files or directories: ' + unexpected.join(', ') + '.'
    );
  }
}

function verifySuitePlatform(options) {
  const releaseDir = options.releaseDir;
  const platform = options.platform;
  const version = options.version;
  const config = PLATFORMS[platform];
  if (!config) throw new Error('Unsupported platform: ' + platform);

  const directory = path.join(releaseDir, config.directory);
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
    throw new Error('Missing Suite output directory for ' + config.directory + '.');
  }

  const files = expectedSuiteFiles({ directory, platform, version });
  const checksum = verifyChecksumManifest({
    directory,
    manifestName: config.checksum,
    expectedFiles: files,
    label: config.directory + ' Suite'
  });
  verifyExactDirectoryContents({
    directory,
    expectedFiles: files,
    manifestName: config.checksum,
    label: config.directory + ' Suite installer folder'
  });

  return {
    suiteInstallerCount: platform === 'win' ? 1 : platform === 'mac' ? 3 : 2,
    suiteFileCount: checksum.fileCount
  };
}

function verifyProductPlatform(options) {
  const releaseDir = options.releaseDir;
  const platform = options.platform;
  const version = options.version;
  const config = PLATFORMS[platform];
  if (!config) throw new Error('Unsupported platform: ' + platform);

  const directory = path.join(releaseDir, 'apps', config.directory);
  if (!fs.existsSync(directory) || !fs.statSync(directory).isDirectory()) {
    throw new Error('Missing product output directory for ' + config.directory + '.');
  }

  const expectedIds = Object.keys(PRODUCTS).sort();
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  const actualIds = entries.filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
  const unexpectedFiles = entries.filter(entry => !entry.isDirectory()).map(entry => entry.name);

  if (JSON.stringify(actualIds) !== JSON.stringify(expectedIds) || unexpectedFiles.length) {
    const missing = expectedIds.filter(id => !actualIds.includes(id));
    const unexpected = actualIds.filter(id => !expectedIds.includes(id));
    throw new Error(
      'The ' + config.directory + ' platform has missing or unexpected product folders. ' +
      'Missing: ' + (missing.join(', ') || 'none') + '; ' +
      'unexpected: ' + (unexpected.join(', ') || 'none') + '; ' +
      'unexpected files: ' + (unexpectedFiles.join(', ') || 'none') + '.'
    );
  }

  let productInstallerCount = 0;
  for (const productId of expectedIds) {
    const productDirectory = path.join(directory, productId);
    const files = resolveProductFiles(productDirectory, productId, platform, version);
    const manifestName = 'Brightdesk-' + productId + '-SHA256SUMS-' + platform.toUpperCase() + '.txt';

    verifyChecksumManifest({
      directory: productDirectory,
      manifestName,
      expectedFiles: files,
      label: 'Brightdesk ' + PRODUCTS[productId] + ' ' + config.directory
    });
    verifyExactDirectoryContents({
      directory: productDirectory,
      expectedFiles: files,
      manifestName,
      label: 'Brightdesk ' + PRODUCTS[productId] + ' ' + config.directory + ' installer folder'
    });

    productInstallerCount += files.length;
  }

  return { productCount: expectedIds.length, productInstallerCount };
}

function verifyCompleteReleaseBundle(options) {
  const opts = options || {};
  const releaseDir = opts.releaseDir || path.resolve(__dirname, '..', 'release');
  const version = opts.version || require('../package.json').version;

  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error('A valid Brightdesk release version is required.');
  }

  const packageManifest = require('../package.json');
  if (version !== packageManifest.version) {
    throw new Error(
      'Release version mismatch: requested ' + version + ', package.json declares ' + packageManifest.version + '.'
    );
  }

  if (!fs.existsSync(releaseDir) || !fs.statSync(releaseDir).isDirectory()) {
    throw new Error('Complete release folder does not exist: ' + releaseDir);
  }

  const lockPath = requireNonEmptyFile(
    path.join(releaseDir, 'build-metadata'),
    'package-lock.json',
    'release dependency lock'
  );

  let lock;
  try {
    lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  } catch {
    throw new Error('The collected dependency package-lock.json is not valid JSON.');
  }

  if (
    !lock ||
    lock.lockfileVersion !== 3 ||
    lock.version !== version ||
    !lock.packages ||
    !lock.packages[''] ||
    lock.packages[''].version !== version
  ) {
    throw new Error(
      'Release version mismatch: dependency lock must be lockfileVersion 3 and declare ' + version + ' at its root.'
    );
  }

  const platforms = {};
  let suiteInstallerCount = 0;
  let productInstallerCount = 0;

  for (const platform of Object.keys(PLATFORMS)) {
    const suite = verifySuitePlatform({ releaseDir, platform, version });
    const products = verifyProductPlatform({ releaseDir, platform, version });
    platforms[platform] = Object.assign({}, suite, products);
    suiteInstallerCount += suite.suiteInstallerCount;
    productInstallerCount += products.productInstallerCount;
  }

  const installerCount = suiteInstallerCount + productInstallerCount;
  if (suiteInstallerCount !== 6 || productInstallerCount !== 60 || installerCount !== 66) {
    throw new Error(
      'Expected 6 Suite files and 60 product installer/archive files (66 total); ' +
      'verified ' + suiteInstallerCount + ' Suite and ' + productInstallerCount + ' product outputs.'
    );
  }

  return {
    version,
    suiteInstallerCount,
    productCount: Object.keys(PRODUCTS).length,
    productInstallerCount,
    installerCount,
    platforms
  };
}

if (require.main === module) {
  const releaseDir = path.resolve(process.argv[2] || path.join(__dirname, '..', 'release'));
  try {
    const result = verifyCompleteReleaseBundle({ releaseDir });
    console.log(
      'Verified Brightdesk ' + result.version + ': ' + result.installerCount +
      ' Suite and product installer/archive files.'
    );

    for (const [platform, item] of Object.entries(result.platforms)) {
      console.log(
        '- ' + platform + ': ' + item.suiteInstallerCount + ' Suite file(s), ' +
        item.productCount + ' products and ' + item.productInstallerCount +
        ' product file(s); all SHA-256 manifests verified.'
      );
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  SUITE_LEGAL_FILES,
  expectedSuiteFiles,
  verifySuitePlatform,
  verifyProductPlatform,
  verifyCompleteReleaseBundle
};
