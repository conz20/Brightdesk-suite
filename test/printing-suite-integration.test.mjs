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
 assert.ok(windowsBuild.includes('vswhere.exe'));
 assert.ok(windowsBuild.includes('VsDevCmd.bat'));
 assert.ok(windowsBuild.includes('-arch=x64 -host_arch=x64'));
 assert.ok(windowsBuild.includes('WindowsSdkDir'));
 assert.doesNotMatch(windowsBuild,/Run this script from a Visual Studio Developer PowerShell/);
 assert.equal(upstream.localPatches.windowsBuildScript.sourceCommit,"7cf74214a8b0dd732ec5c703fa47c4a25a1a40d2");

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
  assert.match(app, /createFormsPrintView\(source\)/);
  assert.match(app, /content\.replaceChildren\(formsPrintView\)/);
  assert.match(app, /appId !== "slides" && appId !== "forms"/);
  assert.match(css, /#brightdesk-print-root \.brightdesk-print-form/);
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
  assert.ok(app.includes('if (appId !== "slides" && appId !== "forms")'));
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
    ["ipps://[2001:db8::25]:631/ipp/print", "2001:db8::25"],
    ["ipp://192.168.10.24.local:631/ipp/print", "192.168.10.24"]
  ]) {
    const printers = await discoverNetworkPrinterServices({
      platform: "linux",
      async runCommand() {
        return { stdout: `${serviceUri}\n` };
      }
    });

    const plainDigest = `dns-sd:${createHash("sha256").update(serviceUri, "utf8").digest("hex")}`;
    assert.deepEqual(printers.map(({ id, ...printer }) => printer), [{
      displayName: "Network printer",
      source: "dns-sd",
      availability: "discovered",
      canPrint: false
    }]);
    assert.equal(Object.hasOwn(printers[0], "uri"), false);
    assert.equal(JSON.stringify(printers).includes(serviceUri), false);
    assert.equal(JSON.stringify(printers).includes(address), false);
    assert.match(printers[0].id, /^dns-sd:[a-f0-9]{64}$/);
    assert.notEqual(printers[0].id, plainDigest);
    const repeated = await discoverNetworkPrinterServices({
      platform: "linux",
      async runCommand() { return { stdout: `${serviceUri}\\n` }; }
    });
    assert.equal(repeated[0].id, printers[0].id);
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
      return { stdout: `${serviceUri}\n` };
    }
  });

  assert.equal(printers.length, 1);
  assert.equal(printers[0].displayName, "Office Laser");
  assert.match(printers[0].id, /^dns-sd:[a-f0-9]{64}$/);
  assert.equal(Object.hasOwn(printers[0], "uri"), false);
  assert.equal(JSON.stringify(printers).includes(serviceUri), false);
});

test("keeps Windows WSD device IDs private across refreshes while pairing through the main process", async () => {
  const { discoverNetworkPrinterServices, pairDiscoveredWsdPrinter } = await import(
    "../src/printing-package/src/ipp-printer-discovery.mjs"
  );
  const deviceId = "Brightdesk-Private-WSD-Office-Printer";
  const encodedDeviceId = Buffer.from(deviceId, "utf8").toString("base64url");
  const encodedName = Buffer.from("Office Printer", "utf8").toString("base64url");
  const scan = (id, name) => discoverNetworkPrinterServices({
    platform: "win32",
    async runCommand() { return { stdout: `WSD\t${id}\t${name}\t1\t0\n` }; }
  });

  const [selectedPrinter] = await scan(encodedDeviceId, encodedName);
  assert.equal(selectedPrinter.displayName, "Office Printer");
  assert.match(selectedPrinter.id, /^wsd:[a-f0-9]{64}$/);
  assert.notEqual(selectedPrinter.id, `wsd:${encodedDeviceId}`);
  assert.equal(JSON.stringify(selectedPrinter).includes(encodedDeviceId), false);
  assert.equal(JSON.stringify(selectedPrinter).includes(deviceId), false);

  let pairArgs;
  const paired = await pairDiscoveredWsdPrinter(selectedPrinter, {
    platform: "win32",
    async runCommand(_command, args) {
      pairArgs = args;
      return { stdout: "WSD_PAIR_RESULT\tPAIRED\n" };
    }
  });
  assert.deepEqual(pairArgs, ["--pair-wsd", encodedDeviceId]);
  assert.deepEqual(paired, { status: "paired", protocol: "wsd", refreshRequired: true });

  const otherId = Buffer.from("Brightdesk-Another-WSD-Printer", "utf8").toString("base64url");
  const otherName = Buffer.from("Another Printer", "utf8").toString("base64url");
  await scan(otherId, otherName);
  let refreshedPairArgs;
  const refreshedPairing = await pairDiscoveredWsdPrinter(selectedPrinter, {
    platform: "win32",
    async runCommand(_command, args) {
      refreshedPairArgs = args;
      return { stdout: "WSD_PAIR_RESULT\tPAIRED\n" };
    }
  });
  assert.deepEqual(refreshedPairArgs, ["--pair-wsd", encodedDeviceId]);
  assert.deepEqual(refreshedPairing, { status: "paired", protocol: "wsd", refreshRequired: true });
});

test("offers an explicit network-printer search and safe result actions", () => {
  const html = read("src/index.html");
  const app = read("src/app.js");

  assert.match(html, /id="find-network-printers-button"/);
  assert.match(html, /id="network-printer-panel"/);
  assert.match(html, /id="discover-network-printers-button"/);
  assert.match(html, /id="network-printer-results"/);
  assert.match(html, /id="network-printer-status"/);
  assert.match(app, /\$\('find-network-printers-button'\)\.addEventListener\('click', openNetworkPrinterPanel\)/);
  assert.match(app, /\$\('discover-network-printers-button'\)\.addEventListener\('click', discoverNetworkPrinters\)/);
  assert.match(app, /window\.brightdesk\.printing\.discoverNetworkPrinters\(\)/);
  assert.match(app, /window\.brightdesk\.printing\.pairNetworkPrinter\(printer\)/);
  assert.match(app, /window\.brightdesk\.printing\.openPrinterSettings\(\)/);
  assert.doesNotMatch(app, /printer\.uri/);
});

test("shows safe configured-printer capability details and unknown values honestly", () => {
  const html = read("src/index.html");
  const app = read("src/app.js");
  assert.match(html, /id="refresh-configured-printers-button"/);
  assert.match(html, /id="configured-printer-list"/);
  assert.match(html, /id="configured-printer-status"/);
  assert.match(app, /window\.brightdesk\.printing\.listPrinters\(\)/);
  assert.match(app, /window\.brightdesk\.printing\.getPrinterCapabilities\(/);
  assert.match(app, /renderPrinterCapabilities/);
  assert.match(app, /printing\.notReported/);
  assert.match(app, /printing\.maximumCopies/);
  assert.match(app, /printer\.systemName/);
  assert.match(app, /textContent/);
  assert.match(app, /await refreshConfiguredPrinters\(\)/);
});


test("requires an explicit configured-printer selection and binds printing to that queue", () => {
  const html = read("src/index.html");
  const app = read("src/app.js");
  assert.match(html, /id="print-printer-select"/);
  assert.match(html, /for="print-printer-select"/);
  assert.match(app, /const selectedPrinter = \$\('print-printer-select'\)\.value/);
  assert.match(app, /if \(!selectedPrinter\)/);
  assert.match(app, /printerName: selectedPrinter/);
  assert.match(app, /select\.value = availableSelection/);
  assert.match(app, /printers\.some\(printer => printer\.systemName === select\.value\)/);
  assert.match(app, /return printers/);
  assert.match(app, /openNetworkPrinterPanel\(\)/);
  assert.match(app, /\$\('print-printer-select'\)\.focus\(\)/);
});


test("uses product-aware print orientation for pages, sheets and decks", () => {
  const app = read("src/app.js");
  assert.match(app, /if \(state\.app === "pages"\) \{\s*printRequest\.orientation = pageLayout\.normalizePageLayout\(activeDoc\(\)\?\.pageSettings \|\| \{\}\)\.orientation/);
  assert.match(app, /if \(state\.app === "sheets"\) \{\s*printRequest\.orientation = "landscape"/);
  assert.match(app, /if \(state\.app === "slides"\) \{\s*printRequest\.orientation = "landscape"/);
});


test("every approved product print target resolves to a real product content element", () => {
  const app = read("src/app.js");
  const html = read("src/index.html");
  const targets = {
    pages: "editor",
    sheets: "sheet-wrap",
    slides: "slide-wrap",
    notes: "notes-wrap",
    database: "database-wrap",
    forms: "forms-wrap",
    lists: "lists-wrap",
    planner: "planner-wrap",
    todo: "todo-wrap",
    loop: "workspace-app-wrap"
  };
  for (const [product, targetId] of Object.entries(targets)) {
    assert.match(
      app,
      new RegExp(`\\b${product}: ["']${targetId}["']`),
      `Missing print target mapping for ${product}`
    );
    assert.match(
      html,
      new RegExp(`id=["']${targetId}["']`),
      `Print target element ${targetId} for ${product} is missing from the product UI`
    );
  }
  assert.equal(Object.keys(targets).length, 10);
});


test("print snapshots preserve live form values and remove interactive controls", () => {
  const app = read("src/app.js");
  assert.match(app, /const content = source\.cloneNode\(true\)/);
  assert.match(app, /const sourceControls = Array\.from\(source\.querySelectorAll\("input, textarea, select"\)\)/);
  assert.match(app, /const printControls = Array\.from\(content\.querySelectorAll\("input, textarea, select"\)\)/);
  assert.match(app, /original\.checked \? "☑" : "☐"/);
  assert.match(app, /original\.selectedOptions\[0\]\?\.textContent/);
  assert.match(app, /value\.textContent = original\.value \|\| "\\u00a0"/);
  assert.match(app, /content\.querySelectorAll\("button"\)\.forEach\(\(button\) => button\.remove\(\)\)/);
  assert.match(app, /content\.querySelectorAll\("\[hidden\]"\)\.forEach\(\(element\) => element\.remove\(\)\)/);
  assert.match(app, /original\.type === "hidden"/);
});


test("print stylesheet lays out the ten product workspaces and paginates long content safely", () => {
  const css = read("src/styles.css");
  assert.match(css, /#brightdesk-print-root\s*\{\s*display:\s*none/);
  assert.match(css, /@media print\s*\{/);
  for (const productClass of [
    "todo-app",
    "lists-app",
    "forms-app",
    "planner-app",
    "database-app",
    "workspace-app"
  ]) {
    assert.ok(css.includes(`#brightdesk-print-root .${productClass}`), `Missing print layout for ${productClass}`);
  }
  assert.match(css, /#brightdesk-print-root \.sheet\s*\{/);
  assert.match(css, /#brightdesk-print-root table\s*\{/);
  assert.match(css, /break-inside:\s*avoid/);
  assert.match(css, /break-after:\s*page/);
  assert.match(css, /#brightdesk-print-root img\s*\{/);
  assert.match(css, /#brightdesk-print-root \.workspace-block-tools/);
  assert.match(css, /#brightdesk-print-root \.workspace-check-add/);
  assert.match(css, /#brightdesk-print-root \.lists-table,/);
  assert.match(css, /#brightdesk-print-root \.database-data-grid\s*\{/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /min-width:\s*0\s*!important/);
  assert.match(css, /#brightdesk-print-root \.planner-board\s*\{\s*display:\s*block !important;/);
  assert.match(css, /#brightdesk-print-root \.planner-column\s*\{[^}]*break-inside:\s*auto/);
});


test("print DOM removes action-only table columns without losing row data", async () => {
  const { JSDOM } = await import("jsdom");
  const helper = read("src/printing-dom.js");
  const dom = new JSDOM("<!doctype html><table class='lists-table'><thead><tr><th>Name</th><th>Actions</th></tr></thead><tbody><tr><td>Meeting</td><td><button>Edit</button><button>Delete</button></td></tr><tr><td colspan='2'>No records</td></tr></tbody></table>", { runScripts: "outside-only" });
  dom.window.eval(helper);
  const table = dom.window.document.querySelector("table");
  dom.window.BrightdeskPrintDom.removeActionColumns(table);
  assert.deepEqual(Array.from(table.querySelectorAll("tr"), row => Array.from(row.cells, cell => ({ text: cell.textContent.trim(), colspan: cell.colSpan }))), [
    [{ text: "Name", colspan: 1 }],
    [{ text: "Meeting", colspan: 1 }],
    [{ text: "No records", colspan: 1 }]
  ]);
  dom.window.close();
});


test("print cleanup preserves Actions columns in customer-authored tables", async () => {
  const { JSDOM } = await import("jsdom");
  const helper = read("src/printing-dom.js");
  const dom = new JSDOM("<!doctype html><table><thead><tr><th>Task</th><th>Actions</th></tr></thead><tbody><tr><td>Review notes</td><td>Keep this text</td></tr></tbody></table>", { runScripts: "outside-only" });
  dom.window.eval(helper);
  const table = dom.window.document.querySelector("table");
  dom.window.BrightdeskPrintDom.removeActionColumns(table);
  assert.deepEqual(Array.from(table.querySelectorAll("tr"), row => Array.from(row.cells, cell => cell.textContent.trim())), [
    ["Task", "Actions"],
    ["Review notes", "Keep this text"]
  ]);
  dom.window.close();
});


test("print cleanup removes the generated action column from Database tables", async () => {
  const { JSDOM } = await import("jsdom");
  const helper = read("src/printing-dom.js");
  const dom = new JSDOM("<!doctype html><table class='database-data-grid'><thead><tr><th>Record</th><th>Actions</th></tr></thead><tbody><tr><td>Customer 1</td><td><button>Delete</button></td></tr></tbody></table>", { runScripts: "outside-only" });
  dom.window.eval(helper);
  const table = dom.window.document.querySelector("table");
  dom.window.BrightdeskPrintDom.removeActionColumns(table);
  assert.deepEqual(Array.from(table.querySelectorAll("tr"), row => Array.from(row.cells, cell => cell.textContent.trim())), [
    ["Record"],
    ["Customer 1"]
  ]);
  dom.window.close();
});


test("Forms print view renders readable questions and answer choices", async () => {
  const { JSDOM } = await import("jsdom");
  const helper = read("src/printing-dom.js");
  const dom = new JSDOM(`<!doctype html>
    <section class="forms-app">
      <h2 id="forms-title">Visitor questionnaire</h2>
      <p id="forms-description">Tell us about your visit.</p>
      <form class="forms-question-card">
        <input name="label" value="Your name">
        <select name="type"><option value="short-text">Short answer</option></select>
        <input name="options" value="">
        <input name="required" type="checkbox" checked>
      </form>
      <form class="forms-question-card">
        <input name="label" value="Which areas did you visit?">
        <select name="type"><option value="multi-choice" selected>Multiple choice</option></select>
        <input name="options" value="Gallery, Garden, Cafe">
        <input name="required" type="checkbox">
      </form>
    </section>`, { runScripts: "outside-only" });
  dom.window.eval(helper);
  const app = dom.window.document.querySelector(".forms-app");
  const view = dom.window.BrightdeskPrintDom.createFormsPrintView(app);
  assert.equal(view.querySelector("h2").textContent, "Visitor questionnaire");
  assert.equal(view.querySelector("p").textContent, "Tell us about your visit.");
  assert.equal(view.querySelectorAll(".brightdesk-print-question").length, 2);
  assert.match(view.textContent, /Your name/);
  assert.match(view.textContent, /Which areas did you visit\?/);
  assert.match(view.textContent, /Gallery/);
  assert.match(view.textContent, /Garden/);
  assert.match(view.textContent, /Cafe/);
  assert.match(view.textContent, /Required/);
  assert.equal(view.querySelector("input, select, button, form"), null);
  dom.window.close();
});


test("Forms print keeps the saved responses view when the Responses tab is selected", async () => {
  const { JSDOM } = await import("jsdom");
  const helper = read("src/printing-dom.js");
  const dom = new JSDOM(`<!doctype html>
    <section class="forms-app">
      <nav><button data-forms-tab="responses" class="active">Responses</button></nav>
      <h2 id="forms-title">Visitor questionnaire</h2>
      <div class="forms-question-card">
        <input name="label" value="Your name">
        <select name="type"><option value="short-text">Short answer</option></select>
        <input name="required" type="checkbox">
      </div>
      <section id="forms-responses-panel">
        <article class="forms-response-card"><b>Response 1</b><p>Your name: Alex</p></article>
      </section>
    </section>`, { runScripts: "outside-only" });
  dom.window.eval(helper);
  const app = dom.window.document.querySelector(".forms-app");
  assert.equal(dom.window.BrightdeskPrintDom.createFormsPrintView(app), null);
  dom.window.close();
});
