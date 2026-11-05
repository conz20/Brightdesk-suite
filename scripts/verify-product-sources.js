'use strict';

const { verifyProductSourceLock } = require('./product-source-lock');

try {
  const result = verifyProductSourceLock();
  for (const product of result.products) {
    process.stdout.write(`Verified ${product.name}: ${product.repository}@${product.sourceRef} ${product.sourcePath} -> ${product.suitePath}\n`);
  }
  const moduleLabel = result.verifiedCount === 1 ? 'module' : 'modules';
  process.stdout.write(`Verified ${result.verifiedCount} pinned product source ${moduleLabel}.\n`);
} catch (error) {
  process.stderr.write(`Product source verification failed: ${error.message}\n`);
  process.exitCode = 1;
}
