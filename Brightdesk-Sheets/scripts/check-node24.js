'use strict';

const manifest = require('../package.json');
const expected = manifest.engines && manifest.engines.node;
const actual = process.versions.node;

if (!expected || actual !== expected) {
  console.error(`Brightdesk requires Node.js ${expected || '24.22.2'} exactly. Current runtime: ${process.version}`);
  process.exit(1);
}

console.log(`Brightdesk runtime check passed: Node.js ${process.version}`);
