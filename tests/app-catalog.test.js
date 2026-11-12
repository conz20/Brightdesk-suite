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
    assert.ok(app.name && app.subtitle && app.description && app.iconAsset);
    assert.equal(Object.hasOwn(app, 'icon'), false, 'Text glyph icon placeholders are not permitted');
  }
});


test('Electron package entry points to the real integrated main process', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.join(__dirname, '..');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  assert.equal(pkg.main, 'src/main.js');
  assert.ok(fs.existsSync(path.join(root, pkg.main)), 'Electron main entry must exist inside the packaged source tree');
});

test('first release version is consistently 0.1.0 across package, available apps and shell', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.join(__dirname, '..');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
  assert.equal(pkg.version, '0.1.0');
  for (const app of catalog.filter(item => item.availability === 'available')) assert.equal(app.moduleVersion, pkg.version);
  assert.ok(html.includes('id="version-label">Local-first · Your files stay here</small>'));
  assert.ok(html.includes('id="footer-version">Brightdesk</span>'));
  assert.doesNotMatch(html, /\d+\.\d+\.\d+/);
});

test('the customer-facing release version has one authoritative source across the suite', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.join(__dirname, '..');
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
  const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
  const catalogSource = fs.readFileSync(path.join(root, 'src', 'app-catalog.js'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
  const preload = fs.readFileSync(path.join(root, 'src', 'preload.js'), 'utf8');
  const main = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf8');
  const versioning = fs.readFileSync(path.join(root, 'docs', 'VERSIONING.md'), 'utf8');
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'build-release.yml'), 'utf8');

  assert.equal(pkg.version, '0.1.0');
  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages[''].version, pkg.version);
  assert.ok(catalog.every(item => item.moduleVersion === pkg.version));
  assert.match(catalogSource, /window\.brightdesk\?\.version/);
  assert.match(preload, /ipcRenderer\.sendSync\('app:version-sync'\)/);
  assert.match(main, /ipcMain\.on\('app:version-sync'.*app\.getVersion\(\)/);
  assert.ok(html.includes('id="version-label">Local-first · Your files stay here</small>'));
  assert.ok(html.includes('id="footer-version">Brightdesk</span>'));
  assert.doesNotMatch(html, /\d+\.\d+\.\d+/);
  assert.doesNotMatch(app, /version-label/);
  assert.match(app, /if \(version\) \{ \$\('footer-version'\)\.textContent = `Brightdesk \$\{version\}`; \}/);
  assert.match(versioning, /package\.json.*single source of truth/i);
  assert.match(versioning, /Brightdesk-AI.*no Brightdesk customer release number/i);
  assert.doesNotMatch(workflow, /Brightdesk-0\.1\.0-Installers|default: 'v0\.1\.0'/);
  assert.match(workflow, /Brightdesk-\$\{\{ steps\.release-version\.outputs\.version \}\}-Installers/);
  assert.match(workflow, /tag_name: v\$\{\{ needs\.collect\.outputs\.version \}\}/);
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

test('workspace navigation is generated from the installed catalogue and respects product visibility settings',()=>{const fs=require('node:fs');const path=require('node:path');const root=path.join(__dirname,'..');const html=fs.readFileSync(path.join(root,'src','index.html'),'utf8');const app=fs.readFileSync(path.join(root,'src','app.js'),'utf8');assert.match(html,/id="dynamic-app-nav"/);assert.match(html,/id="app-centre-nav"/);assert.match(html,/id="home-nav"/);assert.match(html,/id="files-nav"/);assert.doesNotMatch(html,/data-app="(?:pages|sheets|slides|notes)"/);assert.match(app,/catalog\.filter\(item => installedApp\(item\.id\) && !state\.hiddenProducts\.includes\(item\.id\)\)/);assert.match(app,/\$\('dynamic-app-nav'\)\.hidden = suitePage \|\| languages/);assert.match(app,/\$\('app-centre-nav'\)\.hidden = !suitePage \|\| Boolean\(launchAppId\)/);});

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

test('each catalogue app references its own original SVG icon artwork', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.join(__dirname, '..');
  const expectedIcons = {
    pages: 'pages.svg', sheets: 'sheets.svg', slides: 'decks.svg', notes: 'notes.svg',
    database: 'database.svg', forms: 'forms.svg', lists: 'lists.svg', planner: 'planner.svg',
    todo: 'to-do.svg', loop: 'workspace.svg'
  };
  for (const app of catalog) {
    assert.equal(app.iconAsset, expectedIcons[app.id], `Unexpected icon asset for ${app.id}`);
    assert.ok(fs.existsSync(path.join(root, 'src', 'assets', 'icons', app.iconAsset)));
  }
  const source = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
  assert.ok(source.includes('return `assets/icons/${item.iconAsset}`'));
});

test('all catalogue modules have independent Brightdesk metadata', () => {
  for (const item of catalog) {
    assert.ok(item.id && item.name && item.description && item.moduleVersion);
    assert.equal(typeof item.microsoftReference, 'string');
  }
});

test('Electron main process accepts every approved standalone app', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const main = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.js'), 'utf8');
  const declaration = main.split('\n').find(line => line.startsWith('const supportedApplications = new Set('));
  assert.ok(declaration, 'main process must declare its supported applications');
  const list = declaration.slice(declaration.indexOf('[') + 1, declaration.lastIndexOf(']'));
  const ids = [...list.matchAll(/'([^']+)'/g)].map(([, id]) => id);
  assert.deepEqual(ids, catalog.map(item => item.id));
  for (const [id, name] of [
    ['pages', 'Pages'], ['sheets', 'Sheets'], ['slides', 'Decks'],
    ['notes', 'Notes'], ['database', 'Database'], ['forms', 'Forms'],
    ['lists', 'Lists'], ['planner', 'Planner'], ['todo', 'To Do'],
    ['loop', 'Workspace']
  ]) {
    assert.ok(main.includes(`${id}: '${name}'`), `missing app title for ${id}`);
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
  for (const app of ['pages', 'sheets', 'decks', 'notes']) {
    for (const platform of ['win', 'mac', 'linux']) assert.ok(pkg.scripts[`dist:${app}:${platform}`]);
  }
  const builder = fs.readFileSync(path.join(root, 'electron-builder.app.config.js'), 'utf8');
  assert.match(builder, /org\.brightdesk\.\$\{appId\}/);
  assert.match(builder, /brightdeskAppId: appId/);
  assert.match(builder, /extraMetadata: \{ brightdeskAppId: appId, productName:/);
  const configPath = path.join(root, 'electron-builder.app.config.js');
  const previousAppId = process.env.BRIGHTDESK_APP_ID;
  const products = [];
  try {
    for (const [id, name] of [['pages','Pages'],['sheets','Sheets'],['slides','Decks'],['notes','Notes']]) {
      process.env.BRIGHTDESK_APP_ID = id;
      delete require.cache[require.resolve(configPath)];
      const config = require(configPath);
      assert.equal(config.appId, `org.brightdesk.${id}`);
      assert.equal(config.extraMetadata.brightdeskAppId, id);
      assert.equal(config.extraMetadata.productName, `Brightdesk ${name}`);
      assert.ok(config.win.artifactName.includes(name));
      assert.equal(config.directories.output, path.join('release', 'apps', id));
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
  assert.equal(new Set(products).size, 4);
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
});


test('all first-release product cards use the original icons without concept preview images', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.join(__dirname, '..');
  for (const app of catalog) {
    const artwork = path.join(root, 'src', 'assets', 'icons', app.iconAsset);
    assert.ok(fs.existsSync(artwork), `missing icon for ${app.name}`);
    assert.ok(/^<\?xml[\s\S]*?\?>\s*<svg\b/.test(fs.readFileSync(artwork, 'utf8').trimStart()), `invalid SVG icon for ${app.name}`);
  }
  const renderer = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
  assert.ok(renderer.includes('return `assets/icons/${item.iconAsset}`'));
  assert.ok(!renderer.includes('assets/apps/${item.id}.svg'));
  assert.ok(!renderer.includes('app-preview'));
});
test('README presents all ten apps as the integrated first-release lineup', () => {
  const fs = require('node:fs');
  const readme = fs.readFileSync(require('node:path').join(__dirname, '..', 'README.md'), 'utf8');
  for (const app of catalog) assert.ok(readme.includes(app.name), `README missing ${app.name}`);
  assert.match(readme, /ten focused desktop products/i);
  assert.match(readme, /These are the only products in the approved suite/i);
  assert.doesNotMatch(readme, /other six.*not yet working apps/i);
});

test('Suite Open actions launch dedicated product windows instead of changing the Suite workspace', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.join(__dirname, '..');
  const main = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf8');
  const preload = fs.readFileSync(path.join(root, 'src', 'preload.js'), 'utf8');
  const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
  assert.ok(main.includes('function openProductWindow(applicationId)'));
  assert.ok(main.includes('const productWindows = new Map()'));
  assert.ok(main.includes("ipcMain.handle('apps:open'"));
  assert.ok(main.includes('--brightdesk-app=${applicationId}'));
  assert.ok(main.includes('existing.show();'));
  assert.ok(main.includes('existing.focus();'));
  assert.ok(preload.includes("ipcRenderer.invoke('apps:open', applicationId)"));
  assert.ok(app.includes('window.brightdesk.openApplication(item.id)'));
  assert.equal(app.includes('setApp(item.id)'), false);
  assert.ok(main.includes("'Brightdesk Office Suite'"));
});

test('each product window saves its own document without overwriting other open products', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
  assert.ok(app.includes('brightdesk-doc-${launchAppId}-v1'));
  assert.ok(app.includes('brightdesk-doc-${id}-v1'));
  assert.ok(app.includes("else localStorage.setItem('brightdesk-docs-v3'"));
});

test('the Suite Home artwork and README no longer repeat Suite logo or wordmark branding', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const root = path.join(__dirname, '..');
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const artwork = fs.readFileSync(path.join(root, 'assets', 'product-experience', 'brightdesk-home.svg'), 'utf8');
  assert.equal(readme.includes('assets/brand/brightdesk-logo.svg'), false);
  assert.equal(artwork.includes('Brightdesk Office Suite'), false);
  assert.equal(artwork.includes('brightdesk</text>'), false);
  assert.equal(artwork.includes('BRIGHTDESK OFFICE SUITE'), false);
  assert.ok(artwork.includes('Ten original desktop products'));
  const main = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf8');
  assert.ok(main.includes("'Brightdesk Office Suite'"));
});

test('the shared visual standard requires Microsoft completeness checks and independent app windows', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const standard = fs.readFileSync(path.join(__dirname, '..', 'docs', 'BRIGHTDESK_VISUAL_STANDARD.md'), 'utf8');
  assert.match(standard, /Microsoft.*completeness and usability benchmark/i);
  assert.match(standard, /own top-level application window/i);
  assert.match(standard, /must never silently replace the Suite renderer/i);
});
