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
        installedApps,
        setupComplete: true,
        schemaVersion: 2
      };
    }

    // Older releases could persist an incomplete selection. The integrated suite
    // now opens with every bundled first-release product available by default.
    return { installedApps: available, setupComplete: true, schemaVersion: 2 };
  }

  function removeAppSelection(installedApps, hiddenProducts, removedAppId, activeAppId, availableIds) {
    const available = new Set(availableIds);
    const remaining = [...new Set((Array.isArray(installedApps) ? installedApps : [])
      .filter(id => available.has(id) && id !== removedAppId))];
    const visibleHidden = [...new Set((Array.isArray(hiddenProducts) ? hiddenProducts : [])
      .filter(id => remaining.includes(id)))];
    const nextActiveAppId = activeAppId === removedAppId
      ? (remaining[0] || null)
      : (remaining.includes(activeAppId) ? activeAppId : null);
    return { installedApps: remaining, hiddenProducts: visibleHidden, activeAppId: nextActiveAppId };
  }

  function setProductVisibility(hiddenProducts, installedApps, productId, shouldHide) {
    const installed = new Set(Array.isArray(installedApps) ? installedApps : []);
    const hidden = new Set(Array.isArray(hiddenProducts) ? hiddenProducts.filter(id => installed.has(id)) : []);
    if (!installed.has(productId)) return [...hidden];
    if (shouldHide) hidden.add(productId);
    else hidden.delete(productId);
    return [...hidden];
  }

  function getNavigationProducts(catalog, installedApps, hiddenProducts, launchAppId, suiteLaunchedProduct = false) {
    const products = Array.isArray(catalog) ? catalog : [];
    if (launchAppId && !suiteLaunchedProduct) {
      return products.filter(item => item && item.id !== launchAppId);
    }

    const installed = new Set(Array.isArray(installedApps) ? installedApps : []);
    const hidden = new Set(Array.isArray(hiddenProducts) ? hiddenProducts : []);
    return products.filter(item => item && item.id !== launchAppId && installed.has(item.id) && !hidden.has(item.id));
  }

  return { resolveAppSetup, removeAppSelection, setProductVisibility, getNavigationProducts };
});
