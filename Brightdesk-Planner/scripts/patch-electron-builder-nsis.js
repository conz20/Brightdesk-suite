'use strict';

const fs = require('node:fs');
const path = require('node:path');

const PATCH_MARKER = 'BRIGHTDESK_NSIS_UNINSTALLER_READER_PATCH';

/**
 * Backport electron-builder's platform-independent UninstallerReader path.
 *
 * electron-builder 26.18.0 already ships UninstallerReader, but only uses it
 * on macOS Catalina. On Linux it launches the just-built assisted installer
 * through Wine to create a temporary uninstaller. In a headless amd64 Docker
 * container on Apple Silicon that GUI process never completes.
 *
 * The reader extracts and validates the uninstaller from the NSIS executable
 * without launching the installer. If it cannot parse this build, fail with
 * the parser's real error instead of hanging in the Wine fallback.
 */
function patchNsisTargetSource(source) {
  if (typeof source !== 'string') {
    throw new TypeError('NsisTarget source must be a string');
  }
  if (source.includes(PATCH_MARKER)) return source;

  const readerCall = 'UninstallerReader.exec(installerPath, uninstallerPath)';
  const readerIndex = source.indexOf(readerCall);
  if (readerIndex < 0) {
    throw new Error('Expected electron-builder UninstallerReader call was not found');
  }

  const conditionPattern = /if\s*\(\s*(?:\(0\s*,\s*)?[A-Za-z_$][\w$]*\.isMacOsCatalina\s*\)?\s*\(\s*\)\s*\)\s*\{/;
  const conditionMatch = conditionPattern.exec(source);
  if (!conditionMatch || conditionMatch.index > readerIndex) {
    throw new Error('Expected macOS-only UninstallerReader condition was not found');
  }

  const catchIndex = source.indexOf('catch', readerIndex);
  if (catchIndex < 0 || catchIndex - readerIndex > 2000) {
    throw new Error('Expected UninstallerReader fallback catch block was not found');
  }

  const catchMatch = /^catch\s*\(\s*([A-Za-z_$][\w$]*)\s*\)\s*\{/.exec(source.slice(catchIndex));
  if (!catchMatch) {
    throw new Error('Could not identify the UninstallerReader fallback error variable');
  }

  const catchOpen = catchIndex + catchMatch[0].lastIndexOf('{');
  const catchClose = findMatchingBrace(source, catchOpen);
  if (catchClose < 0) {
    throw new Error('UninstallerReader fallback catch block is not balanced');
  }

  const errorName = catchMatch[1];
  const replacementCatch = `catch (${errorName}) { throw ${errorName}; }`;
  let patched = source.slice(0, catchIndex) + replacementCatch + source.slice(catchClose + 1);

  const patchedCondition = conditionPattern.exec(patched);
  if (!patchedCondition) {
    throw new Error('UninstallerReader condition disappeared while patching');
  }
  const conditionReplacement = `if (true /* ${PATCH_MARKER} */) {`;
  patched =
    patched.slice(0, patchedCondition.index) +
    conditionReplacement +
    patched.slice(patchedCondition.index + patchedCondition[0].length);

  if (!patched.includes(readerCall) || !patched.includes(PATCH_MARKER)) {
    throw new Error('NSIS uninstaller reader patch verification failed');
  }
  return patched;
}

function findMatchingBrace(source, openIndex) {
  if (source[openIndex] !== '{') return -1;
  let depth = 0;
  let state = 'code';

  for (let i = openIndex; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];

    if (state === 'line-comment') {
      if (char === '\n') state = 'code';
      continue;
    }
    if (state === 'block-comment') {
      if (char === '*' && next === '/') {
        state = 'code';
        i += 1;
      }
      continue;
    }
    if (state === 'single' || state === 'double' || state === 'template') {
      if (char === '\\') {
        i += 1;
      } else if (
        (state === 'single' && char === "'") ||
        (state === 'double' && char === '"') ||
        (state === 'template' && char === '`')
      ) {
        state = 'code';
      }
      continue;
    }

    if (char === '/' && next === '/') {
      state = 'line-comment';
      i += 1;
      continue;
    }
    if (char === '/' && next === '*') {
      state = 'block-comment';
      i += 1;
      continue;
    }
    if (char === "'") {
      state = 'single';
      continue;
    }
    if (char === '"') {
      state = 'double';
      continue;
    }
    if (char === '`') {
      state = 'template';
      continue;
    }
    if (char === '{') depth += 1;
    if (char === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function applyPatch() {
  const projectRoot = process.cwd();
  const packageFile = path.join(projectRoot, 'node_modules', 'app-builder-lib', 'package.json');
  const targetFile = path.join(projectRoot, 'node_modules', 'app-builder-lib', 'out', 'targets', 'nsis', 'NsisTarget.js');

  if (!fs.existsSync(packageFile)) {
    throw new Error('app-builder-lib was not found after npm ci');
  }
  const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  if (pkg.version !== '26.18.0') {
    throw new Error(`Expected app-builder-lib 26.18.0, found ${pkg.version}`);
  }
  if (!fs.existsSync(targetFile)) {
    throw new Error(`Expected compiled NSIS target was not found: ${targetFile}`);
  }

  const original = fs.readFileSync(targetFile, 'utf8');
  const patched = patchNsisTargetSource(original);
  if (patched !== original) {
    fs.writeFileSync(targetFile, patched, 'utf8');
    console.log('Applied Brightdesk NSIS UninstallerReader backport to app-builder-lib 26.18.0.');
  } else {
    console.log('Brightdesk NSIS UninstallerReader backport is already applied.');
  }
}

if (require.main === module) {
  try {
    applyPatch();
  } catch (error) {
    console.error(`Failed to patch electron-builder NSIS uninstaller handling: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { patchNsisTargetSource, findMatchingBrace };
