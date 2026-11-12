'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const preload = fs.readFileSync(path.join(root, 'src', 'preload.js'), 'utf8');
const catalog = require('../src/app-catalog');

test('Electron preload accepts the launch ID for every approved Brightdesk product', () => {
  const declarationStart = preload.indexOf('const supportedApps = new Set([');
  assert.notEqual(declarationStart, -1, 'preload must declare the supported product launch IDs');

  const declarationEnd = preload.indexOf(']);', declarationStart);
  assert.notEqual(declarationEnd, -1, 'preload must close its supported product launch ID set');

  const declaration = preload.slice(declarationStart, declarationEnd);
  const supportedIds = [...declaration.matchAll(/'([^']+)'/g)].map((match) => match[1]);
  const approvedIds = catalog.map((product) => product.id);

  assert.deepEqual(
    supportedIds,
    approvedIds,
    'the preload allowlist must match the ten-product catalogue in its approved order'
  );
});

test('the actual Electron preload exposes the correct launch ID for all ten products', () => {
  const approvedIds = catalog.map((product) => product.id);

  for (const id of approvedIds) {
    let exposedApi;
    const electron = {
      contextBridge: {
        exposeInMainWorld(name, api) {
          assert.equal(name, 'brightdesk');
          exposedApi = api;
        }
      },
      ipcRenderer: {
        sendSync: () => '0.1.0',
        invoke: async () => null,
        on: () => undefined
      }
    };

    const sandbox = {
      require(name) {
        assert.equal(name, 'electron');
        return electron;
      },
      process: {
        argv: ['electron', `--brightdesk-app=${id}`],
        platform: 'darwin'
      }
    };

    vm.runInNewContext(preload, sandbox, { filename: 'src/preload.js' });
    assert.equal(exposedApi?.launchAppId, id, `preload must expose ${id} as its launch ID`);
  }
});

test('Electron main process routes only the ten approved product IDs', () => {
  const main = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf8');
  const { PRODUCT_MANIFEST } = require('../src/product-launcher');
  assert.ok(main.includes("const { launchProduct, PRODUCT_MANIFEST } = require('./product-launcher')"));
  assert.ok(main.includes('const supportedApplications = new Set(Object.keys(PRODUCT_MANIFEST));'));
  assert.deepEqual(Object.keys(PRODUCT_MANIFEST), catalog.map(product => product.id));
});

test('the Suite opens one independent product window per approved product', () => {
  const main = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf8');

  assert.ok(main.includes("const { createProductWindowManager } = require('./product-window-manager')"));
  assert.ok(main.includes('function createSuiteProductWindow(requestedApplicationId)'));
  assert.ok(main.includes("additionalArguments: [`--brightdesk-app=${requestedApplicationId}`, '--brightdesk-suite-window=1']"));
  assert.ok(main.includes('const productWindowManager = createProductWindowManager({'));
  assert.ok(main.includes('const opened = productWindowManager.open(requestedApplicationId);'));
  assert.ok(main.includes('kind: \'suite-product-window\''));
  assert.ok(main.includes('authorizedApplicationWindows.has(event.sender)'));
  assert.ok(main.includes('window.once(\'closed\', () => authorizedApplicationWindows.delete(contents))'));
});

test('separately packaged products keep their native operating-system launch route', () => {
  const main = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf8');
  assert.ok(main.includes('if (applicationId) {'));
  assert.ok(main.includes('return launchProduct(requestedApplicationId, {'));
});
