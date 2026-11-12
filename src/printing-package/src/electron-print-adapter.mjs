import { PrintingError } from "./printing-error.mjs";
import { normalizePrintRequest } from "./validate-print-request.mjs";
import { discoverNetworkPrinterServices, pairDiscoveredWsdPrinter } from "./ipp-printer-discovery.mjs";
import { openPrinterSettings as openNativePrinterSettings } from "./printer-settings.mjs";
import { queryPrinterCapabilities } from "./printer-capabilities.mjs";

function assertLiveWebContents(webContents, methodName) {
  if (!webContents || typeof webContents[methodName] !== "function") {
    throw new PrintingError(
      "PRINTING_UNAVAILABLE",
      `The desktop runtime does not provide ${methodName}().`,
    );
  }

  if (typeof webContents.isDestroyed === "function" && webContents.isDestroyed()) {
    throw new PrintingError("PRINTING_UNAVAILABLE", "The print document is no longer available.");
  }
}

function toElectronOptions(request) {
  const options = {
    silent: false,
    printBackground: request.printBackground,
    color: request.color,
    landscape: request.orientation === "landscape",
    duplexMode: request.duplex,
    copies: request.copies,
  };

  if (request.printerName !== undefined) options.deviceName = request.printerName;
  if (request.pageSize !== undefined) options.pageSize = request.pageSize;
  if (request.pageRanges !== undefined) options.pageRanges = request.pageRanges;
  if (request.margins !== undefined) options.margins = request.margins;

  return options;
}

export async function listSystemPrinters(webContents) {
  assertLiveWebContents(webContents, "getPrintersAsync");

  let printers;
  try {
    printers = await webContents.getPrintersAsync();
  } catch (cause) {
    throw new PrintingError("PRINTER_DISCOVERY_FAILED", "The system printer list could not be read.", { cause });
  }

  if (!Array.isArray(printers)) {
    throw new PrintingError("PRINTER_DISCOVERY_FAILED", "The desktop runtime returned an invalid printer list.");
  }

  return printers
    .filter((printer) => printer && typeof printer.name === "string" && printer.name.trim() !== "")
    .map((printer) => ({
      systemName: printer.name,
      displayName: typeof printer.displayName === "string" && printer.displayName.trim() !== ""
        ? printer.displayName
        : printer.name,
      description: typeof printer.description === "string" ? printer.description : "",
      status: typeof printer.status === "string" || typeof printer.status === "number"
        ? printer.status
        : null,
      isDefault: printer.isDefault === true,
    }));
}

export async function submitPrintJob(webContents, input) {
  const request = normalizePrintRequest(input);

  // A printer selected from an earlier discovery can disappear before the
  // user confirms printing. Never silently fall back to a different queue.
  if (request.printerName !== undefined) {
    const printers = await listSystemPrinters(webContents);
    if (!printers.some((printer) => printer.systemName === request.printerName)) {
      throw new PrintingError(
        "PRINTER_NOT_FOUND",
        "The selected printer is no longer available. Refresh the printer list and choose an available printer.",
      );
    }
  }

  assertLiveWebContents(webContents, "print");
  const options = toElectronOptions(request);

  return new Promise((resolve, reject) => {
    let settled = false;

    const finish = (callback) => (...args) => {
      if (settled) return;
      settled = true;
      callback(...args);
    };

    try {
      webContents.print(options, finish((success, failureReason) => {
        if (success === true) {
          resolve({
            status: "submitted",
            requestedPrinterName: request.printerName ?? null,
          });
          return;
        }

        const reason = typeof failureReason === "string" && failureReason.trim() !== ""
          ? failureReason
          : "The operating system did not accept the print job.";
        reject(new PrintingError("PRINT_FAILED", reason));
      }));
    } catch (cause) {
      settled = true;
      reject(new PrintingError("PRINT_FAILED", "The print request could not be submitted.", { cause }));
    }
  });
}

export function createElectronPrintAdapter(webContents, {
  discoverNetworkPrinters = discoverNetworkPrinterServices,
  pairNetworkPrinter = pairDiscoveredWsdPrinter,
  platform = process.platform,
  shell,
  env = process.env,
  launchCommand,
  runCapabilityCommand,
} = {}) {
  return Object.freeze({
    listPrinters: () => listSystemPrinters(webContents),
    discoverNetworkPrinters: () => discoverNetworkPrinters(),
    pairNetworkPrinter: (printer) => pairNetworkPrinter(printer, { platform }),
    getPrinterCapabilities: (systemName) => queryPrinterCapabilities(webContents, systemName, {
      platform,
      runCommand: runCapabilityCommand,
    }),
    openPrinterSettings: () => openNativePrinterSettings({
      platform,
      shell,
      env,
      launchCommand,
    }),
    print: (request) => submitPrintJob(webContents, request),
  });
}
