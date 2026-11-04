'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { DictionaryService } = require('../src/dictionary-service');

const LIVE = process.env.BRIGHTDESK_LIVE_DICT_TESTS === '1';

let dependenciesPresent = true;
try {
  require.resolve('nspell');
  require.resolve('jszip');
} catch { dependenciesPresent = false; }

const skip = !LIVE
  ? 'set BRIGHTDESK_LIVE_DICT_TESTS=1 to run network-backed dictionary integration'
  : !dependenciesPresent
    ? 'nspell/jszip not installed; run npm ci first'
    : false;

test('a real catalogue dictionary installs from the pinned upstream and spells correctly', { skip, timeout: 180_000 }, async () => {
  const userData = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-live-dict-'));
  const service = new DictionaryService(userData);
  try {
    const result = await service.installCatalogueEntry('en-au');
    assert.equal(result.locale, 'en-AU');
    assert.equal(result.alreadyInstalled, false);

    const installed = await service.installed();
    assert.ok(installed.some(entry => entry.locale === 'en-AU'), 'installed() must list the freshly installed dictionary');
    const entry = installed.find(item => item.locale === 'en-AU');
    assert.equal(entry.protected, true);
    assert.match(entry.sourceUrl, /^https:\/\/github\.com\/wooorm\/dictionaries\/8cfea406b505e4d7df52d5a19bce525df98c54ab\/dictionaries\/en-AU$/);

    const spelling = await service.checkText('en-AU', 'The quick brown xyzzyplugh jumps over the lazy dog.');
    assert.ok(
      spelling.misspellings.some(item => item.word.toLowerCase() === 'xyzzyplugh'),
      'expected xyzzyplugh to be flagged as a misspelling by the real nspell engine'
    );
    assert.ok(
      spelling.misspellings.every(item => item.word.toLowerCase() !== 'quick'),
      'quick must not be reported as a misspelling'
    );

    const again = await service.installCatalogueEntry('en-au');
    assert.equal(again.alreadyInstalled, true);
    assert.equal(again.integrityVerified, true);
  } finally {
    const dicts = path.join(userData, 'dictionaries');
    try {
      for (const name of await fs.readdir(dicts)) {
        const dir = path.join(dicts, name);
        await fs.chmod(dir, 0o755).catch(() => {});
        for (const file of await fs.readdir(dir).catch(() => [])) {
          await fs.chmod(path.join(dir, file), 0o644).catch(() => {});
        }
      }
    } catch { /* nothing installed */ }
    await fs.rm(userData, { recursive: true, force: true });
  }
});
