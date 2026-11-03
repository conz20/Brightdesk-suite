const { app, BrowserWindow, Menu, ipcMain, dialog, shell } = require('electron');
const packageConfig = require('../package.json');
const path = require('node:path');
const { spawn } = require('node:child_process');
const crypto = require('node:crypto');
const fs = require('node:fs/promises');
const { openOfficeFile, exportOfficeFile, cleanFileName, ensureExtension } = require('./file-service');
const { BUILTIN_LANGUAGES, validateLanguagePack, getBuiltinLanguage } = require('./language-service');
const { DictionaryService } = require('./dictionary-service');
const { registerStandaloneApp, listInstalledStandaloneApps } = require('./standalone-app-registry');
const { checkStandaloneAppUpdates, getStandaloneAppDownload, compareVersions } = require('./app-update-service');
const {
  stageStandaloneAppUpdate,
  listStagedStandaloneAppUpdates,
  removeStagedStandaloneAppUpdate
} = require('./standalone-update-manager');
let mainWindow;
let agreementWindow;
let termsAccepted = false;
let autoUpdater;
const updatePublishingConfigured = Array.isArray(packageConfig.build?.publish) && packageConfig.build.publish.some(item => item?.provider === 'github' && item?.owner && item.owner !== 'YOUR_GITHUB_ACCOUNT');
let updateCheckInProgress = false;
let lastUpdateCheckAt = 0;
let updateCheckTimer = null;
let updateCheckTimeout = null;
let standaloneUpdateTimer = null;
let standaloneUpdateTimeout = null;
let dictionaryService;
const supportedApplications = new Set(['pages', 'sheets', 'slides', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'loop']);
const applicationNames = { pages: 'Pages', sheets: 'Sheets', slides: 'Decks', notes: 'Notes', database: 'Database', forms: 'Forms', lists: 'Lists', planner: 'Planner', todo: 'To Do', loop: 'Workspace' };
const applicationId = packageConfig.brightdeskAppId || null;
if (applicationId && !supportedApplications.has(applicationId)) {
  throw new Error(`Unsupported Brightdesk application: ${applicationId}`);
}

const updateSettingsPath = path.join(app.getPath('userData'), 'update-settings.json');
const defaultUpdateSettings = { autoCheck: false, autoDownload: false, autoInstall: false };

async function readUpdateSettings() {
  try {
    const raw = await fs.readFile(updateSettingsPath, 'utf8');
    const parsed = JSON.parse(raw);
    return { ...defaultUpdateSettings, ...parsed };
  } catch (error) {
    if (error.code !== 'ENOENT') console.warn('Could not read Brightdesk update settings.', error);
    return { ...defaultUpdateSettings };
  }
}

async function writeUpdateSettings(settings = {}) {
  const next = { ...defaultUpdateSettings, ...(settings || {}), autoInstall: false };
  await fs.mkdir(app.getPath('userData'), { recursive: true });
  await fs.writeFile(updateSettingsPath, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
  return next;
}

function sendUpdateState(state) { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('updates:state', state); }
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440, height: 920, minWidth: 980, minHeight: 680,
    title: applicationId ? `Brightdesk ${applicationNames[applicationId]}` : 'Brightdesk', backgroundColor: '#f5f6fa',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, additionalArguments: applicationId ? [`--brightdesk-app=${applicationId}`] : [] }
  });
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.on('will-navigate', event => event.preventDefault());
  mainWindow.on('focus', async () => {
    if (!autoUpdater) return;
    const settings = await readUpdateSettings();
    if (settings.autoCheck === true) checkForUpdates({ quiet: true, force: true });
  });
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

async function stageStandaloneApp(appId) {
  const download = await getStandaloneAppDownload({ appId, platform: process.platform });
  return stageStandaloneAppUpdate({
    appDataPath: app.getPath('appData'),
    ...download,
    platform: process.platform
  });
}

async function refreshStandaloneAppUpdates({ notify = true } = {}) {
  const installedApps = await listInstalledStandaloneApps({ appDataPath: app.getPath('appData') });
  const result = await checkStandaloneAppUpdates({ installedApps, platform: process.platform });
  if (!result.ok) return { ...result, stagedApps: await listStagedStandaloneAppUpdates({ appDataPath: app.getPath('appData') }) };

  const settings = await readUpdateSettings();
  let stagedApps = await listStagedStandaloneAppUpdates({ appDataPath: app.getPath('appData') });
  const available = result.apps.filter(item => item.updateAvailable);

  if (settings.autoDownload === true) {
    for (const update of available) {
      const alreadyStaged = stagedApps.some(item => item.appId === update.id && item.version === update.availableVersion);
      if (alreadyStaged) continue;
      try {
        await stageStandaloneApp(update.id);
      } catch (error) {
        console.warn(`Could not automatically download Brightdesk ${update.name} update.`, error);
      }
    }
    stagedApps = await listStagedStandaloneAppUpdates({ appDataPath: app.getPath('appData') });
  }

  const allAvailableUpdatesStaged = available.length > 0 &&
    available.every(update => stagedApps.some(item => item.appId === update.id && item.version === update.availableVersion));
  const response = { ...result, stagedApps };
  if (notify && available.length && !applicationId && mainWindow && !mainWindow.isDestroyed()) {
    sendUpdateState({
      status: allAvailableUpdatesStaged ? 'apps-downloaded' : 'apps-available',
      releaseVersion: result.releaseVersion,
      apps: result.apps,
      stagedApps,
      message: allAvailableUpdatesStaged
        ? `${available.length} standalone app update${available.length === 1 ? '' : 's'} downloaded. Press Next when ready to install.`
        : `${available.length} standalone app update${available.length === 1 ? '' : 's'} available.`
    });
  }
  return response;
}

async function checkInstalledStandaloneUpdates() {
  if (applicationId || !mainWindow || mainWindow.isDestroyed()) return;
  try {
    await refreshStandaloneAppUpdates();
  } catch (error) {
    console.warn('Automatic standalone app update check failed.', error);
  }
}

function configureStandaloneUpdateSchedule(settings) {
  if (standaloneUpdateTimeout) clearTimeout(standaloneUpdateTimeout);
  if (standaloneUpdateTimer) clearInterval(standaloneUpdateTimer);
  standaloneUpdateTimeout = null;
  standaloneUpdateTimer = null;
  if (applicationId || settings?.autoCheck !== true) return;
  standaloneUpdateTimeout = setTimeout(() => checkInstalledStandaloneUpdates(), 15000);
  standaloneUpdateTimer = setInterval(() => checkInstalledStandaloneUpdates(), 6 * 60 * 60 * 1000);
}

function configureUpdateSchedule(settings) {
  if (updateCheckTimeout) clearTimeout(updateCheckTimeout);
  if (updateCheckTimer) clearInterval(updateCheckTimer);
  updateCheckTimeout = null;
  updateCheckTimer = null;
  if (settings?.autoCheck !== true || !autoUpdater) return;
  updateCheckTimeout = setTimeout(() => checkForUpdates({ quiet: true, force: true }), 12000);
  updateCheckTimer = setInterval(() => checkForUpdates({ quiet: true, force: true }), 6 * 60 * 60 * 1000);
}

async function initUpdater() {
  if (!app.isPackaged) return;
  const settings = await readUpdateSettings();
  configureStandaloneUpdateSchedule(settings);
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
    autoUpdater.autoDownload = settings.autoDownload !== false;
    // Downloading may be automatic, but installing always requires the user's explicit Next action.
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.allowUnverifiedLinuxPackages = false;
    autoUpdater.on('checking-for-update', () => sendUpdateState({ status: 'checking', message: 'Checking for updates…' }));
    autoUpdater.on('update-available', info => sendUpdateState({
      status: 'available', currentVersion: app.getVersion(), availableVersion: info.version,
      message: `A Brightdesk update is available: ${app.getVersion()} → ${info.version}.`
    }));
    autoUpdater.on('update-not-available', () => sendUpdateState({ status: 'current', currentVersion: app.getVersion(), message: `Brightdesk ${app.getVersion()} is up to date.` }));
    autoUpdater.on('download-progress', p => sendUpdateState({ status: 'downloading', currentVersion: app.getVersion(), message: `Downloading update: ${Math.round(p.percent)}%` }));
    autoUpdater.on('update-downloaded', info => sendUpdateState({
      status: 'downloaded', currentVersion: app.getVersion(), availableVersion: info.version,
      message: `Update ready: ${app.getVersion()} → ${info.version}. Press Next when you are ready to install it.`
    }));
    autoUpdater.on('error', err => sendUpdateState({ status: 'error', message: err.message || 'Update check failed.' }));
    configureUpdateSchedule(settings);
    if (settings.autoCheck !== true) {
      sendUpdateState({ status: 'manual', message: 'Automatic update checks are off. You can still check manually when you want.' });
    }
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
ipcMain.handle('apps:list-installed', async event => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  return listInstalledStandaloneApps({ appDataPath: app.getPath('appData') });
});
ipcMain.handle('apps:check-updates', async event => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  return refreshStandaloneAppUpdates({ notify: false });
});
ipcMain.handle('apps:list-staged-updates', async event => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  return listStagedStandaloneAppUpdates({ appDataPath: app.getPath('appData') });
});
ipcMain.handle('apps:download-update', async (event, appId) => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  if (!supportedApplications.has(appId)) throw new Error('That Brightdesk application is not in the approved app catalogue.');
  return stageStandaloneApp(appId);
});
ipcMain.handle('apps:install-staged-update', async (event, appId) => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  if (!supportedApplications.has(appId)) throw new Error('That Brightdesk application is not in the approved app catalogue.');
  const installedApps = await listInstalledStandaloneApps({ appDataPath: app.getPath('appData') });
  const installed = installedApps.find(item => item.id === appId);
  const stagedApps = await listStagedStandaloneAppUpdates({ appDataPath: app.getPath('appData') });
  const staged = stagedApps.find(item => item.appId === appId);
  if (!staged) throw new Error('There is no verified installer ready for this app.');
  if (installed && compareVersions(staged.version, installed.version) <= 0) {
    await removeStagedStandaloneAppUpdate({ appDataPath: app.getPath('appData'), appId });
    throw new Error('This app is already at the staged version or newer. The old installer was removed.');
  }
  const fileRoot = path.resolve(app.getPath('appData'), 'Brightdesk', 'updates', appId);
  const filePath = path.resolve(staged.filePath);
  if (!filePath.startsWith(fileRoot + path.sep)) throw new Error('The staged installer path is invalid.');
  const stat = await fs.stat(filePath);
  if (!stat.isFile() || stat.size !== staged.size) throw new Error('The staged installer file is missing or has changed.');
  const hash = crypto.createHash('sha256');
  const fileStream = require('node:fs').createReadStream(filePath);
  for await (const chunk of fileStream) hash.update(chunk);
  if (hash.digest('hex') !== staged.sha256) throw new Error('The staged installer failed its SHA-256 check.');
  const openError = await shell.openPath(filePath);
  if (openError) throw new Error(`Could not open the installer: ${openError}`);
  return { ok: true, appId, version: staged.version };
});

function launchStandaloneExecutable(record) {
  return new Promise((resolve, reject) => {
    let command = record.executablePath;
    let args = [];
    if (record.platform === 'darwin') {
      const marker = `/Contents/MacOS/`;
      const markerIndex = command.indexOf(marker);
      if (markerIndex >= 0) {
        const appBundle = command.slice(0, markerIndex);
        command = 'open';
        args = ['-a', appBundle];
      }
    }
    const child = spawn(command, args, {
      detached: true,
      stdio: 'ignore',
      cwd: path.dirname(record.executablePath)
    });
    child.once('error', reject);
    child.once('spawn', () => {
      child.unref();
      resolve();
    });
  });
}

ipcMain.handle('apps:launch-standalone', async (event, appId) => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  if (!supportedApplications.has(appId)) throw new Error('That Brightdesk application is not in the approved app catalogue.');
  const installed = await listInstalledStandaloneApps({ appDataPath: app.getPath('appData') });
  const record = installed.find(item => item.id === appId);
  if (!record) {
    throw new Error('This standalone app is not registered on this computer yet. Open it once from its desktop icon, then return to Brightdesk.');
  }
  await launchStandaloneExecutable(record);
  return { ok: true, appId };
});

ipcMain.handle('apps:downloads', async (event, appId) => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  if (!supportedApplications.has(appId)) throw new Error('That Brightdesk application is not in the approved app catalogue.');
  const download = await getStandaloneAppDownload({ appId, platform: process.platform });
  await shell.openExternal(download.downloadUrl);
  return { ok: true, appId, appName: applicationNames[appId], version: download.version, fileName: download.fileName };
});

ipcMain.handle('updates:check', async event => { if (!senderIsMain(event)) throw new Error('Invalid sender.'); return checkForUpdates({ force: true }); });
ipcMain.handle('updates:download', async event => { if (!senderIsMain(event)) throw new Error('Invalid sender.'); if (!autoUpdater) return { ok: false }; await autoUpdater.downloadUpdate(); return { ok: true }; });
ipcMain.handle('updates:install', async event => { if (!senderIsMain(event)) throw new Error('Invalid sender.'); if (!autoUpdater) return { ok: false }; autoUpdater.quitAndInstall(); return { ok: true }; });
ipcMain.handle('updates:settings', async event => { if (!senderIsMain(event)) throw new Error('Invalid sender.'); return readUpdateSettings(); });
ipcMain.handle('updates:set-settings', async (event, payload) => {
  if (!senderIsMain(event)) throw new Error('Invalid sender.');
  const settings = await writeUpdateSettings(payload);
  configureStandaloneUpdateSchedule(settings);
  if (autoUpdater) {
    autoUpdater.autoDownload = settings.autoDownload !== false;
    autoUpdater.autoInstallOnAppQuit = false;
    configureUpdateSchedule(settings);
  }
  return settings;
});

app.whenReady().then(async () => {
  app.setName(packageConfig.productName || 'Brightdesk');
  dictionaryService = new DictionaryService(app.getPath('userData'));
  if (applicationId && app.isPackaged) {
    try {
      await registerStandaloneApp({
        appDataPath: app.getPath('appData'),
        appId: applicationId,
        version: app.getVersion(),
        executablePath: app.getPath('exe'),
        platform: process.platform
      });
      const stagedUpdates = await listStagedStandaloneAppUpdates({ appDataPath: app.getPath('appData') });
      for (const staged of stagedUpdates) {
        if (staged.appId === applicationId && compareVersions(app.getVersion(), staged.version) >= 0) {
          await removeStagedStandaloneAppUpdate({ appDataPath: app.getPath('appData'), appId: applicationId });
        }
      }
    } catch (error) {
      console.warn('The standalone Brightdesk app could not register with the suite launcher.', error);
    }
  }
  Menu.setApplicationMenu(null);
  termsAccepted = await hasCurrentTermsAcceptance();
  if (termsAccepted) { createWindow(); initUpdater(); }
  else createAgreementWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      if (termsAccepted) createWindow();
      else createAgreementWindow();
    }
  });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

