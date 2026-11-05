'use strict';

function shouldRequireFirstLaunchTerms({ platform = process.platform, isPackaged = false } = {}) {
  // Windows NSIS and macOS DMG/PKG installers collect agreement before installation.
  // Linux packages retain the in-app fallback because AppImage has no installer agreement page.
  if (!isPackaged) return true;
  return platform === 'linux';
}

module.exports = { shouldRequireFirstLaunchTerms };
