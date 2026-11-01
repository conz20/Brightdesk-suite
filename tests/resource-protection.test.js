const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('renderer exposes language selection and catalogue installation only', () => {
  const html = read('src/index.html');
  const app = read('src/app.js');
  const preload = read('src/preload.js');
  const main = read('src/main.js');
  assert.match(html, /id="display-language"/);
  assert.match(html, /id="proofing-language"/);
  assert.match(html, /id="proofing-dictionary"/);
  assert.match(app, /installCatalogueDictionary\(item\.id\)/);
  for (const forbidden of ['import-language-pack', 'import-spelling-dictionary']) assert.doesNotMatch(html, new RegExp(forbidden));
  for (const forbidden of ['importLanguagePack', 'removeLanguagePack', 'importDictionary', 'removeDictionary']) assert.doesNotMatch(preload, new RegExp(forbidden));
  for (const forbidden of ["ipcMain.handle('languages:import'", "ipcMain.handle('languages:remove'", "ipcMain.handle('dictionaries:import'", "ipcMain.handle('dictionaries:remove'"]) assert.doesNotMatch(main, new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});

test('dictionary centre clearly describes immutable dictionary and licence records', () => {
  const html = read('src/index.html');
  assert.match(html, /licences, source details and author credits cannot be edited, replaced or removed/);
});


test('fresh suite installs activate only implemented apps; standalone installs lock to one app', () => {
  const app = read('src/app.js');
  assert.match(app, /installableCatalog\.map\(item => item\.id\)/);
  assert.match(app, /state\.setupComplete = state\.installedApps\.length > 0/);
  assert.match(app, /if \(launchAppId\) \{ state\.app = launchAppId; state\.view = 'workspace'; \}/);
  assert.match(app, /launchAppId && app !== launchAppId/);
});

test('Windows installer displays the Brightdesk licence and offers a normal setup flow', () => {
  const pkg = JSON.parse(read('package.json'));
  assert.equal(pkg.build.nsis.oneClick, false);
  assert.equal(pkg.build.nsis.license, 'TERMS_AND_CONDITIONS.txt');
  assert.equal(pkg.build.pkg.license, 'TERMS_AND_CONDITIONS.txt');
  assert.ok(pkg.build.mac.target.includes('pkg'));
  assert.equal(pkg.build.nsis.createDesktopShortcut, true);
  assert.equal(pkg.build.nsis.createStartMenuShortcut, true);
});

test('release workflow has working install and release permissions', () => {
  const workflow = read('.github/workflows/build-release.yml');
  assert.match(workflow, /node-version: 24\.22\.2/);
  assert.match(workflow, /run: npm ci/);
  assert.match(workflow, /npm run verify:licenses/);
  assert.match(workflow, /npm run release:preflight/);
  assert.match(workflow, /npm run release:verify:win/);
  assert.match(workflow, /npm run release:verify:mac/);
  assert.match(workflow, /WIN_CSC_LINK/);
  assert.match(workflow, /MAC_INSTALLER_CSC_LINK/);
  assert.match(workflow, /APPLE_APP_SPECIFIC_PASSWORD/);
  assert.match(workflow, /npm run release:verify:linux/);
  assert.match(workflow, /npm run dist:apps:\$\{\{ matrix\.script \}\}/);
  assert.match(workflow, /npm run release:verify:apps:\$\{\{ matrix\.script \}\}/);
  assert.match(workflow, /publish-release:[\s\S]*?permissions:\s*contents: write/);
});
