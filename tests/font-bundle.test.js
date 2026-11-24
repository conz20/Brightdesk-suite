'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

test('Brightdesk packages the approved Inter variable font for offline use', () => {
  const font = fs.readFileSync(path.join(root, 'src/assets/fonts/Inter[opsz,wght].ttf'));
  assert.equal(font.length, 876576);
  assert.equal(crypto.createHash('sha256').update(font).digest('hex'), '29160a80ff49ddcab2c97711247e08b1fab27a484a329ce8b813d820dc559031');
  const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');
  assert.match(css, /font-family:"Inter"/);
  assert.match(css, /Inter\[opsz,wght\]\.ttf/);
  assert.match(css, /font-weight:100 900/);
  const license = fs.readFileSync(path.join(root, 'src/assets/fonts/Inter-OFL.txt'), 'utf8');
  assert.match(license, /^Copyright 2020 The Inter Project Authors/m);
  assert.match(license, /SIL OPEN FONT LICENSE Version 1\.1/);
});
