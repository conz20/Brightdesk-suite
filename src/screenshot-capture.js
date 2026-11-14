'use strict';

const { assertPackagedVersion } = require('./startup-smoke');
const { SCREENSHOT_TARGETS, createScreenshotEvidence, writeScreenshotEvidence, verifyScreenshotSet } = require('./screenshot-evidence');

const SAMPLE_DATA_DESCRIPTION = 'Fictional Brightdesk sample records created for visual review in an isolated disposable profile. No real customer documents, contacts or personal data are used.';
const APP_IDS = ['pages', 'sheets', 'slides', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'loop'];

function seedRendererStorage() {
  const now = new Date('2026-11-14T10:00:00.000Z');
  const docs = {
    pages: {
      title: 'Project brief',
      html: '<h1>Website launch brief</h1><p>Prepare a clear, useful Help experience for the Brightdesk product family.</p><h2>Priorities</h2><ul><li>Review the product guides</li><li>Check the launch content</li><li>Confirm the release notes</li></ul>'
    },
    sheets: { title: 'Delivery tracker', cells: Array.from({ length: 20 }, () => Array(12).fill('')) },
    slides: { title: 'Release roadmap', slides: [
      { title: 'A clearer Help experience', body: 'Ten focused tools. One consistent Brightdesk family.' },
      { title: 'What we are improving', body: 'Product guides, reliable workflows and accessible design.' },
      { title: 'Next steps', body: 'Review, test and prepare the first release.' }
    ], current: 0 },
    notes: { title: 'Planning notes', text: 'Website launch\n\nReview each product guide\nCheck the sample workflows\nPrepare the release notes\n\nKeep the work local and the instructions clear.' },
    todo: { title: 'My tasks', tasks: [] },
    lists: { title: 'My lists', lists: [] }
  };

  const cells = docs.sheets.cells;
  [['Work item','Owner','Status','Hours'],['Review Help guides','Sample owner','In progress','3'],['Prepare release notes','Sample owner','Not started','2'],['Check product pages','Sample owner','Done','4'],['Total hours','','','=SUM(D2:D4)']]
    .forEach((row, r) => row.forEach((value, c) => { cells[r][c] = value; }));

  const services = [
    'BrightdeskTodoService','BrightdeskListsService','BrightdeskFormsService',
    'BrightdeskPlannerService','BrightdeskDatabaseService','BrightdeskWorkspaceService'
  ];
  for (const name of services) {
    if (!window[name]) throw new Error('A Brightdesk product data service is missing: ' + name);
  }

  docs.todo.tasks = [
    window.BrightdeskTodoService.createTask({ title: 'Review the Help guides', notes: 'Check the ten product pages.', myDay: true, priority: 'high', dueDate: '2026-11-18' }, { id: 'capture-todo-1', now }),
    window.BrightdeskTodoService.createTask({ title: 'Prepare release notes', notes: 'Write a short summary of the changes.', myDay: true, priority: 'normal', dueDate: '2026-11-19' }, { id: 'capture-todo-2', now }),
    window.BrightdeskTodoService.createTask({ title: 'Check product pages', notes: 'Review links and headings.', myDay: false, priority: 'low', dueDate: '2026-11-20' }, { id: 'capture-todo-3', now })
  ];

  let list = window.BrightdeskListsService.createList({ title: 'Launch checklist', description: 'Fictional tasks for a product release.' }, { id: 'capture-list', now });
  list = window.BrightdeskListsService.addItem(list, { values: { title: 'Review Help guides', status: 'In progress', priority: 'High', 'due-date': '2026-11-18', notes: 'Check clarity and accessibility.' } }, { id: 'capture-list-item-1', now });
  list = window.BrightdeskListsService.addItem(list, { values: { title: 'Prepare release notes', status: 'Not started', priority: 'Normal', 'due-date': '2026-11-19', notes: 'Summarise the changes.' } }, { id: 'capture-list-item-2', now });
  docs.lists.lists = [list];

  let form = window.BrightdeskFormsService.createForm({ title: 'Help guide feedback', description: 'A fictional sample form for visual review.' }, { id: 'capture-form', now });
  form = window.BrightdeskFormsService.addQuestion(form, { label: 'Was this guide clear?', type: 'choice', options: ['Yes', 'Somewhat', 'Not yet'], required: true }, { id: 'capture-form-q1', now });
  form = window.BrightdeskFormsService.addQuestion(form, { label: 'What would help next?', type: 'short-text', required: false }, { id: 'capture-form-q2', now });
  form = window.BrightdeskFormsService.submitResponse(form, { 'capture-form-q1': 'Yes', 'capture-form-q2': 'A short worked example.' }, { id: 'capture-form-response-1', now });
  localStorage.setItem('brightdesk-forms-v1', JSON.stringify([form]));

  let plan = window.BrightdeskPlannerService.createPlan({ title: 'Website launch', description: 'A fictional three-stage delivery plan.' }, { id: 'capture-plan', bucketId: 'capture-bucket-todo', now });
  plan = window.BrightdeskPlannerService.addBucket(plan, { name: 'In progress' }, { id: 'capture-bucket-progress', now });
  plan = window.BrightdeskPlannerService.addBucket(plan, { name: 'Complete' }, { id: 'capture-bucket-done', now });
  plan = window.BrightdeskPlannerService.addTask(plan, { title: 'Review the Help guides', bucketId: 'capture-bucket-progress', priority: 'high', progress: 'in-progress', dueDate: '2026-11-18', assignedTo: 'Sample owner', description: 'Check the product pages.' }, { id: 'capture-plan-task-1', now });
  plan = window.BrightdeskPlannerService.addTask(plan, { title: 'Prepare release notes', bucketId: 'capture-bucket-todo', priority: 'normal', progress: 'not-started', dueDate: '2026-11-19', assignedTo: 'Sample owner', description: 'Summarise the changes.' }, { id: 'capture-plan-task-2', now });
  localStorage.setItem('brightdesk-planner-v1', JSON.stringify([plan]));

  let database = window.BrightdeskDatabaseService.createDatabase({ name: 'Project register', description: 'Fictional project delivery records.' }, { id: 'capture-database', tableId: 'capture-projects', now });
  database = window.BrightdeskDatabaseService.renameTable(database, 'capture-projects', 'Projects', { now });
  database = window.BrightdeskDatabaseService.addField(database, 'capture-projects', { name: 'Project', type: 'text', required: true }, { id: 'capture-project', now });
  database = window.BrightdeskDatabaseService.addField(database, 'capture-projects', { name: 'Status', type: 'select', options: ['Not started', 'In progress', 'Complete'] }, { id: 'capture-status', now });
  database = window.BrightdeskDatabaseService.addField(database, 'capture-projects', { name: 'Owner', type: 'text' }, { id: 'capture-owner', now });
  database = window.BrightdeskDatabaseService.addRecord(database, 'capture-projects', {
    'capture-project': 'Help refresh',
    'capture-status': 'In progress',
    'capture-owner': 'Sample owner'
  }, { id: 'capture-project-row-1', now });
  database = window.BrightdeskDatabaseService.addRecord(database, 'capture-projects', {
    'capture-project': 'Release notes',
    'capture-status': 'Not started',
    'capture-owner': 'Sample owner'
  }, { id: 'capture-project-row-2', now });
  localStorage.setItem('brightdesk-database-v1', JSON.stringify(database));

  let project = window.BrightdeskWorkspaceService.createWorkspace({ name: 'Website launch', description: 'A fictional launch workspace.' }, { id: 'capture-workspace', pageId: 'capture-workspace-page', now });
  project = window.BrightdeskWorkspaceService.addBlock(project, 'capture-workspace-page', { type: 'heading', content: 'Launch checklist' }, { id: 'capture-workspace-heading', now });
  project = window.BrightdeskWorkspaceService.addBlock(project, 'capture-workspace-page', { type: 'paragraph', content: 'Keep the work clear, local and easy to review.' }, { id: 'capture-workspace-paragraph', now });
  project = window.BrightdeskWorkspaceService.addBlock(project, 'capture-workspace-page', { type: 'checklist', items: ['Review product guides', 'Check screenshots', 'Prepare release notes'] }, { id: 'capture-workspace-checklist', itemIds: ['capture-check-1', 'capture-check-2', 'capture-check-3'], now });
  localStorage.setItem('brightdesk-workspaces-v1', JSON.stringify([project]));

  localStorage.setItem('brightdesk-app-setup-v1', JSON.stringify({
    schemaVersion: 2, installedApps: APP_IDS.slice(), hiddenProducts: [], setupComplete: true
  }));
  localStorage.setItem('brightdesk-docs-v3', JSON.stringify(docs));
  localStorage.setItem('brightdesk-display-language', 'en-AU');
  localStorage.setItem('brightdesk-proofing-language', 'en-AU');
  localStorage.setItem('brightdesk-notifications-v1', '[]');
  return { installedApps: APP_IDS.length, taskCount: docs.todo.tasks.length, listCount: docs.lists.lists.length };
}

function waitForSuiteHome() {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 20000;
    function check() {
      const manager = document.querySelector('#app-manager');
      const grid = document.querySelector('#app-manager-grid');
      const home = document.querySelector('#home-nav');
      if (manager && !manager.hidden && grid && grid.children.length === 10 && home && home.classList.contains('active')) {
        resolve({ title: document.title, productCards: grid.children.length });
        return;
      }
      if (Date.now() >= deadline) {
        reject(new Error('Suite Home did not load ten product cards in the screenshot test.'));
        return;
      }
      window.setTimeout(check, 50);
    }
    check();
  });
}

function waitForProductWorkspace(appId, workspaceSelector, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const timeout = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 10000;
    const deadline = Date.now() + timeout;
    function check() {
      const bridge = window.brightdesk;
      const workspace = document.querySelector('#workspace');
      const productView = document.querySelector(workspaceSelector);
      if (bridge?.launchAppId === appId && bridge?.suiteLaunchedProduct === true &&
          workspace && !workspace.hidden && productView && !productView.hidden) {
        resolve({ appId, active: true, workspaceVisible: true, productViewVisible: true });
        return;
      }
      if (Date.now() >= deadline) {
        reject(new Error(appId + ' workspace did not load in its own Suite product window.'));
        return;
      }
      window.setTimeout(check, 50);
    }
    check();
  });
}

async function runScreenshotCaptureTest({ app, packageVersion, readTerms, readBundledLanguagePack, createWindow, getMainWindow, openProductWindow }) {
  let window;
  let activeProductWindow;
  try {
    if (typeof openProductWindow !== 'function') throw new Error('Screenshot capture requires the Suite product-window manager.');
    const outputDir = process.env.BRIGHTDESK_SCREENSHOT_OUTPUT_DIR;
    const sourceCommit = process.env.GITHUB_SHA;
    if (!outputDir || !require('node:path').isAbsolute(outputDir)) throw new Error('Screenshot capture requires an absolute output directory.');
    if (!sourceCommit || !/^[a-f0-9]{40}$/i.test(sourceCommit)) throw new Error('Screenshot capture requires the exact GitHub source commit.');
    assertPackagedVersion(app.getVersion(), packageVersion);
    await readTerms();
    await readBundledLanguagePack('en-AU');
    await createWindow({ show: false });
    window = getMainWindow();
    if (!window || window.isDestroyed()) throw new Error('The Brightdesk Electron window did not open.');

    const seed = await window.webContents.executeJavaScript('(' + seedRendererStorage.toString() + ')()', true);
    if (!seed || seed.installedApps !== 10 || seed.taskCount !== 3 || seed.listCount !== 1) {
      throw new Error('The fictional screenshot sample data could not be prepared.');
    }
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('The Suite window did not reload its screenshot sample data.')), 20000);
      window.webContents.once('did-finish-load', () => { clearTimeout(timeout); resolve(); });
      window.webContents.reload();
    });
    const home = await window.webContents.executeJavaScript('(' + waitForSuiteHome.toString() + ')()', true);
    if (home.productCards !== 10) throw new Error('Suite Home does not contain all ten products.');

    const osName = ({ darwin: 'macOS', win32: 'Windows', linux: 'Linux' })[process.platform] || process.platform;
    const osInfo = { name: osName, version: require('node:os').release(), architecture: require('node:os').arch() };
    for (const target of SCREENSHOT_TARGETS) {
      let captureWindow = window;
      if (target.appId) {
        activeProductWindow = await openProductWindow(target.appId);
        if (!activeProductWindow || activeProductWindow.isDestroyed()) {
          throw new Error('The ' + target.productName + ' product window did not open.');
        }
        captureWindow = activeProductWindow;
        const state = await captureWindow.webContents.executeJavaScript(
          '(' + waitForProductWorkspace.toString() + ')(' + JSON.stringify(target.appId) + ',' + JSON.stringify(target.workspaceSelector) + ')',
          true
        );
        if (!state.active || !state.workspaceVisible || !state.productViewVisible) {
          throw new Error('The ' + target.productName + ' workspace was not ready in its product window.');
        }
      } else {
        const visible = await captureWindow.webContents.executeJavaScript(
          'Boolean(document.querySelector("#app-manager") && !document.querySelector("#app-manager").hidden && document.querySelector("#app-manager-grid")?.children.length === 10)',
          true
        );
        if (!visible) throw new Error('Suite Home was not visible before capture.');
      }

      await captureWindow.webContents.executeJavaScript(
        'new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))',
        true
      );
      const image = await captureWindow.webContents.capturePage();
      const size = image.getSize();
      if (image.isEmpty() || size.width < 1000 || size.height < 650) {
        throw new Error(target.productName + ' capture is empty or too small (' + size.width + ' × ' + size.height + ').');
      }
      const imageBytes = image.toPNG();
      const evidence = createScreenshotEvidence({
        targetId: target.id,
        imageBytes,
        appVersion: app.getVersion(),
        sourceCommit,
        operatingSystem: osInfo,
        capturedAt: new Date().toISOString(),
        workflow: target.workflow,
        sampleDataDescription: SAMPLE_DATA_DESCRIPTION
      });
      writeScreenshotEvidence({ outputDir, targetId: target.id, imageBytes, evidence });
      console.log('Captured pending-review image:', target.productName, size.width + 'x' + size.height);
      if (activeProductWindow && !activeProductWindow.isDestroyed()) activeProductWindow.destroy();
      activeProductWindow = null;
    }
    const result = verifyScreenshotSet(outputDir);
    console.log('Brightdesk screenshot capture completed:', result.screenshotCount, 'images with pending-review evidence.');
    if (window && !window.isDestroyed()) window.destroy();
    app.exit(0);
  } catch (error) {
    console.error('Brightdesk screenshot capture failed:', error.stack || error.message);
    if (activeProductWindow && !activeProductWindow.isDestroyed()) activeProductWindow.destroy();
    if (window && !window.isDestroyed()) window.destroy();
    app.exit(1);
  }
}

module.exports = { seedRendererStorage, waitForSuiteHome, waitForProductWorkspace, runScreenshotCaptureTest };
