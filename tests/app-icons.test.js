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
  assert.ok(html.includes('<img class="brand-mark-image" src="assets/brand/brightdesk-suite-mark.svg"'));
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


test('native platform icon archive contains verified Windows, macOS and Linux assets for the Suite and every product', async () => {
  const JSZip = require('jszip');
  const root = path.join(__dirname, '..');
  const archivePath = path.join(root, 'assets', 'platform-icons', 'brightdesk-platform-icons.zip');
  assert.ok(fs.existsSync(archivePath), 'native icon archive must be committed');
  const zip = await JSZip.loadAsync(fs.readFileSync(archivePath));
  const ids = ['suite', 'pages', 'sheets', 'decks', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'workspace'];
  assert.equal(Object.keys(zip.files).filter(name => !zip.files[name].dir).length, 34);
  for (const id of ids) {
    const png = await zip.file(`${id}.png`).async('nodebuffer');
    const ico = await zip.file(`${id}.ico`).async('nodebuffer');
    const icns = await zip.file(`${id}.icns`).async('nodebuffer');
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(png.readUInt32BE(16), 256);
    assert.equal(png.readUInt32BE(20), 256);
    assert.equal(ico.readUInt16LE(0), 0);
    assert.equal(ico.readUInt16LE(2), 1);
    assert.ok(ico.readUInt16LE(4) >= 6);
    assert.equal(icns.subarray(0, 4).toString('ascii'), 'icns');
    assert.equal(icns.readUInt32BE(4), icns.length);
    for (const type of ['ic07', 'ic08']) assert.ok(icns.includes(Buffer.from(type)), `${id}.icns missing ${type}`);
  }
});

test('Suite and integrated product packagers select their own native platform icons', () => {
  const root = path.join(__dirname, '..');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.build.directories.buildResources, 'assets/platform-icons/native');
  assert.equal(pkg.build.win.icon, 'suite.ico');
  assert.equal(pkg.build.mac.icon, 'suite.icns');
  assert.equal(pkg.build.linux.icon, 'suite.png');
  const configPath = path.join(root, 'electron-builder.app.config.js');
  const previous = process.env.BRIGHTDESK_APP_ID;
  try {
    for (const app of catalog) {
      process.env.BRIGHTDESK_APP_ID = app.id;
      delete require.cache[require.resolve(configPath)];
      const config = require(configPath);
      assert.equal(config.directories.buildResources, 'assets/platform-icons/native');
      const iconIds = { pages: 'pages', sheets: 'sheets', slides: 'decks', notes: 'notes', database: 'database', forms: 'forms', lists: 'lists', planner: 'planner', todo: 'todo', loop: 'workspace' };
      assert.equal(config.win.icon, `${iconIds[app.id]}.ico`);
      assert.equal(config.mac.icon, `${iconIds[app.id]}.icns`);
      assert.equal(config.linux.icon, `${iconIds[app.id]}.png`);
    }
  } finally {
    if (previous === undefined) delete process.env.BRIGHTDESK_APP_ID;
    else process.env.BRIGHTDESK_APP_ID = previous;
    delete require.cache[require.resolve(configPath)];
  }
});

test('native icon preparation validates and extracts the archive before installer packaging', async () => {
  const os = require('node:os');
  const { preparePlatformIcons } = require('../scripts/prepare-platform-icons');
  const root = path.join(__dirname, '..');
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-platform-icons-'));
  const outputDir = path.join(tmp, 'native');
  try {
    const result = await preparePlatformIcons({
      archivePath: path.join(root, 'assets', 'platform-icons', 'brightdesk-platform-icons.zip'),
      outputDir
    });
    assert.equal(result.iconCount, 11);
    assert.equal(result.fileCount, 34);
    for (const id of ['suite', ...catalog.map(app => app.id)]) {
      for (const extension of ['png', 'ico', 'icns']) assert.ok(fs.existsSync(path.join(outputDir, `${id}.${extension}`)));
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
