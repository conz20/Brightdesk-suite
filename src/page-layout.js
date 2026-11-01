'use strict';

const PAGE_SIZES = Object.freeze({
  A4: Object.freeze({ width: 794, height: 1123, label: 'A4' }),
  Letter: Object.freeze({ width: 816, height: 1056, label: 'US Letter' }),
  Legal: Object.freeze({ width: 816, height: 1344, label: 'US Legal' })
});
const PAGE_MARGINS = Object.freeze({
  narrow: 48,
  normal: 96,
  moderate: 72,
  wide: 144
});
const DEFAULT_PAGE_LAYOUT = Object.freeze({ size: 'A4', orientation: 'portrait', margin: 'normal' });

function normalizePageLayout(value = {}) {
  const size = Object.hasOwn(PAGE_SIZES, value.size) ? value.size : DEFAULT_PAGE_LAYOUT.size;
  const orientation = value.orientation === 'landscape' ? 'landscape' : 'portrait';
  const margin = Object.hasOwn(PAGE_MARGINS, value.margin) ? value.margin : DEFAULT_PAGE_LAYOUT.margin;
  return { size, orientation, margin };
}

function getPageDimensions(value = {}) {
  const layout = normalizePageLayout(value);
  const page = PAGE_SIZES[layout.size];
  return layout.orientation === 'landscape'
    ? { width: page.height, height: page.width }
    : { width: page.width, height: page.height };
}

function getPageStyle(value = {}) {
  const layout = normalizePageLayout(value);
  const dimensions = getPageDimensions(layout);
  return {
    width: `${dimensions.width}px`,
    minHeight: `${dimensions.height}px`,
    padding: `${PAGE_MARGINS[layout.margin]}px`,
    margin: '24px auto',
    background: '#ffffff',
    border: '1px solid #e7e8ee',
    boxShadow: '0 3px 18px rgba(32, 35, 56, 0.08)',
    boxSizing: 'border-box'
  };
}

const api = { PAGE_SIZES, PAGE_MARGINS, DEFAULT_PAGE_LAYOUT, normalizePageLayout, getPageDimensions, getPageStyle };
if (typeof module !== 'undefined' && module.exports) module.exports = api;
if (typeof window !== 'undefined') window.BrightdeskPageLayout = api;
