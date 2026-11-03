#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const APPROVED_APP_IDS = Object.freeze([
  'pages', 'sheets', 'slides', 'notes', 'database',
  'forms', 'lists', 'planner', 'todo', 'loop'
]);
const REQUIRED_NODE = '24.22.2';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function asArray(value) {
  return Array.isArray(value) ? value : value ? [value] : [];
}

function containsAll(values, expected) {
  const actual = new Set(values.map(value => String(value).toLowerCase()));
  return expected.every(value => actual.has(value.toLowerCase()));
}

function findAppIdentity(root, packageJson) {
  const inferredAppId = packageJson.brightdeskAppId ||
    String(packageJson.name || '').replace(/^brightdesk-/, '').toLowerCase();

  if (inferredAppId !== 'suite' && APPROVED_APP_IDS.includes(inferredAppId)) {
    return { type: 'standalone', apps: [{ id: inferredAppId, version: packageJson.version }] };
  }

  if (packageJson.name === 'brightdesk-suite') {
    const catalogPath = path.join(root, 'src', 'app-catalog.js');
    if (exists(catalogPath)) {
      try {
        const catalog = require(catalogPath);
        if (Array.isArray(catalog)) {
          return { type: 'suite', apps: catalog.map(item => ({ id: item.id, version: item.moduleVersion })) };
        }
      } catch (error) {
        return { type: 'suite', error: error.message, apps: [] };
      }
    }
  }

  return { type: 'unknown', apps: [] };
}

function auditRepository({ rootDir = path.resolve(__dirname, '../..') } = {}) {
  const root = path.resolve(rootDir);
  const checks = [];
  const add = (name, passed, detail, level = 'BLOCKER') => {
    checks.push({ name, passed: Boolean(passed), detail: String(detail), level });
  };

  const packagePath = path.join(root, 'package.json');
  if (!exists(packagePath)) {
    add('Project package file', false, 'package.json is missing.');
    return { root, projectType: 'unknown', projectVersion: 'unknown', checks, ready: false };
  }

  const packageJson = readJson(packagePath);
  const packageVersion = packageJson.version || 'unknown';
  const scripts = packageJson.scripts || {};
  const build = packageJson.build || {};
  const identity = findAppIdentity(root, packageJson);
  const buildScriptPath = path.join(root, 'scripts', 'build-app.js');
  const buildScript = exists(buildScriptPath) ? fs.readFileSync(buildScriptPath, 'utf8') : '';

  const platformCommands = {
    win: scripts['dist:win'] || scripts['dist:product:win'] || scripts['dist:desktop:win'] || '',
    mac: scripts['dist:mac'] || scripts['dist:product:mac'] || scripts['dist:desktop:mac'] || '',
    linux: scripts['dist:linux'] || scripts['dist:product:linux'] || scripts['dist:desktop:linux'] || ''
  };
  const platformTargets = {
    win: asArray(build.win?.target),
    mac: asArray(build.mac?.target),
    linux: asArray(build.linux?.target)
  };

  add(
    'Pinned Node.js version',
    packageJson.engines?.node === REQUIRED_NODE,
    'Found ' + (packageJson.engines?.node || 'no pinned version') + '; Brightdesk requires exactly ' + REQUIRED_NODE + '.'
  );
  add(
    'Automated test command',
    typeof scripts.test === 'string' && scripts.test.length > 0,
    scripts.test ? 'A test command is configured.' : 'package.json does not define a test command.'
  );
  add(
    'App identity',
    identity.type !== 'unknown' && !identity.error,
    identity.type === 'suite'
      ? 'The Suite catalogue contains ' + identity.apps.length + ' app entries.'
      : identity.type === 'standalone'
        ? 'Standalone app identity: ' + identity.apps[0].id + '.'
        : identity.error || 'Could not identify this as the Suite or one approved standalone app.'
  );

  if (identity.type === 'suite') {
    const ids = identity.apps.map(item => item.id);
    const exact = ids.length === APPROVED_APP_IDS.length &&
      APPROVED_APP_IDS.every(id => ids.includes(id)) &&
      new Set(ids).size === ids.length;
    add(
      'Exact ten-app Brightdesk scope',
      exact,
      'Expected exactly: ' + APPROVED_APP_IDS.join(', ') + '. Found: ' + (ids.join(', ') || 'none') + '.'
    );
    for (const app of identity.apps) {
      add(
        'Version for ' + app.id,
        typeof app.version === 'string' && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(app.version),
        'Configured app version: ' + (app.version || 'missing') + '.'
      );
    }
  } else if (identity.type === 'standalone') {
    add(
      'Standalone app version',
      typeof packageVersion === 'string' && /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(packageVersion),
      'Configured version: ' + packageVersion + '.'
    );
  }

  const lockPath = path.join(root, 'package-lock.json');
  if (!exists(lockPath)) {
    add('Dependency lock file', false, 'package-lock.json is missing.');
  } else {
    try {
      const lock = readJson(lockPath);
      const lockedVersion = lock.packages?.['']?.version || lock.version;
      add(
        'Package and lock versions match',
        lockedVersion === packageVersion,
        'package.json is ' + packageVersion + '; package-lock.json is ' + (lockedVersion || 'missing') + '.'
      );
    } catch (error) {
      add('Dependency lock file', false, 'package-lock.json could not be read: ' + error.message);
    }
  }

  const hasWin = platformTargets.win.some(value => String(value).toLowerCase() === 'nsis') ||
    /--win\s+nsis/i.test(platformCommands.win) || /win:\s*\[[^\]]*nsis/i.test(buildScript);
  const hasMac = containsAll(platformTargets.mac, ['dmg', 'pkg', 'zip']) ||
    /--mac\s+dmg\s+pkg\s+zip/i.test(platformCommands.mac) ||
    /mac:\s*\[[^\]]*dmg[^\]]*pkg[^\]]*zip/i.test(buildScript);
  const hasLinux = containsAll(platformTargets.linux, ['appimage', 'deb']) ||
    /--linux\s+appimage\s+deb/i.test(platformCommands.linux) ||
    /linux:\s*\[[^\]]*appimage[^\]]*deb/i.test(buildScript);

  const winX64 = /--x64/.test(platformCommands.win) ||
    /win:\s*\[[^\]]*'--x64'/i.test(buildScript) ||
    asArray(packageJson.brightdeskBuildTargets?.win).includes('x64');
  const macUniversal = /--universal/.test(platformCommands.mac) ||
    /mac:\s*\[[^\]]*'--universal'/i.test(buildScript) ||
    asArray(packageJson.brightdeskBuildTargets?.mac).includes('universal');
  const linuxX64 = /--x64/.test(platformCommands.linux) ||
    /linux:\s*\[[^\]]*'--x64'/i.test(buildScript) ||
    asArray(packageJson.brightdeskBuildTargets?.linux).includes('x64');

  add('Windows installer format', hasWin, 'Expected an NSIS .exe installer with its built-in Windows uninstaller.');
  add('macOS installer formats', hasMac, 'Expected DMG, PKG and ZIP packages. macOS does not normally use a separate uninstaller.');
  add('Linux installer formats', hasLinux, 'Expected AppImage and DEB packages. DEB removal is handled by the package manager.');
  add('Windows x64 build target', winX64, 'The Windows build command or configuration must explicitly select x64.');
  add('macOS universal build target', macUniversal, 'The macOS build command or configuration must explicitly select universal architecture.');
  add('Linux x64 build target', linuxX64, 'The Linux build command or configuration must explicitly select x64.');
  add(
    'Windows uninstaller configuration',
    hasWin && (!build.nsis || build.nsis.oneClick === false),
    'NSIS supplies the Windows uninstall entry. A real install/uninstall test is still required.'
  );

  const workflowDir = path.join(root, '.github', 'workflows');
  const workflowFiles = exists(workflowDir)
    ? fs.readdirSync(workflowDir).filter(name => name.endsWith('.yml') || name.endsWith('.yaml'))
    : [];
  add(
    'Existing GitHub Actions workflows',
    workflowFiles.length > 0,
    workflowFiles.length
      ? 'Found ' + workflowFiles.length + ' workflow file(s). Existing workflows are left unchanged.'
      : 'No existing GitHub Actions workflow files were found.',
    'WARN'
  );

  const manifestPath = path.join(root, 'release', 'Brightdesk-Release-Manifest.json');
  if (exists(manifestPath)) {
    try {
      const manifest = readJson(manifestPath);
      const validatorPath = path.join(root, 'src', 'release-manifest.js');
      if (exists(validatorPath)) {
        const { validateReleaseManifest } = require(validatorPath);
        validateReleaseManifest(manifest);
      }
      add('Local release manifest', true, 'The generated release manifest is present and passed available structural validation.', 'INFO');
    } catch (error) {
      add('Local release manifest', false, 'Release manifest validation failed: ' + error.message);
    }
  } else {
    add(
      'Local release manifest',
      true,
      'No release output exists in this clean source checkout. Native build jobs must create and verify it.',
      'WARN'
    );
  }

  const blockers = checks.filter(check => check.level === 'BLOCKER' && !check.passed);
  const warnings = checks.filter(check => check.level === 'WARN' && !check.passed);
  return {
    root,
    projectType: identity.type,
    projectVersion: packageVersion,
    appIds: identity.apps.map(item => item.id),
    checks,
    blockers,
    warnings,
    ready: blockers.length === 0
  };
}

function renderMarkdown(result) {
  const title = result.projectType === 'suite' ? 'Brightdesk Suite' : 'Brightdesk repository';
  const lines = [
    '# ' + title + ' maintenance check',
    '',
    '**Version:** ' + result.projectVersion,
    '**Result:** ' + (result.ready ? 'No blocking configuration problems found' : result.blockers.length + ' blocking problem(s) found'),
    '',
    '| Check | Result | Details |',
    '|---|---|---|',
    ...result.checks.map(check =>
      '| ' + check.name + ' | ' + (check.passed ? 'PASS' : check.level) + ' | ' + check.detail.replace(/\|/g, '\\|') + ' |'
    ),
    '',
    '## Uninstall behaviour',
    '',
    '- **Windows:** the NSIS installer provides the normal Windows uninstall entry. The installed version and removal behaviour still need a real Windows install/uninstall test.',
    '- **macOS:** there is no standard separate uninstaller. Users normally remove the application in Finder; user documents and settings should be preserved unless the user chooses to remove them.',
    '- **Linux:** DEB packages are removed through the package manager. An AppImage is removed by deleting the AppImage and its matching desktop entry.',
    '',
    'This check reads project settings and files. It does not claim that an installer was installed, launched or uninstalled.',
    ''
  ];
  return lines.join('\n');
}

function writeReport(result, rootDir = result.root) {
  const reportDirectory = path.join(rootDir, 'reports', 'brightdesk-ai');
  fs.mkdirSync(reportDirectory, { recursive: true });
  const markdownPath = path.join(reportDirectory, 'latest.md');
  const jsonPath = path.join(reportDirectory, 'latest.json');
  fs.writeFileSync(markdownPath, renderMarkdown(result));
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2) + '\n');
  return { markdownPath, jsonPath };
}

if (require.main === module) {
  try {
    const result = auditRepository();
    const report = writeReport(result);
    console.log('Brightdesk maintenance check: ' + (result.ready ? 'NO BLOCKING CONFIGURATION PROBLEMS' : 'BLOCKED'));
    for (const check of result.checks) {
      const status = check.passed ? 'PASS' : check.level;
      console.log(status + '  ' + check.name + ': ' + check.detail);
    }
    console.log('Report: ' + report.markdownPath);
    if (!result.ready) process.exitCode = 1;
  } catch (error) {
    console.error('Brightdesk maintenance audit could not finish: ' + error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  APPROVED_APP_IDS,
  REQUIRED_NODE,
  auditRepository,
  renderMarkdown,
  writeReport
};
