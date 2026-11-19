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
  assert.equal((home.match(/fill="#28764B">IN YOUR SUITE<\/text>/g) || []).length, 6);
  assert.equal((home.match(/fill="#47618B">AVAILABLE TO ADD<\/text>/g) || []).length, 4);
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
