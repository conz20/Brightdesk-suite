'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { APPROVED_APP_IDS, auditRepository, renderMarkdown } = require('../scripts/brightdesk-ai/audit');

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-ai-audit-'));
  const catalog = APPROVED_APP_IDS.map(id => ({ id, moduleVersion: '0.1.0' }));
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  fs.mkdirSync(path.join(root, '.github', 'workflows'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'src', 'app-catalog.js'),
    'module.exports = ' + JSON.stringify(catalog) + ';\n'
  );
  fs.writeFileSync(path.join(root, '.github', 'workflows', 'ci.yml'), 'name: test\n');
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
    name: 'brightdesk-suite',
    version: '0.1.0',
    engines: { node: '24.22.2' },
    scripts: {
      test: 'node --test',
      'dist:win': 'electron-builder --win nsis --x64',
      'dist:mac': 'electron-builder --mac dmg pkg zip --universal',
      'dist:linux': 'electron-builder --linux AppImage deb --x64'
    },
    build: {
      win: { target: ['nsis'] },
      nsis: { oneClick: false },
      mac: { target: ['dmg', 'pkg', 'zip'] },
      linux: { target: ['AppImage', 'deb'] }
    }
  }, null, 2));
  fs.writeFileSync(path.join(root, 'package-lock.json'), JSON.stringify({
    name: 'brightdesk-suite',
    version: '0.1.0',
    packages: { '': { name: 'brightdesk-suite', version: '0.1.0' } }
  }, null, 2));
  return root;
}

test('maintenance audit recognises the exact ten-app suite and current installer targets', () => {
  const root = makeFixture();
  try {
    const result = auditRepository({ rootDir: root });
    assert.equal(result.projectType, 'suite');
    assert.deepEqual(result.appIds.sort(), [...APPROVED_APP_IDS].sort());
    assert.equal(result.ready, true);
    assert.equal(result.blockers.length, 0);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('maintenance audit blocks when the dependency lock version does not match', () => {
  const root = makeFixture();
  try {
    const lockPath = path.join(root, 'package-lock.json');
    const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
    lock.packages[''].version = '0.0.9';
    fs.writeFileSync(lockPath, JSON.stringify(lock));
    const result = auditRepository({ rootDir: root });
    assert.equal(result.ready, false);
    assert.ok(result.blockers.some(item => item.name === 'Package and lock versions match'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('maintenance audit report explains the different uninstall methods', () => {
  const report = renderMarkdown({
    projectType: 'suite',
    projectVersion: '0.1.0',
    ready: true,
    blockers: [],
    checks: []
  });
  assert.match(report, /Windows/);
  assert.match(report, /Finder/);
  assert.match(report, /package manager/);
});
