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
const { seedRendererStorage, waitForProductWorkspace, waitForSuiteHome, waitForSuiteScreen, assertScreenshotSize } = require('../src/screenshot-capture');
const { SCREENSHOT_TARGETS } = require('../src/screenshot-evidence');


test('screenshot capture enforces the approved 1600 by 900 reference size', () => {
  assert.deepEqual(assertScreenshotSize({ width: 1600, height: 900 }, 'Suite Home'), { width: 1600, height: 900 });
  assert.throws(() => assertScreenshotSize({ width: 1024, height: 653 }, 'Suite Home'), /1600 × 900/);
  assert.throws(() => assertScreenshotSize({ width: 1599, height: 900 }, 'Suite Home'), /1600 × 900/);
  assert.throws(() => assertScreenshotSize({ width: 1600, height: 899 }, 'Suite Home'), /1600 × 900/);
});


test('Suite Home capture requires ten visible cards in the approved five-column layout', async () => {
  const dom = new JSDOM('<section id="app-manager" class="home-view"><button id="home-nav" class="active"></button><div id="app-manager-grid"></div></section>', {
    url: 'https://brightdesk.local',
    runScripts: 'outside-only'
  });
  try {
    const { window } = dom;
    Object.defineProperty(window, 'innerWidth', { value: 1600 });
    Object.defineProperty(window, 'innerHeight', { value: 900 });
    const grid = window.document.querySelector('#app-manager-grid');
    for (let index = 0; index < 10; index += 1) {
      const card = window.document.createElement('article');
      const column = index % 5;
      const row = Math.floor(index / 5);
      card.getBoundingClientRect = () => ({
        left: 270 + column * 256,
        right: 510 + column * 256,
        top: 292 + row * 258,
        bottom: 532 + row * 258,
        width: 240,
        height: 240
      });
      grid.appendChild(card);
    }
    window.getComputedStyle = () => ({ gridTemplateColumns: '240px 240px 240px 240px 240px' });
    const result = await window.eval('(' + waitForSuiteHome.toString() + ')()');
    assert.equal(result.productCards, 10);
    assert.equal(result.columns, 5);
    assert.equal(result.allCardsVisible, true);
  } finally {
    dom.window.close();
  }
});

test('renderer seed creates fictional local records for all ten approved products', () => {
  const dom = new JSDOM('<main id="app-manager" hidden><div id="app-manager-grid"></div></main><button id="home-nav"></button>', { url: 'https://brightdesk.local', runScripts: 'outside-only' });
  try {
    Object.assign(dom.window, {
      BrightdeskAppCatalog: ['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop'].map(id => ({ id })),
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
    const seededDatabase = JSON.parse(dom.window.localStorage.getItem('brightdesk-database-v1'));
    const projectTable = seededDatabase.tables.find(table => table.id === 'capture-projects');
    assert.equal(projectTable.rows.length, 2);
    assert.deepEqual(projectTable.rows.map(row => row.values['capture-project']), ['Help refresh', 'Release notes']);
    assert.deepEqual(projectTable.rows.map(row => row.values['capture-status']), ['In progress', 'Not started']);
    assert.deepEqual(projectTable.rows.map(row => row.values['capture-owner']), ['Sample owner', 'Sample owner']);
    assert.equal(JSON.parse(dom.window.localStorage.getItem('brightdesk-workspaces-v1'))[0].pages[0].blocks.length, 5);
  } finally {
    dom.window.close();
  }
});

test('product capture waits for its dedicated Suite-launched product window', async () => {
  const dom = new JSDOM('<main id="workspace"><section id="editor"></section></main>', { url: 'https://brightdesk.local', runScripts: 'outside-only' });
  dom.window.document.title = 'Brightdesk Pages';
  dom.window.brightdesk = { launchAppId: 'pages', suiteLaunchedProduct: true };
  try {
    const state = await dom.window.eval('(' + waitForProductWorkspace.toString() + ')("pages","#editor",100)');
    assert.deepEqual(
      { appId:state.appId, active:state.active, workspaceVisible:state.workspaceVisible, productViewVisible:state.productViewVisible },
      { appId:'pages', active:true, workspaceVisible:true, productViewVisible:true }
    );
  } finally {
    dom.window.close();
  }
});

test('product capture rejects a different product window even when its workspace is visible', async () => {
  const dom = new JSDOM('<main id="workspace"><section id="editor"></section></main>', { url: 'https://brightdesk.local', runScripts: 'outside-only' });
  dom.window.brightdesk = { launchAppId: 'sheets', suiteLaunchedProduct: true };
  try {
    await assert.rejects(
      dom.window.eval('(' + waitForProductWorkspace.toString() + ')("pages","#editor",50)'),
      /pages workspace did not load in its own Suite product window/i
    );
  } finally {
    dom.window.close();
  }
});

test('screenshot targets cover seven Suite screens and exactly ten approved products', () => {
  assert.equal(SCREENSHOT_TARGETS.length, 17);
  assert.deepEqual(SCREENSHOT_TARGETS.map(item => item.id), ['suite','suite-apps','suite-files','suite-settings','suite-languages','suite-update-settings','suite-notifications','pages','sheets','decks','notes','database','forms','lists','planner','todo','workspace']);
  assert.equal(SCREENSHOT_TARGETS.find(item => item.id === 'decks').appId, 'slides');
  assert.equal(SCREENSHOT_TARGETS.find(item => item.id === 'workspace').appId, 'loop');
});


test('suite screenshot navigation opens every Suite screen before capture', async () => {
  const dom = new JSDOM([
    '<button id="home-nav"></button>',
    '<button id="app-centre-nav"></button>',
    '<button id="files-nav"></button>',
    '<button id="open-settings"></button>',
    '<button id="open-notifications"></button>',
    '<section id="app-manager" class="home-view"></section>',
    '<section id="files-manager" hidden></section>',
    '<section id="settings-manager" hidden>',
    '  <button id="manage-languages"></button>',
    '  <button id="update-settings-button"></button>',
    '  <section id="update-settings-panel" hidden>',
    '    <button id="close-update-settings"></button>',
    '  </section>',
    '</section>',
    '<section id="language-manager" hidden></section>',
    '<section id="notification-panel" hidden></section>'
  ].join(''), { url: 'https://brightdesk.local', runScripts: 'outside-only' });
  try {
    const doc = dom.window.document;
    const screens = ['#app-manager', '#files-manager', '#settings-manager', '#language-manager', '#notification-panel'];
    const activate = (selector, view) => {
      for (const screen of screens) doc.querySelector(screen).hidden = screen !== selector;
      if (selector === '#app-manager') doc.querySelector('#app-manager').classList.toggle('home-view', view === 'home');
    };
    doc.querySelector('#home-nav').addEventListener('click', () => activate('#app-manager', 'home'));
    doc.querySelector('#app-centre-nav').addEventListener('click', () => activate('#app-manager', 'apps'));
    doc.querySelector('#files-nav').addEventListener('click', () => activate('#files-manager', 'files'));
    doc.querySelector('#open-settings').addEventListener('click', () => activate('#settings-manager', 'settings'));
    doc.querySelector('#manage-languages').addEventListener('click', () => activate('#language-manager', 'languages'));
    doc.querySelector('#update-settings-button').addEventListener('click', () => {
      doc.querySelector('#settings-manager').hidden = false;
      doc.querySelector('#update-settings-panel').hidden = false;
      doc.querySelector('#update-settings-panel').dataset.settingsLoaded = 'true';
    });
    doc.querySelector('#close-update-settings').addEventListener('click', () => { doc.querySelector('#update-settings-panel').hidden = true; });
    doc.querySelector('#open-notifications').addEventListener('click', () => {
      const panel = doc.querySelector('#notification-panel');
      if (panel.hidden) activate('#notification-panel', 'notifications');
      else panel.hidden = true;
    });

    for (const [view, selector] of [
      ['home', '#app-manager'],
      ['apps', '#app-manager'],
      ['files', '#files-manager'],
      ['settings', '#settings-manager'],
      ['languages', '#language-manager'],
      ['update-settings', '#update-settings-panel'],
      ['notifications', '#notification-panel']
    ]) {
      const result = await dom.window.eval('(' + waitForSuiteScreen.toString() + ')(' + JSON.stringify(view) + ',' + JSON.stringify(selector) + ',100)');
      assert.equal(result.active, true, view + ' must be visible before screenshot capture');
      assert.equal(doc.querySelector(selector).hidden, false, view + ' must not remain hidden');
      if (view === 'notifications') {
        const repeated = await dom.window.eval('(' + waitForSuiteScreen.toString() + ')(' + JSON.stringify(view) + ',' + JSON.stringify(selector) + ',100)');
        assert.equal(repeated.active, true, 'Notifications capture navigation must be repeatable');
      }
    }
  } finally {
    dom.window.close();
  }
});
