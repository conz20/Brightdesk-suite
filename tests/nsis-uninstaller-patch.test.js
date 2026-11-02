'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { patchNsisTargetSource } = require('../scripts/patch-electron-builder-nsis');

const compiledTarget = `
const macosVersion_1 = require("../../util/macosVersion");
const WineVm_1 = require("../../vm/WineVm");
async function buildInstaller() {
  await this.executeMakensis(defines, commands, script);
  if ((0, macosVersion_1.isMacOsCatalina)()) {
    try {
      await UninstallerReader.exec(installerPath, uninstallerPath);
    } catch (error) {
      log.warn("fallback: " + error.message);
      const vm = await packager.vm.value;
      await vm.exec(installerPath, []);
      let i = 0;
      while (!(await exists(uninstallerPath)) && i++ < 100) {
        await new Promise((resolve, _reject) => setTimeout(resolve, 300));
      }
    }
  } else {
    const wineVm = new WineVm_1.WineVmManager(packager.config.toolsets?.wine);
    await wineVm.exec(installerPath, [], { env: { __COMPAT_LAYER: "RunAsInvoker" } });
  }
  await packager.signIf(uninstallerPath);
}
`;

test('Windows packaging extracts the NSIS uninstaller without launching the GUI installer', () => {
  const patched = patchNsisTargetSource(compiledTarget);
  assert.match(patched, /if \(true \/\* BRIGHTDESK_NSIS_UNINSTALLER_READER_PATCH \*\/\)/);
  assert.match(patched, /await UninstallerReader\.exec\(installerPath, uninstallerPath\)/);
  assert.match(patched, /catch \(error\) \{ throw error; \}/);
  assert.doesNotMatch(patched, /await vm\.exec\(installerPath, \[\]\)/);
});

test('the NSIS uninstaller patch is safe to apply more than once', () => {
  const once = patchNsisTargetSource(compiledTarget);
  assert.equal(patchNsisTargetSource(once), once);
});

test('the NSIS uninstaller patch rejects unexpected electron-builder source instead of guessing', () => {
  assert.throws(
    () => patchNsisTargetSource('module.exports = {};'),
    /UninstallerReader call was not found/
  );
});
