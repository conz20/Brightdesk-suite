'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function packageAt(entryFile) {
  let directory = path.dirname(entryFile);
  while (true) {
    const manifestPath = path.join(directory, 'package.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      if (manifest.name && manifest.version) return manifest;
    }
    const parent = path.dirname(directory);
    if (parent === directory) break;
    directory = parent;
  }
  throw new Error('Could not locate package.json for ' + entryFile);
}

test('Vitest and Vite use supported security-maintained versions without vulnerable tinypool', () => {
  const lock = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package-lock.json'), 'utf8'));
  assert.equal(lock.packages['node_modules/vitest'].version, '5.1.0');
  assert.equal(lock.packages['node_modules/vite'].version, '6.4.5');
  assert.equal(lock.packages['node_modules/tinypool'], undefined);
});

test('pptxgenjs resolves the patched image-size release', () => {
  const pptxEntry = require.resolve('pptxgenjs');
  const imageSizeEntry = require.resolve('image-size', { paths: [path.dirname(pptxEntry)] });
  assert.equal(packageAt(imageSizeEntry).version, '2.0.4');
});

test('ExcelJS resolves patched CommonJS uuid and still round-trips an XLSX workbook', async () => {
  const exceljsEntry = require.resolve('exceljs');
  const uuidEntry = require.resolve('uuid', { paths: [path.dirname(exceljsEntry)] });
  assert.equal(packageAt(uuidEntry).version, '11.1.1');
  const uuid = require(uuidEntry);
  assert.equal(typeof uuid.v4, 'function');
  assert.match(uuid.v4(), /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);

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

test('electron-builder resolves patched minimatch with the API its packaging code uses', () => {
  const appBuilderEntry = require.resolve('app-builder-lib');
  const minimatchEntry = require.resolve('minimatch', { paths: [path.dirname(appBuilderEntry)] });
  const minimatchPackage = packageAt(minimatchEntry);
  const minimatch = require(minimatchEntry);
  const [major, minor, patch] = minimatchPackage.version.split('.').map(Number);
  assert.ok(major > 11 || (major === 11 && (minor > 0 || (minor === 0 && patch >= 1))));
  assert.equal(typeof minimatch.Minimatch, 'function');
  assert.equal(typeof minimatch.minimatch, 'function');
  assert.equal(minimatch.minimatch('file.js', '*.js'), true);
  assert.equal(new minimatch.Minimatch('*.js').match('file.js'), true);
});

test('Archiver resolves patched readdir-glob and minimatch with a working CommonJS API', async () => {
  const exceljsEntry = require.resolve('exceljs');
  const archiverEntry = require.resolve('archiver', { paths: [path.dirname(exceljsEntry)] });
  const readdirGlobEntry = require.resolve('readdir-glob', { paths: [path.dirname(archiverEntry)] });
  const readdirPackage = packageAt(readdirGlobEntry);
  const minimatchEntry = require.resolve('minimatch', { paths: [path.dirname(readdirGlobEntry)] });
  const minimatchPackage = packageAt(minimatchEntry);
  const readdirGlob = require(readdirGlobEntry);
  const archiver = require(archiverEntry);

  assert.equal(readdirPackage.version, '3.0.0');
  assert.ok(Number(minimatchPackage.version.split('.')[0]) >= 11);
  assert.equal(typeof readdirGlob, 'function');
  assert.equal(typeof readdirGlob.ReaddirGlob, 'function');
  assert.equal(typeof readdirGlob.ReaddirGlob.prototype.pause, 'function');
  assert.equal(typeof readdirGlob.ReaddirGlob.prototype.resume, 'function');

  const directory = fs.mkdtempSync(path.join(require('node:os').tmpdir(), 'brightdesk-archiver-security-'));
  try {
    fs.writeFileSync(path.join(directory, 'compatibility.txt'), 'Brightdesk archive compatibility');
    const archive = archiver('zip');
    const chunks = [];
    const output = new (require('node:stream').PassThrough)();
    const completed = new Promise((resolve, reject) => {
      output.on('data', chunk => chunks.push(chunk));
      output.on('end', resolve);
      output.on('error', reject);
      archive.on('error', reject);
    });
    archive.pipe(output);
    archive.directory(directory, false);
    await archive.finalize();
    await completed;
    assert.ok(Buffer.concat(chunks).length > 0);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('root overrides stay scoped to their compatible dependency parents', () => {
  const manifest = require('../package.json');
  assert.equal(manifest.overrides.pptxgenjs['image-size'], '2.0.4');
  assert.equal(manifest.overrides.exceljs.uuid, '^11.1.1');
  assert.equal(manifest.overrides['app-builder-lib'].minimatch, '^11.0.1');
  assert.equal(manifest.overrides['archiver@5.3.2']['readdir-glob@^1.1.2'].minimatch, '^11.0.1');
  assert.equal(manifest.overrides['archiver@5.3.2']['readdir-glob@^1.1.2']['.'], '^3.0.0');
});

test('Vitest keeps the previous mock-history default after the major upgrade', () => {
  const config = fs.readFileSync(path.join(__dirname, '..', 'vitest.config.js'), 'utf8');
  assert.match(config, /clearMocks:\s*false/);
});
