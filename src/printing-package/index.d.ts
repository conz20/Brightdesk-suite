export type BrightdeskPlatform = "darwin" | "linux" | "win32";

export type PrintOrientation = "portrait" | "landscape";
export type DuplexMode = "simplex" | "shortEdge" | "longEdge";
export type PaperSize = "A3" | "A4" | "A5" | "A6" | "Legal" | "Letter" | "Tabloid";

export interface PrintPageRange {
  /** Zero-based first page in the range. */
  from: number;
  /** Zero-based last page in the range, inclusive. */
  to: number;
}

export type PrintMargins =
  | { marginType: "default" | "none" | "printableArea" }
  | {
      marginType: "custom";
      top: number;
      bottom: number;
      left: number;
      right: number;
    };

export interface PrintRequest {
  printerName?: string;
  orientation?: PrintOrientation;
  color?: boolean;
  duplex?: DuplexMode;
  copies?: number;
  printBackground?: boolean;
  pageSize?: PaperSize;
  pageRanges?: PrintPageRange[];
  margins?: PrintMargins;
}

export interface PrinterSummary {
  /** Exact system queue name to pass back to the adapter. */
  systemName: string;
  displayName: string;
  description: string;
  status: string | number | null;
  isDefault: boolean;
}

export interface DnsSdPrinterDiscovery {
  id: string;
  displayName: string;
  uri: string;
  source: "dns-sd";
  availability: "discovered";
  canPrint: false;
}

export interface WindowsWsdPrinterDiscovery {
  id: string;
  displayName: string;
  source: "windows-wsd";
  protocol: "wsd";
  availability: "discovered";
  /** Discovery-time snapshot only; Windows rechecks the current value before pairing. */
  canPair: boolean;
  /** Discovery-time snapshot only; Windows rechecks the current value before pairing. */
  isPaired: boolean;
  canPrint: false;
}

export type NetworkPrinterDiscovery =
  | DnsSdPrinterDiscovery
  | WindowsWsdPrinterDiscovery;

export type PrinterPairingResult =
  | { status: "paired" | "already-paired"; protocol: "wsd"; refreshRequired: true }
  | { status: "cancelled"; protocol: "wsd"; refreshRequired: false };

export interface PrinterResolution {
  x: number;
  y: number;
}

export interface PrinterCapabilities {
  /** true/false only when reported by the operating system; otherwise null. */
  color: boolean | null;
  duplex: {
    supported: boolean | null;
    /** null means that the driver did not report the binding direction. */
    modes: Array<"long-edge" | "short-edge"> | null;
  };
  paperSizes: string[] | null;
  resolutionsDpi: PrinterResolution[] | null;
  maximumCopies: number | null;
}

export type PrinterCapabilitySource =
  | "electron-cups-metadata"
  | "electron-allowlisted-option-fields"
  | "cups-options"
  | "windows-device-capabilities";

export interface PrinterCapabilityReport {
  systemName: string;
  displayName: string;
  completeness: "unknown" | "partial" | "complete";
  sources: PrinterCapabilitySource[];
  capabilities: PrinterCapabilities;
}

export interface PrinterSettingsResult {
  status: "opened";
  platform: BrightdeskPlatform;
  destination: "system-printer-settings";
}

export interface PrintSubmissionResult {
  /** The operating system accepted the submission; this is not a physical completion receipt. */
  status: "submitted";
  /** Queue requested before the visible system dialog; not proof of the final destination. */
  requestedPrinterName: string | null;
}

export type PrintingErrorCode =
  | "INVALID_PRINT_REQUEST"
  | "INVALID_PRINTER_SELECTION"
  | "PRINTING_UNAVAILABLE"
  | "PRINTER_DISCOVERY_FAILED"
  | "PRINTER_DISCOVERY_TIMEOUT"
  | "PRINTER_DISCOVERY_PERMISSION_REQUIRED"
  | "PRINTER_DISCOVERY_UNAVAILABLE"
  | "PRINTER_DISCOVERY_UNSUPPORTED"
  | "PRINTER_NOT_FOUND"
  | "PRINTER_NOT_PAIRABLE"
  | "PRINTER_PAIRING_FAILED"
  | "PRINTER_PAIRING_UNSUPPORTED"
  | "PRINTER_SETUP_UNAVAILABLE"
  | "PRINTER_SETUP_UNSUPPORTED"
  | "PRINT_FAILED";

export declare class PrintingError extends Error {
  readonly code: PrintingErrorCode;
  constructor(code: PrintingErrorCode, message: string, options?: { cause?: unknown });
}

export interface NativePrinterInfo {
  name: string;
  displayName?: string;
  description?: string;
  status?: string | number;
  isDefault?: boolean;
  /** Raw OS options are accepted at this private boundary and are never returned. */
  options?: Record<string, unknown>;
}

export interface ElectronPrintOptions {
  silent: false;
  printBackground: boolean;
  color: boolean;
  landscape: boolean;
  duplexMode: DuplexMode;
  copies: number;
  deviceName?: string;
  pageSize?: PaperSize;
  pageRanges?: PrintPageRange[];
  margins?: PrintMargins;
}

/** Minimal Electron webContents surface required by the shared adapter. */
export interface PrintingWebContents {
  getPrintersAsync(): Promise<NativePrinterInfo[]>;
  print(options: ElectronPrintOptions, callback: (success: boolean, failureReason?: string) => void): void;
  isDestroyed?(): boolean;
}

export interface NativeShellExternalOptions {
  activate?: boolean;
  logUsage?: boolean;
}

export interface NativeShell {
  openExternal(url: string, options?: NativeShellExternalOptions): Promise<void>;
  openPath?(path: string): Promise<string>;
}

export interface CapabilityCommandOptions {
  timeout: number;
  maxBuffer: number;
  windowsHide: boolean;
}

export interface AdapterOptions {
  platform?: BrightdeskPlatform | string;
  shell?: NativeShell;
  env?: Record<string, string | undefined>;
  discoverNetworkPrinters?: () => Promise<NetworkPrinterDiscovery[]>;
  pairNetworkPrinter?: (
    printer: WindowsWsdPrinterDiscovery,
    context: { platform: BrightdeskPlatform | string },
  ) => Promise<PrinterPairingResult>;
  launchCommand?: (command: string, args: string[]) => Promise<void>;
  runCapabilityCommand?: (
    command: string,
    args: string[],
    options: CapabilityCommandOptions,
  ) => Promise<{ stdout?: string }>;
}

export interface PrintingAdapter {
  listPrinters(): Promise<PrinterSummary[]>;
  discoverNetworkPrinters(): Promise<NetworkPrinterDiscovery[]>;
  pairNetworkPrinter(printer: WindowsWsdPrinterDiscovery): Promise<PrinterPairingResult>;
  getPrinterCapabilities(systemName: string): Promise<PrinterCapabilityReport>;
  openPrinterSettings(): Promise<PrinterSettingsResult>;
  print(request: PrintRequest): Promise<PrintSubmissionResult>;
}

export declare function createElectronPrintAdapter(
  webContents: PrintingWebContents,
  options?: AdapterOptions,
): PrintingAdapter;
