'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');
const { seedRendererStorage } = require('../src/screenshot-capture');

const root = path.resolve(__dirname, '..');
const serviceScripts = new Set([
  'formula.js',
  'page-layout.js',
  'app-catalog.js',
  'todo-service.js',
  'lists-service.js',
  'forms-service.js',
  'planner-service.js',
  'database-service.js',
  'workspace-service.js'
]);

const expectedServices = [
  'BrightdeskTodoService',
  'BrightdeskListsService',
  'BrightdeskFormsService',
  'BrightdeskPlannerService',
  'BrightdeskDatabaseService',
  'BrightdeskWorkspaceService'
];

test('classic renderer service scripts load together and seed fictional screenshot data', () => {
  const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
  const scriptPaths = [...html.matchAll(/<script\\s+src=["']([^"']+)["']/g)]
    .map(match => match[1])
    .filter(scriptPath => serviceScripts.has(path.basename(scriptPath)));

  assert.deepEqual(
    scriptPaths,
    [
      'formula.js',
      'page-layout.js',
      'app-catalog.js',
      'todo-service.js',
      'lists-service.js',
      'forms-service.js',
      'planner-service.js',
      'database-service.js',
      'workspace-service.js'
    ],
    'the integration test must follow the real index.html script order'
  );

  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://brightdesk.local',
    runScripts: 'outside-only'
  });

  try {
    dom.window.brightdesk = { version: '0.1.0' };

    for (const scriptPath of scriptPaths) {
      const absolutePath = path.join(root, 'src', scriptPath);
      const source = fs.readFileSync(absolutePath, 'utf8');
      assert.doesNotThrow(
        () => dom.window.eval(source),
        scriptPath + ' must execute without a global lexical declaration collision'
      );
    }

    for (const name of expectedServices) {
      assert.equal(typeof dom.window[name], 'object', name + ' must be attached to the renderer window');
    }

    const seeded = dom.window.eval('(' + seedRendererStorage.toString() + ')()');
    assert.equal(seeded.installedApps, 10);
    assert.equal(seeded.taskCount, 3);
    assert.equal(seeded.listCount, 1);
    assert.equal(JSON.parse(dom.window.localStorage.getItem('brightdesk-forms-v1'))[0].responses.length, 1);
    assert.equal(JSON.parse(dom.window.localStorage.getItem('brightdesk-planner-v1'))[0].tasks.length, 2);
    assert.equal(JSON.parse(dom.window.localStorage.getItem('brightdesk-database-v1')).tables[0].rows.length, 2);
    assert.equal(JSON.parse(dom.window.localStorage.getItem('brightdesk-workspaces-v1'))[0].pages[0].blocks.length, 5);
  } finally {
    dom.window.close();
  }
});
