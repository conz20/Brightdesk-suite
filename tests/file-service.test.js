const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { cleanFileName, parseCsv, parseTsv, ensureExtension, exportOfficeFile, openOfficeFile, validateProject } = require('../src/file-service');

test('cleanFileName removes unsafe characters and limits length', () => {
  assert.equal(cleanFileName('budget: 2026/report?'), 'budget_ 2026_report_');
  assert.ok(cleanFileName('x'.repeat(200)).length <= 120);
});

test('parseCsv handles quoted commas, quotes, and new lines', () => {
  assert.deepEqual(parseCsv('Name,Note\r\nAlex,"hello, world"\r\nSam,"said ""hi"""'), [
    ['Name','Note'], ['Alex','hello, world'], ['Sam','said "hi"']
  ]);
});

test('parseTsv preserves quoted tabs, quotes, and new lines', () => {
  assert.deepEqual(parseTsv('Name\tNote\r\nAlex\t"hello\tworld"\r\nSam\t"said ""hi"""'), [
    ['Name','Note'], ['Alex','hello\tworld'], ['Sam','said "hi"']
  ]);
});

test('save paths receive the default extension only when missing', () => {
  assert.equal(ensureExtension('/tmp/report', 'docx'), '/tmp/report.docx');
  assert.equal(ensureExtension('/tmp/report.csv', 'xlsx'), '/tmp/report.csv');
  assert.equal(ensureExtension('/tmp/report.', 'pdf'), '/tmp/report.pdf');
});

test('TSV files import with tab-aware quoting', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-tsv-'));
  const filePath = path.join(directory, 'test.tsv');
  try {
    await fs.writeFile(filePath, 'Name\tNote\r\nAlex\t"hello\tworld"', 'utf8');
    const imported = await openOfficeFile(filePath);
    assert.deepEqual(imported.cells, [['Name','Note'], ['Alex','hello\tworld']]);
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});

test('Brightdesk project file can be saved and reopened', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-test-'));
  const filePath = path.join(directory, 'test.bdesk');
  const project = { title: 'Test', docs: { pages: { title: 'My page', html: '<p>Hello</p>' } } };
  try {
    await exportOfficeFile({ project }, filePath);
    const reopened = await openOfficeFile(filePath);
    assert.deepEqual(reopened, project);
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});

test('CSV export writes valid quoted cells', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-csv-'));
  const filePath = path.join(directory, 'test.csv');
  try {
    await exportOfficeFile({ kind: 'sheets', title: 'Test', rows: [['Name','Value'], ['Alex','a,b'], ['Sam','say "hi"']] }, filePath);
    const data = (await fs.readFile(filePath, 'utf8')).replace(/^\uFEFF/, '');
    assert.deepEqual(parseCsv(data), [['Name','Value'], ['Alex','a,b'], ['Sam','say "hi"']]);
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});


test('Brightdesk project validation rejects malformed document collections and unknown modules', () => {
  assert.throws(() => validateProject({ title: 'Bad', docs: [] }), /invalid document collection/);
  assert.throws(() => validateProject({ title: 'Bad', docs: { pages: 'not a document' } }), /document is not valid/);
  assert.throws(() => validateProject({ title: 'Bad', docs: { outlook: { title: 'Mail' } } }), /unsupported app module/);
  assert.throws(() => validateProject({ title: 'Bad', docs: { unknown: { title: 'Unknown' } } }), /unsupported app module/);
});

test('Brightdesk project validation enforces core document size and shape limits', () => {
  assert.throws(() => validateProject({ docs: { pages: { html: 'x'.repeat(10 * 1024 * 1024 + 1) } } }), /10 MB limit/);
  assert.throws(() => validateProject({ docs: { sheets: { cells: [['=SUM(A1:A2)', { bad: true }]] } } }), /unsupported cell value/);
  assert.throws(() => validateProject({ docs: { slides: { slides: [{ title: 'Slide' }], current: 3 } } }), /invalid selected slide/);
});

test('Brightdesk project import rejects malformed JSON with a clear error', async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-invalid-project-'));
  const filePath = path.join(directory, 'broken.bdesk');
  try {
    await fs.writeFile(filePath, '{not json', 'utf8');
    await assert.rejects(openOfficeFile(filePath), /not valid JSON/);
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});
