'use strict';

const catalogue = require('./catalogue.json');

function listFamilies() {
  return catalogue.fonts.map(({ id, family, version, styles, scripts }) => ({ id, family, version, styles: [...styles], scripts: [...scripts] }));
}

function resolveFamily(requestedFamily) {
  if (typeof requestedFamily !== 'string') return 'system-ui';
  const match = catalogue.fonts.find((font) => font.family === requestedFamily);
  return match ? match.family : 'system-ui';
}

function cssFontStack(requestedFamily) {
  const family = resolveFamily(requestedFamily);
  return family === 'system-ui' ? 'system-ui, sans-serif' : '"' + family + '", system-ui, sans-serif';
}

module.exports = { catalogue, listFamilies, resolveFamily, cssFontStack };
