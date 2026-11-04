const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { inspect, sha256, markdown } = require('../scripts/brightdesk-rea');

const root = path.join(__dirname, '..');

test('Brightdesk REA Bench inventories project files with stable SHA-256 evidence', () => {
  const report = inspect(root);
  assert.equal(report.tool, 'Brightdesk REA Bench');
  assert.ok(report.inventory.fileCount > 10);
  assert.ok(report.inventory.files.some(f => f.path === 'src/app-catalog.js'));
  assert.match(sha256(Buffer.from('abc')), /^[a-f0-9]{64}$/);
});

test('Brightdesk REA Bench verifies the fixed ten-app scope', () => {
  const report = inspect(root);
  assert.deepEqual(report.catalogue.apps.map(a => a.id), ['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop']);
  assert.equal(report.findings.some(f => f.id === 'catalog-scope-drift'), false);
});

test('REA report clearly states static-only evidence boundaries', () => {
  const report = inspect(root);
  const md = markdown(report);
  assert.match(md, /Static source inspection only/);
  assert.match(md, /No target execution/);
});
