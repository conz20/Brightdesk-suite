'use strict';

const path = require('node:path');

const appId = process.env.BRIGHTDESK_APP_ID;
const appNames = { pages: 'Pages', sheets: 'Sheets', slides: 'Decks', notes: 'Notes', database: 'Database', forms: 'Forms', lists: 'Lists', planner: 'Planner', todo: 'To Do', loop: 'Workspace' };

if (!appNames[appId]) {
  throw new Error('Set BRIGHTDESK_APP_ID to one of: pages, sheets, slides, notes, database, forms, lists, planner, todo, loop.');
}

module.exports = {
  appId: `org.brightdesk.${appId}`,
  productName: 'Brightdesk ' + appNames[appId],
  extraMetadata: { brightdeskAppId: appId, productName: 'Brightdesk ' + appNames[appId] },
  asar: true,
  files: ['src/**/*', 'package.json', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'TERMS_AND_CONDITIONS.txt'],
  directories: { output: path.join('release', 'apps', appId), buildResources: 'assets/branding' },
  // Each standalone app receives its own channel metadata to prevent cross-app update collisions.
  publish: [{ provider: 'github', owner: 'connormolloy12', repo: 'Brightdesk-suite', channel: appId }],
  win: {
    icon: path.join('src', 'assets', 'app-icons', `${appId}.svg`),
    target: ['nsis'],
    artifactName: 'Brightdesk-' + appNames[appId] + '-${version}-${arch}.${ext}'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    license: 'TERMS_AND_CONDITIONS.txt'
  },
  mac: {
    icon: path.join('src', 'assets', 'app-icons', `${appId}.svg`),
    target: ['dmg', 'pkg', 'zip'],
    category: 'public.app-category.productivity',
    artifactName: 'Brightdesk-' + appNames[appId] + '-${version}-${arch}.${ext}'
  },
  pkg: {
    license: 'TERMS_AND_CONDITIONS.txt',
    welcome: 'installer/mac-welcome.txt',
    conclusion: 'installer/mac-conclusion.txt',
    installLocation: '/Applications'
  },
  linux: {
    icon: path.join('src', 'assets', 'app-icons', `${appId}.svg`),
    target: ['AppImage', 'deb'],
    category: 'Office',
    artifactName: 'brightdesk-' + appId + '-${version}-${arch}.${ext}'
  }
};
