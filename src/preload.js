const { contextBridge, ipcRenderer } = require('electron');

const launchArgument = process.argv.find(argument => argument.startsWith('--brightdesk-app='));
const launchAppId = launchArgument ? launchArgument.slice('--brightdesk-app='.length) : null;
const supportedApps = new Set(['pages', 'sheets', 'slides', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'loop']);

contextBridge.exposeInMainWorld('brightdesk', {
  launchAppId: supportedApps.has(launchAppId) ? launchAppId : null,
  platform: process.platform,
  version: process.env.npm_package_version || '0.1.0',
  getVersion: () => ipcRenderer.invoke('app:version'),
  downloadStandaloneApp: (appId) => ipcRenderer.invoke('downloads:standalone-app', appId),
  openFile: () => ipcRenderer.invoke('file:open'),
  exportFile: (payload) => ipcRenderer.invoke('file:export', payload),
  saveProject: (project) => ipcRenderer.invoke('project:save', project),
  loadProject: () => ipcRenderer.invoke('project:open'),
  exportPdf: (payload) => ipcRenderer.invoke('file:pdf', payload),
  checkForUpdates: () => ipcRenderer.invoke('updates:check'),
  downloadUpdate: () => ipcRenderer.invoke('updates:download'),
  installUpdate: () => ipcRenderer.invoke('updates:install'),
  onUpdateState: (callback) => ipcRenderer.on('updates:state', (_event, value) => callback(value)),
  listLanguagePacks: () => ipcRenderer.invoke('languages:list'),
  installLanguagePack: (code) => ipcRenderer.invoke('languages:install', code),
  setProofingLanguage: (code) => ipcRenderer.invoke('languages:set-proofing', code),
  listDictionaries: () => ipcRenderer.invoke('dictionaries:list'),
  listDictionaryCatalogue: () => ipcRenderer.invoke('dictionaries:catalog'),
  installCatalogueDictionary: (id) => ipcRenderer.invoke('dictionaries:install-catalog', id),
  checkSpelling: (payload) => ipcRenderer.invoke('dictionaries:check', payload)
});
