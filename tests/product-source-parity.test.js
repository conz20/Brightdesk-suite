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


test('the source parity check rejects upstream paths outside the repository', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-upstream-path-'));
  try {
    fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
    fs.mkdirSync(path.join(root, 'src'), { recursive: true });
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
          suitePath: 'src/lists-service.js',
          sourceBlobSha: 'ae3aebadd3194af4846c80fe58a2f1c98c88c57f'
        }]
      })
    );
    assert.throws(() => verifyProductSourceLock({ root }), /repository-relative/i);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('the product source lock records all eleven pinned modules across eight product repositories', () => {
  const lock = loadProductSourceLock();
  assert.equal(lock.schemaVersion, 1);
  assert.equal(lock.products.length, 11);
  const actualProducts = lock.products.map(product => ({
    id: product.id,
    name: product.name,
    repository: product.repository,
    sourceRef: product.sourceRef,
    sourcePath: product.sourcePath,
    suitePath: product.suitePath,
    sourceBlobSha: product.sourceBlobSha
  })).sort((a, b) => a.id.localeCompare(b.id));
  const expectedProducts = [
      {
        id: 'database-service',
        name: 'Brightdesk Database service',
        repository: 'connormolloy12/Brightdesk-Database',
        sourceRef: '46d0feeb9e7110c2025857b6a2d145eeed06d40a',
        sourcePath: 'src/database-service.js',
        suitePath: 'src/database-service.js',
        sourceBlobSha: 'd879ab20878c3ed838cf6cf56020fd3c4695834b'
      },
      {
        id: 'database-workspace',
        name: 'Brightdesk Database workspace',
        repository: 'connormolloy12/Brightdesk-Database',
        sourceRef: '46d0feeb9e7110c2025857b6a2d145eeed06d40a',
        sourcePath: 'src/database-workspace.js',
        suitePath: 'src/database-workspace.js',
        sourceBlobSha: 'f7ba29971887321b931bdc013291d90c502a5e0b'
      },
      {
        id: 'lists',
        name: 'Brightdesk Lists',
        repository: 'connormolloy12/Brightdesk-Lists',
        sourceRef: 'main',
        sourcePath: 'src/lists-service.js',
        suitePath: 'src/lists-service.js',
        sourceBlobSha: 'ae3aebadd3194af4846c80fe58a2f1c98c88c57f'
      },
      {
        id: 'todo',
        name: 'Brightdesk To Do',
        repository: 'connormolloy12/Brightdesk-To-Do',
        sourceRef: 'main',
        sourcePath: 'src/todo-service.js',
        suitePath: 'src/todo-service.js',
        sourceBlobSha: '34e048b651dfdd50cb8b3292c660e1dbd57fe7f8'
      },
      {
        id: 'planner-service',
        name: 'Brightdesk Planner service',
        repository: 'connormolloy12/Brightdesk-Planner',
        sourceRef: 'main',
        sourcePath: 'src/planner-service.js',
        suitePath: 'src/planner-service.js',
        sourceBlobSha: '6b05218a71f0f0d63beebdf20decae5ea112f7fc'
      },
      {
        id: 'pages-layout',
        name: 'Brightdesk Pages page layout',
        repository: 'connormolloy12/Brightdesk-Pages',
        sourceRef: 'main',
        sourcePath: 'src/page-layout.js',
        suitePath: 'src/page-layout.js',
        sourceBlobSha: '9777090bbbd01fee1b2789c703619dc8faa87859'
      },
      {
        id: 'sheets-formula',
        name: 'Brightdesk Sheets formula engine',
        repository: 'connormolloy12/Brightdesk-Sheets',
        sourceRef: 'main',
        sourcePath: 'src/formula.js',
        suitePath: 'src/formula.js',
        sourceBlobSha: '4b75569239c9834308f77815392b98d7371ea459'
      },
      {
        id: 'forms-service',
        name: 'Brightdesk Forms service',
        repository: 'connormolloy12/Brightdesk-Forms',
        sourceRef: 'main',
        sourcePath: 'src/forms-service.js',
        suitePath: 'src/forms-service.js',
        sourceBlobSha: 'd925764977a79ec6b7d79af5e1a0d6e08ab9d8e4'
      },
      {
        id: 'forms-workspace',
        name: 'Brightdesk Forms workspace',
        repository: 'connormolloy12/Brightdesk-Forms',
        sourceRef: '0960d0ceee9e00bc7f0f78a053289c3d4d3699ce',
        sourcePath: 'src/forms-workspace.js',
        suitePath: 'src/forms-workspace.js',
        sourceBlobSha: '642b39a353016b575a8f7b9ed624a00bb060ceb2'
      },

      {
        id: 'workspace-editor',
        name: 'Brightdesk Workspace editor',
        repository: 'connormolloy12/Brightdesk-Workspace',
        sourceRef: 'main',
        sourcePath: 'src/workspace-editor.js',
        suitePath: 'src/workspace-editor.js',
        sourceBlobSha: '2cd96b879c7b90da1df66dee7fc2a2c319b53781'
      },
      {
        id: 'workspace-service',
        name: 'Brightdesk Workspace service',
        repository: 'connormolloy12/Brightdesk-Workspace',
        sourceRef: 'main',
        sourcePath: 'src/workspace-service.js',
        suitePath: 'src/workspace-service.js',
        sourceBlobSha: 'a5a73ac3b727064f43fde0a14320fe2f594a5ba7'
      }
    ].sort((a, b) => a.id.localeCompare(b.id));
  assert.deepEqual(actualProducts, expectedProducts);
});

test('the eleven vendored product feature modules match their pinned upstream Git blobs', () => {
  const result = verifyProductSourceLock();
  assert.equal(result.verifiedCount, 11);
  assert.deepEqual(
    result.products.map(product => product.id).sort(),
    ['database-service', 'database-workspace', 'forms-service', 'forms-workspace', 'lists', 'pages-layout', 'planner-service', 'sheets-formula', 'todo', 'workspace-editor', 'workspace-service']
  );
  assert.ok(result.products.every(product => product.verified));
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
