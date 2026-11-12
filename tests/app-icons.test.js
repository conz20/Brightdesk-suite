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
const pictograph = /\p{Extended_Pictographic}/u;

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
    assert.doesNotMatch(svg, pictograph, `Emoji are not permitted in application artwork: ${file}`);
  }
});

test('the launcher and app navigation load the bundled icon artwork', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
  assert.ok(html.includes('id="dynamic-app-nav"'), 'product navigation is generated from the catalogue');
  assert.doesNotMatch(html, /assets\/icons\/(?:pages|sheets|decks|notes)\.svg/, 'product icons are not hard-coded into the HTML shell');
  assert.equal(catalog.filter(item => !item.iconAsset).length, 0, 'every catalogue product declares its own SVG artwork');
  assert.match(app, /function appIconPath\(item\)/);
  assert.match(app, /return `assets\/icons\/\$\{item\.iconAsset\}`/);
  assert.match(app, /icon\.src\s*=\s*appIconPath\(item\)/);
  assert.match(app, /app-icon-image/);
});

test('suite sidebar uses the original Brightdesk geometric brand mark, not a letter placeholder', () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
  const markPath = path.join(root, 'src', 'assets', 'brand', 'brightdesk-suite-mark.svg');
  assert.ok(fs.existsSync(markPath), 'Brightdesk geometric mark must be bundled with the app');
  assert.equal(html.includes('brightdesk-suite-mark.svg'), false, 'Suite mark belongs in native application identity, not Home navigation');
  assert.ok(html.includes('<title>Brightdesk Office Suite</title>'));
  assert.equal(html.includes('class="brand-mark">B</div>'), false);
});

test('suite and active app-module README files use original icon artwork without emoji', () => {
  const root = path.join(__dirname, '..');
  const readmes = [
    'README.md',
    'apps/pages/README.md',
    'apps/sheets/README.md',
    'apps/decks/README.md',
    'apps/notes/README.md',
    'apps/database/README.md',
    'apps/forms/README.md',
    'apps/lists/README.md',
    'apps/planner/README.md',
    'apps/todo/README.md'
  ];
  for (const relativePath of readmes) {
    const readme = fs.readFileSync(path.join(root, relativePath), 'utf8');
    assert.doesNotMatch(readme, pictograph, `Remove emoji from ${relativePath}`);
  }
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  for (const file of Object.values(iconFiles)) {
    assert.ok(readme.includes(`assets/icons/${file}`), `Main README must show the original icon ${file}`);
  }
});



test('native icon preparation copies canonical SVG sources for the Suite and every product', () => {
  const os = require('node:os');
  const { ICON_SOURCES, preparePlatformIcons } = require('../scripts/prepare-platform-icons');
  const root = path.join(__dirname, '..');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-platform-icons-'));
  const outputDir = path.join(tmp, 'native');
  try {
    const result = preparePlatformIcons({ rootDir: root, outputDir });
    assert.equal(result.iconCount, 11);
    assert.equal(result.fileCount, 11);
    for (const [id, sourcePath] of Object.entries(ICON_SOURCES)) {
      const source = fs.readFileSync(path.join(root, sourcePath), 'utf8');
      const prepared = fs.readFileSync(path.join(outputDir, `${id}.svg`), 'utf8');
      assert.equal(prepared, source, `${id} must use its canonical artwork`);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('Suite and product packagers use canonical SVG icons for all three platforms', () => {
  const root = path.join(__dirname, '..');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.build.directories.buildResources, 'assets/platform-icons/native');
  assert.equal(pkg.build.win.icon, 'suite.svg');
  assert.equal(pkg.build.mac.icon, 'suite.svg');
  assert.equal(pkg.build.linux.icon, 'suite.svg');
  const configPath = path.join(root, 'electron-builder.app.config.js');
  const previous = process.env.BRIGHTDESK_APP_ID;
  try {
    const nativeIds = { pages: 'pages', sheets: 'sheets', slides: 'decks', notes: 'notes', database: 'database', forms: 'forms', lists: 'lists', planner: 'planner', todo: 'todo', loop: 'workspace' };
    for (const app of catalog) {
      process.env.BRIGHTDESK_APP_ID = app.id;
      delete require.cache[require.resolve(configPath)];
      const config = require(configPath);
      assert.equal(config.directories.buildResources, 'assets/platform-icons/native');
      assert.equal(config.win.icon, `${nativeIds[app.id]}.svg`);
      assert.equal(config.mac.icon, `${nativeIds[app.id]}.svg`);
      assert.equal(config.linux.icon, `${nativeIds[app.id]}.svg`);
    }
  } finally {
    if (previous === undefined) delete process.env.BRIGHTDESK_APP_ID;
    else process.env.BRIGHTDESK_APP_ID = previous;
    delete require.cache[require.resolve(configPath)];
  }
  for (const script of ['dist', 'dist:win', 'dist:mac', 'dist:linux', 'release']) {
    assert.match(pkg.scripts[script], /release:prepare:icons/);
  }
});
