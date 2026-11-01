'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { APP_REPOSITORIES, createAppRepositorySeeds } = require('../scripts/create-app-repository-seeds');

test('repository seed catalogue contains exactly the ten approved apps', () => {
  assert.equal(APP_REPOSITORIES.length, 10);
  assert.deepEqual(APP_REPOSITORIES.map(item => item.appId), ['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop']);
  assert.deepEqual(APP_REPOSITORIES.map(item => item.repository), [
    'Brightdesk-Pages','Brightdesk-Sheets','Brightdesk-Decks','Brightdesk-Notes',
    'Brightdesk-Database','Brightdesk-Forms','Brightdesk-Lists','Brightdesk-Planner',
    'Brightdesk-To-Do','Brightdesk-Workspace'
  ]);
});

test('app repository seed exports a locked single-app package with suite source and original artwork', () => {
  const root = path.resolve(__dirname, '..');
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-app-repos-'));
  try {
    const result = createAppRepositorySeeds({ rootDir: root, outputDir: output });
    assert.equal(result.repositories.length, 10);
    const bundleReadme = fs.readFileSync(path.join(output, 'README-START-HERE.md'), 'utf8');
    for (const item of APP_REPOSITORIES) assert.ok(bundleReadme.includes(item.repository), `bundle guide missing ${item.repository}`);
    assert.match(bundleReadme, /Brightdesk-suite remains the complete ten-app desktop suite/);
    for (const item of APP_REPOSITORIES) {
      const destination = path.join(output, item.repository);
      const pkg = JSON.parse(fs.readFileSync(path.join(destination, 'package.json'), 'utf8'));
      const lock = JSON.parse(fs.readFileSync(path.join(destination, 'package-lock.json'), 'utf8'));
      const readme = fs.readFileSync(path.join(destination, 'README.md'), 'utf8');
      const workflow = fs.readFileSync(path.join(destination, '.github', 'workflows', 'standalone-app.yml'), 'utf8');
      assert.equal(pkg.name, item.packageName);
      assert.equal(pkg.brightdeskAppId, item.appId);
      assert.equal(pkg.build.appId, `org.brightdesk.${item.appId}`);
      assert.equal(pkg.build.productName, item.name);
      assert.equal(lock.name, item.packageName);
      assert.equal(lock.packages[''].name, item.packageName);
      assert.ok(pkg.scripts['dist:app:win']);
      assert.ok(pkg.scripts['dist:app:mac']);
      assert.ok(pkg.scripts['dist:app:linux']);
      assert.ok(pkg.scripts['verify:app:win']);
      assert.ok(pkg.scripts['verify:app:mac']);
      assert.ok(pkg.scripts['verify:app:linux']);
      assert.ok(readme.includes(item.name));
      assert.ok(readme.includes('assets/brightdesk-app.svg'));
      assert.ok(fs.statSync(path.join(destination, 'assets', 'brightdesk-app.svg')).size > 0);
      assert.ok(fs.statSync(path.join(destination, 'assets', 'social-preview.svg')).size > 0);
      assert.ok(readme.includes('assets/social-preview.svg'));
      assert.match(workflow, /node-version: 24\.22\.2/);
      assert.match(workflow, /npm run dist:app:\$\{\{ matrix\.platform \}\}/);
      assert.match(workflow, /npm run verify:app:\$\{\{ matrix\.platform \}\}/);
      assert.ok(fs.existsSync(path.join(destination, 'src', 'app.js')));
      assert.ok(fs.existsSync(path.join(destination, 'src', 'main.js')));
    }
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
