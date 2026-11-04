const fs = require('node:fs/promises');
const path = require('node:path');
const appCatalog = require('./app-catalog');

const MAX_PROJECT_BYTES = 50 * 1024 * 1024;
const MAX_DOCUMENT_TEXT_BYTES = 10 * 1024 * 1024;
const MAX_SHEET_CELLS = 250_000;
const MAX_SLIDES = 2_000;
const KNOWN_APP_IDS = new Set(appCatalog.map(app => app.id));
const EXCLUDED_APP_IDS = new Set(['teams', 'outlook', 'onedrive']);

/*
 * Load format-specific libraries only when the corresponding format is used.
 * This keeps lightweight project/CSV operations and unit tests usable before
 * the full desktop dependency set has been installed. Every package remains
 * declared in package.json for normal application installs and release builds.
 */

function isPlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validateProject(project) {
  if (!isPlainObject(project)) throw new Error('This Brightdesk project is not a valid project object.');
  if (project.docs !== undefined && !isPlainObject(project.docs)) throw new Error('This Brightdesk project has an invalid document collection.');
  const docs = project.docs || {};
  for (const [appId, doc] of Object.entries(docs)) {
    if (EXCLUDED_APP_IDS.has(appId) || !KNOWN_APP_IDS.has(appId)) throw new Error(`This project contains an unsupported app module: ${appId}.`);
    if (!isPlainObject(doc)) throw new Error(`The ${appId} document is not valid.`);
    if (doc.title !== undefined && (typeof doc.title !== 'string' || Buffer.byteLength(doc.title, 'utf8') > 1000)) {
      throw new Error(`The ${appId} document has an invalid title.`);
    }
    if (appId === 'pages' && doc.html !== undefined && (typeof doc.html !== 'string' || Buffer.byteLength(doc.html, 'utf8') > MAX_DOCUMENT_TEXT_BYTES)) {
      throw new Error('The Brightdesk Pages document content is invalid or exceeds the 10 MB limit.');
    }
    if (appId === 'notes' && doc.text !== undefined && (typeof doc.text !== 'string' || Buffer.byteLength(doc.text, 'utf8') > MAX_DOCUMENT_TEXT_BYTES)) {
      throw new Error('The Brightdesk Notes content is invalid or exceeds the 10 MB limit.');
    }
    if (appId === 'sheets' && doc.cells !== undefined) {
      if (!Array.isArray(doc.cells)) throw new Error('The Brightdesk Sheets workbook has an invalid cell grid.');
      let cellCount = 0;
      for (const row of doc.cells) {
        if (!Array.isArray(row)) throw new Error('The Brightdesk Sheets workbook contains an invalid row.');
        cellCount += row.length;
        if (cellCount > MAX_SHEET_CELLS) throw new Error('The Brightdesk Sheets workbook exceeds the 250,000-cell project limit.');
        if (row.some(cell => cell !== null && !['string', 'number', 'boolean'].includes(typeof cell))) {
          throw new Error('The Brightdesk Sheets workbook contains an unsupported cell value.');
        }
      }
    }
    if (appId === 'slides' && doc.slides !== undefined) {
      if (!Array.isArray(doc.slides) || doc.slides.length > MAX_SLIDES) throw new Error('The Brightdesk Decks presentation has an invalid slide collection.');
      for (const slide of doc.slides) {
        if (!isPlainObject(slide) || (slide.title !== undefined && typeof slide.title !== 'string') || (slide.body !== undefined && typeof slide.body !== 'string')) {
          throw new Error('The Brightdesk Decks presentation contains an invalid slide.');
        }
      }
      if (doc.current !== undefined && (!Number.isInteger(doc.current) || doc.current < 0 || (doc.slides.length && doc.current >= doc.slides.length))) {
        throw new Error('The Brightdesk Decks presentation has an invalid selected slide.');
      }
    }
  }
  let serialized;
  try { serialized = JSON.stringify(project); } catch { throw new Error('This Brightdesk project cannot be saved as JSON.'); }
  if (Buffer.byteLength(serialized, 'utf8') > MAX_PROJECT_BYTES) throw new Error('This Brightdesk project exceeds the 50 MB size limit.');
  return project;
}

function cleanFileName(value) {
  return String(value || 'Brightdesk file').replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').slice(0, 120) || 'Brightdesk file';
}
function parseDelimited(text, delimiter) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' && quoted && text[i + 1] === '"') { cell += '"'; i++; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === delimiter && !quoted) { row.push(cell); cell = ''; }
    else if ((ch === '\n' || ch === '\r') && !quoted) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
function parseCsv(text) { return parseDelimited(text, ','); }
function parseTsv(text) { return parseDelimited(text, '\t'); }
function ensureExtension(filePath, defaultExtension) {
  const extension = String(defaultExtension || '').replace(/^\./, '');
  if (!extension) return filePath;
  const currentExtension = path.extname(filePath);
  if (currentExtension && currentExtension !== '.') return filePath;
  const basePath = currentExtension === '.' ? filePath.slice(0, -1) : filePath;
  return `${basePath}.${extension}`;
}

function collectXmlText(value, output = []) {
  if (Array.isArray(value)) value.forEach(item => collectXmlText(item, output));
  else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (key === 'a:t' || key === 't') {
        if (Array.isArray(child)) child.forEach(v => output.push(String(v)));
        else if (child !== undefined && typeof child !== 'object') output.push(String(child));
      } else collectXmlText(child, output);
    }
  }
  return output;
}
async function openOfficeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const stat = await fs.stat(filePath);
  if (stat.size > 50 * 1024 * 1024) throw new Error('This file is over the 50 MB import limit.');
  const buffer = await fs.readFile(filePath);
  if (ext === '.docx') {
    const mammoth = require('mammoth');
    const result = await mammoth.convertToHtml({ buffer });
    return { kind: 'pages', title: path.basename(filePath, ext), html: result.value, warnings: result.messages.map(m => m.message) };
  }
  if (ext === '.xlsx' || ext === '.xlsm') {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) return { kind: 'sheets', title: path.basename(filePath, ext), cells: [[]] };
    const rows = [];
    sheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
      rows[rowNumber - 1] = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        rows[rowNumber - 1][colNumber - 1] = cell.formula ? `=${cell.formula}` : (cell.value?.result ?? cell.value ?? '');
      });
    });
    return { kind: 'sheets', title: path.basename(filePath, ext), cells: rows };
  }
  if (ext === '.csv' || ext === '.tsv') {
    const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
    const rows = ext === '.tsv' ? parseTsv(text) : parseCsv(text);
    return { kind: 'sheets', title: path.basename(filePath, ext), cells: rows };
  }
  if (ext === '.pptx') {
    const JSZip = require('jszip');
    const { XMLParser } = require('fast-xml-parser');
    const zip = await JSZip.loadAsync(buffer);
    const slideEntries = Object.values(zip.files).filter(entry => /^ppt\/slides\/slide\d+\.xml$/.test(entry.name));
    const totalSlideBytes = slideEntries.reduce((total, entry) => total + (entry._data?.uncompressedSize || 0), 0);
    if (totalSlideBytes > 50 * 1024 * 1024) throw new Error('The presentation contains too much uncompressed slide XML to import safely.');
    const names = Object.keys(zip.files).filter(n => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a,b) => Number(a.match(/slide(\d+)/)[1]) - Number(b.match(/slide(\d+)/)[1]));
    const parser = new XMLParser({ ignoreAttributes: true, removeNSPrefix: false });
    const slides = [];
    for (const name of names) {
      const xml = await zip.files[name].async('string');
      const texts = collectXmlText(parser.parse(xml)).filter(Boolean);
      slides.push({ title: texts[0] || `Slide ${slides.length + 1}`, body: texts.slice(1).join('\n') });
    }
    return { kind: 'slides', title: path.basename(filePath, ext), slides: slides.length ? slides : [{ title: 'Imported presentation', body: '' }] };
  }
  if (ext === '.txt' || ext === '.md' || ext === '.html') {
    return { kind: ext === '.txt' ? 'notes' : 'pages', title: path.basename(filePath, ext), text: buffer.toString('utf8'), html: ext === '.html' ? buffer.toString('utf8') : undefined };
  }
  if (ext === '.bdesk') {
    let project;
    try { project = JSON.parse(buffer.toString('utf8')); }
    catch { throw new Error('This Brightdesk project file is not valid JSON.'); }
    return validateProject(project);
  }
  throw new Error(`Brightdesk cannot open ${ext || 'this file type'} yet. Supported: DOCX, XLSX, CSV, PPTX, TXT, MD, HTML and BDESK.`);
}
function htmlToBlocks(html) {
  const stripped = String(html || '').replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|h[1-6]|li)>/gi, '\n');
  const noTags = stripped.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  return noTags.split(/\n+/).map(text => text.trim()).filter(Boolean);
}
async function exportOfficeFile(payload, filePath) {
  const kind = payload.kind;
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.bdesk') {
    const project = validateProject(payload.project);
    await fs.writeFile(filePath, JSON.stringify(project, null, 2));
    return;
  }
  if (kind === 'pages' && ext === '.docx') {
    const { Document, Packer, Paragraph, TextRun, HeadingLevel } = require('docx');
    const blocks = payload.blocks?.length ? payload.blocks : htmlToBlocks(payload.html).map(text => ({ text, type: 'paragraph' }));
    const children = blocks.map(block => new Paragraph({
      heading: block.type === 'h1' ? HeadingLevel.HEADING_1 : block.type === 'h2' ? HeadingLevel.HEADING_2 : undefined,
      bullet: block.type === 'li' ? { indent: 360 } : undefined,
      children: [new TextRun({ text: block.text || '', bold: !!block.bold, italics: !!block.italic, underline: block.underline ? {} : undefined })]
    }));
    const doc = new Document({ sections: [{ children }] });
    await fs.writeFile(filePath, await Packer.toBuffer(doc)); return;
  }
  if (kind === 'sheets' && (ext === '.xlsx' || ext === '.xlsm')) {
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet(payload.title || 'Sheet 1');
    (payload.rows || []).forEach((row, r) => row.forEach((value, c) => {
      const cell = sheet.getCell(r + 1, c + 1);
      if (typeof value === 'string' && value.startsWith('=')) cell.value = { formula: value.slice(1) };
      else cell.value = value === '' || value == null ? null : (Number.isFinite(Number(value)) && String(value).trim() !== '' ? Number(value) : value);
    }));
    sheet.views = [{ state: 'frozen', ySplit: 1, xSplit: 1 }];
    sheet.columns.forEach(col => { col.width = 16; });
    await workbook.xlsx.writeFile(filePath); return;
  }
  if (kind === 'sheets' && ext === '.csv') {
    const csv = (payload.rows || []).map(row => row.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');
    await fs.writeFile(filePath, '\uFEFF' + csv, 'utf8'); return;
  }
  if (kind === 'slides' && ext === '.pptx') {
    const PptxGenJS = require('pptxgenjs');
    const pptx = new PptxGenJS(); pptx.layout = 'LAYOUT_WIDE'; pptx.author = 'Brightdesk'; pptx.subject = 'Brightdesk presentation';
    for (const data of (payload.slides || [])) {
      const slide = pptx.addSlide(); slide.background = { color: 'F6F5FF' };
      slide.addText(data.title || '', { x: 0.8, y: 1.1, w: 11, h: 1.2, fontFace: 'Aptos Display', fontSize: 30, bold: true, color: '38356F' });
      slide.addText(data.body || '', { x: 0.85, y: 2.65, w: 10.8, h: 3.7, fontFace: 'Aptos', fontSize: 20, color: '55566B', breakLine: false, valign: 'top' });
    }
    await pptx.writeFile({ fileName: filePath }); return;
  }
  if (kind === 'pages' && ext === '.html') { await fs.writeFile(filePath, payload.html || '', 'utf8'); return; }
  if (kind === 'notes' && (ext === '.md' || ext === '.txt')) { await fs.writeFile(filePath, payload.text || '', 'utf8'); return; }
  throw new Error(`This export format is not available for ${kind}.`);
}
module.exports = { cleanFileName, parseCsv, parseTsv, ensureExtension, openOfficeFile, exportOfficeFile, validateProject };
