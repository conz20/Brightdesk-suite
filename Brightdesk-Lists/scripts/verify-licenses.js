'use strict';

const fs = require('node:fs');
const path = require('node:path');

const LICENSE_FILE_NAMES = [
  'LICENSE', 'LICENSE.md', 'LICENSE.txt', 'LICENCE', 'LICENCE.md',
  'LICENCE.txt', 'COPYING', 'COPYING.md', 'COPYING.txt'
];
const PROPRIETARY_LICENSE = /^(?:UNLICENSED|PROPRIETARY|COMMERCIAL(?:\s+ONLY)?|SEE\s+COMMERCIAL\s+LICENSE)$/i;

// Reviewed exception: the published buffers@0.1.1 tarball omits its license field,
// while upstream metadata for the same version declares MIT/X11.
const REVIEWED_LICENSE_OVERRIDES = {
  'buffers@0.1.1': {
    license: 'MIT/X11',
    source: 'https://github.com/bitpay/node-buffers/blob/master/package.json'
  }
};

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`Could not read ${label}: ${error.message}`);
  }
}

function normalizeLicense(packageJson) {
  const value = packageJson.license;
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value && typeof value === 'object' && typeof value.type === 'string') return value.type.trim();
  if (Array.isArray(packageJson.licenses) && packageJson.licenses.length) {
    return packageJson.licenses
      .map(item => typeof item === 'string' ? item : item?.type)
      .filter(value => typeof value === 'string' && value.trim())
      .join(' OR ');
  }
  return '';
}

function findLicenseFile(packageDir, licenseExpression) {
  const seeLicense = /^SEE\s+LICENSE\s+IN\s+(.+)$/i.exec(licenseExpression || '');
  const candidates = seeLicense ? [seeLicense[1].trim()] : LICENSE_FILE_NAMES;

  for (const candidate of candidates) {
    const fullPath = path.resolve(packageDir, candidate);
    const relative = path.relative(packageDir, fullPath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) continue;
    try {
      if (fs.statSync(fullPath).isFile()) {
        return { path: relative.split(path.sep).join('/'), text: fs.readFileSync(fullPath, 'utf8') };
      }
    } catch { /* Try the next recognised name. */ }
  }
  return null;
}

function collectInstalledPackages(nodeModulesDir) {
  const packages = [];
  const visited = new Set();

  function visitNodeModules(directory) {
    if (!fs.existsSync(directory)) return;
    const resolvedDirectory = path.resolve(directory);
    if (visited.has(resolvedDirectory)) return;
    visited.add(resolvedDirectory);

    let entries;
    try { entries = fs.readdirSync(resolvedDirectory, { withFileTypes: true }); }
    catch (error) { throw new Error(`Cannot scan ${resolvedDirectory}: ${error.message}`); }

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === '.bin' || entry.name === '.cache') continue;
      const packageDir = path.join(resolvedDirectory, entry.name);

      // Scoped packages are folders containing packages, not packages themselves.
      if (entry.name.startsWith('@')) {
        visitNodeModules(packageDir);
        continue;
      }

      const manifestPath = path.join(packageDir, 'package.json');
      if (!fs.existsSync(manifestPath)) continue;
      const manifest = readJson(manifestPath, `package manifest ${manifestPath}`);
      if (typeof manifest.name === 'string' && typeof manifest.version === 'string') {
        const packageKey = `${manifest.name}@${manifest.version}`;
        const declaredLicense = normalizeLicense(manifest);
        const reviewedOverride = REVIEWED_LICENSE_OVERRIDES[packageKey];
        const license = declaredLicense || reviewedOverride?.license || '';
        packages.push({
          name: manifest.name,
          version: manifest.version,
          license,
          licenseSource: declaredLicense ? 'package metadata' : reviewedOverride?.source || '',
          licenseFile: findLicenseFile(packageDir, license),
          packageDir
        });
      }
      visitNodeModules(path.join(packageDir, 'node_modules'));
    }
  }

  visitNodeModules(nodeModulesDir);
  return packages.sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version));
}

function auditProject({ rootDir, nodeModulesDir, outputPath }) {
  const rootManifest = readJson(path.join(rootDir, 'package.json'), 'Brightdesk package.json');
  if (rootManifest.license !== 'MIT') {
    throw new Error('Brightdesk must keep its declared MIT licence unless the project owner deliberately changes it.');
  }

  const ownLicensePath = path.join(rootDir, 'LICENSE');
  if (!fs.existsSync(ownLicensePath) || !/MIT License/.test(fs.readFileSync(ownLicensePath, 'utf8'))) {
    throw new Error('Brightdesk MIT LICENSE file is missing or does not contain the expected MIT notice.');
  }

  const packages = collectInstalledPackages(nodeModulesDir);
  if (packages.length === 0) {
    throw new Error('No installed dependencies were found. Run npm install before checking dependency licences.');
  }

  const problems = [];
  for (const item of packages) {
    if (item.license && PROPRIETARY_LICENSE.test(item.license)) {
      problems.push(`${item.name}@${item.version} declares a proprietary or unlicensed status (${item.license}).`);
    } else if (!item.license && !item.licenseFile) {
      problems.push(`${item.name}@${item.version} has no licence metadata or recognised licence file.`);
    }
  }

  if (problems.length) {
    throw new Error(`Licence verification needs review:\n- ${problems.join('\n- ')}`);
  }

  const lines = [
    '# Brightdesk third-party notices',
    '',
    `Generated for Brightdesk ${rootManifest.version} from the installed dependency tree.`,
    '',
    'Brightdesk itself is licensed under the MIT License; see `LICENSE`. This inventory records the separate licence declarations supplied by installed dependencies. It does not replace those licences or provide legal advice.',
    '',
    `Packages checked: ${packages.length}`,
    ''
  ];

  for (const item of packages) {
    lines.push(`## ${item.name}@${item.version}`, '');
    lines.push(`Declared licence: ${item.license || 'Not stated in package metadata; licence file supplied'}`);
    if (item.licenseSource && item.licenseSource !== 'package metadata') {
      lines.push(`Reviewed licence source: ${item.licenseSource}`);
      lines.push('Note: the published npm tarball omits this field; the matching upstream version metadata declares MIT/X11.');
    }
    if (item.licenseFile) {
      lines.push(`Licence file: ${item.licenseFile.path}`, '', '```text', item.licenseFile.text.trim(), '```');
    } else {
      lines.push('The package did not include a recognised standalone licence text file; its declared licence metadata is recorded above.');
    }
    lines.push('');
  }

  const report = `${lines.join('\n').trim()}\n`;
  fs.writeFileSync(outputPath, report, 'utf8');
  return { packageCount: packages.length, outputPath, report };
}

if (require.main === module) {
  const rootDir = path.resolve(__dirname, '..');
  const result = auditProject({
    rootDir,
    nodeModulesDir: path.join(rootDir, 'node_modules'),
    outputPath: path.join(rootDir, 'THIRD_PARTY_NOTICES.md')
  });
  process.stdout.write(`Brightdesk licence verification passed for ${result.packageCount} installed packages.\n`);
  process.stdout.write('No activation code, serial number or licence server is used.\n');
}

module.exports = { auditProject, collectInstalledPackages, findLicenseFile, normalizeLicense };
