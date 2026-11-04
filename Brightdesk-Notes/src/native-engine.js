'use strict';

const fs = require('node:fs');
const path = require('node:path');

const nativeFolder = path.join(
  'native',
  `${process.platform}-${process.arch}`,
  'brightdesk_native.node'
);

const candidates = [
  process.resourcesPath
    ? path.join(process.resourcesPath, 'app.asar.unpacked', nativeFolder)
    : null,
  path.join(__dirname, '..', nativeFolder)
].filter(Boolean);

let nativeEngine = null;

for (const candidate of candidates) {
  if (!fs.existsSync(candidate)) continue;

  try {
    nativeEngine = require(candidate);
    break;
  } catch {
    // Try the next available library location.
  }
}

function getNativeEngineInfo() {
  if (!nativeEngine) {
    return {
      available: false,
      name: 'Brightdesk Native Engine',
      version: null,
      core: 'brightdesk-core'
    };
  }

  return {
    available: true,
    ...nativeEngine.engineInfo()
  };
}

module.exports = { getNativeEngineInfo };
