'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { DictionaryService } = require('../src/dictionary-service');

test('unbuilt dictionary catalogue entries cannot download from third-party hosts', async () => {
  let networkCalls = 0;
  const service = new DictionaryService('/tmp/brightdesk-dictionary-official-only-live-test', {
    fetch: async () => {
      networkCalls += 1;
      throw new Error('third-party dictionary network access must remain disabled');
    }
  });
  assert.equal(typeof service.fetchUpstreamFile, 'undefined');
  const catalogue = service.catalogue();
  assert.equal(catalogue.length, 92);
  assert.ok(catalogue.every(item => item.packStatus === 'not-built' && item.downloadAvailable === false));
  await assert.rejects(
    () => service.installCatalogueEntry('en-au'),
    /not yet available through official Brightdesk resources/
  );
  assert.equal(networkCalls, 0);
});
