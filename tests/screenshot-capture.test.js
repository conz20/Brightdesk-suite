'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');
const todo = require('../src/todo-service');
const lists = require('../src/lists-service');
const forms = require('../src/forms-service');
const planner = require('../src/planner-service');
const database = require('../src/database-service');
const workspace = require('../src/workspace-service');
const { seedRendererStorage, switchToProduct, waitForSuiteHome } = require('../src/screenshot-capture');
const { SCREENSHOT_TARGETS } = require('../src/screenshot-evidence');

test('renderer seed creates fictional local records for all ten approved products', () => {
  const dom = new JSDOM('<main id="app-manager" hidden><div id="app-manager-grid"></div></main><button id="home-nav"></button>', { url: 'https://brightdesk.local' });
  try {
    Object.assign(dom.window, {
      BrightdeskTodoService: todo,
      BrightdeskListsService: lists,
      BrightdeskFormsService: forms,
      BrightdeskPlannerService: planner,
      BrightdeskDatabaseService: database,
      BrightdeskWorkspaceService: workspace
    });
    const result = dom.window.eval('(' + seedRendererStorage.toString() + ')()');
    const setup = JSON.parse(dom.window.localStorage.getItem('brightdesk-app-setup-v1'));
    const docs = JSON.parse(dom.window.localStorage.getItem('brightdesk-docs-v3'));
    assert.equal(result.installedApps, 10);
    assert.deepEqual(setup.installedApps, ['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop']);
    assert.equal(docs.pages.title, 'Project brief');
    assert.equal(docs.todo.tasks.length, 3);
    assert.equal(docs.todo.tasks.filter(item => item.myDay).length, 2);
    assert.equal(docs.lists.lists[0].items.length, 2);
    assert.equal(JSON.parse(dom.window.localStorage.getItem('brightdesk-forms-v1'))[0].responses.length, 1);
    assert.equal(JSON.parse(dom.window.localStorage.getItem('brightdesk-planner-v1'))[0].tasks.length, 2);
    assert.equal(JSON.parse(dom.window.localStorage.getItem('brightdesk-database-v1')).tables[0].rows.length, 2);
    assert.equal(JSON.parse(dom.window.localStorage.getItem('brightdesk-workspaces-v1'))[0].pages[0].blocks.length, 5);
  } finally {
    dom.window.close();
  }
});

test('product navigation resolves only when the requested real workspace is active', async () => {
  const dom = new JSDOM('<nav><button class="nav" data-app="pages"></button></nav><main id="workspace"><section id="editor"></section></main>', { url: 'https://brightdesk.local' });
  dom.window.requestAnimationFrame = callback => dom.window.setTimeout(callback, 0);
  dom.window.document.querySelector('[data-app="pages"]').addEventListener('click', () => {
    dom.window.document.querySelector('[data-app="pages"]').classList.add('active');
  });
  try {
    const state = await dom.window.eval('(' + switchToProduct.toString() + ')("pages","#editor")');
    assert.deepEqual({ active:state.active,workspaceVisible:state.workspaceVisible,productViewVisible:state.productViewVisible }, { active:true,workspaceVisible:true,productViewVisible:true });
    const homeDom = new JSDOM('<main id="app-manager"><div id="app-manager-grid">' + '<div></div>'.repeat(10) + '</div></main><button id="home-nav" class="active"></button>', { url: 'https://brightdesk.local' });
    const home = await homeDom.window.eval('(' + waitForSuiteHome.toString() + ')()');
    assert.equal(home.productCards, 10);
    homeDom.window.close();
  } finally {
    dom.window.close();
  }
});

test('screenshot targets match the Suite and exactly ten approved products', () => {
  assert.equal(SCREENSHOT_TARGETS.length, 11);
  assert.deepEqual(SCREENSHOT_TARGETS.map(item => item.id), ['suite','pages','sheets','decks','notes','database','forms','lists','planner','todo','workspace']);
  assert.equal(SCREENSHOT_TARGETS.find(item => item.id === 'decks').appId, 'slides');
  assert.equal(SCREENSHOT_TARGETS.find(item => item.id === 'workspace').appId, 'loop');
});
