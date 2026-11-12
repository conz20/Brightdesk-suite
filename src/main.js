const { app, BrowserWindow, Menu, ipcMain, dialog, Notification } = require('electron');
const packageConfig = require('../package.json');
const nativeEngine = require('./rust-engine');
const { assertPackagedVersion, assertMainWindowReady } = require('./startup-smoke');
const path = require('node:path');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const { openOfficeFile, exportOfficeFile, cleanFileName, ensureExtension } = require('./file-service');
const { BUILTIN_LANGUAGES, validateLanguagePack, getBuiltinLanguage } = require('./language-service');
const { DictionaryService } = require('./dictionary-service');
const { DEFAULT_UPDATE_SETTINGS, normalizeUpdateSettings, getUpdaterPreferences } = require('./update-policy');
const { shouldRequireFirstLaunchTerms } = require('./installer-terms-policy');
const { launchProduct, PRODUCT_MANIFEST } = require('./product-launcher');
let mainWindow;
let agreementWindow;
let termsAccepted = false;
let autoUpdater;
const updatePublishingConfigured = Array.isArray(packageConfig.build?.publish) && packageConfig.build.publish.some(item => item?.provider === 'github' && item?.owner && item.owner !== 'YOUR_GITHUB_ACCOUNT');
let updateCheckInProgress = false;
let lastUpdateCheckAt = 0;
let updateCheckTimeout = null;
let updateCheckInterval = null;
let automaticUpdateChecksEnabled = DEFAULT_UPDATE_SETTINGS.autoCheck;
let dictionaryService;
const supportedApplications = new Set(Object.keys(PRODUCT_MANIFEST));
const applicationId = packageConfig.brightdeskAppId || null;
if (applicationId && !supportedApplications.has(applicationId)) {
  throw new Error(`Unsupported Brightdesk application: ${applicationId}`);
}
const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const target = mainWindow && !mainWindow.isDestroyed()
      ? mainWindow
      : (agreementWindow && !agreementWindow.isDestroyed() ? agreementWindow : null);
    if (!target) return;
    if (target.isMinimized()) target.restore();
    target.show();
    target.focus();
  });
}

const updateSettingsPath = path.join(app.getPath('userData'), 'update-settings.json');
const defaultUpdateSettings = DEFAULT_UPDATE_SETTINGS;

async function readUpdateSettings() {
  try {
    const raw = await fs.readFile(updateSettingsPath, 'utf8');
    const parsed = JSON.parse(raw);
    return normalizeUpdateSettings(parsed);
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn('Could not read Brightdesk update settings.', error);
    return normalizeUpdateSettings();
  }
}

async function writeUpdateSettings(settings = {}) {
  const next = normalizeUpdateSettings(settings);
  await fs.mkdir(app.getPath('userData'), { recursive: true });
  await fs.writeFile(updateSettingsPath, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
  return next;
}

function sendUpdateState(state) {
  BrowserWindow.getAllWindows().forEach(window => { if (!window.isDestroyed()) window.webContents.send('updates:state', state); });
  if (!['available', 'downloaded'].includes(state?.status) || (mainWindow && !mainWindow.isDestroyed() && mainWindow.isFocused()) || !Notification.isSupported()) return;
  const title = state.status === 'available' ? 'Brightdesk update available' : 'Brightdesk update ready';
  const notification = new Notification({ title, body: state.message || 'A Brightdesk Office Suite update is ready.', silent: false });
  notification.on('click', () => {
    const target = mainWindow && !mainWindow.isDestroyed() ? mainWindow : BrowserWindow.getAllWindows()[0];
    if (!target || target.isDestroyed()) return;
    if (target.isMinimized()) target.restore();
    target.show();
    target.focus();
  });
  notification.show();
}
function createWindow({ show = true } = {}) {
  mainWindow = new BrowserWindow({
    width: 1440, height: 920, minWidth: 980, minHeight: 680, show,
    title: applicationId ? `Brightdesk ${PRODUCT_MANIFEST[applicationId].name}` : 'Brightdesk Office Suite',
    icon: applicationId ? path.join(__dirname, 'assets', 'icons', PRODUCT_MANIFEST[applicationId].iconAsset) : undefined,
    backgroundColor: '#f5f6fa',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, additionalArguments: applicationId ? [`--brightdesk-app=${applicationId}`] : [] }
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', event => event.preventDefault());
  mainWindow.on('focus', () => { if (autoUpdater && automaticUpdateChecksEnabled) checkForUpdates({ quiet: true }); });
  return mainWindow.loadFile(path.join(__dirname, 'index.html'));
}
function senderIsMain(event) {
  return Boolean(mainWindow && !mainWindow.isDestroyed() && event.sender === mainWindow.webContents);
}
ipcMain.handle('apps:open', async (event, requestedApplicationId) => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  if (!supportedApplications.has(requestedApplicationId)) throw new Error('Unsupported Brightdesk application.');
  return launchProduct(requestedApplicationId, {
    platform: process.platform,
    env: process.env,
    homeDir: app.getPath('home')
  });
});
ipcMain.handle('native:engine-info', event => {
  if (!senderIsMain(event)) throw new Error('Unauthorized native engine request.');
  return nativeEngine.engineInfo();
});

ipcMain.handle('native:chunk-source', (event, source, maxBytes) => {
  if (!senderIsMain(event)) throw new Error('Unauthorized native engine request.');
  if (typeof source !== 'string') throw new TypeError('Source text must be a string.');
  return nativeEngine.chunkSource(source, maxBytes);
});
ipcMain.handle('native:analyze-source', (event, source) => {
  if (!senderIsMain(event)) throw new Error('Unauthorized native engine request.');
  if (typeof source !== 'string') throw new TypeError('Source text must be a string.');
  return nativeEngine.analyzeSource(source);
});
ipcMain.handle('native:normalize-embedding', (event, values) => {
  if (!senderIsMain(event)) throw new Error('Unauthorized native engine request.');
  return nativeEngine.normalizeEmbedding(values);
});
ipcMain.handle('native:cosine-similarity', (event, left, right) => {
  if (!senderIsMain(event)) throw new Error('Unauthorized native engine request.');
  return nativeEngine.cosineSimilarity(left, right);
});
ipcMain.handle('native:rank-embeddings', (event, query, candidates, limit) => {
  if (!senderIsMain(event)) throw new Error('Unauthorized native engine request.');
  return nativeEngine.rankEmbeddings(query, candidates, limit);
});

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
ipcMain.on('app:version-sync', event => { event.returnValue = app.getVersion(); });
ipcMain.handle('app:version', event => { if (!senderIsMain(event)) throw new Error('Invalid sender.'); return app.getVersion(); });

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
  const session = event.sender.session;
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
  const session = event.sender.session;
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

function configureAutomaticUpdateChecks(enabled) {
  automaticUpdateChecksEnabled = enabled === true;
  if (updateCheckTimeout) clearTimeout(updateCheckTimeout);
  if (updateCheckInterval) clearInterval(updateCheckInterval);
  updateCheckTimeout = null;
  updateCheckInterval = null;
  if (!autoUpdater) return;
  if (!automaticUpdateChecksEnabled) {
    sendUpdateState({ status: 'manual', message: 'Automatic update checks are off. You can still check manually when you want.' });
    return;
  }
  updateCheckTimeout = setTimeout(() => checkForUpdates({ quiet: true, force: true }), 12000);
  updateCheckInterval = setInterval(() => checkForUpdates({ quiet: true, force: true }), 6 * 60 * 60 * 1000);
}

async function initUpdater() {
  if (!app.isPackaged) return;
  const settings = await readUpdateSettings();
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
    Object.assign(autoUpdater, getUpdaterPreferences());
    autoUpdater.allowUnverifiedLinuxPackages = false;
    autoUpdater.on('checking-for-update', () => sendUpdateState({ status: 'checking', message: 'Checking for updates…' }));
    autoUpdater.on('update-available', info => sendUpdateState({ status: 'available', message: `Brightdesk ${info.version} is available to download.` }));
    autoUpdater.on('update-not-available', () => sendUpdateState({ status: 'current', message: 'Brightdesk is up to date.' }));
    autoUpdater.on('download-progress', p => sendUpdateState({ status: 'downloading', message: `Downloading update: ${Math.round(p.percent)}%` }));
    autoUpdater.on('update-downloaded', info => sendUpdateState({ status: 'downloaded', message: `Brightdesk ${info.version} has downloaded and is ready to install when you are ready.` }));
    autoUpdater.on('error', err => sendUpdateState({ status: 'error', message: err.message || 'Update check failed.' }));
    configureAutomaticUpdateChecks(settings.autoCheck !== false);
  } catch (error) { sendUpdateState({ status: 'unavailable', message: 'Update service is not configured in this build.' }); }
}

ipcMain.handle('file:open', async event => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), {
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
  const result = await dialog.showSaveDialog(BrowserWindow.fromWebContents(event.sender), { defaultPath: cleanFileName(payload.title), filters });
  if (result.canceled || !result.filePath) return { canceled: true };
  const filePath = ensureExtension(result.filePath, filters[0]?.extensions?.[0]);
  await exportOfficeFile(payload, filePath);
  return { canceled: false, filePath };
});
ipcMain.handle('project:save', async (event, project) => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  const result = await dialog.showSaveDialog(BrowserWindow.fromWebContents(event.sender), { defaultPath: cleanFileName(project?.title || 'Brightdesk project') + '.bdesk', filters: [{ name: 'Brightdesk project', extensions: ['bdesk'] }] });
  if (result.canceled || !result.filePath) return { canceled: true };
  const filePath = ensureExtension(result.filePath, 'bdesk');
  await exportOfficeFile({ project }, filePath); return { canceled: false, filePath };
});
ipcMain.handle('project:open', async event => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  const result = await dialog.showOpenDialog(BrowserWindow.fromWebContents(event.sender), { properties: ['openFile'], filters: [{ name: 'Brightdesk project', extensions: ['bdesk'] }] });
  if (result.canceled || !result.filePaths[0]) return null;
  return openOfficeFile(result.filePaths[0]);
});
ipcMain.handle('file:pdf', async (event, payload) => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  const result = await dialog.showSaveDialog(BrowserWindow.fromWebContents(event.sender), { defaultPath: cleanFileName(payload?.title || 'Brightdesk document') + '.pdf', filters: [{ name: 'PDF document', extensions: ['pdf'] }] });
  if (result.canceled || !result.filePath) return { canceled: true };
  const filePath = ensureExtension(result.filePath, 'pdf');
  const pdf = await event.sender.printToPDF({ printBackground: true, pageSize: 'A4', margins: { top: 0.55, bottom: 0.55, left: 0.6, right: 0.6 } });
  await fs.writeFile(filePath, pdf); return { canceled: false, filePath };
});
ipcMain.handle('updates:check', async event => { if (!senderIsMain(event)) throw new Error('Invalid sender.'); return checkForUpdates({ force: true }); });
ipcMain.handle('updates:download', async event => { if (!senderIsMain(event)) throw new Error('Invalid sender.'); if (!autoUpdater) return { ok: false }; await autoUpdater.downloadUpdate(); return { ok: true }; });
ipcMain.handle('updates:install', async event => { if (!senderIsMain(event)) throw new Error('Invalid sender.'); if (!autoUpdater) return { ok: false }; autoUpdater.quitAndInstall(); return { ok: true }; });
ipcMain.handle('updates:settings', async event => { if (!senderIsMain(event)) throw new Error('Invalid sender.'); return readUpdateSettings(); });
ipcMain.handle('updates:set-settings', async (event, payload) => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  const settings = await writeUpdateSettings(payload);
  configureAutomaticUpdateChecks(settings.autoCheck);
  if (autoUpdater) {
    Object.assign(autoUpdater, getUpdaterPreferences());
  }
  return settings;
});

async function runPackagedStartupSmokeTest() {
  try {
    assertPackagedVersion(app.getVersion(), packageConfig.version);
    await readTerms();
    await readBundledLanguagePack('en-AU');
    await createWindow({ show: false });
    const startupState = await mainWindow.webContents.executeJavaScript(`({
      title: document.title,
      hasSidebar: Boolean(document.querySelector('.sidebar')),
      hasAppManager: Boolean(document.querySelector('#app-manager')),
      hasLanguageManager: Boolean(document.querySelector('#language-manager'))
    })`);
    assertMainWindowReady(startupState);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy();
    app.exit(0);
  } catch (error) {
    console.error('Brightdesk packaged startup smoke test failed:', error.message);
    if (mainWindow && !mainWindow.isDestroyed()) mainWindow.destroy();
    app.exit(1);
  }
}

app.whenReady().then(async () => {
  if (!hasSingleInstanceLock) return;
  app.setName(packageConfig.productName || packageConfig.build?.productName || (applicationId ? `Brightdesk ${PRODUCT_MANIFEST[applicationId].name}` : 'Brightdesk Office Suite'));
  if (process.platform === 'win32') app.setAppUserModelId(applicationId ? `org.brightdesk.${applicationId}` : 'org.brightdesk.suite');
  dictionaryService = new DictionaryService(app.getPath('userData'));
  Menu.setApplicationMenu(null);
  if (process.env.BRIGHTDESK_STARTUP_SMOKE_TEST === '1') {
    await runPackagedStartupSmokeTest();
    return;
  }
  const requireFirstLaunchTerms = shouldRequireFirstLaunchTerms({ platform: process.platform, isPackaged: app.isPackaged });
  termsAccepted = requireFirstLaunchTerms ? await hasCurrentTermsAcceptance() : true;
  if (termsAccepted) { createWindow(); initUpdater(); } else { createAgreementWindow(); }
  app.on('activate', () => {
    if (!mainWindow || mainWindow.isDestroyed()) {
      if (termsAccepted) createWindow(); else createAgreementWindow();
    }
  });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

