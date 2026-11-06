'use strict';

function shouldRequireFirstLaunchTerms({ platform = process.platform, isPackaged = false } = {}) {
  // Windows NSIS collects agreement before installation.
  // macOS also creates a runnable ZIP app archive, which bypasses the DMG/PKG installer prompt.
  // Require first-launch acceptance on macOS so every packaged download route is covered.
  // This duplicates the installer agreement after DMG/PKG installs, but records acceptance once per user and terms version.
  // Linux packages retain the in-app fallback because AppImage has no installer agreement page.
  if (!isPackaged) return true;
  return platform === 'linux' || platform === 'darwin';
}

module.exports = { shouldRequireFirstLaunchTerms };
