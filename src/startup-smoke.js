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

function assertSuiteAppManagerReady(state, expectedProductNames) {
  const expectedNamesAreValid = Array.isArray(expectedProductNames) &&
    expectedProductNames.length === 10 &&
    new Set(expectedProductNames).size === 10;
  const actualNamesMatch = expectedNamesAreValid &&
    Array.isArray(state?.productNames) &&
    state.productNames.length === 10 &&
    state.productNames.every((name, index) => name === expectedProductNames[index]);
  if (!state || state.title !== SUITE_DOCUMENT_TITLE ||
      state.hasAppManager !== true ||
      state.isHomeView !== true ||
      !actualNamesMatch) {
    throw new Error('The Brightdesk Suite app centre did not render exactly the approved ten products.');
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

module.exports = {
  assertPackagedVersion,
  assertMainWindowReady,
  assertSuiteAppManagerReady,
  assertProductWindowReady
};
