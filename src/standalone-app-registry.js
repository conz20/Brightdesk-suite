'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { discoverStandaloneApps } = require('./standalone-app-discovery');

const APPROVED_APP_IDS = Object.freeze([
  'pages', 'sheets', 'slides', 'notes', 'database',
  'forms', 'lists', 'planner', 'todo', 'loop'
]);
const VERSION_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

function registryPath(appDataPath) {
  if (typeof appDataPath !== 'string' || !appDataPath.trim()) {
    throw new TypeError('A valid application-data directory is required.');
  }
  return path.join(appDataPath, 'Brightdesk', 'installed-apps.json');
}

async function readRegistry(filePath) {
  try {
    const parsed = JSON.parse(await fs.readFile(filePath, 'utf8'));
    if (!parsed || parsed.schemaVersion !== 1 || !parsed.apps || typeof parsed.apps !== 'object' || Array.isArray(parsed.apps)) {
      return { schemaVersion: 1, apps: {} };
    }
    return parsed;
  } catch (error) {
    if (error.code === 'ENOENT') return { schemaVersion: 1, apps: {} };
    throw new Error(`Could not read Brightdesk app registry: ${error.message}`);
  }
}

async function writeRegistry(filePath, registry) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.${process.pid}.${crypto.randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporaryPath, `${JSON.stringify(registry, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
    await fs.rename(temporaryPath, filePath);
  } catch (error) {
    await fs.rm(temporaryPath, { force: true }).catch(() => {});
    throw new Error(`Could not update Brightdesk app registry: ${error.message}`);
  }
}

function validVersion(value) {
  return value === 'unknown' || (typeof value === 'string' && VERSION_RE.test(value));
}

async function registerStandaloneApp({ appDataPath, appId, version, executablePath, platform }) {
  if (!APPROVED_APP_IDS.includes(appId)) {
    throw new Error('That application is not in the approved Brightdesk app catalogue.');
  }
  if (!validVersion(version)) throw new TypeError('A valid application version is required.');
  if (typeof executablePath !== 'string' || !path.isAbsolute(executablePath)) {
    throw new TypeError('An absolute application executable path is required.');
  }
  if (!['win32', 'darwin', 'linux'].includes(platform)) {
    throw new TypeError('The application platform is not supported.');
  }

  const filePath = registryPath(appDataPath);
  const registry = await readRegistry(filePath);
  const record = {
    id: appId,
    version,
    executablePath,
    platform,
    registeredAt: new Date().toISOString(),
    source: 'self-registration'
  };
  registry.apps[appId] = record;
  await writeRegistry(filePath, registry);
  return record;
}

async function listInstalledStandaloneApps({
  appDataPath,
  platform = process.platform,
  homeDirectory,
  environment,
  searchDirectories,
  runCommand
} = {}) {
  const filePath = registryPath(appDataPath);
  const registry = await readRegistry(filePath);
  const installedById = new Map();
  let changed = false;

  for (const appId of APPROVED_APP_IDS) {
    const record = registry.apps[appId];
    if (!record || record.id !== appId ||
      typeof record.executablePath !== 'string' || !path.isAbsolute(record.executablePath) ||
      !path.basename(record.executablePath).toLowerCase().startsWith('brightdesk') ||
      !validVersion(record.version) ||
      !['win32', 'darwin', 'linux'].includes(record.platform)) {
      if (record) { delete registry.apps[appId]; changed = true; }
      continue;
    }
    try {
      await fs.access(record.executablePath);
      installedById.set(appId, record);
    } catch {
      delete registry.apps[appId];
      changed = true;
    }
  }

  let discovered = [];
  try {
    discovered = await discoverStandaloneApps({
      platform,
      homeDirectory,
      environment,
      searchDirectories,
      ...(runCommand ? { runCommand } : {})
    });
  } catch (error) {
    console.warn('Brightdesk could not scan operating-system app locations.', error);
  }

  for (const record of discovered) {
    if (!APPROVED_APP_IDS.includes(record.id) || !path.isAbsolute(record.executablePath)) continue;
    const existing = installedById.get(record.id);
    if (!existing) {
      registry.apps[record.id] = record;
      installedById.set(record.id, record);
      changed = true;
    } else if (
      existing.executablePath !== record.executablePath ||
      (record.version !== 'unknown' && existing.version !== record.version)
    ) {
      registry.apps[record.id] = {
        ...record,
        discoveredAt: record.registeredAt
      };
      installedById.set(record.id, registry.apps[record.id]);
      changed = true;
    }
  }

  if (changed) await writeRegistry(filePath, registry);
  return APPROVED_APP_IDS.map(id => installedById.get(id)).filter(Boolean);
}

module.exports = {
  APPROVED_APP_IDS,
  VERSION_RE,
  registryPath,
  registerStandaloneApp,
  listInstalledStandaloneApps
};
