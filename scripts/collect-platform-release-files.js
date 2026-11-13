'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

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
    throw new Error(`${description} is missing or unreadable: ${error.code || error.message}`);
  }
  if (metadata.isSymbolicLink()) throw new Error(`${description} must not be a symbolic link.`);
  return metadata;
}

function requireDirectory(filePath, description) {
  const metadata = lstatRequired(filePath, description);
  if (!metadata.isDirectory()) throw new Error(`${description} must be a directory.`);
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

function sha256RegularFile(filePath) {
  const before = lstatRequired(filePath, 'Product installer');
  if (!before.isFile()) throw new Error(`Product installer is not a regular file: ${filePath}`);

  let descriptor;
  try {
    const flags = fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW || 0);
    descriptor = fs.openSync(filePath, flags);
    const opened = fs.fstatSync(descriptor);
    if (!opened.isFile() || opened.dev !== before.dev || opened.ino !== before.ino || opened.size !== before.size) {
      throw new Error(`Product installer changed while it was being checked: ${filePath}`);
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
      throw new Error(`Product installer path changed during verification: ${filePath}`);
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
    throw new Error(`Product checksum manifest must contain exactly ${expectedCount} entries; found ${lines.length}.`);
  }

  const seen = new Set();
  const pairs = new Set();
  const records = [];
  const pattern = /^([a-f0-9]{64})  (apps\/org\.brightdesk\.([a-z]+)\/([^/\\]+))$/i;
  const allowedFormats = new Set(PLATFORMS[platform].formats);

  for (const line of lines) {
    const match = pattern.exec(line);
    if (!match) throw new Error(`Invalid product checksum entry: ${line}`);
    const [, expectedHash, relativePath, productId, filename] = match;
    if (!PRODUCTS.includes(productId)) throw new Error(`Unknown Brightdesk product in checksum manifest: ${productId}`);
    if (!safeFilename(filename)) throw new Error(`Unsafe product installer filename: ${filename}`);

    const extension = path.extname(filename).slice(1).toLowerCase();
    if (!allowedFormats.has(extension)) throw new Error(`Unexpected product installer format for ${platform}: ${filename}`);
    if (!relativePath.startsWith(`apps/org.brightdesk.${productId}/`)) {
      throw new Error(`Product installer path does not match its product ID: ${relativePath}`);
    }
    if (seen.has(relativePath)) throw new Error(`Duplicate product installer path: ${relativePath}`);
    const pair = `${productId}/${extension}`;
    if (pairs.has(pair)) throw new Error(`Duplicate product installer format: ${pair}`);
    seen.add(relativePath);
    pairs.add(pair);
    records.push({ expectedHash: expectedHash.toLowerCase(), relativePath, productId, filename });
  }

  for (const productId of PRODUCTS) {
    for (const format of allowedFormats) {
      if (!pairs.has(`${productId}/${format}`)) {
        throw new Error(`Product checksum manifest is missing ${productId} .${format} installer.`);
      }
    }
  }

  return records;
}

function collectPlatformReleaseFiles({ platform, releaseDirectory = path.resolve(__dirname, '..', 'release') } = {}) {
  const config = PLATFORMS[platform];
  if (!config) throw new Error('Usage: node scripts/collect-platform-release-files.js <win|mac|linux> [release-directory]');

  requireDirectory(releaseDirectory, 'Release directory');
  const sourceApps = path.join(releaseDirectory, 'apps');
  requireDirectory(sourceApps, 'Product installer directory');

  const checksumName = `Brightdesk-SHA256SUMS-PRODUCTS-${platform.toUpperCase()}.txt`;
  const manifestPath = path.join(releaseDirectory, checksumName);
  const records = parseProductManifest(manifestPath, platform);

  for (const productId of PRODUCTS) {
    requireDirectory(path.join(sourceApps, `org.brightdesk.${productId}`), `Installer directory for ${productId}`);
  }

  const verified = records.map(record => {
    const source = path.resolve(releaseDirectory, record.relativePath);
    const relativeFromRoot = path.relative(releaseDirectory, source);
    if (relativeFromRoot.startsWith('..') || path.isAbsolute(relativeFromRoot)) {
      throw new Error(`Product installer path escapes the release directory: ${record.relativePath}`);
    }
    const measured = sha256RegularFile(source);
    if (measured.sha256 !== record.expectedHash) {
      throw new Error(`Product installer SHA-256 changed after verification: ${record.relativePath}`);
    }
    return { ...record, source, sizeBytes: measured.sizeBytes, dev: measured.dev, ino: measured.ino };
  });

  const platformDirectory = path.join(releaseDirectory, config.directory);
  if (fs.existsSync(platformDirectory)) {
    requireDirectory(platformDirectory, 'Platform output directory');
    if (fs.readdirSync(platformDirectory).length > 0) {
      throw new Error(`Platform output directory is not empty: ${platformDirectory}`);
    }
  } else {
    fs.mkdirSync(platformDirectory);
  }

  const productOutput = path.join(platformDirectory, 'apps');
  fs.mkdirSync(productOutput);

  for (const record of verified) {
    const destination = path.join(platformDirectory, record.relativePath);
    const destinationParent = path.dirname(destination);
    fs.mkdirSync(destinationParent, { recursive: true });
    if (fs.existsSync(destination)) throw new Error(`Platform bundle already contains ${record.relativePath}`);

    const current = lstatRequired(record.source, 'Product installer before collection');
    if (!current.isFile() || current.dev !== record.dev || current.ino !== record.ino || current.size !== record.sizeBytes) {
      throw new Error(`Product installer changed before collection: ${record.relativePath}`);
    }
    fs.renameSync(record.source, destination);
  }

  let topLevelFilesMoved = 0;
  for (const entry of fs.readdirSync(releaseDirectory, { withFileTypes: true })) {
    if (entry.name === config.directory || entry.name === 'apps') continue;
    const source = path.join(releaseDirectory, entry.name);
    const metadata = lstatRequired(source, `Release entry ${entry.name}`);
    if (metadata.isDirectory()) continue;
    if (!metadata.isFile()) throw new Error(`Release entry is not a regular file: ${entry.name}`);
    const destination = path.join(platformDirectory, entry.name);
    if (fs.existsSync(destination)) throw new Error(`Platform bundle already contains ${entry.name}`);
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
  const [platform, directoryArgument] = process.argv.slice(2);
  try {
    const result = collectPlatformReleaseFiles({
      platform,
      releaseDirectory: directoryArgument ? path.resolve(directoryArgument) : undefined
    });
    console.log(`Collected ${result.productInstallerCount} verified Brightdesk product installer(s) and ${result.topLevelFilesMoved} top-level release file(s) into ${result.outputDirectory}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { collectPlatformReleaseFiles, parseProductManifest, PLATFORMS, PRODUCTS };
