'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { DictionaryService } = require('../src/dictionary-service');

test('catalogue entries not packaged with Brightdesk never trigger a live network request', async () => {
  const userData = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-dictionary-no-network-'));
  let networkCalls = 0;
  const service = new DictionaryService(userData, {
    fetch: async () => {
      networkCalls += 1;
      throw new Error('unexpected live network request');
    }
  });
  try {
    await assert.rejects(
      () => service.installCatalogueEntry('en-au'),
      /not included in this Brightdesk build/
    );
    assert.equal(networkCalls, 0);
  } finally {
    await fs.rm(userData, { recursive: true, force: true });
  }
});
