'use strict';

const { PRODUCT_MANIFEST } = require('./product-launcher');

const VERSION_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/;

function parseReleaseVersion(value) {
  if (typeof value !== 'string') return null;
  const match = VERSION_PATTERN.exec(value);
  return match ? match.slice(1).map(Number) : null;
}

function compareReleaseVersions(left, right) {
  const a = parseReleaseVersion(left);
  const b = parseReleaseVersion(right);
  if (!a || !b) return null;
  for (let index = 0; index < 3; index += 1) {
    if (a[index] > b[index]) return 1;
    if (a[index] < b[index]) return -1;
  }
  return 0;
}

function deriveProductLifecycleState({
  productId,
  suiteEnabled = false,
  installation = null,
  running = false,
  latestVersion = null
} = {}) {
  if (typeof productId !== 'string' || !Object.hasOwn(PRODUCT_MANIFEST, productId)) {
    throw new Error('Unsupported Brightdesk product.');
  }

  const installedVersion = installation?.version;
  const installed = Boolean(
    installation
      && installation.verified === true
      && installation.registered === true
      && parseReleaseVersion(installedVersion)
  );
  const inSuite = suiteEnabled === true;
  const isRunning = running === true && (installed || inSuite);
  const updateAvailable = installed
    && compareReleaseVersions(latestVersion, installedVersion) === 1;

  const actions = [];
  if (inSuite) actions.push('open-in-suite', 'remove-from-suite');
  else actions.push('add-to-suite');
  if (installed) {
    actions.push('open-standalone');
    if (updateAvailable) actions.push('update');
    actions.push('uninstall');
  } else {
    actions.push('install');
  }

  return Object.freeze({
    productId,
    inSuite,
    installed,
    installedVersion: installed ? installedVersion : null,
    running: isRunning,
    latestVersion: parseReleaseVersion(latestVersion) ? latestVersion : null,
    updateAvailable: Boolean(updateAvailable),
    actions: Object.freeze(actions)
  });
}

module.exports = {
  deriveProductLifecycleState,
  compareReleaseVersions
};
