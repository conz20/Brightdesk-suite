import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("all ten product windows expose the common Print and Printer settings actions", () => {
  const html = read("src/index.html");
  const app = read("src/app.js");
  assert.match(html, /id="print-button"/);
  assert.match(html, /id="printer-settings-button"/);
  assert.match(app, /\$('print-button')\.addEventListener\('click', printCurrent\)/);
  assert.match(app, /\$('printer-settings-button')\.addEventListener\('click', openPrinterSettings\)/);
  assert.match(app, /window\.brightdesk\.printing\.print\(\{ printBackground: true \}\)/);
  assert.match(app, /window\.brightdesk\.printing\.openPrinterSettings\(\)/);
});

test("printing operations are exposed only through the context-isolated preload", () => {
  const preload = read("src/preload.js");
  for (const method of [
    "listPrinters",
    "discoverNetworkPrinters",
    "pairNetworkPrinter",
    "getPrinterCapabilities",
    "openPrinterSettings",
    "print",
  ]) {
    assert.match(preload, new RegExp(method));
  }
  assert.match(preload, /contextBridge\.exposeInMainWorld\('brightdesk'/);
  assert.doesNotMatch(preload, /exposeInMainWorld\([^,]+,\s*ipcRenderer/);
});

test("Suite main process gates printing IPC and loads the local checked-in package", () => {
  const main = read("src/main.js");
  assert.match(main, /registerPrintingIpcHandlers\(ipcMain/);
  assert.match(main, /isAuthorizedSender:\s*senderIsMain/);
  assert.match(main, /import\('\.\/printing-package\/index\.mjs'\)/);
  assert.match(main, /createElectronPrintAdapter\(webContents,\s*\{ platform: process\.platform, shell \}\)/);
});

test("native printer discovery helpers are built on their matching operating systems", () => {
  const build = read("scripts/build-native.js");
  assert.match(build, /build-macos-printer-discovery\.sh/);
  assert.match(build, /build-windows-printer-discovery\.ps1/);
  assert.match(build, /process\.platform/);
});

test("native printer discovery helper sources and build scripts are included in the Suite snapshot", () => {
  for (const file of [
    "src/printing-package/native/macos/ipp-printer-discovery.swift",
    "src/printing-package/native/windows/ipp-printer-discovery.cpp",
    "src/printing-package/tools/build-macos-printer-discovery.sh",
    "src/printing-package/tools/build-windows-printer-discovery.ps1",
  ]) {
    assert.ok(fs.existsSync(path.join(root, file)), `Missing required platform printing source: ${file}`);
    assert.ok(fs.statSync(path.join(root, file)).size > 0, `Empty platform printing source: ${file}`);
  }
});

test("electron-builder unpacks native printer executables outside ASAR for Suite and product builds", () => {
  const packageJson = JSON.parse(read("package.json"));
  const rootUnpack = packageJson.build.asarUnpack.join("\\n");
  const appConfig = read("electron-builder.app.config.js");
  for (const pattern of [
    "src/printing-package/native/macos/brightdesk-ipp-discovery",
    "src/printing-package/native/windows/brightdesk-ipp-discovery.exe",
  ]) {
    assert.ok(rootUnpack.includes(pattern), `Suite build does not unpack ${pattern}`);
    assert.ok(appConfig.includes(pattern), `Product build does not unpack ${pattern}`);
  }
});

test("macOS Suite and product bundles declare the Bonjour services and local-network usage", () => {
  const packageJson = JSON.parse(read("package.json"));
  const plist = packageJson.build.mac.extendInfo;
  assert.deepEqual(plist.NSBonjourServices, ["_ipp._tcp", "_ipps._tcp", "_printer._tcp"]);
  assert.match(plist.NSLocalNetworkUsageDescription, /printer/i);
  const appConfig = read("electron-builder.app.config.js");
  assert.match(appConfig, /NSBonjourServices/);
  assert.match(appConfig, /NSLocalNetworkUsageDescription/);
});
