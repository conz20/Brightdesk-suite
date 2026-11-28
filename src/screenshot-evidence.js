'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const SCREENSHOT_TARGETS = Object.freeze([
  { id: 'suite', productId: 'suite', productName: 'Brightdesk Suite', appId: null, view: 'home', workspaceSelector: '#app-manager', filename: 'suite-home.png', workflow: 'Suite Home showing all ten approved products.' },
  { id: 'suite-apps', productId: 'suite', productName: 'Brightdesk Apps', appId: null, view: 'apps', workspaceSelector: '#app-manager', filename: 'suite-apps.png', workflow: 'Apps management showing all ten product cards and their available actions.' },
  { id: 'suite-files', productId: 'suite', productName: 'Brightdesk Files', appId: null, view: 'files', workspaceSelector: '#files-manager', filename: 'suite-files.png', workflow: 'Files showing the local Open file and Save project actions.' },
  { id: 'suite-settings', productId: 'suite', productName: 'Brightdesk Settings', appId: null, view: 'settings', workspaceSelector: '#settings-manager', filename: 'suite-settings.png', workflow: 'Settings showing language, dictionaries and update controls.' },
  { id: 'suite-languages', productId: 'suite', productName: 'Brightdesk Language Settings', appId: null, view: 'languages', workspaceSelector: '#language-manager', filename: 'suite-languages.png', workflow: 'Language settings showing display language and proofing dictionaries.' },
  { id: 'suite-update-settings', productId: 'suite', productName: 'Brightdesk Update Settings', appId: null, view: 'update-settings', workspaceSelector: '#update-settings-panel', filename: 'suite-update-settings.png', workflow: 'Update settings showing automatic checks and gated manual update actions.' },
  { id: 'suite-notifications', productId: 'suite', productName: 'Brightdesk Notifications', appId: null, view: 'notifications', workspaceSelector: '#notification-panel', filename: 'suite-notifications.png', workflow: 'Notifications panel showing its empty or current notification state.' },
  { id: 'pages', productId: 'pages', productName: 'Brightdesk Pages', appId: 'pages', workspaceSelector: '#editor', expectedDocumentTitle: 'Project brief', expectedText: 'Website launch brief', filename: 'pages-workspace.png', workflow: 'The integrated Suite Pages workspace showing a fictional project brief.' },
  { id: 'sheets', productId: 'sheets', productName: 'Brightdesk Sheets', appId: 'sheets', workspaceSelector: '#sheet-wrap', expectedDocumentTitle: 'Delivery tracker', expectedText: 'Review Help guides', filename: 'sheets-workspace.png', workflow: 'The integrated Suite Sheets workspace showing a fictional delivery tracker.' },
  { id: 'decks', productId: 'slides', productName: 'Brightdesk Decks', appId: 'slides', workspaceSelector: '#slide-wrap', expectedDocumentTitle: 'Release roadmap', expectedText: 'A clearer Help experience', filename: 'decks-workspace.png', workflow: 'The integrated Suite Decks workspace showing a fictional presentation.' },
  { id: 'notes', productId: 'notes', productName: 'Brightdesk Notes', appId: 'notes', workspaceSelector: '#notes-wrap', expectedDocumentTitle: 'Planning notes', expectedText: 'Website launch', filename: 'notes-workspace.png', workflow: 'The integrated Suite Notes workspace showing a fictional planning note.' },
  { id: 'database', productId: 'database', productName: 'Brightdesk Database', appId: 'database', workspaceSelector: '#database-wrap', expectedText: 'Help refresh', filename: 'database-workspace.png', workflow: 'The integrated Suite Database workspace showing fictional project records.' },
  { id: 'forms', productId: 'forms', productName: 'Brightdesk Forms', appId: 'forms', workspaceSelector: '#forms-wrap', expectedText: 'Help guide feedback', filename: 'forms-workspace.png', workflow: 'The integrated Suite Forms workspace showing a fictional feedback form.' },
  { id: 'lists', productId: 'lists', productName: 'Brightdesk Lists', appId: 'lists', workspaceSelector: '#lists-wrap', expectedText: 'Launch checklist', filename: 'lists-workspace.png', workflow: 'The integrated Suite Lists workspace showing a fictional task list.' },
  { id: 'planner', productId: 'planner', productName: 'Brightdesk Planner', appId: 'planner', workspaceSelector: '#planner-wrap', expectedText: 'Website launch', filename: 'planner-workspace.png', workflow: 'The integrated Suite Planner workspace showing a fictional project board.' },
  { id: 'todo', productId: 'todo', productName: 'Brightdesk To Do', appId: 'todo', workspaceSelector: '#todo-wrap', expectedText: 'Review the Help guides', filename: 'to-do-workspace.png', workflow: 'The integrated Suite To Do workspace showing fictional My Day tasks.' },
  { id: 'workspace', productId: 'loop', productName: 'Brightdesk Workspace', appId: 'loop', workspaceSelector: '#workspace-app-wrap', expectedText: 'Launch checklist', filename: 'workspace-workspace.png', workflow: 'The integrated Suite Workspace editor showing a fictional launch checklist.' }
]);

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const CAPTURE_METHOD = 'Electron BrowserWindow.webContents.capturePage(); full Brightdesk content area, excluding native operating-system window chrome.';

function findScreenshotTarget(targetId) {
  const target = SCREENSHOT_TARGETS.find(item => item.id === targetId);
  if (!target) throw new Error(`Unsupported Brightdesk screenshot target: ${targetId}`);
  return target;
}

function validatePng(imageBytes) {
  if (!Buffer.isBuffer(imageBytes) || imageBytes.length < PNG_SIGNATURE.length ||
      !imageBytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error('Screenshot capture did not return a valid PNG image.');
  }
}

function createScreenshotEvidence(input = {}) {
  const target = findScreenshotTarget(input.targetId);
  validatePng(input.imageBytes);
  for (const field of ['appVersion', 'sourceCommit', 'capturedAt', 'workflow', 'sampleDataDescription']) {
    if (typeof input[field] !== 'string' || !input[field].trim()) {
      throw new Error(`Screenshot evidence requires ${field}.`);
    }
  }
  if (!/^[a-f0-9]{40}$/i.test(input.sourceCommit)) {
    throw new Error('Screenshot evidence requires the exact 40-character source commit.');
  }
  const operatingSystem = input.operatingSystem;
  if (!operatingSystem || ['name', 'version', 'architecture'].some(field => typeof operatingSystem[field] !== 'string' || !operatingSystem[field].trim())) {
    throw new Error('Screenshot evidence requires the operating-system name, version and architecture.');
  }
  const capturedAt = new Date(input.capturedAt);
  if (Number.isNaN(capturedAt.getTime())) throw new Error('Screenshot evidence requires a valid capture timestamp.');
  return {
    status: 'captured-pending-review',
    verified: false,
    productId: target.productId,
    productName: target.productName,
    sourceRepository: 'conz20/Brightdesk-suite',
    imageFilename: target.filename,
    appVersion: input.appVersion,
    sourceCommit: input.sourceCommit.toLowerCase(),
    operatingSystem: {
      name: operatingSystem.name,
      version: operatingSystem.version,
      architecture: operatingSystem.architecture
    },
    capturedAt: capturedAt.toISOString(),
    workflow: input.workflow,
    sampleDataDescription: input.sampleDataDescription,
    captureMethod: CAPTURE_METHOD,
    primaryWorkflowInspected: false,
    reviewedForSensitiveData: false,
    reviewedBy: '',
    sha256: crypto.createHash('sha256').update(input.imageBytes).digest('hex')
  };
}

function writeScreenshotEvidence({ outputDir, targetId, imageBytes, evidence }) {
  const target = findScreenshotTarget(targetId);
  validatePng(imageBytes);
  if (!path.isAbsolute(outputDir || '')) throw new Error('Screenshot output directory must be an absolute path.');
  if (!evidence || evidence.imageFilename !== target.filename || evidence.productId !== target.productId ||
      evidence.verified !== false || evidence.status !== 'captured-pending-review') {
    throw new Error('Screenshot evidence does not match the selected target or review state.');
  }
  const expectedHash = crypto.createHash('sha256').update(imageBytes).digest('hex');
  if (evidence.sha256 !== expectedHash) throw new Error('Screenshot evidence checksum does not match the PNG.');
  fs.mkdirSync(outputDir, { recursive: true });
  const imagePath = path.join(outputDir, target.filename);
  const evidencePath = path.join(outputDir, `${target.id}-evidence.json`);
  fs.writeFileSync(imagePath, imageBytes, { flag: 'wx' });
  try {
    fs.writeFileSync(evidencePath, `${JSON.stringify(evidence, null, 2)}\n`, { flag: 'wx' });
  } catch (error) {
    fs.rmSync(imagePath, { force: true });
    throw error;
  }
  return { imagePath, evidencePath };
}

function verifyScreenshotSet(outputDir) {
  if (!path.isAbsolute(outputDir || '') || !fs.existsSync(outputDir)) throw new Error('Screenshot output directory does not exist.');
  const expectedFiles = SCREENSHOT_TARGETS.flatMap(target => [target.filename, `${target.id}-evidence.json`]).sort();
  const actualFiles = fs.readdirSync(outputDir).sort();
  if (actualFiles.length !== expectedFiles.length || actualFiles.some((name, index) => name !== expectedFiles[index])) {
    throw new Error(`Screenshot output must contain exactly ${expectedFiles.length} expected image and evidence files.`);
  }
  for (const target of SCREENSHOT_TARGETS) {
    const imageBytes = fs.readFileSync(path.join(outputDir, target.filename));
    validatePng(imageBytes);
    const evidence = JSON.parse(fs.readFileSync(path.join(outputDir, `${target.id}-evidence.json`), 'utf8'));
    if (evidence.imageFilename !== target.filename || evidence.productId !== target.productId ||
        evidence.status !== 'captured-pending-review' || evidence.verified !== false) {
      throw new Error(`Screenshot evidence is invalid for ${target.productName}.`);
    }
    if (evidence.sha256 !== crypto.createHash('sha256').update(imageBytes).digest('hex')) {
      throw new Error(`Screenshot checksum mismatch for ${target.productName}.`);
    }
  }
  return { screenshotCount: SCREENSHOT_TARGETS.length, files: expectedFiles };
}

module.exports = { SCREENSHOT_TARGETS, CAPTURE_METHOD, createScreenshotEvidence, writeScreenshotEvidence, verifyScreenshotSet };
