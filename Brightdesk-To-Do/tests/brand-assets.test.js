'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = require('../package.json');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'src', 'styles.css'), 'utf8');

test('suite and all ten product installers use the original Brightdesk SVG master icon', () => {
  assert.equal(manifest.build.directories.buildResources, 'assets/branding');
  for (const platform of ['win', 'mac', 'linux']) {
    assert.equal(manifest.build[platform].icon, 'brightdesk-suite-mark.svg');
  }

  const previousAppId = process.env.BRIGHTDESK_APP_ID;
  try {
    for (const appId of ['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop']) {
      process.env.BRIGHTDESK_APP_ID = appId;
      delete require.cache[require.resolve('../electron-builder.app.config.js')];
      const config = require('../electron-builder.app.config.js');
      for (const platform of ['win','mac','linux']) {
        assert.equal(config[platform].icon, 'brightdesk-suite-mark.svg');
      }
      assert.equal(config.directories.buildResources, 'assets/branding');
    }
  } finally {
    if (previousAppId === undefined) delete process.env.BRIGHTDESK_APP_ID;
    else process.env.BRIGHTDESK_APP_ID = previousAppId;
    delete require.cache[require.resolve('../electron-builder.app.config.js')];
  }
  assert.ok(fs.existsSync(path.join(root, 'assets', 'branding', 'brightdesk-suite-mark.svg')));
  assert.ok(fs.existsSync(path.join(root, 'src', 'assets', 'brand', 'brightdesk-suite-mark.svg')));
});

test('Product Centre renders the original Brightdesk master mark accessibly', () => {
  assert.match(html, /class="brand-logo"/);
  assert.match(html, /class="manager-hero-logo"/);
  assert.match(html, /src="assets\/brand\/brightdesk-suite-mark\.svg"/);
  assert.match(html, /alt="Brightdesk"/);
  assert.match(css, /\.manager-hero-logo\{/);
  assert.match(css, /--bd-accent:#36c7b4/);
  assert.match(css, /\.sidebar\{background:var\(--bd-ink\)/);
});

test('the final loaded design system keeps Brightdesk teal and dark-ink branding', () => {
  const designSystem = fs.readFileSync(path.join(root, 'src', 'design-system.css'), 'utf8');
  assert.ok(html.indexOf('href="styles.css"') < html.indexOf('href="design-system.css"'));
  assert.match(designSystem, /--bd-accent:#36c7b4/);
  assert.match(designSystem, /\.sidebar\{background:var\(--bd-ink\)/);
  assert.match(designSystem, /\.nav\.active\{background:rgba\(54,199,180/);
});
