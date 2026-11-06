'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

test('Apps shows one suite-level sidebar entry instead of repeating the ten product cards', () => {
  const html = read('src/index.html');
  const app = read('src/app.js');
  assert.match(html, /id="app-centre-nav"/);
  assert.match(html, /id="dynamic-app-nav"/);
  assert.match(html, /data-i18n="sidebar\.applications">Apps<\/b>/);
  assert.match(html, /src="assets\/icons\/apps\.svg"/);
  assert.match(html, /class="brand-mark-image" src="assets\/brand\/brightdesk-suite-mark\.svg"/);
  assert.match(read('src/assets/icons/apps.svg'), /Apps/);
  assert.match(read('src/assets/brand/brightdesk-suite-mark.svg'), /Brightdesk Office Suite/);
  assert.match(read('src/assets/brand/brightdesk-suite-mark.svg'), /viewBox="0 0 160 160"/);
  assert.doesNotMatch(html, /class="nav[^\"]*create|id="(?:create|new)-nav"/i);
  assert.doesNotMatch(html, /data-app="(?:pages|sheets|slides|notes|database|forms|lists|planner|todo|loop)"/);
  assert.match(app, /catalog\.filter\(item => installedApp\(item\.id\) && !state\.hiddenProducts\.includes\(item\.id\)\)/);
  assert.match(app, /\$\('dynamic-app-nav'\)\.hidden = suitePage \|\| languages \|\| Boolean\(launchAppId\)/);
  assert.match(app, /\$\('app-centre-nav'\)\.hidden = !suitePage \|\| Boolean\(launchAppId\)/);
  assert.match(app, /manager \? t\('sidebar\.applications'\)/);
});

test('uninstall requires confirmation and does not delete local documents', () => {
  const app = read('src/app.js');
  assert.match(app, /window\.confirm\(`Uninstall \$\{product\?\.name/);
  assert.match(app, /state\.installedApps = state\.installedApps\.filter/);
  assert.doesNotMatch(app, /delete state\.docs/);
});

test('product settings menu can hide an installed product from Switch product navigation', () => {
  const app = read('src/app.js');
  assert.match(app, /hiddenProducts: \[\]/);
  assert.match(app, /hiddenProducts: state\.hiddenProducts/);
  assert.match(app, /state\.hiddenProducts = Array\.isArray\(appSetup\?\.hiddenProducts\)/);
  assert.match(app, /catalog\.filter\(item => installedApp\(item\.id\) && !state\.hiddenProducts\.includes\(item\.id\)\)/);
  assert.match(app, /More options for \$\{item\.name\}/);
  assert.match(app, /Hide from Switch product/);
  assert.match(app, /visibleProducts\.length <= 1/);
  assert.match(read('src/assets/icons/more.svg'), /circle/);
  assert.match(read('src/styles.css'), /app-card-menu-trigger/);
});

test('the live desktop shell provides Home, Apps and Files navigation', () => {
  const html = read('src/index.html');
  const app = read('src/app.js');
  const en = JSON.parse(read('src/languages/en-AU.json')).translations;
  assert.equal(en['sidebar.home'], 'Home');
  assert.equal(en['sidebar.files'], 'Files');
  assert.match(read('src/assets/icons/home.svg'), /<svg/);
  assert.match(read('src/assets/icons/files.svg'), /<svg/);
  assert.match(html, /id="home-nav"/);
  assert.match(html, /id="app-centre-nav"/);
  assert.match(html, /id="files-nav"/);
  assert.match(html, /id="files-manager"/);
  assert.match(html, /id="files-open-button"/);
  assert.match(html, /id="files-save-button"/);
  assert.match(app, /state\.view = 'home'/);
  assert.match(app, /state\.view = 'files'/);
  assert.match(app, /finish-app-setup'\)\.addEventListener\('click',[\s\S]*?state\.view='home'/);
  assert.match(app, /back-to-apps'\)\.addEventListener\('click',[\s\S]*?state\.view='manager'/);
  assert.match(app, /\$\('home-nav'\)\.addEventListener/);
  assert.match(app, /\$\('files-nav'\)\.addEventListener/);
  assert.match(app, /\$\('files-open-button'\)\.addEventListener\('click', openFile\)/);
  assert.match(app, /\$\('files-save-button'\)\.addEventListener\('click', saveProject\)/);
});

test('all ten installed products remain available in the product-switching sidebar during workspace use', () => {
  const app = read('src/app.js');
  const catalogue = require('../src/app-catalog');
  assert.equal(catalogue.length, 10);
  assert.match(app, /function syncAppNavigation\(\)[\s\S]*?catalog\.filter\(item => installedApp\(item\.id\) && !state\.hiddenProducts\.includes\(item\.id\)\)/);
  assert.match(app, /button\.addEventListener\('click',\(\)=>setApp\(item\.id\)\)/);
  assert.match(app, /const suitePage = home \|\| manager \|\| files/);
});

test('one Brightdesk Home artwork combines the suite sidebar and ten-product grid', () => {
  const svg = read('assets/product-experience/brightdesk-home.svg');
  assert.equal((svg.match(/id="sidebar-applications"/g) || []).length, 1);
  assert.doesNotMatch(svg, /id="sidebar-(?:pages|sheets|decks|notes|database|forms|lists|planner|todo|workspace)-/);
  assert.match(svg, /Brightdesk Office Suite Home experience/);
  assert.match(svg, /Product shortcuts are not repeated beside the Home application grid/);
  assert.match(svg, /id="settings-cogwheel"/);
  assert.match(svg, /id="notifications-bell"/);

  assert.match(read('src/styles.css'), /\.sidebar\{background:linear-gradient\(180deg,#14233f 0%,#0d1930 100%\)/);
  const home = read('assets/product-experience/brightdesk-home.svg');
  assert.match(home, /Your apps/);
  assert.match(home, /Your products/);
  assert.match(home, /id="apps-launcher-icon"/);
  assert.equal((home.match(/<svg x="/g) || []).length, 10, 'Home must embed all ten original product icons');
});

test('Apps cards use the approved icon-first layout without concept preview images', () => {
  const app = read('src/app.js');
  const styles = read('src/styles.css');
  assert.doesNotMatch(app, /className = 'app-preview'/);
  assert.match(app, /card\.append\(header, description, footer\)/);
  assert.match(styles, /\.manager-grid\{[^}]*repeat\(auto-fit,minmax\(min\(100%,230px\),1fr\)\)/);
  assert.match(styles, /\.app-card\{[^}]*border-radius:16px/);
  assert.doesNotMatch(styles, /app-preview/);
});

test('README and visual standard explain the contextual product-switching rule', () => {
  const readme = read('README.md');
  const standard = read('docs/BRIGHTDESK_VISUAL_STANDARD.md');
  const home = read('assets/product-experience/brightdesk-home.svg');
  assert.match(readme, /approved sidebar uses \\*\\*Home\\*\\*, \\*\\*Apps\\*\\* and \\*\\*Files\\*\\*/);
  assert.match(readme, /in the \*\*Switch product\*\*/);
  assert.match(readme, /hide or restore an installed product/);
  assert.equal((readme.match(/assets\/product-experience\/brightdesk-home\.svg/g) || []).length, 1);
  assert.doesNotMatch(readme, /brightdesk-app-centre\.svg/);
  assert.doesNotMatch(home, /Install a product|Update Brightdesk/);
  assert.match(standard, /Home.*Apps.*Files/);
  assert.match(standard, /Create.*navigation item/);
  assert.match(standard, /online-service destinations/);
  assert.match(home, /links Home, Apps and Files/);
  assert.doesNotMatch(home, /Create<\/text>/);
  assert.match(standard, /Inside an active product workspace[\s\S]*?Switch product/);
});
