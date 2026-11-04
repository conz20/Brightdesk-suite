'use strict';
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('brightdeskTerms', {
  getText: () => ipcRenderer.invoke('terms:get-text'),
  accept: () => ipcRenderer.invoke('terms:accept'),
  decline: () => ipcRenderer.invoke('terms:decline')
});
