'use strict';

const path = require('node:path');

const appId = process.env.BRIGHTDESK_APP_ID;
const appNames = { pages: 'Pages', sheets: 'Sheets', slides: 'Decks', notes: 'Notes' };

if (!Object.prototype.hasOwnProperty.call(appNames, appId)) {
  throw new Error('BRIGHTDESK_APP_ID must be one of: pages, sheets, slides, notes.');
}

const artifactSuffix = '-${version}-${arch}.${ext}';

module.exports = {
  appId: 'org.brightdesk.' + appId,
  productName: 'Brightdesk ' + appNames[appId],
  extraMetadata: { brightdeskAppId: appId },
  asar: true,
  files: ['src/**/*', 'package.json', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'TERMS_AND_CONDITIONS.txt'],
  directories: { output: path.join('release', appId) },
  publish: [],
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    artifactName: 'Brightdesk-' + appNames[appId] + artifactSuffix
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    license: 'TERMS_AND_CONDITIONS.txt'
  },
  mac: {
    target: [
      { target: 'dmg', arch: ['universal'] },
      { target: 'pkg', arch: ['universal'] },
      { target: 'zip', arch: ['universal'] }
    ],
    category: 'public.app-category.productivity',
    artifactName: 'Brightdesk-' + appNames[appId] + artifactSuffix
  },
  pkg: {
    license: 'TERMS_AND_CONDITIONS.txt',
    welcome: 'installer/mac-welcome.txt',
    conclusion: 'installer/mac-conclusion.txt',
    installLocation: '/Applications'
  },
  linux: {
    target: [
      { target: 'AppImage', arch: ['x64'] },
      { target: 'deb', arch: ['x64'] }
    ],
    category: 'Office',
    artifactName: 'brightdesk-' + appNames[appId].toLowerCase() + artifactSuffix
  }
};
