'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { importFontReleasePackage } = require('../scripts/import-font-release-package');
const { validateFontPackage } = require('../src/font-library-service');

function sha256(bytes) {
  return createHash('sha256').update(bytes).digest('hex');
}

function createReleaseArtifact(t, { fontBytes = Buffer.from('inter-variable-font') } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-font-release-artifact-'));
  const template = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-font-template-'));
  const outputParent = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-font-output-'));
  const sourceAsset = 'assets/fonts/inter/Inter[opsz,wght].ttf';
  const licensePath = 'licenses/inter-OFL.txt';
  fs.mkdirSync(path.join(root, 'assets', 'fonts', 'inter'), { recursive: true });
  fs.mkdirSync(path.join(root, 'licenses'), { recursive: true });
  fs.mkdirSync(path.join(root, 'catalogue'), { recursive: true });
  fs.writeFileSync(path.join(root, sourceAsset), fontBytes);
  fs.writeFileSync(path.join(root, licensePath), 'SIL OPEN FONT LICENSE Version 1.1\nCopyright 2020 The Inter Project Authors\n');

  const font = {
    id: 'inter',
    family: 'Inter',
    version: '4.1',
    source: {
      name: 'Google Fonts official Inter family',
      url: 'https://github.com/google/fonts/tree/06bfe0d62a98375cb09c942fa18e68bd32cff057/ofl/inter',
      retrievedAt: '2026-11-24'
    },
    license: {
      spdxId: 'OFL-1.1',
      textFile: licensePath,
      licenseUrl: 'https://openfontlicense.org/open-font-license-official-text/',
      copyright: 'Copyright 2020 The Inter Project Authors',
      author: 'Rasmus Andersson',
      redistributionAllowed: true,
      embeddingAllowed: true,
      modificationAllowed: true,
      reservedFontName: false
    },
    styles: ['normal'],
    scripts: ['Latin'],
    files: [{
      path: sourceAsset,
      format: 'ttf',
      sha256: sha256(fontBytes),
      face: {
        id: 'inter-variable-normal',
        style: 'normal',
        weight: 400,
        italic: false,
        oblique: false,
        axes: [
          { tag: 'opsz', min: 14, default: 14, max: 32 },
          { tag: 'wght', min: 100, default: 400, max: 900 }
        ]
      }
    }]
  };
  fs.writeFileSync(path.join(root, 'catalogue', 'fonts.json'), JSON.stringify({ schemaVersion: 1, fonts: [font] }, null, 2) + '\n');
  fs.writeFileSync(path.join(root, 'catalogue', 'font-details.json'), JSON.stringify({
    schemaVersion: 1,
    families: [{
      id: 'inter',
      family: 'Inter',
      files: [{
        path: sourceAsset,
        fullName: 'Inter Regular',
        postScriptName: 'Inter-Regular',
        scripts: ['Latin'],
        unicodeCoverage: ['U+0000-00FF']
      }]
    }]
  }, null, 2) + '\n');
  fs.writeFileSync(path.join(root, 'fonts.css'), '@font-face { font-family: "Inter"; src: url("./' + sourceAsset + '"); }\n');
  fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify({
    releaseProfile: '0.1.0',
    familyCount: 1,
    includedSources: ['Google Fonts pinned catalogue']
  }, null, 2) + '\n');

  const paths = [];
  const walk = directory => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) walk(absolute);
      else {
        const relative = path.relative(root, absolute).split(path.sep).join('/');
        const bytes = fs.readFileSync(absolute);
        paths.push({ path: relative, size: bytes.length, sha256: sha256(bytes) });
      }
    }
  };
  walk(root);
  paths.sort((a, b) => a.path.localeCompare(b.path, 'en'));
  fs.writeFileSync(path.join(root, 'font-package.json'), JSON.stringify({
    schemaVersion: 1,
    packageId: 'brightdesk-font-library',
    version: '0.1.0',
    releaseProfile: '0.1.0',
    integrity: 'SHA-256',
    catalogue: {
      path: 'catalogue/fonts.json',
      sha256: paths.find(item => item.path === 'catalogue/fonts.json').sha256,
      familyCount: 1,
      fontFileCount: 1
    },
    fileCount: paths.length,
    totalBytes: paths.reduce((sum, item) => sum + item.size, 0),
    files: paths
  }, null, 2) + '\n');

  fs.writeFileSync(path.join(template, 'index.cjs'), "'use strict'; module.exports = {};\n");
  t.after(() => {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(template, { recursive: true, force: true });
    fs.rmSync(outputParent, { recursive: true, force: true });
  });
  return { root, template, output: path.join(outputParent, 'fonts'), sourceAsset, fontBytes };
}

test('converts the verified Google/Microsoft release format into the Suite shared package', t => {
  const fixture = createReleaseArtifact(t);
  const result = importFontReleasePackage({
    sourceRoot: fixture.root,
    outputRoot: fixture.output,
    templateRoot: fixture.template,
    minimumGoogleFamilies: 1
  });

  assert.equal(result.version, '0.1.0');
  assert.equal(result.googleFamilyCount, 1);
  assert.equal(result.familyCount, 1);
  const verified = validateFontPackage(fixture.output);
  const inter = verified.catalogue.fonts[0];
  assert.equal(inter.family, 'Inter');
  assert.equal(inter.license.applicationEmbeddingAllowed, true);
  assert.deepEqual(inter.files[0].face.axes.map(axis => axis.tag), ['opsz', 'wght']);
  assert.deepEqual(fs.readFileSync(path.join(fixture.output, fixture.sourceAsset)), fixture.fontBytes);
  assert.equal(fs.existsSync(path.join(fixture.output, 'catalogue', 'font-details.json')), true);
  assert.equal(fs.existsSync(path.join(fixture.output, 'licenses', 'inter-OFL.txt')), true);
});

test('rejects a modified release artifact before replacing the installed package', t => {
  const fixture = createReleaseArtifact(t);
  const existing = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-font-existing-'));
  fs.writeFileSync(path.join(existing, 'preserved.txt'), 'keep');
  t.after(() => fs.rmSync(existing, { recursive: true, force: true }));
  fs.writeFileSync(path.join(fixture.root, fixture.sourceAsset), 'tampered');

  assert.throws(() => importFontReleasePackage({
    sourceRoot: fixture.root,
    outputRoot: existing,
    templateRoot: fixture.template,
    minimumGoogleFamilies: 1
  }), /SHA-256/i);
  assert.equal(fs.readFileSync(path.join(existing, 'preserved.txt'), 'utf8'), 'keep');
});

test('refuses to convert a release below the required 1,900 Google Fonts families', t => {
  const fixture = createReleaseArtifact(t);
  assert.throws(() => importFontReleasePackage({
    sourceRoot: fixture.root,
    outputRoot: fixture.output,
    templateRoot: fixture.template
  }), /at least 1900 are required/i);
  assert.equal(fs.existsSync(fixture.output), false);
});
