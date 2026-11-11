'use strict';

function shouldRequireFirstLaunchTerms({ platform = process.platform, isPackaged = false } = {}) {
  // DMG/PKG show agreement before installation; the macOS first-launch fallback also protects runnable ZIP downloads.
  // Linux packages retain the in-app fallback because AppImage has no installer agreement page.
  if (!isPackaged) return true;
  return platform === 'linux' || platform === 'darwin';
}

module.exports = { shouldRequireFirstLaunchTerms };
