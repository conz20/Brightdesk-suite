#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const packageConfig = require('../package.json');
const catalog = require('../src/app-catalog');
const { validateReleaseManifest } = require('../src/release-manifest');

const platformDefinitions = [
  { key: 'win32', directory: 'Windows', checksum: 'Brightdesk-SHA256SUMS-WIN.txt', extensions: new Set(['.exe']) },
  { key: 'darwin', directory: 'macOS', checksum: 'Brightdesk-SHA256SUMS-MAC.txt', extensions: new Set(['.pkg', '.dmg', '.zip']) },
  { key: 'linux', directory: 'Linux', checksum: 'Brightdesk-SHA256SUMS-LINUX.txt', extensions: new Set(['.deb', '.appimage']) }
];
const appIds = catalog.map(item => item.id);

function readChecksums(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`Missing platform checksum file: ${filePath}`);
  const entries = new Map();
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([a-f0-9]{64})\s+(.+)$/i);
    if (match) entries.set(match[2].trim(), match[1].toLowerCase());
  }
  return entries;
}

function packageType(fileName) {
  const extension = path.extname(fileName).toLowerCase();
  return {
    '.exe': 'nsis',
    '.pkg': 'pkg',
    '.dmg': 'dmg',
    '.zip': 'zip',
    '.deb': 'deb',
    '.appimage': 'appimage'
  }[extension] || null;
}

function packageArchitecture(fileName) {
  const match = fileName.match(/-(x64|arm64|universal)\.[^.]+$/i);
  return match ? match[1].toLowerCase() : null;
}

function artifactRecord(filePath, expectedChecksum, context) {
  const stat = fs.statSync(filePath);
  if (!stat.isFile() || stat.size <= 0) throw new Error(`Invalid or empty release file for ${context}: ${filePath}`);
  if (!expectedChecksum) throw new Error(`Missing SHA-256 entry for ${context}: ${path.basename(filePath)}`);
  const fileName = path.basename(filePath);
  const architecture = packageArchitecture(fileName);
  const type = packageType(fileName);
  if (!architecture || !type) throw new Error(`Could not resolve package type or architecture for ${fileName}`);
  return {
    fileName,
    packageType: type,
    architecture,
    size: stat.size,
    sha256: expectedChecksum
  };
}

function addPlatformArtifacts(target, artifacts) {
  for (const artifact of artifacts) {
    if (!target[artifact.architecture]) target[artifact.architecture] = [];
    target[artifact.architecture].push(artifact);
  }
}

function generateReleaseManifest(releaseDirectory) {
  const suiteVersion = packageConfig.version;
  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    release: { tag: `v${suiteVersion}`, version: suiteVersion },
    suite: { version: suiteVersion, platforms: {} },
    apps: Object.fromEntries(catalog.map(item => [item.id, {
      id: item.id,
      name: item.name,
      version: item.moduleVersion,
      platforms: {}
    }]))
  };

  for (const definition of platformDefinitions) {
    const platformDirectory = path.join(releaseDirectory, definition.directory);
    const checksums = readChecksums(path.join(platformDirectory, definition.checksum));
    const suiteFiles = fs.readdirSync(platformDirectory, { withFileTypes: true })
      .filter(entry => entry.isFile() && definition.extensions.has(path.extname(entry.name).toLowerCase()))
      .map(entry => path.join(platformDirectory, entry.name));
    const suiteArtifacts = suiteFiles
      .filter(filePath => path.basename(filePath).includes(`-${suiteVersion}-`))
      .map(filePath => artifactRecord(filePath, checksums.get(path.basename(filePath)), `suite/${definition.key}`));
    if (!suiteArtifacts.length) throw new Error(`No Suite installer artifacts found for ${definition.key} ${suiteVersion}.`);
    addPlatformArtifacts((manifest.suite.platforms[definition.key] ||= {}), suiteArtifacts);

    for (const app of catalog) {
      const appDirectory = path.join(platformDirectory, 'Apps', app.id);
      if (!fs.existsSync(appDirectory)) throw new Error(`Missing standalone package directory for ${app.name} on ${definition.key}.`);
      const files = fs.readdirSync(appDirectory, { withFileTypes: true })
        .filter(entry => entry.isFile() && definition.extensions.has(path.extname(entry.name).toLowerCase()))
        .map(entry => path.join(appDirectory, entry.name))
        .filter(filePath => path.basename(filePath).includes(`-${app.moduleVersion}-`));
      if (!files.length) throw new Error(`No standalone installer artifacts found for ${app.name} ${app.moduleVersion} on ${definition.key}.`);
      const artifacts = files.map(filePath => {
        const fileName = path.basename(filePath);
        return artifactRecord(filePath, checksums.get(`apps/${app.id}/${fileName}`), `${app.id}/${definition.key}`);
      });
      addPlatformArtifacts((manifest.apps[app.id].platforms[definition.key] ||= {}), artifacts);
    }
  }

  validateReleaseManifest(manifest);
  const outputPath = path.join(releaseDirectory, 'Brightdesk-Release-Manifest.json');
  fs.writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'w', mode: 0o644 });
  return { outputPath, manifest };
}

if (require.main === module) {
  const releaseDirectory = path.resolve(process.argv[2] || path.join(__dirname, '..', 'release'));
  try {
    const result = generateReleaseManifest(releaseDirectory);
    console.log(`Generated ${result.outputPath}`);
    console.log(`Verified release metadata for the Suite and ${Object.keys(result.manifest.apps).length} approved apps.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { generateReleaseManifest, readChecksums, packageType, packageArchitecture };
