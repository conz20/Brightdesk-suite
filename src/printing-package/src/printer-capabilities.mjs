import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { PrintingError } from "./printing-error.mjs";

const execFileAsync = promisify(execFile);
const WINDOWS_CAPABILITIES_HELPER = fileURLToPath(
  new URL("../native/windows/brightdesk-ipp-discovery.exe", import.meta.url),
);
const CUPS_COLOR_BIT = 0x0008;
const CUPS_DUPLEX_BIT = 0x0010;
const MAX_LIST_ITEMS = 128;
const SAFE_OPTION_TOKEN = /^[A-Za-z0-9_.-]{1,64}$/;

async function runSystemCommand(command, args, options) {
  return execFileAsync(command, args, options);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function safeToken(value) {
  if (typeof value !== "string") return null;
  const token = value.trim();
  return SAFE_OPTION_TOKEN.test(token) ? token : null;
}

function uniqueTokens(values) {
  if (!Array.isArray(values)) return null;
  const output = [];
  const seen = new Set();
  for (const value of values) {
    const token = safeToken(value);
    if (token && !seen.has(token)) {
      seen.add(token);
      output.push(token);
      if (output.length >= MAX_LIST_ITEMS) break;
    }
  }
  return output.length > 0 ? output : null;
}

function uniquePaperSizes(values) {
  if (!Array.isArray(values)) return null;
  const output = [];
  const seen = new Set();
  for (const value of values) {
    if (typeof value !== "string") continue;
    const label = value.trim();
    if (
      label.length === 0
      || label.length > 64
      || !/^[\p{L}\p{N}]/u.test(label)
      || /[<>\u0000-\u001F\u007F-\u009F]/u.test(label)
      || seen.has(label.toLowerCase())
    ) continue;
    seen.add(label.toLowerCase());
    output.push(label);
    if (output.length >= MAX_LIST_ITEMS) break;
  }
  return output.length > 0 ? output : null;
}

function splitOptionValues(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => typeof item === "string");
  }
  if (typeof value !== "string") return [];
  return value.split(/[\s,]+/).filter(Boolean);
}

function getOptionValues(options, names) {
  for (const name of names) {
    if (Object.hasOwn(options, name)) {
      const values = splitOptionValues(options[name]);
      if (values.length > 0) return values;
    }
  }
  return null;
}

function parseCupsOptions(output) {
  const values = new Map();
  if (typeof output !== "string" || output.length === 0) return values;

  for (const line of output.split(/\r?\n/).slice(0, 2000)) {
    const separator = line.indexOf(":");
    if (separator <= 0) continue;
    const optionLabel = line.slice(0, separator).trim();
    const rawChoices = line.slice(separator + 1).trim();
    const slash = optionLabel.indexOf("/");
    const optionName = (slash >= 0 ? optionLabel.slice(0, slash) : optionLabel).trim().toLowerCase();
    if (!optionName || rawChoices.length === 0) continue;

    const choices = rawChoices
      .split(/\s+/)
      .map((choice) => choice.replace(/^\*/, ""))
      .filter((choice) => SAFE_OPTION_TOKEN.test(choice))
      .slice(0, MAX_LIST_ITEMS);
    if (choices.length > 0) values.set(optionName, choices);
  }
  return values;
}

function getCupsOption(values, names) {
  for (const name of names) {
    const result = values.get(name);
    if (result && result.length > 0) return result;
  }
  return null;
}

function normalizeColor(values) {
  if (!values) return null;
  const normalized = new Set(values.map((value) => value.toLowerCase()));
  const hasColor = ["color", "colour", "rgb", "cmyk", "auto-color"].some((value) => normalized.has(value));
  const hasMonochrome = ["monochrome", "monochrome-1", "bi-level", "gray", "grey", "black"].some((value) => normalized.has(value));
  if (hasColor) return true;
  if (hasMonochrome) return false;
  return null;
}

function normalizeDuplex(values, kind) {
  if (!values || values.length === 0) return null;
  const normalized = new Set(values.map((value) => value.toLowerCase()));
  const modes = [];

  if (kind === "cups-duplex") {
    if (normalized.has("duplexnotumble") || normalized.has("duplexno-tumble")) {
      modes.push("long-edge");
    }
    if (normalized.has("duplextumble")) modes.push("short-edge");
  } else {
    if (normalized.has("two-sided-long-edge")) modes.push("long-edge");
    if (normalized.has("two-sided-short-edge")) modes.push("short-edge");
  }

  const explicitlySimplex = ["none", "off", "false", "one-sided", "simplex"].some((value) => normalized.has(value));
  if (modes.length > 0) return { supported: true, modes };
  if (explicitlySimplex) return { supported: false, modes: [] };
  return null;
}

function normalizeResolutionList(values) {
  if (!values) return null;
  const output = [];
  const seen = new Set();

  for (const value of values) {
    const match = /^(\d{2,5})(?:x(\d{2,5}))?dpi$/i.exec(value);
    if (!match) continue;
    const x = Number(match[1]);
    const y = Number(match[2] ?? match[1]);
    if (!Number.isSafeInteger(x) || !Number.isSafeInteger(y) || x <= 0 || y <= 0 || x > 9600 || y > 9600) continue;
    const key = `${x}x${y}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({ x, y });
    if (output.length >= MAX_LIST_ITEMS) break;
  }
  return output.length > 0 ? output : null;
}

function normalizeMaximumCopies(value) {
  if (isRecord(value) && Number.isSafeInteger(value.upper)) {
    value = value.upper;
  }

  let candidates = [];
  if (Array.isArray(value)) {
    candidates = value.flatMap((item) => {
      if (isRecord(item) && Number.isSafeInteger(item.upper)) return [item.upper];
      if (typeof item === "number" && Number.isSafeInteger(item)) return [item];
      if (typeof item === "string") {
        const match = /^(\d+)(?:\s*[-:]\s*(\d+))?$/.exec(item.trim());
        if (match) return [Number(match[2] ?? match[1])];
      }
      return [];
    });
  } else if (typeof value === "number" && Number.isSafeInteger(value)) {
    candidates = [value];
  } else if (typeof value === "string") {
    const match = /^(\d+)(?:\s*[-:]\s*(\d+))?$/.exec(value.trim());
    if (match) candidates = [Number(match[2] ?? match[1])];
  }

  const maximum = candidates.length ? Math.max(...candidates) : null;
  return Number.isSafeInteger(maximum) && maximum >= 1 && maximum <= 100000
    ? maximum
    : null;
}

function normalizeWindowsCapabilities(value) {
  if (!isRecord(value)) return null;

  const color = typeof value.color === "boolean" ? value.color : null;
  const duplexSupported = typeof value.duplex === "boolean" ? value.duplex : null;
  const paperSizes = uniquePaperSizes(value.paperSizes);
  const resolutionsDpi = Array.isArray(value.resolutionsDpi)
    ? value.resolutionsDpi
      .filter((item) => isRecord(item)
        && Number.isSafeInteger(item.x) && item.x > 0 && item.x <= 9600
        && Number.isSafeInteger(item.y) && item.y > 0 && item.y <= 9600)
      .slice(0, MAX_LIST_ITEMS)
      .map((item) => ({ x: item.x, y: item.y }))
    : null;
  const maximumCopies = normalizeMaximumCopies(value.maximumCopies);

  return {
    color,
    duplex: {
      supported: duplexSupported,
      modes: duplexSupported === false ? [] : null,
    },
    paperSizes,
    resolutionsDpi: resolutionsDpi?.length ? resolutionsDpi : null,
    maximumCopies,
  };
}

function completenessFor(capabilities) {
  const known = [
    capabilities.color !== null,
    capabilities.duplex.supported !== null && capabilities.duplex.modes !== null,
    capabilities.paperSizes !== null,
    capabilities.resolutionsDpi !== null,
    capabilities.maximumCopies !== null,
  ];
  const knownCount = known.filter(Boolean).length;
  if (knownCount === 0) return "unknown";
  if (knownCount === known.length) return "complete";
  return "partial";
}

/**
 * Creates a safe, cross-platform capability report from allowlisted operating-system data.
 * Raw Electron printer options and driver-specific values are never returned.
 */
export function normalizePrinterCapabilities({
  systemName,
  displayName,
  platform = "unknown",
  printerOptions = {},
  cupsOptionsOutput,
  windowsCapabilities,
} = {}) {
  const options = isRecord(printerOptions) ? printerOptions : {};
  const cupsPlatform = platform === "darwin" || platform === "linux";
  const cupsValues = cupsPlatform ? parseCupsOptions(cupsOptionsOutput) : new Map();
  const sources = [];
  const capabilities = {
    color: null,
    duplex: { supported: null, modes: null },
    paperSizes: null,
    resolutionsDpi: null,
    maximumCopies: null,
  };

  if (platform === "darwin" || platform === "linux") {
    const printerType = typeof options["printer-type"] === "number"
      ? options["printer-type"]
      : typeof options["printer-type"] === "string" && /^(?:0x[0-9a-f]+|\d+)$/i.test(options["printer-type"])
        ? Number(options["printer-type"])
        : null;

    if (Number.isSafeInteger(printerType) && printerType >= 0 && printerType <= 0xFFFFFFFF) {
      capabilities.color = Boolean(printerType & CUPS_COLOR_BIT);
      capabilities.duplex.supported = Boolean(printerType & CUPS_DUPLEX_BIT);
      sources.push("electron-cups-metadata");
    }
  }

  // Prefer explicit IPP *-supported attributes over legacy option names.
  const ippColor = cupsPlatform ? getOptionValues(options, ["print-color-mode-supported"]) : null;
  const cupsColor = getCupsOption(cupsValues, ["print-color-mode", "colormodel", "colormode"]);
  const colorValues = ippColor ?? cupsColor;
  if (colorValues) {
    const color = normalizeColor(colorValues);
    if (color !== null) {
      capabilities.color = color;
      sources.push(ippColor ? "electron-allowlisted-option-fields" : "cups-options");
    }
  }

  const ippSides = cupsPlatform ? getOptionValues(options, ["sides-supported"]) : null;
  const cupsSideModes = getCupsOption(cupsValues, ["sides"]);
  const cupsDuplexModes = getCupsOption(cupsValues, ["duplex"]);
  const sideValues = ippSides ?? cupsSideModes ?? cupsDuplexModes;
  if (sideValues) {
    const sideKind = ippSides || cupsSideModes ? "ipp-sides" : "cups-duplex";
    const duplex = normalizeDuplex(sideValues, sideKind);
    if (duplex) {
      capabilities.duplex = duplex;
      sources.push(ippSides ? "electron-allowlisted-option-fields" : "cups-options");
    }
  }

  const ippMedia = cupsPlatform ? getOptionValues(options, ["media-supported", "media-ready"]) : null;
  const cupsMedia = getCupsOption(cupsValues, ["pagesize", "pageregion", "media"]);
  const media = uniquePaperSizes(ippMedia ?? cupsMedia);
  if (media) {
    capabilities.paperSizes = media;
    sources.push(ippMedia ? "electron-allowlisted-option-fields" : "cups-options");
  }

  const ippResolutions = cupsPlatform ? getOptionValues(options, ["printer-resolution-supported"]) : null;
  const cupsResolutions = getCupsOption(cupsValues, ["resolution", "printer-resolution"]);
  const resolutionsDpi = normalizeResolutionList(ippResolutions ?? cupsResolutions);
  if (resolutionsDpi) {
    capabilities.resolutionsDpi = resolutionsDpi;
    sources.push(ippResolutions ? "electron-allowlisted-option-fields" : "cups-options");
  }

  const copiesSupported = cupsPlatform ? options["copies-supported"] : undefined;
  const maximumCopies = normalizeMaximumCopies(copiesSupported);
  if (maximumCopies !== null) {
    capabilities.maximumCopies = maximumCopies;
    sources.push("electron-allowlisted-option-fields");
  }

  if (platform === "win32" && windowsCapabilities !== undefined) {
    const windows = normalizeWindowsCapabilities(windowsCapabilities);
    if (windows) {
      if (windows.color !== null) capabilities.color = windows.color;
      if (windows.duplex.supported !== null) capabilities.duplex = windows.duplex;
      if (windows.paperSizes !== null) capabilities.paperSizes = windows.paperSizes;
      if (windows.resolutionsDpi !== null) capabilities.resolutionsDpi = windows.resolutionsDpi;
      if (windows.maximumCopies !== null) capabilities.maximumCopies = windows.maximumCopies;
      if (Object.values(windows).some((value) => {
        if (value === null) return false;
        if (isRecord(value)) return value.supported !== null;
        return true;
      })) {
        sources.push("windows-device-capabilities");
      }
    }
  }

  const uniqueSources = [...new Set(sources)];
  return {
    systemName: typeof systemName === "string" ? systemName : "",
    displayName: typeof displayName === "string" && displayName.trim() ? displayName : systemName ?? "",
    completeness: completenessFor(capabilities),
    sources: uniqueSources,
    capabilities,
  };
}

export async function queryPrinterCapabilities(webContents, systemName, {
  platform = process.platform,
  runCommand = runSystemCommand,
} = {}) {
  if (!webContents || typeof webContents.getPrintersAsync !== "function") {
    throw new PrintingError("PRINTING_UNAVAILABLE", "The desktop runtime does not provide getPrintersAsync().");
  }
  if (typeof webContents.isDestroyed === "function" && webContents.isDestroyed()) {
    throw new PrintingError("PRINTING_UNAVAILABLE", "The printer list is no longer available.");
  }
  if (typeof systemName !== "string" || systemName.trim() === "" || systemName.length > 255) {
    throw new PrintingError("INVALID_PRINTER_SELECTION", "Select an installed printer before requesting its capabilities.");
  }

  let printers;
  try {
    printers = await webContents.getPrintersAsync();
  } catch (cause) {
    throw new PrintingError("PRINTER_DISCOVERY_FAILED", "The system printer list could not be read.", { cause });
  }
  if (!Array.isArray(printers)) {
    throw new PrintingError("PRINTER_DISCOVERY_FAILED", "The desktop runtime returned an invalid printer list.");
  }

  const selectedName = systemName.trim();
  const printer = printers.find((item) => item
    && typeof item.name === "string"
    && item.name === selectedName);
  if (!printer) {
    throw new PrintingError("PRINTER_NOT_FOUND", "The selected printer is not in the current operating-system printer list.");
  }

  let cupsOptionsOutput;
  let windowsCapabilities;
  if (platform === "darwin" || platform === "linux") {
    try {
      const result = await runCommand("lpoptions", ["-p", selectedName, "-l"], {
        timeout: 8000,
        maxBuffer: 1048576,
        windowsHide: true,
      });
      cupsOptionsOutput = String(result?.stdout ?? "");
    } catch {
      // Capability inspection is best-effort. A missing CUPS utility or PPD
      // must not make an otherwise configured printer disappear.
    }
  } else if (platform === "win32") {
    const encodedName = Buffer.from(selectedName, "utf8").toString("base64url");
    try {
      const result = await runCommand(WINDOWS_CAPABILITIES_HELPER, ["--capabilities", encodedName], {
        timeout: 15000,
        maxBuffer: 1048576,
        windowsHide: true,
      });
      try {
        windowsCapabilities = JSON.parse(String(result?.stdout ?? ""));
      } catch {
        windowsCapabilities = undefined;
      }
    } catch {
      // Keep capabilities unknown when the native Windows helper is unavailable.
    }
  }

  return normalizePrinterCapabilities({
    systemName: printer.name,
    displayName: printer.displayName,
    platform,
    printerOptions: printer.options,
    cupsOptionsOutput,
    windowsCapabilities,
  });
}
