'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const root = path.join(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const productIds = ['pages', 'sheets', 'slides', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'loop'];

async function bootSuite(t) {
  const dom = new JSDOM(read('src/index.html'), {
    url: 'http://brightdesk.test/',
    runScripts: 'outside-only',
    pretendToBeVisual: true
  });
  t.after(() => dom.window.close());

  const { window } = dom;
  if (typeof window.structuredClone !== 'function') window.structuredClone = global.structuredClone;
  window.confirm = () => true;
  window.alert = () => {};

  const calls = {
    openedProducts: [],
    openedFiles: 0,
    nextOpenFile: null,
    savedProjects: [],
    updateChecks: 0,
    downloadRequests: 0,
    installRequests: 0,
    updateListeners: [],
    savedUpdateSettings: []
  };
  window.brightdesk = {
    launchAppId: null,
    suiteLaunchedProduct: false,
    platform: 'darwin',
    getVersion: async () => '0.1.0',
    openApplication: async id => { calls.openedProducts.push(id); return { ok: true }; },
    openFile: async () => { calls.openedFiles += 1; return calls.nextOpenFile; },
    saveProject: async project => { calls.savedProjects.push(project); return { canceled: false }; },
    listLanguagePacks: async () => ({ available: [], installed: [JSON.parse(read('src/languages/en-AU.json'))], spellCheckerLanguages: ['en-AU'] }),
    setProofingLanguage: async () => ({ supported: true }),
    listDictionaries: async () => [],
    onUpdateState: listener => { calls.updateListeners.push(listener); },
    checkForUpdates: async () => { calls.updateChecks += 1; return { ok: true, message: 'No update is currently available.' }; },
    getUpdateSettings: async () => ({ autoCheck: true }),
    setUpdateSettings: async settings => { calls.savedUpdateSettings.push(settings); return settings; },
    downloadUpdate: async () => { calls.downloadRequests += 1; return { ok: true }; },
    installUpdate: async () => { calls.installRequests += 1; return { ok: true }; }
  };

  window.localStorage.setItem('brightdesk-app-setup-v1', JSON.stringify({
    schemaVersion: 2,
    installedApps: productIds,
    hiddenProducts: [],
    setupComplete: true
  }));
  window.localStorage.setItem('brightdesk-docs-v3', JSON.stringify({
    pages: { title: 'Protected project', html: '<p>Keep this document.</p>' }
  }));

  for (const file of [
    'src/formula.js',
    'src/app-catalog.js',
    'src/page-layout.js',
    'src/i18n.js',
    'src/app-setup-policy.js',
    'src/update-settings.js',
    'src/app.js'
  ]) window.eval(read(file));

  await new Promise(resolve => setImmediate(resolve));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(window.document.querySelectorAll('#app-manager-grid .app-card').length, 10, 'Suite Home should render all ten approved products');
  return { window, calls };
}

const tick = () => new Promise(resolve => setImmediate(resolve));
const byId = (window, id) => window.document.getElementById(id);

test('real renderer click flow switches correctly between Home, Apps, Files and Settings', async t => {
  const { window } = await bootSuite(t);
  const doc = window.document;

  assert.equal(byId(window, 'app-title').textContent, 'Your apps');
  assert.equal(byId(window, 'app-manager').hidden, false);
  assert.equal(byId(window, 'home-nav').hidden, false);
  assert.equal(byId(window, 'app-centre-nav').hidden, false);
  assert.equal(byId(window, 'files-nav').hidden, false);

  byId(window, 'app-centre-nav').click();
  assert.equal(byId(window, 'app-title').textContent, 'Apps');
  assert.equal(byId(window, 'app-manager').hidden, false);
  assert.equal(byId(window, 'app-manager').classList.contains('home-view'), false);

  byId(window, 'files-nav').click();
  assert.equal(byId(window, 'app-title').textContent, 'Files');
  assert.equal(byId(window, 'files-manager').hidden, false);
  assert.equal(byId(window, 'app-manager').hidden, true);

  byId(window, 'open-settings').click();
  assert.equal(byId(window, 'app-title').textContent, 'Settings');
  assert.equal(byId(window, 'settings-manager').hidden, false);
  assert.equal(byId(window, 'app-manager').hidden, true);
  assert.equal(byId(window, 'home-nav').hidden, false);
  assert.equal(byId(window, 'app-centre-nav').hidden, false);
  assert.equal(byId(window, 'files-nav').hidden, false);

  byId(window, 'app-centre-nav').click();
  assert.equal(byId(window, 'app-title').textContent, 'Apps');
  assert.equal(byId(window, 'app-manager').classList.contains('home-view'), false);

  byId(window, 'open-settings').click();
  byId(window, 'files-nav').click();
  assert.equal(byId(window, 'files-manager').hidden, false);
  assert.equal(byId(window, 'settings-manager').hidden, true);

  byId(window, 'open-settings').click();
  assert.equal(byId(window, 'settings-manager').hidden, false);
  byId(window, 'home-nav').click();
  assert.equal(byId(window, 'app-title').textContent, 'Your apps');
  assert.equal(byId(window, 'settings-manager').hidden, true);
  assert.equal(byId(window, 'app-manager').hidden, false);
  assert.equal(doc.querySelectorAll('#app-manager-grid .app-card').length, 10);
});

test('Settings actions open language preferences, return to Settings and save update preferences', async t => {
  const { window, calls } = await bootSuite(t);

  byId(window, 'open-settings').click();
  byId(window, 'manage-languages').click();
  await tick();
  assert.equal(byId(window, 'language-manager').hidden, false);
  assert.equal(byId(window, 'settings-manager').hidden, true);
  assert.equal(byId(window, 'home-nav').hidden, false);

  byId(window, 'back-to-apps').click();
  assert.equal(byId(window, 'settings-manager').hidden, false);
  assert.equal(byId(window, 'language-manager').hidden, true);

  byId(window, 'updates-button').click();
  await tick();
  assert.equal(calls.updateChecks, 1);
  assert.equal(byId(window, 'update-message').hidden, false);
  assert.equal(byId(window, 'update-message').textContent, 'No update is currently available.');

  byId(window, 'update-settings-button').click();
  await tick();
  assert.equal(byId(window, 'update-settings-panel').hidden, false);
  assert.equal(byId(window, 'update-settings-button').getAttribute('aria-expanded'), 'true');
  assert.match(byId(window, 'update-settings-panel').textContent, /Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace/);
  assert.equal(byId(window, 'update-manual-download').disabled, true);
  assert.equal(byId(window, 'update-manual-install').disabled, true);
  calls.updateListeners[0]({ status: 'available', message: 'A Brightdesk update is available.' });
  assert.equal(byId(window, 'update-manual-download').disabled, false);
  assert.equal(byId(window, 'update-manual-install').disabled, true);
  const autoCheck = byId(window, 'update-auto-check');
  assert.equal(autoCheck.checked, true);
  autoCheck.checked = false;
  autoCheck.dispatchEvent(new window.Event('change', { bubbles: true }));
  await tick();
  assert.equal(calls.savedUpdateSettings.length, 1);
  assert.equal(calls.savedUpdateSettings[0].autoCheck, false);

  byId(window, 'update-manual-check').click();
  await tick();
  assert.equal(calls.updateChecks, 2);
  assert.equal(byId(window, 'update-manual-check').disabled, false);
  byId(window, 'update-manual-download').click();
  await tick();
  assert.equal(calls.downloadRequests, 1);
  calls.updateListeners[0]({ status: 'downloaded', message: 'The Brightdesk update has been downloaded.' });
  assert.equal(byId(window, 'update-manual-download').disabled, true);
  assert.equal(byId(window, 'update-manual-install').disabled, false);
  byId(window, 'update-manual-install').click();
  await tick();
  assert.equal(calls.installRequests, 1);

  byId(window, 'close-update-settings').click();
  assert.equal(byId(window, 'update-settings-panel').hidden, true);
  assert.equal(byId(window, 'update-settings-button').getAttribute('aria-expanded'), 'false');
});

test('all ten Home product Open actions reach the desktop bridge', async t => {
  const { window, calls } = await bootSuite(t);
  for (const id of productIds) {
    const button = window.document.querySelector(`[data-app-id="${id}"] [data-action="open"]`);
    assert.ok(button, id + ' must have a visible Open action');
    button.click();
    await tick();
  }
  assert.deepEqual(calls.openedProducts, productIds);
});

test('Files buttons call the local open and save bridge actions', async t => {
  const { window, calls } = await bootSuite(t);
  byId(window, 'files-nav').click();

  byId(window, 'files-save-button').click();
  await tick();
  assert.equal(calls.savedProjects.length, 1);
  assert.equal(calls.savedProjects[0].docs.pages.title, 'Protected project');
  assert.equal(byId(window, 'save-status').textContent, 'Project saved');
  assert.equal(byId(window, 'files-message').hidden, false);
  assert.equal(byId(window, 'files-message').textContent, 'Project saved');

  calls.nextOpenFile = {
    kind: 'pages',
    title: 'Opened document',
    html: '<h1>Opened from Files</h1><p>This document must become visible.</p>'
  };
  byId(window, 'files-open-button').click();
  await tick();
  assert.equal(calls.openedFiles, 1);
  assert.equal(byId(window, 'files-manager').hidden, true);
  assert.equal(byId(window, 'files-message').hidden, true);
  assert.equal(byId(window, 'workspace').hidden, false);
  assert.equal(byId(window, 'editor').hidden, false);
  assert.equal(byId(window, 'doc-title').value, 'Opened document');
  assert.match(byId(window, 'editor').innerHTML, /Opened from Files/);
});

test('opening each supported file type from Files displays its matching workspace', async t => {
  const examples = [
    { kind: 'pages', title: 'Opened page', html: '<p>Page content</p>', target: 'editor' },
    { kind: 'sheets', title: 'Opened sheet', cells: [['Item', 'Count'], ['Apples', '3']], target: 'sheet-wrap' },
    { kind: 'slides', title: 'Opened deck', slides: [{ title: 'First slide', body: 'Deck content' }], target: 'slide-wrap' },
    { kind: 'notes', title: 'Opened note', text: 'Note content', target: 'notes-wrap' }
  ];
  for (const example of examples) {
    await t.test(example.kind, async subtest => {
      const { window, calls } = await bootSuite(subtest);
      byId(window, 'files-nav').click();
      calls.nextOpenFile = example;
      byId(window, 'files-open-button').click();
      await tick();
      assert.equal(byId(window, 'files-manager').hidden, true);
      assert.equal(byId(window, 'workspace').hidden, false);
      assert.equal(byId(window, example.target).hidden, false);
      assert.equal(byId(window, 'doc-title').value, example.title);
    });
  }
});

test('Notifications opens, announces expanded state and clears the list', async t => {
  const { window } = await bootSuite(t);
  byId(window, 'open-notifications').click();
  assert.equal(byId(window, 'notification-panel').hidden, false);
  assert.equal(byId(window, 'open-notifications').getAttribute('aria-expanded'), 'true');
  byId(window, 'clear-notifications').click();
  assert.equal(byId(window, 'notification-list').textContent, 'No notifications yet.');
});

test('product settings can hide Switch product navigation without removing local documents', async t => {
  const { window } = await bootSuite(t);
  const card = window.document.querySelector('[data-app-id="pages"]');
  card.querySelector('.app-card-menu-trigger').click();
  assert.equal(card.querySelector('.app-card-menu').hidden, false);
  card.querySelector('.app-card-menu-item').click();
  assert.equal(window.document.querySelector('#dynamic-app-nav [data-app="pages"]'), null);
  const restoredCard = window.document.querySelector('[data-app-id="pages"]');
  restoredCard.querySelector('.app-card-menu-trigger').click();
  restoredCard.querySelector('.app-card-menu-item').click();
  assert.ok(window.document.querySelector('#dynamic-app-nav [data-app="pages"]'));

  const workspaceCard = window.document.querySelector('[data-app-id="workspace"]');
  workspaceCard.querySelector('[data-action="remove-from-suite"]').click();
  const setup = JSON.parse(window.localStorage.getItem('brightdesk-app-setup-v1'));
  assert.equal(setup.installedApps.includes('workspace'), false);
  const removedCard = window.document.querySelector('[data-app-id="workspace"]');
  removedCard.querySelector('[data-action="add-to-suite"]').click();
  const restoredSetup = JSON.parse(window.localStorage.getItem('brightdesk-app-setup-v1'));
  assert.equal(restoredSetup.installedApps.includes('workspace'), true);
  const docs = JSON.parse(window.localStorage.getItem('brightdesk-docs-v3'));
  assert.equal(docs.pages.title, 'Protected project');
  assert.equal(docs.pages.html, '<p>Keep this document.</p>');
});
