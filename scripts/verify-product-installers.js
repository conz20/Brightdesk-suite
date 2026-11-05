#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PRODUCTS = Object.freeze({
  pages: 'Pages',
  sheets: 'Sheets',
  slides: 'Decks',
  notes: 'Notes',
  database: 'Database',
  forms: 'Forms',
  lists: 'Lists',
  planner: 'Planner',
  todo: 'To-Do',
  loop: 'Workspace'
});

const PLATFORMS = Object.freeze({
  win: { directory: 'Windows', checksum: 'Brightdesk-SHA256SUMS-WIN.txt' },
  mac: { directory: 'macOS', checksum: 'Brightdesk-SHA256SUMS-MAC.txt' },
  linux: { directory: 'Linux', checksum: 'Brightdesk-SHA256SUMS-LINUX.txt' }
});

function validateVersion(version) {
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error('A valid release version is required.');
  }
}

function expectedProductFiles(productId, platform, version) {
  validateVersion(version);
  const slug = PRODUCTS[productId];
  if (!slug) throw new Error(`Unknown approved Brightdesk product: ${productId}`);
  if (!PLATFORMS[platform]) throw new Error(`Unsupported platform: ${platform}`);

  if (platform === 'win') {
    return [`Brightdesk-${slug}-${version}-x64.exe`];
  }
  if (platform === 'mac') {
    return [
      `Brightdesk-${slug}-${version}-universal.dmg`,
      `Brightdesk-${slug}-${version}-universal.pkg`,
      `Brightdesk-${slug}-${version}-universal.zip`
    ];
  }
  return [
    `brightdesk-${slug.toLowerCase()}-${version}-x86_64.AppImage`,
    `brightdesk-${slug.toLowerCase()}-${version}-amd64.deb`
  ];
}

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
  if (typeof filename !== 'string' || filename.includes('/') || filename.includes('\\') || filename === '.' || filename === '..') {
    throw new Error(`Unsafe ${label} filename: ${filename}`);
  }
  const file = path.join(directory, filename);
  let stat;
  try {
    stat = fs.lstatSync(file);
  } catch {
    throw new Error(`Missing ${label}: ${filename}`);
  }
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size <= 0) {
    throw new Error(`${label} must be a non-empty regular file: ${filename}`);
  }
  return file;
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
    if (!match) throw new Error(`Invalid or unsafe checksum manifest row in ${label}: ${line}`);
    const [, expectedHash, filename] = match;
    if (seen.has(filename)) throw new Error(`Duplicate checksum entry in ${label}: ${filename}`);
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
    const file = requireNonEmptyFile(directory, entry.filename, `${label} checksum target`);
    const actual = sha256File(file);
    if (actual !== entry.expectedHash) {
      throw new Error(`SHA-256 mismatch for ${label} artifact ${entry.filename}: expected ${entry.expectedHash}, received ${actual}.`);
    }
  }
  return { fileCount: entries.length, files: entries.map(entry => entry.filename) };
}

function verifyProductInstallers({ directory = path.resolve(__dirname, '..', 'release', 'apps'), platform, version = require('../package.json').version, productId = null } = {}) {
  validateVersion(version);
  if (!PLATFORMS[platform]) throw new Error(`Unsupported platform: ${platform}`);
  if (productId !== null && !PRODUCTS[productId]) throw new Error(`Unknown approved Brightdesk product: ${productId}`);

  const selected = productId ? [[productId, PRODUCTS[productId]]] : Object.entries(PRODUCTS);
  const results = [];
  for (const [id, name] of selected) {
    const appDirectory = path.join(directory, id);
    let stat;
    try { stat = fs.lstatSync(appDirectory); } catch { throw new Error(`Missing product output folder for Brightdesk ${name}: ${appDirectory}`); }
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Product output must be a real directory: ${appDirectory}`);

    const files = expectedProductFiles(id, platform, version);
    const rows = files.map(filename => {
      const file = requireNonEmptyFile(appDirectory, filename, `Brightdesk ${name} installer`);
      return { filename, bytes: fs.statSync(file).size, sha256: sha256File(file) };
    });
    const checksumFile = path.join(appDirectory, `Brightdesk-${id}-SHA256SUMS-${platform.toUpperCase()}.txt`);
    fs.writeFileSync(checksumFile, `${rows.map(row => `${row.sha256}  ${row.filename}`).join('\n')}\n`);
    const checksumVerification = verifyChecksumManifest({
      directory: appDirectory,
      manifestName: path.basename(checksumFile),
      expectedFiles: files,
      label: `Brightdesk ${name} ${platform}`
    });
    results.push({ productId: id, productName: name, files: rows, checksumFile, checksumVerification });
  }

  return {
    platform,
    version,
    productCount: results.length,
    fileCount: results.reduce((sum, result) => sum + result.files.length, 0),
    products: results
  };
}

if (require.main === module) {
  const platform = process.argv[2];
  const directory = path.resolve(process.argv[3] || path.join(__dirname, '..', 'release', 'apps'));
  const productId = process.argv[4] || null;
  try {
    const result = verifyProductInstallers({ directory, platform, productId });
    console.log(`Verified ${result.fileCount} Brightdesk product installer/archive files across ${result.productCount} product(s) for ${platform}.`);
    for (const item of result.products) {
      console.log(`- Brightdesk ${item.productName}: ${item.files.length} installer/archive file(s), SHA-256 manifest verified.`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  PRODUCTS,
  PLATFORMS,
  expectedProductFiles,
  sha256File,
  requireNonEmptyFile,
  verifyChecksumManifest,
  verifyProductInstallers
};
