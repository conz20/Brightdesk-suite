'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  PRODUCT_IDS,
  PRODUCT_ARTIFACTS,
  verifyProductArtifacts
} = require('../scripts/verify-product-artifacts');

function createReleaseFixture(platform, missingProduct = null) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-products-'));
  for (const product of PRODUCT_IDS) {
    if (product === missingProduct) continue;
    const directory = path.join(root, 'apps', `org.brightdesk.${product}`);
    fs.mkdirSync(directory, { recursive: true });
    for (const extension of PRODUCT_ARTIFACTS[platform]) {
      const slugs = { pages:'pages', sheets:'sheets', slides:'decks', notes:'notes', database:'database', forms:'forms', lists:'lists', planner:'planner', todo:'to-do', loop:'workspace' };
      const names = { pages:'Pages', sheets:'Sheets', slides:'Decks', notes:'Notes', database:'Database', forms:'Forms', lists:'Lists', planner:'Planner', todo:'To-Do', loop:'Workspace' };
      const name = platform === 'linux'
        ? `brightdesk-${slugs[product]}-0.1.0-x64.${extension}`
        : `Brightdesk-${names[product]}-0.1.0-${platform==='mac'?'universal':'x64'}.${extension}`;
      fs.writeFileSync(path.join(directory, name), `fixture:${product}:${extension}`);
    }
  }
  return root;
}

for (const platform of ['win', 'mac', 'linux']) {
  test(`${platform}: product artifact verification requires all ten packages and expected formats`, () => {
    const directory = createReleaseFixture(platform);
    try {
      const result = verifyProductArtifacts({ directory, platform, version: '0.1.0' });
      assert.equal(result.platform, platform);
      assert.equal(result.productCount, 10);
      assert.equal(result.files.length, 10 * PRODUCT_ARTIFACTS[platform].length);
      assert.ok(fs.statSync(result.checksumFile).size > 0);
    } finally {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });
}

test('product artifact verification fails when any approved application package is missing', () => {
  const directory = createReleaseFixture('win', 'planner');
  try {
    assert.throws(
      () => verifyProductArtifacts({ directory, platform: 'win', version: '0.1.0' }),
      /planner.*missing/i
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('product artifact verification rejects empty packages', () => {
  const directory = createReleaseFixture('win');
  const file = path.join(directory, 'apps', 'org.brightdesk.pages', 'Brightdesk-Pages-0.1.0-x64.exe');
  fs.writeFileSync(file, '');
  try {
    assert.throws(
      () => verifyProductArtifacts({ directory, platform: 'win', version: '0.1.0' }),
      /empty product artifact/i
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
