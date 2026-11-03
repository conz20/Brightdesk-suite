'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const DEFAULT_UPDATE_SETTINGS = Object.freeze({
  autoCheck: false,
  autoDownload: false,
  autoInstall: false
});
const SETTINGS_FILE = 'update-settings.json';

function sharedSettingsPath(appDataPath) {
  if (typeof appDataPath !== 'string' || !appDataPath.trim()) {
    throw new TypeError('A valid application-data directory is required.');
  }
  return path.join(appDataPath, 'Brightdesk', SETTINGS_FILE);
}

function normalizeSettings(value) {
  const settings = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    autoCheck: settings.autoCheck === true,
    autoDownload: settings.autoDownload === true,
    autoInstall: false
  };
}

async function readJson(filePath) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw new Error(`Could not read Brightdesk update preferences: ${error.message}`);
  }
}

async function writeSharedUpdateSettings({ appDataPath, settings } = {}) {
  const filePath = sharedSettingsPath(appDataPath);
  const normalized = normalizeSettings(settings);
  const directory = path.dirname(filePath);
  await fs.mkdir(directory, { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryPath, `${JSON.stringify(normalized, null, 2)}\n`, {
      flag: 'wx',
      mode: 0o600
    });
    await fs.rename(temporaryPath, filePath);
  } catch (error) {
    await fs.rm(temporaryPath, { force: true }).catch(() => {});
    throw new Error(`Could not save Brightdesk update preferences: ${error.message}`);
  }
  return normalized;
}

async function readSharedUpdateSettings({ appDataPath, legacyUserDataPath } = {}) {
  const filePath = sharedSettingsPath(appDataPath);
  try {
    const shared = await readJson(filePath);
    if (shared !== null) return normalizeSettings(shared);
  } catch (error) {
    // A damaged shared file must not silently enable automatic checks/downloads.
    console.warn(error.message);
    return { ...DEFAULT_UPDATE_SETTINGS };
  }

  if (typeof legacyUserDataPath === 'string' && legacyUserDataPath.trim()) {
    const legacyPath = path.join(legacyUserDataPath, SETTINGS_FILE);
    try {
      const legacy = await readJson(legacyPath);
      if (legacy !== null) {
        const normalized = normalizeSettings(legacy);
        try {
          await writeSharedUpdateSettings({ appDataPath, settings: normalized });
        } catch (error) {
          console.warn('Could not migrate legacy Brightdesk update preferences.', error);
        }
        return normalized;
      }
    } catch (error) {
      console.warn(error.message);
    }
  }
  return { ...DEFAULT_UPDATE_SETTINGS };
}

module.exports = {
  DEFAULT_UPDATE_SETTINGS,
  SETTINGS_FILE,
  sharedSettingsPath,
  normalizeSettings,
  readSharedUpdateSettings,
  writeSharedUpdateSettings
};
