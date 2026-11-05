'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {
  calculateGitBlobSha,
  loadProductSourceLock,
  verifyProductSourceLock
} = require('../scripts/product-source-lock');

test('the product source lock records Lists against its individual repository source', () => {
  const lock = loadProductSourceLock();
  assert.equal(lock.schemaVersion, 1);
  assert.equal(lock.products.length, 1);
  assert.deepEqual(
    {
      id: lock.products[0].id,
      name: lock.products[0].name,
      repository: lock.products[0].repository,
      sourceRef: lock.products[0].sourceRef,
      sourcePath: lock.products[0].sourcePath,
      suitePath: lock.products[0].suitePath,
      sourceBlobSha: lock.products[0].sourceBlobSha
    },
    {
      id: 'lists',
      name: 'Brightdesk Lists',
      repository: 'connormolloy12/Brightdesk-Lists',
      sourceRef: 'main',
      sourcePath: 'src/lists-service.js',
      suitePath: 'src/lists-service.js',
      sourceBlobSha: 'ae3aebadd3194af4846c80fe58a2f1c98c88c57f'
    }
  );
});

test('the vendored Lists service exactly matches the pinned upstream Git blob', () => {
  const result = verifyProductSourceLock();
  assert.equal(result.verifiedCount, 1);
  assert.equal(result.products[0].id, 'lists');
  assert.equal(result.products[0].verified, true);
  assert.equal(
    calculateGitBlobSha(Buffer.from('hello\n', 'utf8')),
    'ce013625030ba8dba906f756967f9e9ca394464a'
  );
});

test('the source parity check rejects a changed vendored product module', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-source-lock-'));
  try {
    fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
    fs.mkdirSync(path.join(root, 'src'), { recursive: true });
    fs.writeFileSync(path.join(root, 'src', 'lists-service.js'), 'changed source\n');
    fs.writeFileSync(
      path.join(root, 'docs', 'PRODUCT_SOURCE_LOCK.json'),
      JSON.stringify({
        schemaVersion: 1,
        products: [{
          id: 'lists',
          name: 'Brightdesk Lists',
          repository: 'connormolloy12/Brightdesk-Lists',
          sourceRef: 'main',
          sourcePath: 'src/lists-service.js',
          suitePath: 'src/lists-service.js',
          sourceBlobSha: 'ae3aebadd3194af4846c80fe58a2f1c98c88c57f'
        }]
      })
    );
    assert.throws(
      () => verifyProductSourceLock({ root }),
      /source parity mismatch/i
    );
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the source parity check rejects paths outside the repository', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-source-lock-path-'));
  try {
    fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
    fs.writeFileSync(
      path.join(root, 'docs', 'PRODUCT_SOURCE_LOCK.json'),
      JSON.stringify({
        schemaVersion: 1,
        products: [{
          id: 'lists',
          name: 'Brightdesk Lists',
          repository: 'connormolloy12/Brightdesk-Lists',
          sourceRef: 'main',
          sourcePath: '../private.js',
          suitePath: '../private.js',
          sourceBlobSha: 'ae3aebadd3194af4846c80fe58a2f1c98c88c57f'
        }]
      })
    );
    assert.throws(() => verifyProductSourceLock({ root }), /repository-relative/i);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
