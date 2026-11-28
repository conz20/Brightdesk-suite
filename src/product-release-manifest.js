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
const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;
const PACKAGE_RULES = Object.freeze({
  windows: Object.freeze({ architecture: 'x64', formats: Object.freeze({ 'nsis-exe': '.exe' }) }),
  macos: Object.freeze({ architecture: 'universal', formats: Object.freeze({ dmg: '.dmg', pkg: '.pkg', zip: '.zip' }) }),
  linux: Object.freeze({ architecture: 'x64', formats: Object.freeze({ AppImage: '.AppImage', deb: '.deb' }) })
});

function invalid(message) {
  throw new TypeError('Invalid Brightdesk product release manifest: ' + message);
}

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validatePackage(record, index) {
  if (!isPlainObject(record)) invalid('packages[' + index + '] must be an object.');

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
    sha256,
    sourceCommit,
    buildWorkflowRunUrl
  } = record;

  const isApprovedProduct = typeof productId === 'string'
    && Object.hasOwn(PRODUCT_REPOSITORIES, productId);
  const isSuiteRelease = productId === 'suite';
  if (!isApprovedProduct && !isSuiteRelease) {
    invalid('packages[' + index + '] references an unsupported product.');
  }
  const expectedSourceRepository = isSuiteRelease
    ? RELEASE_ASSET_REPOSITORY
    : PRODUCT_REPOSITORIES[productId];
  if (sourceRepository !== expectedSourceRepository) {
    invalid('packages[' + index + '] has an unexpected source repository.');
  }
  if (typeof version !== 'string' || !VERSION_PATTERN.test(version)) {
    invalid('packages[' + index + '] has an invalid release version.');
  }

  if (typeof platform !== 'string' || !Object.hasOwn(PACKAGE_RULES, platform)) {
    invalid('packages[' + index + '] has an unsupported platform.');
  }
  const platformRule = PACKAGE_RULES[platform];
  if (architecture !== platformRule.architecture) {
    invalid('packages[' + index + '] has an unsupported architecture for ' + platform + '.');
  }
  if (typeof format !== 'string' || !Object.hasOwn(platformRule.formats, format)) {
    invalid('packages[' + index + '] has an unsupported package format for ' + platform + '.');
  }
  const extension = platformRule.formats[format];

  if (typeof fileName !== 'string'
    || fileName.length < 1
    || fileName.length > 180
    || fileName === '.'
    || fileName === '..'
    || /[\\\/\u0000-\u001f]/.test(fileName)
    || !fileName.toLowerCase().endsWith(extension.toLowerCase())) {
    invalid('packages[' + index + '] has an unsafe or mismatched file name.');
  }
  if (!Number.isSafeInteger(sizeBytes) || sizeBytes <= 0) {
    invalid('packages[' + index + '] has an invalid package size.');
  }
  if (typeof sha256 !== 'string' || !/^[a-fA-F0-9]{64}$/.test(sha256)) {
    invalid('packages[' + index + '] has an invalid SHA-256 digest.');
  }
  if (sourceCommit !== undefined && (typeof sourceCommit !== 'string' || !/^[a-fA-F0-9]{40}$/.test(sourceCommit))) {
    invalid('packages[' + index + '] has an invalid source commit SHA.');
  }
  if (buildWorkflowRunUrl !== undefined) {
    let parsedRunUrl;
    try {
      parsedRunUrl = new URL(buildWorkflowRunUrl);
    } catch {
      invalid('packages[' + index + '] has a malformed build workflow URL.');
    }
    const runPrefix = 'https://github.com/' + sourceRepository + '/actions/runs/';
    const runId = parsedRunUrl.pathname.startsWith('/' + sourceRepository + '/actions/runs/')
      ? parsedRunUrl.pathname.slice(('/' + sourceRepository + '/actions/runs/').length)
      : '';
    if (parsedRunUrl.protocol !== 'https:'
      || parsedRunUrl.hostname !== 'github.com'
      || parsedRunUrl.port
      || parsedRunUrl.username
      || parsedRunUrl.password
      || parsedRunUrl.search
      || parsedRunUrl.hash
      || !/^[1-9]\d*$/.test(runId)
      || parsedRunUrl.href !== runPrefix + runId) {
      invalid('packages[' + index + '] build workflow URL does not match its source repository.');
    }
  }

  if (typeof downloadUrl !== 'string') invalid('packages[' + index + '] has no download URL.');
  let parsedUrl;
  try {
    parsedUrl = new URL(downloadUrl);
  } catch {
    invalid('packages[' + index + '] has a malformed download URL.');
  }

  const expectedPath = '/conz20/Brightdesk-suite/releases/download/v' + version + '/' + encodeURIComponent(fileName);
  if (parsedUrl.protocol !== 'https:'
    || parsedUrl.hostname !== 'github.com'
    || parsedUrl.port
    || parsedUrl.username
    || parsedUrl.password
    || parsedUrl.search
    || parsedUrl.hash
    || parsedUrl.pathname !== expectedPath
    || parsedUrl.href !== 'https://github.com' + expectedPath) {
    invalid('packages[' + index + '] is not an approved Brightdesk Suite release asset URL.');
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
    sha256: sha256.toLowerCase(),
    ...(sourceCommit !== undefined ? { sourceCommit: sourceCommit.toLowerCase() } : {}),
    ...(buildWorkflowRunUrl !== undefined ? { buildWorkflowRunUrl } : {})
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
    if (seenPackages.has(key)) invalid('duplicate package entry for ' + key + '.');
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

/**
 * Validate that a release contains all 66 approved artifacts and carries
 * consistent source provenance for each of the ten products and the Suite.
 *
 * This validates manifest structure and evidence links only. The release
 * workflow must independently confirm that each linked GitHub Actions run
 * succeeded for the exact source commit on GitHub-hosted runners.
 */
function validateCompleteBrightdeskReleaseManifest(manifest) {
  const validated = validateProductReleaseManifest(manifest);
  const releaseProducts = [...Object.keys(PRODUCT_REPOSITORIES), 'suite'];
  const expectedPackages = new Set();

  for (const productId of releaseProducts) {
    for (const [platform, rule] of Object.entries(PACKAGE_RULES)) {
      for (const format of Object.keys(rule.formats)) {
        expectedPackages.add([productId, platform, format].join(':'));
      }
    }
  }

  if (validated.packages.length !== 66) {
    invalid('a complete Brightdesk release must contain exactly 66 packages.');
  }

  const versions = new Set();
  const sourceCommits = new Map();
  const actualPackages = new Set();

  for (const item of validated.packages) {
    if (!releaseProducts.includes(item.productId)) {
      invalid('the complete release contains an unsupported product.');
    }
    if (!item.sourceCommit) {
      invalid('every package must include its exact source commit SHA.');
    }
    if (!item.buildWorkflowRunUrl) {
      invalid('every package must include its source repository build workflow URL.');
    }

    const key = [item.productId, item.platform, item.format].join(':');
    actualPackages.add(key);
    versions.add(item.version);

    const previousCommit = sourceCommits.get(item.sourceRepository);
    if (previousCommit && previousCommit !== item.sourceCommit) {
      invalid('all packages from one source repository must use the same source commit.');
    }
    sourceCommits.set(item.sourceRepository, item.sourceCommit);
  }

  for (const key of expectedPackages) {
    if (!actualPackages.has(key)) invalid('the complete release is missing package ' + key + '.');
  }
  if (versions.size !== 1) {
    invalid('all 66 packages must belong to one matching release version.');
  }

  return validated;
}

module.exports = {
  PRODUCT_REPOSITORIES,
  RELEASE_ASSET_REPOSITORY,
  validateProductReleaseManifest,
  validateCompleteBrightdeskReleaseManifest
};
