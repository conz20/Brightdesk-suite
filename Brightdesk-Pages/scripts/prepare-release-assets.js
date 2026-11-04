#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const platform = process.argv[2];
const labels = { win: 'Windows', mac: 'macOS', linux: 'Linux' };
if (!labels[platform]) throw new Error('Usage: node scripts/prepare-release-assets.js <win|mac|linux>');

const release = path.join(root, 'release');
fs.mkdirSync(release, { recursive: true });
const label = labels[platform];
const legalFiles = [
  ['TERMS_AND_CONDITIONS.txt', `Brightdesk-${label}-TERMS_AND_CONDITIONS.txt`],
  ['LICENSE', `Brightdesk-${label}-LICENSE.txt`],
  ['THIRD_PARTY_NOTICES.md', `Brightdesk-${label}-THIRD_PARTY_NOTICES.md`]
];

for (const [source, destination] of legalFiles) {
  fs.copyFileSync(path.join(root, source), path.join(release, destination));
}

if (platform === 'linux') {
  const helper = path.join(release, 'Brightdesk-Install-Linux.sh');
  fs.copyFileSync(path.join(root, 'installer', 'install-linux.sh'), helper);
  fs.chmodSync(helper, 0o755);
}

console.log(`Prepared ${label} release assets with uniquely named legal documents.`);
