'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

async function captureGuideScreenshot({
  window,
  applicationId,
  allowedApplicationIds,
  outputDirectory
} = {}) {
  const approved = applicationId === 'suite' ||
    (Array.isArray(allowedApplicationIds) && allowedApplicationIds.includes(applicationId));
  if (!approved || typeof applicationId !== 'string' || !/^[a-z][a-z0-9-]*$/.test(applicationId)) {
    throw new Error('Unsupported Brightdesk guide screenshot target.');
  }
  if (!window || typeof window.isDestroyed !== 'function' || window.isDestroyed() ||
      typeof window.webContents?.capturePage !== 'function') {
    throw new Error('A live Electron window is required for a Brightdesk guide screenshot.');
  }
  if (typeof outputDirectory !== 'string' || outputDirectory.trim().length === 0) {
    throw new Error('A Brightdesk guide screenshot output directory is required.');
  }

  const image = await window.webContents.capturePage();
  const png = image?.toPNG?.();
  if (!Buffer.isBuffer(png) || png.length === 0) {
    throw new Error('Electron returned an empty screenshot.');
  }

  const destinationDirectory = path.resolve(outputDirectory);
  await fs.mkdir(destinationDirectory, { recursive: true });
  const filePath = path.join(destinationDirectory, `${applicationId}.png`);
  await fs.writeFile(filePath, png, { mode: 0o600 });
  const { size } = await fs.stat(filePath);
  if (size === 0) throw new Error('The Brightdesk guide screenshot was written as an empty file.');

  return { applicationId, filePath, bytes: size };
}

module.exports = { captureGuideScreenshot };
