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
  assert.match(app, /\$\('print-button'\)\.addEventListener\('click', printCurrent\)/);
  assert.match(app, /\$\('printer-settings-button'\)\.addEventListener\('click', openPrinterSettings\)/);
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
