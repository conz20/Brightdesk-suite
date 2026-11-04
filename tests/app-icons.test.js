'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const catalog = require('../src/app-catalog');

const iconFiles = {
  pages: 'pages.svg', sheets: 'sheets.svg', slides: 'decks.svg', notes: 'notes.svg',
  database: 'database.svg', forms: 'forms.svg', lists: 'lists.svg', planner: 'planner.svg',
  todo: 'to-do.svg', loop: 'workspace.svg'
};

test('all ten Brightdesk applications have their own bundled illustrated SVG icon', () => {
  const iconRoot = path.join(__dirname, '..', 'src', 'assets', 'icons');
  assert.equal(catalog.length, 10);
  for (const app of catalog) {
    const file = iconFiles[app.id];
    assert.ok(file, `Missing icon mapping for ${app.id}`);
    const iconPath = path.join(iconRoot, file);
    assert.ok(fs.existsSync(iconPath), `Missing bundled icon: ${file}`);
    const svg = fs.readFileSync(iconPath, 'utf8');
    assert.match(svg, /<svg[^>]+role="img"/);
    assert.match(svg, /<title/);
    assert.match(svg, /<linearGradient/);
  }
});

test('the launcher and app navigation load the bundled icon artwork', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
  for (const id of ['pages', 'sheets', 'decks', 'notes']) assert.ok(html.includes(`assets/icons/${id}.svg`));
  assert.match(app, /function appIconPath\(item\)/);
  assert.match(app, /icon\.src\s*=\s*appIconPath\(item\)/);
  assert.match(app, /app-icon-image/);
});
