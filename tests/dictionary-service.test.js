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
  const catalogueEntry = service.catalogue().find(item => item.locale === 'en-AU');
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


test('the built-in worldwide catalogue contains 92 unique source entries with allowed licence expressions', () => {
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
});


test('users cannot import or remove dictionary files outside the protected catalogue', async () => {
  const service = new DictionaryService('/tmp/brightdesk-dictionary-lock-test');
  await assert.rejects(() => service.importBundle('/tmp/any-dictionary.bddict'), /Custom dictionary imports are disabled/);
  await assert.rejects(() => service.remove('en-AU'), /Dictionary removal is disabled/);
});

test('reinstalling a matching catalogue dictionary never replaces its original files', async () => {
  const userData = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-dictionary-no-overwrite-'));
  let networkCalls = 0;
  const service = new DictionaryService(userData, { fetch: async () => { networkCalls += 1; throw new Error('network should not be used'); } });
  const catalogueEntry = service.catalogue().find(item => item.id === 'bg');
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
    const result = await service.installCatalogueEntry('bg');
    assert.equal(result.alreadyInstalled, true);
    assert.equal(networkCalls, 0);
    await assert.rejects(() => service.remove('bg'), /Dictionary removal is disabled/);
  } finally {
    await fs.chmod(folder, 0o700).catch(() => {});
    await fs.rm(userData, { recursive: true, force: true });
  }
});

test('catalogue installation rejects unknown IDs before making a network request', async () => {
  let networkCalls = 0;
  const service = new DictionaryService('/tmp/brightdesk-dictionary-catalog-test', {
    fetch: async () => { networkCalls += 1; throw new Error('network should not be used'); }
  });
  await assert.rejects(() => service.installCatalogueEntry('../outside'), /valid dictionary/);
  await assert.rejects(() => service.installCatalogueEntry('not-in-catalogue'), /not in the built-in catalogue/);
  assert.equal(networkCalls, 0);
});


test('catalogue dictionaries not included in this build cannot trigger runtime network downloads', async () => {
  const userData = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-dictionary-offline-catalogue-'));
  let networkCalls = 0;
  const service = new DictionaryService(userData, {
    fetch: async () => { networkCalls += 1; throw new Error('unexpected network request'); }
  });
  try {
    await assert.rejects(
      () => service.installCatalogueEntry('bg'),
      /not included in this Brightdesk build/
    );
    assert.equal(networkCalls, 0);
    assert.equal(typeof service.fetchUpstreamFile, 'undefined');
  } finally {
    await fs.rm(userData, { recursive: true, force: true });
  }
});

test('legacy dictionaries without integrity metadata are rejected offline without changing files', async () => {
  const userData = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-dictionary-legacy-offline-'));
  let networkCalls = 0;
  const service = new DictionaryService(userData, {
    fetch: async () => { networkCalls += 1; throw new Error('unexpected network request'); }
  });
  const entry = service.catalogue().find(item => item.id === 'bg');
  const folder = path.join(userData, 'dictionaries', entry.locale);
  const manifest = {
    schemaVersion: 1,
    catalogueId: entry.id,
    locale: entry.locale,
    name: entry.name,
    nativeName: entry.nativeName,
    authors: 'Original authors are listed in the bundled attribution file.',
    affFile: 'index.aff',
    dicFile: 'index.dic',
    licenseFile: 'LICENSE.txt',
    readmeFile: 'UPSTREAM_README.md',
    license: entry.license,
    licenseUrl: entry.licenseUrl,
    licenseSource: entry.licenseSource,
    sourceUrl: entry.sourceUrl,
    upstream: entry.upstream,
    upstreamRevision: entry.upstreamRevision
  };
  const originalManifest = JSON.stringify(manifest, null, 2);
  const originalAff = 'legacy dictionary file';
  try {
    await fs.mkdir(folder, { recursive: true });
    await fs.writeFile(path.join(folder, 'manifest.json'), originalManifest);
    await fs.writeFile(path.join(folder, 'dictionary.aff'), originalAff);
    await assert.rejects(
      () => service.installCatalogueEntry('bg'),
      /cannot be verified offline/
    );
    assert.equal(networkCalls, 0);
    assert.equal(await fs.readFile(path.join(folder, 'manifest.json'), 'utf8'), originalManifest);
    assert.equal(await fs.readFile(path.join(folder, 'dictionary.aff'), 'utf8'), originalAff);
  } finally {
    await fs.rm(userData, { recursive: true, force: true });
  }
});

test('the two licence-file exceptions use bundled canonical GNU texts', async () => {
  const gpl = await fs.readFile(path.join(__dirname, '..', 'src', 'licenses', 'GPL-2.0.txt'), 'utf8');
  const lgpl = await fs.readFile(path.join(__dirname, '..', 'src', 'licenses', 'LGPL-2.1.txt'), 'utf8');
  assert.match(gpl, /GNU GENERAL PUBLIC LICENSE/);
  assert.match(gpl, /Version 2, June 1991/);
  assert.match(lgpl, /GNU LESSER GENERAL PUBLIC LICENSE/);
  assert.match(lgpl, /Version 2\.1, February 1999/);
  const service = new DictionaryService('/tmp/brightdesk-dictionary-source-test');
  const catalogue = service.catalogue();
  assert.equal(catalogue.find(item => item.id === 'et').licenseUrl, 'https://www.gnu.org/licenses/old-licenses/lgpl-2.1.txt');
  assert.equal(catalogue.find(item => item.id === 'eu').licenseUrl, 'https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt');
});


test('installed dictionary integrity rejects symbolic links outside the protected folder', async (t) => {
  if (process.platform === 'win32') {
    t.skip('Creating symbolic links may require elevated Windows permissions.');
    return;
  }

  const userData = await fs.mkdtemp(path.join(os.tmpdir(), 'brightdesk-dictionary-symlink-'));
  const folder = path.join(userData, 'dictionaries', 'en-AU');
  await fs.mkdir(folder, { recursive: true });

  const affText = 'SET UTF-8\\n';
  const dicText = '1\\nword\\n';
  const licenseText = 'A test licence document that is long enough to meet the minimum validation length.';
  const readmeText = 'A test attribution document that is long enough to meet the minimum validation length.';
  const externalDictionary = path.join(userData, 'outside-dictionary.dic');
  await fs.writeFile(path.join(folder, 'dictionary.aff'), affText);
  await fs.writeFile(externalDictionary, dicText);
  await fs.writeFile(path.join(folder, 'LICENSE.txt'), licenseText);
  await fs.writeFile(path.join(folder, 'UPSTREAM_README.md'), readmeText);
  await fs.symlink(externalDictionary, path.join(folder, 'dictionary.dic'));

  const hash = value => crypto.createHash('sha256').update(value).digest('hex');
  const integrityManifest = {
    locale: 'en-AU',
    readmeFile: 'UPSTREAM_README.md',
    integrity: {
      aff: hash(affText),
      dic: hash(dicText),
      license: hash(licenseText),
      readme: hash(readmeText)
    }
  };
  const service = new DictionaryService(userData);

  try {
    await assert.rejects(
      () => service.verifyInstalledIntegrity(folder, integrityManifest),
      /symbolic link/
    );
  } finally {
    await fs.rm(userData, { recursive: true, force: true });
  }
});


test('Hunspell text decoding rejects malformed bytes instead of replacing them', () => {
  const validAff = Buffer.from('SET UTF-8\n', 'utf8');
  const validDic = Buffer.from('1\nword\n', 'utf8');
  const malformedAff = Buffer.concat([validAff, Buffer.from([0xff])]);
  const malformedDic = Buffer.concat([validDic, Buffer.from([0xff])]);

  assert.throws(
    () => decodeHunspellFiles(validAff, malformedDic),
    /invalid byte sequence/
  );
  assert.throws(
    () => decodeHunspellFiles(malformedAff, validDic),
    /invalid byte sequence/
  );
});
