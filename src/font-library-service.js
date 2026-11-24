'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { pathToFileURL } = require('node:url');

const VERSION_PATTERN = /^[0-9]+\.[0-9]+\.[0-9]+(?:[-+][A-Za-z0-9.-]+)?$/;
const FONT_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const FONT_FORMATS = new Set(['ttf', 'otf']);

function fail(message) {
  throw new Error('Brightdesk Fonts: ' + message);
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

function walkPackageFiles(rootDir, currentDir = rootDir, result = []) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name, 'en'));
  for (const entry of entries) {
    const absolute = path.join(currentDir, entry.name);
    const relative = path.relative(rootDir, absolute).split(path.sep).join('/');
    if (!safeRelativePath(relative)) fail('unsafe package path: ' + relative);
    const stat = fs.lstatSync(absolute);
    if (stat.isSymbolicLink()) fail('symbolic links are not accepted: ' + relative);
    if (stat.isDirectory()) {
      walkPackageFiles(rootDir, absolute, result);
    } else if (stat.isFile()) {
      const bytes = fs.readFileSync(absolute);
      result.push({ path: relative, size: bytes.length, sha256: sha256(bytes) });
    } else {
      fail('unsupported package filesystem entry: ' + relative);
    }
  }
  return result.sort((left, right) => left.path.localeCompare(right.path, 'en'));
}

function validateFontPackage(rootDir) {
  const root = path.resolve(rootDir);
  const packagePath = path.join(root, 'package.json');
  const cataloguePath = path.join(root, 'catalogue.json');
  const stylesheetPath = path.join(root, 'fonts.css');
  const packageInfo = readJson(packagePath, 'font package metadata');
  const catalogue = readJson(cataloguePath, 'font catalogue');

  if (!isRecord(packageInfo) ||
      packageInfo.name !== '@brightdesk/fonts' ||
      !VERSION_PATTERN.test(String(packageInfo.version || '')) ||
      !Array.isArray(packageInfo.files) ||
      !packageInfo.files.includes('assets') ||
      !packageInfo.files.includes('catalogue.json') ||
      !packageInfo.files.includes('fonts.css') ||
      !packageInfo.files.includes('licenses')) {
    fail('package.json does not identify the approved Brightdesk shared font package.');
  }
  if (!isRecord(catalogue) || catalogue.schemaVersion !== 1 || !Array.isArray(catalogue.fonts) || !catalogue.fonts.length) {
    fail('catalogue.json must contain at least one family using schema version 1.');
  }
  if (!fs.statSync(stylesheetPath).isFile()) fail('fonts.css is missing.');

  const files = walkPackageFiles(root);
  const fileByPath = new Map(files.map(item => [item.path, item]));
  const familyIds = new Set();
  const familyNames = new Set();
  const usedAssets = new Set();

  for (const [index, font] of catalogue.fonts.entries()) {
    const label = 'catalogue.fonts[' + index + ']';
    if (!isRecord(font) ||
        typeof font.id !== 'string' ||
        !FONT_ID_PATTERN.test(font.id) ||
        typeof font.family !== 'string' ||
        !font.family.trim() ||
        !isRecord(font.license) ||
        font.license.redistributionAllowed !== true ||
        font.license.applicationEmbeddingAllowed !== true ||
        !safeRelativePath(font.license.textFile) ||
        !font.license.textFile.startsWith('licenses/') ||
        !Array.isArray(font.files) ||
        !font.files.length) {
      fail(label + ' is not an approved font family with redistribution and application-embedding rights.');
    }
    if (familyIds.has(font.id)) fail('duplicate font family ID: ' + font.id);
    familyIds.add(font.id);
    const familyKey = font.family.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
    if (familyNames.has(familyKey)) fail('duplicate canonical family name: ' + font.family);
    familyNames.add(familyKey);

    const licenseFile = fileByPath.get(font.license.textFile);
    if (!licenseFile || licenseFile.size === 0) fail(label + ' is missing its complete licence text file.');

    for (const [fileIndex, fontFile] of font.files.entries()) {
      const fileLabel = label + '.files[' + fileIndex + ']';
      if (!isRecord(fontFile) ||
          !safeRelativePath(fontFile.path) ||
          !fontFile.path.startsWith('assets/fonts/') ||
          !FONT_FORMATS.has(String(fontFile.format).toLowerCase()) ||
          !SHA256_PATTERN.test(String(fontFile.sha256 || '')) ||
          !isRecord(fontFile.face) ||
          !fileByPath.has(fontFile.path)) {
        fail(fileLabel + ' contains invalid or missing desktop font data.');
      }
      const actual = fileByPath.get(fontFile.path);
      if (actual.sha256 !== fontFile.sha256) fail(fileLabel + ' SHA-256 does not match its font binary.');
      if (path.extname(fontFile.path).slice(1).toLowerCase() !== String(fontFile.format).toLowerCase()) {
        fail(fileLabel + ' file extension does not match its declared font format.');
      }
      if (usedAssets.has(fontFile.path)) fail('a font binary is registered more than once: ' + fontFile.path);
      usedAssets.add(fontFile.path);
    }
  }

  const actualFontAssets = files.filter(file => file.path.startsWith('assets/fonts/') &&
    FONT_FORMATS.has(path.extname(file.path).slice(1).toLowerCase()));
  if (actualFontAssets.length !== usedAssets.size ||
      actualFontAssets.some(file => !usedAssets.has(file.path))) {
    fail('the package contains unregistered font binaries or missing catalogue entries.');
  }

  if (!fileByPath.has('index.cjs') || !fileByPath.has('fonts.css') ||
      !files.some(file => file.path.startsWith('licenses/'))) {
    fail('the font package is missing its API, stylesheet or licence notices.');
  }

  const packageDigest = sha256(Buffer.from(JSON.stringify(files)));
  return { root, packageInfo, catalogue, files, packageDigest };
}

function copyPackage(verified, destination) {
  fs.mkdirSync(destination, { recursive: true });
  for (const item of verified.files) {
    const source = path.join(verified.root, ...item.path.split('/'));
    const target = path.join(destination, ...item.path.split('/'));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }
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
    return validateFontPackage(packageRoot);
  }

  readIndex() {
    if (!fs.existsSync(this.indexPath)) return { schemaVersion: 1, packages: [] };
    const value = readJson(this.indexPath, 'shared font package index');
    if (!isRecord(value) || value.schemaVersion !== 1 || !Array.isArray(value.packages)) {
      fail('the shared font package index is invalid.');
    }
    for (const item of value.packages) {
      if (!isRecord(item) ||
          !VERSION_PATTERN.test(String(item.version || '')) ||
          !SHA256_PATTERN.test(String(item.packageSha256 || ''))) {
        fail('the shared font package index contains an invalid record.');
      }
    }
    return value;
  }

  writeIndex(packages) {
    fs.mkdirSync(this.sharedRoot, { recursive: true });
    const next = {
      schemaVersion: 1,
      packages: [...packages].sort((left, right) =>
        left.version.localeCompare(right.version, 'en', { numeric: true })
      )
    };
    const temporary = path.join(this.sharedRoot, '.installed-' + process.pid + '.tmp');
    fs.writeFileSync(temporary, JSON.stringify(next, null, 2) + '\n', { mode: 0o600 });
    fs.renameSync(temporary, this.indexPath);
    return next;
  }

  loadInstalledPackages() {
    const index = this.readIndex();
    const packages = [];
    for (const record of index.packages) {
      const root = path.join(this.packagesRoot, record.version);
      if (!root.startsWith(this.packagesRoot + path.sep)) fail('installed package version escaped the shared font store.');
      const verified = validateFontPackage(root);
      if (verified.packageDigest !== record.packageSha256) {
        fail('an installed font package has changed on disk: ' + record.version);
      }
      if (verified.packageInfo.version !== record.version) {
        fail('installed font package version does not match its index record.');
      }
      packages.push(verified);
    }
    this.packages = packages;
    this.initialized = true;
  }

  installPackage(packageRoot) {
    const verified = validateFontPackage(packageRoot);
    const version = verified.packageInfo.version;
    const target = path.join(this.packagesRoot, version);
    if (!target.startsWith(this.packagesRoot + path.sep)) fail('package version escaped the shared font store.');

    fs.mkdirSync(this.packagesRoot, { recursive: true });
    if (fs.existsSync(target)) {
      const existing = validateFontPackage(target);
      if (existing.packageDigest !== verified.packageDigest) {
        fail('an installed package version cannot be replaced with different contents.');
      }
    } else {
      const staging = fs.mkdtempSync(path.join(this.packagesRoot, '.staging-'));
      try {
        copyPackage(verified, staging);
        const copied = validateFontPackage(staging);
        if (copied.packageDigest !== verified.packageDigest) {
          fail('font package changed while it was being installed.');
        }
        fs.renameSync(staging, target);
      } catch (error) {
        fs.rmSync(staging, { recursive: true, force: true });
        throw error;
      }
    }

    const previous = this.readIndex();
    const records = new Map(previous.packages.map(item => [item.version, item]));
    records.set(version, {
      version,
      packageSha256: verified.packageDigest
    });
    this.writeIndex(records.values());
    this.loadInstalledPackages();
    return this.packageSummary(verified);
  }

  initialize({ required = false } = {}) {
    if (!fs.existsSync(path.join(this.bundledRoot, 'package.json'))) {
      if (required) fail('the bundled first-install font package is missing from the application resources.');
      this.loadInstalledPackages();
      return {
        available: this.packages.length > 0,
        packages: this.packages.map(item => this.packageSummary(item)),
        installedPackageIds: this.list().installedPackageIds,
        families: this.list().families
      };
    }
    const result = this.installPackage(this.bundledRoot);
    return {
      available: true,
      packageVersion: result.version,
      familyCount: result.familyCount,
      installedPackageIds: this.list().installedPackageIds,
      families: this.list().families
    };
  }

  packageSummary(verified) {
    return {
      version: verified.packageInfo.version,
      familyCount: verified.catalogue.fonts.length,
      fontFileCount: verified.catalogue.fonts.reduce((sum, font) => sum + font.files.length, 0)
    };
  }

  list() {
    if (!this.initialized) return { available: false, packages: [], installedPackageIds: [], families: [] };
    const familiesByName = new Map();
    const installedPackageIds = [];
    for (const verified of this.packages) {
      for (const font of verified.catalogue.fonts) {
        installedPackageIds.push(font.id);
        const key = font.family.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en');
        const existing = familiesByName.get(key);
        if (!existing) {
          familiesByName.set(key, {
            familyName: font.family,
            packageId: font.id,
            version: verified.packageInfo.version,
            styles: [...font.styles],
            scripts: [...font.scripts],
            availability: 'ready'
          });
        } else {
          existing.styles = [...new Set([...existing.styles, ...font.styles])];
          existing.scripts = [...new Set([...existing.scripts, ...font.scripts])];
        }
      }
    }
    const families = [...familiesByName.values()].sort((left, right) =>
      left.familyName.localeCompare(right.familyName, 'en', { sensitivity: 'base' })
    );
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
      verified.packageInfo.version,
      'fonts.css'
    )).href);
  }
}

module.exports = { FontLibraryService, validateFontPackage };
