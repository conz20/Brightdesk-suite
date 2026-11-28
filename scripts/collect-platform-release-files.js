'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const packageConfig = require('../package.json');

const PRODUCTS = Object.freeze([
  'pages', 'sheets', 'slides', 'notes', 'database',
  'forms', 'lists', 'planner', 'todo', 'loop'
]);

const PLATFORMS = Object.freeze({
  win: Object.freeze({ directory: 'Windows', formats: ['exe'] }),
  mac: Object.freeze({ directory: 'macOS', formats: ['dmg', 'pkg', 'zip'] }),
  linux: Object.freeze({ directory: 'Linux', formats: ['appimage', 'deb'] })
});

function lstatRequired(filePath, description) {
  let metadata;
  try {
    metadata = fs.lstatSync(filePath);
  } catch (error) {
    throw new Error(description + ' is missing or unreadable: ' + (error.code || error.message));
  }
  if (metadata.isSymbolicLink()) throw new Error(description + ' must not be a symbolic link.');
  return metadata;
}

function requireDirectory(filePath, description) {
  const metadata = lstatRequired(filePath, description);
  if (!metadata.isDirectory()) throw new Error(description + ' must be a directory.');
  return metadata;
}

function safeFilename(filename) {
  if (typeof filename !== 'string' || filename.length === 0) return false;
  if (filename === '.' || filename === '..' || /[\\/<>:"|?*\u0000-\u001f]/.test(filename)) return false;
  if (/[. ]$/.test(filename)) return false;
  const stem = filename.split('.')[0].replace(/[ .]+$/g, '').toUpperCase();
  if (['CON', 'PRN', 'AUX', 'NUL', 'CONIN$', 'CONOUT$', 'CLOCK$'].includes(stem)) return false;
  if (/^(COM|LPT)([1-9]|[¹²³])$/.test(stem)) return false;
  return true;
}

function allowedSuiteArtifactNames(platform) {
  const version = String(packageConfig.version).split('.').join('\\.');
  const patterns = {
    win: [new RegExp('^Brightdesk-Office-Suite-' + version + '-x64\\.exe$', 'i')],
    mac: [new RegExp('^Brightdesk-Office-Suite-' + version + '-universal\\.(?:dmg|pkg|zip)$', 'i')],
    linux: [
      new RegExp('^brightdesk-office-suite-' + version + '-x64\\.deb$', 'i'),
      new RegExp('^Brightdesk-Office-Suite-' + version + '-x64\\.AppImage$', 'i')
    ]
  };
  return patterns[platform];
}

function validateTopLevelReleaseFiles(releaseDirectory, platform) {
  const config = PLATFORMS[platform];
  const platformCode = platform.toUpperCase();
  const required = new Set([
    'Brightdesk-SHA256SUMS-' + platformCode + '.txt',
    'Brightdesk-SHA256SUMS-PRODUCTS-' + platformCode + '.txt',
    'Brightdesk-' + config.directory + '-TERMS_AND_CONDITIONS.txt',
    'Brightdesk-' + config.directory + '-LICENSE.txt',
    'Brightdesk-' + config.directory + '-THIRD_PARTY_NOTICES.md'
  ]);
  if (platform === 'linux') required.add('Brightdesk-Install-Linux.sh');

  const artifactPatterns = allowedSuiteArtifactNames(platform);
  const presentArtifacts = new Set();
  const movable = [];

  for (const entry of fs.readdirSync(releaseDirectory, { withFileTypes: true })) {
    if (entry.name === config.directory || entry.name === 'apps') continue;
    const fullPath = path.join(releaseDirectory, entry.name);
    const metadata = lstatRequired(fullPath, 'Release entry ' + entry.name);
    if (metadata.isDirectory()) continue;
    if (!metadata.isFile()) throw new Error('Release entry is not a regular file: ' + entry.name);

    if (required.has(entry.name)) {
      movable.push(entry.name);
      continue;
    }

    const suiteArtifact = artifactPatterns.find(pattern => pattern.test(entry.name));
    if (suiteArtifact) {
      const extension = path.extname(entry.name).slice(1).toLowerCase();
      if (presentArtifacts.has(extension)) {
        throw new Error('Duplicate Suite installer artifact for ' + platform + ': ' + entry.name);
      }
      presentArtifacts.add(extension);
      movable.push(entry.name);
      continue;
    }

    throw new Error('Unexpected release file is not permitted: ' + entry.name);
  }

  for (const extension of config.formats) {
    if (!presentArtifacts.has(extension)) {
      throw new Error('Missing Suite installer artifact for ' + platform + ': .' + extension);
    }
  }

  const missing = [...required].filter(name => !movable.includes(name));
  if (missing.length) {
    throw new Error('Platform release bundle is missing required file(s): ' + missing.join(', '));
  }
  return movable;
}

function sha256RegularFile(filePath, description = 'Product installer') {
  const before = lstatRequired(filePath, description);
  if (!before.isFile()) throw new Error(description + ' is not a regular file: ' + filePath);

  let descriptor;
  try {
    const flags = fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0);
    descriptor = fs.openSync(filePath, flags);
    const opened = fs.fstatSync(descriptor);
    if (!opened.isFile() || opened.dev !== before.dev || opened.ino !== before.ino || opened.size !== before.size) {
      throw new Error(description + ' changed while it was being checked: ' + filePath);
    }

    const hash = crypto.createHash('sha256');
    const buffer = Buffer.allocUnsafe(1024 * 1024);
    let bytesRead;
    do {
      bytesRead = fs.readSync(descriptor, buffer, 0, buffer.length, null);
      if (bytesRead > 0) hash.update(buffer.subarray(0, bytesRead));
    } while (bytesRead > 0);

    const after = fs.lstatSync(filePath);
    if (after.isSymbolicLink() || !after.isFile() || after.dev !== before.dev || after.ino !== before.ino || after.size !== before.size) {
      throw new Error(description + ' path changed during verification: ' + filePath);
    }
    return { sha256: hash.digest('hex'), sizeBytes: opened.size, dev: opened.dev, ino: opened.ino };
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
  }
}

function parseProductManifest(manifestPath, platform) {
  const metadata = lstatRequired(manifestPath, 'Product checksum manifest');
  if (!metadata.isFile()) throw new Error('Product checksum manifest must be a regular file.');

  const content = fs.readFileSync(manifestPath, 'utf8');
  const lines = content.split(/\r?\n/).filter(line => line.length > 0);
  const expectedCount = PRODUCTS.length * PLATFORMS[platform].formats.length;
  if (lines.length !== expectedCount) {
    throw new Error('Product checksum manifest must contain exactly ' + expectedCount + ' entries; found ' + lines.length + '.');
  }

  const seen = new Set();
  const pairs = new Set();
  const records = [];
  const pattern = /^([a-f0-9]{64})  (apps\/org\.brightdesk\.([a-z]+)\/([^/\\]+))$/i;
  const allowedFormats = new Set(PLATFORMS[platform].formats);

  for (const line of lines) {
    const match = pattern.exec(line);
    if (!match) throw new Error('Invalid product checksum entry: ' + line);
    const expectedHash = match[1].toLowerCase();
    const relativePath = match[2];
    const productId = match[3];
    const filename = match[4];
    if (!PRODUCTS.includes(productId)) throw new Error('Unknown Brightdesk product in checksum manifest: ' + productId);
    if (!safeFilename(filename)) throw new Error('Unsafe product installer filename: ' + filename);

    const extension = path.extname(filename).slice(1).toLowerCase();
    if (!allowedFormats.has(extension)) throw new Error('Unexpected product installer format for ' + platform + ': ' + filename);
    if (!relativePath.startsWith('apps/org.brightdesk.' + productId + '/')) {
      throw new Error('Product installer path does not match its product ID: ' + relativePath);
    }
    if (seen.has(relativePath)) throw new Error('Duplicate product installer path: ' + relativePath);
    const pair = productId + '/' + extension;
    if (pairs.has(pair)) throw new Error('Duplicate product installer format: ' + pair);
    seen.add(relativePath);
    pairs.add(pair);
    records.push({ expectedHash, relativePath, productId, filename });
  }

  for (const productId of PRODUCTS) {
    for (const format of allowedFormats) {
      if (!pairs.has(productId + '/' + format)) {
        throw new Error('Product checksum manifest is missing ' + productId + ' .' + format + ' installer.');
      }
    }
  }

  return records;
}

function parseSuiteManifest(manifestPath, expectedFiles) {
  const metadata = lstatRequired(manifestPath, 'Suite checksum manifest');
  if (!metadata.isFile()) throw new Error('Suite checksum manifest must be a regular file.');

  const content = fs.readFileSync(manifestPath, 'utf8');
  const lines = content.split(/\r?\n/).filter(line => line.length > 0);
  if (lines.length !== expectedFiles.length) {
    throw new Error('Suite checksum manifest must contain exactly ' + expectedFiles.length + ' top-level entries; found ' + lines.length + '.');
  }

  const expected = new Set(expectedFiles);
  const seen = new Set();
  const records = [];
  const pattern = /^([a-f0-9]{64})  ([^/\\]+)$/i;

  for (const line of lines) {
    const match = pattern.exec(line);
    if (!match) throw new Error('Invalid Suite checksum entry: ' + line);
    const expectedHash = match[1].toLowerCase();
    const filename = match[2];
    if (!safeFilename(filename)) throw new Error('Unsafe Suite release filename: ' + filename);
    if (!expected.has(filename)) throw new Error('Unexpected file in Suite checksum manifest: ' + filename);
    if (seen.has(filename)) throw new Error('Duplicate Suite checksum entry: ' + filename);
    seen.add(filename);
    records.push({ expectedHash, filename });
  }

  const missing = expectedFiles.filter(filename => !seen.has(filename));
  if (missing.length) {
    throw new Error('Suite checksum manifest is missing required file(s): ' + missing.join(', '));
  }
  return records;
}

function verifySuiteManifest(releaseDirectory, manifestPath, expectedFiles) {
  const records = parseSuiteManifest(manifestPath, expectedFiles);
  for (const record of records) {
    const measured = sha256RegularFile(path.join(releaseDirectory, record.filename), 'Suite release artifact');
    if (measured.sha256 !== record.expectedHash) {
      throw new Error('Suite release artifact SHA-256 changed after verification: ' + record.filename);
    }
  }
}

function collectPlatformReleaseFiles({ platform, releaseDirectory = path.resolve(__dirname, '..', 'release') } = {}) {
  const config = PLATFORMS[platform];
  if (!config) throw new Error('Usage: node scripts/collect-platform-release-files.js <win|mac|linux> [release-directory]');

  requireDirectory(releaseDirectory, 'Release directory');
  const sourceApps = path.join(releaseDirectory, 'apps');
  requireDirectory(sourceApps, 'Product installer directory');

  const checksumName = 'Brightdesk-SHA256SUMS-PRODUCTS-' + platform.toUpperCase() + '.txt';
  const manifestPath = path.join(releaseDirectory, checksumName);
  const records = parseProductManifest(manifestPath, platform);

  for (const productId of PRODUCTS) {
    requireDirectory(path.join(sourceApps, 'org.brightdesk.' + productId), 'Installer directory for ' + productId);
  }

  const topLevelFiles = validateTopLevelReleaseFiles(releaseDirectory, platform);
  const suiteChecksumName = 'Brightdesk-SHA256SUMS-' + platform.toUpperCase() + '.txt';
  const expectedSuiteFiles = topLevelFiles.filter(filename => !filename.startsWith('Brightdesk-SHA256SUMS-'));
  verifySuiteManifest(releaseDirectory, path.join(releaseDirectory, suiteChecksumName), expectedSuiteFiles);

  const verified = records.map(record => {
    const source = path.resolve(releaseDirectory, record.relativePath);
    const relativeFromRoot = path.relative(releaseDirectory, source);
    if (relativeFromRoot.startsWith('..') || path.isAbsolute(relativeFromRoot)) {
      throw new Error('Product installer path escapes the release directory: ' + record.relativePath);
    }
    const measured = sha256RegularFile(source);
    if (measured.sha256 !== record.expectedHash) {
      throw new Error('Product installer SHA-256 changed after verification: ' + record.relativePath);
    }
    return { ...record, source, sizeBytes: measured.sizeBytes, dev: measured.dev, ino: measured.ino };
  });

  const platformDirectory = path.join(releaseDirectory, config.directory);
  if (fs.existsSync(platformDirectory)) {
    requireDirectory(platformDirectory, 'Platform output directory');
    if (fs.readdirSync(platformDirectory).length > 0) {
      throw new Error('Platform output directory is not empty: ' + platformDirectory);
    }
  } else {
    fs.mkdirSync(platformDirectory);
  }

  fs.mkdirSync(path.join(platformDirectory, 'apps'));

  for (const record of verified) {
    const destination = path.join(platformDirectory, record.relativePath);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    if (fs.existsSync(destination)) throw new Error('Platform bundle already contains ' + record.relativePath);

    const current = lstatRequired(record.source, 'Product installer before collection');
    if (!current.isFile() || current.dev !== record.dev || current.ino !== record.ino || current.size !== record.sizeBytes) {
      throw new Error('Product installer changed before collection: ' + record.relativePath);
    }
    fs.renameSync(record.source, destination);
  }

  let topLevelFilesMoved = 0;
  for (const filename of topLevelFiles) {
    const source = path.join(releaseDirectory, filename);
    const destination = path.join(platformDirectory, filename);
    if (fs.existsSync(destination)) throw new Error('Platform bundle already contains ' + filename);
    const metadata = lstatRequired(source, 'Release entry ' + filename);
    if (!metadata.isFile()) throw new Error('Release entry is not a regular file: ' + filename);
    fs.renameSync(source, destination);
    topLevelFilesMoved += 1;
  }

  return {
    platform,
    outputDirectory: platformDirectory,
    productInstallerCount: verified.length,
    topLevelFilesMoved
  };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const platform = args[0];
  const directoryArgument = args[1];
  try {
    const result = collectPlatformReleaseFiles({
      platform,
      releaseDirectory: directoryArgument ? path.resolve(directoryArgument) : undefined
    });
    console.log('Collected ' + result.productInstallerCount + ' verified Brightdesk product installer(s) and ' + result.topLevelFilesMoved + ' approved top-level release file(s) into ' + result.outputDirectory + '.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { collectPlatformReleaseFiles, parseProductManifest, parseSuiteManifest, PLATFORMS, PRODUCTS, validateTopLevelReleaseFiles };
