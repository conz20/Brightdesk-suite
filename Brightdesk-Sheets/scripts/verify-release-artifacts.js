#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const EXPECTED = {
  win: [/\.exe$/i, /Brightdesk-Windows-TERMS_AND_CONDITIONS\.txt$/i, /Brightdesk-Windows-LICENSE\.txt$/i, /Brightdesk-Windows-THIRD_PARTY_NOTICES\.md$/i],
  mac: [/\.dmg$/i, /\.pkg$/i, /\.zip$/i, /Brightdesk-macOS-TERMS_AND_CONDITIONS\.txt$/i, /Brightdesk-macOS-LICENSE\.txt$/i, /Brightdesk-macOS-THIRD_PARTY_NOTICES\.md$/i],
  linux: [/\.AppImage$/i, /\.deb$/i, /Brightdesk-Install-Linux\.sh$/i, /Brightdesk-Linux-TERMS_AND_CONDITIONS\.txt$/i, /Brightdesk-Linux-LICENSE\.txt$/i, /Brightdesk-Linux-THIRD_PARTY_NOTICES\.md$/i]
};

function collectFiles(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(full) : [full];
  });
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

function verifyArtifacts({ directory, platform }) {
  if (!EXPECTED[platform]) throw new Error(`Unsupported platform: ${platform}`);
  const files = collectFiles(directory).filter(file => EXPECTED[platform].some(pattern => pattern.test(file)));
  const missing = EXPECTED[platform].filter(pattern => !files.some(file => pattern.test(file)));
  if (missing.length) {
    throw new Error(`Missing expected ${platform} release artifact(s): ${missing.map(String).join(', ')}. Found ${files.map(file => path.basename(file)).join(', ') || 'none'}.`);
  }
  const rows = files.sort().map(file => {
    const bytes = fs.statSync(file).size;
    if (bytes <= 0) throw new Error(`Installer artifact is empty: ${file}`);
    return {
      file: path.relative(directory, file).split(path.sep).join('/'),
      bytes,
      sha256: sha256File(file)
    };
  });
  const checksumFile = path.join(directory, `Brightdesk-SHA256SUMS-${platform.toUpperCase()}.txt`);
  fs.writeFileSync(checksumFile, `${rows.map(row => `${row.sha256}  ${row.file}`).join('\n')}\n`);
  return { platform, files: rows, checksumFile };
}

if (require.main === module) {
  const platform = process.argv[2];
  const directory = path.resolve(process.argv[3] || path.join(__dirname, '..', 'release'));
  try {
    const result = verifyArtifacts({ directory, platform });
    console.log(`Verified ${result.files.length} ${platform} installer artifact(s):`);
    for (const file of result.files) console.log(`- ${file.file} (${file.bytes} bytes, SHA-256 ${file.sha256})`);
    console.log(`Checksums written to ${result.checksumFile}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { EXPECTED, sha256File, verifyArtifacts };
