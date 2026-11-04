#!/usr/bin/env node
'use strict';

// Idempotent cleanup for legacy app.js fragments. Safe to run repeatedly.
const fs = require('node:fs');
const path = require('node:path');

const file = path.join(__dirname, '..', 'src', 'app.js');
let src = fs.readFileSync(file, 'utf8');
const before = src.length;
const removed = [];
const alreadyAbsent = [];

const blocks = [
  {
    name: 'unused moduleDefaults object',
    text: `const moduleDefaults = {\n  database: { title: 'Untitled database', text: '' },\n  forms: { title: 'Untitled form', text: '' },\n  lists: { title: 'Untitled list', text: '' },\n  planner: { title: 'Untitled plan', text: '' },\n  todo: { title: 'My tasks', text: '' },\n  loop: { title: 'Untitled workspace', text: '' }\n};\n`
  },
  {
    name: 'duplicate escapeHtml (div.textContent version)',
    text: `function escapeHtml(value) { const div=document.createElement('div'); div.textContent=String(value); return div.innerHTML; }\n`
  },
  {
    name: 'unused add() helper inside renderToolbar',
    text: `  const add = (label, action, title) => addButton(ribbonGroup(toolbar, t('common.tools')), label, action, title);\n`
  }
];

for (const block of blocks) {
  if (src.includes(block.text)) {
    src = src.replace(block.text, '');
    removed.push(block.name);
  } else {
    alreadyAbsent.push(block.name);
  }
}

if (src !== fs.readFileSync(file, 'utf8')) {
  const temporary = `${file}.${process.pid}.tmp`;
  try {
    fs.writeFileSync(temporary, src, { flag: 'wx', mode: 0o644 });
    fs.renameSync(temporary, file);
  } catch (error) {
    try { fs.rmSync(temporary, { force: true }); } catch {}
    throw error;
  }
}

console.log(`src/app.js: ${before} -> ${src.length} bytes (removed ${before - src.length})`);
if (removed.length) console.log(`Removed: ${removed.join('; ')}`);
if (alreadyAbsent.length) console.log(`Already absent: ${alreadyAbsent.join('; ')}`);
