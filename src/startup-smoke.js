'use strict';

function assertPackagedVersion(runtimeVersion, manifestVersion) {
  if (typeof runtimeVersion !== 'string' || runtimeVersion.length === 0 ||
      typeof manifestVersion !== 'string' || manifestVersion.length === 0 ||
      runtimeVersion !== manifestVersion) {
    throw new Error('The packaged Brightdesk version does not match its product manifest.');
  }
  return true;
}

function assertMainWindowReady(state) {
  if (!state || state.title !== 'Brightdesk' ||
      state.hasSidebar !== true ||
      state.hasAppManager !== true ||
      state.hasLanguageManager !== true) {
    throw new Error('The packaged Brightdesk main interface did not load its required workspace controls.');
  }
  return true;
}

module.exports = { assertPackagedVersion, assertMainWindowReady };
