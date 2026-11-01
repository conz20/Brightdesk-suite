#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { APP_SLUGS } = require('../src/standalone-downloads');

const PLATFORMS = Object.freeze({
  win: { arch: 'x64', extensions: ['exe'] },
  mac: { arch: 'universal', extensions: ['dmg', 'pkg', 'zip'] },
  linux: { arch: 'x64', extensions: ['AppImage', 'deb'] }
});

function sha256File(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function expectedFilename(appId, platform, version) {
  const slug = APP_SLUGS[appId];
  const target = PLATFORMS[platform];
  if (!slug || !target) throw new Error('An approved app and supported platform are required.');
  const base = platform === 'linux'
    ? `brightdesk-${slug.toLowerCase()}-${version}-${target.arch}`
    : `Brightdesk-${slug}-${version}-${target.arch}`;
  return target.extensions.map(extension => `${base}.${extension}`);
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
    console.log(`Verified ${result.fileCount} standalone installer(s) across all ${result.appCount} approved apps for ${platform}.`);
    for (const item of result.apps) {
      console.log(`- Brightdesk ${item.appName}: ${item.files.length} installer(s); checksum: ${path.relative(directory, item.checksumFile)}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { PLATFORMS, expectedFilename, sha256File, verifyStandaloneApps };
