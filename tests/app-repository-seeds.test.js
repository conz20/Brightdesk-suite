'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { PRODUCT_REPOSITORIES, createProductRepositorySeeds, repositoryBundleReadme, repositoryReadme, socialPreview, productWorkflow } = require('../scripts/create-app-repository-seeds');

test('product repository catalogue contains exactly the ten approved products', () => {
  assert.equal(PRODUCT_REPOSITORIES.length, 10);
  assert.deepEqual(PRODUCT_REPOSITORIES.map(item => item.appId), ['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop']);
  assert.deepEqual(PRODUCT_REPOSITORIES.map(item => item.repository), [
    'Brightdesk-Pages','Brightdesk-Sheets','Brightdesk-Decks','Brightdesk-Notes',
    'Brightdesk-Database','Brightdesk-Forms','Brightdesk-Lists','Brightdesk-Planner',
    'Brightdesk-To-Do','Brightdesk-Workspace'
  ]);
});



test('generated product copy and workflow labels use approved Brightdesk wording', () => {
  assert.doesNotMatch(repositoryBundleReadme(), /\b(?:standalone|apps?)\b/i);
  for (const product of PRODUCT_REPOSITORIES) {
    const workflow = productWorkflow(product);
    const generatedCopy = [
      repositoryReadme(product),
      socialPreview(product)
    ].join('\n');
    assert.doesNotMatch(generatedCopy, /\b(?:standalone|apps?)\b/i, product.name);
    assert.ok(generatedCopy.includes(product.name), product.name);
    assert.match(workflow.split('\n')[0], new RegExp('^name: Build ' + product.name + ' desktop installers
  }
});


test('product repository seed exports a locked product package with suite source and original artwork', () => {
  const root = path.resolve(__dirname, '..');
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-product-repositories-'));
  try {
    const result = createProductRepositorySeeds({ rootDir: root, outputDir: output });
    assert.equal(result.repositories.length, 10);
    const bundleReadme = fs.readFileSync(path.join(output, 'README-START-HERE.md'), 'utf8');
    for (const item of PRODUCT_REPOSITORIES) assert.ok(bundleReadme.includes(item.repository), `bundle guide missing ${item.repository}`);
    assert.match(bundleReadme, /Brightdesk-suite remains the complete ten-product desktop suite/);
    for (const item of PRODUCT_REPOSITORIES) {
      const destination = path.join(output, item.repository);
      const pkg = JSON.parse(fs.readFileSync(path.join(destination, 'package.json'), 'utf8'));
      const lock = JSON.parse(fs.readFileSync(path.join(destination, 'package-lock.json'), 'utf8'));
      const readme = fs.readFileSync(path.join(destination, 'README.md'), 'utf8');
      const workflow = fs.readFileSync(path.join(destination, '.github', 'workflows', 'product-installers.yml'), 'utf8');
      assert.equal(pkg.name, item.packageName);
      assert.equal(pkg.brightdeskAppId, item.appId);
      assert.equal(pkg.build.appId, `org.brightdesk.${item.appId}`);
      assert.equal(pkg.build.productName, item.name);
      assert.equal(lock.name, item.packageName);
      assert.equal(lock.packages[''].name, item.packageName);
      assert.ok(pkg.scripts['dist:product:win']);
      assert.ok(pkg.scripts['dist:product:mac']);
      assert.ok(pkg.scripts['dist:product:linux']);
      assert.ok(pkg.scripts['verify:product:win']);
      assert.ok(pkg.scripts['verify:product:mac']);
      assert.ok(pkg.scripts['verify:product:linux']);
      assert.ok(readme.includes(item.name));
      assert.ok(readme.includes('assets/brightdesk-product.svg'));
      assert.ok(fs.statSync(path.join(destination, 'assets', 'brightdesk-product.svg')).size > 0);
      assert.ok(fs.statSync(path.join(destination, 'assets', 'social-preview.svg')).size > 0);
      assert.ok(readme.includes('assets/social-preview.svg'));
      assert.match(workflow, /node-version: 24\.22\.2/);
      assert.match(workflow, /npm run dist:product:\$\{\{ matrix\.platform \}\}/);
      assert.match(workflow, /npm run verify:product:\$\{\{ matrix\.platform \}\}/);
      assert.ok(fs.existsSync(path.join(destination, 'src', 'app.js')));
      assert.ok(fs.existsSync(path.join(destination, 'src', 'main.js')));
    }
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
));
    assert.match(workflow, /build_installers:[\s\S]*?default: true/);
    assert.match(workflow, /publish_release:[\s\S]*?default: false/);
  }
});


test('product repository seed exports a locked product package with suite source and original artwork', () => {
  const root = path.resolve(__dirname, '..');
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-product-repositories-'));
  try {
    const result = createProductRepositorySeeds({ rootDir: root, outputDir: output });
    assert.equal(result.repositories.length, 10);
    const bundleReadme = fs.readFileSync(path.join(output, 'README-START-HERE.md'), 'utf8');
    for (const item of PRODUCT_REPOSITORIES) assert.ok(bundleReadme.includes(item.repository), `bundle guide missing ${item.repository}`);
    assert.match(bundleReadme, /Brightdesk-suite remains the complete ten-product desktop suite/);
    for (const item of PRODUCT_REPOSITORIES) {
      const destination = path.join(output, item.repository);
      const pkg = JSON.parse(fs.readFileSync(path.join(destination, 'package.json'), 'utf8'));
      const lock = JSON.parse(fs.readFileSync(path.join(destination, 'package-lock.json'), 'utf8'));
      const readme = fs.readFileSync(path.join(destination, 'README.md'), 'utf8');
      const workflow = fs.readFileSync(path.join(destination, '.github', 'workflows', 'product-installers.yml'), 'utf8');
      assert.equal(pkg.name, item.packageName);
      assert.equal(pkg.brightdeskAppId, item.appId);
      assert.equal(pkg.build.appId, `org.brightdesk.${item.appId}`);
      assert.equal(pkg.build.productName, item.name);
      assert.equal(lock.name, item.packageName);
      assert.equal(lock.packages[''].name, item.packageName);
      assert.ok(pkg.scripts['dist:product:win']);
      assert.ok(pkg.scripts['dist:product:mac']);
      assert.ok(pkg.scripts['dist:product:linux']);
      assert.ok(pkg.scripts['verify:product:win']);
      assert.ok(pkg.scripts['verify:product:mac']);
      assert.ok(pkg.scripts['verify:product:linux']);
      assert.ok(readme.includes(item.name));
      assert.ok(readme.includes('assets/brightdesk-product.svg'));
      assert.ok(fs.statSync(path.join(destination, 'assets', 'brightdesk-product.svg')).size > 0);
      assert.ok(fs.statSync(path.join(destination, 'assets', 'social-preview.svg')).size > 0);
      assert.ok(readme.includes('assets/social-preview.svg'));
      assert.match(workflow, /node-version: 24\.22\.2/);
      assert.match(workflow, /npm run dist:product:\$\{\{ matrix\.platform \}\}/);
      assert.match(workflow, /npm run verify:product:\$\{\{ matrix\.platform \}\}/);
      assert.ok(fs.existsSync(path.join(destination, 'src', 'app.js')));
      assert.ok(fs.existsSync(path.join(destination, 'src', 'main.js')));
    }
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
