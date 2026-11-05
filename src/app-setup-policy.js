'use strict';

function resolveAppSetup(savedSetup, launchAppId, availableIds) {
  const available = [...new Set(availableIds)];
  if (launchAppId) {
    return { installedApps: available.includes(launchAppId) ? [launchAppId] : [], setupComplete: true, schemaVersion: 2 };
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

module.exports = { resolveAppSetup };
