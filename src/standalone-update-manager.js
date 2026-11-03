'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const path = require('node:path');

const APPROVED_APP_IDS = new Set([
  'pages', 'sheets', 'slides', 'notes', 'database',
  'forms', 'lists', 'planner', 'todo', 'loop'
]);
const TRUSTED_DOWNLOAD_PREFIX = 'https://github.com/connormolloy12/Brightdesk-suite/releases/download/';

function registryPaths(appDataPath) {
  if (typeof appDataPath !== 'string' || !appDataPath.trim()) {
    throw new TypeError('A valid application-data directory is required.');
  }
  const root = path.join(appDataPath, 'Brightdesk');
  return {
    root,
    registry: path.join(root, 'staged-updates.json'),
    downloads: path.join(root, 'updates')
  };
}

async function readRegistry(registryPath) {
  try {
    const value = JSON.parse(await fs.readFile(registryPath, 'utf8'));
    if (!value || value.schemaVersion !== 1 || !Array.isArray(value.updates)) {
      return { schemaVersion: 1, updates: [] };
    }
    return value;
  } catch (error) {
    if (error.code === 'ENOENT') return { schemaVersion: 1, updates: [] };
    throw new Error(`Could not read staged app updates: ${error.message}`);
  }
}

async function writeRegistry(registryPath, registry) {
  await fs.mkdir(path.dirname(registryPath), { recursive: true });
  const temporaryPath = `${registryPath}.tmp`;
  await fs.writeFile(temporaryPath, `${JSON.stringify(registry, null, 2)}\n`, { mode: 0o600 });
  await fs.rename(temporaryPath, registryPath);
}

function validateDownload({ appId, version, fileName, downloadUrl, sha256, expectedSize, platform }) {
  if (!APPROVED_APP_IDS.has(appId)) throw new Error('That app is not in the approved Brightdesk catalogue.');
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new TypeError('The update version is invalid.');
  }
  if (typeof fileName !== 'string' || path.basename(fileName) !== fileName || !fileName.startsWith('Brightdesk-') && !fileName.startsWith('brightdesk-')) {
    throw new TypeError('The update installer filename is invalid.');
  }
  if (typeof downloadUrl !== 'string' || !downloadUrl.startsWith(TRUSTED_DOWNLOAD_PREFIX)) {
    throw new Error('The update installer is not hosted by the trusted Brightdesk release repository.');
  }
  if (typeof sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(sha256)) {
    throw new TypeError('A valid SHA-256 checksum is required before an installer can be staged.');
  }
  if (!Number.isSafeInteger(expectedSize) || expectedSize <= 0) {
    throw new TypeError('A valid installer size is required before an installer can be staged.');
  }
  const extensions = { win32: '.exe', darwin: '.pkg', linux: '.deb' };
  if (!extensions[platform] || !fileName.toLowerCase().endsWith(extensions[platform])) {
    throw new Error('The update installer does not match this computer platform.');
  }
}

async function stageStandaloneAppUpdate({
  appDataPath,
  appId,
  version,
  fileName,
  downloadUrl,
  sha256,
  expectedSize,
  platform,
  fetchImpl = global.fetch
} = {}) {
  validateDownload({ appId, version, fileName, downloadUrl, sha256, expectedSize, platform });
  if (typeof fetchImpl !== 'function') throw new Error('This runtime cannot download app updates.');

  const paths = registryPaths(appDataPath);
  const appDirectory = path.join(paths.downloads, appId, version);
  await fs.mkdir(appDirectory, { recursive: true });
  const destination = path.join(appDirectory, fileName);
  const temporaryPath = `${destination}.part`;
  await fs.rm(temporaryPath, { force: true });
  await fs.rm(destination, { force: true });

  let response;
  try {
    response = await fetchImpl(downloadUrl, {
      headers: { Accept: 'application/octet-stream', 'User-Agent': 'Brightdesk-Office-Suite' }
    });
    if (!response.ok || !response.body) {
      throw new Error(`Could not download the installer (HTTP ${response.status || 'unknown'}).`);
    }

    const handle = await fs.open(temporaryPath, 'w', 0o600);
    const hash = crypto.createHash('sha256');
    let received = 0;
    try {
      for await (const chunkValue of response.body) {
        const chunk = Buffer.from(chunkValue);
        received += chunk.length;
        if (received > expectedSize) throw new Error('The downloaded installer is larger than its published size.');
        hash.update(chunk);
        let offset = 0;
        while (offset < chunk.length) {
          const result = await handle.write(chunk, offset, chunk.length - offset);
          if (!result.bytesWritten) throw new Error('The installer could not be written to disk completely.');
          offset += result.bytesWritten;
        }
      }
      await handle.sync();
    } finally {
      await handle.close();
    }

    if (received !== expectedSize) throw new Error('The downloaded installer size does not match the release manifest.');
    if (hash.digest('hex') !== sha256.toLowerCase()) throw new Error('The downloaded installer failed its SHA-256 check.');
    await fs.rename(temporaryPath, destination);

    const registry = await readRegistry(paths.registry);
    const record = {
      appId,
      version,
      fileName,
      filePath: destination,
      platform,
      sha256: sha256.toLowerCase(),
      size: received,
      stagedAt: new Date().toISOString()
    };
    const previous = registry.updates.filter(item => item.appId === appId);
    for (const old of previous) {
      if (typeof old.filePath !== 'string') continue;
      const oldPath = path.resolve(old.filePath);
      if (oldPath.startsWith(path.resolve(paths.downloads, appId) + path.sep) && oldPath !== destination) {
        await fs.rm(oldPath, { force: true }).catch(() => {});
      }
    }
    registry.updates = registry.updates.filter(item => item.appId !== appId);
    registry.updates.push(record);
    await writeRegistry(paths.registry, registry);
    return record;
  } catch (error) {
    await fs.rm(temporaryPath, { force: true }).catch(() => {});
    throw error;
  }
}

function safeStagedRecordPath(paths, record) {
  if (!record || !APPROVED_APP_IDS.has(record.appId)) return null;
  if (typeof record.version !== 'string' || !/^\\d+\\.\\d+\\.\\d+(?:-[0-9A-Za-z.-]+)?$/.test(record.version)) return null;
  if (typeof record.fileName !== 'string' || path.basename(record.fileName) !== record.fileName) return null;
  const appRoot = path.resolve(paths.downloads, record.appId);
  const expectedPath = path.resolve(appRoot, record.version, record.fileName);
  if (!expectedPath.startsWith(appRoot + path.sep)) return null;
  if (typeof record.filePath !== 'string' || path.resolve(record.filePath) !== expectedPath) return null;
  return expectedPath;
}

async function listStagedStandaloneAppUpdates({ appDataPath } = {}) {
  const paths = registryPaths(appDataPath);
  const registry = await readRegistry(paths.registry);
  const available = [];
  let changed = false;
  for (const record of registry.updates) {
    const expectedPath = safeStagedRecordPath(paths, record);
    if (!expectedPath) {
      changed = true;
      continue;
    }
    try {
      const stat = await fs.stat(expectedPath);
      if (!stat.isFile() || stat.size !== record.size) {
        changed = true;
        continue;
      }
      available.push(record);
    } catch {
      changed = true;
    }
  }
  if (changed) {
    registry.updates = available;
    await writeRegistry(paths.registry, registry);
  }
  return available;
}

async function removeStagedStandaloneAppUpdate({ appDataPath, appId } = {}) {
  if (!APPROVED_APP_IDS.has(appId)) throw new Error('That app is not in the approved Brightdesk catalogue.');
  const paths = registryPaths(appDataPath);
  const registry = await readRegistry(paths.registry);
  const matches = registry.updates.filter(item => item.appId === appId);
  registry.updates = registry.updates.filter(item => item.appId !== appId);
  await writeRegistry(paths.registry, registry);
  for (const item of matches) {
    const expectedPath = safeStagedRecordPath(paths, item);
    if (expectedPath) await fs.rm(expectedPath, { force: true }).catch(() => {});
  }
  return { removed: matches.length > 0 };
}

module.exports = {
  APPROVED_APP_IDS,
  stageStandaloneAppUpdate,
  listStagedStandaloneAppUpdates,
  removeStagedStandaloneAppUpdate
};
