'use strict';

const APP_SLUGS = Object.freeze({
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
});

const PLATFORM_SUFFIXES = Object.freeze({
  win32: { arch: 'x64', extension: 'exe' },
  darwin: { arch: 'universal', extension: 'dmg' },
  linux: { arch: 'x86_64', extension: 'AppImage' }
});

function createStandaloneDownload({ appId, platform, version }) {
  const slug = APP_SLUGS[appId];
  if (!slug) throw new Error(`Brightdesk app "${appId}" is not available as a standalone download.`);
  const target = PLATFORM_SUFFIXES[platform];
  if (!target) throw new Error(`Standalone downloads are not supported on ${platform}.`);
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) {
    throw new Error('A valid release version is required to create a standalone download.');
  }

  const filename = platform === 'linux'
    ? `brightdesk-${slug.toLowerCase()}-${version}-${target.arch}.${target.extension}`
    : `Brightdesk-${slug}-${version}-${target.arch}.${target.extension}`;
  const url = `https://github.com/connormolloy12/Brightdesk-suite/releases/latest/download/${encodeURIComponent(filename)}`;
  return { appId, platform, version, filename, url };
}

module.exports = { APP_SLUGS, PLATFORM_SUFFIXES, createStandaloneDownload };
