'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { DictionaryService, dictionaryCatalogue } = require('../src/dictionary-service');

test('third-party source metadata stays internal and is not exposed as downloadable packs', () => {
  const service = new DictionaryService('/tmp/brightdesk-dictionary-delivery-policy');
  assert.equal(dictionaryCatalogue.entries.length, 92, 'keep the pinned source research for provenance');
  assert.deepEqual(service.catalogue(), [], 'no third-party catalogue entries are customer-downloadable');
});

test('catalogue installation refuses downloads until verified Brightdesk-hosted packs exist', async () => {
  let networkCalls = 0;
  const service = new DictionaryService('/tmp/brightdesk-dictionary-delivery-policy', {
    fetch: async () => { networkCalls += 1; throw new Error('third-party request must never run'); }
  });
  await assert.rejects(
    () => service.installCatalogueEntry('bg'),
    /Brightdesk-hosted spelling dictionary packs are not available yet/
  );
  assert.equal(networkCalls, 0, 'a customer action must never contact the third-party dictionary host');
});

test('the customer dictionary service does not provide a third-party file downloader', () => {
  const service = new DictionaryService('/tmp/brightdesk-dictionary-delivery-policy');
  assert.equal(service.fetchUpstreamFile, undefined);
});

test('the UI preload has no third-party dictionary catalogue or install bridge', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const preload = fs.readFileSync(path.join(__dirname, '..', 'src', 'preload.js'), 'utf8');
  const main = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.js'), 'utf8');
  assert.doesNotMatch(preload, /listDictionaryCatalogue|installCatalogueDictionary/);
  assert.doesNotMatch(main, /dictionaries:catalog|dictionaries:install-catalog/);
});

test('spelling manager explains the official-pack release gate without advertising third-party downloads', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.html'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
  assert.match(html, /Brightdesk-hosted dictionary packs/);
  assert.match(html, /Third-party dictionary downloads are disabled/);
  assert.doesNotMatch(html, /Browse the 92 language and regional variants/);
  assert.doesNotMatch(app, /Downloading .*pinned open-source source/);
});
