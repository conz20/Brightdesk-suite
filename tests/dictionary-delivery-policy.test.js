'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { DictionaryService, dictionaryCatalogue } = require('../src/dictionary-service');

test('the 92-entry source snapshot remains internal to the main process', () => {
  const service = new DictionaryService('/tmp/brightdesk-dictionary-delivery-policy');
  assert.equal(dictionaryCatalogue.entries.length, 92);
  assert.equal(service.catalogue().length, 92);
});

test('an unbundled dictionary install makes no network request', async () => {
  const service = new DictionaryService('/tmp/brightdesk-dictionary-delivery-policy');
  const originalFetch = globalThis.fetch;
  let networkCalls = 0;
  globalThis.fetch = async () => {
    networkCalls += 1;
    throw new Error('customer dictionary code must not contact third-party hosts');
  };
  try {
    await assert.rejects(
      () => service.installCatalogueEntry('en-au'),
      /not included in this Brightdesk build/
    );
    assert.equal(service.fetchUpstreamFile, undefined);
    assert.equal(networkCalls, 0);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('the renderer cannot access dictionary catalogue or install IPC routes', () => {
  const main = fs.readFileSync(path.join(__dirname, '..', 'src', 'main.js'), 'utf8');
  const preload = fs.readFileSync(path.join(__dirname, '..', 'src', 'preload.js'), 'utf8');
  const app = fs.readFileSync(path.join(__dirname, '..', 'src', 'app.js'), 'utf8');
  const html = fs.readFileSync(path.join(__dirname, '..', 'src', 'index.html'), 'utf8');
  const service = fs.readFileSync(path.join(__dirname, '..', 'src', 'dictionary-service.js'), 'utf8');
  for (const forbidden of ['dictionaries:catalog', 'dictionaries:install-catalog']) assert.equal(main.includes(forbidden), false);
  for (const forbidden of ['listDictionaryCatalogue', 'installCatalogueDictionary']) assert.equal(preload.includes(forbidden), false);
  for (const forbidden of ['listDictionaryCatalogue', 'installCatalogueDictionary', 'fetchUpstreamFile', 'dictionary-search']) assert.equal(app.includes(forbidden), false);
  assert.equal(/async fetchUpstreamFiles*(/.test(service), false);
  assert.equal(/this.fetchs*=|this.fetchs*(/.test(service), false);
  assert.match(html, /Third-party dictionary downloads are disabled/);
  assert.doesNotMatch(html, /Browse the 92 language and regional variants|available-dictionary-grid|dictionary-search/);
});
