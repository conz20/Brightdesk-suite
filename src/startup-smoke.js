'use strict';

const SUITE_DOCUMENT_TITLE = 'Brightdesk Office Suite';

function assertPackagedVersion(runtimeVersion, manifestVersion) {
  if (typeof runtimeVersion !== 'string' || runtimeVersion.length === 0 ||
      typeof manifestVersion !== 'string' || manifestVersion.length === 0 ||
      runtimeVersion !== manifestVersion) {
    throw new Error('The packaged Brightdesk version does not match its product manifest.');
  }
  return true;
}

function assertMainWindowReady(state) {
  if (!state || state.title !== SUITE_DOCUMENT_TITLE ||
      state.hasSidebar !== true ||
      state.hasAppManager !== true ||
      state.hasLanguageManager !== true) {
    throw new Error('The packaged Brightdesk main interface did not load its required workspace controls.');
  }
  return true;
}

function assertProductWindowReady(state, expectedApplicationId, expectedApplicationName) {
  if (!state || state.title !== SUITE_DOCUMENT_TITLE ||
      state.launchAppId !== expectedApplicationId ||
      state.appTitle !== expectedApplicationName ||
      state.suiteLaunchedProduct !== true ||
      state.hasSidebar !== true ||
      state.hasWorkspace !== true) {
    throw new Error(`The Brightdesk ${expectedApplicationName || 'product'} product workspace did not load its required controls.`);
  }
  return true;
}

module.exports = { assertPackagedVersion, assertMainWindowReady, assertProductWindowReady };
