#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const JSZip = require('jszip');

const ROOT = path.resolve(__dirname, '..');
const ARCHIVE = path.join(ROOT, 'assets', 'platform-icons', 'brightdesk-platform-icons.zip');
const OUTPUT = path.join(ROOT, 'assets', 'platform-icons', 'native');
const ICON_IDS = ['suite', 'pages', 'sheets', 'decks', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'workspace'];
const FORMATS = ['png', 'ico', 'icns'];
const EXPECTED_FILES = new Set([
  'manifest.json',
  ...ICON_IDS.flatMap(id => FORMATS.map(extension => `${id}.${extension}`))
]);

function validatePng(buffer, name) {
  if (buffer.length < 24 || !buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) {
    throw new Error(`Invalid PNG platform icon: ${name}`);
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width !== 256 || height !== 256) throw new Error(`Expected 256 × 256 PNG for ${name}; got ${width} × ${height}.`);
}

function validateIco(buffer, name) {
  if (buffer.length < 22 || buffer.readUInt16LE(0) !== 0 || buffer.readUInt16LE(2) !== 1) {
    throw new Error(`Invalid Windows ICO platform icon: ${name}`);
  }
  const count = buffer.readUInt16LE(4);
  if (count < 6) throw new Error(`Windows ICO must include multiple icon sizes: ${name}`);
}

function validateIcns(buffer, name) {
  if (buffer.length < 16 || buffer.subarray(0, 4).toString('ascii') !== 'icns' || buffer.readUInt32BE(4) !== buffer.length) {
    throw new Error(`Invalid macOS ICNS platform icon: ${name}`);
  }
  const found = new Set();
  for (let offset = 8; offset < buffer.length;) {
    if (offset + 8 > buffer.length) throw new Error(`Truncated ICNS chunk in ${name}`);
    const type = buffer.subarray(offset, offset + 4).toString('ascii');
    const length = buffer.readUInt32BE(offset + 4);
    if (length < 8 || offset + length > buffer.length) throw new Error(`Invalid ICNS chunk size in ${name}`);
    found.add(type);
    offset += length;
  }
  for (const required of ['ic07', 'ic08']) {
    if (!found.has(required)) throw new Error(`ICNS ${name} is missing its ${required} representation.`);
  }
}

function validateIcon(name, buffer) {
  const extension = path.extname(name).slice(1);
  if (extension === 'png') validatePng(buffer, name);
  else if (extension === 'ico') validateIco(buffer, name);
  else if (extension === 'icns') validateIcns(buffer, name);
  else if (name !== 'manifest.json') throw new Error(`Unexpected platform icon file: ${name}`);
}

async function preparePlatformIcons({ archivePath = ARCHIVE, outputDir = OUTPUT } = {}) {
  if (!fs.existsSync(archivePath)) throw new Error(`Native icon archive is missing: ${archivePath}`);
  const zip = await JSZip.loadAsync(fs.readFileSync(archivePath));
  const entries = Object.keys(zip.files).filter(name => !zip.files[name].dir);
  const unexpected = entries.filter(name => !EXPECTED_FILES.has(name));
  const missing = [...EXPECTED_FILES].filter(name => !entries.includes(name));
  if (unexpected.length || missing.length) {
    throw new Error(`Native icon archive contents do not match the approved manifest. Missing: ${missing.join(', ') || 'none'}. Unexpected: ${unexpected.join(', ') || 'none'}.`);
  }

  const temporary = `${outputDir}.tmp`;
  fs.rmSync(temporary, { recursive: true, force: true });
  fs.mkdirSync(temporary, { recursive: true });
  try {
    for (const name of [...EXPECTED_FILES]) {
      const buffer = await zip.file(name).async('nodebuffer');
      validateIcon(name, buffer);
      fs.writeFileSync(path.join(temporary, name), buffer);
    }
    fs.rmSync(outputDir, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(outputDir), { recursive: true });
    fs.renameSync(temporary, outputDir);
  } catch (error) {
    fs.rmSync(temporary, { recursive: true, force: true });
    throw error;
  }
  return { outputDir, iconCount: ICON_IDS.length, fileCount: EXPECTED_FILES.size };
}

if (require.main === module) {
  preparePlatformIcons()
    .then(result => console.log(`Prepared ${result.iconCount} native application icon sets (${result.fileCount} files) for Windows, macOS and Linux.`))
    .catch(error => { console.error(error.message); process.exitCode = 1; });
}

module.exports = { ICON_IDS, EXPECTED_FILES, preparePlatformIcons, validateIcon, validatePng, validateIco, validateIcns };
