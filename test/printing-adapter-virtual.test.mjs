import test from "node:test";
import assert from "node:assert/strict";
import { createElectronPrintAdapter } from "../src/printing-package/src/electron-print-adapter.mjs";
import { createVirtualPrinterRuntime } from "./fixtures/printing-virtual-printer.mjs";

test("runs the configured-printer workflow with a virtual printer and no physical hardware", async () => {
  const virtualPrinter = createVirtualPrinterRuntime({
    name: "Brightdesk_Virtual_Printer",
    displayName: "Brightdesk Virtual Printer",
    options: { "printer-type": 24 },
  });
  const adapter = createElectronPrintAdapter(virtualPrinter.webContents, {
    platform: "linux",
    async runCapabilityCommand(command, args) {
      assert.equal(command, "lpoptions");
      assert.deepEqual(args, ["-p", "Brightdesk_Virtual_Printer", "-l"]);
      return {
        stdout: [
          "PageSize/Media Size: *A4 Letter",
          "Resolution/Print Quality: *300dpi 600dpi",
          "Duplex/Two-Sided: *None DuplexNoTumble DuplexTumble",
          "ColorModel/Color Mode: *RGB Gray",
        ].join("\n"),
      };
    },
  });

  assert.deepEqual(await adapter.listPrinters(), [{
    systemName: "Brightdesk_Virtual_Printer",
    displayName: "Brightdesk Virtual Printer",
    description: "Virtual test queue; no physical printer is connected.",
    status: 0,
    isDefault: true,
  }]);

  const capabilities = await adapter.getPrinterCapabilities("Brightdesk_Virtual_Printer");
  assert.equal(capabilities.capabilities.color, true);
  assert.deepEqual(capabilities.capabilities.duplex, {
    supported: true,
    modes: ["long-edge", "short-edge"],
  });
  assert.deepEqual(capabilities.capabilities.paperSizes, ["A4", "Letter"]);
  assert.deepEqual(capabilities.capabilities.resolutionsDpi, [
    { x: 300, y: 300 },
    { x: 600, y: 600 },
  ]);

  const submission = await adapter.print({
    printerName: "Brightdesk_Virtual_Printer",
    orientation: "portrait",
    color: true,
    duplex: "longEdge",
    copies: 2,
  });

  assert.deepEqual(submission, {
    status: "submitted",
    requestedPrinterName: "Brightdesk_Virtual_Printer",
  });
  assert.equal(virtualPrinter.jobs.length, 1);
  assert.deepEqual(virtualPrinter.jobs[0].options, {
    silent: false,
    printBackground: false,
    color: true,
    landscape: false,
    duplexMode: "longEdge",
    copies: 2,
    deviceName: "Brightdesk_Virtual_Printer",
  });
});

test("does not submit to a virtual queue after that queue is removed", async () => {
  const virtualPrinter = createVirtualPrinterRuntime();
  const adapter = createElectronPrintAdapter(virtualPrinter.webContents);
  virtualPrinter.setAvailable(false);

  await assert.rejects(
    adapter.print({ printerName: "Brightdesk_Virtual_Printer" }),
    { code: "PRINTER_NOT_FOUND" },
  );
  assert.equal(virtualPrinter.jobs.length, 0);
});

test("reports a virtual operating-system print rejection without claiming a printed page", async () => {
  const virtualPrinter = createVirtualPrinterRuntime();
  const adapter = createElectronPrintAdapter(virtualPrinter.webContents);
  virtualPrinter.setPrintResult(false, "Virtual spooler rejected the test job.");

  await assert.rejects(
    adapter.print({ printerName: "Brightdesk_Virtual_Printer" }),
    {
      code: "PRINT_FAILED",
      message: "Virtual spooler rejected the test job.",
    },
  );
  assert.equal(virtualPrinter.jobs.length, 1);
});
