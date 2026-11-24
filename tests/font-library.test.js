'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath));

test('ships the approved Inter font as a shared offline package', () => {
  const pkg = JSON.parse(read('packages/fonts/package.json').toString('utf8'));
  const catalogue = JSON.parse(read('packages/fonts/catalogue.json').toString('utf8'));
  const inter = catalogue.fonts.find((font) => font.id === 'inter');

  assert.equal(pkg.name, '@brightdesk/fonts');
  assert.ok(inter, 'Inter must be present in the shared font catalogue');
  assert.equal(inter.family, 'Inter', 'the original family name must remain unchanged');
  assert.equal(inter.version, '4.1');
  assert.equal(inter.license.spdxId, 'OFL-1.1');
  assert.equal(inter.license.redistributionAllowed, true);
  assert.equal(inter.license.embeddingAllowed, true);

  for (const file of inter.files) {
    const bytes = read(path.join('packages/fonts', file.path));
    const digest = crypto.createHash('sha256').update(bytes).digest('hex');
    assert.equal(digest, file.sha256, 'font binary checksum must match the catalogue');
  }

  const licence = read('packages/fonts/licenses/inter-OFL.txt').toString('utf8');
  assert.match(licence, /SIL OPEN FONT LICENSE Version 1\.1/);
  assert.match(licence, /Copyright 2020 The Inter Project Authors/);
});

test('declares the variable font and preserves its real axes', () => {
  const catalogue = JSON.parse(read('packages/fonts/catalogue.json').toString('utf8'));
  const face = catalogue.fonts.find((font) => font.id === 'inter').files[0].face;
  assert.deepEqual(face.axes.map((axis) => axis.tag), ['opsz', 'wght']);
  assert.equal(face.axes.find((axis) => axis.tag === 'wght').min, 100);
  assert.equal(face.axes.find((axis) => axis.tag === 'wght').max, 900);
});
