'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { deriveProductLifecycleState } = require('../src/product-lifecycle-state');

const base = {
  productId: 'pages',
  suiteEnabled: true,
  installation: null,
  running: false,
  latestVersion: '0.1.0'
};

test('Suite membership is not reported as a standalone OS installation', () => {
  const state = deriveProductLifecycleState(base);
  assert.equal(state.inSuite, true);
  assert.equal(state.installed, false);
  assert.equal(state.running, false);
  assert.equal(state.updateAvailable, false);
  assert.deepEqual(state.actions, ['open-in-suite', 'remove-from-suite', 'install']);
});

test('only verified and registered installation evidence counts as installed', () => {
  const unverified = deriveProductLifecycleState({
    ...base,
    installation: { version: '0.1.0', verified: false, registered: true }
  });
  const unregistered = deriveProductLifecycleState({
    ...base,
    installation: { version: '0.1.0', verified: true, registered: false }
  });
  const verified = deriveProductLifecycleState({
    ...base,
    installation: { version: '0.1.0', verified: true, registered: true }
  });

  assert.equal(unverified.installed, false);
  assert.equal(unregistered.installed, false);
  assert.equal(verified.installed, true);
  assert.deepEqual(verified.actions, ['open-in-suite', 'remove-from-suite', 'open-standalone', 'uninstall']);
});

test('running state reflects a verified standalone install or an active Suite workspace', () => {
  const state = deriveProductLifecycleState({
    ...base,
    running: true,
    installation: { version: '0.1.0', verified: true, registered: true }
  });
  const unsupported = deriveProductLifecycleState({ ...base, running: true });

  assert.equal(state.running, true);
  assert.equal(unsupported.running, true);
  const unavailable = deriveProductLifecycleState({ ...base, suiteEnabled: false, running: true });
  assert.equal(unavailable.running, false);
});

test('a newer compatible release is an update only for a verified installation', () => {
  const installed = { version: '0.1.0', verified: true, registered: true };
  const state = deriveProductLifecycleState({
    ...base,
    installation: installed,
    latestVersion: '0.2.0'
  });
  const notInstalled = deriveProductLifecycleState({
    ...base,
    latestVersion: '0.2.0'
  });

  assert.equal(state.updateAvailable, true);
  assert.deepEqual(state.actions, ['open-in-suite', 'remove-from-suite', 'open-standalone', 'update', 'uninstall']);
  assert.equal(notInstalled.updateAvailable, false);
});

test('equal, older, malformed and absent release versions never invent an update', () => {
  const installation = { version: '0.2.0', verified: true, registered: true };
  for (const latestVersion of ['0.2.0', '0.1.0', 'not-a-version', null]) {
    const state = deriveProductLifecycleState({ ...base, installation, latestVersion });
    assert.equal(state.updateAvailable, false, String(latestVersion));
  }
});

test('Suite selection and standalone installation can be changed independently', () => {
  const installed = { version: '0.1.0', verified: true, registered: true };
  const inSuite = deriveProductLifecycleState({ ...base, installation: installed, suiteEnabled: true });
  const outsideSuite = deriveProductLifecycleState({ ...base, installation: installed, suiteEnabled: false });

  assert.equal(inSuite.installed, true);
  assert.equal(outsideSuite.installed, true);
  assert.deepEqual(inSuite.actions, ['open-in-suite', 'remove-from-suite', 'open-standalone', 'uninstall']);
  assert.deepEqual(outsideSuite.actions, ['add-to-suite', 'open-standalone', 'uninstall']);
});

test('invalid installed versions do not create installed state or expose standalone actions', () => {
  const state = deriveProductLifecycleState({
    ...base,
    installation: { version: 'latest', verified: true, registered: true }
  });
  assert.equal(state.installed, false);
  assert.equal(state.installedVersion, null);
  assert.equal(state.updateAvailable, false);
  assert.ok(state.actions.includes('install'));
  assert.ok(!state.actions.includes('open-standalone'));
  assert.ok(!state.actions.includes('uninstall'));
});

test('unknown product identifiers are rejected', () => {
  assert.throws(
    () => deriveProductLifecycleState({ ...base, productId: 'outlook' }),
    /Unsupported Brightdesk product/
  );
});

test('all ten approved Brightdesk product IDs are accepted', () => {
  for (const productId of ['pages', 'sheets', 'slides', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'loop']) {
    assert.equal(deriveProductLifecycleState({ ...base, productId }).productId, productId);
  }
});

test('release versions are compared numerically by major, minor and patch', () => {
  const { compareReleaseVersions } = require('../src/product-lifecycle-state');
  assert.equal(compareReleaseVersions('0.10.0', '0.9.0'), 1);
  assert.equal(compareReleaseVersions('1.0.0', '0.99.99'), 1);
  assert.equal(compareReleaseVersions('0.1.1', '0.1.2'), -1);
  assert.equal(compareReleaseVersions('0.1.0', '0.1.0'), 0);
  assert.equal(compareReleaseVersions('v0.1.0', '0.1.0'), null);
});
