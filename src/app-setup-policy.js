'use strict';

(function exposeAppSetupPolicy(root, factory) {
  const policy = factory();
  if (typeof module === 'object' && module.exports) module.exports = policy;
  if (root) root.BrightdeskAppSetupPolicy = policy;
})(typeof globalThis === 'object' ? globalThis : this, () => {
  function resolveAppSetup(savedSetup, launchAppId, availableIds, suiteLaunchedProduct = false) {
    const available = [...new Set(availableIds)];
    if (launchAppId && !suiteLaunchedProduct) {
      return { installedApps: available.includes(launchAppId) ? [launchAppId] : [], setupComplete: true, schemaVersion: 2 };
    }

    if (launchAppId && suiteLaunchedProduct) {
      const savedApps = Array.isArray(savedSetup?.installedApps)
        ? [...new Set(savedSetup.installedApps.filter(id => available.includes(id)))]
        : available;
      return { installedApps: available.includes(launchAppId) ? (savedApps.includes(launchAppId) ? savedApps : [launchAppId, ...savedApps]) : [], setupComplete: true, schemaVersion: 2 };
    }

    if (savedSetup?.schemaVersion === 2 && Array.isArray(savedSetup.installedApps)) {
      const installedApps = [...new Set(savedSetup.installedApps.filter(id => available.includes(id)))];
      return {
        installedApps: installedApps.length ? installedApps : available,
        setupComplete: true,
        schemaVersion: 2
      };
    }

    // Older releases could persist an incomplete selection. The integrated suite
    // now opens with every bundled first-release product available by default.
    return { installedApps: available, setupComplete: true, schemaVersion: 2 };
  }

  return { resolveAppSetup };
});
