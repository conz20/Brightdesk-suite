'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  PRODUCT_REPOSITORIES,
  createProductRepositorySeeds,
  repositoryBundleReadme,
  repositoryReadme,
  socialPreview,
  productWorkflow
} = require('../scripts/create-app-repository-seeds');

test('product repository catalogue contains exactly the ten approved products', () => {
  assert.equal(PRODUCT_REPOSITORIES.length, 10);
  assert.deepEqual(PRODUCT_REPOSITORIES.map(item => item.appId), [
    'pages', 'sheets', 'slides', 'notes', 'database',
    'forms', 'lists', 'planner', 'todo', 'loop'
  ]);
  assert.deepEqual(PRODUCT_REPOSITORIES.map(item => item.repository), [
    'Brightdesk-Pages', 'Brightdesk-Sheets', 'Brightdesk-Decks', 'Brightdesk-Notes',
    'Brightdesk-Database', 'Brightdesk-Forms', 'Brightdesk-Lists', 'Brightdesk-Planner',
    'Brightdesk-To-Do', 'Brightdesk-Workspace'
  ]);
});

test('generated customer copy uses approved product wording', () => {
  assert.doesNotMatch(repositoryBundleReadme(), /\b(?:standalone|apps?)\b/i);
  for (const product of PRODUCT_REPOSITORIES) {
    const generatedCopy = [
      repositoryReadme(product),
      socialPreview(product)
    ].join('\n');
    assert.doesNotMatch(generatedCopy, /\b(?:standalone|apps?)\b/i, product.name);
    assert.ok(generatedCopy.includes(product.name), product.name);
    const workflow = productWorkflow(product);
    assert.equal(
      workflow.split('\n')[0],
      'name: Build ' + product.name + ' desktop installers'
    );
    assert.match(workflow, /build_installers:[\s\S]*?default: true/);
    assert.match(workflow, /publish_release:[\s\S]*?default: false/);
    assert.match(workflow, /needs: test/);
    assert.match(workflow, /needs: build/);
    assert.ok(workflow.includes("cron: '17 4 * * *'"));
    assert.match(workflow, /npm run lock:verify/);
    assert.match(workflow, /npm run verify:licenses/);
    assert.match(workflow, /npm test/);
    assert.match(workflow, /npm run release:preflight/);
    assert.match(workflow, /npm audit --audit-level=high/);
  }
});

test('product repository generation creates ten locked product folders with original artwork and release checks', () => {
  const root = path.resolve(__dirname, '..');
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-product-repositories-'));
  try {
    const result = createProductRepositorySeeds({ rootDir: root, outputDir: output });
    assert.equal(result.repositories.length, 10);
    const bundleReadme = fs.readFileSync(path.join(output, 'README-START-HERE.md'), 'utf8');
    assert.match(bundleReadme, /Brightdesk-suite remains the complete ten-product desktop suite/);
    for (const product of PRODUCT_REPOSITORIES) {
      const destination = path.join(output, product.repository);
      const pkg = JSON.parse(fs.readFileSync(path.join(destination, 'package.json'), 'utf8'));
      const lock = JSON.parse(fs.readFileSync(path.join(destination, 'package-lock.json'), 'utf8'));
      const readme = fs.readFileSync(path.join(destination, 'README.md'), 'utf8');
      const workflow = fs.readFileSync(path.join(destination, '.github', 'workflows', 'product-installers.yml'), 'utf8');
      const dependabot = fs.readFileSync(path.join(destination, '.github', 'dependabot.yml'), 'utf8');
      const metadata = fs.readFileSync(path.join(destination, 'REPOSITORY_INFO.md'), 'utf8');

      assert.equal(pkg.name, product.packageName);
      assert.equal(pkg.brightdeskAppId, product.appId);
      assert.equal(pkg.build.appId, 'org.brightdesk.' + product.appId);
      assert.equal(pkg.build.productName, product.name);
      assert.match(pkg.scripts.test, /node --test/);
      for (const file of [
        'tests/app-repository-seeds.test.js',
        'tests/integrated-app-shell.test.js',
        'tests/release-readiness.test.js',
        'tests/standalone-downloads.test.js'
      ]) assert.ok(pkg.scripts.test.includes(file), 'product test suite includes ' + file);
      assert.doesNotMatch(pkg.scripts.test, /tests\/app-catalog\.test\.js|tests\/release-workflows\.test\.js/);
      assert.equal(lock.name, product.packageName);
      assert.equal(lock.packages[''].name, product.packageName);
      for (const platform of ['win', 'mac', 'linux']) {
        assert.ok(pkg.scripts['dist:product:' + platform]);
        assert.ok(pkg.scripts['verify:product:' + platform]);
        assert.ok(workflow.includes('npm run dist:product:${{ matrix.platform }}'));
        assert.ok(workflow.includes('npm run verify:product:${{ matrix.platform }}'));
      }
      assert.ok(readme.includes(product.name));
      assert.ok(readme.includes('assets/brightdesk-product.svg'));
      assert.doesNotMatch(readme, /\b(?:standalone|apps?)\b/i);
      assert.match(readme, /same checks repeat daily/i);
      assert.match(readme, /Dependabot checks npm packages and GitHub Actions weekly/i);
      assert.match(readme, /Publishing a GitHub Release is a separate manual choice/);
      assert.doesNotMatch(metadata, /\b(?:standalone|apps?)\b/i);
      assert.ok(fs.statSync(path.join(destination, 'assets', 'brightdesk-product.svg')).size > 0);
      assert.ok(fs.statSync(path.join(destination, 'assets', 'social-preview.svg')).size > 0);
      assert.ok(readme.includes('assets/social-preview.svg'));
      assert.match(workflow, /node-version: 24\.22\.2/);
      assert.match(workflow, /name: Build Brightdesk .* desktop installers/);
      assert.match(dependabot, /package-ecosystem: npm/);
      assert.match(dependabot, /package-ecosystem: github-actions/);
      assert.equal((dependabot.match(/interval: weekly/g) || []).length, 2);
      assert.ok(fs.existsSync(path.join(destination, 'src', 'app.js')));
      assert.ok(fs.existsSync(path.join(destination, 'src', 'main.js')));
    }
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});
