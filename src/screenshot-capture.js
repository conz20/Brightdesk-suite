'use strict';

const { assertPackagedVersion } = require('./startup-smoke');
const { SCREENSHOT_TARGETS, createScreenshotEvidence, writeScreenshotEvidence, verifyScreenshotSet } = require('./screenshot-evidence');

const SAMPLE_DATA_DESCRIPTION = 'Fictional Brightdesk sample records created for visual review in an isolated disposable profile. No real customer documents, contacts or personal data are used.';

const APPROVED_SCREENSHOT_SIZE = Object.freeze({ width: 1600, height: 900 });

function assertScreenshotSize(size, productName = 'Brightdesk') {
  if (!size || size.width !== APPROVED_SCREENSHOT_SIZE.width || size.height !== APPROVED_SCREENSHOT_SIZE.height) {
    const width = size?.width ?? 'unknown';
    const height = size?.height ?? 'unknown';
    throw new Error(`${productName} screenshot must be captured at 1600 × 900; received ${width} × ${height}.`);
  }
  return size;
}

const APP_IDS = ['pages', 'sheets', 'slides', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'loop'];

function seedRendererStorage() {
  const appIds = (window.BrightdeskAppCatalog || []).map(item => item.id);
  if (appIds.length !== 10) throw new Error('The screenshot renderer must load exactly ten approved Brightdesk products.');
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
    schemaVersion: 2, installedApps: appIds.slice(), hiddenProducts: [], setupComplete: true
  }));
  localStorage.setItem('brightdesk-docs-v3', JSON.stringify(docs));
  localStorage.setItem('brightdesk-display-language', 'en-AU');
  localStorage.setItem('brightdesk-proofing-language', 'en-AU');
  localStorage.setItem('brightdesk-notifications-v1', '[]');
  return { installedApps: appIds.length, taskCount: docs.todo.tasks.length, listCount: docs.lists.lists.length };
}

function waitForSuiteHome() {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + 20000;
    function check() {
      const manager = document.querySelector('#app-manager');
      const grid = document.querySelector('#app-manager-grid');
      const home = document.querySelector('#home-nav');
      const columns = grid ? window.getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length : 0;
      const cardRects = grid ? [...grid.children].map(card => card.getBoundingClientRect()) : [];
      const allCardsVisible = cardRects.length === 10 && cardRects.every(rect =>
        rect.width >= 230 && rect.height >= 220 &&
        rect.left >= 0 && rect.top >= 0 &&
        rect.right <= window.innerWidth && rect.bottom <= window.innerHeight
      );
      if (manager && !manager.hidden && grid && grid.children.length === 10 && columns === 5 && allCardsVisible && home && home.classList.contains('active')) {
        resolve({ title: document.title, productCards: grid.children.length, columns, allCardsVisible });
        return;
      }
      if (Date.now() >= deadline) {
        const rectSummary = element => {
          if (!element) return null;
          const rect = element.getBoundingClientRect();
          return { left: rect.left, top: rect.top, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom };
        };
        const diagnostics = {
          viewport: { width: window.innerWidth, height: window.innerHeight },
          main: rectSummary(document.querySelector('.main')),
          manager: rectSummary(manager),
          managerParent: rectSummary(manager?.parentElement),
          grid: rectSummary(grid),
          gridTemplateColumns: grid ? window.getComputedStyle(grid).gridTemplateColumns : null,
          productCards: grid?.children.length || 0,
          cards: cardRects.map(rect => ({ left: rect.left, top: rect.top, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom }))
        };
        reject(new Error('Suite Home did not load ten product cards in the approved five-column layout: ' + JSON.stringify(diagnostics)));
        return;
      }
      window.setTimeout(check, 50);
    }
    check();
  });
}

function waitForSuiteScreen(view, screenSelector, timeoutMs = 10000) {
  const controls = {
    home: ['#home-nav'],
    apps: ['#app-centre-nav'],
    files: ['#files-nav'],
    settings: ['#open-settings'],
    languages: ['#open-settings', '#manage-languages'],
    'update-settings': ['#open-settings', '#update-settings-button'],
    notifications: ['#open-settings', '#open-notifications']
  };
  if (!Object.hasOwn(controls, view)) {
    return Promise.reject(new Error('Unsupported Suite screenshot view: ' + view));
  }

  if (view !== 'update-settings') {
    const panel = document.querySelector('#update-settings-panel');
    const closeButton = document.querySelector('#close-update-settings');
    if (panel && !panel.hidden && closeButton) closeButton.click();
  }
  const notificationPanel = document.querySelector('#notification-panel');
  const notificationButton = document.querySelector('#open-notifications');
  if (notificationPanel && !notificationPanel.hidden && notificationButton) notificationButton.click();

  const controlSelectors = controls[view].slice();
  const updatePanel = document.querySelector('#update-settings-panel');
  if (view === 'update-settings' && updatePanel && !updatePanel.hidden) controlSelectors.pop();

  for (const selector of controlSelectors) {
    const control = document.querySelector(selector);
    if (!control || control.hidden || control.disabled) {
      return Promise.reject(new Error('The ' + view + ' navigation control ' + selector + ' is unavailable.'));
    }
    control.click();
  }

  return new Promise((resolve, reject) => {
    const timeout = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 10000;
    const deadline = Date.now() + timeout;
    function check() {
      const screen = document.querySelector(screenSelector);
      const correctAppManagerMode = view === 'home'
        ? screen?.classList.contains('home-view')
        : (view === 'apps' ? !screen?.classList.contains('home-view') : true);
      const settingsLoaded = view !== 'update-settings' || screen?.dataset.settingsLoaded === 'true';
      if (screen && !screen.hidden && correctAppManagerMode && settingsLoaded) {
        resolve({ view, active: true, screenVisible: true });
        return;
      }
      if (Date.now() >= deadline) {
        reject(new Error('The Suite ' + view + ' screen did not become visible.'));
        return;
      }
      window.setTimeout(check, 50);
    }
    check();
  });
}

function waitForProductWorkspace(appId, workspaceSelector, expectation = {}, timeoutMs = 20000) {
  if (typeof expectation === 'number') {
    timeoutMs = expectation;
    expectation = {};
  }
  return new Promise((resolve, reject) => {
    const timeout = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 20000;
    const deadline = Date.now() + timeout;
    function check() {
      const bridge = window.brightdesk;
      const workspace = document.querySelector('#workspace');
      const productView = document.querySelector(workspaceSelector);
      const appTitle = document.querySelector('#app-title')?.textContent.trim() || '';
      const documentTitle = document.querySelector('#doc-title')?.value?.trim() || '';
      let sampleContent = productView?.textContent || '';
      if (productView) {
        for (const field of productView.querySelectorAll('input, textarea, select')) sampleContent += ' ' + (field.value || '');
      }
      const appTitleReady = !expectation.appTitle || appTitle === expectation.appTitle;
      const documentTitleReady = !expectation.documentTitle || documentTitle === expectation.documentTitle;
      const sampleContentReady = !expectation.sampleText || sampleContent.includes(expectation.sampleText);
      if (bridge?.launchAppId === appId && bridge?.suiteLaunchedProduct === true &&
          workspace && !workspace.hidden && productView && !productView.hidden &&
          appTitleReady && documentTitleReady && sampleContentReady) {
        resolve({ appId, active: true, appTitle, documentTitle, workspaceVisible: true, productViewVisible: true, sampleContentVerified: sampleContentReady });
        return;
      }
      if (Date.now() >= deadline) {
        reject(new Error(appId + ' workspace did not finish rendering. appTitle="' + appTitle +
          '", documentTitle="' + documentTitle + '", sampleContentReady=' + sampleContentReady + '.'));
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
  let captureStage = 'initialising screenshot capture';
  const watchRendererConsole = (contents, label) => {
    contents.on('console-message', (...args) => {
      const details = args[1];
      const level = details && typeof details === 'object' ? details.level : args[1];
      const message = details && typeof details === 'object' ? details.message : args[2];
      if (Number(level) >= 2 || level === 'error') {
        console.error(`[${label} renderer] ${message || 'Renderer console error'}`);
      }
    });
  };
  try {
    if (typeof openProductWindow !== 'function') throw new Error('Screenshot capture requires the Suite product-window manager.');
    const outputDir = process.env.BRIGHTDESK_SCREENSHOT_OUTPUT_DIR;
    const sourceCommit = process.env.BRIGHTDESK_SOURCE_COMMIT;
    if (!outputDir || !require('node:path').isAbsolute(outputDir)) throw new Error('Screenshot capture requires an absolute output directory.');
    if (!sourceCommit || !/^[a-f0-9]{40}$/i.test(sourceCommit)) throw new Error('Screenshot capture requires the exact GitHub source commit.');
    captureStage = 'checking the packaged application version';
    assertPackagedVersion(app.getVersion(), packageVersion);
    captureStage = 'reading the local terms';
    await readTerms();
    captureStage = 'loading the bundled Australian English language pack';
    await readBundledLanguagePack('en-AU');
    captureStage = 'opening the hidden Suite window';
    await createWindow({ show: false });
    window = getMainWindow();
    if (!window || window.isDestroyed()) throw new Error('The Brightdesk Electron window did not open.');
    watchRendererConsole(window.webContents, 'Suite');

    captureStage = 'seeding fictional screenshot data in the Suite renderer';
    const seed = await window.webContents.executeJavaScript('(' + seedRendererStorage.toString() + ')()', true);
    if (!seed || seed.installedApps !== 10 || seed.taskCount !== 3 || seed.listCount !== 1) {
      throw new Error('The fictional screenshot sample data could not be prepared.');
    }
    captureStage = 'reloading the Suite with its fictional screenshot data';
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('The Suite window did not reload its screenshot sample data.')), 20000);
      window.webContents.once('did-finish-load', () => { clearTimeout(timeout); resolve(); });
      window.webContents.reload();
    });
    captureStage = 'waiting for the ten-product Suite Home';
    const home = await window.webContents.executeJavaScript('(' + waitForSuiteHome.toString() + ')()', true);
    if (home.productCards !== 10) throw new Error('Suite Home does not contain all ten products.');

    const osName = ({ darwin: 'macOS', win32: 'Windows', linux: 'Linux' })[process.platform] || process.platform;
    const osInfo = { name: osName, version: require('node:os').release(), architecture: require('node:os').arch() };
    for (const target of SCREENSHOT_TARGETS) {
      captureStage = `opening ${target.productName} for capture`;
      let captureWindow = window;
      if (target.appId) {
        activeProductWindow = await openProductWindow(target.appId);
        if (!activeProductWindow || activeProductWindow.isDestroyed()) {
          throw new Error('The ' + target.productName + ' product window did not open.');
        }
        captureWindow = activeProductWindow;
        watchRendererConsole(captureWindow.webContents, target.productName);
        captureStage = `waiting for the ${target.productName} workspace`;
        const readiness = {
          appTitle: target.productName,
          documentTitle: target.expectedDocumentTitle,
          sampleText: target.expectedText
        };
        const state = await captureWindow.webContents.executeJavaScript(
          '(' + waitForProductWorkspace.toString() + ')(' + JSON.stringify(target.appId) + ',' +
          JSON.stringify(target.workspaceSelector) + ',' + JSON.stringify(readiness) + ')',
          true
        );
        if (!state.active || !state.workspaceVisible || !state.productViewVisible) {
          throw new Error('The ' + target.productName + ' workspace was not ready in its product window.');
        }
      } else {
        captureStage = `navigating to the Suite ${target.view} screen`;
        const state = await captureWindow.webContents.executeJavaScript(
          '(' + waitForSuiteScreen.toString() + ')(' + JSON.stringify(target.view) + ',' + JSON.stringify(target.workspaceSelector) + ')',
          true
        );
        if (!state.active || !state.screenVisible) {
          throw new Error('The Suite ' + target.view + ' screen was not ready before capture.');
        }
      }

      captureStage = `capturing the ${target.productName} screen`;
      await captureWindow.webContents.executeJavaScript(
        'new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))',
        true
      );
      const image = await captureWindow.webContents.capturePage(undefined, { stayHidden: true });
      const size = image.getSize();
      if (image.isEmpty()) throw new Error(target.productName + ' capture is empty.');
      assertScreenshotSize(size, target.productName);
      captureStage = `writing the ${target.productName} screenshot evidence`;
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
    console.error(`Brightdesk screenshot capture failed during ${captureStage}:`, error.stack || error.message);
    if (activeProductWindow && !activeProductWindow.isDestroyed()) activeProductWindow.destroy();
    if (window && !window.isDestroyed()) window.destroy();
    app.exit(1);
  }
}

module.exports = { seedRendererStorage, waitForSuiteHome, waitForSuiteScreen, waitForProductWorkspace, assertScreenshotSize, runScreenshotCaptureTest };
