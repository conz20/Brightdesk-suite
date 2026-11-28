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
  assert.doesNotMatch(html, /brand-mark-image|brightdesk-suite-mark\.svg/);
  assert.match(read('src/assets/icons/apps.svg'), /Apps/);
  assert.match(html, /<title>Brightdesk Office Suite<\/title>/);
  assert.match(read('src/main.js'), /Brightdesk Office Suite/);
  assert.doesNotMatch(html, /class="nav[^\"]*create|id="(?:create|new)-nav"/i);
  assert.doesNotMatch(html, /data-app="(?:pages|sheets|slides|notes|database|forms|lists|planner|todo|loop)"/);
  assert.match(app, /getNavigationProducts\(installableCatalog, state\.installedApps, state\.hiddenProducts, launchAppId, window\.brightdesk\.suiteLaunchedProduct\)/);
  assert.match(app, /getNavigationProducts\(/);
  assert.match(app, /\$\('dynamic-app-nav'\)\.hidden = suitePage \|\| languages/);
  assert.match(app, /\$\('app-centre-nav'\)\.hidden = !suitePage \|\| Boolean\(launchAppId\)/);
  assert.match(app, /manager \? t\('sidebar\.applications'\)/);
});

test('removing an app from the Suite requires confirmation and does not delete local documents', () => {
  const app = read('src/app.js');
  assert.match(app, /window\.confirm\(`Remove \$\{product\?\.name \|\| 'this product'\} from the Suite/);
  assert.match(app, /removeAppSelection\(/);
  assert.doesNotMatch(app, /delete state\.docs/);
});

test('product settings menu can hide an installed product from Switch product navigation', () => {
  const app = read('src/app.js');
  assert.match(app, /hiddenProducts: \[\]/);
  assert.match(app, /hiddenProducts: state\.hiddenProducts/);
  assert.match(app, /state\.hiddenProducts = Array\.isArray\(appSetup\?\.hiddenProducts\)/);
  assert.match(app, /getNavigationProducts\(/);
  assert.match(app, /More options for \$\{item\.name\}/);
  assert.match(app, /Hide from Switch product/);
  assert.match(app, /setProductVisibility\(/);
  assert.doesNotMatch(app, /visibleProducts\.length <= 1/);
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
  const filesIcon = read('src/assets/icons/files.svg');
  const homeArtwork = read('assets/product-experience/brightdesk-home.svg');
  assert.match(filesIcon, /<title[^>]*>Files<\/title>/);
  assert.match(filesIcon, /<path[^>]*data-role="document-stack"/);
  assert.match(homeArtwork, /id="files-folder-documents-icon"/);
  assert.match(homeArtwork, /data-role="document-stack"/);
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

test('all ten approved products can appear in the product-switching sidebar during workspace use', () => {
  const app = read('src/app.js');
  const catalogue = require('../src/app-catalog');
  assert.equal(catalogue.length, 10);
  assert.match(app, /function syncAppNavigation\(\)[\s\S]*?getNavigationProducts\(/);
  assert.match(app, /button\.addEventListener\('click', async \(\) =>[\s\S]*?window\.brightdesk\.openApplication\(item\.id\)/);
  assert.match(app, /const suitePage = home \|\| manager \|\| files/);
});

test('one Brightdesk Home artwork combines the suite sidebar and ten-product grid', () => {
  const svg = read('assets/product-experience/brightdesk-home.svg');
  assert.equal((svg.match(/id="sidebar-applications"/g) || []).length, 1);
  assert.doesNotMatch(svg, /id="sidebar-(?:pages|sheets|decks|notes|database|forms|lists|planner|todo|workspace)-/);
  assert.match(svg, /Desktop productivity Home experience/);
  assert.match(svg, /Product shortcuts are not repeated beside the Home application grid/);
  assert.match(svg, /id="settings-cogwheel"/);
  assert.match(svg, /id="notifications-bell"/);

  assert.match(read('src/styles.css'), /\.sidebar\{background:#14233f/);
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
  assert.match(readme, /approved sidebar uses \*\*Home\*\*, \*\*Apps\*\* and \*\*Files\*\*/);
  assert.match(readme, /in the \*\*Switch product\*\*/);
  assert.ok(readme.includes("hide or restore an enabled product in the Suite's **Switch product** list"));
  assert.equal((readme.match(/assets\/product-experience\/brightdesk-home\.svg/g) || []).length, 1);
  assert.doesNotMatch(readme, /brightdesk-app-centre\.svg/);
  assert.doesNotMatch(home, /Install a product|Update Brightdesk/);
  assert.match(standard, /Home.*Apps.*Files/);
  assert.match(standard, /Create.*navigation item/);
  assert.match(standard, /online-service destinations/);
  assert.match(home, /links Home, Apps and Files/);
  assert.doesNotMatch(home, /Create<\/text>/);
  assert.ok(standard.includes("In the Suite's own workspace context"));
  assert.ok(standard.includes('Switch product'));
});


test('production Home artwork matches the live desktop headings and card layout', () => {
  const html = read('src/index.html');
  const styles = read('src/styles.css');
  const readme = read('README.md');
  const guide = read('docs/BRIGHTDESK_VISUAL_STANDARD.md');
  const home = read('assets/product-experience/brightdesk-home.svg');
  assert.ok(html.includes('<h1 id="app-title">Your apps</h1>'));
  assert.ok(home.includes('y="65" font-family="Arial, sans-serif" font-size="12" font-weight="700" letter-spacing="2" fill="#7786A0">YOUR WORKSPACE</text>'));
  assert.ok(home.includes('y="111" font-family="Arial, sans-serif" font-size="34" font-weight="700" fill="#1B2941">Your apps</text>'));
  assert.ok(home.includes('y="202" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#1B2941">Your products</text>'));
  assert.ok(home.includes('Ten focused tools, connected by one Brightdesk experience.'));
  assert.ok(!home.includes('BRIGHTDESK APPS'));
  assert.ok(!home.includes('Your documents and applications, together in one place.'));
  assert.ok(styles.includes('.app-manager.home-view .manager-grid {'));
  assert.ok(styles.includes('min(100%, 240px)'));
  assert.ok(styles.includes('gap: 16px;'));
  assert.ok(styles.includes('min-height: 240px;'));
  assert.ok(readme.includes('refreshed Home screen design reference'));
  assert.ok(readme.includes('top bar reads **Your apps**'));
  assert.ok(readme.includes('76 px solid-navy rail'));
  assert.ok(readme.includes('38 px circular Notifications and Settings controls'));
  assert.ok(guide.includes('top-bar eyebrow **YOUR WORKSPACE** and heading **Your apps**'));
});


test('production Home activates its dedicated shell layout and circular utility controls', () => {
  const html = read('src/index.html');
  const app = read('src/app.js');
  const styles = read('src/styles.css');
  assert.ok(html.includes('<title>Brightdesk Office Suite</title>'));
  assert.equal(html.includes('brand-mark-image'), false);
  assert.ok(!html.includes('<small data-i18n="sidebar.workspace">YOUR WORKSPACE</small>'));
  assert.ok(app.includes("document.body.classList.toggle('suite-home', home)"));
  assert.ok(styles.includes('width: 76px;'));
  assert.ok(styles.includes('body.suite-navigation .sidebar'));
  assert.ok(app.includes("document.body.classList.toggle('suite-navigation', suitePage && !launchAppId)"));
  assert.ok(styles.includes('width: 38px;'));
  assert.ok(styles.includes('body.suite-home .main'));
  assert.ok(styles.includes('font-size: 34px;'));
  assert.ok(styles.includes('padding: 56px 4.125vw 20px 2vw;'));
});


test('Suite navigation rail hides sidebar extras and keeps the compact icon labels', () => {
  const html = read('src/index.html');
  const app = read('src/app.js');
  const styles = read('src/styles.css');
  const readme = read('README.md');
  assert.ok(html.includes('<small id="platform">Desktop</small>'));
  assert.ok(html.includes('<small id="version-label">Local-first · Your files stay here</small>'));
  const preload = read('src/preload.js');
  assert.ok(preload.includes('platform: process.platform,'));
  assert.ok(!app.includes("$('version-label').textContent ="));
  assert.ok(app.includes("document.body.classList.toggle('suite-navigation', suitePage && !launchAppId)"));
  assert.ok(styles.includes('body.suite-navigation .section-label'));
  assert.ok(styles.includes('body.suite-navigation .sidebar-divider'));
  assert.ok(styles.includes('body.suite-navigation .sidebar-bottom'));
  assert.ok(styles.includes('body.suite-navigation .nav > span'));
  assert.ok(styles.includes('body.suite-navigation .nav {'));
  assert.ok(readme.includes('76 px wide'));
  assert.ok(readme.includes('icon above its name'));
});



test('Suite-level navigation uses a solid 76 px rail with vertically stacked icon labels', () => {
  const html = read('src/index.html');
  const app = read('src/app.js');
  const styles = read('src/styles.css');
  const readme = read('README.md');
  const guide = read('docs/BRIGHTDESK_VISUAL_STANDARD.md');

  for (const id of ['home-nav', 'app-centre-nav', 'files-nav']) {
    assert.match(html, new RegExp('id="' + id + '"'));
  }
  assert.match(app, /document\.body\.classList\.toggle\('suite-navigation', suitePage && !launchAppId\)/);
  assert.match(styles, /body\.suite-navigation \.sidebar\s*\{[^}]*width: 76px;[^}]*background: #14233f;/s);
  assert.match(styles, /body\.suite-navigation \.nav\s*\{[^}]*flex-direction: column;/s);
  assert.match(styles, /body\.suite-navigation \.nav \.app-icon-image\s*\{[^}]*width: 24px;/s);
  assert.match(styles, /body\.suite-navigation \.nav > span\s*\{[^}]*text-align: center;/s);
  assert.match(styles, /body\.suite-navigation \.sidebar-bottom\s*\{[^}]*display: none;/s);
  assert.match(readme, /76 px wide/);
  assert.match(guide, /76 px.*solid.*navy/i);
});

test('Home product section uses one clear heading without the Apps eyebrow', () => {
  const styles = read('src/styles.css');
  const readme = read('README.md');
  const guide = read('docs/BRIGHTDESK_VISUAL_STANDARD.md');
  assert.ok(styles.includes('body.suite-home .app-manager.home-view .manager-hero .eyebrow { display: none; }'));
  assert.ok(readme.includes('redundant **MY APPS** label is hidden on Home'));
  assert.ok(guide.includes('Do not place an additional eyebrow label above this heading.'));
});
