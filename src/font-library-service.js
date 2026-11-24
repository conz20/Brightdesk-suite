'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { pathToFileURL } = require('node:url');

const PACKAGE_ID = 'brightdesk-font-library';
const VERSION_PATTERN = /^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9.-]+)?$/;
const FAMILY_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const FONT_FORMATS = new Set(['ttf', 'otf']);

function fail(message) {
  throw new Error('Brightdesk font library: ' + message);
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function safeRelativePath(value) {
  return typeof value === 'string' &&
    value.length > 0 &&
    !value.startsWith('/') &&
    !value.includes('\\') &&
    !value.includes(':') &&
    !value.split('/').some(segment =>
      !segment ||
      segment === '.' ||
      segment === '..' ||
      /[\u0000-\u001f\u007f]/.test(segment)
    );
}

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail('cannot read ' + label + ': ' + error.message);
  }
}

function walkFiles(rootDir, currentDir = rootDir, result = []) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name, 'en'));
  for (const entry of entries) {
    const absolute = path.join(currentDir, entry.name);
    const relative = path.relative(rootDir, absolute).split(path.sep).join('/');
    if (!safeRelativePath(relative)) fail('unsafe package path: ' + relative);
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) fail('symbolic links are not accepted: ' + relative);
    if (stat.isDirectory()) walkFiles(rootDir, absolute, result);
    else if (stat.isFile()) result.push(relative);
    else fail('unsupported filesystem entry: ' + relative);
  }
  return result;
}

function comparePath(left, right) {
  return left.localeCompare(right, 'en');
}

function validatePackage(rootDir) {
  const root = path.resolve(rootDir);
  const packageManifestPath = path.join(root, 'font-package.json');
  const manifest = readJson(packageManifestPath, 'font-package.json');
  if (!isRecord(manifest) ||
      manifest.schemaVersion !== 1 ||
      manifest.packageId !== PACKAGE_ID ||
      !VERSION_PATTERN.test(String(manifest.version || '')) ||
      manifest.releaseProfile !== '0.1.0' ||
      manifest.integrity !== 'SHA-256' ||
      !Array.isArray(manifest.files) ||
      !Number.isSafeInteger(manifest.fileCount) ||
      !Number.isSafeInteger(manifest.totalBytes) ||
      !isRecord(manifest.catalogue)) {
    fail('font-package.json has an unsupported or incomplete schema.');
  }
  if (manifest.fileCount !== manifest.files.length) fail('font package fileCount does not match its files array.');
  if (manifest.totalBytes < 1) fail('font package totalBytes must be positive.');
  if (manifest.catalogue.path !== 'catalogue/fonts.json' ||
      !SHA256_PATTERN.test(String(manifest.catalogue.sha256 || '')) ||
      !Number.isSafeInteger(manifest.catalogue.familyCount) ||
      !Number.isSafeInteger(manifest.catalogue.fontFileCount)) {
    fail('font package catalogue integrity metadata is invalid.');
  }

  const listed = new Map();
  let totalBytes = 0;
  for (const [index, item] of manifest.files.entries()) {
    if (!isRecord(item) || Object.keys(item).sort().join(',') !== 'path,sha256,size') {
      fail('font package files[' + index + '] has unsupported fields.');
    }
    if (!safeRelativePath(item.path) || item.path === 'font-package.json') {
      fail('font package contains an unsafe or self-referential file path.');
    }
    if (!Number.isSafeInteger(item.size) || item.size < 0 || !SHA256_PATTERN.test(String(item.sha256 || ''))) {
      fail('font package file metadata is invalid for ' + item.path + '.');
    }
    if (listed.has(item.path)) fail('font package contains a duplicate file path: ' + item.path);
    listed.set(item.path, item);
    totalBytes += item.size;
  }
  if (totalBytes !== manifest.totalBytes) fail('font package totalBytes does not match its file records.');

  const actualPaths = walkFiles(root).filter(file => file !== 'font-package.json').sort(comparePath);
  const expectedPaths = [...listed.keys()].sort(comparePath);
  if (actualPaths.length !== expectedPaths.length ||
      actualPaths.some((file, index) => file !== expectedPaths[index])) {
    fail('font package contents do not match font-package.json.');
  }

  for (const item of manifest.files) {
    const absolute = path.join(root, ...item.path.split('/'));
    const stat = fs.statSync(absolute);
    if (!stat.isFile() || stat.size !== item.size) fail('font package file size mismatch: ' + item.path);
    const digest = sha256(fs.readFileSync(absolute));
    if (digest !== item.sha256) fail('font package SHA-256 mismatch: ' + item.path);
  }

  const catalogueEntry = listed.get(manifest.catalogue.path);
  if (!catalogueEntry || catalogueEntry.sha256 !== manifest.catalogue.sha256) {
    fail('font package catalogue SHA-256 does not match its file record.');
  }
  const catalogue = readJson(path.join(root, 'catalogue', 'fonts.json'), 'catalogue/fonts.json');
  if (!isRecord(catalogue) || catalogue.schemaVersion !== 1 || !Array.isArray(catalogue.fonts)) {
    fail('font catalogue schema is invalid.');
  }
  if (catalogue.fonts.length !== manifest.catalogue.familyCount) {
    fail('font catalogue family count does not match font-package.json.');
  }

  const registeredAssets = new Set();
  const familyIds = new Set();
  const familyNames = new Set();
  for (const [index, font] of catalogue.fonts.entries()) {
    const label = 'catalogue.fonts[' + index + ']';
    if (!isRecord(font) ||
        !FAMILY_ID_PATTERN.test(String(font.id || '')) ||
        typeof font.family !== 'string' ||
        !font.family.trim() ||
        !isRecord(font.license) ||
        font.license.redistributionAllowed !== true ||
        font.license.embeddingAllowed !== true ||
        typeof font.license.textFile !== 'string' ||
        !Array.isArray(font.files) || font.files.length === 0) {
      fail(label + ' is not an approved redistributable and embeddable font family.');
    }
    if (familyIds.has(font.id)) fail('duplicate font family ID: ' + font.id);
    familyIds.add(font.id);
    const normalizedName = font.family.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
    if (familyNames.has(normalizedName)) fail('duplicate canonical font family name: ' + font.family);
    familyNames.add(normalizedName);

    if (!safeRelativePath(font.license.textFile) || !font.license.textFile.startsWith('licenses/')) {
      fail(label + ' has an unsafe licence text path.');
    }
    const licence = listed.get(font.license.textFile);
    if (!licence || licence.size === 0) fail(label + ' is missing its retained licence text.');

    for (const [fileIndex, file] of font.files.entries()) {
      const fileLabel = label + '.files[' + fileIndex + ']';
      if (!isRecord(file) ||
          !safeRelativePath(file.path) ||
          !file.path.startsWith('assets/fonts/') ||
          !FONT_FORMATS.has(String(file.format).toLowerCase()) ||
          !isRecord(file.face) ||
          !SHA256_PATTERN.test(String(file.sha256 || '')) ||
          !listed.has(file.path)) {
        fail(fileLabel + ' has invalid or missing font asset metadata.');
      }
      const asset = listed.get(file.path);
      if (asset.sha256 !== file.sha256 || path.extname(file.path).slice(1).toLowerCase() !== String(file.format).toLowerCase()) {
        fail(fileLabel + ' does not match the verified package file record.');
      }
      if (registeredAssets.has(file.path)) fail('font asset is registered more than once: ' + file.path);
      registeredAssets.add(file.path);
    }
  }

  const packagedFontAssets = [...listed.keys()].filter(file => file.startsWith('assets/fonts/') && FONT_FORMATS.has(path.extname(file).slice(1).toLowerCase()));
  if (packagedFontAssets.length !== manifest.catalogue.fontFileCount ||
      packagedFontAssets.length !== registeredAssets.size ||
      packagedFontAssets.some(file => !registeredAssets.has(file))) {
    fail('font catalogue references do not match the bundled font assets.');
  }
  if (!listed.has('fonts.css') || !listed.has('catalogue/font-details.json')) {
    fail('font package is missing its stylesheet or inspected face details.');
  }

  const details = readJson(path.join(root, 'catalogue', 'font-details.json'), 'catalogue/font-details.json');
  if (!isRecord(details) || details.schemaVersion !== 1 || !Array.isArray(details.families)) {
    fail('font face details schema is invalid.');
  }
  const manifestDigest = sha256(fs.readFileSync(packageManifestPath));
  return { root, manifest, manifestDigest, catalogue, details };
}

function copyPackageFiles(source, destination, manifest) {
  for (const item of manifest.files) {
    const from = path.join(source, ...item.path.split('/'));
    const to = path.join(destination, ...item.path.split('/'));
    fs.mkdirSync(path.dirname(to), { recursive: true });
    fs.copyFileSync(from, to);
  }
  fs.copyFileSync(path.join(source, 'font-package.json'), path.join(destination, 'font-package.json'));
}

class FontLibraryService {
  constructor({ bundledRoot, sharedRoot } = {}) {
    if (typeof bundledRoot !== 'string' || !path.isAbsolute(bundledRoot)) {
      fail('bundledRoot must be an absolute path.');
    }
    if (typeof sharedRoot !== 'string' || !path.isAbsolute(sharedRoot)) {
      fail('sharedRoot must be an absolute path.');
    }
    this.bundledRoot = path.resolve(bundledRoot);
    this.sharedRoot = path.resolve(sharedRoot);
    this.packagesRoot = path.join(this.sharedRoot, 'packages');
    this.indexPath = path.join(this.sharedRoot, 'installed.json');
    this.packages = [];
    this.initialized = false;
  }

  verifyPackage(packageRoot) {
    return validatePackage(packageRoot);
  }

  installPackage(packageRoot) {
    const verified = validatePackage(packageRoot);
    const version = verified.manifest.version;
    const target = path.join(this.packagesRoot, version);
    if (!target.startsWith(this.packagesRoot + path.sep)) fail('package version escapes the shared store.');

    fs.mkdirSync(this.packagesRoot, { recursive: true });
    if (fs.existsSync(target)) {
      const existing = validatePackage(target);
      if (existing.manifestDigest !== verified.manifestDigest) {
        fail('an installed font package version cannot be replaced with different contents.');
      }
      this.recordInstalledPackage(existing);
      return this.packageSummary(existing);
    }

    const staging = fs.mkdtempSync(path.join(this.packagesRoot, '.staging-'));
    try {
      copyPackageFiles(verified.root, staging, verified.manifest);
      const copiedManifest = validatePackage(staging);
      if (copiedManifest.manifestDigest !== verified.manifestDigest) {
        fail('font package changed while it was being copied into the shared store.');
      }
      fs.renameSync(staging, target);
      const installed = validatePackage(target);
      this.recordInstalledPackage(installed);
      return this.packageSummary(installed);
    } catch (error) {
      fs.rmSync(staging, { recursive: true, force: true });
      throw error;
    }
  }

  recordInstalledPackage(verified) {
    const current = this.readInstalledIndex();
    const versions = new Map(current.packages.map(item => [item.version, item]));
    versions.set(verified.manifest.version, {
      packageId: verified.manifest.packageId,
      version: verified.manifest.version,
      manifestSha256: verified.manifestDigest
    });
    const next = {
      schemaVersion: 1,
      packages: [...versions.values()].sort((left, right) => left.version.localeCompare(right.version, 'en', { numeric: true }))
    };
    fs.mkdirSync(this.sharedRoot, { recursive: true });
    const temporary = path.join(this.sharedRoot, '.installed-' + process.pid + '.tmp');
    fs.writeFileSync(temporary, JSON.stringify(next, null, 2) + '\n', { mode: 0o600 });
    fs.renameSync(temporary, this.indexPath);
    this.packages = next.packages.map(item => {
      const root = path.join(this.packagesRoot, item.version);
      const result = validatePackage(root);
      if (result.manifestDigest !== item.manifestSha256) fail('installed font package index does not match its package manifest.');
      return result;
    });
    this.initialized = true;
  }

  readInstalledIndex() {
    if (!fs.existsSync(this.indexPath)) return { schemaVersion: 1, packages: [] };
    const value = readJson(this.indexPath, 'installed font library index');
    if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.packages)) {
      fail('installed font library index is invalid.');
    }
    for (const item of value.packages) {
      if (!isRecord(item) ||
          item.packageId !== PACKAGE_ID ||
          !VERSION_PATTERN.test(String(item.version || '')) ||
          !SHA256_PATTERN.test(String(item.manifestSha256 || ''))) {
        fail('installed font library index contains an invalid package record.');
      }
    }
    return value;
  }

  initialize({ required = false } = {}) {
    if (!fs.existsSync(path.join(this.bundledRoot, 'font-package.json'))) {
      if (required) fail('the first-install font package is missing from the application resources.');
      this.initialized = true;
      this.packages = [];
      return { available: false, installedPackageIds: [], message: 'The first-install font package is not present in this development build.' };
    }

    const installed = this.installPackage(this.bundledRoot);
    return {
      available: true,
      packageVersion: installed.version,
      installedPackageIds: this.list().installedPackageIds,
      familyCount: installed.familyCount
    };
  }

  packageSummary(verified) {
    return {
      packageId: verified.manifest.packageId,
      version: verified.manifest.version,
      familyCount: verified.manifest.catalogue.familyCount,
      fontFileCount: verified.manifest.catalogue.fontFileCount
    };
  }

  list() {
    if (!this.initialized) return { available: false, packages: [], installedPackageIds: [], families: [] };
    const families = [];
    const installedPackageIds = [];
    for (const verified of this.packages) {
      const detailsById = new Map(verified.details.families.map(item => [item.id, item]));
      for (const font of verified.catalogue.fonts) {
        installedPackageIds.push(font.id);
        const details = detailsById.get(font.id);
        const detailsByPath = new Map((details?.files || []).map(item => [item.path, item]));
        const faces = font.files.map(file => {
          const faceDetails = detailsByPath.get(file.path);
          if (!faceDetails || typeof faceDetails.fullName !== 'string' || !faceDetails.fullName.trim()) {
            fail('installed font face metadata is incomplete for ' + font.family + '.');
          }
          return {
            faceName: faceDetails.fullName,
            ...(faceDetails.postScriptName ? { postScriptName: faceDetails.postScriptName } : {}),
            style: file.face.style,
            weight: file.face.weight,
            italic: file.face.italic,
            oblique: file.face.oblique,
            axes: file.face.axes,
            ...(Array.isArray(faceDetails.scripts) ? { scripts: faceDetails.scripts } : {})
          };
        });
        families.push({
          familyName: font.family,
          packageId: font.id,
          version: font.version,
          faces
        });
      }
    }
    families.sort((left, right) => left.familyName.localeCompare(right.familyName, 'en', { sensitivity: 'base' }));
    return {
      available: families.length > 0,
      packages: this.packages.map(item => this.packageSummary(item)),
      installedPackageIds: [...new Set(installedPackageIds)].sort(),
      families
    };
  }

  getStylesheetUrls() {
    if (!this.initialized) return [];
    return this.packages.map(verified => pathToFileURL(path.join(
      this.packagesRoot,
      verified.manifest.version,
      'fonts.css'
    )).href);
  }
}

module.exports = { FontLibraryService, validateFontPackage: validatePackage };
