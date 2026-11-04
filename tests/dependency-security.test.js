'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createRequire } = require('node:module');

function findPackageManifest(entryPath, expectedName) {
  let directory = path.dirname(entryPath);
  while (true) {
    const manifestPath = path.join(directory, 'package.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (manifest.name === expectedName) return manifest;
    }
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  throw new Error('Could not locate package.json for ' + expectedName + ' from ' + entryPath);
}

test('Electron Builder resolves a patched minimatch with its required CommonJS API', () => {
  const appBuilderRequire = createRequire(require.resolve('app-builder-lib'));
  const minimatchEntry = appBuilderRequire.resolve('minimatch');
  const minimatchPackage = findPackageManifest(minimatchEntry, 'minimatch');
  const minimatch = appBuilderRequire('minimatch');

  assert.equal(minimatchPackage.version, '11.0.3');
  assert.equal(typeof minimatch.Minimatch, 'function');
  assert.equal(typeof minimatch.minimatch, 'function');

  const matcher = new minimatch.Minimatch('dist/{main,preload}.js');
  assert.equal(matcher.match('dist/main.js'), true);
  assert.equal(matcher.match('dist/preload.js'), true);
  assert.equal(matcher.match('dist/renderer.js'), false);
});

test('ExcelJS resolves the patched CommonJS uuid release and rejects out-of-bounds writes', () => {
  const exceljsRequire = createRequire(require.resolve('exceljs'));
  const uuidEntry = exceljsRequire.resolve('uuid');
  const uuidPackage = findPackageManifest(uuidEntry, 'uuid');
  const uuid = exceljsRequire('uuid');

  assert.equal(uuidPackage.version, '11.1.1');
  assert.equal(typeof uuid.v3, 'function');
  assert.equal(typeof uuid.v4, 'function');
  assert.equal(typeof uuid.v5, 'function');

  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  assert.throws(
    () => uuid.v3('Brightdesk', namespace, Buffer.alloc(16), 1),
    RangeError
  );
  assert.throws(
    () => uuid.v5('Brightdesk', namespace, Buffer.alloc(16), 1),
    RangeError
  );
});

test('ExcelJS can still write and reload a workbook with the patched uuid package', async () => {
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Brightdesk');
  worksheet.addRow(['Dependency check', 'Passed']);

  const buffer = await workbook.xlsx.writeBuffer();
  const reloaded = new ExcelJS.Workbook();
  await reloaded.xlsx.load(buffer);

  assert.equal(reloaded.getWorksheet('Brightdesk').getCell('A1').value, 'Dependency check');
  assert.equal(reloaded.getWorksheet('Brightdesk').getCell('B1').value, 'Passed');
});
