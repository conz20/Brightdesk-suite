'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const workspaceModules = [
  'database-workspace.js',
  'forms-workspace.js',
  'planner-workspace.js',
  'workspace-editor.js'
];

test('every statically referenced workspace DOM element exists in the integrated HTML shell', () => {
  const missing = [];

  const listsStart = app.indexOf('function renderListsWorkspace()');
  const listsEnd = app.indexOf('function renderGenericWorkspace()', listsStart);
  assert.ok(listsStart >= 0 && listsEnd > listsStart, 'Lists renderer must remain identifiable');
  const sources = workspaceModules.map(file => ({ file, source: fs.readFileSync(path.join(root, 'src', file), 'utf8') }));
  sources.push({ file: 'Lists app renderer', source: app.slice(listsStart, listsEnd) });

  for (const { file, source } of sources) {
    const ids = [...source.matchAll(/\$\(['"]([^'"]+)['"]\)/g)].map(match => match[1]);

    for (const id of new Set(ids)) {
      if (!html.includes(`id="${id}"`)) missing.push(`${file}: #${id}`);
    }
  }

  assert.deepEqual(missing, [], 'Workspace modules must not reference missing static DOM elements');
});

test('integrated HTML contains no duplicate element IDs', () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))];

  assert.deepEqual(duplicates, [], 'HTML element IDs must be unique');
});
