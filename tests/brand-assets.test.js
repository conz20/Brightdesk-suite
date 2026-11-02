'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = require('../package.json');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'styles.css'), 'utf8');

test('suite installers use the original SVG master icon on all platforms', () => {
  const build = manifest.build;
  assert.equal(build.directories.buildResources, 'assets/branding');
  for (const platform of ['win', 'mac', 'linux']) {
    assert.equal(build[platform].icon, 'brightdesk-suite-mark.svg');
  }
  assert.ok(fs.existsSync(path.join(root, 'assets', 'branding', 'brightdesk-suite-mark.svg')));
});

test('App Centre renders the original Brightdesk master mark accessibly', () => {
  assert.match(html, /class="manager-hero-logo"/);
  assert.match(html, /src="assets\/brand\/brightdesk-suite-mark\.svg"/);
  assert.match(html, /alt="Brightdesk"/);
  assert.match(css, /\.manager-hero-logo\{/);
});
