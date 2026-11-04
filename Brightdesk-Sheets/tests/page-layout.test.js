'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const layout = require('../src/page-layout');

test('page layout defaults to A4 portrait with normal margins', () => {
  assert.deepEqual(layout.normalizePageLayout(), { size: 'A4', orientation: 'portrait', margin: 'normal' });
  assert.deepEqual(layout.getPageDimensions(), { width: 794, height: 1123 });
});

test('page sizes and orientation produce the expected dimensions', () => {
  assert.deepEqual(layout.getPageDimensions({ size: 'Letter' }), { width: 816, height: 1056 });
  assert.deepEqual(layout.getPageDimensions({ size: 'A4', orientation: 'landscape' }), { width: 1123, height: 794 });
  assert.deepEqual(layout.getPageDimensions({ size: 'Legal', orientation: 'landscape' }), { width: 1344, height: 816 });
});

test('margin presets map to consistent printable padding', () => {
  for (const [name, pixels] of Object.entries({ narrow: 48, moderate: 72, normal: 96, wide: 144 })) {
    assert.equal(layout.getPageStyle({ margin: name }).padding, `${pixels}px`);
  }
});

test('invalid page settings safely fall back to supported defaults', () => {
  assert.deepEqual(layout.normalizePageLayout({ size: '../bad', orientation: 'diagonal', margin: 'huge' }), { size: 'A4', orientation: 'portrait', margin: 'normal' });
});
