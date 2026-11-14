'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = require('../package.json');

const products = [
  'pages', 'sheets', 'slides', 'notes', 'database',
  'forms', 'lists', 'planner', 'todo', 'loop'
];

function loadProductConfig(productId) {
  const source = [
    `process.env.BRIGHTDESK_APP_ID = ${JSON.stringify(productId)};`,
    "process.stdout.write(JSON.stringify(require('./electron-builder.app.config.js')));"
  ].join('\n');
  const output = execFileSync(process.execPath, ['-e', source], {
    cwd: root,
    encoding: 'utf8'
  });
  return JSON.parse(output);
}

test('Suite Windows uninstaller is interactive and retains per-user app data', () => {
  const nsis = manifest.build?.nsis;
  assert.ok(nsis, 'Suite NSIS settings are present');
  assert.equal(nsis.oneClick, false, 'the installer must show its installation steps');
  assert.equal(nsis.deleteAppDataOnUninstall, false, 'normal uninstall must retain per-user data');
  assert.equal(nsis.license, 'TERMS_AND_CONDITIONS.txt');
});

test('all ten individual Windows installers retain their own per-user data', () => {
  const appIds = new Set();
  for (const productId of products) {
    const config = loadProductConfig(productId);
    assert.equal(config.extraMetadata.brightdeskAppId, productId);
    assert.equal(config.nsis.oneClick, false, `${productId} uses the assisted installer`);
    assert.equal(config.nsis.deleteAppDataOnUninstall, false, `${productId} retains local user data`);
    assert.equal(config.nsis.license, 'TERMS_AND_CONDITIONS.txt');
    assert.deepEqual(config.win.target, ['nsis']);
    assert.ok(config.appId.startsWith('org.brightdesk.'), 'each product has a Brightdesk application ID');
    assert.ok(!appIds.has(config.appId), 'each separately installed product has its own application ID');
    appIds.add(config.appId);
  }
  assert.equal(appIds.size, 10);
});

test('Suite and individual products store settings and local packs outside the install folder', () => {
  const main = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf8');
  assert.match(main, /app\.setName\(packageConfig\.productName \|\| 'Brightdesk'\)/);
  assert.match(main, /path\.join\(app\.getPath\('userData'\), 'update-settings\.json'\)/);
  assert.match(main, /path\.join\(app\.getPath\('userData'\), 'terms-acceptance\.json'\)/);
  assert.match(main, /new DictionaryService\(app\.getPath\('userData'\)\)/);
  assert.match(main, /path\.join\(app\.getPath\('userData'\), 'language-packs'\)/);
});

test('no custom NSIS uninstaller script overrides the data-retention default', () => {
  const customScript = path.join(root, 'build', 'installer.nsh');
  assert.equal(fs.existsSync(customScript), false,
    'a future custom NSIS script must receive a separate review and regression tests');
  const config = fs.readFileSync(path.join(root, 'electron-builder.app.config.js'), 'utf8');
  assert.doesNotMatch(config, /customUnInstall|customRemoveFiles|deleteAppDataOnUninstall\s*:\s*true/);
});
