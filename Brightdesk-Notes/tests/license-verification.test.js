'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { auditProject } = require('../scripts/verify-licenses');

function fixture() {
  const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-license-test-'));
  const nodeModulesDir = path.join(rootDir, 'node_modules');
  fs.mkdirSync(nodeModulesDir, { recursive: true });
  fs.writeFileSync(path.join(rootDir, 'package.json'), JSON.stringify({ name: 'brightdesk-suite', version: '0.3.4', license: 'MIT' }));
  fs.writeFileSync(path.join(rootDir, 'LICENSE'), 'MIT License\nCopyright test\n');
  const dependencyDir = path.join(nodeModulesDir, 'sample-package');
  fs.mkdirSync(dependencyDir, { recursive: true });
  fs.writeFileSync(path.join(dependencyDir, 'package.json'), JSON.stringify({ name: 'sample-package', version: '1.2.3', license: 'BSD-2-Clause' }));
  fs.writeFileSync(path.join(dependencyDir, 'LICENSE'), 'BSD 2-Clause License\nCopyright sample\n');
  return { rootDir, nodeModulesDir, outputPath: path.join(rootDir, 'THIRD_PARTY_NOTICES.md') };
}

test('MIT Brightdesk and licensed dependencies pass the local verification', () => {
  const paths = fixture();
  const result = auditProject(paths);
  assert.equal(result.packageCount, 1);
  assert.match(fs.readFileSync(paths.outputPath, 'utf8'), /sample-package@1\.2\.3/);
  assert.match(fs.readFileSync(paths.outputPath, 'utf8'), /BSD 2-Clause License/);
});

test('explicitly unlicensed dependencies are rejected', () => {
  const paths = fixture();
  const manifestPath = path.join(paths.nodeModulesDir, 'sample-package', 'package.json');
  fs.writeFileSync(manifestPath, JSON.stringify({ name: 'sample-package', version: '1.2.3', license: 'UNLICENSED' }));
  assert.throws(() => auditProject(paths), /proprietary or unlicensed status/);
});

test('dependencies with no licence metadata or licence file are rejected', () => {
  const paths = fixture();
  const dependencyDir = path.join(paths.nodeModulesDir, 'sample-package');
  fs.writeFileSync(path.join(dependencyDir, 'package.json'), JSON.stringify({ name: 'sample-package', version: '1.2.3' }));
  fs.rmSync(path.join(dependencyDir, 'LICENSE'));
  assert.throws(() => auditProject(paths), /no licence metadata or recognised licence file/);
});

test('Brightdesk project licence must remain explicitly MIT', () => {
  const paths = fixture();
  fs.writeFileSync(path.join(paths.rootDir, 'package.json'), JSON.stringify({ name: 'brightdesk-suite', version: '0.3.4', license: 'UNLICENSED' }));
  assert.throws(() => auditProject(paths), /must keep its declared MIT licence/);
});
