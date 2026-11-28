'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('all product data services load together in the real renderer script order', () => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://brightdesk.test/',
    runScripts: 'outside-only'
  });

  try {
    const html = read('src/index.html');
    const scriptPaths = [...html.matchAll(/<script src="([^"]+)"/g)].map(match => match[1]);
    const serviceFiles = new Set([
      'page-layout.js',
      'todo-service.js',
      'lists-service.js',
      'forms-service.js',
      'planner-service.js',
      'database-service.js',
      'workspace-service.js'
    ]);
    const orderedFiles = scriptPaths.filter(file => serviceFiles.has(path.basename(file)));
    assert.equal(orderedFiles.length, serviceFiles.size, 'the integrated HTML must load every required renderer service');

    for (const file of orderedFiles) {
      assert.doesNotThrow(() => dom.window.eval(read(path.join('src', file))), file + ' must load without a global declaration collision');
    }

    for (const serviceName of [
      'BrightdeskTodoService',
      'BrightdeskListsService',
      'BrightdeskFormsService',
      'BrightdeskPlannerService',
      'BrightdeskDatabaseService',
      'BrightdeskWorkspaceService'
    ]) {
      assert.ok(dom.window[serviceName], serviceName + ' must be exposed to the integrated renderer');
    }
  } finally {
    dom.window.close();
  }
});
