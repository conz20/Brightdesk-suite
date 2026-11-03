'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src', 'index.html'), 'utf8');
const app = fs.readFileSync(path.join(root, 'src', 'app.js'), 'utf8');
const preload = fs.readFileSync(path.join(root, 'src', 'preload.js'), 'utf8');

test('Suite has a dedicated Downloads destination separate from the App Centre', () => {
  assert.match(html, /id="downloads-nav"/);
  assert.match(html, /id="downloads-panel"/);
  assert.match(html, /id="downloads-app-grid"/);
  assert.match(html, /id="downloads-platform-name"/);
  assert.match(html, /id="downloads-platform-details"/);
  assert.match(app, /state\.view === 'downloads'/);
  assert.match(app, /function renderDownloads\(\)/);
  assert.match(app, /stageStandaloneAppFromCentre\(item\.id, item\.name\)/);
});

test('Downloads displays only approved products and platform architecture supplied by the desktop shell', () => {
  assert.match(app, /const available = catalog\.filter\(item => item\.availability === 'available'\)/);
  assert.match(app, /window\.brightdesk\.architecture/);
  assert.match(preload, /architecture: process\.arch/);
});

test('Downloads separates standalone OS installation from the in-suite selection state', () => {
  assert.match(app, /Download desktop app/);
  assert.match(app, /Open desktop app/);
  assert.match(app, /Add to suite/);
  assert.match(app, /downloads-nav/);
  assert.match(app, /downloads-panel/);
});

test('standalone app windows do not display Suite navigation or Suite Downloads', () => {
  assert.match(app, /\$\('downloads-nav'\)\.hidden = Boolean\(launchAppId\)/);
});

test('Downloads disables a package action when the current CPU architecture has no build', () => {
  assert.match(app, /const supportedArchitecture = platform === 'darwin'/);
  assert.match(app, /const platformSupported = Boolean\(platformNames\[platform\]\) && supportedArchitecture/);
  assert.match(app, /action\.disabled = !platformSupported/);
  assert.match(app, /No Brightdesk installer is currently built for this combination/);
});

test('Downloads lets users choose each supported desktop operating system', () => {
  assert.match(html, /id="downloads-platform-select"/);
  assert.match(html, /option value="win32"/);
  assert.match(html, /option value="darwin"/);
  assert.match(html, /option value="linux"/);
  assert.match(app, /targetArchitectures = \{ win32: 'x64', darwin: 'universal', linux: 'x64' \}/);
  assert.match(app, /window\.brightdesk\.openAppDownloads\(item\.id, targetPlatform, targetArchitecture\)/);
});

test('Downloads opens only manifest-resolved packages for another operating system', () => {
  const main = fs.readFileSync(path.join(root, 'src', 'main.js'), 'utf8');
  const preload = fs.readFileSync(path.join(root, 'src', 'preload.js'), 'utf8');
  assert.match(preload, /openAppDownloads: \(appId, platform, architecture\)/);
  assert.match(main, /const supportedArchitectures = \{ win32: \['x64'\], darwin: \['universal'\], linux: \['x64'\] \}/);
  assert.match(main, /getStandaloneAppDownload\(\{ appId, platform, architecture \}\)/);
  assert.match(main, /await shell\.openExternal\(download\.downloadUrl\)/);
  assert.match(main, /sha256: download\.sha256/);
});

test('Downloads does not offer an install action for a package targeting another computer', () => {
  assert.match(app, /const installOnThisComputer = targetIsCurrent && currentArchitectureSupported/);
  assert.match(app, /!installOnThisComputer[\s\S]*?Download for \$\{platformNames\[targetPlatform\]\}/);
  assert.match(app, /else if \(installOnThisComputer\)[\s\S]*?stageStandaloneAppFromCentre/);
});
