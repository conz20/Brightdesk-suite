'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');

const executeFile = promisify(execFile);
const APP_NAMES = Object.freeze({
  pages: 'Pages',
  sheets: 'Sheets',
  slides: 'Decks',
  notes: 'Notes',
  database: 'Database',
  forms: 'Forms',
  lists: 'Lists',
  planner: 'Planner',
  todo: 'To Do',
  loop: 'Workspace'
});
const VERSION_RE = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

async function runSystemCommand(command, args) {
  const result = await executeFile(command, args, {
    timeout: 4000,
    windowsHide: true,
    maxBuffer: 1024 * 1024
  });
  return String(result.stdout || '').trim();
}

function normaliseVersion(value) {
  const version = String(value || '').trim().replace(/^v/i, '');
  return VERSION_RE.test(version) ? version : 'unknown';
}

function readXmlPlistValue(plist, key) {
  const pattern = new RegExp('<key>\\s*' + key + '\\s*</key>\\s*<string>([^<]*)</string>', 'i');
  const match = String(plist || '').match(pattern);
  return match ? match[1].trim() : '';
}

function parseDesktopEntry(source) {
  const values = {};
  for (const line of String(source || '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('[')) continue;
    const separator = trimmed.indexOf('=');
    if (separator < 1) continue;
    const key = trimmed.slice(0, separator);
    if (!Object.hasOwn(values, key)) values[key] = trimmed.slice(separator + 1);
  }
  return values;
}

function parseDesktopCommand(execValue) {
  const value = String(execValue || '').trim();
  if (!value) return '';
  const quoted = value.match(/^"((?:\\.|[^"])*)"/);
  const first = quoted ? quoted[1] : value.split(/\s+/)[0];
  return first
    .replace(/\\s/g, ' ')
    .replace(/\\\\/g, '\\')
    .replace(/\\:/g, ':');
}

function parseRegistryValue(output, name) {
  for (const line of String(output || '').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed.toLowerCase().startsWith(name.toLowerCase() + ' ')) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length < 3) return '';
    return parts.slice(2).join(' ').trim();
  }
  return '';
}

function parseDisplayIcon(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('"')) return trimmed.match(/^"([^"]+)"/)?.[1] || '';
  return trimmed.replace(/,\s*\d+$/, '');
}

async function pathExists(filePath) {
  if (typeof filePath !== 'string' || !path.isAbsolute(filePath)) return false;
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function createRecord(id, version, executablePath, platform) {
  return {
    id,
    version: normaliseVersion(version),
    executablePath,
    platform,
    registeredAt: new Date().toISOString(),
    source: 'system-discovery'
  };
}

async function discoverMacApps(options) {
  const roots = options.searchDirectories?.macApplications || [
    '/Applications',
    path.join(options.homeDirectory, 'Applications')
  ];
  const installed = [];
  for (const [id, name] of Object.entries(APP_NAMES)) {
    const bundleName = 'Brightdesk ' + name + '.app';
    for (const root of roots) {
      const bundlePath = path.join(root, bundleName);
      try {
        const stat = await fs.stat(bundlePath);
        if (!stat.isDirectory()) continue;
        const plistPath = path.join(bundlePath, 'Contents', 'Info.plist');
        let plist = '';
        try {
          plist = await fs.readFile(plistPath, 'utf8');
        } catch {
          try {
            plist = await options.runCommand('plutil', ['-convert', 'xml1', '-o', '-', plistPath]);
          } catch {
            continue;
          }
        }
        const executableName = readXmlPlistValue(plist, 'CFBundleExecutable') || 'Brightdesk ' + name;
        const executablePath = path.join(bundlePath, 'Contents', 'MacOS', executableName);
        if (!await pathExists(executablePath)) continue;
        const version = readXmlPlistValue(plist, 'CFBundleShortVersionString') ||
          readXmlPlistValue(plist, 'CFBundleVersion');
        installed.push(createRecord(id, version, bundlePath, 'darwin'));
        break;
      } catch {
        continue;
      }
    }
  }
  return installed;
}

async function discoverWindowsApps(options) {
  const roots = options.searchDirectories?.windowsInstallRoots || [
    options.environment.LOCALAPPDATA && path.join(options.environment.LOCALAPPDATA, 'Programs'),
    options.environment.ProgramFiles,
    options.environment['ProgramFiles(x86)']
  ].filter(Boolean);
  const installed = [];
  const found = new Set();

  for (const [id, name] of Object.entries(APP_NAMES)) {
    const productName = 'Brightdesk ' + name;
    const executableName = productName + '.exe';
    for (const root of roots) {
      const candidates = [
        path.join(root, productName, executableName),
        path.join(root, executableName)
      ];
      for (const executablePath of candidates) {
        if (!await pathExists(executablePath)) continue;
        installed.push(createRecord(id, 'unknown', executablePath, 'win32'));
        found.add(id);
        break;
      }
      if (found.has(id)) break;
    }
  }

  const uninstallRoots = [
    'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
    'HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall',
    'HKLM\\Software\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall'
  ];
  for (const [id, name] of Object.entries(APP_NAMES)) {
    if (found.has(id)) continue;
    const expectedName = 'Brightdesk ' + name;
    for (const uninstallRoot of uninstallRoots) {
      let keys = '';
      try {
        keys = await options.runCommand('reg.exe', ['query', uninstallRoot, '/s', '/f', expectedName]);
      } catch {
        continue;
      }
      const keyPaths = String(keys).split(/\r?\n/).map(line => line.trim())
        .filter(line => /^HKEY_(?:CURRENT_USER|LOCAL_MACHINE)\\/i.test(line));
      for (const keyPath of keyPaths) {
        let values = '';
        try {
          values = await options.runCommand('reg.exe', ['query', keyPath]);
        } catch {
          continue;
        }
        const displayName = parseRegistryValue(values, 'DisplayName');
        if (displayName.toLowerCase() !== expectedName.toLowerCase()) continue;
        const iconPath = parseDisplayIcon(parseRegistryValue(values, 'DisplayIcon'));
        const installLocation = parseRegistryValue(values, 'InstallLocation');
        const candidates = [
          iconPath,
          installLocation && path.join(installLocation, expectedName + '.exe')
        ].filter(Boolean);
        for (const executablePath of candidates) {
          if (!await pathExists(executablePath)) continue;
          const version = parseRegistryValue(values, 'DisplayVersion');
          installed.push(createRecord(id, version, executablePath, 'win32'));
          found.add(id);
          break;
        }
        if (found.has(id)) break;
      }
      if (found.has(id)) break;
    }
  }
  return installed;
}

async function resolveLinuxExecutable(command, id, runCommand) {
  const expectedCommand = 'brightdesk-' + id;
  if (!command || path.basename(command) !== expectedCommand) return '';
  if (path.isAbsolute(command)) return await pathExists(command) ? command : '';
  try {
    const resolved = String(await runCommand('which', [expectedCommand])).trim().split(/\r?\n/)[0];
    return await pathExists(resolved) ? resolved : '';
  } catch {
    return '';
  }
}

async function getDebianPackageVersion(id, runCommand) {
  try {
    const output = String(await runCommand('dpkg-query', ['-W', 'brightdesk-' + id])).trim();
    const columns = output.split(/\s+/);
    return columns.length > 1 ? columns[1] : 'unknown';
  } catch {
    return 'unknown';
  }
}

async function discoverLinuxApps(options) {
  const desktopDirectories = options.searchDirectories?.linuxDesktopDirectories || [
    '/usr/share/applications',
    '/usr/local/share/applications',
    path.join(options.homeDirectory, '.local', 'share', 'applications')
  ];
  const installed = [];
  const found = new Set();

  for (const directory of desktopDirectories) {
    let entries = [];
    try {
      entries = await fs.readdir(directory);
    } catch {
      continue;
    }
    for (const fileName of entries.filter(name => name.endsWith('.desktop'))) {
      let values;
      try {
        values = parseDesktopEntry(await fs.readFile(path.join(directory, fileName), 'utf8'));
      } catch {
        continue;
      }
      for (const [id, name] of Object.entries(APP_NAMES)) {
        if (found.has(id) || String(values.Name || '').trim() !== 'Brightdesk ' + name) continue;
        const command = parseDesktopCommand(values.Exec);
        const executablePath = await resolveLinuxExecutable(command, id, options.runCommand);
        if (!executablePath) continue;
        const version = values['X-Brightdesk-Version'] || await getDebianPackageVersion(id, options.runCommand);
        installed.push(createRecord(id, version, executablePath, 'linux'));
        found.add(id);
      }
    }
  }

  for (const [id] of Object.entries(APP_NAMES)) {
    if (found.has(id)) continue;
    const executablePath = await resolveLinuxExecutable('brightdesk-' + id, id, options.runCommand);
    if (!executablePath) continue;
    const version = await getDebianPackageVersion(id, options.runCommand);
    installed.push(createRecord(id, version, executablePath, 'linux'));
  }
  return installed;
}

async function discoverStandaloneApps({
  platform = process.platform,
  homeDirectory = os.homedir(),
  environment = process.env,
  searchDirectories,
  runCommand = runSystemCommand
} = {}) {
  const options = { homeDirectory, environment, searchDirectories, runCommand };
  if (platform === 'darwin') return discoverMacApps(options);
  if (platform === 'win32') return discoverWindowsApps(options);
  if (platform === 'linux') return discoverLinuxApps(options);
  throw new TypeError('Brightdesk standalone app discovery does not support ' + platform + '.');
}

module.exports = {
  APP_NAMES,
  parseDesktopEntry,
  parseDesktopCommand,
  parseRegistryValue,
  discoverStandaloneApps
};
