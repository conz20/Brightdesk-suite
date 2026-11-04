#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

function verifyLockfile(rootDir = path.resolve(__dirname, '..')) {
  const packagePath = path.join(rootDir, 'package.json');
  const lockPath = path.join(rootDir, 'package-lock.json');
  if (!fs.existsSync(packagePath)) throw new Error(`package.json not found: ${packagePath}`);
  if (!fs.existsSync(lockPath)) throw new Error('package-lock.json is missing. Run npm run lock:prepare on a network-connected Node.js 24.22.2 environment.');

  const manifest = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const lock = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  if (lock.lockfileVersion !== 3) throw new Error(`Unsupported package-lock version: ${lock.lockfileVersion}; expected version 3.`);
  if (!lock.packages || !lock.packages['']) throw new Error('package-lock.json is missing its root package metadata.');

  const root = lock.packages[''];
  if (root.name !== manifest.name || root.version !== manifest.version) {
    throw new Error(`Lockfile root does not match package.json (expected ${manifest.name}@${manifest.version}).`);
  }
  for (const group of ['dependencies', 'devDependencies', 'optionalDependencies']) {
    const expected = manifest[group] || {};
    const actual = root[group] || {};
    if (JSON.stringify(Object.fromEntries(Object.entries(expected).sort())) !== JSON.stringify(Object.fromEntries(Object.entries(actual).sort()))) {
      throw new Error(`Lockfile ${group} do not match package.json. Regenerate with npm run lock:prepare.`);
    }
  }

  return { name: manifest.name, version: manifest.version, lockfileVersion: lock.lockfileVersion, dependencyCount: Object.keys(lock.packages).length - 1 };
}

if (require.main === module) {
  try {
    const result = verifyLockfile();
    console.log(`Dependency lock verified: ${result.name}@${result.version}; ${result.dependencyCount} locked packages (lockfile v${result.lockfileVersion}).`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = { verifyLockfile };
