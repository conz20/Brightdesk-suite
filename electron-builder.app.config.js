'use strict';

const path = require('node:path');

const appId = process.env.BRIGHTDESK_APP_ID;
const appNames = {
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
};
const appIcons = {
  pages: 'pages',
  sheets: 'sheets',
  slides: 'decks',
  notes: 'notes',
  database: 'database',
  forms: 'forms',
  lists: 'lists',
  planner: 'planner',
  todo: 'todo',
  loop: 'workspace'
};
const appSlugs = {
  pages: 'Pages',
  sheets: 'Sheets',
  slides: 'Decks',
  notes: 'Notes',
  database: 'Database',
  forms: 'Forms',
  lists: 'Lists',
  planner: 'Planner',
  todo: 'To-Do',
  loop: 'Workspace'
};

if (!appNames[appId]) {
  throw new Error('Set BRIGHTDESK_APP_ID to one of: pages, sheets, slides, notes, database, forms, lists, planner, todo, loop.');
}

const appName = appNames[appId];
const appSlug = appSlugs[appId];

module.exports = {
  appId: `org.brightdesk.${appId}`,
  productName: 'Brightdesk ' + appName,
  extraMetadata: { name: 'brightdesk-' + appId, brightdeskAppId: appId, productName: 'Brightdesk ' + appName, desktopName: `org.brightdesk.${appId}.desktop` },
  asar: true,
  files: ['src/**/*', 'native/brightdesk_engine.node', 'package.json', 'LICENSE', 'THIRD_PARTY_NOTICES.md', 'TERMS_AND_CONDITIONS.txt'],
  asarUnpack: ['native/brightdesk_engine.node'],
  directories: { output: path.join('release', 'apps', appId), buildResources: 'assets/platform-icons/native' },
  publish: [],
  win: {
    icon: `${appIcons[appId]}.svg`,
    target: ['nsis'],
    artifactName: 'Brightdesk-' + appSlug + '-${version}-${arch}.${ext}'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    menuCategory: 'Brightdesk',
    shortcutName: 'Brightdesk ' + appName,
    license: 'TERMS_AND_CONDITIONS.txt'
  },
  mac: {
    icon: `${appIcons[appId]}.svg`,
    target: ['dmg', 'pkg', 'zip'],
    category: 'public.app-category.productivity',
    artifactName: 'Brightdesk-' + appSlug + '-${version}-${arch}.${ext}'
  },
  pkg: {
    license: 'TERMS_AND_CONDITIONS.txt',
    welcome: 'installer/mac-welcome.txt',
    conclusion: 'installer/mac-conclusion.txt',
    installLocation: '/Applications'
  },
  linux: {
    icon: `${appIcons[appId]}.svg`,
    syncDesktopName: true,
    target: ['AppImage', 'deb'],
    category: 'Office',
    artifactName: 'brightdesk-' + appSlug.toLowerCase() + '-${version}-${arch}.${ext}'
  }
};
