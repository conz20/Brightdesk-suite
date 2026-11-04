#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const APPROVED_IDS = ['pages', 'sheets', 'slides', 'notes', 'database', 'forms', 'lists', 'planner', 'todo', 'loop'];
const AVAILABLE_IDS = [...APPROVED_IDS];
const EXCLUDED_NAMES = ['Outlook', 'OneDrive', 'Teams'];

function versionAtLeast(actual, required) {
  const a = String(actual).replace(/^v/, '').split('.').map(Number);
  const b = String(required).replace(/^v/, '').split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const left = a[i] || 0;
    const right = b[i] || 0;
    if (left > right) return true;
    if (left < right) return false;
  }
  return true;
}

function runPreflight({ rootDir, nodeVersion = process.versions.node, platform = process.platform } = {}) {
  const root = rootDir || path.resolve(__dirname, '..');
  const manifestPath = path.join(root, 'package.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const catalogPath = path.join(root, 'src', 'app-catalog.js');
  const catalog = require(catalogPath);
  const checks = [];
  const add = (name, passed, detail, blocking = true) => checks.push({ name, passed, detail, blocking });

  add('Node.js version', nodeVersion === manifest.engines?.node, `Found ${nodeVersion}; requires exactly ${manifest.engines?.node || '24.22.2'}.`);
  let lockValid = false;
  let lockDetail = 'A verified package-lock.json generated from this exact package.json is required before npm ci.';
  if (nodeVersion !== manifest.engines?.node) {
    lockDetail = `Lockfile validation requires the pinned Node.js ${manifest.engines?.node}; found ${nodeVersion}.`;
  } else {
    try {
      const lockInfo = require('./verify-lockfile').verifyLockfile(root);
      lockValid = true;
      lockDetail = `Verified lockfile v${lockInfo.lockfileVersion} with ${lockInfo.dependencyCount} locked packages.`;
    } catch (error) {
      lockDetail = error.message;
    }
  }
  add('Dependency lockfile', lockValid, lockDetail);
  add('Installed dependencies', fs.existsSync(path.join(root, 'node_modules')), 'Run npm ci after a lockfile is present.');
  add('Electron', fs.existsSync(path.join(root, 'node_modules', 'electron', 'package.json')), 'Electron must be installed from the locked dependency tree.');
  add('electron-builder', fs.existsSync(path.join(root, 'node_modules', 'electron-builder', 'package.json')), 'electron-builder must be installed from the locked dependency tree.');
  add('Exact ten-app scope', JSON.stringify(catalog.map(item => item.id)) === JSON.stringify(APPROVED_IDS), `Catalogue IDs: ${catalog.map(item => item.id).join(', ')}.`);
  const availableIds = catalog.filter(item => item.availability === 'available').map(item => item.id);
  add('All ten approved apps available', JSON.stringify(availableIds) === JSON.stringify(AVAILABLE_IDS), `Available: ${availableIds.join(', ')}; ${APPROVED_IDS.filter(id => !availableIds.includes(id)).length} approved apps remain planned.`);
  add('Excluded apps absent', EXCLUDED_NAMES.every(name => !catalog.some(item => item.name.toLowerCase().includes(name.toLowerCase()))), `Excluded from the catalogue: ${EXCLUDED_NAMES.join(', ')}.`);
  add('Release metadata', Boolean(manifest.version && manifest.build?.appId && manifest.build?.productName), `Version ${manifest.version}; app ID ${manifest.build?.appId || 'missing'}.`);
  add('Terms and Conditions', fs.existsSync(path.join(root, 'TERMS_AND_CONDITIONS.txt')), 'A readable Terms and Conditions document must ship with every installer.');
  add('Open-source licence bundle', manifest.license === 'MIT' && fs.existsSync(path.join(root, 'LICENSE')) && fs.existsSync(path.join(root, 'THIRD_PARTY_NOTICES.md')), 'MIT source licence and dependency notices must ship with each installer.');
  add('Windows installer agreement', manifest.build?.nsis?.license === 'TERMS_AND_CONDITIONS.txt', 'NSIS must show the Terms and Conditions and require agreement.');
  add('macOS installer agreement', manifest.build?.pkg?.license === 'TERMS_AND_CONDITIONS.txt' && manifest.build?.mac?.target?.includes('pkg'), 'macOS PKG must show the Terms and Conditions and require agreement.');
  add('Linux consent installer', fs.existsSync(path.join(root, 'installer', 'install-linux.sh')), 'Linux must include the yes/no agreement installer alongside the package formats.');
  add('First-launch agreement gate', fs.existsSync(path.join(root, 'src', 'terms.html')) && fs.existsSync(path.join(root, 'src', 'terms-preload.js')) && fs.existsSync(path.join(root, 'src', 'terms.js')), 'The application must request agreement on first launch and when Terms change.');

  const targetPlatform = platform === 'win32' ? 'win' : platform === 'darwin' ? 'mac' : platform === 'linux' ? 'linux' : 'unsupported';
  add('Native build host', targetPlatform !== 'unsupported', `Detected ${platform}; supported native build hosts are Windows, macOS and Linux.`);

  const blockers = checks.filter(item => item.blocking && !item.passed);
  return { ready: blockers.length === 0, version: manifest.version, platform: targetPlatform, checks, blockers };
}

function writeReport(result, rootDir = path.resolve(__dirname, '..')) {
  const reportDir = path.join(rootDir, 'reports', 'release');
  fs.mkdirSync(reportDir, { recursive: true });
  const jsonPath = path.join(reportDir, 'latest.json');
  const markdownPath = path.join(reportDir, 'latest.md');
  fs.writeFileSync(jsonPath, `${JSON.stringify(result, null, 2)}\n`);
  const lines = [
    `# Brightdesk ${result.version} release preflight`,
    '',
    `**Result: ${result.ready ? 'READY' : 'BLOCKED'}**`,
    '',
    `Build host: ${result.platform}`,
    '',
    '| Check | Result | Detail |',
    '|---|---|---|',
    ...result.checks.map(check => `| ${check.name} | ${check.passed ? 'PASS' : check.blocking ? 'BLOCK' : 'WARN'} | ${check.detail.replace(/\|/g, '\\|')} |`),
    '',
    result.ready ? 'All release preflight checks passed.' : `Blocking issues: ${result.blockers.length}. No installer should be produced from this environment.`
  ];
  fs.writeFileSync(markdownPath, `${lines.join('\n')}\n`);
  return { jsonPath, markdownPath };
}

if (require.main === module) {
  const result = runPreflight();
  const report = writeReport(result);
  console.log(`Brightdesk ${result.version} release preflight: ${result.ready ? 'READY' : 'BLOCKED'}`);
  for (const check of result.checks) {
    console.log(`${check.passed ? 'PASS' : check.blocking ? 'BLOCK' : 'WARN'}  ${check.name}: ${check.detail}`);
  }
  console.log(`Report: ${report.markdownPath}`);
  if (!result.ready) {
    console.error(`\n${result.blockers.length} release blocker(s) remain. No installer was created.`);
    process.exitCode = 1;
  }
}

module.exports = { APPROVED_IDS, AVAILABLE_IDS, runPreflight, versionAtLeast, writeReport };
