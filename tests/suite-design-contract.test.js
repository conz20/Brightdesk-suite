'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

function luminance(hex) {
  const value = hex.replace('#', '');
  const linear = part => {
    const channel = parseInt(part, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * linear(value.slice(0, 2)) +
    0.7152 * linear(value.slice(2, 4)) +
    0.0722 * linear(value.slice(4, 6));
}

function contrastRatio(foreground, background) {
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test('Home Apps launcher icon is a four-tile grid entirely inside the Apps row', () => {
  const home = read('assets/product-experience/brightdesk-home.svg');
  const group = home.match(/<g id="apps-launcher-icon"[^>]*>([\s\S]*?)<\/g>/)?.[1];
  assert.ok(group, 'Home artwork must include its Apps launcher icon');
  const tiles = [...group.matchAll(/<rect x="(\d+)" y="(\d+)" width="8" height="8"/g)]
    .map(match => [Number(match[1]), Number(match[2])]);
  assert.deepEqual(tiles, [[27, 125], [39, 125], [27, 137], [39, 137]]);
});

test('Home artwork includes the Product settings menu on all ten product cards', () => {
  const home = read('assets/product-experience/brightdesk-home.svg');
  const ids = [...home.matchAll(/id="product-settings-menu-([a-z-]+)"/g)].map(match => match[1]);
  assert.deepEqual(ids, ['pages','sheets','decks','notes','database','forms','lists','planner','todo','workspace']);
  assert.doesNotMatch(home, /Ten original desktop products · Local-first files · Update alerts in Notifications/);
});

test('Home status labels and card copy meet WCAG AA contrast and match live UI tokens', () => {
  const home = read('assets/product-experience/brightdesk-home.svg');
  const styles = read('src/styles.css');
  const pairs = [
    ['#5F6F88', '#F2F5FA', 'Home eyebrow'],
    ['#5F7088', '#F2F5FA', 'Home product description'],
    ['#64728A', '#FFFFFF', 'Product card subtitle'],
    ['#28764B', '#EFF8F2', 'In your Suite status'],
    ['#47618B', '#F0F5FC', 'Available to add status'],
    ['#7184A7', '#0D1930', 'Sidebar local-first footer'],
    ['#C4CFE2', '#14233F', 'Sidebar navigation'],
    ['#FFFFFF', '#536DD2', 'Add to Suite button'],
    ['#FFFFFF', '#233B67', 'Open button'],
    ['#52627A', '#FFFFFF', 'Remove from Suite button']
  ];
  for (const [foreground, background, label] of pairs) {
    assert.ok(contrastRatio(foreground, background) >= 4.5, label + ' must meet 4.5:1 contrast');
  }
  assert.ok(styles.includes('.section-label, .eyebrow { color: #5F6F88;'));
  assert.ok(styles.includes('.app-manager.home-view .manager-hero p{font-size:12px;color:#5F7088}'));
  assert.ok(styles.includes('.app-card-heading small { display: block; margin-top: 3px; color: #64728A;'));
  assert.ok(styles.includes('background: #eff8f2; color: #28764b;'));
  assert.ok(styles.includes('background: #f0f5fc; color: #47618b;'));
  assert.equal((home.match(/fill="#28764B">IN YOUR SUITE<\/text>/g) || []).length, 10);
  assert.equal((home.match(/fill="#47618B">AVAILABLE TO ADD<\/text>/g) || []).length, 0);
  assert.equal((home.match(/>Open<\/text>/g) || []).length, 10);
  assert.equal((home.match(/>Remove from Suite<\/text>/g) || []).length, 10);
  assert.equal((home.match(/>Add to Suite<\/text>/g) || []).length, 0);
  assert.ok(!home.includes('fill="#B66A20">AVAILABLE TO ADD</text>'));
  assert.ok(home.includes('fill="#5F6F88">YOUR WORKSPACE</text>'));
  assert.ok(home.includes('fill="#5F7088">Ten focused tools, connected by one Brightdesk experience.</text>'));
  assert.ok(home.includes('fill="#64728A">Documents &amp; writing</text>'));
});

test('visual standard documents the integrated Suite window and separate product-package models accurately', () => {
  const standard = read('docs/BRIGHTDESK_VISUAL_STANDARD.md');
  const main = read('src/main.js');
  assert.match(standard, /Suite process/);
  assert.match(standard, /not a separate operating-system process/i);
  assert.match(standard, /separately packaged product/);
  assert.match(main, /suite-product-window/);
  assert.match(main, /productWindowManager\.open\(requestedApplicationId\)/);
});


test('Home artwork shows the workspace eyebrow once, above Your apps', () => {
  const home = read('assets/product-experience/brightdesk-home.svg');
  const html = read('src/index.html');
  const app = read('src/app.js');
  assert.equal((home.match(/>YOUR WORKSPACE<\/text>/g) || []).length, 1);
  assert.ok(home.includes('<text x="270" y="65"'));
  assert.match(html, /id="sidebar-section-label"/);
  assert.match(app, /sidebar-section-label.*hidden = Boolean\(launchAppId\) \|\| suitePage/);
});

test('Home matches the approved 1600 by 900 grid proportions and responsive fallback', () => {
  const styles = read('src/styles.css');
  assert.match(styles, /\.sidebar\s*\{\s*width:\s*190px;\s*flex:\s*0 0 190px;/);
  assert.match(styles, /body\.suite-home \.main\s*\{\s*padding:\s*56px 4\.125vw 20px 2vw;/);
  assert.match(styles, /\.app-manager\.home-view \.manager-grid\s*\{\s*grid-template-columns:\s*repeat\(auto-fit, minmax\(min\(100%, 240px\), 1fr\)\);\s*gap:\s*16px;/);
  assert.match(styles, /body\.suite-home \.app-manager\.home-view \.manager-grid\s*\{[\s\S]*?column-gap:\s*16px;\s*row-gap:\s*18px;/);
  assert.match(styles, /@media \(min-width: 1500px\)\s*\{\s*\.app-manager\.home-view \.manager-grid\s*\{\s*grid-template-columns:\s*repeat\(5, minmax\(0, 1fr\)\);/);
  assert.match(styles, /\.app-manager\.home-view\s*\{\s*width:\s*100%;\s*align-self:\s*stretch;/);
  assert.match(styles, /\.app-manager\.home-view \.app-card\s*\{\s*min-height:\s*240px;/);
  assert.match(styles, /@media \(max-width: 700px\)\s*\{\s*\.app-manager\.home-view \.manager-grid \{ grid-template-columns: 1fr;/);
  const availableWidth = 1600 - 190 - (1600 * 0.02) - (1600 * 0.04125);
  const fiveCardRowWidth = (5 * 240) + (4 * 16);
  assert.ok(availableWidth >= fiveCardRowWidth, 'five 240px cards and four 16px gaps must fit the 1600px reference width');
});

test('Home controls retain visible keyboard focus, reduced motion and accessible touch sizes', () => {
  const styles = read('src/styles.css');
  const html = read('src/index.html');
  const app = read('src/app.js');
  assert.match(styles, /button:focus-visible, a:focus-visible, input:focus-visible/);
  assert.match(styles, /\.app-card-menu-trigger:focus-visible/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.match(styles, /\.icon-button\s*\{[\s\S]*?width:\s*38px;\s*height:\s*38px;/);
  assert.match(styles, /\.app-card-menu-trigger\s*\{\s*width:\s*34px;\s*height:\s*34px;/);
  assert.match(html, /aria-label="Open notifications"/);
  assert.match(html, /aria-label="Open Brightdesk settings"/);
  assert.match(app, /More options for/);
});


test('Home sidebar uses compact 20px navigation icons and text-only labels', () => {
  const styles = read('src/styles.css');
  const html = read('src/index.html');
  assert.match(styles, /\.sidebar > \.nav \.app-icon-image\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;/);
  assert.match(styles, /\.sidebar > \.nav small\s*\{\s*display:\s*none;\s*\}/);
  assert.match(styles, /\.sidebar #dynamic-app-nav \.nav \.app-icon-image\s*\{[^}]*width:\s*26px;[^}]*height:\s*26px;/);
  assert.match(styles, /\.sidebar #dynamic-app-nav \.nav small\s*\{\s*display:\s*none;\s*\}/);
  assert.match(html, /src="assets\/icons\/home\.svg"/);
  assert.match(html, /src="assets\/icons\/apps\.svg"/);
  assert.match(html, /src="assets\/icons\/files\.svg"/);
});


test('README displays the current Home reference and documents the exact compact sidebar', () => {
  const readme = read('README.md');
  const home = read('assets/product-experience/brightdesk-home.svg');
  assert.match(readme, /src="assets\/product-experience\/brightdesk-home\.svg"/);
  assert.match(readme, /20 px SVG icon beside its label/);
  assert.match(readme, /no descriptive captions appear beneath the labels/);
  assert.match(readme, /all ten products marked \*\*In your Suite\*\*/);
  assert.match(readme, /not a screenshot captured from a running build/);
  assert.doesNotMatch(readme, /46 px Suite mark|25 px wordmark/);
  assert.equal((home.match(/>Home<\/text>/g) || []).length, 1);
  assert.equal((home.match(/>Apps<\/text>/g) || []).length, 1);
  assert.equal((home.match(/>Files<\/text>/g) || []).length, 1);
  assert.doesNotMatch(home, /Your work in one place|All your desktop applications|Open and save files on this device/);
});
