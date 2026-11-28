#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { fileURLToPath } = require('node:url');
const { validateFontPackage } = require('../src/font-library-service');

const ROOT = path.resolve(__dirname, '..');
const DEFAULT_SOURCE = path.join(ROOT, 'artifacts', 'brightdesk-fonts-0.1.0');
const DEFAULT_OUTPUT = path.join(ROOT, 'packages', 'fonts');
const DEFAULT_TEMPLATE = path.join(ROOT, 'packages', 'fonts');
const SHA256 = /^[a-f0-9]{64}$/;
const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAFE_VERSION = /^[A-Za-z0-9][A-Za-z0-9.+_-]{0,63}$/;

function fail(message) {
  throw new Error('Brightdesk font package import: ' + message);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function safePath(value) {
  return typeof value === 'string' &&
    value.length > 0 &&
    !value.startsWith('/') &&
    !value.includes('\\') &&
    !value.includes(':') &&
    !value.split('/').some(part => !part || part === '.' || part === '..' || /[\u0000-\u001f\u007f]/.test(part));
}

function readJson(filePath, label) {
  try { return JSON.parse(fs.readFileSync(filePath, 'utf8')); }
  catch (error) { fail('cannot read ' + label + ': ' + error.message); }
}

function walkFiles(rootDir, current = rootDir, result = []) {
  const entries = fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'));
  for (const entry of entries) {
    const absolute = path.join(current, entry.name);
    const relative = path.relative(rootDir, absolute).split(path.sep).join('/');
    if (!safePath(relative)) fail('unsafe source package path: ' + relative);
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) fail('source package contains a symbolic link: ' + relative);
    if (stat.isDirectory()) walkFiles(rootDir, absolute, result);
    else if (stat.isFile()) result.push(relative);
    else fail('source package contains an unsupported filesystem entry: ' + relative);
  }
  return result.sort((a, b) => a.localeCompare(b, 'en'));
}

function verifySourcePackage(sourceRoot, minimumGoogleFamilies) {
  const root = path.resolve(sourceRoot);
  const buildManifest = readJson(path.join(root, 'manifest.json'), 'release source manifest');
  const packageManifest = readJson(path.join(root, 'font-package.json'), 'source package integrity manifest');
  const catalogue = readJson(path.join(root, 'catalogue', 'fonts.json'), 'source font catalogue');
  const details = readJson(path.join(root, 'catalogue', 'font-details.json'), 'source face details');

  if (!isRecord(buildManifest) || buildManifest.releaseProfile !== '0.1.0') {
    fail('source build manifest is not the approved 0.1.0 font collection.');
  }
  if (!isRecord(packageManifest) ||
      packageManifest.schemaVersion !== 1 ||
      packageManifest.packageId !== 'brightdesk-font-library' ||
      packageManifest.releaseProfile !== '0.1.0' ||
      packageManifest.version !== '0.1.0' ||
      packageManifest.integrity !== 'SHA-256' ||
      !Array.isArray(packageManifest.files) ||
      !isRecord(packageManifest.catalogue)) {
    fail('source package integrity manifest is missing or unsupported.');
  }
  if (!isRecord(catalogue) || catalogue.schemaVersion !== 1 || !Array.isArray(catalogue.fonts)) {
    fail('source font catalogue must use schema version 1.');
  }
  if (!isRecord(details) || details.schemaVersion !== 1 || !Array.isArray(details.families)) {
    fail('source font face details must use schema version 1.');
  }
  if (packageManifest.fileCount !== packageManifest.files.length) {
    fail('source package manifest fileCount does not match its file list.');
  }
  const actualPaths = walkFiles(root).filter(item => item !== 'font-package.json');
  const expectedPaths = packageManifest.files.map(item => item.path).sort((a, b) => a.localeCompare(b, 'en'));
  if (actualPaths.length !== expectedPaths.length ||
      actualPaths.some((value, index) => value !== expectedPaths[index])) {
    fail('source package files do not match the integrity manifest.');
  }

  const listed = new Map();
  let totalBytes = 0;
  for (const [index, item] of packageManifest.files.entries()) {
    if (!isRecord(item) || !safePath(item.path) ||
        !Number.isSafeInteger(item.size) || item.size < 0 ||
        !SHA256.test(String(item.sha256 || '')) ||
        listed.has(item.path)) {
      fail('source package file record ' + index + ' is invalid.');
    }
    const bytes = fs.readFileSync(path.join(root, ...item.path.split('/')));
    if (bytes.length !== item.size || sha256(bytes) !== item.sha256) {
      fail('source package file failed size or SHA-256 verification: ' + item.path);
    }
    listed.set(item.path, item);
    totalBytes += bytes.length;
  }
  if (totalBytes !== packageManifest.totalBytes) fail('source package totalBytes does not match its file list.');
  const catalogueRecord = listed.get('catalogue/fonts.json');
  if (!catalogueRecord || catalogueRecord.sha256 !== packageManifest.catalogue.sha256) {
    fail('source catalogue SHA-256 does not match the package manifest.');
  }

  const detailsById = new Map();
  for (const detail of details.families) {
    if (!isRecord(detail) || typeof detail.id !== 'string' || detailsById.has(detail.id)) {
      fail('source face details contain an invalid or duplicate family ID.');
    }
    detailsById.set(detail.id, detail);
  }

  const familyIds = new Set();
  const familyNames = new Set();
  let googleFamilyCount = 0;
  for (const [index, font] of catalogue.fonts.entries()) {
    const label = 'catalogue.fonts[' + index + ']';
    if (!isRecord(font) || typeof font.id !== 'string' || !SAFE_ID.test(font.id) ||
        typeof font.family !== 'string' || !font.family.trim() ||
        !isRecord(font.license) ||
        font.license.redistributionAllowed !== true ||
        font.license.embeddingAllowed !== true ||
        typeof font.license.textFile !== 'string' ||
        !safePath(font.license.textFile) ||
        !Array.isArray(font.files) || !font.files.length) {
      fail(label + ' is missing required font or redistribution/embedding rights metadata.');
    }
    if (familyIds.has(font.id)) fail('duplicate font family ID: ' + font.id);
    familyIds.add(font.id);
    const nameKey = font.family.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
    if (familyNames.has(nameKey)) fail('duplicate canonical font family name: ' + font.family);
    familyNames.add(nameKey);
    if (font.source?.publisher === 'Google Fonts' ||
        /google fonts/i.test(font.source?.name || '') ||
        /github\.com\/google\/fonts/i.test(font.source?.url || '')) {
      googleFamilyCount += 1;
    }

    const licenseRecord = listed.get(font.license.textFile);
    if (!licenseRecord || licenseRecord.size === 0) fail(label + ' is missing its retained licence text.');
    const detailsRecord = detailsById.get(font.id);
    if (!detailsRecord || detailsRecord.family !== font.family || !Array.isArray(detailsRecord.files)) {
      fail(label + ' is missing the matching inspected face metadata.');
    }
    const detailPaths = new Set(detailsRecord.files.map(item => item.path));
    for (const [fileIndex, fontFile] of font.files.entries()) {
      if (!isRecord(fontFile) || !safePath(fontFile.path) ||
          !fontFile.path.startsWith('assets/fonts/') ||
          !listed.has(fontFile.path) ||
          !SHA256.test(String(fontFile.sha256 || '')) ||
          listed.get(fontFile.path).sha256 !== fontFile.sha256 ||
          !detailPaths.has(fontFile.path)) {
        fail(label + '.files[' + fileIndex + '] does not match its verified source assets and face details.');
      }
    }
  }
  if (googleFamilyCount < minimumGoogleFamilies) {
    fail('only ' + googleFamilyCount + ' Google Fonts families passed; at least ' + minimumGoogleFamilies + ' are required.');
  }
  return { root, buildManifest, packageManifest, catalogue, details, googleFamilyCount, files: listed };
}

function publisherFor(font) {
  if (font.source?.publisher) return font.source.publisher;
  if (/google fonts/i.test(font.source?.name || '') || /google\/fonts/i.test(font.source?.url || '')) return 'Google Fonts';
  if (String(font.id).startsWith('microsoft-')) return 'Microsoft';
  return 'Other approved publisher';
}

function buildBrightdeskCatalogue(sourceCatalogue) {
  return {
    schemaVersion: 1,
    fonts: sourceCatalogue.fonts.map(font => ({
      id: font.id,
      family: font.family,
      version: font.version,
      source: {
        publisher: publisherFor(font),
        name: font.source?.name || font.source?.publisher || '',
        repository: font.source?.url || '',
        retrievedAt: font.source?.retrievedAt || ''
      },
      license: {
        spdxId: font.license.spdxId,
        textFile: font.license.textFile,
        licenseUrl: font.license.licenseUrl,
        copyright: font.license.copyright,
        author: font.license.author,
        redistributionAllowed: font.license.redistributionAllowed,
        applicationEmbeddingAllowed: font.license.embeddingAllowed,
        modificationAllowed: font.license.modificationAllowed,
        reservedFontName: font.license.reservedFontName
      },
      styles: [...font.styles],
      scripts: [...font.scripts],
      files: font.files.map(file => ({
        path: file.path,
        format: file.format,
        sha256: file.sha256,
        face: structuredClone(file.face)
      }))
    }))
  };
}

function publishDirectory(staging, outputRoot) {
  const target = path.resolve(outputRoot);
  const parent = path.dirname(target);
  let backup = '';
  fs.mkdirSync(parent, { recursive: true });
  if (fs.existsSync(target)) {
    backup = fs.mkdtempSync(path.join(parent, '.fonts-backup-'));
    fs.rmdirSync(backup);
    fs.renameSync(target, backup);
  }
  try {
    fs.renameSync(staging, target);
  } catch (error) {
    if (backup && fs.existsSync(backup) && !fs.existsSync(target)) fs.renameSync(backup, target);
    throw error;
  }
  if (backup) fs.rmSync(backup, { recursive: true, force: true });
}

function importFontReleasePackage({
  sourceRoot = DEFAULT_SOURCE,
  outputRoot = DEFAULT_OUTPUT,
  templateRoot = DEFAULT_TEMPLATE,
  minimumGoogleFamilies = 1900
} = {}) {
  if (!Number.isInteger(minimumGoogleFamilies) || minimumGoogleFamilies < 1) {
    fail('minimumGoogleFamilies must be a positive integer.');
  }
  const source = verifySourcePackage(sourceRoot, minimumGoogleFamilies);
  const template = path.resolve(templateRoot);
  const templateIndex = path.join(template, 'index.cjs');
  if (!fs.existsSync(templateIndex) || !fs.statSync(templateIndex).isFile()) fail('the Brightdesk package API template is missing.');

  const target = path.resolve(outputRoot);
  const staging = fs.mkdtempSync(path.join(path.dirname(target), '.brightdesk-fonts-import-'));
  try {
    fs.mkdirSync(path.join(staging, 'assets'), { recursive: true });
    fs.mkdirSync(path.join(staging, 'licenses'), { recursive: true });
    fs.cpSync(path.join(source.root, 'assets'), path.join(staging, 'assets'), { recursive: true });
    fs.cpSync(path.join(source.root, 'licenses'), path.join(staging, 'licenses'), { recursive: true });
    fs.mkdirSync(path.join(staging, 'catalogue'), { recursive: true });
    fs.copyFileSync(path.join(source.root, 'catalogue', 'font-details.json'), path.join(staging, 'catalogue', 'font-details.json'));
    fs.copyFileSync(path.join(source.root, 'fonts.css'), path.join(staging, 'fonts.css'));
    fs.copyFileSync(templateIndex, path.join(staging, 'index.cjs'));
    fs.copyFileSync(path.join(source.root, 'manifest.json'), path.join(staging, 'manifest.json'));
    fs.writeFileSync(path.join(staging, 'catalogue.json'), JSON.stringify(buildBrightdeskCatalogue(source.catalogue), null, 2) + '\n');
    fs.writeFileSync(path.join(staging, 'package.json'), JSON.stringify({
      name: '@brightdesk/fonts',
      version: source.buildManifest.releaseProfile,
      private: true,
      description: 'Shared offline-first, licence-reviewed font catalogue and assets for all Brightdesk products.',
      main: 'index.cjs',
      files: ['assets', 'catalogue.json', 'catalogue', 'fonts.css', 'index.cjs', 'licenses', 'manifest.json']
    }, null, 2) + '\n');

    const verified = validateFontPackage(staging);
    if (verified.catalogue.fonts.length !== source.catalogue.fonts.length) {
      fail('converted catalogue family count does not match the verified source package.');
    }
    publishDirectory(staging, target);
    return {
      outputRoot: target,
      googleFamilyCount: source.googleFamilyCount,
      familyCount: source.catalogue.fonts.length,
      fontFileCount: source.packageManifest.catalogue.fontFileCount,
      version: source.buildManifest.releaseProfile
    };
  } catch (error) {
    fs.rmSync(staging, { recursive: true, force: true });
    throw error;
  }
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    const options = {};
    for (let index = 0; index < args.length; index += 1) {
      if (args[index] === '--source') options.sourceRoot = path.resolve(args[++index] || '');
      else if (args[index] === '--output') options.outputRoot = path.resolve(args[++index] || '');
      else fail('unknown argument: ' + args[index]);
    }
    const result = importFontReleasePackage(options);
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } catch (error) {
    process.stderr.write(error.message + '\n');
    process.exitCode = 1;
  }
}

module.exports = { importFontReleasePackage, verifySourcePackage, buildBrightdeskCatalogue };
