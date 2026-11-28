'use strict';

const PRODUCT_REPOSITORIES = Object.freeze({
  pages: 'conz20/Brightdesk-Pages',
  sheets: 'conz20/Brightdesk-Sheets',
  slides: 'conz20/Brightdesk-Decks',
  notes: 'conz20/Brightdesk-Notes',
  database: 'conz20/Brightdesk-Database',
  forms: 'conz20/Brightdesk-Forms',
  lists: 'conz20/Brightdesk-Lists',
  planner: 'conz20/Brightdesk-Planner',
  todo: 'conz20/Brightdesk-To-Do',
  loop: 'conz20/Brightdesk-Workspace'
});

const RELEASE_ASSET_REPOSITORY = 'conz20/Brightdesk-suite';
const VERSION_PATTERN = /^(0|[1-9]\\d*)\\.(0|[1-9]\\d*)\\.(0|[1-9]\\d*)$/;
const PACKAGE_RULES = Object.freeze({
  windows: Object.freeze({ architecture: 'x64', formats: Object.freeze({ 'nsis-exe': '.exe' }) }),
  macos: Object.freeze({ architecture: 'universal', formats: Object.freeze({ dmg: '.dmg', pkg: '.pkg', zip: '.zip' }) }),
  linux: Object.freeze({ architecture: 'x64', formats: Object.freeze({ AppImage: '.AppImage', deb: '.deb' }) })
});

function invalid(message) {
  throw new TypeError(`Invalid Brightdesk product release manifest: ${message}`);
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validatePackage(record, index) {
  if (!isPlainObject(record)) invalid(`packages[${index}] must be an object.`);

  const {
    productId,
    sourceRepository,
    version,
    platform,
    architecture,
    format,
    fileName,
    downloadUrl,
    sizeBytes,
    sha256
  } = record;

  if (typeof productId !== 'string' || !Object.hasOwn(PRODUCT_REPOSITORIES, productId)) {
    invalid(`packages[${index}] references an unsupported product.`);
  }
  if (sourceRepository !== PRODUCT_REPOSITORIES[productId]) {
    invalid(`packages[${index}] has an unexpected source repository.`);
  }
  if (typeof version !== 'string' || !VERSION_PATTERN.test(version)) {
    invalid(`packages[${index}] has an invalid release version.`);
  }

  const platformRule = PACKAGE_RULES[platform];
  if (!platformRule) invalid(`packages[${index}] has an unsupported platform.`);
  if (architecture !== platformRule.architecture) {
    invalid(`packages[${index}] has an unsupported architecture for ${platform}.`);
  }
  const extension = platformRule.formats[format];
  if (!extension) invalid(`packages[${index}] has an unsupported package format for ${platform}.`);

  if (typeof fileName !== 'string'
    || fileName.length < 1
    || fileName.length > 180
    || fileName === '.'
    || fileName === '..'
    || /[\\\\/\\u0000-\\u001f]/.test(fileName)
    || !fileName.toLowerCase().endsWith(extension.toLowerCase())) {
    invalid(`packages[${index}] has an unsafe or mismatched file name.`);
  }
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0) {
    invalid(`packages[${index}] has an invalid package size.`);
  }
  if (typeof sha256 !== 'string' || !/^[a-fA-F0-9]{64}$/.test(sha256)) {
    invalid(`packages[${index}] has an invalid SHA-256 digest.`);
  }

  if (typeof downloadUrl !== 'string') invalid(`packages[${index}] has no download URL.`);
  let parsedUrl;
  try {
    parsedUrl = new URL(downloadUrl);
  } catch {
    invalid(`packages[${index}] has a malformed download URL.`);
  }

  const expectedPath = `/conz20/Brightdesk-suite/releases/download/v${version}/${encodeURIComponent(fileName)}`;
  if (parsedUrl.protocol !== 'https:'
    || parsedUrl.hostname !== 'github.com'
    || parsedUrl.port
    || parsedUrl.username
    || parsedUrl.password
    || parsedUrl.search
    || parsedUrl.hash
    || parsedUrl.pathname !== expectedPath
    || parsedUrl.href !== `https://github.com${expectedPath}`) {
    invalid(`packages[${index}] is not an approved Brightdesk Suite release asset URL.`);
  }

  return Object.freeze({
    productId,
    sourceRepository,
    version,
    platform,
    architecture,
    format,
    fileName,
    downloadUrl: parsedUrl.href,
    sizeBytes,
    sha256: sha256.toLowerCase()
  });
}

function validateProductReleaseManifest(manifest) {
  if (!isPlainObject(manifest)) invalid('the root value must be an object.');
  if (manifest.schemaVersion !== 1) invalid('schemaVersion must be 1.');
  if (!Array.isArray(manifest.packages) || manifest.packages.length === 0) {
    invalid('packages must be a non-empty array.');
  }

  const seenPackages = new Set();
  const seenUrls = new Set();
  const packages = manifest.packages.map((record, index) => {
    const item = validatePackage(record, index);
    const key = [item.productId, item.platform, item.architecture, item.format].join(':');
    if (seenPackages.has(key)) invalid(`duplicate package entry for ${key}.`);
    if (seenUrls.has(item.downloadUrl)) invalid('duplicate package download URL.');
    seenPackages.add(key);
    seenUrls.add(item.downloadUrl);
    return item;
  });

  return Object.freeze({
    schemaVersion: 1,
    packages: Object.freeze(packages)
  });
}

module.exports = {
  PRODUCT_REPOSITORIES,
  RELEASE_ASSET_REPOSITORY,
  validateProductReleaseManifest
};
