'use strict';

(function exposeAppSetupPolicy(root, factory) {
  const policy = factory();
  if (typeof module === 'object' && module.exports) module.exports = policy;
  if (root) root.BrightdeskAppSetupPolicy = policy;
})(typeof globalThis === 'object' ? globalThis : this, () => {
  function resolveAppSetup(savedSetup, launchAppId, availableIds) {
    const available = [...new Set(availableIds)];
    if (launchAppId) {
      return {
        installedApps: available.includes(launchAppId) ? [launchAppId] : [],
        setupComplete: true,
        schemaVersion: 3,
        initialView: 'workspace'
      };
    }

    if (savedSetup?.schemaVersion === 3 && Array.isArray(savedSetup.installedApps)) {
      const installedApps = [...new Set(savedSetup.installedApps.filter(id => available.includes(id)))];
      return {
        installedApps: installedApps.length ? installedApps : available,
        setupComplete: true,
        schemaVersion: 3,
        initialView: 'home'
      };
    }

    // Version 2 could store the original four-product default selection. The
    // integrated suite migrates every earlier setup to all ten products and
    // opens the app centre instead of dropping users into Pages.
    return {
      installedApps: available,
      setupComplete: true,
      schemaVersion: 3,
      initialView: 'home'
    };
  }

  return { resolveAppSetup };
});
