'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createProductWindowManager } = require('../src/product-window-manager');

class FakeWindow extends EventEmitter {
  constructor(applicationId) {
    super();
    this.applicationId = applicationId;
    this.destroyed = false;
    this.minimized = false;
    this.restoreCalls = 0;
    this.showCalls = 0;
    this.focusCalls = 0;
    this.closeCalls = 0;
  }

  isDestroyed() { return this.destroyed; }
  isMinimized() { return this.minimized; }
  restore() { this.minimized = false; this.restoreCalls += 1; }
  show() { this.showCalls += 1; }
  focus() { this.focusCalls += 1; }
  close() { this.closeCalls += 1; this.destroyed = true; this.emit('closed'); }
}

function createManager(overrides = {}) {
  const created = [];
  const manager = createProductWindowManager({
    productIds: ['pages', 'sheets', 'slides'],
    createWindow: applicationId => {
      const window = new FakeWindow(applicationId);
      created.push(window);
      return { window, ready: Promise.resolve() };
    },
    ...overrides
  });
  return { manager, created };
}

test('opens one independent window for each approved product', async () => {
  const { manager, created } = createManager();

  const pages = manager.open('pages');
  const sheets = manager.open('sheets');
  await Promise.all([pages.ready, sheets.ready]);

  assert.equal(pages.created, true);
  assert.equal(sheets.created, true);
  assert.notEqual(pages.window, sheets.window);
  assert.equal(created.length, 2);
  assert.equal(manager.get('pages'), pages.window);
  assert.equal(manager.get('sheets'), sheets.window);
});

test('repeated Open focuses the existing product window instead of duplicating it', async () => {
  const { manager, created } = createManager();
  const first = manager.open('pages');
  await first.ready;

  first.window.minimized = true;
  const second = manager.open('pages');
  await second.ready;

  assert.equal(second.created, false);
  assert.equal(second.window, first.window);
  assert.equal(created.length, 1);
  assert.equal(first.window.restoreCalls, 1);
  assert.equal(first.window.showCalls, 1);
  assert.equal(first.window.focusCalls, 1);
});

test('closing a product removes only its window registration', async () => {
  const { manager } = createManager();
  const pages = manager.open('pages');
  const sheets = manager.open('sheets');
  await Promise.all([pages.ready, sheets.ready]);

  pages.window.close();

  assert.equal(manager.get('pages'), null);
  assert.equal(manager.get('sheets'), sheets.window);
  assert.equal(manager.open('pages').created, true);
});

test('a destroyed stale window is replaced when its product is opened again', async () => {
  const { manager, created } = createManager();
  const first = manager.open('pages');
  await first.ready;
  first.window.destroyed = true;

  const second = manager.open('pages');
  await second.ready;

  assert.equal(second.created, true);
  assert.notEqual(second.window, first.window);
  assert.equal(created.length, 2);
});

test('concurrent opens share the same pending product window', async () => {
  let resolveReady;
  const ready = new Promise(resolve => { resolveReady = resolve; });
  const { manager, created } = createManager({
    createWindow: applicationId => {
      const window = new FakeWindow(applicationId);
      created.push(window);
      return { window, ready };
    }
  });

  const first = manager.open('pages');
  const second = manager.open('pages');

  assert.equal(second.created, false);
  assert.equal(second.window, first.window);
  assert.equal(second.ready, first.ready);
  assert.equal(created.length, 1);

  resolveReady();
  await Promise.all([first.ready, second.ready]);
});

test('a failed window load closes the partial window and allows a clean retry', async () => {
  const failedWindow = new FakeWindow('pages');
  let attempts = 0;
  const { manager, created } = createManager({
    createWindow: applicationId => {
      attempts += 1;
      const window = attempts === 1 ? failedWindow : new FakeWindow(applicationId);
      created.push(window);
      return {
        window,
        ready: attempts === 1 ? Promise.reject(new Error('load failed')) : Promise.resolve()
      };
    }
  });

  const failed = manager.open('pages');
  await assert.rejects(failed.ready, /load failed/);
  assert.equal(failedWindow.destroyed, true);
  assert.equal(failedWindow.closeCalls, 1);
  assert.equal(manager.get('pages'), null);

  const retry = manager.open('pages');
  await retry.ready;
  assert.equal(retry.created, true);
  assert.notEqual(retry.window, failedWindow);
  assert.equal(attempts, 2);
});

test('unsupported product IDs are rejected without creating a window', () => {
  const { manager, created } = createManager();

  assert.throws(() => manager.open('outlook'), /Unsupported Brightdesk product/);
  assert.equal(created.length, 0);
});
