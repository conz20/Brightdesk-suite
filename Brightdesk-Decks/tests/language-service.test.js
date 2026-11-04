const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { BUILTIN_LANGUAGES, BASE_TRANSLATION_KEYS, validateLanguagePack, getBuiltinLanguage } = require('../src/language-service');

test('language catalogue contains English plus additional installable languages', () => {
  assert.deepEqual(BUILTIN_LANGUAGES.map(language => language.code), ['en-AU', 'fr-FR', 'de-DE', 'es-ES']);
  assert.equal(getBuiltinLanguage('en-AU').isDefault, true);
  assert.equal(getBuiltinLanguage('fr-FR').proofingCode, 'fr');
  assert.equal(getBuiltinLanguage('../fr-FR'), null);
});

test('bundled language packs validate and include the core display labels', () => {
  for (const language of BUILTIN_LANGUAGES) {
    const file = path.join(__dirname, '..', 'src', 'languages', language.file);
    const pack = validateLanguagePack(JSON.parse(fs.readFileSync(file, 'utf8')));
    assert.equal(pack.code, language.code);
    assert.ok(pack.translations['language.title']);
    assert.ok(pack.translations['sidebar.languages']);
    assert.ok(Object.keys(pack.translations).length >= 100);
    assert.deepEqual(BASE_TRANSLATION_KEYS.filter(key => typeof pack.translations[key] !== 'string'), []);
  }
});

test('invalid language packs are rejected safely', () => {
  assert.throws(() => validateLanguagePack({ code: '../bad', name: 'Bad', nativeName: 'Bad', translations: {} }), /code is invalid/);
  assert.throws(() => validateLanguagePack({ code: 'fr-FR', name: 'French', nativeName: 'Français', translations: {} }), /between 10 and 1,000/);
  const badTranslations = Object.fromEntries(Array.from({ length: 10 }, (_, index) => [`key${index}`, 'valid']));
  badTranslations.key9 = 123;
  assert.throws(() => validateLanguagePack({ code: 'fr-FR', name: 'French', nativeName: 'Français', translations: badTranslations }), /invalid translation entry/);
});
