'use strict';

function createProductWindowManager({
  productIds,
  createWindow,
  focusWindow = focusExistingWindow,
  isWindowDestroyed = window => Boolean(window?.isDestroyed?.())
} = {}) {
  if (!Array.isArray(productIds) || productIds.length === 0) {
    throw new TypeError('A non-empty list of approved Brightdesk product IDs is required.');
  }
  if (typeof createWindow !== 'function') {
    throw new TypeError('A product window factory is required.');
  }
  if (typeof focusWindow !== 'function' || typeof isWindowDestroyed !== 'function') {
    throw new TypeError('Product window focus and lifecycle handlers must be functions.');
  }

  const allowedIds = new Set(productIds);
  const records = new Map();

  function open(applicationId) {
    if (!allowedIds.has(applicationId)) {
      throw new Error('Unsupported Brightdesk product.');
    }

    const existing = records.get(applicationId);
    if (existing && !isWindowDestroyed(existing.window)) {
      focusWindow(existing.window);
      return {
        window: existing.window,
        created: false,
        ready: existing.ready
      };
    }
    if (existing) records.delete(applicationId);

    const created = createWindow(applicationId);
    const window = created?.window;
    if (!window || typeof window.once !== 'function') {
      throw new TypeError('The product window factory must return a BrowserWindow and its readiness promise.');
    }

    const record = { window, ready: Promise.resolve() };
    records.set(applicationId, record);
    window.once('closed', () => {
      if (records.get(applicationId) === record) records.delete(applicationId);
    });

    record.ready = Promise.resolve(created.ready).catch(error => {
      if (records.get(applicationId) === record) records.delete(applicationId);
      if (!isWindowDestroyed(window)) window.close?.();
      throw error;
    });

    return { window, created: true, ready: record.ready };
  }

  function get(applicationId) {
    const record = records.get(applicationId);
    if (!record) return null;
    if (isWindowDestroyed(record.window)) {
      records.delete(applicationId);
      return null;
    }
    return record.window;
  }

  return Object.freeze({ open, get });
}

function focusExistingWindow(window) {
  if (window.isMinimized?.()) window.restore();
  window.show();
  window.focus();
}

module.exports = { createProductWindowManager };
