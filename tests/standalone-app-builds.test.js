'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const APPROVED_APPS = [
  { id: 'pages', name: 'Pages', command: 'pages' },
  { id: 'sheets', name: 'Sheets', command: 'sheets' },
  { id: 'slides', name: 'Decks', command: 'decks' },
  { id: 'notes', name: 'Notes', command: 'notes' },
  { id: 'database', name: 'Database', command: 'database' },
  { id: 'forms', name: 'Forms', command: 'forms' },
  { id: 'lists', name: 'Lists', command: 'lists' },
  { id: 'planner', name: 'Planner', command: 'planner' },
  { id: 'todo', name: 'To Do', command: 'todo' },
  { id: 'loop', name: 'Workspace', command: 'workspace' }
];
const root = path.resolve(__dirname, '..');

test('standalone build commands cover exactly the ten approved app IDs', () => {
  const buildApp = fs.readFileSync(path.join(root, 'scripts', 'build-app.js'), 'utf8');
  const buildApps = fs.readFileSync(path.join(root, 'scripts', 'build-apps.js'), 'utf8');
  const packageJson = require('../package.json');
  const guard = buildApp.match(/const apps = new Set\((\[[\s\S]*?\])\);/);
  const matrix = buildApps.match(/const apps = (\[[\s\S]*?\]);/);
  assert.ok(guard, 'single-app builder must declare its supported app IDs');
  assert.ok(matrix, 'multi-app builder must declare its supported app IDs');
  assert.deepEqual(JSON.parse(guard[1].replace(/'/g, '"')), APPROVED_APPS.map(app => app.id));
  assert.deepEqual(JSON.parse(matrix[1].replace(/'/g, '"')), APPROVED_APPS.map(app => app.id));

  for (const app of APPROVED_APPS) {
    for (const platform of ['win', 'mac', 'linux']) {
      assert.equal(
        packageJson.scripts[`dist:${app.command}:${platform}`],
        `node scripts/build-app.js ${app.id} ${platform}`,
        `${app.name} must have a ${platform} standalone build command`
      );
    }
  }
});

test('electron-builder standalone configuration maps every approved app to its own identity', () => {
  const configPath = require.resolve('../electron-builder.app.config');
  const original = process.env.BRIGHTDESK_APP_ID;
  const versionPlaceholder = '$' + '{version}';
  const archPlaceholder = '$' + '{arch}';
  const extPlaceholder = '$' + '{ext}';
  try {
    for (const app of APPROVED_APPS) {
      process.env.BRIGHTDESK_APP_ID = app.id;
      delete require.cache[configPath];
      const config = require(configPath);
      assert.equal(config.appId, `org.brightdesk.${app.id}`);
      assert.equal(config.productName, `Brightdesk ${app.name}`);
      assert.equal(config.directories.output, path.join('release', 'apps', app.id));
      assert.equal(config.extraMetadata.desktopName, `org.brightdesk.${app.id}.desktop`);
      assert.equal(config.publish.length, 0, 'standalone builds must not publish automatically');
      assert.equal(config.linux.syncDesktopName, true);
      assert.ok(config.mac.target.includes('dmg'));
      assert.ok(config.mac.target.includes('pkg'));
      assert.ok(config.mac.target.includes('zip'));
      assert.ok(config.linux.target.includes('AppImage'));
      assert.ok(config.linux.target.includes('deb'));
      const slug = app.id === 'todo' ? 'To-Do' : app.name;
      const artifactName = `Brightdesk-${slug}-${versionPlaceholder}-${archPlaceholder}.${extPlaceholder}`;
      assert.equal(config.win.artifactName, artifactName);
      assert.equal(config.mac.artifactName, artifactName);
      assert.equal(config.linux.artifactName, `brightdesk-${slug.toLowerCase()}-${versionPlaceholder}-${archPlaceholder}.${extPlaceholder}`);
    }
    process.env.BRIGHTDESK_APP_ID = 'outlook';
    delete require.cache[configPath];
    assert.throws(() => require(configPath), /Set BRIGHTDESK_APP_ID/);
  } finally {
    if (original === undefined) delete process.env.BRIGHTDESK_APP_ID;
    else process.env.BRIGHTDESK_APP_ID = original;
    delete require.cache[configPath];
  }
});
