const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const {
  DictionaryService,
  validateDictionaryManifest,
  validateLicenseExpression,
  decodeHunspellFiles,
  dictionaryCatalogue
} = require('../src/dictionary-service');

function sourceEntry(id) {
  const entry = dictionaryCatalogue.entries.find(item => item.id === id);
  if (!entry) throw new Error('Missing source metadata fixture: ' + id);
  const revision = dictionaryCatalogue.catalogueRevision;
  return {
    ...entry,
    sourceUrl: `https://github.com/wooorm/dictionaries/tree/${revision}/dictionaries/${entry.sourceFolder}`,
    licenseUrl: entry.licenseSource?.url || `https://raw.githubusercontent.com/wooorm/dictionaries/${revision}/dictionaries/${entry.sourceFolder}/license`,
    licenseSource: entry.licenseSource || { kind: 'dictionary-package-license', repository: 'wooorm/dictionaries', revision },
    upstream: 'wooorm/dictionaries',
    upstreamRevision: revision
  };
}

const manifest = {
  schemaVersion: 1,
  locale: 'en-AU',
  name: 'English (Australia)',
  nativeName: 'English (Australia)',
  authors: 'Example authors; replace with the real upstream attribution.',
  affFile: 'en_AU.aff',
  dicFile: 'en_AU.dic',
  licenseFile: 'LICENSE.txt',
  license: 'LGPL-2.1-only',
  licenseUrl: 'https://example.org/LICENSE.txt',
  sourceUrl: 'https://example.org/dictionary'
};

test('dictionary manifest accepts a valid language, source and open licence', () => {
  assert.equal(validateDictionaryManifest({ ...manifest }).locale, 'en-AU');
  assert.equal(validateLicenseExpression('MPL-1.1 OR GPL-2.0-or-later OR LGPL-2.1-or-later'), 'MPL-1.1 OR GPL-2.0-or-later OR LGPL-2.1-or-later');
  assert.equal(validateDictionaryManifest({ ...manifest, readmeFile: 'UPSTREAM_README.md' }).readmeFile, 'UPSTREAM_README.md');
});

test('dictionary manifest rejects unsafe paths, missing attribution and unknown licences', () => {
  assert.throws(() => validateDictionaryManifest({ ...manifest, affFile: '../outside.aff' }), /simple file name/);
  assert.throws(() => validateDictionaryManifest({ ...manifest, authors: '' }), /authors/);
  assert.throws(() => validateDictionaryManifest({ ...manifest, license: 'Proprietary' }), /approved free\/open-source/);
  assert.throws(() => validateDictionaryManifest({ ...manifest, sourceUrl: 'http://example.org/dictionary' }), /HTTPS/);
  assert.throws(() => validateDictionaryManifest({ ...manifest, readmeFile: '../README.md' }), /simple file name/);
  assert.throws(() => validateDictionaryManifest({ ...manifest, readmeFile: 'LICENSE.txt' }), /different names/);
});

test('Hunspell text decoding follows the encoding declared in the affix file', () => {
  const aff = new TextEncoder().encode('SET UTF-8\nSFX S Y 1\n');
  const dic = new TextEncoder().encode('1\ncafé\n');
  const decoded = decodeHunspellFiles(aff, dic);
  assert.equal(decoded.encoding, 'utf-8');
  assert.match(decoded.dic, /café/);
});

test('offline spell check groups repeated misspellings and supplies suggestions', async () => {
  const userData = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-dictionary-test-'));
  const service = new DictionaryService(userData, {
    spellFactory: () => ({
      correct: word => ['correct', 'and'].includes(word.toLowerCase()),
      suggest: word => word.toLowerCase() === 'wrng' ? ['wrong'] : []
    })
  });
  const catalogueEntry = sourceEntry('en-AU');
  const dictionaryFolder = path.join(userData, 'dictionaries', catalogueEntry.locale);
  await fs.mkdir(dictionaryFolder, { recursive: true });
  const affText = 'SET UTF-8\n';
  const dicText = '1\ncorrect\n';
  const licenseText = 'This is a test copy of the approved licence text for catalogue test purposes.';
  const readmeText = 'This is a test copy of the upstream attribution and contributor record.';
  const hash = value => crypto.createHash('sha256').update(value).digest('hex');
  const trustedManifest = {
    schemaVersion: 1,
    catalogueId: catalogueEntry.id,
    locale: catalogueEntry.locale,
    name: catalogueEntry.name,
    nativeName: catalogueEntry.nativeName,
    authors: 'See UPSTREAM_README.md for original authors and contributors.',
    affFile: 'index.aff', dicFile: 'index.dic', licenseFile: 'LICENSE.txt', readmeFile: 'UPSTREAM_README.md',
    license: catalogueEntry.license, licenseUrl: catalogueEntry.licenseUrl,
    licenseSource: catalogueEntry.licenseSource,
    sourceUrl: catalogueEntry.sourceUrl,
    upstream: catalogueEntry.upstream,
    upstreamRevision: catalogueEntry.upstreamRevision,
    integrity: { aff: hash(affText), dic: hash(dicText), license: hash(licenseText), readme: hash(readmeText) }
  };
  await fs.writeFile(path.join(dictionaryFolder, 'manifest.json'), JSON.stringify(trustedManifest));
  await fs.writeFile(path.join(dictionaryFolder, 'dictionary.aff'), affText);
  await fs.writeFile(path.join(dictionaryFolder, 'dictionary.dic'), dicText);
  await fs.writeFile(path.join(dictionaryFolder, 'LICENSE.txt'), licenseText);
  await fs.writeFile(path.join(dictionaryFolder, 'UPSTREAM_README.md'), readmeText);
  try {
    const result = await service.checkText('en-AU', 'Correct wrng and wrng.');
    assert.equal(result.misspellingCount, 1);
    assert.equal(result.misspellings[0].word, 'wrng');
    assert.equal(result.misspellings[0].occurrences, 2);
    assert.deepEqual(result.misspellings[0].suggestions, ['wrong']);
    await fs.chmod(path.join(dictionaryFolder, 'dictionary.dic'), 0o644);
    await fs.writeFile(path.join(dictionaryFolder, 'dictionary.dic'), '1\nchanged\n');
    service.cache.clear();
    await assert.rejects(() => service.checkText('en-AU', 'changed'), /has changed/);
  } finally {
    await fs.chmod(dictionaryFolder, 0o700).catch(() => {});
    await fs.rm(userData, { recursive: true, force: true });
  }
});


test('the 92-entry source snapshot remains internal and is not exposed as downloadable packs', () => {
  assert.equal(dictionaryCatalogue.entries.length, 92);
  assert.equal(new Set(dictionaryCatalogue.entries.map(entry => entry.id)).size, 92);
  assert.equal(new Set(dictionaryCatalogue.entries.map(entry => entry.locale)).size, 92);
  for (const entry of dictionaryCatalogue.entries) {
    assert.ok(entry.name && entry.nativeName && entry.locale);
    assert.equal(validateLicenseExpression(entry.license), entry.license);
  }
  assert.equal(dictionaryCatalogue.catalogueRevision, '8cfea406b505e4d7df52d5a19bce525df98c54ab');
  assert.equal(dictionaryCatalogue.catalogueSnapshotDate, '2024-09-09');
  assert.equal(dictionaryCatalogue.entries.find(entry => entry.id === 'et').licenseSource.identifier, 'LGPL-2.1');
  assert.equal(dictionaryCatalogue.entries.find(entry => entry.id === 'eu').licenseSource.identifier, 'GPL-2.0');
  for (const entry of dictionaryCatalogue.entries) assert.ok(entry.nativeName && entry.nativeName.trim());
  const service = new DictionaryService('/tmp/brightdesk-dictionary-internal-catalogue');
  assert.deepEqual(service.catalogue(), []);
});


test('users cannot import or remove dictionary files outside the protected catalogue', async () => {
  const service = new DictionaryService('/tmp/brightdesk-dictionary-lock-test');
  await assert.rejects(() => service.importBundle('/tmp/any-dictionary.bddict'), /Custom dictionary imports are disabled/);
  await assert.rejects(() => service.remove('en-AU'), /Dictionary removal is disabled/);
});

test('reinstalling a matching catalogue dictionary never replaces its original files', async () => {
  const userData = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-dictionary-no-overwrite-'));
  let networkCalls = 0;
  const service = new DictionaryService(userData, { fetch: async () => { networkCalls += 1; throw new Error('network should not be used'); }, spellFactory: () => ({ correct: word => word === 'word', suggest: () => [] }) });
  const catalogueEntry = sourceEntry('bg');
  const folder = path.join(userData, 'dictionaries', 'bg');
  await fs.mkdir(folder, { recursive: true });
  const legacyAff = 'SET UTF-8\n';
  const legacyDic = '1\nword\n';
  const legacyLicense = 'A fixed original licence text that is long enough to pass the validation rules.';
  const legacyReadme = 'Fixed original author and contributor attribution information for testing.';
  const hash = value => crypto.createHash('sha256').update(value).digest('hex');
  const oldCatalogueManifest = {
    schemaVersion: 1, catalogueId: catalogueEntry.id, locale: catalogueEntry.locale, name: catalogueEntry.name, nativeName: catalogueEntry.nativeName,
    authors: 'Original dictionary contributors are listed in UPSTREAM_README.md.',
    affFile: 'index.aff', dicFile: 'index.dic', licenseFile: 'LICENSE.txt', readmeFile: 'UPSTREAM_README.md',
    license: catalogueEntry.license, licenseUrl: catalogueEntry.licenseUrl, licenseSource: catalogueEntry.licenseSource,
    sourceUrl: catalogueEntry.sourceUrl, upstream: catalogueEntry.upstream, upstreamRevision: catalogueEntry.upstreamRevision,
    integrity: { aff: hash(legacyAff), dic: hash(legacyDic), license: hash(legacyLicense), readme: hash(legacyReadme) }
  };
  await fs.writeFile(path.join(folder, 'manifest.json'), JSON.stringify(oldCatalogueManifest));
  await fs.writeFile(path.join(folder, 'dictionary.aff'), legacyAff);
  await fs.writeFile(path.join(folder, 'dictionary.dic'), legacyDic);
  await fs.writeFile(path.join(folder, 'LICENSE.txt'), legacyLicense);
  await fs.writeFile(path.join(folder, 'UPSTREAM_README.md'), legacyReadme);
  try {
    const result = await service.checkText('bg', 'word');
    assert.equal(result.misspellingCount, 0);
    assert.equal(networkCalls, 0);
    assert.equal(await fs.readFile(path.join(folder, 'dictionary.dic'), 'utf8'), legacyDic);
    await assert.rejects(() => service.remove('bg'), /Dictionary removal is disabled/);
  } finally {
    await fs.chmod(folder, 0o700).catch(() => {});
    await fs.rm(userData, { recursive: true, force: true });
  }
});

test('all customer catalogue installs are blocked until Brightdesk-hosted packs are released', async () => {
  let networkCalls = 0;
  const service = new DictionaryService('/tmp/brightdesk-dictionary-catalog-test', {
    fetch: async () => { networkCalls += 1; throw new Error('network should not be used'); }
  });
  await assert.rejects(() => service.installCatalogueEntry('bg'), /Brightdesk-hosted spelling dictionary packs are not available yet/);
  assert.deepEqual(service.catalogue(), []);
  assert.equal(networkCalls, 0);
});


test('the two licence-file exceptions use bundled canonical GNU texts', async () => {
  const gpl = await fs.readFile(path.join(__dirname, '..', 'src', 'licenses', 'GPL-2.0.txt'), 'utf8');
  const lgpl = await fs.readFile(path.join(__dirname, '..', 'src', 'licenses', 'LGPL-2.1.txt'), 'utf8');
  assert.match(gpl, /GNU GENERAL PUBLIC LICENSE/);
  assert.match(gpl, /Version 2, June 1991/);
  assert.match(lgpl, /GNU LESSER GENERAL PUBLIC LICENSE/);
  assert.match(lgpl, /Version 2\.1, February 1999/);
  assert.equal(sourceEntry('et').licenseUrl, 'https://www.gnu.org/licenses/old-licenses/lgpl-2.1.txt');
  assert.equal(sourceEntry('eu').licenseUrl, 'https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt');
});
