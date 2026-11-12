'use strict';

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawn } = require('node:child_process');

const PRODUCT_MANIFEST = Object.freeze({
  pages: Object.freeze({ name: 'Pages', bundleId: 'org.brightdesk.pages', desktopFile: 'org.brightdesk.pages.desktop', iconAsset: 'pages.svg', startMenuShortcut: 'Brightdesk Pages.lnk' }),
  sheets: Object.freeze({ name: 'Sheets', bundleId: 'org.brightdesk.sheets', desktopFile: 'org.brightdesk.sheets.desktop', iconAsset: 'sheets.svg', startMenuShortcut: 'Brightdesk Sheets.lnk' }),
  slides: Object.freeze({ name: 'Decks', bundleId: 'org.brightdesk.slides', desktopFile: 'org.brightdesk.slides.desktop', iconAsset: 'decks.svg', startMenuShortcut: 'Brightdesk Decks.lnk' }),
  notes: Object.freeze({ name: 'Notes', bundleId: 'org.brightdesk.notes', desktopFile: 'org.brightdesk.notes.desktop', iconAsset: 'notes.svg', startMenuShortcut: 'Brightdesk Notes.lnk' }),
  database: Object.freeze({ name: 'Database', bundleId: 'org.brightdesk.database', desktopFile: 'org.brightdesk.database.desktop', iconAsset: 'database.svg', startMenuShortcut: 'Brightdesk Database.lnk' }),
  forms: Object.freeze({ name: 'Forms', bundleId: 'org.brightdesk.forms', desktopFile: 'org.brightdesk.forms.desktop', iconAsset: 'forms.svg', startMenuShortcut: 'Brightdesk Forms.lnk' }),
  lists: Object.freeze({ name: 'Lists', bundleId: 'org.brightdesk.lists', desktopFile: 'org.brightdesk.lists.desktop', iconAsset: 'lists.svg', startMenuShortcut: 'Brightdesk Lists.lnk' }),
  planner: Object.freeze({ name: 'Planner', bundleId: 'org.brightdesk.planner', desktopFile: 'org.brightdesk.planner.desktop', iconAsset: 'planner.svg', startMenuShortcut: 'Brightdesk Planner.lnk' }),
  todo: Object.freeze({ name: 'To Do', bundleId: 'org.brightdesk.todo', desktopFile: 'org.brightdesk.todo.desktop', iconAsset: 'to-do.svg', startMenuShortcut: 'Brightdesk To Do.lnk' }),
  loop: Object.freeze({ name: 'Workspace', bundleId: 'org.brightdesk.loop', desktopFile: 'org.brightdesk.loop.desktop', iconAsset: 'workspace.svg', startMenuShortcut: 'Brightdesk Workspace.lnk' })
});

function productNotInstalledError(entry, platform) {
  const guidance = platform === 'linux'
    ? 'Integrate its AppImage into your desktop menu or install its DEB package, then try again.'
    : 'Install it with its Brightdesk product installer, then try again.';
  const error = new Error(`Brightdesk ${entry.name} is not registered as an installed desktop application. ${guidance}`);
  error.code = 'PRODUCT_NOT_INSTALLED';
  return error;
}

function uniquePaths(values) {
  return [...new Set(values.filter(Boolean))];
}

function buildProductLaunchRequest(applicationId, options = {}) {
  const entry = PRODUCT_MANIFEST[applicationId];
  if (!entry) throw new Error('Unsupported Brightdesk product.');

  const platform = options.platform || process.platform;
  const env = options.env || process.env;
  const homeDir = options.homeDir || os.homedir();
  const exists = options.exists || fs.existsSync;

  if (platform === 'darwin') {
    return {
      command: 'open',
      args: ['-b', entry.bundleId],
      kind: 'macos-bundle'
    };
  }

  if (platform === 'win32') {
    const winPath = path.win32;
    const roaming = env.APPDATA || winPath.join(homeDir, 'AppData', 'Roaming');
    const common = env.ProgramData || env.PROGRAMDATA || 'C:\\ProgramData';
    const candidates = uniquePaths([
      winPath.join(roaming, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Brightdesk', entry.startMenuShortcut),
      winPath.join(common, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Brightdesk', entry.startMenuShortcut)
    ]);
    const shortcut = candidates.find(candidate => exists(candidate));
    if (!shortcut) throw productNotInstalledError(entry, platform);
    return {
      command: 'explorer.exe',
      args: [shortcut],
      kind: 'windows-shortcut'
    };
  }

  if (platform === 'linux') {
    const posixPath = path.posix;
    const dataHome = env.XDG_DATA_HOME || posixPath.join(homeDir, '.local', 'share');
    const applicationDirectories = uniquePaths([
      posixPath.join(dataHome, 'applications'),
      posixPath.join(homeDir, '.local', 'share', 'applications'),
      '/usr/local/share/applications',
      '/usr/share/applications'
    ]);
    const desktopFile = applicationDirectories
      .map(directory => posixPath.join(directory, entry.desktopFile))
      .find(candidate => exists(candidate));
    if (!desktopFile) throw productNotInstalledError(entry, platform);
    return {
      command: 'gio',
      args: ['launch', desktopFile],
      kind: 'linux-desktop-entry'
    };
  }

  throw new Error('Unsupported operating system for Brightdesk product launching.');
}

function launchProduct(applicationId, options = {}) {
  const request = buildProductLaunchRequest(applicationId, options);
  const spawnProcess = options.spawn || spawn;
  const entry = PRODUCT_MANIFEST[applicationId];

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (error) reject(error);
      else resolve(result);
    };

    const child = spawnProcess(request.command, request.args, {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
      shell: false
    });

    const timeout = setTimeout(() => {
      child.unref?.();
      finish(null, { ok: true, applicationId, kind: request.kind });
    }, 5000);
    timeout.unref?.();

    child.once('error', error => {
      finish(new Error(`Could not start Brightdesk ${entry.name}: ${error.message}`));
    });
    child.once('close', code => {
      if (code === 0) finish(null, { ok: true, applicationId, kind: request.kind });
      else finish(new Error(`The operating system could not open Brightdesk ${entry.name} (launcher exit code ${code}).`));
    });
  });
}

module.exports = { PRODUCT_MANIFEST, buildProductLaunchRequest, launchProduct };
