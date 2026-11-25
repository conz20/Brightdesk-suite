'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { DictionaryService } = require('../src/dictionary-service');

test('customer dictionary installs remain blocked until an official Brightdesk pack is released', async () => {
  const userData = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-dictionary-official-only-'));
  let networkCalls = 0;
  const service = new DictionaryService(userData, {
    fetch: async () => {
      networkCalls += 1;
      throw new Error('the customer dictionary service must not call a third-party host');
    }
  });

  try {
    await assert.rejects(
      () => service.installCatalogueEntry('en-au'),
      /Brightdesk-hosted spelling dictionary packs are not available yet/
    );
    assert.deepEqual(service.catalogue(), []);
    assert.equal(service.fetchUpstreamFile, undefined);
    assert.equal(networkCalls, 0);
  } finally {
    await fs.rm(userData, { recursive: true, force: true });
  }
});
