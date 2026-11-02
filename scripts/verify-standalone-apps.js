#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { APP_SLUGS } = require('../src/standalone-downloads');

const PLATFORMS = Object.freeze({
  win: { arch: 'x64', extensions: ['exe'] },
  mac: { arch: 'universal', extensions: ['dmg', 'pkg', 'zip'] },
  linux: { arch: 'x86_64', debArch: 'amd64', extensions: ['AppImage', 'deb'] }
});

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}


function verifyChecksumManifest({ directory, checksumFile }) {
  const root = path.resolve(directory);
  const manifestPath = path.resolve(checksumFile);
  const relativeManifest = path.relative(root, manifestPath);
  if (!relativeManifest || relativeManifest === '..' || relativeManifest.startsWith(`..${path.sep}`) || path.isAbsolute(relativeManifest)) {
    throw new Error('Checksum manifest must be inside the product output folder.');
  }

  const content = fs.readFileSync(manifestPath, 'utf8');
  const lines = content.split(/\r?\n/);
  if (lines[lines.length - 1] === '') lines.pop();
  if (!lines.length) throw new Error('Checksum manifest is empty.');

  const seen = new Set();
  const files = lines.map(line => {
    const match = /^([a-f0-9]{64})  ([A-Za-z0-9][A-Za-z0-9._-]*)$/.exec(line);
    if (!match) throw new Error(`Invalid SHA-256 manifest row: ${line}`);
    const [, expected, filename] = match;
    if (seen.has(filename)) throw new Error(`Duplicate checksum entry: ${filename}`);
    seen.add(filename);

    const file = path.join(root, filename);
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
      throw new Error(`Checksum target is missing: ${filename}`);
    }
    const actual = sha256File(file);
    if (actual !== expected) {
      throw new Error(`SHA-256 mismatch for ${filename}: expected ${expected}, received ${actual}`);
    }
    return { filename, sha256: actual };
  });

  return { fileCount: files.length, files };
}

function expectedFilename(appId, platform, version) {
  const slug = APP_SLUGS[appId];
  const target = PLATFORMS[platform];
  if (!slug || !target) throw new Error('An approved app and supported platform are required.');
  return target.extensions.map(extension => {
    const arch = platform === 'linux' && extension === 'deb' ? target.debArch : target.arch;
    const base = platform === 'linux'
      ? `brightdesk-${slug.toLowerCase()}-${version}-${arch}`
      : `Brightdesk-${slug}-${version}-${arch}`;
    return `${base}.${extension}`;
  });
}

function verifyStandaloneApps({ directory, platform, version, appId = null }) {
  const target = PLATFORMS[platform];
  if (!target) throw new Error(`Unsupported platform: ${platform}`);
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error('A valid release version is required for standalone app verification.');
  }

  if (appId !== null && !APP_SLUGS[appId]) {
    throw new Error(`Unknown approved Brightdesk app: ${appId}`);
  }
  const selectedApps = appId ? [[appId, APP_SLUGS[appId]]] : Object.entries(APP_SLUGS);
  const appResults = [];
  for (const [appId, slug] of selectedApps) {
    const appDirectory = path.join(directory, appId);
    if (!fs.existsSync(appDirectory) || !fs.statSync(appDirectory).isDirectory()) {
      throw new Error(`Missing standalone output folder for Brightdesk ${slug}: ${appDirectory}`);
    }
    const expected = expectedFilename(appId, platform, version);
    const files = expected.map(filename => path.join(appDirectory, filename));
    const missing = files.filter(file => !fs.existsSync(file));
    if (missing.length) {
      throw new Error(`Missing Brightdesk ${slug} ${platform} installer(s): ${missing.map(file => path.basename(file)).join(', ')}`);
    }
    const rows = files.map(file => {
      const bytes = fs.statSync(file).size;
      if (bytes <= 0) throw new Error(`Standalone installer is empty: ${file}`);
      return {
        file: path.relative(directory, file).split(path.sep).join('/'),
        bytes,
        sha256: sha256File(file)
      };
    });
    const checksumFile = path.join(appDirectory, `Brightdesk-${appId}-SHA256SUMS-${platform.toUpperCase()}.txt`);
    fs.writeFileSync(checksumFile, `${rows.map(row => `${row.sha256}  ${path.basename(row.file)}`).join('\n')}\n`);
    appResults.push({ appId, appName: slug, files: rows, checksumFile });
  }

  return {
    platform,
    version,
    appCount: appResults.length,
    apps: appResults,
    fileCount: appResults.reduce((count, item) => count + item.files.length, 0)
  };
}

if (require.main === module) {
  const platform = process.argv[2];
  const root = path.resolve(__dirname, '..');
  const directory = path.resolve(process.argv[3] || path.join(root, 'release', 'apps'));
  const version = require('../package.json').version;
  const appId = process.argv[4] || null;
  try {
    const result = verifyStandaloneApps({ directory, platform, version, appId });
    console.log(`Verified ${result.fileCount} product installer(s) across all ${result.appCount} approved products for ${platform}.`);
    for (const item of result.apps) {
      console.log(`- Brightdesk ${item.appName}: ${item.files.length} installer(s); SHA-256 manifest: ${path.relative(directory, item.checksumFile)}`);
      for (const file of item.files) console.log(`  ${file.file} (${file.bytes} bytes) SHA-256 ${file.sha256}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { PLATFORMS, expectedFilename, sha256File, verifyChecksumManifest, verifyStandaloneApps };
