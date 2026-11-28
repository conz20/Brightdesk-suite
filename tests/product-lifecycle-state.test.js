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
  assert.deepEqual(verified.actions, ['open', 'remove-from-suite', 'uninstall']);
});

test('running state is only exposed for a verified installed product', () => {
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
  assert.deepEqual(state.actions, ['open', 'remove-from-suite', 'update', 'uninstall']);
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
  assert.deepEqual(outsideSuite.actions, ['open-standalone', 'add-to-suite', 'uninstall']);
});

test('unknown product identifiers are rejected', () => {
  assert.throws(
    () => deriveProductLifecycleState({ ...base, productId: 'outlook' }),
    /Unsupported Brightdesk product/
  );
});
