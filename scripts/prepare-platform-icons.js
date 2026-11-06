#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'assets', 'platform-icons', 'native');
const ICON_SOURCES = {
  suite: 'src/assets/brand/brightdesk-suite-mark.svg',
  pages: 'src/assets/icons/pages.svg',
  sheets: 'src/assets/icons/sheets.svg',
  decks: 'src/assets/icons/decks.svg',
  notes: 'src/assets/icons/notes.svg',
  database: 'src/assets/icons/database.svg',
  forms: 'src/assets/icons/forms.svg',
  lists: 'src/assets/icons/lists.svg',
  planner: 'src/assets/icons/planner.svg',
  todo: 'src/assets/icons/to-do.svg',
  workspace: 'src/assets/icons/workspace.svg'
};
const ICON_IDS = Object.keys(ICON_SOURCES);

function validateSvg(content, name) {
  if (typeof content !== 'string' || !/<svg\b/.test(content) || !/<title\b/.test(content)) {
    throw new Error(`Invalid SVG icon source: ${name}`);
  }
  if (/\p{Extended_Pictographic}/u.test(content)) {
    throw new Error(`Emoji are not permitted in product icon artwork: ${name}`);
  }
  return content;
}

function preparePlatformIcons({ rootDir = ROOT, outputDir = path.join(rootDir, 'assets', 'platform-icons', 'native') } = {}) {
  const temporary = `${outputDir}.tmp`;
  fs.rmSync(temporary, { recursive: true, force: true });
  fs.mkdirSync(temporary, { recursive: true });
  try {
    for (const [id, relativeSource] of Object.entries(ICON_SOURCES)) {
      const source = path.join(rootDir, relativeSource);
      if (!fs.existsSync(source)) throw new Error(`Canonical SVG artwork is missing: ${relativeSource}`);
      const content = validateSvg(fs.readFileSync(source, 'utf8'), relativeSource);
      fs.writeFileSync(path.join(temporary, `${id}.svg`), content, 'utf8');
    }
    fs.rmSync(outputDir, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(outputDir), { recursive: true });
    fs.renameSync(temporary, outputDir);
  } catch (error) {
    fs.rmSync(temporary, { recursive: true, force: true });
    throw error;
  }
  return { outputDir, iconCount: ICON_IDS.length, fileCount: ICON_IDS.length };
}

if (require.main === module) {
  try {
    const result = preparePlatformIcons();
    console.log(`Prepared ${result.iconCount} canonical SVG icon sources for automatic Windows, macOS and Linux conversion.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { ICON_IDS, ICON_SOURCES, preparePlatformIcons, validateSvg };
