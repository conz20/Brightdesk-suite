'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function packageAt(entryFile) {
  let directory = path.dirname(entryFile);
  while (true) {
    const manifestPath = path.join(directory, 'package.json');
    if (fs.existsSync(manifestPath)) return JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  throw new Error('Could not locate package.json for ' + entryFile);
}

test('ExcelJS uses the patched CommonJS-compatible uuid release', () => {
  const exceljsEntry = require.resolve('exceljs');
  const uuidEntry = require.resolve('uuid', { paths: [path.dirname(exceljsEntry)] });
  const uuidPackage = packageAt(uuidEntry);
  const uuid = require(uuidEntry);

  assert.equal(uuidPackage.version, '11.1.1');
  assert.equal(typeof uuid.v4, 'function');
  assert.match(uuid.v4(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});

test('ExcelJS still writes and reads an XLSX workbook with the uuid override', async () => {
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Security check');
  sheet.getCell('A1').value = 'Brightdesk';
  sheet.getCell('A2').value = 42;

  const buffer = await workbook.xlsx.writeBuffer();
  const restored = new ExcelJS.Workbook();
  await restored.xlsx.load(buffer);

  assert.equal(restored.getWorksheet('Security check').getCell('A1').value, 'Brightdesk');
  assert.equal(restored.getWorksheet('Security check').getCell('A2').value, 42);
});

test('electron-builder app-builder-lib resolves the patched minimatch package', () => {
  const appBuilderEntry = require.resolve('app-builder-lib');
  const minimatchEntry = require.resolve('minimatch', { paths: [path.dirname(appBuilderEntry)] });
  const minimatchPackage = packageAt(minimatchEntry);
  const minimatch = require(minimatchEntry);

  const [major, minor, patch] = minimatchPackage.version.split('.').map(Number);
  assert.ok(major > 11 || (major === 11 && (minor > 0 || (minor === 0 && patch >= 1))), 'minimatch must be at least 11.0.1');
  assert.equal(typeof minimatch.Minimatch, 'function');
  assert.equal(typeof minimatch.minimatch, 'function');
  assert.equal(minimatch.minimatch('file.js', '*.js'), true);
  assert.equal(new minimatch.Minimatch('*.js').match('file.js'), true);
});

test('root overrides are explicitly scoped to ExcelJS and app-builder-lib', () => {
  const manifest = require('../package.json');
  assert.equal(manifest.overrides.exceljs.uuid, '^11.1.1');
  assert.equal(manifest.overrides['app-builder-lib'].minimatch, '^11.0.1');
});
