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
      const asset = assets.find(item => assetMatchesApp(item.name, appId, availableVersion, platform));
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

module.exports = { APP_NAMES, API_URL, compareVersions, assetMatchesApp, checkStandaloneAppUpdates };
