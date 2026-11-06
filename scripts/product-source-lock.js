'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const DEFAULT_ROOT = path.resolve(__dirname, '..');
const LOCK_PATH = path.join('docs', 'PRODUCT_SOURCE_LOCK.json');

function calculateGitBlobSha(input) {
  const bytes = Buffer.isBuffer(input) ? input : Buffer.from(String(input), 'utf8');
  const header = Buffer.from(`blob ${bytes.length}\0`, 'utf8');
  return crypto.createHash('sha1').update(header).update(bytes).digest('hex');
}

function resolveRepositoryFile(root, relativePath) {
  if (typeof relativePath !== 'string' || !relativePath.trim() || path.isAbsolute(relativePath)) {
    throw new TypeError('Product source paths must be repository-relative.');
  }

  const resolvedRoot = path.resolve(root);
  const resolvedFile = path.resolve(resolvedRoot, relativePath);
  const relative = path.relative(resolvedRoot, resolvedFile);
  if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new TypeError('Product source paths must stay repository-relative.');
  }
  return resolvedFile;
}

function loadProductSourceLock(root = DEFAULT_ROOT) {
  const file = resolveRepositoryFile(root, LOCK_PATH);
  let lock;
  try {
    lock = JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error('Unable to read the Brightdesk product source lock.', { cause: error });
  }

  if (!lock || lock.schemaVersion !== 1 || !Array.isArray(lock.products) || lock.products.length === 0) {
    throw new TypeError('The Brightdesk product source lock must contain version 1 and at least one product.');
  }

  const ids = new Set();
  const suitePaths = new Set();
  for (const product of lock.products) {
    if (!product || typeof product.id !== 'string' || !product.id.trim() ||
        typeof product.name !== 'string' || !product.name.trim() ||
        typeof product.repository !== 'string' || !/^connormolloy12\/Brightdesk-[A-Za-z-]+$/.test(product.repository) ||
        typeof product.sourceRef !== 'string' || !product.sourceRef.trim() ||
        typeof product.sourcePath !== 'string' || !product.sourcePath.trim() ||
        typeof product.suitePath !== 'string' || !product.suitePath.trim() ||
        typeof product.sourceBlobSha !== 'string' || !/^[0-9a-f]{40}$/.test(product.sourceBlobSha)) {
      throw new TypeError('Each product source lock entry must include valid repository, source path and Git blob SHA metadata.');
    }
    if (ids.has(product.id) || suitePaths.has(product.suitePath)) {
      throw new TypeError('Product source lock entries must have unique IDs and Suite paths.');
    }
    ids.add(product.id);
    suitePaths.add(product.suitePath);
    resolveRepositoryFile(root, product.sourcePath);
    resolveRepositoryFile(root, product.suitePath);
  }
  return lock;
}

function verifyProductSourceLock({ root = DEFAULT_ROOT } = {}) {
  const lock = loadProductSourceLock(root);
  const products = lock.products.map(product => {
    const file = resolveRepositoryFile(root, product.suitePath);
    let bytes;
    try {
      bytes = fs.readFileSync(file);
    } catch (error) {
      throw new Error(`Missing vendored source for ${product.name}: ${product.suitePath}`, { cause: error });
    }
    const actualBlobSha = calculateGitBlobSha(bytes);
    if (actualBlobSha !== product.sourceBlobSha) {
      throw new Error(
        `Product source parity mismatch for ${product.name}: expected ${product.sourceBlobSha}, received ${actualBlobSha}.`
      );
    }
    return {
      id: product.id,
      name: product.name,
      repository: product.repository,
      sourceRef: product.sourceRef,
      sourcePath: product.sourcePath,
      suitePath: product.suitePath,
      sourceBlobSha: product.sourceBlobSha,
      verified: true
    };
  });
  return { verifiedCount: products.length, products };
}

module.exports = {
  calculateGitBlobSha,
  loadProductSourceLock,
  verifyProductSourceLock
};
