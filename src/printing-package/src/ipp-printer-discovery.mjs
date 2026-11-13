import { execFile } from "node:child_process";
import { createHmac, randomBytes } from "node:crypto";
import { isIP } from "node:net";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { PrintingError } from "./printing-error.mjs";

const execFileAsync = promisify(execFile);
// Never expose a predictable digest of a low-entropy local network address.
// IDs remain stable within this process and rotate when the process restarts.
const DISCOVERY_ID_KEY = randomBytes(32);
const WSD_DEVICE_ID_BY_PUBLIC_ID = new Map();
const SUPPORTED_PLATFORMS = new Set(["darwin", "linux", "win32"]);
const MACOS_BONJOUR_HELPER = fileURLToPath(
  new URL("../native/macos/brightdesk-ipp-discovery", import.meta.url),
);
const WINDOWS_BONJOUR_HELPER = fileURLToPath(
  new URL("../native/windows/brightdesk-ipp-discovery.exe", import.meta.url),
);

function hasUnsafePrinterText(value) {
  return /[\u0000-\u001F\u007F-\u009F\u061C\u200E\u200F\u202A-\u202E\u2066-\u2069]/u.test(value);
}

function decodeBase64Url(value) {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]{1,8192}$/.test(value)) return null;
  const decoded = Buffer.from(value, "base64url");
  if (decoded.toString("base64url") !== value) return null;
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(decoded);
  } catch {
    return null;
  }
  // Device IDs and display names are untrusted discovery data. Reject control
  // characters to prevent malformed identities and UI/log line injection.
  if (text.length === 0 || hasUnsafePrinterText(text)) return null;
  return text;
}

function normalizeWindowsWsdService(line) {
  const [recordType, encodedId, encodedName, canPair, isPaired, extra] = line.split("\t");
  if (recordType !== "WSD" || extra !== undefined || !["0", "1"].includes(canPair) || !["0", "1"].includes(isPaired)) {
    return null;
  }

  const deviceId = decodeBase64Url(encodedId);
  const displayName = decodeBase64Url(encodedName);
  if (!deviceId || !displayName) return null;

  const id = createOpaquePrinterId("wsd", deviceId);
  rememberWsdDeviceId(id, deviceId);

  return {
    id,
    displayName,
    source: "windows-wsd",
    protocol: "wsd",
    availability: "discovered",
    canPair: canPair === "1",
    isPaired: isPaired === "1",
    canPrint: false,
  };
}

function createOpaquePrinterId(namespace, value) {
  const scopedValue = `${namespace}\\0${value}`;
  return `${namespace}:${createHmac("sha256", DISCOVERY_ID_KEY).update(scopedValue, "utf8").digest("hex")}`;
}

function rememberWsdDeviceId(publicId, deviceId) {
  // Keep selections usable across independent Suite windows and refreshes,
  // while bounding memory and never exposing the underlying Windows ID.
  WSD_DEVICE_ID_BY_PUBLIC_ID.delete(publicId);
  WSD_DEVICE_ID_BY_PUBLIC_ID.set(publicId, deviceId);
  while (WSD_DEVICE_ID_BY_PUBLIC_ID.size > 4096) {
    const oldestId = WSD_DEVICE_ID_BY_PUBLIC_ID.keys().next().value;
    if (oldestId === undefined) break;
    WSD_DEVICE_ID_BY_PUBLIC_ID.delete(oldestId);
  }
}

function normalizePrinterService(uri) {
  if (typeof uri !== "string" || uri.trim() === "") return null;

  // DNS-SD service URIs are untrusted. Reject C0/C1 control characters before
  // URL parsing because the WHATWG URL parser silently strips or encodes some
  // of them, while the original URI is retained in the returned record.
  if (/[\u0000-\u001F\u007F-\u009F]/u.test(uri)) return null;

  const normalizedURI = uri.trim();
  let parsed;
  try {
    parsed = new URL(normalizedURI);
  } catch {
    return null;
  }

  if (!["ipp:", "ipps:", "lpd:"].includes(parsed.protocol) || !parsed.hostname) return null;

  // DNS-SD data is untrusted. Never return credentials embedded in a printer
  // URI to product code or display them as part of the discovered printer name.
  const authorityMatch = normalizedURI.match(/^[a-z][a-z0-9+.-]*:\/\/(\[[^\]]+\]|[^/:?#]+)/i);
  const authority = authorityMatch?.[1] ?? parsed.hostname;
  if (authority.includes("@") || parsed.username || parsed.password) return null;

  let displayName = "Network printer";
  const hostWithoutBrackets = parsed.hostname.replace(/^\[|\]$/g, "");
  const displayHost = hostWithoutBrackets.replace(/\.local\.?$/i, "");
  if (isIP(displayHost) === 0) {
    try {
      const decodedAuthority = decodeURIComponent(authority);
      if (hasUnsafePrinterText(decodedAuthority)) return null;
      displayName = decodedAuthority
        .replace(/\.local\.?$/i, "")
        .replaceAll("-", " ")
        .trim() || "Network printer";
    } catch {
      // Keep a generic label rather than exposing an address or malformed host.
    }
  }

  return {
    id: createOpaquePrinterId("dns-sd", normalizedURI),
    displayName,
    source: "dns-sd",
    availability: "discovered",
    canPrint: false,
  };
}

async function runSystemCommand(command, args, options) {
  return execFileAsync(command, args, options);
}

function getDiscoveryCommand(platform) {
  if (platform === "darwin") {
    return {
      command: MACOS_BONJOUR_HELPER,
      args: ["--timeout", "10"],
    };
  }

  if (platform === "win32") {
    return {
      command: WINDOWS_BONJOUR_HELPER,
      args: ["--timeout", "10"],
    };
  }

  return {
    command: "ippfind",
    args: ["-T", "5", "_ipp._tcp", "_ipps._tcp", "_printer._tcp"],
  };
}

/**
 * Finds IPP/IPPS and legacy LPD services advertised through DNS-SD on macOS, Windows and Linux.
 *
 * macOS and Windows use small helpers built against each platform's native
 * Bonjour/DNS-SD APIs. Linux uses CUPS' ippfind utility. Discovery never installs
 * a queue or driver.
 * A discovered service remains non-printable until the OS exposes a usable queue.
 */
export async function discoverNetworkPrinterServices({
  platform = process.platform,
  runCommand = runSystemCommand,
} = {}) {
  if (!SUPPORTED_PLATFORMS.has(platform)) {
    throw new PrintingError(
      "PRINTER_DISCOVERY_UNSUPPORTED",
      `Network printer DNS-SD discovery is not implemented for platform "${platform}".`,
    );
  }

  const { command, args } = getDiscoveryCommand(platform);
  let result;
  try {
    result = await runCommand(command, args, {
      // The Windows helper's browse, WSD watcher and resolve cleanup waits can
      // total about 14 seconds. Leave process-start and scheduler headroom.
      timeout: platform === "win32" ? 20000 : 15000,
      maxBuffer: 1048576,
      windowsHide: true,
    });
  } catch (cause) {
    if (cause?.code === "ENOENT") {
      if (platform === "linux") {
        throw new PrintingError(
          "PRINTER_DISCOVERY_UNAVAILABLE",
          "CUPS ippfind is not installed or available. You can still use configured printers; open your Linux printer settings to add a device, then refresh Brightdesk.",
          { cause },
        );
      }

      const utility = platform === "darwin"
        ? "Brightdesk's bundled macOS Bonjour helper"
        : "Brightdesk's bundled Windows Bonjour helper";
      throw new PrintingError(
        "PRINTER_DISCOVERY_UNAVAILABLE",
        `${utility} is not available. Rebuild or repair the Brightdesk Printing component, then try again.`,
        { cause },
      );
    }

    if (platform === "win32" && String(cause?.stderr ?? "").includes("WINDOWS_PRINTER_DISCOVERY_TIMEOUT")) {
      throw new PrintingError(
        "PRINTER_DISCOVERY_TIMEOUT",
        "Windows did not finish searching for WSD printers. Search again in a moment.",
        { cause },
      );
    }

    if (platform === "win32" && String(cause?.stderr ?? "").includes("WINDOWS_PRINTER_DISCOVERY_FAILED")) {
      throw new PrintingError(
        "PRINTER_DISCOVERY_FAILED",
        "Windows could not complete network printer service discovery. Check that the computer is connected to the network and that local network discovery is allowed.",
        { cause },
      );
    }

    if (platform === "darwin" && String(cause?.stderr ?? "").includes("LOCAL_NETWORK_ACCESS_DENIED")) {
      throw new PrintingError(
        "PRINTER_DISCOVERY_PERMISSION_REQUIRED",
        "Allow Brightdesk to discover printers on your local network in System Settings > Privacy & Security > Local Network, then try again.",
        { cause },
      );
    }

    // ippfind may exit 1 when one service type has no matches. Keep results
    // already returned for the other service types rather than discarding them.
    if (platform === "linux" && cause?.code === 1) {
      result = { stdout: cause.stdout ?? "" };
    } else {
      throw new PrintingError(
        "PRINTER_DISCOVERY_FAILED",
        "Network printer discovery could not be completed.",
        { cause },
      );
    }
  }

  const discovered = new Map();
  for (const line of String(result?.stdout ?? "").split(/\r?\n/)) {
    const printer = platform === "win32" && line.startsWith("WSD\t")
      ? normalizeWindowsWsdService(line)
      : normalizePrinterService(line);
    if (printer) discovered.set(printer.id, printer);
  }

  return [...discovered.values()];
}


export async function pairDiscoveredWsdPrinter(printer, {
  platform = process.platform,
  runCommand = runSystemCommand,
} = {}) {
  if (platform !== "win32") {
    throw new PrintingError(
      "PRINTER_PAIRING_UNSUPPORTED",
      "Windows WSD printer pairing is only available on Windows.",
    );
  }

  if (!printer || typeof printer !== "object" || typeof printer.id !== "string" || !printer.id.startsWith("wsd:")) {
    throw new PrintingError("INVALID_PRINTER_SELECTION", "Select a WSD printer discovered by Brightdesk before pairing.");
  }

  const deviceId = WSD_DEVICE_ID_BY_PUBLIC_ID.get(printer.id);
  if (!deviceId) {
    throw new PrintingError("INVALID_PRINTER_SELECTION", "The selected WSD printer reference is invalid or has expired. Search again and select the printer.");
  }
  const encodedId = Buffer.from(deviceId, "utf8").toString("base64url");

  let result;
  try {
    result = await runCommand(WINDOWS_BONJOUR_HELPER, ["--pair-wsd", encodedId], {
      timeout: 120000,
      maxBuffer: 1048576,
      windowsHide: true,
    });
  } catch (cause) {
    const output = String(cause?.stdout ?? "");
    if (output.includes("WSD_PAIR_RESULT\tCANCELED")) {
      return { status: "cancelled", protocol: "wsd", refreshRequired: false };
    }
    if (output.includes("WSD_PAIR_RESULT\tNOT_FOUND")) {
      throw new PrintingError("PRINTER_NOT_FOUND", "Windows could no longer find the selected WSD printer. Search again and retry.", { cause });
    }
    if (output.includes("WSD_PAIR_RESULT\tNOT_PAIRABLE")) {
      throw new PrintingError("PRINTER_NOT_PAIRABLE", "Windows reports that this WSD printer cannot be paired.", { cause });
    }
    if (output.includes("WSD_PAIR_RESULT\tTIMEOUT")) {
      throw new PrintingError("PRINTER_DISCOVERY_TIMEOUT", "Windows did not finish checking for the selected WSD printer. Search again before trying to pair it.", { cause });
    }
    throw new PrintingError("PRINTER_PAIRING_FAILED", "Windows could not pair the selected WSD printer.", { cause });
  }

  const status = String(result?.stdout ?? "").split(/\r?\n/)
    .find((line) => line.startsWith("WSD_PAIR_RESULT\t"))
    ?.split("\t")[1];

  if (status === "PAIRED") {
    return { status: "paired", protocol: "wsd", refreshRequired: true };
  }
  if (status === "ALREADY_PAIRED") {
    return { status: "already-paired", protocol: "wsd", refreshRequired: true };
  }
  if (status === "CANCELED") {
    return { status: "cancelled", protocol: "wsd", refreshRequired: false };
  }
  if (status === "NOT_FOUND") {
    throw new PrintingError("PRINTER_NOT_FOUND", "Windows could no longer find the selected WSD printer. Search again and retry.");
  }
  if (status === "NOT_PAIRABLE") {
    throw new PrintingError("PRINTER_NOT_PAIRABLE", "Windows reports that this WSD printer cannot be paired.");
  }

  throw new PrintingError("PRINTER_PAIRING_FAILED", "Windows could not pair the selected WSD printer.");
}

// Retain the original export name for early adopters of the draft package.
export const discoverIPPPrinters = discoverNetworkPrinterServices;
