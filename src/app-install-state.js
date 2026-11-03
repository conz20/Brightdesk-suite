'use strict';

const INSTALLATION_SCHEMA_VERSION = 2;

function normalizeInstallationState(stored, validAppIds, launchAppId = null) {
  const valid = new Set(validAppIds);
  if (launchAppId) {
    return {
      schemaVersion: INSTALLATION_SCHEMA_VERSION,
      installedApps: valid.has(launchAppId) ? [launchAppId] : [],
      setupComplete: valid.has(launchAppId)
    };
  }

  // Older releases recorded bundled apps as installed. Do not carry those
  // misleading flags into the separately-installed app model.
  if (!stored || stored.schemaVersion !== INSTALLATION_SCHEMA_VERSION || !Array.isArray(stored.installedApps)) {
    return { schemaVersion: INSTALLATION_SCHEMA_VERSION, installedApps: [], setupComplete: false };
  }

  const installedApps = [...new Set(stored.installedApps.filter(id => valid.has(id)))];
  return {
    schemaVersion: INSTALLATION_SCHEMA_VERSION,
    installedApps,
    setupComplete: stored.setupComplete === true
  };
}

function isAppInstalled(id, installedApps, launchAppId = null) {
  return launchAppId === id || installedApps.includes(id);
}

function serializeInstallationState(installedApps, setupComplete) {
  return {
    schemaVersion: INSTALLATION_SCHEMA_VERSION,
    installedApps: [...new Set(installedApps)],
    setupComplete: setupComplete === true
  };
}

const installationStateApi = { INSTALLATION_SCHEMA_VERSION, normalizeInstallationState, isAppInstalled, serializeInstallationState };
if (typeof window !== 'undefined') window.BrightdeskInstallState = installationStateApi;
if (typeof module !== 'undefined' && module.exports) module.exports = installationStateApi;
