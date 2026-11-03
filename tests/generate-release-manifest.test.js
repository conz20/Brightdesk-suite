'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const catalog = require('../src/app-catalog');
const { generateReleaseManifest } = require('../scripts/generate-release-manifest');

function checksum(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function packageName(platform, id, appName) {
  const productName = appName.replace(/^Brightdesk /, '');
  if (platform === 'win32') return `Brightdesk-${productName}-0.1.0-x64.exe`;
  if (platform === 'darwin') return `Brightdesk-${productName}-0.1.0-universal.pkg`;
  return `brightdesk-${id}-0.1.0-x64.deb`;
}

async function createReleaseFixture({ omitApp, tamperApp } = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-release-manifest-'));
  const definitions = [
    { platform: 'Windows', key: 'win32', checksum: 'Brightdesk-SHA256SUMS-WIN.txt', suite: 'Brightdesk-Setup-0.1.0-x64.exe' },
    { platform: 'macOS', key: 'darwin', checksum: 'Brightdesk-SHA256SUMS-MAC.txt', suite: 'Brightdesk-0.1.0-universal.pkg' },
    { platform: 'Linux', key: 'linux', checksum: 'Brightdesk-0.1.0-x64.deb', suite: 'Brightdesk-0.1.0-x64.deb' }
  ];
  for (const definition of definitions) {
    const directory = path.join(root, definition.platform);
    await fs.mkdir(directory, { recursive: true });
    const checksumRows = [];
    const suitePath = path.join(directory, definition.suite);
    const suiteBytes = Buffer.from(`suite ${definition.key}`);
    await fs.writeFile(suitePath, suiteBytes);
    checksumRows.push(`${checksum(suiteBytes)}  ${definition.suite}`);

    const filesToTamper = [];
    for (const app of catalog) {
      const folder = path.join(directory, 'Apps', app.id);
      await fs.mkdir(folder, { recursive: true });
      if (omitApp && omitApp.id === app.id && omitApp.platform === definition.key) continue;
      const fileName = packageName(definition.key, app.id, app.name);
      const filePath = path.join(folder, fileName);
      const bytes = Buffer.from(`${app.id} ${definition.key}`);
      await fs.writeFile(filePath, bytes);
      checksumRows.push(`${checksum(bytes)}  apps/${app.id}/${fileName}`);
      if (tamperApp && tamperApp.id === app.id && tamperApp.platform === definition.key) filesToTamper.push(filePath);
    }

    await fs.writeFile(path.join(directory, definition.checksum), `${checksumRows.join('\n')}\n`);
    for (const filePath of filesToTamper) {
      await fs.appendFile(filePath, ' changed after checksum generation');
    }
  }
  return root;
}

test('release manifest generator describes the Suite and every approved app on all three OS targets', async () => {
  const root = await createReleaseFixture();
  try {
    const result = generateReleaseManifest(root);
    const saved = JSON.parse(await fs.readFile(result.outputPath, 'utf8'));
    assert.equal(saved.suite.version, '0.1.0');
    assert.deepEqual(Object.keys(saved.apps).sort(), catalog.map(item => item.id).sort());
    for (const platform of ['win32', 'darwin', 'linux']) {
      assert.ok(saved.suite.platforms[platform]);
      for (const app of catalog) {
        assert.ok(saved.apps[app.id].platforms[platform], `Missing ${app.id} on ${platform}`);
      }
    }
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('release manifest generation stops when one approved app package is missing', async () => {
  const root = await createReleaseFixture({ omitApp: { id: 'forms', platform: 'linux' } });
  try {
    assert.throws(() => generateReleaseManifest(root), /No standalone installer artifacts found for Brightdesk Forms/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});

test('release manifest generation rejects package content changed after checksum verification', async () => {
  const root = await createReleaseFixture({ tamperApp: { id: 'pages', platform: 'win32' } });
  try {
    assert.throws(() => generateReleaseManifest(root), /SHA-256 mismatch/);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
  }
});
