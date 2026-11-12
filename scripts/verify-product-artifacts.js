#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const packageConfig = require('../package.json');

const PRODUCT_IDS = Object.freeze([
  'pages', 'sheets', 'slides', 'notes', 'database',
  'forms', 'lists', 'planner', 'todo', 'loop'
]);

const PRODUCT_SLUGS = Object.freeze({
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

const PRODUCT_ARTIFACTS = Object.freeze({
  win: Object.freeze(['exe']),
  mac: Object.freeze(['dmg', 'pkg', 'zip']),
  linux: Object.freeze(['AppImage', 'deb'])
});

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

function expectedPrefix(applicationId, platform) {
  const slug = PRODUCT_SLUGS[applicationId];
  return platform === 'linux'
    ? `brightdesk-${slug.toLowerCase()}`
    : `Brightdesk-${slug}`;
}

function verifyProductArtifacts({ directory = path.join(__dirname, '..', 'release'), platform, version = packageConfig.version }) {
  if (!PRODUCT_ARTIFACTS[platform]) throw new Error(`Unsupported platform: ${platform}`);
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error('A valid Brightdesk product release version is required.');
  }

  const root = path.resolve(directory);
  const rows = [];
  const missing = [];

  for (const applicationId of PRODUCT_IDS) {
    const productDirectory = path.join(root, 'apps', `org.brightdesk.${applicationId}`);
    const files = collectFiles(productDirectory);

    for (const extension of PRODUCT_ARTIFACTS[platform]) {
      const prefix = `${expectedPrefix(applicationId, platform)}-${version}-`.toLowerCase();
      const suffix = `.${extension}`.toLowerCase();
      const matches = files.filter(file => {
        const name = path.basename(file).toLowerCase();
        return name.startsWith(prefix) && name.endsWith(suffix);
      });

      if (matches.length === 0) {
        missing.push(`${applicationId}: missing .${extension}`);
        continue;
      }
      if (matches.length > 1) {
        missing.push(`${applicationId}: expected one .${extension}, found ${matches.length}`);
        continue;
      }

      const file = matches[0];
      const bytes = fs.statSync(file).size;
      if (bytes <= 0) throw new Error(`Empty product artifact for ${applicationId}: ${path.basename(file)}`);
      rows.push({
        applicationId,
        file: path.relative(root, file).split(path.sep).join('/'),
        bytes,
        sha256: sha256File(file)
      });
    }
  }

  if (missing.length) {
    throw new Error(`Brightdesk ${platform} product installer verification failed:\n- ${missing.join('\n- ')}`);
  }

  const checksumFile = path.join(root, `Brightdesk-SHA256SUMS-PRODUCTS-${platform.toUpperCase()}.txt`);
  fs.writeFileSync(checksumFile, `${rows.map(row => `${row.sha256}  ${row.file}`).join('\n')}\n`);

  return {
    platform,
    productCount: PRODUCT_IDS.length,
    files: rows,
    checksumFile
  };
}

if (require.main === module) {
  const platform = process.argv[2];
  const directory = path.resolve(process.argv[3] || path.join(__dirname, '..', 'release'));
  try {
    const result = verifyProductArtifacts({ directory, platform });
    console.log(`Verified all ${result.productCount} Brightdesk ${platform} product installers:`);
    for (const file of result.files) console.log(`- ${file.applicationId}: ${file.file} (${file.bytes} bytes)`);
    console.log(`Product checksums written to ${result.checksumFile}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  PRODUCT_IDS,
  PRODUCT_ARTIFACTS,
  PRODUCT_SLUGS,
  verifyProductArtifacts
};
