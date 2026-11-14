'use strict';

const OPERATIONS = Object.freeze({
  'printing:list-printers': (adapter) => adapter.listPrinters(),
  'printing:discover-network-printers': (adapter) => adapter.discoverNetworkPrinters(),
  'printing:pair-network-printer': (adapter, payload) => adapter.pairNetworkPrinter(payload),
  'printing:get-capabilities': (adapter, payload) => adapter.getPrinterCapabilities(payload),
  'printing:open-settings': (adapter) => adapter.openPrinterSettings(),
  'printing:print': (adapter, payload) => adapter.print(payload)
});

function registerPrintingIpcHandlers(ipcMain, { isAuthorizedSender, getAdapter } = {}) {
  if (!ipcMain || typeof ipcMain.handle !== 'function') {
    throw new TypeError('Electron ipcMain.handle is required.');
  }
  if (typeof isAuthorizedSender !== 'function' || typeof getAdapter !== 'function') {
    throw new TypeError('Printing IPC requires sender authorization and an adapter factory.');
  }

  for (const [channel, operation] of Object.entries(OPERATIONS)) {
    ipcMain.handle(channel, async (event, payload) => {
      if (!isAuthorizedSender(event)) throw new Error('Invalid sender.');
      const adapter = await getAdapter(event.sender);
      return operation(adapter, payload);
    });
  }
}

module.exports = { registerPrintingIpcHandlers };
