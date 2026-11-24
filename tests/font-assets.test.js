'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative));
const text = relative => read(relative).toString('utf8');

test('loads the shared Inter font faces locally without a network dependency', () => {
  const html = text('src/index.html');
  const css = text('src/fonts.css');

  assert.match(html, /href="fonts\.css"/);
  assert.match(css, /font-family:\s*"Inter"/);
  assert.match(css, /font-weight:\s*100\s+900/);
  assert.match(css, /font-style:\s*normal/);
  assert.match(css, /font-style:\s*italic/);
  assert.match(css, /url\("\.\/assets\/fonts\/inter\/Inter\[opsz,wght\]\.ttf"\)/);
  assert.match(css, /url\("\.\/assets\/fonts\/inter\/Inter-Italic\[opsz,wght\]\.ttf"\)/);
  assert.doesNotMatch(css, /https?:\/\//);
});

test('ships valid Inter variable font binaries and their exact OFL notice', () => {
  const normal = read('src/assets/fonts/inter/Inter[opsz,wght].ttf');
  const italic = read('src/assets/fonts/inter/Inter-Italic[opsz,wght].ttf');
  const license = text('src/licenses/fonts/inter-OFL.txt');
  const notices = text('THIRD_PARTY_NOTICES.md');

  for (const binary of [normal, italic]) {
    assert.deepEqual([...binary.subarray(0, 4)], [0, 1, 0, 0]);
    assert.ok(binary.byteLength > 800_000);
  }
  assert.match(license, /^Copyright 2020 The Inter Project Authors/);
  assert.match(license, /SIL OPEN FONT LICENSE Version 1\.1/);
  assert.match(notices, /Inter 4\.1/);
  assert.match(notices, /src\/licenses\/fonts\/inter-OFL\.txt/);
});
