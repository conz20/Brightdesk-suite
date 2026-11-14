/**
 * Deterministic in-memory printer queue for integration tests.
 *
 * This fixture exercises Brightdesk's adapter boundary without Bonjour,
 * printer drivers, operating-system queue changes, or physical hardware.
 * A successful callback represents spooler acceptance only, never a printed page.
 */
export function createVirtualPrinterRuntime({
  name = "Brightdesk_Virtual_Printer",
  displayName = "Brightdesk Virtual Printer",
  description = "Virtual test queue; no physical printer is connected.",
  options = { "printer-type": 24 },
  status = 0,
  isDefault = true,
} = {}) {
  let available = true;
  let printSuccess = true;
  let failureReason = "";
  const jobs = [];

  const webContents = {
    isDestroyed: () => false,

    async getPrintersAsync() {
      if (!available) return [];
      return [{
        name,
        displayName,
        description,
        status,
        isDefault,
        options: { ...options },
      }];
    },

    print(printOptions, callback) {
      jobs.push({
        queueName: printOptions.deviceName ?? name,
        options: structuredClone(printOptions),
      });
      callback(printSuccess, failureReason);
    },
  };

  return {
    webContents,
    jobs,
    setAvailable(value) {
      available = value === true;
    },
    setPrintResult(success, reason = "") {
      printSuccess = success === true;
      failureReason = typeof reason === "string" ? reason : "";
    },
  };
}
