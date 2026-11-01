#!/usr/bin/env node
'use strict';

/**
 * Brightdesk REA Bench — local, dependency-free source/package inspection.
 * This is an original Brightdesk utility, not the REA project or an MCP server.
 * It analyses source trees and ZIP metadata safely; it does not execute targets,
 * decompile binaries, bypass controls, or claim runtime observations.
 */
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const IGNORE = new Set(['.git', 'node_modules', 'release', 'dist', 'coverage', '.cache']);
const SOURCE_EXT = new Set(['.js', '.cjs', '.mjs', '.ts', '.tsx', '.jsx', '.json', '.html', '.css', '.md', '.yml', '.yaml', '.ps1', '.sh']);
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_FILES = 12000;

function sha256(buffer) { return crypto.createHash('sha256').update(buffer).digest('hex'); }
function walk(dir, base = dir, files = []) {
  if (files.length > MAX_FILES) throw new Error(`File limit exceeded (${MAX_FILES}). Narrow the target.`);
  for (const ent of fs.readdirSync(dir, { withFileTypes: true }).sort((a,b) => a.name.localeCompare(b.name))) {
    if (IGNORE.has(ent.name)) continue;
    const abs = path.join(dir, ent.name);
    const rel = path.relative(base, abs).split(path.sep).join('/');
    if (rel === 'reports/rea' || rel.startsWith('reports/rea/')) continue;
    const stat = fs.lstatSync(abs);
    if (stat.isSymbolicLink()) continue;
    if (stat.isDirectory()) walk(abs, base, files);
    else if (stat.isFile()) files.push({ path: path.relative(base, abs).split(path.sep).join('/'), size: stat.size, ext: path.extname(ent.name).toLowerCase(), abs });
  }
  return files;
}
function readText(file) {
  if (file.size > MAX_FILE_BYTES || !SOURCE_EXT.has(file.ext)) return null;
  const b = fs.readFileSync(file.abs);
  if (b.includes(0)) return null;
  return b.toString('utf8');
}
function parseCatalog(root) {
  const p = path.join(root, 'src', 'app-catalog.js');
  if (!fs.existsSync(p)) return { error: 'src/app-catalog.js not found' };
  try {
    const resolved = require.resolve(p);
    delete require.cache[resolved];
    const catalog = require(resolved);
    if (!Array.isArray(catalog)) return { error: 'App catalogue did not export an array' };
    return { apps: catalog.map(({ id, name, availability, moduleVersion, microsoftReference }) => ({ id, name, availability, moduleVersion, microsoftReference })) };
  } catch (e) { return { error: `Catalogue load failed: ${e.message}` }; }
}
function inspect(target) {
  const root = path.resolve(target);
  if (!fs.existsSync(root) || !fs.statSync(root).isDirectory()) throw new Error(`Target must be an existing directory: ${root}`);
  const files = walk(root);
  const inventory = files.map(f => {
    const b = fs.readFileSync(f.abs);
    return { path: f.path, size: f.size, sha256: sha256(b), extension: f.ext || '(none)' };
  });
  const byExt = {};
  for (const f of files) byExt[f.ext || '(none)'] = (byExt[f.ext || '(none)'] || 0) + 1;
  const pkgPath = path.join(root, 'package.json');
  let pkg = null;
  if (fs.existsSync(pkgPath)) { try { pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')); } catch (e) { pkg = { parseError: e.message }; } }
  const catalog = parseCatalog(root);
  const findings = [];
  const scopePath = path.join(root, 'PRODUCT_SCOPE_LOCK.md');
  if (!fs.existsSync(scopePath)) findings.push({ severity: 'warning', id: 'scope-lock-missing', message: 'No PRODUCT_SCOPE_LOCK.md found.' });
  if (catalog.error) findings.push({ severity: 'error', id: 'catalog-unreadable', message: catalog.error });
  const appIds = catalog.apps?.map(a => a.id) || [];
  const expected = ['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop'];
  if (catalog.apps && JSON.stringify(appIds) !== JSON.stringify(expected)) findings.push({ severity: 'error', id: 'catalog-scope-drift', message: `Catalogue IDs differ from approved list: ${appIds.join(', ')}` });
  const excluded = ['outlook','onedrive','teams'];
  for (const id of excluded) if (appIds.includes(id)) findings.push({ severity: 'error', id: `excluded-app-${id}`, message: `Excluded app '${id}' appears in executable catalogue.` });
  const textFindings = [];
  for (const f of files) {
    const text = readText(f);
    if (text === null) continue;
    if (/\b(?:eval|new Function)\s*\(/.test(text)) textFindings.push({ severity: 'warning', id: 'dynamic-code-execution', file: f.path, message: 'Possible dynamic code execution pattern; review context.' });
    if (/nodeIntegration\s*:\s*true/.test(text)) textFindings.push({ severity: 'error', id: 'electron-node-integration-enabled', file: f.path, message: 'Electron nodeIntegration appears enabled.' });
    if (/contextIsolation\s*:\s*false/.test(text)) textFindings.push({ severity: 'error', id: 'electron-context-isolation-disabled', file: f.path, message: 'Electron contextIsolation appears disabled.' });
  }
  findings.push(...textFindings);
  const summary = {
    tool: 'Brightdesk REA Bench', toolVersion: '1.0.0', analysisType: 'static-source-inventory',
    target: root, generatedAt: new Date().toISOString(),
    boundary: 'Static source inspection only. No target execution, runtime tracing, binary decompilation, network probing, or proprietary-code extraction.',
    package: pkg ? { name: pkg.name, version: pkg.version, engines: pkg.engines, dependencies: Object.keys(pkg.dependencies || {}), devDependencies: Object.keys(pkg.devDependencies || {}) } : null,
    catalogue: catalog, inventory: { fileCount: files.length, totalBytes: files.reduce((n,f) => n + f.size, 0), byExtension: byExt, files: inventory },
    findings, result: findings.some(f => f.severity === 'error') ? 'review-required' : findings.length ? 'review-recommended' : 'no-static-findings'
  };
  return summary;
}
function markdown(report) {
  const lines = [`# Brightdesk REA Bench report`, '', `- **Target:** \`${report.target}\``, `- **Generated:** ${report.generatedAt}`, `- **Result:** ${report.result}`, `- **Files inventoried:** ${report.inventory.fileCount}`, `- **Total bytes:** ${report.inventory.totalBytes}`, '', `## Scope and limitations`, '', report.boundary, '', `## App catalogue`, ''];
  for (const app of report.catalogue.apps || []) lines.push(`- ${app.name} (\`${app.id}\`) — ${app.availability}`);
  if (report.catalogue.error) lines.push(`- Error: ${report.catalogue.error}`);
  lines.push('', '## Findings', '');
  if (!report.findings.length) lines.push('No static findings. This is not a runtime or security certification.');
  for (const f of report.findings) lines.push(`- **${f.severity.toUpperCase()} ${f.id}**${f.file ? ` in \`${f.file}\`` : ''}: ${f.message}`);
  lines.push('', '## Inventory by file type', '');
  for (const [ext, count] of Object.entries(report.inventory.byExtension).sort()) lines.push(`- ${ext}: ${count}`);
  lines.push('', '## Evidence inventory', '');
  for (const f of report.inventory.files) lines.push(`- \`${f.path}\` — ${f.size} bytes — SHA-256 \`${f.sha256}\``);
  lines.push('');
  return lines.join('\n');
}
function main() {
  const [command = 'help', targetArg = ROOT] = process.argv.slice(2);
  if (command === 'help' || command === '--help') {
    console.log('Brightdesk REA Bench\nUsage: node scripts/brightdesk-rea.js inspect [project-directory]\nCreates reports/rea/latest.json and latest.md.');
    return;
  }
  if (command !== 'inspect') throw new Error(`Unknown command: ${command}`);
  const report = inspect(targetArg);
  const outDir = path.join(ROOT, 'reports', 'rea');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'latest.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'latest.md'), markdown(report));
  console.log(JSON.stringify({ result: report.result, files: report.inventory.fileCount, findings: report.findings.length, report: 'reports/rea/latest.md' }, null, 2));
  if (report.findings.some(f => f.severity === 'error')) process.exitCode = 2;
}
if (require.main === module) {
  try { main(); } catch (e) { console.error(`REA Bench error: ${e.message}`); process.exitCode = 1; }
}
module.exports = { inspect, markdown, sha256 };
