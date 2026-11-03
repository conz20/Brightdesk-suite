'use strict';

const APP_NAMES = Object.freeze({
  pages: 'Pages', sheets: 'Sheets', slides: 'Decks', notes: 'Notes',
  database: 'Database', forms: 'Forms', lists: 'Lists', planner: 'Planner',
  todo: 'To Do', loop: 'Workspace'
});
const API_URL = 'https://api.github.com/repos/connormolloy12/Brightdesk-suite/releases/latest';
const TRUSTED_DOWNLOAD_PREFIX = 'https://github.com/connormolloy12/Brightdesk-suite/releases/download/';

function compareVersions(left, right) {
  const parse = value => {
    const match = String(value || '').replace(/^v/i, '').match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/);
    if (!match) return null;
    return { parts: match.slice(1, 4).map(Number), prerelease: match[4] || '' };
  };
  const a = parse(left), b = parse(right);
  if (!a || !b) return null;
  for (let index = 0; index < 3; index += 1) {
    if (a.parts[index] !== b.parts[index]) return a.parts[index] > b.parts[index] ? 1 : -1;
  }
  if (a.prerelease === b.prerelease) return 0;
  if (!a.prerelease) return 1;
  if (!b.prerelease) return -1;
  return a.prerelease.localeCompare(b.prerelease, undefined, { numeric: true });
}

function assetMatchesApp(assetName, appId, version, platform) {
  const prefix = platform === 'linux'
    ? `brightdesk-${appId}-${version}-`
    : `Brightdesk-${APP_NAMES[appId]}-${version}-`;
  if (!String(assetName || '').startsWith(prefix)) return false;
  if (platform === 'win32') return /\.exe$/i.test(assetName);
  if (platform === 'darwin') return /\.(?:dmg|pkg|zip)$/i.test(assetName);
  if (platform === 'linux') return /\.(?:AppImage|deb)$/i.test(assetName);
  return false;
}

function platformAssetExtension(platform) {
  if (platform === 'win32') return ['.exe'];
  if (platform === 'darwin') return ['.pkg', '.dmg', '.zip'];
  if (platform === 'linux') return ['.deb', '.AppImage'];
  return [];
}

function findStandaloneAppInstaller(assets, appId, version, platform) {
  const allowed = platformAssetExtension(platform);
  if (!allowed.length) return null;
  for (const extension of allowed) {
    const found = (Array.isArray(assets) ? assets : []).find(asset =>
      assetMatchesApp(asset.name, appId, version, platform) &&
      String(asset.name).toLowerCase().endsWith(extension.toLowerCase()) &&
      typeof asset.browser_download_url === 'string' &&
      asset.browser_download_url.startsWith(TRUSTED_DOWNLOAD_PREFIX)
    );
    if (found) return found;
  }
  return null;
}

async function getStandaloneAppDownload({ appId, platform, fetchImpl = global.fetch } = {}) {
  if (!Object.hasOwn(APP_NAMES, appId)) throw new Error('That app is not in the approved Brightdesk catalogue.');
  if (!['win32', 'darwin', 'linux'].includes(platform)) throw new TypeError('Unsupported platform.');
  if (typeof fetchImpl !== 'function') throw new Error('This runtime cannot check for app downloads.');
  const response = await fetchImpl(API_URL, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Brightdesk-Office-Suite' }
  });
  if (!response.ok) {
    if (response.status === 404) throw new Error('No Brightdesk release has been published yet.');
    throw new Error(`GitHub returned HTTP ${response.status} while looking for the app installer.`);
  }
  const release = await response.json();
  const version = String(release.tag_name || '').replace(/^v/i, '');
  if (compareVersions(version, version) === null) throw new Error('The latest Brightdesk release does not contain a valid version tag.');
  const assets = Array.isArray(release.assets) ? release.assets : [];
  const asset = findStandaloneAppInstaller(assets, appId, version, platform);
  if (!asset) throw new Error(`No Brightdesk ${APP_NAMES[appId]} installer for ${platform} is published in release ${version}.`);

  const platformLabels = { win32: 'WIN', darwin: 'MAC', linux: 'LINUX' };
  const manifestName = `Brightdesk-SHA256SUMS-${platformLabels[platform]}.txt`;
  const manifestAsset = assets.find(item => item.name === manifestName &&
    typeof item.browser_download_url === 'string' &&
    item.browser_download_url.startsWith(TRUSTED_DOWNLOAD_PREFIX));
  if (!manifestAsset) throw new Error(`The ${platform} release is missing its SHA-256 verification manifest.`);

  const manifestResponse = await fetchImpl(manifestAsset.browser_download_url, {
    headers: { Accept: 'text/plain', 'User-Agent': 'Brightdesk-Office-Suite' }
  });
  if (!manifestResponse.ok) throw new Error('Could not download the Brightdesk installer verification manifest.');
  const manifestText = await manifestResponse.text();
  const expectedPath = `apps/${appId}/${asset.name}`;
  const checksumLine = manifestText.split(/\\r?\\n/).find(line => line.trim().endsWith(`  ${expectedPath}`));
  const checksumMatch = checksumLine && checksumLine.match(/^([a-f0-9]{64})\\s+/i);
  if (!checksumMatch) throw new Error(`The release manifest does not contain a valid checksum for ${asset.name}.`);

  return {
    appId,
    version,
    fileName: asset.name,
    downloadUrl: asset.browser_download_url,
    expectedSize: Number.isFinite(asset.size) ? asset.size : null,
    sha256: checksumMatch[1].toLowerCase(),
    releaseUrl: release.html_url || ''
  };
}

async function checkStandaloneAppUpdates({ installedApps, platform, fetchImpl = global.fetch } = {}) {
  if (!Array.isArray(installedApps)) throw new TypeError('Installed app records are required.');
  if (!['win32', 'darwin', 'linux'].includes(platform)) throw new TypeError('Unsupported platform.');
  if (typeof fetchImpl !== 'function') throw new Error('This runtime cannot check for app updates.');

  try {
    const response = await fetchImpl(API_URL, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Brightdesk-Office-Suite' }
    });
    if (!response.ok) {
      if (response.status === 404) {
        return { ok: false, message: 'No Brightdesk release has been published yet.', apps: [] };
      }
      throw new Error(`GitHub returned HTTP ${response.status} while checking app updates.`);
    }

    const release = await response.json();
    const availableVersion = String(release.tag_name || '').replace(/^v/i, '');
    if (compareVersions(availableVersion, availableVersion) === null) {
      throw new Error('The latest Brightdesk release does not contain a valid version tag.');
    }
    const assets = Array.isArray(release.assets) ? release.assets : [];
    const apps = installedApps.map(installed => {
      const appId = installed.id;
      if (!Object.hasOwn(APP_NAMES, appId)) return null;
      const asset = findStandaloneAppInstaller(assets, appId, availableVersion, platform);
      const comparison = compareVersions(availableVersion, installed.version);
      const updateAvailable = comparison !== null && comparison > 0 && Boolean(asset);
      const downloadUrl = asset?.browser_download_url || '';
      const trustedUrl = downloadUrl.startsWith(TRUSTED_DOWNLOAD_PREFIX) ? downloadUrl : '';
      return {
        id: appId,
        name: `Brightdesk ${APP_NAMES[appId]}`,
        currentVersion: installed.version,
        availableVersion,
        updateAvailable: updateAvailable && Boolean(trustedUrl),
        installerAvailable: Boolean(trustedUrl),
        downloadUrl: trustedUrl,
        releaseUrl: release.html_url || ''
      };
    }).filter(Boolean);

    return { ok: true, releaseVersion: availableVersion, releaseUrl: release.html_url || '', apps };
  } catch (error) {
    return { ok: false, message: error.message || 'Could not check standalone app updates.', apps: [] };
  }
}

module.exports = { APP_NAMES, API_URL, compareVersions, assetMatchesApp, findStandaloneAppInstaller, getStandaloneAppDownload, checkStandaloneAppUpdates };
