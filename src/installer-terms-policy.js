'use strict';

function shouldRequireFirstLaunchTerms({ platform = process.platform, isPackaged = false } = {}) {
  // The Windows NSIS installer already requires explicit acceptance before it installs.
  // Do not ask the customer to accept the same agreement again on first launch.
  return !(platform === 'win32' && isPackaged);
}

module.exports = { shouldRequireFirstLaunchTerms };
