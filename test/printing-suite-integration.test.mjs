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
  assert.match(app, /const printRequest = \{ printBackground: true \}/);
  assert.match(app, /window\.brightdesk\.printing\.print\(printRequest\)/);
  assert.match(app, /printRequest\.orientation = "landscape"/);
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
  const macConfig = appConfig.slice(appConfig.indexOf("  mac: {"), appConfig.indexOf("  pkg: {"));
  const windowsConfig = appConfig.slice(appConfig.indexOf("  win: {"), appConfig.indexOf("  nsis:"));
  assert.match(macConfig, /NSBonjourServices/);
  assert.match(macConfig, /NSLocalNetworkUsageDescription/);
  assert.doesNotMatch(windowsConfig, /NSBonjourServices|NSLocalNetworkUsageDescription/);
});


test("macOS printer discovery helper is a universal Apple Silicon and Intel executable",()=>{
 const macBuild=read("src/printing-package/tools/build-macos-printer-discovery.sh");
 const upstream=JSON.parse(read("src/printing-package/UPSTREAM.json"));
 assert.match(macBuild,/arm64-apple-macosx/);
 assert.match(macBuild,/x86_64-apple-macosx/);
 assert.match(macBuild,/xcrun lipo -create/);
 assert.ok(macBuild.includes('lipo "$OUTPUT" -verify_arch arm64 x86_64'));
 assert.equal(upstream.localPatches.macOSBuildScript.sourceCommit,"1b1d7264413520885b400884103095196377a659");

 const windowsBuild=read("src/printing-package/tools/build-windows-printer-discovery.ps1");
 assert.ok(windowsBuild.includes('$TempDir = Join-Path'));
 assert.ok(windowsBuild.includes('$Object = Join-Path $TempDir'));
 assert.ok(windowsBuild.includes('finally {'));
 assert.ok(windowsBuild.includes('Remove-Item -LiteralPath $TempDir -Recurse -Force'));
 assert.equal(upstream.localPatches.windowsBuildScript.sourceCommit,"bb057ac192faa714e92deb218768506301d21367");

});


test("prepares a content-only print document for every Brightdesk product", () => {
  const app = read("src/app.js");
  const css = read("src/styles.css");
  assert.match(app, /const PRINTABLE_APP_TARGETS/);
  assert.match(app, /createBrightdeskPrintDocument/);
  assert.match(app, /activeDoc\(\)\.slides/);
  for (const appId of [
    "pages", "sheets", "slides", "notes", "database",
    "forms", "lists", "planner", "todo", "loop"
  ]) {
    assert.ok(app.includes(appId), `Missing print support for ${appId}`);
  }
  assert.match(app, /brightdesk-print-root/);
  assert.match(css, /#brightdesk-print-root/);
  assert.match(css, /data-app=["']slides["']/);
});


test("Brightdesk Forms includes the preview and response panels required for printable forms", () => {
  const html = read("src/index.html");
  for (const id of [
    "forms-questions-panel",
    "forms-preview-panel",
    "forms-response-form",
    "forms-responses-panel",
    "forms-response-list",
    "forms-status"
  ]) assert.match(html, new RegExp(`id="${id}"`));
});

test("prints every Decks slide as a themed 16:9 slide in landscape orientation", () => {
  const app = read("src/app.js");
  const css = read("src/styles.css");
  assert.ok(app.includes('if (appId !== "slides")'));
  assert.ok(app.includes("brightdesk-print-slide slide-stage theme-${slideTheme}"));
  assert.ok(app.includes('slideTitle.className = "slide-title"'));
  assert.ok(app.includes('body.className = "slide-body"'));
  assert.ok(app.includes('printRequest.orientation = "landscape"'));
  assert.ok(app.includes("window.brightdesk.printing.print(printRequest)"));
  assert.ok(css.includes('#brightdesk-print-root[data-app="slides"] .brightdesk-print-slide {'));
  assert.ok(css.includes("aspect-ratio: 16 / 9 !important;"));
  assert.ok(css.includes("#brightdesk-print-root .brightdesk-print-slide.theme-midnight .slide-title"));
  assert.ok(css.includes("#brightdesk-print-root .brightdesk-print-slide.theme-midnight .slide-body"));
  assert.ok(css.includes(".theme-midnight{background:#242746}"));
  assert.ok(css.includes(".theme-paper{background:#fff;border:1px solid #e1e1e1}"));
  assert.ok(!css.includes('  #brightdesk-print-root[data-app="slides"] .brightdesk-print-slide {\n    background: #fff !important;'));
});


test("keeps discovered network printer addresses and service URIs out of product records", async () => {
  const { createHash } = await import("node:crypto");
  const { discoverNetworkPrinterServices } = await import(
    "../src/printing-package/src/ipp-printer-discovery.mjs"
  );

  for (const [serviceUri, address] of [
    ["ipp://192.168.10.24:631/ipp/print", "192.168.10.24"],
    ["ipps://[2001:db8::25]:631/ipp/print", "2001:db8::25"]
  ]) {
    const printers = await discoverNetworkPrinterServices({
      platform: "linux",
      async runCommand() {
        return { stdout: `${serviceUri}\\n` };
      }
    });

    const expectedId = `dns-sd:${createHash("sha256").update(serviceUri, "utf8").digest("hex")}`;
    assert.deepEqual(printers, [{
      id: expectedId,
      displayName: "Network printer",
      source: "dns-sd",
      availability: "discovered",
      canPrint: false
    }]);
    assert.equal(Object.hasOwn(printers[0], "uri"), false);
    assert.equal(JSON.stringify(printers).includes(serviceUri), false);
    assert.equal(JSON.stringify(printers).includes(address), false);
  }
});

test("keeps friendly DNS-SD printer names without exposing their service URI", async () => {
  const { discoverNetworkPrinterServices } = await import(
    "../src/printing-package/src/ipp-printer-discovery.mjs"
  );
  const serviceUri = "ipp://Office-Laser.local:631/ipp/print";
  const printers = await discoverNetworkPrinterServices({
    platform: "linux",
    async runCommand() {
      return { stdout: `${serviceUri}\\n` };
    }
  });

  assert.equal(printers.length, 1);
  assert.equal(printers[0].displayName, "Office Laser");
  assert.match(printers[0].id, /^dns-sd:[a-f0-9]{64}$/);
  assert.equal(Object.hasOwn(printers[0], "uri"), false);
  assert.equal(JSON.stringify(printers).includes(serviceUri), false);
});
