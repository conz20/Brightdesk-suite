'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const launchArgument = process.argv.find(argument => argument.startsWith('--brightdesk-app='));
const launchAppId = launchArgument ? launchArgument.slice('--brightdesk-app='.length) : null;
const suiteLaunchedProduct = process.argv.includes('--brightdesk-suite-window=1');
const supportedApps = new Set([
  'pages',
  'sheets',
  'slides',
  'notes',
  'database',
  'forms',
  'lists',
  'planner',
  'todo',
  'loop'
]);

contextBridge.exposeInMainWorld('brightdesk', {
  launchAppId: supportedApps.has(launchAppId) ? launchAppId : null,
  suiteLaunchedProduct,
  openApplication: (applicationId) => ipcRenderer.invoke('apps:open', applicationId),
  platform: process.platform,
  version: ipcRenderer.sendSync('app:version-sync'),
  getVersion: () => ipcRenderer.invoke('app:version'),
  getNativeEngineInfo: () => ipcRenderer.invoke('native:engine-info'),
  chunkSource: (source, maxBytes) => ipcRenderer.invoke('native:chunk-source', source, maxBytes),
  analyzeSource: (source) => ipcRenderer.invoke('native:analyze-source', source),
  normalizeEmbedding: (values) => ipcRenderer.invoke('native:normalize-embedding', values),
  cosineSimilarity: (left, right) => ipcRenderer.invoke('native:cosine-similarity', left, right),
  rankEmbeddings: (query, candidates, limit) => ipcRenderer.invoke('native:rank-embeddings', query, candidates, limit),
  openFile: () => ipcRenderer.invoke('file:open'),
  exportFile: (payload) => ipcRenderer.invoke('file:export', payload),
  saveProject: (project) => ipcRenderer.invoke('project:save', project),
  loadProject: () => ipcRenderer.invoke('project:open'),
  exportPdf: (payload) => ipcRenderer.invoke('file:pdf', payload),
  checkForUpdates: () => ipcRenderer.invoke('updates:check'),
  downloadUpdate: () => ipcRenderer.invoke('updates:download'),
  installUpdate: () => ipcRenderer.invoke('updates:install'),
  getUpdateSettings: () => ipcRenderer.invoke('updates:settings'),
  setUpdateSettings: (settings) => ipcRenderer.invoke('updates:set-settings', settings),
  onUpdateState: (callback) => ipcRenderer.on('updates:state', (_event, value) => callback(value)),
  listLanguagePacks: () => ipcRenderer.invoke('languages:list'),
  installLanguagePack: (code) => ipcRenderer.invoke('languages:install', code),
  setProofingLanguage: (code) => ipcRenderer.invoke('languages:set-proofing', code),
  listDictionaries: () => ipcRenderer.invoke('dictionaries:list'),
  checkSpelling: (payload) => ipcRenderer.invoke('dictionaries:check', payload)
});
