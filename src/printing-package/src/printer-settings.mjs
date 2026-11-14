import { spawn } from "node:child_process";
import { PrintingError } from "./printing-error.mjs";

const MACOS_PRINTER_SETTINGS_URI =
  "x-apple.systempreferences:com.apple.Print-Scan-Settings.extension";
const WINDOWS_PRINTER_SETTINGS_URI = "ms-settings:printers";

function getLinuxPrinterSettingsCommands(env = process.env) {
  const desktop = String(env.XDG_CURRENT_DESKTOP ?? "").toLowerCase();
  const session = [
    env.DESKTOP_SESSION ?? "",
    env.XDG_SESSION_DESKTOP ?? "",
  ].join(":").toLowerCase();

  const kde = desktop.includes("kde")
    || session.includes("plasma")
    || String(env.KDE_FULL_SESSION ?? "").toLowerCase() === "true";
  const gnome = desktop.includes("gnome") || session.includes("gnome");
  const deepin = desktop.includes("deepin") || session.includes("deepin");

  const kdeCommands = [
    ["systemsettings", ["kcm_printer_manager", "--args", "--add-printer"]],
    ["kcmshell6", ["kcm_printer_manager", "--args", "--add-printer"]],
    ["kcmshell5", ["kcm_printer_manager", "--args", "--add-printer"]],
  ];
  const gnomeCommands = [["gnome-control-center", ["printers"]]];
  const deepinCommands = [["dde-printer", []]];
  const commonCommands = [["system-config-printer", []]];

  const preferred = kde
    ? [...kdeCommands, ...commonCommands, ...gnomeCommands, ...deepinCommands]
    : gnome
      ? [...gnomeCommands, ...commonCommands, ...kdeCommands, ...deepinCommands]
      : deepin
        ? [...deepinCommands, ...commonCommands, ...gnomeCommands, ...kdeCommands]
        : [...commonCommands, ...gnomeCommands, ...kdeCommands, ...deepinCommands];

  const seen = new Set();
  return preferred.filter(([command]) => {
    if (seen.has(command)) return false;
    seen.add(command);
    return true;
  });
}

function launchDetached(command, args) {
  return new Promise((resolve, reject) => {
    let child;
    try {
      child = spawn(command, args, {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      });
    } catch (error) {
      reject(error);
      return;
    }

    const onError = (error) => reject(error);
    child.once("error", onError);
    child.once("spawn", () => {
      child.removeListener("error", onError);
      child.unref();
      resolve();
    });
  });
}

/**
 * Opens the operating system's printer setup UI.
 *
 * The Windows and macOS destinations are fixed, trusted OS settings URIs.
 * Linux uses the installed desktop's own printer manager when available.
 * No queue, driver or package is installed by Brightdesk.
 */
export async function openPrinterSettings({
  platform = process.platform,
  shell,
  env = process.env,
  launchCommand = launchDetached,
} = {}) {
  if (platform === "win32" || platform === "darwin") {
    if (!shell || typeof shell.openExternal !== "function") {
      const system = platform === "win32" ? "Windows" : "macOS";
      throw new PrintingError(
        "PRINTER_SETUP_UNAVAILABLE",
        `The desktop runtime cannot open the ${system} printer settings page.`,
      );
    }

    const uri = platform === "win32"
      ? WINDOWS_PRINTER_SETTINGS_URI
      : MACOS_PRINTER_SETTINGS_URI;
    const options = platform === "win32"
      ? { logUsage: true }
      : { activate: true };

    try {
      await shell.openExternal(uri, options);
    } catch (cause) {
      if (platform === "darwin") {
        // macOS 12 and earlier use the legacy Print & Fax preference pane.
        // Electron resolves openPath() with an error string on failure.
        if (typeof shell.openPath !== "function") {
          throw new PrintingError(
            "PRINTER_SETUP_UNAVAILABLE",
            "The operating system's printer settings could not be opened.",
            { cause },
          );
        }

        try {
          const fallbackError = await shell.openPath(
            "/System/Library/PreferencePanes/PrintAndFax.prefPane",
          );
          if (typeof fallbackError === "string" && fallbackError.trim() !== "") {
            throw new Error(fallbackError);
          }
        } catch (fallbackCause) {
          throw new PrintingError(
            "PRINTER_SETUP_UNAVAILABLE",
            "The operating system's printer settings could not be opened.",
            { cause: fallbackCause },
          );
        }
      } else {
        throw new PrintingError(
          "PRINTER_SETUP_UNAVAILABLE",
          "The operating system's printer settings could not be opened.",
          { cause },
        );
      }
    }

    return {
      status: "opened",
      platform,
      destination: "system-printer-settings",
    };
  }

  if (platform === "linux") {
    for (const [command, args] of getLinuxPrinterSettingsCommands(env)) {
      try {
        await launchCommand(command, args);
        return {
          status: "opened",
          platform,
          destination: "system-printer-settings",
        };
      } catch {
        // Try the next installed printer manager. No shell is used and all
        // executable names and arguments come from this fixed allowlist.
      }
    }

    throw new PrintingError(
      "PRINTER_SETUP_UNAVAILABLE",
      "Brightdesk could not open this desktop's printer settings. Open your computer's Settings and choose Printers to add the device.",
    );
  }

  throw new PrintingError(
    "PRINTER_SETUP_UNSUPPORTED",
    `Native printer setup is not implemented for platform "${platform}".`,
  );
}
