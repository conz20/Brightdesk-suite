'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('My Applications shows one suite-level sidebar entry instead of repeating the ten product cards', () => {
  const html = read('src/index.html');
  const app = read('src/app.js');
  assert.match(html, /id="app-centre-nav"/);
  assert.match(html, /id="dynamic-app-nav"/);
  assert.match(html, /data-i18n="sidebar\.applications">My Applications<\/b>/);
  assert.doesNotMatch(html, /class="nav[^\"]*create|id="(?:create|new)-nav"/i);
  assert.doesNotMatch(html, /data-app="(?:pages|sheets|slides|notes|database|forms|lists|planner|todo|loop)"/);
  assert.match(app, /catalog\.filter\(item => installedApp\(item\.id\)\)/);
  assert.match(app, /\$\('dynamic-app-nav'\)\.hidden = manager \|\| languages/);
  assert.match(app, /\$\('app-centre-nav'\)\.hidden = !manager \|\| Boolean\(launchAppId\)/);
  assert.match(app, /manager \? t\('sidebar\.applications'\)/);
});

test('all ten installed products remain available in the product-switching sidebar during workspace use', () => {
  const app = read('src/app.js');
  const catalogue = require('../src/app-catalog');
  assert.equal(catalogue.length, 10);
  assert.match(app, /function syncAppNavigation\(\)[\s\S]*?catalog\.filter\(item => installedApp\(item\.id\)\)/);
  assert.match(app, /button\.addEventListener\('click',\(\)=>setApp\(item\.id\)\)/);
  assert.match(app, /sidebar-section-label'\)\.textContent = manager \? t\('sidebar\.suite'\) : \(languages \? t\('sidebar\.settings'\) : t\('sidebar\.yourApps'\)\)/);
});

test('Brightdesk Home and My Applications artwork match the ten-product suite navigation', () => {
  const svg = read('assets/product-experience/brightdesk-app-centre.svg');
  assert.equal((svg.match(/id="sidebar-applications"/g) || []).length, 1);
  assert.doesNotMatch(svg, /id="sidebar-(?:pages|sheets|decks|notes|database|forms|lists|planner|todo|workspace)-/);
  assert.match(svg, /Brightdesk Office Suite My Applications experience/);
  assert.match(svg, /Product shortcuts are not repeated beside the My Applications grid/);
  assert.match(svg, /id="settings-cogwheel"/);
  assert.match(svg, /id="notifications-bell"/);

  const home = read('assets/product-experience/brightdesk-home.svg');
  assert.match(home, /Welcome to Brightdesk/);
  assert.match(home, /Your products/);
  assert.equal((home.match(/<svg x="/g) || []).length, 10, 'Home must embed all ten original product icons');
});

test('README and visual standard explain the contextual product-switching rule', () => {
  const readme = read('README.md');
  const standard = read('docs/BRIGHTDESK_VISUAL_STANDARD.md');
  assert.match(readme, /On the My Applications screen[\s\S]*?not repeated beside the ten product cards/);
  assert.match(readme, /under \*\*Switch product\*\*/);
  assert.match(standard, /Home.*My Applications.*Files/);
  assert.match(standard, /Create.*navigation item/);
  assert.match(standard, /online-service destinations/);
  assert.match(home, /links Home, My Applications and Files/);
  assert.doesNotMatch(home, /Create<\/text>/);
  assert.match(standard, /Inside an active product workspace[\s\S]*?Switch product/);
});
