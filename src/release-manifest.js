'use strict';

const APP_IDS = Object.freeze([
  'pages', 'sheets', 'slides', 'notes', 'database',
  'forms', 'lists', 'planner', 'todo', 'loop'
]);
const PLATFORM_KEYS = Object.freeze(['win32', 'darwin', 'linux']);
const TRUSTED_DOWNLOAD_PREFIX = 'https://github.com/connormolloy12/Brightdesk-suite/releases/download/';
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const HASH_PATTERN = /^[a-f0-9]{64}$/i;

function compareVersions(left, right) {
  const parse = value => {
    const match = String(value || '').replace(/^v/i, '').match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
    if (!match) return null;
    return { parts: match.slice(1, 4).map(Number), prerelease: match[4] || '' };
  };
  const a = parse(left);
  const b = parse(right);
  if (!a || !b) return null;
  for (let index = 0; index < 3; index += 1) {
    if (a.parts[index] !== b.parts[index]) return a.parts[index] > b.parts[index] ? 1 : -1;
  }
  if (a.prerelease === b.prerelease) return 0;
  if (!a.prerelease) return 1;
  if (!b.prerelease) return -1;
  return a.prerelease.localeCompare(b.prerelease, undefined, { numeric: true });
}

function validateArtifact(artifact, context) {
  if (!artifact || typeof artifact !== 'object') throw new Error(`Invalid release artifact for ${context}.`);
  if (typeof artifact.fileName !== 'string' || artifact.fileName !== artifact.fileName.split(/[\\/]/).pop() ||
      !artifact.fileName.startsWith('Brightdesk-') && !artifact.fileName.startsWith('brightdesk-')) {
    throw new Error(`Invalid release filename for ${context}.`);
  }
  if (!Number.isSafeInteger(artifact.size) || artifact.size <= 0) throw new Error(`Invalid release size for ${context}.`);
  if (typeof artifact.sha256 !== 'string' || !HASH_PATTERN.test(artifact.sha256)) throw new Error(`Invalid release SHA-256 for ${context}.`);
  if (typeof artifact.packageType !== 'string' || !['nsis', 'pkg', 'dmg', 'zip', 'deb', 'appimage'].includes(artifact.packageType)) {
    throw new Error(`Unsupported release package type for ${context}.`);
  }
  if (typeof artifact.architecture !== 'string' || !['x64', 'arm64', 'universal'].includes(artifact.architecture)) {
    throw new Error(`Unsupported release architecture for ${context}.`);
  }
  return artifact;
}

function validateReleaseManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || manifest.schemaVersion !== 1) {
    throw new Error('The Brightdesk release manifest has an unsupported schema version.');
  }
  if (!manifest.release || typeof manifest.release.tag !== 'string' ||
      !/^v?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(manifest.release.tag) ||
      typeof manifest.release.version !== 'string' ||
      compareVersions(manifest.release.version, manifest.release.version) === null) {
    throw new Error('The Brightdesk release manifest has invalid release metadata.');
  }
  if (!manifest.suite || typeof manifest.suite.version !== 'string' ||
      compareVersions(manifest.suite.version, manifest.suite.version) === null ||
      !manifest.suite.platforms || typeof manifest.suite.platforms !== 'object') {
    throw new Error('The Brightdesk release manifest is missing Suite version or platform packages.');
  }
  if (!manifest.apps || typeof manifest.apps !== 'object') throw new Error('The Brightdesk release manifest is missing app packages.');
  const keys = Object.keys(manifest.apps).sort();
  if (keys.length !== APP_IDS.length || APP_IDS.some(id => !Object.hasOwn(manifest.apps, id))) {
    throw new Error('The Brightdesk release manifest must contain exactly the ten approved apps.');
  }

  for (const appId of APP_IDS) {
    const app = manifest.apps[appId];
    if (!app || app.id !== appId || typeof app.name !== 'string' ||
        typeof app.version !== 'string' || compareVersions(app.version, app.version) === null ||
        !app.platforms || typeof app.platforms !== 'object') {
      throw new Error(`The release manifest has invalid metadata for ${appId}.`);
    }
    for (const platform of Object.keys(app.platforms)) {
      if (!PLATFORM_KEYS.includes(platform)) throw new Error(`Unsupported platform ${platform} in ${appId} release metadata.`);
      const architectures = app.platforms[platform];
      if (!architectures || typeof architectures !== 'object') throw new Error(`Invalid architecture map for ${appId}.`);
      for (const [architecture, artifacts] of Object.entries(architectures)) {
        if (!['x64', 'arm64', 'universal'].includes(architecture) || !Array.isArray(artifacts) || artifacts.length === 0) {
          throw new Error(`Invalid package list for ${appId} on ${platform}.`);
        }
        artifacts.forEach(item => validateArtifact(item, `${appId}/${platform}/${architecture}`));
      }
    }
  }
  for (const platform of Object.keys(manifest.suite.platforms)) {
    if (!PLATFORM_KEYS.includes(platform)) throw new Error(`Unsupported Suite platform ${platform}.`);
    const architectures = manifest.suite.platforms[platform];
    for (const [architecture, artifacts] of Object.entries(architectures || {})) {
      if (!['x64', 'arm64', 'universal'].includes(architecture) || !Array.isArray(artifacts) || artifacts.length === 0) {
        throw new Error(`Invalid Suite package list for ${platform}/${architecture}.`);
      }
      artifacts.forEach(item => validateArtifact(item, `suite/${platform}/${architecture}`));
    }
  }
  return manifest;
}

function preferredPackageTypes(platform) {
  return {
    win32: ['nsis'],
    darwin: ['pkg', 'dmg', 'zip'],
    linux: ['deb', 'appimage']
  }[platform] || [];
}

function selectArtifact({ manifest, appId, platform, architecture }) {
  validateReleaseManifest(manifest);
  if (!APP_IDS.includes(appId)) throw new Error('That app is not in the approved Brightdesk catalogue.');
  if (!PLATFORM_KEYS.includes(platform)) throw new TypeError('Unsupported platform.');
  const app = manifest.apps[appId];
  const platformPackages = app.platforms[platform];
  if (!platformPackages) return null;
  const candidates = [
    ...(platformPackages[architecture] || []),
    ...(architecture === 'universal' ? [] : (platformPackages.universal || []))
  ];
  const preferred = preferredPackageTypes(platform);
  candidates.sort((left, right) => preferred.indexOf(left.packageType) - preferred.indexOf(right.packageType));
  return candidates.find(item => preferred.includes(item.packageType)) || null;
}

function resolveReleaseAsset({ artifact, assets }) {
  validateArtifact(artifact, 'download');
  const asset = (Array.isArray(assets) ? assets : []).find(item => item?.name === artifact.fileName);
  if (!asset || typeof asset.browser_download_url !== 'string' ||
      !asset.browser_download_url.startsWith(TRUSTED_DOWNLOAD_PREFIX)) {
    throw new Error(`The release is missing a trusted download for ${artifact.fileName}.`);
  }
  if (asset.size !== artifact.size) throw new Error(`The published size does not match the release manifest for ${artifact.fileName}.`);
  return {
    fileName: artifact.fileName,
    downloadUrl: asset.browser_download_url,
    expectedSize: artifact.size,
    sha256: artifact.sha256.toLowerCase(),
    packageType: artifact.packageType,
    architecture: artifact.architecture
  };
}

module.exports = {
  APP_IDS,
  PLATFORM_KEYS,
  TRUSTED_DOWNLOAD_PREFIX,
  compareVersions,
  validateReleaseManifest,
  validateArtifact,
  selectArtifact,
  resolveReleaseAsset
};
