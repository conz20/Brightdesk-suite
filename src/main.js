const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const packageConfig = require('../package.json');
const path = require('node:path');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const { openOfficeFile, exportOfficeFile, cleanFileName, ensureExtension } = require('./file-service');
const { BUILTIN_LANGUAGES, validateLanguagePack, getBuiltinLanguage } = require('./language-service');
const { DictionaryService } = require('./dictionary-service');
const { APP_SLUGS, createStandaloneDownload } = require('./standalone-downloads');
let mainWindow;
let agreementWindow;
let termsAccepted = false;
let autoUpdater;
const updatePublishingConfigured = Array.isArray(packageConfig.build?.publish) && packageConfig.build.publish.some(item => item?.provider === 'github' && item?.owner && item.owner !== 'YOUR_GITHUB_ACCOUNT');
let updateCheckInProgress = false;
let lastUpdateCheckAt = 0;
let dictionaryService;
const standaloneAppNames = {
  pages: 'Pages', sheets: 'Sheets', slides: 'Decks', notes: 'Notes',
  database: 'Database', forms: 'Forms', lists: 'Lists', planner: 'Planner',
  todo: 'To Do', loop: 'Workspace'
};
const supportedStandaloneApps = new Set(Object.keys(APP_SLUGS));
const standaloneAppId = packageConfig.brightdeskAppId || null;
if (standaloneAppId && !supportedStandaloneApps.has(standaloneAppId)) {
  throw new Error(`Unsupported Brightdesk standalone app: ${standaloneAppId}`);
}

function sendUpdateState(state) { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('updates:state', state); }
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 920, minWidth: 980, minHeight: 680,
    title: standaloneAppId ? `Brightdesk ${standaloneAppNames[standaloneAppId]}` : 'Brightdesk', backgroundColor: '#f5f6fa',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, additionalArguments: standaloneAppId ? [`--brightdesk-app=${standaloneAppId}`] : [] }
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', event => event.preventDefault());
  mainWindow.on('focus', () => { if (autoUpdater) checkForUpdates({ quiet: true }); });
}
function senderIsMain(event) { return mainWindow && event.sender === mainWindow.webContents; }

function termsFilePath() { return path.join(app.getAppPath(), 'TERMS_AND_CONDITIONS.txt'); }
async function readTerms() { return fs.readFile(termsFilePath(), 'utf8'); }
async function hasCurrentTermsAcceptance() {
  try {
    const [terms, record] = await Promise.all([
      readTerms(),
      fs.readFile(path.join(app.getPath('userData'), 'terms-acceptance.json'), 'utf8').then(JSON.parse)
    ]);
    const digest = crypto.createHash('sha256').update(terms).digest('hex');
    return record?.termsSha256 === digest && record?.accepted === true;
  } catch { return false; }
}
function createAgreementWindow() {
  agreementWindow = new BrowserWindow({
    width: 780, height: 820, minWidth: 620, minHeight: 620,
    title: 'Brightdesk Terms and Conditions',
    resizable: true, minimizable: false, maximizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'terms-preload.js'),
      contextIsolation: true, nodeIntegration: false, sandbox: true
    }
  });
  agreementWindow.loadFile(path.join(__dirname, 'terms.html'));
  agreementWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  agreementWindow.webContents.on('will-navigate', event => event.preventDefault());
  agreementWindow.on('closed', () => {
    agreementWindow = null;
    if (!termsAccepted) app.quit();
  });
}
function acceptTermsAndContinue() {
  if (!agreementWindow) return;
  termsAccepted = true;
  agreementWindow.close();
  createWindow();
  initUpdater();
}
ipcMain.handle('terms:get-text', async event => {
  if (!agreementWindow || event.sender !== agreementWindow.webContents) throw new Error('Invalid terms window.');
  return readTerms();
});
ipcMain.handle('terms:accept', async event => {
  if (!agreementWindow || event.sender !== agreementWindow.webContents) throw new Error('Invalid terms window.');
  const terms = await readTerms();
  const termsSha256 = crypto.createHash('sha256').update(terms).digest('hex');
  const record = { accepted: true, termsVersion: '1.0', termsSha256, acceptedAt: new Date().toISOString(), appVersion: app.getVersion() };
  await fs.mkdir(app.getPath('userData'), { recursive: true });
  await fs.writeFile(path.join(app.getPath('userData'), 'terms-acceptance.json'), `${JSON.stringify(record, null, 2)}\n`, { mode: 0o600 });
  acceptTermsAndContinue();
  return { ok: true };
});
ipcMain.handle('terms:decline', event => {
  if (!agreementWindow || event.sender !== agreementWindow.webContents) throw new Error('Invalid terms window.');
  termsAccepted = false;
  app.quit();
  return { ok: true };
});
ipcMain.handle('app:version', event => { if (!senderIsMain(event)) throw new Error('Invalid sender.'); return app.getVersion(); });

ipcMain.handle('downloads:standalone-app', async (event, appId) => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  const download = createStandaloneDownload({
    appId,
    platform: process.platform,
    version: packageConfig.version
  });
  await shell.openExternal(download.url);
  return { ok: true, filename: download.filename };
});

function languagePackDirectory() {
  return path.join(app.getPath('userData'), 'language-packs');
}

async function readBundledLanguagePack(code) {
  const metadata = getBuiltinLanguage(code);
  if (!metadata) throw new Error('That language is not in the protected Brightdesk language catalogue.');
  const source = path.join(__dirname, 'languages', metadata.file);
  const pack = validateLanguagePack(JSON.parse(await fs.readFile(source, 'utf8')));
  if (pack.code !== metadata.code) throw new Error('The bundled language pack does not match its protected catalogue entry.');
  return { pack, bytes: await fs.readFile(source) };
}

async function ensureLanguagePackDirectory() {
  const directory = languagePackDirectory();
  await fs.mkdir(directory, { recursive: true });
  const defaultPath = path.join(directory, 'en-AU.json');
  const { pack, bytes } = await readBundledLanguagePack('en-AU');
  try {
    const existing = await fs.readFile(defaultPath);
    if (!crypto.timingSafeEqual(crypto.createHash('sha256').update(existing).digest(), crypto.createHash('sha256').update(bytes).digest())) {
      throw new Error('The installed default language pack has been changed. Brightdesk will not replace or accept modified language resources. Reinstall the official application package to restore it.');
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    await fs.writeFile(defaultPath, bytes, { flag: 'wx', mode: 0o444 });
  }
  await fs.chmod(defaultPath, 0o444).catch(() => {});
  return directory;
}

async function readInstalledLanguagePacks() {
  const directory = await ensureLanguagePackDirectory();
  const packs = [];
  for (const metadata of BUILTIN_LANGUAGES) {
    const filename = `${metadata.code}.json`;
    const target = path.join(directory, filename);
    try {
      const [installedBytes, bundled] = await Promise.all([fs.readFile(target), readBundledLanguagePack(metadata.code)]);
      const actualHash = crypto.createHash('sha256').update(installedBytes).digest();
      const bundledHash = crypto.createHash('sha256').update(bundled.bytes).digest();
      if (!crypto.timingSafeEqual(actualHash, bundledHash)) {
        console.warn(`Ignoring modified language pack ${metadata.code}; only unmodified Brightdesk catalogue resources are accepted.`);
        continue;
      }
      packs.push(bundled.pack);
      await fs.chmod(target, 0o444).catch(() => {});
    } catch (error) {
      if (error.code !== 'ENOENT') console.warn(`Skipping language pack ${metadata.code}: ${error.message}`);
    }
  }
  if (!packs.some(pack => pack.code === 'en-AU')) throw new Error('The protected default English language pack is missing or has been modified.');
  return packs;
}

ipcMain.handle('languages:list', async event => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  const installed = await readInstalledLanguagePacks();
  const builtIn = BUILTIN_LANGUAGES.map(({ code, name, nativeName, proofingCode, isDefault }) => ({ code, name, nativeName, proofingCode, isDefault }));
  const session = mainWindow.webContents.session;
  return {
    available: builtIn,
    installed,
    spellCheckerLanguages: process.platform === 'darwin' ? [] : (session.availableSpellCheckerLanguages || []),
    usesNativeMacSpellChecker: process.platform === 'darwin'
  };
});

ipcMain.handle('languages:install', async (event, code) => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  const metadata = getBuiltinLanguage(code);
  if (!metadata) throw new Error('That language is not in the protected Brightdesk language catalogue.');
  const { pack, bytes } = await readBundledLanguagePack(code);
  const directory = await ensureLanguagePackDirectory();
  const destination = path.join(directory, `${pack.code}.json`);
  try {
    const existing = await fs.readFile(destination);
    const existingHash = crypto.createHash('sha256').update(existing).digest();
    const bundledHash = crypto.createHash('sha256').update(bytes).digest();
    if (!crypto.timingSafeEqual(existingHash, bundledHash)) throw new Error('An installed language pack has been modified. Brightdesk will not overwrite it. Reinstall the official application package to restore the protected resource.');
    return { ok: true, code: pack.code, alreadyInstalled: true };
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await fs.writeFile(destination, bytes, { flag: 'wx', mode: 0o444 });
  await fs.chmod(destination, 0o444).catch(() => {});
  return { ok: true, code: pack.code };
});

ipcMain.handle('languages:set-proofing', async (event, code) => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  const packs = await readInstalledLanguagePacks();
  const pack = packs.find(item => item.code === code || (item.proofingCode && item.proofingCode === code));
  if (!pack) throw new Error('Install this language pack before selecting it for proofing.');
  if (process.platform === 'darwin') return { ok: true, usesNativeMacSpellChecker: true, supported: true };
  const session = mainWindow.webContents.session;
  const proofingCode = pack.proofingCode || pack.code;
  const available = session.availableSpellCheckerLanguages || [];
  if (!available.includes(proofingCode)) return { ok: false, supported: false, available };
  session.setSpellCheckerLanguages([proofingCode]);
  return { ok: true, supported: true, code: proofingCode };
});

ipcMain.handle('dictionaries:list', async event => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  return dictionaryService.installed();
});

ipcMain.handle('dictionaries:catalog', async event => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  const [installed, catalogue] = await Promise.all([dictionaryService.installed(), Promise.resolve(dictionaryService.catalogue())]);
  const installedCodes = new Set(installed.map(item => item.locale.toLowerCase()));
  return catalogue.map(item => ({ ...item, installed: installedCodes.has(item.locale.toLowerCase()) }));
});

ipcMain.handle('dictionaries:install-catalog', async (event, id) => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  return dictionaryService.installCatalogueEntry(id);
});

ipcMain.handle('dictionaries:check', async (event, payload) => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  if (!payload || typeof payload.locale !== 'string' || typeof payload.text !== 'string') throw new Error('A dictionary language and document text are required.');
  return dictionaryService.checkText(payload.locale, payload.text);
});

async function checkForUpdates({ quiet = false, force = false } = {}) {
  if (!updatePublishingConfigured) return { ok: false, message: 'Automatic updates will be available after the Brightdesk GitHub release repository is configured.' };
  if (!autoUpdater) return { ok: false, message: 'The update service is not configured for this build yet.' };
  const now = Date.now();
  if (updateCheckInProgress) return { ok: true, message: 'An update check is already running.' };
  if (!force && now - lastUpdateCheckAt < 5 * 60 * 1000) return { ok: true, message: 'The update service checked recently.' };
  updateCheckInProgress = true; lastUpdateCheckAt = now;
  try { await autoUpdater.checkForUpdates(); return { ok: true }; }
  catch (error) {
    if (!quiet) sendUpdateState({ status: 'error', message: error.message || 'Could not check for updates.' });
    return { ok: false, message: error.message || 'Could not check for updates.' };
  } finally { updateCheckInProgress = false; }
}
function initUpdater() {
  if (!app.isPackaged) return;
  if (!updatePublishingConfigured) {
    sendUpdateState({ status: 'unavailable', message: 'Automatic updates are not configured for this build yet.' });
    return;
  }
  if (process.platform === 'linux' && !process.env.APPIMAGE) {
    sendUpdateState({ status: 'external', message: 'For .deb installs, update Brightdesk with your Linux package manager or install the latest .deb.' });
    return;
  }
  try {
    ({ autoUpdater } = require('electron-updater'));
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowUnverifiedLinuxPackages = false;
    autoUpdater.on('checking-for-update', () => sendUpdateState({ status: 'checking', message: 'Checking for updates…' }));
    autoUpdater.on('update-available', info => sendUpdateState({ status: 'available', message: `Brightdesk ${info.version} is available. Downloading the suite and changed app modules automatically…` }));
    autoUpdater.on('update-not-available', () => sendUpdateState({ status: 'current', message: 'Brightdesk is up to date.' }));
    autoUpdater.on('download-progress', p => sendUpdateState({ status: 'downloading', message: `Downloading update: ${Math.round(p.percent)}%` }));
    autoUpdater.on('update-downloaded', info => sendUpdateState({ status: 'downloaded', message: `Brightdesk ${info.version} and its updated app modules are ready. Restart to apply the update.` }));
    autoUpdater.on('error', err => sendUpdateState({ status: 'error', message: err.message || 'Update check failed.' }));
    /* The suite installer contains the app modules. A suite release updates the shell and every changed module together. */
    setTimeout(() => checkForUpdates({ quiet: true, force: true }), 12000);
    setInterval(() => checkForUpdates({ quiet: true, force: true }), 6 * 60 * 60 * 1000);
  } catch (error) { sendUpdateState({ status: 'unavailable', message: 'Update service is not configured in this build.' }); }
}

ipcMain.handle('file:open', async event => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [{ name: 'Office files', extensions: ['docx','xlsx','xlsm','csv','tsv','pptx','txt','md','html','bdesk'] }, { name: 'All files', extensions: ['*'] }]
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return openOfficeFile(result.filePaths[0]);
});
ipcMain.handle('file:export', async (event, payload) => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  if (!payload || !['pages','sheets','slides','notes'].includes(payload.kind)) throw new Error('Unsupported export request.');
  const filters = {
    pages: [{ name: 'DOCX document', extensions: ['docx'] }, { name: 'HTML', extensions: ['html'] }],
    sheets: [{ name: 'XLSX workbook', extensions: ['xlsx'] }, { name: 'CSV', extensions: ['csv'] }],
    slides: [{ name: 'PPTX presentation', extensions: ['pptx'] }],
    notes: [{ name: 'Markdown', extensions: ['md'] }, { name: 'Text', extensions: ['txt'] }]
  }[payload.kind];
  const result = await dialog.showSaveDialog(mainWindow, { defaultPath: cleanFileName(payload.title), filters });
  if (result.canceled || !result.filePath) return { canceled: true };
  const filePath = ensureExtension(result.filePath, filters[0]?.extensions?.[0]);
  await exportOfficeFile(payload, filePath);
  return { canceled: false, filePath };
});
ipcMain.handle('project:save', async (event, project) => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  const result = await dialog.showSaveDialog(mainWindow, { defaultPath: cleanFileName(project?.title || 'Brightdesk project') + '.bdesk', filters: [{ name: 'Brightdesk project', extensions: ['bdesk'] }] });
  if (result.canceled || !result.filePath) return { canceled: true };
  const filePath = ensureExtension(result.filePath, 'bdesk');
  await exportOfficeFile({ project }, filePath); return { canceled: false, filePath };
});
ipcMain.handle('project:open', async event => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'], filters: [{ name: 'Brightdesk project', extensions: ['bdesk'] }] });
  if (result.canceled || !result.filePaths[0]) return null;
  return openOfficeFile(result.filePaths[0]);
});
ipcMain.handle('file:pdf', async (event, payload) => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  const result = await dialog.showSaveDialog(mainWindow, { defaultPath: cleanFileName(payload?.title || 'Brightdesk document') + '.pdf', filters: [{ name: 'PDF document', extensions: ['pdf'] }] });
  if (result.canceled || !result.filePath) return { canceled: true };
  const filePath = ensureExtension(result.filePath, 'pdf');
  const pdf = await mainWindow.webContents.printToPDF({ printBackground: true, pageSize: 'A4', margins: { top: 0.55, bottom: 0.55, left: 0.6, right: 0.6 } });
  await fs.writeFile(filePath, pdf); return { canceled: false, filePath };
});
ipcMain.handle('updates:check', async event => { if (!senderIsMain(event)) throw new Error('Invalid sender.'); return checkForUpdates({ force: true }); });
ipcMain.handle('updates:download', async event => { if (!senderIsMain(event)) throw new Error('Invalid sender.'); if (!autoUpdater) return { ok: false }; await autoUpdater.downloadUpdate(); return { ok: true }; });
ipcMain.handle('updates:install', async event => { if (!senderIsMain(event)) throw new Error('Invalid sender.'); if (!autoUpdater) return { ok: false }; autoUpdater.quitAndInstall(); return { ok: true }; });

app.whenReady().then(async () => { app.setName(packageConfig.productName || 'Brightdesk'); dictionaryService = new DictionaryService(app.getPath('userData')); Menu.setApplicationMenu(null); termsAccepted = await hasCurrentTermsAcceptance(); if (termsAccepted) { createWindow(); initUpdater(); } else { createAgreementWindow(); } app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) { if (termsAccepted) createWindow(); else createAgreementWindow(); } }); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
