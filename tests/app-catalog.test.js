'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const catalog = require('../src/app-catalog');

test('app catalogue shows all ten first-release apps and identifies the complete implemented suite', () => {
  assert.deepEqual(catalog.slice(0, 4).map(app => app.id), ['pages', 'sheets', 'slides', 'notes']);
  assert.deepEqual(catalog.slice(0, 4).map(app => app.name), ['Brightdesk Pages', 'Brightdesk Sheets', 'Brightdesk Decks', 'Brightdesk Notes']);
  assert.equal(catalog.length, 10);
  assert.deepEqual(catalog.filter(app => app.availability === 'available').map(app => app.id), ['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop']);
  assert.deepEqual(catalog.filter(app => app.availability === 'planned').map(app => app.id), []);
});

test('every app has a unique id, release version and user-facing details', () => {
  const ids = catalog.map(app => app.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const app of catalog) {
    assert.match(app.moduleVersion, /^\d+\.\d+\.\d+$/);
    assert.ok(app.name && app.subtitle && app.description && app.icon);
  }
});


test('first release version is consistently 0.1.0 across package, available apps and shell', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.join(__dirname, '..');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
  assert.equal(pkg.version, '0.1.0');
  for (const app of catalog.filter(item => item.availability === 'available')) assert.equal(app.moduleVersion, pkg.version);
  assert.match(html, /Version 0\.1\.0/);
  assert.match(html, /Brightdesk 0\.1\.0/);
});

test('Brightdesk keeps its own identity and does not claim Microsoft affiliation', () => {
  const fs = require('node:fs');
  const readme = fs.readFileSync(require('node:path').join(__dirname, '..', 'README.md'), 'utf8');
  assert.match(readme, /independent/i);
  assert.match(readme, /not affiliated with Microsoft/i);
});

test('automatic updates stay clearly disabled until a real GitHub owner is configured', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  assert.deepEqual(pkg.build.publish, []);
  const main = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.js'), 'utf8');
  assert.match(main, /Automatic updates will be available after the Brightdesk GitHub release repository is configured/);
});

test('the main app rail keeps the four core apps as the permanent base rail', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.html'), 'utf8');
  for (const name of ['Brightdesk Pages', 'Brightdesk Sheets', 'Brightdesk Decks', 'Brightdesk Notes']) assert.match(html, new RegExp(`<b>${name}</b>`));
  for (const oldName of ['<b>Word</b>', '<b>Excel</b>', '<b>PowerPoint</b>', '<b>OneNote</b>']) assert.doesNotMatch(html, new RegExp(oldName));
});

test('catalog is hard-limited to the ten approved Brightdesk apps', () => {
  assert.deepEqual(catalog.map(item => item.id), ['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop']);
  assert.deepEqual(catalog.map(item => item.name), ['Brightdesk Pages','Brightdesk Sheets','Brightdesk Decks','Brightdesk Notes','Brightdesk Database','Brightdesk Forms','Brightdesk Lists','Brightdesk Planner','Brightdesk To Do','Brightdesk Workspace']);
  const forbidden = ['teams','outlook','onedrive','diagrams','stories','video','whiteboard','bookings','sharepoint','powerapps','powerautomate','analytics','projects','viva','places','copilot'];
  for (const id of forbidden) assert.equal(catalog.some(item => item.id === id), false, `forbidden app present: ${id}`);
});

test('the canonical product scope lock matches the executable catalogue', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const scope = fs.readFileSync(path.join(__dirname, '..', 'PRODUCT_SCOPE_LOCK.md'), 'utf8');
  for (const name of catalog.map(item => item.name)) assert.ok(scope.includes(name), `scope lock missing ${name}`);
  for (const excluded of ['Outlook', 'OneDrive', 'Teams']) assert.match(scope, new RegExp(`\\b${excluded}\\b`));
  assert.match(scope, /scope can change only when the user explicitly instructs/i);
});

test('all catalogue modules have independent Brightdesk metadata', () => {
  for (const item of catalog) {
    assert.ok(item.id && item.name && item.description && item.moduleVersion);
    assert.equal(typeof item.microsoftReference, 'string');
  }
});

test('all ten integrated apps are marked installable', () => {
  const available = catalog.filter(item => item.availability === 'available').map(item => item.id);
  assert.deepEqual(available, ['pages', 'sheets', 'slides', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'loop']);
  assert.equal(catalog.filter(item => item.availability !== 'available').length, 0);
});

test('standalone app packaging has independent product IDs and all three platform targets', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.join(__dirname, '..');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const appScriptIds = { pages: 'pages', sheets: 'sheets', slides: 'decks', notes: 'notes', database: 'database', forms: 'forms', lists: 'lists', planner: 'planner', todo: 'todo', loop: 'workspace' };
  for (const scriptId of Object.values(appScriptIds)) {
    for (const platform of ['win', 'mac', 'linux']) assert.ok(pkg.scripts[`dist:${scriptId}:${platform}`], `missing ${scriptId} ${platform} installer command`);
  }
  const builder = fs.readFileSync(path.join(root, 'electron-builder.app.config.js'), 'utf8');
  assert.match(builder, /org\.brightdesk\.\$\{appId\}/);
  assert.match(builder, /brightdeskAppId: appId/);
  assert.match(builder, /extraMetadata: \{ brightdeskAppId: appId, productName:/);
  const configPath = path.join(root, 'electron-builder.app.config.js');
  const previousAppId = process.env.BRIGHTDESK_APP_ID;
  const products = [];
  try {
    for (const [id, name, artifactSlug] of [['pages','Pages','Pages'],['sheets','Sheets','Sheets'],['slides','Decks','Decks'],['notes','Notes','Notes'],['database','Database','Database'],['forms','Forms','Forms'],['lists','Lists','Lists'],['planner','Planner','Planner'],['todo','To Do','To-Do'],['loop','Workspace','Workspace']]) {
      process.env.BRIGHTDESK_APP_ID = id;
      delete require.cache[require.resolve(configPath)];
      const config = require(configPath);
      assert.equal(config.appId, `org.brightdesk.${id}`);
      assert.equal(config.extraMetadata.brightdeskAppId, id);
      assert.equal(config.extraMetadata.productName, `Brightdesk ${name}`);
      assert.ok(config.win.artifactName.includes(artifactSlug));
      assert.equal(config.directories.output, `release/apps/${id}`);
      assert.ok(config.mac.target.includes('pkg'), `${name} mac build must include pkg for installer licence`);
      assert.ok(config.mac.target.includes('dmg'), `${name} mac build must include dmg`);
      assert.ok(config.mac.target.includes('zip'), `${name} mac build must include zip`);
      products.push(config.productName);
    }
  } finally {
    if (previousAppId === undefined) delete process.env.BRIGHTDESK_APP_ID;
    else process.env.BRIGHTDESK_APP_ID = previousAppId;
    delete require.cache[require.resolve(configPath)];
  }
  assert.equal(new Set(products).size, 10);
  const main = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf8');
  assert.match(main, /--brightdesk-app=/);
  const preload = fs.readFileSync(path.join(root, 'src', 'preload.js'), 'utf8');
  assert.match(preload, /launchAppId/);
  const renderer = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
  assert.match(renderer, /launchAppId && app !== launchAppId/);
  assert.match(renderer, /This Brightdesk .* installation opens/);
});

test('the standalone build scripts reject unknown app and platform identifiers', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.join(__dirname, '..');
  const build = fs.readFileSync(path.join(root, 'scripts', 'build-app.js'), 'utf8');
  assert.match(build, /Usage: node scripts\/build-app\.js/);
  assert.match(build, /'pkg'/);
  assert.match(build, /new Set\(\['pages', 'sheets', 'slides', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'loop'\]\)/);
  const config = fs.readFileSync(path.join(root, 'electron-builder.app.config.js'), 'utf8');
  assert.match(config, /Set BRIGHTDESK_APP_ID/);
  const builds = fs.readFileSync(path.join(root, 'scripts', 'build-apps.js'), 'utf8');
  assert.match(builds, /\['pages', 'sheets', 'slides', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'loop'\]/);
  assert.match(builds, /for \(const appId of apps\)/);
  const main = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf8');
  const preload = fs.readFileSync(path.join(root, 'src', 'preload.js'), 'utf8');
  const downloads = fs.readFileSync(path.join(root, 'src', 'standalone-downloads.js'), 'utf8');
  assert.match(main, /const supportedStandaloneApps = new Set\(Object\.keys\(APP_SLUGS\)\)/);
  for (const id of ['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop']) {
    assert.ok(preload.includes(`'${id}'`), `preload must expose standalone ${id}`);
    assert.match(downloads, new RegExp(`\\b${id}: '`), `download map must include standalone ${id}`);
  }
});


test('the app centre offers a standalone download action for all ten apps', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.join(__dirname, '..');
  const renderer = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
  const preload = fs.readFileSync(path.join(root, 'src', 'preload.js'), 'utf8');
  const main = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf8');
  assert.match(renderer, /downloadStandaloneApp\(item\.id\)/);
  assert.match(renderer, /Download standalone/);
  assert.match(preload, /downloadStandaloneApp/);
  assert.match(main, /downloads:standalone-app/);
});

test('every first-release app has its own original preview artwork and the launcher displays it', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.join(__dirname, '..');
  for (const app of catalog) {
    const artwork = path.join(root, 'src', 'assets', 'apps', `${app.id}.svg`);
    assert.ok(fs.existsSync(artwork), `missing artwork for ${app.name}`);
    assert.ok(fs.readFileSync(artwork, 'utf8').trimStart().startsWith('<svg'), `invalid SVG artwork for ${app.name}`);
  }
  const renderer = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
  assert.ok(renderer.includes('assets/apps/${item.id}.svg'));
  assert.ok(renderer.includes('`${item.name} example screen`'));
});

test('README presents all ten apps as the integrated first-release lineup', () => {
  const fs = require('node:fs');
  const readme = fs.readFileSync(require('node:path').join(__dirname, '..', 'README.md'), 'utf8');
  for (const app of catalog) assert.ok(readme.includes(app.name), `README missing ${app.name}`);
  assert.match(readme, /ten-app desktop suite/i);
  assert.match(readme, /all ten.*implemented/i);
  assert.doesNotMatch(readme, /other six.*not yet working apps/i);
});
