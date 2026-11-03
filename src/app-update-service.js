'use strict';

const {
  APP_IDS,
  TRUSTED_DOWNLOAD_PREFIX,
  compareVersions,
  validateReleaseManifest,
  selectArtifact,
  resolveReleaseAsset
} = require('./release-manifest');

const API_URL = 'https://api.github.com/repos/connormolloy12/Brightdesk-suite/releases/latest';
const MANIFEST_ASSET_NAME = 'Brightdesk-Release-Manifest.json';

function platformArchitecture(platform, architecture) {
  if (architecture) return architecture;
  return platform === 'darwin' ? 'universal' : 'x64';
}

async function fetchLatestReleaseData(fetchImpl) {
  if (typeof fetchImpl !== 'function') throw new Error('This runtime cannot check for app downloads.');
  const response = await fetchImpl(API_URL, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Brightdesk-Office-Suite' }
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error('No Brightdesk release has been published yet.');
    throw new Error(`GitHub returned HTTP ${response.status} while looking for the Brightdesk release.`);
  }

  const release = await response.json();
  const manifestAsset = (Array.isArray(release.assets) ? release.assets : []).find(asset =>
    asset?.name === MANIFEST_ASSET_NAME &&
    typeof asset.browser_download_url === 'string' &&
    asset.browser_download_url.startsWith(TRUSTED_DOWNLOAD_PREFIX)
  );
  if (!manifestAsset) throw new Error('The latest Brightdesk release is missing its shared app-aware release manifest.');

  const manifestResponse = await fetchImpl(manifestAsset.browser_download_url, {
    headers: { Accept: 'application/json', 'User-Agent': 'Brightdesk-Office-Suite' }
  });
  if (!manifestResponse.ok) throw new Error('Could not download the Brightdesk release manifest.');

  let manifest;
  try {
    manifest = validateReleaseManifest(await manifestResponse.json());
  } catch (error) {
    throw new Error(`The Brightdesk release manifest is invalid: ${error.message}`);
  }
  if (String(release.tag_name || '').replace(/^v/i, '') !== manifest.release.version) {
    throw new Error('The release tag and shared release manifest version do not match.');
  }
  return { release, manifest, assets: Array.isArray(release.assets) ? release.assets : [] };
}

async function getStandaloneAppDownload({
  appId,
  platform,
  architecture,
  fetchImpl = global.fetch
} = {}) {
  if (!APP_IDS.includes(appId)) throw new Error('That app is not in the approved Brightdesk catalogue.');
  if (!['win32', 'darwin', 'linux'].includes(platform)) throw new TypeError('Unsupported platform.');

  const { release, manifest, assets } = await fetchLatestReleaseData(fetchImpl);
  const artifact = selectArtifact({
    manifest,
    appId,
    platform,
    architecture: platformArchitecture(platform, architecture)
  });
  if (!artifact) {
    throw new Error(`No Brightdesk ${manifest.apps[appId].name} installer for ${platform}/${platformArchitecture(platform, architecture)} is published in release ${manifest.release.version}.`);
  }

  const resolved = resolveReleaseAsset({ artifact, assets });
  return {
    appId,
    version: manifest.apps[appId].version,
    ...resolved,
    releaseUrl: release.html_url || ''
  };
}

async function checkStandaloneAppUpdates({
  installedApps,
  platform,
  architecture,
  fetchImpl = global.fetch
} = {}) {
  if (!Array.isArray(installedApps)) throw new TypeError('Installed app records are required.');
  if (!['win32', 'darwin', 'linux'].includes(platform)) throw new TypeError('Unsupported platform.');
  if (typeof fetchImpl !== 'function') throw new Error('This runtime cannot check for app updates.');

  try {
    const { release, manifest, assets } = await fetchLatestReleaseData(fetchImpl);
    const targetArchitecture = platformArchitecture(platform, architecture);
    const apps = installedApps.map(installed => {
      const appId = installed?.id;
      if (!APP_IDS.includes(appId)) return null;
      const app = manifest.apps[appId];
      let resolved = null;
      let errorMessage = '';
      try {
        const artifact = selectArtifact({ manifest, appId, platform, architecture: targetArchitecture });
        if (artifact) resolved = resolveReleaseAsset({ artifact, assets });
      } catch (error) {
        errorMessage = error.message;
      }
      const comparison = compareVersions(app.version, installed.version);
      const updateAvailable = comparison !== null && comparison > 0 && Boolean(resolved);
      return {
        id: appId,
        name: app.name,
        currentVersion: installed.version || 'Unknown',
        availableVersion: app.version,
        architecture: resolved?.architecture || targetArchitecture,
        updateAvailable,
        installerAvailable: Boolean(resolved),
        downloadUrl: resolved?.downloadUrl || '',
        fileName: resolved?.fileName || '',
        expectedSize: resolved?.expectedSize || null,
        sha256: resolved?.sha256 || '',
        packageType: resolved?.packageType || '',
        releaseUrl: release.html_url || '',
        message: errorMessage
      };
    }).filter(Boolean);

    return {
      ok: true,
      releaseVersion: manifest.release.version,
      releaseUrl: release.html_url || '',
      apps
    };
  } catch (error) {
    return { ok: false, message: error.message || 'Could not check standalone app updates.', apps: [] };
  }
}

module.exports = {
  API_URL,
  MANIFEST_ASSET_NAME,
  compareVersions,
  platformArchitecture,
  fetchLatestReleaseData,
  getStandaloneAppDownload,
  checkStandaloneAppUpdates
};
