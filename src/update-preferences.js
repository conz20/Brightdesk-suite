'use strict';

const UPDATE_PREFERENCES_SCHEMA_VERSION = 2;

const DEFAULT_UPDATE_PREFERENCES = Object.freeze({
  schemaVersion: UPDATE_PREFERENCES_SCHEMA_VERSION,
  autoCheck: true,
  autoDownload: false,
  autoInstall: false
});

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function normalizeUpdatePreferences(value) {
  const saved = isRecord(value) ? value : {};
  const autoCheck = saved.autoCheck !== false;

  // Older preferences could contain autoDownload:true simply because another
  // checkbox was saved. Require a fresh opt-in under the versioned policy.
  if (saved.schemaVersion !== UPDATE_PREFERENCES_SCHEMA_VERSION) {
    return { ...DEFAULT_UPDATE_PREFERENCES, autoCheck };
  }

  return {
    schemaVersion: UPDATE_PREFERENCES_SCHEMA_VERSION,
    autoCheck,
    autoDownload: saved.autoDownload === true,
    autoInstall: saved.autoInstall === true
  };
}

function mergeUpdatePreferences(value) {
  const patch = isRecord(value) ? value : {};
  return normalizeUpdatePreferences({
    ...DEFAULT_UPDATE_PREFERENCES,
    ...patch,
    schemaVersion: UPDATE_PREFERENCES_SCHEMA_VERSION
  });
}

module.exports = {
  UPDATE_PREFERENCES_SCHEMA_VERSION,
  DEFAULT_UPDATE_PREFERENCES,
  normalizeUpdatePreferences,
  mergeUpdatePreferences
};
