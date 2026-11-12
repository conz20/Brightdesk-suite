import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("checked-in printing package is a dependency-free snapshot of the canonical source", () => {
  const pkg = JSON.parse(read("src/printing-package/package.json"));
  const upstream = JSON.parse(read("src/printing-package/UPSTREAM.json"));
  assert.equal(pkg.name, "@brightdesk/printing");
  assert.equal(pkg.version, "0.1.0");
  assert.equal(pkg.type, "module");
  assert.equal(upstream.sourceRepository, "conz20/Brightdesk-Printing");
  assert.equal(upstream.sourceCommit, "70d41095616c6d1cd3473c0ad73a6ecb5a596c05");
  assert.deepEqual(pkg.dependencies || {}, {});
  for (const file of [
    "index.mjs",
    "index.d.ts",
    "src/electron-print-adapter.mjs",
    "src/printing-error.mjs",
    "src/validate-print-request.mjs",
    "src/ipp-printer-discovery.mjs",
    "src/printer-settings.mjs",
    "src/printer-capabilities.mjs",
  ]) {
    assert.ok(fs.statSync(path.join(root, "src/printing-package", file)).isFile(), file);
  }
});

test("all built-in language packs include print action labels", () => {
  for (const locale of ["en-AU", "de-DE", "es-ES", "fr-FR"]) {
    const pack = JSON.parse(read(`src/languages/${locale}.json`));
    assert.equal(typeof pack.translations["top.print"], "string", `${locale} print label`);
    assert.equal(typeof pack.translations["top.printerSettings"], "string", `${locale} printer settings label`);
    assert.ok(pack.translations["top.print"].length > 0);
    assert.ok(pack.translations["top.printerSettings"].length > 0);
  }
});
