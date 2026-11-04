'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const dictionaryCatalogue = require('./dictionary-catalog.json');

const CATALOGUE_REVISION = dictionaryCatalogue.catalogueRevision;
const CATALOGUE_RAW_ROOT = `https://raw.githubusercontent.com/wooorm/dictionaries/${CATALOGUE_REVISION}/dictionaries`;
const CATALOGUE_WEB_ROOT = `https://github.com/wooorm/dictionaries/tree/${CATALOGUE_REVISION}/dictionaries`;

const OPEN_SOURCE_LICENSES = new Set([
  'MIT', 'ISC', 'BSD', 'BSD-2-Clause', 'BSD-3-Clause', 'Apache-2.0',
  'GPL-2.0', 'GPL-2.0-only', 'GPL-2.0-or-later', 'GPL-3.0', 'GPL-3.0-only', 'GPL-3.0-or-later',
  'LGPL-2.1', 'LGPL-2.1-only', 'LGPL-2.1-or-later', 'LGPL-3.0', 'LGPL-3.0-only', 'LGPL-3.0-or-later',
  'AGPL-3.0', 'EUPL-1.1', 'LPPL-1.3c', 'SISSL',
  'MPL-1.1', 'MPL-2.0', 'CC0-1.0', 'CC-BY-3.0', 'CC-BY-4.0',
  'CC-BY-SA-3.0', 'CC-BY-SA-4.0', 'OFL-1.1', 'Unlicense',
  'LicenseRef-Public-Domain', 'LicenseRef-SCOWL'
]);

const MAX_BUNDLE_BYTES = 75 * 1024 * 1024;
const MAX_AFFIX_BYTES = 8 * 1024 * 1024;
const MAX_DICTIONARY_BYTES = 60 * 1024 * 1024;
const MAX_LICENSE_BYTES = 2 * 1024 * 1024;
const MAX_README_BYTES = 1024 * 1024;
const MAX_TEXT_LENGTH = 200_000;
const MAX_UNIQUE_MISSPELLINGS = 200;
const UPSTREAM_FETCH_TIMEOUT_MS = 30_000;
const CATALOGUE_IMPORT_TOKEN = Symbol('protected-catalogue-install');
const PROTECTED_FILE_MODE = 0o444;
const PROTECTED_DIRECTORY_MODE = 0o555;

function safeFileName(value, fieldName) {
  if (typeof value !== 'string' || !value.trim() || value !== path.basename(value) || value.includes('..') || /[\\/\0]/.test(value)) {
    throw new Error(`${fieldName} must be a simple file name with no folder path.`);
  }
  return value;
}

function validateLicenseExpression(expression) {
  if (typeof expression !== 'string' || !expression.trim() || expression.length > 200) {
    throw new Error('A recognised open-source dictionary licence is required.');
  }
  const normalized = expression.trim().replace(/\s+/g, ' ');
  const parts = normalized.split(/\s+(?:OR|AND)\s+/);
  const identifiers = parts.map(part => part.replace(/^\(|\)$/g, ''));
  const validSyntax = parts.every(part => /^\(?[A-Za-z0-9.+-]+\)?$/.test(part));
  if (!validSyntax || identifiers.length === 0 || identifiers.some(id => !OPEN_SOURCE_LICENSES.has(id))) {
    throw new Error('This licence is not on Brightdesk’s approved free/open-source licence list. Check the original dictionary terms before importing it.');
  }
  return normalized;
}

function decodeHunspellFiles(affBytes, dicBytes) {
  const prefix = new TextDecoder('ascii').decode(affBytes.slice(0, 2048));
  const match = prefix.match(/^\s*SET\s+([^\s#]+)/im);
  const declared = (match?.[1] || 'UTF-8').toUpperCase().replace(/_/g, '-');
  const encodingAliases = {
    UTF8: 'utf-8', 'UTF-8': 'utf-8',
    'ISO8859-1': 'windows-1252', 'ISO-8859-1': 'windows-1252',
    'ISO8859-2': 'iso-8859-2', 'ISO-8859-2': 'iso-8859-2',
    'ISO8859-5': 'iso-8859-5', 'ISO-8859-5': 'iso-8859-5',
    'ISO8859-7': 'iso-8859-7', 'ISO-8859-7': 'iso-8859-7',
    'ISO8859-9': 'iso-8859-9', 'ISO-8859-9': 'iso-8859-9',
    'ISO8859-13': 'iso-8859-13', 'ISO-8859-13': 'iso-8859-13',
    'ISO8859-15': 'iso-8859-15', 'ISO-8859-15': 'iso-8859-15',
    CP1250: 'windows-1250', CP1251: 'windows-1251', CP1252: 'windows-1252',
    'WINDOWS-1250': 'windows-1250', 'WINDOWS-1251': 'windows-1251', 'WINDOWS-1252': 'windows-1252',
    'KOI8-R': 'koi8-r', 'KOI8-U': 'koi8-u', 'TIS-620': 'windows-874',
    GB18030: 'gb18030', BIG5: 'big5', 'EUC-JP': 'euc-jp', 'SHIFT-JIS': 'shift_jis', 'EUC-KR': 'euc-kr'
  };
  const label = encodingAliases[declared] || declared.toLowerCase();
  let decoder;
  try { decoder = new TextDecoder(label); }
  catch { throw new Error(`The Hunspell dictionary declares an unsupported character encoding: ${declared}.`); }
  return {
    aff: decoder.decode(affBytes).replace(/^\uFEFF/, ''),
    dic: decoder.decode(dicBytes).replace(/^\uFEFF/, ''),
    encoding: label
  };
}

function validateDictionaryManifest(manifest) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) throw new Error('Dictionary manifest must be a JSON object.');
  if (manifest.schemaVersion !== 1) throw new Error('Unsupported dictionary bundle format. Expected schemaVersion 1.');
  if (typeof manifest.locale !== 'string' || !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(manifest.locale)) throw new Error('Dictionary locale must be a valid language tag, such as en-AU or fr-FR.');
  for (const field of ['name', 'nativeName', 'authors']) {
    if (typeof manifest[field] !== 'string' || !manifest[field].trim() || manifest[field].length > (field === 'authors' ? 500 : 120)) {
      throw new Error(`Dictionary manifest field “${field}” is required and must be short text.`);
    }
  }
  for (const field of ['affFile', 'dicFile', 'licenseFile']) safeFileName(manifest[field], field);
  if (manifest.readmeFile !== undefined) safeFileName(manifest.readmeFile, 'readmeFile');
  if (!manifest.affFile.toLowerCase().endsWith('.aff')) throw new Error('affFile must point to a .aff Hunspell affix file.');
  if (!manifest.dicFile.toLowerCase().endsWith('.dic')) throw new Error('dicFile must point to a .dic Hunspell word-list file.');
  const namedFiles = [manifest.affFile, manifest.dicFile, manifest.licenseFile, manifest.readmeFile].filter(Boolean);
  if (new Set(namedFiles).size !== namedFiles.length) throw new Error('Dictionary, licence and attribution files must have different names.');
  for (const field of ['sourceUrl', 'licenseUrl']) {
    if (typeof manifest[field] !== 'string' || !/^https:\/\//i.test(manifest[field]) || manifest[field].length > 2_000) {
      throw new Error(`${field} must be an HTTPS link to the original source or licence.`);
    }
  }
  validateLicenseExpression(manifest.license);
  if (manifest.catalogueId !== undefined && (typeof manifest.catalogueId !== 'string' || !/^[a-z0-9-]{2,32}$/.test(manifest.catalogueId))) {
    throw new Error('Dictionary catalogue identity is invalid.');
  }
  if (manifest.integrity !== undefined) {
    if (!manifest.integrity || typeof manifest.integrity !== 'object' || Array.isArray(manifest.integrity)) throw new Error('Dictionary integrity record is invalid.');
    for (const key of ['aff', 'dic', 'license', 'readme']) {
      if (typeof manifest.integrity[key] !== 'string' || !/^[a-f0-9]{64}$/.test(manifest.integrity[key])) throw new Error(`Dictionary integrity hash ${key} is missing or invalid.`);
    }
  }
  return manifest;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function catalogueEntryForManifest(manifest) {
  const entry = dictionaryCatalogue.entries.find(item => item.id === manifest.catalogueId || item.locale.toLowerCase() === manifest.locale.toLowerCase());
  if (!entry) throw new Error('Only dictionaries from the protected Brightdesk catalogue can be installed or used.');
  const sourceUrl = `${CATALOGUE_WEB_ROOT}/${entry.sourceFolder}`;
  const licenseUrl = entry.licenseSource?.url || `${CATALOGUE_RAW_ROOT}/${entry.sourceFolder}/license`;
  const expectedLicenseSource = entry.licenseSource || { kind: 'dictionary-package-license', repository: 'wooorm/dictionaries', revision: CATALOGUE_REVISION };
  if (manifest.locale !== entry.locale || manifest.name !== entry.name || manifest.nativeName !== entry.nativeName ||
      manifest.license !== entry.license || manifest.sourceUrl !== sourceUrl || manifest.licenseUrl !== licenseUrl ||
      manifest.upstream !== 'wooorm/dictionaries' || manifest.upstreamRevision !== CATALOGUE_REVISION ||
      (manifest.catalogueId !== undefined && manifest.catalogueId !== entry.id) ||
      JSON.stringify(manifest.licenseSource || expectedLicenseSource) !== JSON.stringify(expectedLicenseSource)) {
    throw new Error('Protected dictionary details or licence do not match Brightdesk’s built-in catalogue. The dictionary was not changed.');
  }
  return entry;
}

class DictionaryService {
  constructor(userDataPath, options = {}) {
    if (typeof userDataPath !== 'string' || !userDataPath.trim()) throw new TypeError('A user data folder is required.');
    this.root = path.join(userDataPath, 'dictionaries');
    this.spellFactory = options.spellFactory || (dictionary => require('nspell')(dictionary));
    this.fetch = options.fetch || globalThis.fetch;
    this.cache = new Map();
  }

  async ensureRoot() {
    await fs.mkdir(this.root, { recursive: true });
    return this.root;
  }

  async verifyInstalledIntegrity(folder, manifest) {
    if (!manifest.integrity) throw new Error(`The ${manifest.locale} dictionary is a legacy installation without an integrity record. Select Install in the protected catalogue to verify it against its original source before use.`);
    const files = {
      aff: 'dictionary.aff',
      dic: 'dictionary.dic',
      license: 'LICENSE.txt',
      readme: manifest.readmeFile || 'UPSTREAM_README.md'
    };
    const limits = { aff: MAX_AFFIX_BYTES, dic: MAX_DICTIONARY_BYTES, license: MAX_LICENSE_BYTES, readme: MAX_README_BYTES };
    const loaded = {};
    for (const [key, filename] of Object.entries(files)) {
      const bytes = await fs.readFile(path.join(folder, filename));
      if (!bytes.length || bytes.byteLength > limits[key]) throw new Error(`Protected ${key} resource for ${manifest.locale} is missing or exceeds its size limit.`);
      loaded[key] = bytes;
      if (manifest.integrity && sha256(bytes) !== manifest.integrity[key]) {
        throw new Error(`Protected ${key} resource for ${manifest.locale} has changed. Brightdesk refused to load it.`);
      }
    }
    const licenseText = loaded.license.toString('utf8');
    const readmeText = loaded.readme.toString('utf8');
    if (licenseText.trim().length < 40 || readmeText.trim().length < 40 || licenseText.includes('\0') || readmeText.includes('\0')) {
      throw new Error(`Protected licence or attribution record for ${manifest.locale} is invalid.`);
    }
    const decoded = decodeHunspellFiles(loaded.aff, loaded.dic);
    if (!decoded.aff.trim() || !/^\s*\d+\s*(?:\r?\n)/.test(decoded.dic)) throw new Error(`Protected Hunspell files for ${manifest.locale} are invalid.`);
  }

  async protectInstalledFolder(folder, manifest) {
    const filenames = ['manifest.json', 'dictionary.aff', 'dictionary.dic', 'LICENSE.txt'];
    if (manifest.readmeFile) filenames.push(manifest.readmeFile);
    for (const filename of filenames) await fs.chmod(path.join(folder, filename), PROTECTED_FILE_MODE).catch(() => {});
    await fs.chmod(folder, PROTECTED_DIRECTORY_MODE).catch(() => {});
  }

  catalogue() {
    return dictionaryCatalogue.entries.map(entry => ({
      id: entry.id,
      catalogueId: entry.id,
      locale: entry.locale,
      name: entry.name,
      nativeName: entry.nativeName,
      license: entry.license,
      sourceUrl: `${CATALOGUE_WEB_ROOT}/${entry.sourceFolder}`,
      licenseUrl: entry.licenseSource?.url || `${CATALOGUE_RAW_ROOT}/${entry.sourceFolder}/license`,
      licenseSource: entry.licenseSource || { kind: 'dictionary-package-license', repository: 'wooorm/dictionaries', revision: CATALOGUE_REVISION },
      upstream: 'wooorm/dictionaries',
      upstreamRevision: CATALOGUE_REVISION,
      catalogueSnapshotDate: dictionaryCatalogue.catalogueSnapshotDate,
      engineSupport: entry.engineSupport
    }));
  }

  async fetchUpstreamFile(url, maxBytes) {
    const parsed = new URL(url);
    const allowedPathPrefixes = [
      `/wooorm/dictionaries/${CATALOGUE_REVISION}/dictionaries/`
    ];
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'raw.githubusercontent.com' || parsed.search || parsed.hash ||
        parsed.pathname.includes('..') || !allowedPathPrefixes.some(prefix => parsed.pathname.startsWith(prefix))) {
      throw new Error('Dictionary download URL is outside the pinned, approved upstream sources.');
    }
    if (typeof this.fetch !== 'function') throw new Error('This runtime does not provide a secure HTTPS fetch implementation.');
    const response = await this.fetch(parsed.toString(), {
      method: 'GET',
      redirect: 'error',
      signal: AbortSignal.timeout(UPSTREAM_FETCH_TIMEOUT_MS),
      headers: { 'Accept': 'application/octet-stream' }
    });
    if (!response.ok || !response.body) throw new Error(`The upstream dictionary file could not be downloaded (HTTP ${response.status}).`);
    const declaredLength = Number(response.headers.get('content-length'));
    if (Number.isFinite(declaredLength) && declaredLength > maxBytes) throw new Error('The upstream dictionary file exceeds Brightdesk’s download size limit.');

    const reader = response.body.getReader();
    const chunks = [];
    let total = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.byteLength;
        if (total > maxBytes) {
          await reader.cancel();
          throw new Error('The upstream dictionary file exceeds Brightdesk’s download size limit.');
        }
        chunks.push(Buffer.from(value));
      }
    } finally {
      reader.releaseLock();
    }
    if (total === 0) throw new Error('The upstream dictionary file was empty.');
    return Buffer.concat(chunks, total);
  }

  async installCatalogueEntry(id) {
    if (typeof id !== 'string' || !/^[a-z0-9-]{2,32}$/.test(id)) throw new Error('Choose a valid dictionary from the Brightdesk catalogue.');
    const entry = dictionaryCatalogue.entries.find(item => item.id === id);
    if (!entry) throw new Error('That dictionary is not in the built-in catalogue.');
    validateLicenseExpression(entry.license);
    await this.ensureRoot();
    const destination = path.join(this.root, entry.locale);
    let destinationExists = true;
    try { await fs.access(destination); }
    catch (error) { if (error.code === 'ENOENT') destinationExists = false; else throw error; }
    if (destinationExists) {
      try {
        const existingManifest = validateDictionaryManifest(JSON.parse(await fs.readFile(path.join(destination, 'manifest.json'), 'utf8')));
        catalogueEntryForManifest(existingManifest);
        if (!existingManifest.integrity) {
          // 0.3.6 dictionaries predate integrity hashes. Verify their bytes against the exact pinned upstream files before trusting them.
          const sourceRoot = `${CATALOGUE_RAW_ROOT}/${entry.sourceFolder}`;
          const [sourceAff, sourceDic, sourceReadme] = await Promise.all([
            this.fetchUpstreamFile(`${sourceRoot}/index.aff`, MAX_AFFIX_BYTES),
            this.fetchUpstreamFile(`${sourceRoot}/index.dic`, MAX_DICTIONARY_BYTES),
            this.fetchUpstreamFile(`${sourceRoot}/readme.md`, MAX_README_BYTES)
          ]);
          const sourceLicense = entry.licenseSource?.kind === 'bundled-standard-license'
            ? await fs.readFile(path.join(__dirname, 'licenses', safeFileName(entry.licenseSource.file, 'licence source file')))
            : await this.fetchUpstreamFile(`${sourceRoot}/license`, MAX_LICENSE_BYTES);
          const decodedSource = decodeHunspellFiles(sourceAff, sourceDic);
          const [installedAff, installedDic, installedLicense, installedReadme] = await Promise.all([
            fs.readFile(path.join(destination, 'dictionary.aff'), 'utf8'),
            fs.readFile(path.join(destination, 'dictionary.dic'), 'utf8'),
            fs.readFile(path.join(destination, 'LICENSE.txt'), 'utf8'),
            fs.readFile(path.join(destination, existingManifest.readmeFile || 'UPSTREAM_README.md'), 'utf8')
          ]);
          if (installedAff !== decodedSource.aff || installedDic !== decodedSource.dic ||
              installedLicense !== sourceLicense.toString('utf8').replace(/^\uFEFF/, '') ||
              installedReadme !== sourceReadme.toString('utf8').replace(/^\uFEFF/, '')) {
            throw new Error('The legacy dictionary files do not match the original pinned dictionary, licence and attribution. Brightdesk refused to trust or replace them.');
          }
          const integrity = {
            aff: sha256(Buffer.from(installedAff, 'utf8')),
            dic: sha256(Buffer.from(installedDic, 'utf8')),
            license: sha256(Buffer.from(installedLicense, 'utf8')),
            readme: sha256(Buffer.from(installedReadme, 'utf8'))
          };
          const upgradedManifest = { ...existingManifest, catalogueId: entry.id, integrity };
          await fs.chmod(destination, 0o755).catch(() => {});
          await fs.chmod(path.join(destination, 'manifest.json'), 0o644).catch(() => {});
          const temporaryManifest = path.join(destination, `.manifest-${crypto.randomUUID()}.tmp`);
          await fs.writeFile(temporaryManifest, JSON.stringify(upgradedManifest, null, 2), { flag: 'wx', mode: 0o644 });
          await fs.rename(temporaryManifest, path.join(destination, 'manifest.json'));
          existingManifest.catalogueId = upgradedManifest.catalogueId;
          existingManifest.integrity = upgradedManifest.integrity;
        }
        await this.verifyInstalledIntegrity(destination, existingManifest);
        await this.protectInstalledFolder(destination, existingManifest);
        return { locale: entry.locale, name: entry.name, license: entry.license, alreadyInstalled: true, integrityVerified: true };
      } catch (error) {
        throw new Error(`The ${entry.locale} dictionary already has a protected or unrecognised installation and cannot be replaced. ${error.message}`);
      }
    }

    const sourceRoot = `${CATALOGUE_RAW_ROOT}/${entry.sourceFolder}`;
    const licenseUrl = entry.licenseSource?.url || `${sourceRoot}/license`;
    const [affBytes, dicBytes, readmeBytes] = await Promise.all([
      this.fetchUpstreamFile(`${sourceRoot}/index.aff`, MAX_AFFIX_BYTES),
      this.fetchUpstreamFile(`${sourceRoot}/index.dic`, MAX_DICTIONARY_BYTES),
      this.fetchUpstreamFile(`${sourceRoot}/readme.md`, MAX_README_BYTES)
    ]);
    const licenseBytes = entry.licenseSource?.kind === 'bundled-standard-license'
      ? await fs.readFile(path.join(__dirname, 'licenses', safeFileName(entry.licenseSource.file, 'licence source file')))
      : await this.fetchUpstreamFile(`${sourceRoot}/license`, MAX_LICENSE_BYTES);
    const normalizedSource = decodeHunspellFiles(affBytes, dicBytes);
    const licenseText = licenseBytes.toString('utf8').replace(/^\uFEFF/, '');
    const readmeText = readmeBytes.toString('utf8').replace(/^\uFEFF/, '');
    if (licenseText.trim().length < 40 || licenseText.includes('\0')) throw new Error('The upstream licence text is missing or unreadable.');
    if (readmeText.trim().length < 40 || readmeText.includes('\0')) throw new Error('The upstream dictionary attribution README is missing or unreadable.');

    const manifest = {
      schemaVersion: 1,
      catalogueId: entry.id,
      locale: entry.locale,
      name: entry.name,
      nativeName: entry.nativeName,
      authors: 'See UPSTREAM_README.md for the normalized package authors, original dictionary source, and contributor references.',
      affFile: 'index.aff',
      dicFile: 'index.dic',
      licenseFile: 'LICENSE.txt',
      readmeFile: 'UPSTREAM_README.md',
      license: entry.license,
      licenseUrl,
      licenseSource: entry.licenseSource || { kind: 'dictionary-package-license', repository: 'wooorm/dictionaries', revision: CATALOGUE_REVISION },
      sourceUrl: `${CATALOGUE_WEB_ROOT}/${entry.sourceFolder}`,
      upstream: 'wooorm/dictionaries',
      upstreamRevision: CATALOGUE_REVISION,
      upstreamLicenseRevision: entry.licenseSource?.revision || null,
      integrity: {
        aff: sha256(Buffer.from(normalizedSource.aff, 'utf8')),
        dic: sha256(Buffer.from(normalizedSource.dic, 'utf8')),
        license: sha256(Buffer.from(licenseText, 'utf8')),
        readme: sha256(Buffer.from(readmeText, 'utf8'))
      }
    };
    validateDictionaryManifest(manifest);

    const JSZip = require('jszip');
    const zip = new JSZip();
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));
    zip.file('index.aff', affBytes);
    zip.file('index.dic', dicBytes);
    zip.file('LICENSE.txt', licenseBytes);
    zip.file('UPSTREAM_README.md', readmeBytes);
    const bundleBytes = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 6 } });
    if (bundleBytes.byteLength > MAX_BUNDLE_BYTES) throw new Error('The prepared dictionary bundle exceeds Brightdesk’s size limit.');

    await this.ensureRoot();
    const temporaryBundle = path.join(this.root, `.catalog-${crypto.randomUUID()}.bddict`);
    await fs.writeFile(temporaryBundle, bundleBytes, { flag: 'wx' });
    try {
      return await this.importBundle(temporaryBundle, CATALOGUE_IMPORT_TOKEN);
    } finally {
      await fs.rm(temporaryBundle, { force: true }).catch(() => {});
    }
  }

  async readBundle(bundlePath) {
    const stat = await fs.stat(bundlePath);
    if (!stat.isFile() || stat.size <= 0 || stat.size > MAX_BUNDLE_BYTES) throw new Error('Dictionary bundle must be a file smaller than 75 MB.');
    const JSZip = require('jszip');
    const zip = await JSZip.loadAsync(await fs.readFile(bundlePath));
    const names = Object.keys(zip.files).filter(name => !zip.files[name].dir);
    if (names.some(name => name.includes('/') || name.includes('\\') || name === '.' || name === '..')) {
      throw new Error('Dictionary bundle files must be stored at the top level, not inside folders.');
    }
    const manifests = names.filter(name => name.toLowerCase() === 'manifest.json');
    if (manifests.length !== 1) throw new Error('The bundle must contain exactly one manifest.json file.');
    const manifestObject = zip.file(manifests[0]);
    if (!manifestObject || manifestObject._data?.uncompressedSize > 64 * 1024) throw new Error('Dictionary manifest is too large.');
    const manifest = validateDictionaryManifest(JSON.parse(await manifestObject.async('string')));
    catalogueEntryForManifest(manifest);
    const required = [manifest.affFile, manifest.dicFile, manifest.licenseFile, ...(manifest.readmeFile ? [manifest.readmeFile] : [])];
    for (const name of required) {
      if (!names.includes(name)) throw new Error(`The bundle is missing ${name}.`);
      const entry = zip.file(name);
      const maxBytes = name === manifest.affFile ? MAX_AFFIX_BYTES
        : name === manifest.dicFile ? MAX_DICTIONARY_BYTES
        : name === manifest.licenseFile ? MAX_LICENSE_BYTES : MAX_README_BYTES;
      if (!entry || entry._data?.uncompressedSize > maxBytes) throw new Error(`${name} is larger than the allowed size.`);
    }
    const fileBytes = await Promise.all(required.map(name => zip.file(name).async('uint8array')));
    const [affBytes, dicBytes, licenseBytes, readmeBytes] = fileBytes;
    if (affBytes.byteLength > MAX_AFFIX_BYTES || dicBytes.byteLength > MAX_DICTIONARY_BYTES || licenseBytes.byteLength > MAX_LICENSE_BYTES ||
        (readmeBytes && readmeBytes.byteLength > MAX_README_BYTES)) {
      throw new Error('One or more dictionary files exceed Brightdesk’s size limits.');
    }
    const decoded = decodeHunspellFiles(affBytes, dicBytes);
    const licenseText = new TextDecoder('utf-8').decode(licenseBytes).replace(/^\uFEFF/, '');
    const readmeText = readmeBytes ? new TextDecoder('utf-8').decode(readmeBytes).replace(/^\uFEFF/, '') : '';
    if (manifest.integrity) {
      const hashes = {
        aff: sha256(Buffer.from(decoded.aff, 'utf8')),
        dic: sha256(Buffer.from(decoded.dic, 'utf8')),
        license: sha256(Buffer.from(licenseText, 'utf8')),
        readme: sha256(Buffer.from(readmeText, 'utf8'))
      };
      for (const key of Object.keys(hashes)) if (hashes[key] !== manifest.integrity[key]) throw new Error(`The protected ${key} resource failed its integrity check.`);
    }
    const { aff, dic } = decoded;
    if (!aff.trim() || !dic.trim() || licenseText.trim().length < 40 || (manifest.readmeFile && readmeText.trim().length < 40)) throw new Error('The affix, word-list, licence and attribution files must contain readable text.');
    if (aff.includes('\0') || dic.includes('\0') || licenseText.includes('\0') || readmeText.includes('\0')) throw new Error('Dictionary files must be valid text files.');
    if (!/^\s*\d+\s*(?:\r?\n)/.test(dic)) throw new Error('The .dic file does not begin with a Hunspell word count.');
    return { manifest, aff, dic, licenseText, readmeText, encoding: decoded.encoding };
  }

  async importBundle(bundlePath, authorization) {
    if (authorization !== CATALOGUE_IMPORT_TOKEN) throw new Error('Custom dictionary imports are disabled. Dictionary files and licence terms are controlled by the protected Brightdesk catalogue.');
    const bundle = await this.readBundle(bundlePath);
    const catalogueEntry = catalogueEntryForManifest(bundle.manifest);
    // Parse the dictionary before saving it. This catches incompatible or damaged bundles early.
    const speller = this.spellFactory({ aff: bundle.aff, dic: bundle.dic });
    if (!speller || typeof speller.correct !== 'function' || typeof speller.suggest !== 'function') {
      throw new Error('The dictionary could not be loaded by Brightdesk’s spelling engine.');
    }
    await this.ensureRoot();
    const destination = path.join(this.root, bundle.manifest.locale);
    const staging = `${destination}.installing-${crypto.randomUUID()}`;
    try {
      await fs.access(destination);
      throw new Error(`The ${bundle.manifest.locale} dictionary is already installed and cannot be overwritten.`);
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
    await fs.mkdir(staging, { recursive: false });
    try {
      await Promise.all([
        fs.writeFile(path.join(staging, 'manifest.json'), JSON.stringify(bundle.manifest, null, 2), 'utf8'),
        fs.writeFile(path.join(staging, 'dictionary.aff'), bundle.aff, 'utf8'),
        fs.writeFile(path.join(staging, 'dictionary.dic'), bundle.dic, 'utf8'),
        fs.writeFile(path.join(staging, 'LICENSE.txt'), bundle.licenseText, 'utf8'),
        ...(bundle.manifest.readmeFile ? [fs.writeFile(path.join(staging, bundle.manifest.readmeFile), bundle.readmeText, 'utf8')] : [])
      ]);
      // Dictionary bytes, metadata, attribution and licence are immutable to normal app users.
      await this.protectInstalledFolder(staging, bundle.manifest);
      try { await fs.rename(staging, destination); }
      catch (error) {
        if (error.code === 'EEXIST' || error.code === 'ENOTEMPTY') throw new Error(`The ${catalogueEntry.locale} dictionary is already installed and cannot be overwritten.`);
        throw error;
      }
      this.cache.set(bundle.manifest.locale, speller);
      return { locale: bundle.manifest.locale, name: bundle.manifest.name, license: bundle.manifest.license, alreadyInstalled: false };
    } catch (error) {
      await fs.chmod(staging, 0o700).catch(() => {});
      await fs.rm(staging, { recursive: true, force: true }).catch(() => {});
      throw error;
    }
  }

  async installed() {
    await this.ensureRoot();
    const entries = await fs.readdir(this.root, { withFileTypes: true });
    const result = [];
    for (const entry of entries.filter(item => item.isDirectory() && /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(item.name))) {
      try {
        const folder = path.join(this.root, entry.name);
        const manifest = validateDictionaryManifest(JSON.parse(await fs.readFile(path.join(folder, 'manifest.json'), 'utf8')));
        if (manifest.locale !== entry.name) continue;
        catalogueEntryForManifest(manifest);
        await this.verifyInstalledIntegrity(folder, manifest);
        await this.protectInstalledFolder(folder, manifest);
        const [affStat, dicStat, licenseStat] = await Promise.all([
          fs.stat(path.join(folder, 'dictionary.aff')),
          fs.stat(path.join(folder, 'dictionary.dic')),
          fs.stat(path.join(folder, 'LICENSE.txt'))
        ]);
        if (affStat.size > MAX_AFFIX_BYTES || dicStat.size > MAX_DICTIONARY_BYTES || licenseStat.size < 40 || licenseStat.size > MAX_LICENSE_BYTES) continue;
        result.push({
          locale: manifest.locale,
          name: manifest.name,
          nativeName: manifest.nativeName,
          authors: manifest.authors,
          license: manifest.license,
          licenseUrl: manifest.licenseUrl,
          licenseSource: manifest.licenseSource || null,
          sourceUrl: manifest.sourceUrl,
          upstreamRevision: manifest.upstreamRevision || null,
          attributionFile: manifest.readmeFile || null,
          engine: 'nspell',
          engineReady: true,
          engineSupport: 'Hunspell subset; complex affix and compound features may not match native Hunspell',
          protected: true
        });
      } catch (error) {
        console.warn(`Skipping dictionary ${entry.name}: ${error.message}`);
      }
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  async remove(locale) {
    throw new Error('Dictionary removal is disabled. Brightdesk dictionary files, source attribution and licence terms are protected catalogue resources. Users may only choose which installed language to use.');
  }

  async loadSpeller(locale) {
    if (typeof locale !== 'string' || !/^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/.test(locale)) throw new Error('Choose an installed spelling dictionary first.');
    if (this.cache.has(locale)) return this.cache.get(locale);
    const folder = path.join(this.root, locale);
    const manifest = validateDictionaryManifest(JSON.parse(await fs.readFile(path.join(folder, 'manifest.json'), 'utf8')));
    if (manifest.locale !== locale) throw new Error('Dictionary folder and manifest do not match.');
    catalogueEntryForManifest(manifest);
    await this.verifyInstalledIntegrity(folder, manifest);
    await this.protectInstalledFolder(folder, manifest);
    const [aff, dic] = await Promise.all([
      fs.readFile(path.join(folder, 'dictionary.aff'), 'utf8'),
      fs.readFile(path.join(folder, 'dictionary.dic'), 'utf8')
    ]);
    const speller = this.spellFactory({ aff, dic });
    this.cache.set(locale, speller);
    return speller;
  }

  async checkText(locale, text) {
    if (typeof text !== 'string') throw new TypeError('Text to check must be a string.');
    if (text.length > MAX_TEXT_LENGTH) throw new Error(`Spell checking is limited to ${MAX_TEXT_LENGTH.toLocaleString()} characters at a time.`);
    const speller = await this.loadSpeller(locale);
    const words = new Map();
    let truncated = false;
    const expression = /[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu;
    for (const match of text.matchAll(expression)) {
      const word = match[0];
      if (word.length < 2 || word.length > 50 || speller.correct(word)) continue;
      const key = word.toLocaleLowerCase(locale);
      if (words.has(key)) {
        words.get(key).occurrences += 1;
        continue;
      }
      if (words.size >= MAX_UNIQUE_MISSPELLINGS) { truncated = true; continue; }
      words.set(key, {
        word,
        index: match.index,
        occurrences: 1,
        suggestions: speller.suggest(word).slice(0, 5)
      });
    }
    return {
      locale,
      checkedCharacters: text.length,
      misspellingCount: words.size,
      truncated,
      misspellings: [...words.values()]
    };
  }
}

module.exports = {
  DictionaryService,
  OPEN_SOURCE_LICENSES,
  validateDictionaryManifest,
  validateLicenseExpression,
  decodeHunspellFiles,
  dictionaryCatalogue
};
