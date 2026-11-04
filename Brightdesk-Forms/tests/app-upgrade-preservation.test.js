'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const extractFunction = name => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = source.match(new RegExp(`^function ${escaped}\\([^\\n]*\\) \\{[\\s\\S]*?^\\}`, 'm'));
  assert.ok(match, `${name} function exists`);
  return match[0];
};

const functions = [
  extractFunction('loadLocal'),
  extractFunction('saveAppSetup'),
  extractFunction('installedApp'),
  extractFunction('toggleAppInstall')
].join('\n');
const approvedIds = ['pages', 'sheets', 'slides', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'loop'];

function runUpgrade(savedValues) {
  const values = new Map(Object.entries(savedValues));
  const state = {
    docs: {}, installedApps: [], setupComplete: false, app: 'pages', view: 'workspace',
    ribbonTab: 'home', displayLanguage: '', proofingLanguage: ''
  };
  const defaults = Object.fromEntries(approvedIds.map(id => [id, { title: `Untitled ${id}` }]));
  const context = {
    state,
    defaults,
    launchAppId: null,
    installableCatalog: approvedIds.map(id => ({ id })),
    localStorage: {
      getItem: key => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value))
    },
    clone: value => JSON.parse(JSON.stringify(value)),
    render() {},
    console,
    alert() {}
  };
  vm.runInNewContext(`${functions}\nloadLocal();`, context);
  return { context, state, values };
}

test('upgrade retains saved documents and the user’s selected products when removing one product', () => {
  const docs = {
    pages: { title: 'Quarterly plan', html: '<p>Keep this content</p>' },
    todo: { title: 'Personal tasks', tasks: [{ id: 't1', title: 'Keep this task' }] }
  };
  const setup = { installedApps: ['pages', 'todo'], setupComplete: true };
  const { context, state, values } = runUpgrade({
    'brightdesk-docs-v3': JSON.stringify(docs),
    'brightdesk-app-setup-v1': JSON.stringify(setup)
  });

  assert.deepEqual(JSON.parse(JSON.stringify(state.docs.pages)), docs.pages);
  assert.deepEqual(JSON.parse(JSON.stringify(state.docs.todo)), docs.todo);
  assert.deepEqual(Array.from(state.installedApps), setup.installedApps);
  assert.equal(state.setupComplete, true);

  vm.runInNewContext('toggleAppInstall("todo")', context);
  assert.deepEqual(Array.from(state.installedApps), ['pages']);
  assert.deepEqual(JSON.parse(JSON.stringify(state.docs.todo)), docs.todo);
  assert.deepEqual(JSON.parse(values.get('brightdesk-app-setup-v1')).installedApps, ['pages']);
  assert.deepEqual(JSON.parse(values.get('brightdesk-docs-v3')), docs);
});

test('upgrade from the previous document key preserves content and initializes the ten approved products', () => {
  const legacyDocs = { pages: { title: 'Archive', html: '<p>Older saved content</p>' } };
  const { state, values } = runUpgrade({ 'brightdesk-docs-v2': JSON.stringify(legacyDocs) });

  assert.deepEqual(JSON.parse(JSON.stringify(state.docs.pages)), legacyDocs.pages);
  assert.deepEqual(Array.from(state.installedApps), approvedIds);
  assert.equal(state.setupComplete, true);
  assert.deepEqual(JSON.parse(values.get('brightdesk-app-setup-v1')).installedApps, approvedIds);
});
