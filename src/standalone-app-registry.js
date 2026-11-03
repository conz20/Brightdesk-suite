'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const APPROVED_APP_IDS = Object.freeze([
  'pages', 'sheets', 'slides', 'notes', 'database',
  'forms', 'lists', 'planner', 'todo', 'loop'
]);

function registryPath(appDataPath) {
  if (typeof appDataPath !== 'string' || !appDataPath.trim()) {
    throw new TypeError('A valid application-data directory is required.');
  }
  return path.join(appDataPath, 'Brightdesk', 'installed-apps.json');
}

async function readRegistry(filePath) {
  try {
    const parsed = JSON.parse(await fs.readFile(filePath, 'utf8'));
    if (!parsed || parsed.schemaVersion !== 1 || !parsed.apps || typeof parsed.apps !== 'object') {
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
  const temporaryPath = `${filePath}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(registry, null, 2)}\n`, { mode: 0o600 });
  await fs.rename(temporaryPath, filePath);
}

async function registerStandaloneApp({ appDataPath, appId, version, executablePath, platform }) {
  if (!APPROVED_APP_IDS.includes(appId)) {
    throw new Error('That application is not in the approved Brightdesk app catalogue.');
  }
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new TypeError('A valid application version is required.');
  }
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
    registeredAt: new Date().toISOString()
  };
  registry.apps[appId] = record;
  await writeRegistry(filePath, registry);
  return record;
}

async function listInstalledStandaloneApps({ appDataPath }) {
  const filePath = registryPath(appDataPath);
  const registry = await readRegistry(filePath);
  const installed = [];
  let changed = false;

  for (const appId of APPROVED_APP_IDS) {
    const record = registry.apps[appId];
    if (!record || record.id !== appId ||
      typeof record.executablePath !== 'string' || !path.isAbsolute(record.executablePath) ||
      !path.basename(record.executablePath).toLowerCase().startsWith('brightdesk') ||
      typeof record.version !== 'string' || !/^\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?$/.test(record.version) ||
      !['win32', 'darwin', 'linux'].includes(record.platform)) {
      if (record) { delete registry.apps[appId]; changed = true; }
      continue;
    }
    try {
      await fs.access(record.executablePath);
      installed.push(record);
    } catch {
      delete registry.apps[appId];
      changed = true;
    }
  }

  if (changed) await writeRegistry(filePath, registry);
  return installed;
}

module.exports = { APPROVED_APP_IDS, registerStandaloneApp, listInstalledStandaloneApps };
