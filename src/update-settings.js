(function() {
  const defaultSettings = {
    autoCheck: true,
    autoDownload: true,
    autoInstall: false
  };

  const getToggle = (id) => document.getElementById(id);
  const updateMessage = () => document.getElementById('update-message');

  function syncSettings(settings) {
    const value = { ...defaultSettings, ...(settings || {}) };
    getToggle('update-auto-check').checked = value.autoCheck !== false;
    getToggle('update-auto-download').checked = value.autoDownload !== false;
    getToggle('update-auto-install').checked = Boolean(value.autoInstall);
  }

  async function loadSettings() {
    const next = await window.brightdesk.getUpdateSettings?.() ?? defaultSettings;
    syncSettings(next);
  }

  async function saveSettings() {
    const payload = {
      autoCheck: getToggle('update-auto-check').checked,
      autoDownload: getToggle('update-auto-download').checked,
      autoInstall: getToggle('update-auto-install').checked
    };
    const saved = await window.brightdesk.setUpdateSettings?.(payload) ?? payload;
    syncSettings(saved);
    const message = updateMessage();
    if (message) {
      message.hidden = false;
      message.textContent = 'Update preferences saved.';
    }
  }

  function registerManualAction(id, action) {
    const button = document.getElementById(id);
    if (!button) return;
    button.addEventListener('click', async () => {
      const message = updateMessage();
      try {
        if (message) {
          message.hidden = false;
          message.textContent = 'Checking for updates…';
        }
        const result = await action();
        if (result && result.message && message) {
          message.textContent = result.message;
        }
      } catch (error) {
        if (message) {
          message.hidden = false;
          message.textContent = error.message || 'That update action could not be completed.';
        }
      }
    });
  }

  document.getElementById('update-settings-button')?.addEventListener('click', async () => {
    const panel = document.getElementById('update-settings-panel');
    if (!panel) return;
    panel.hidden = !panel.hidden;
    if (!panel.hidden) await loadSettings();
  });

  document.getElementById('close-update-settings')?.addEventListener('click', () => {
    const panel = document.getElementById('update-settings-panel');
    if (panel) panel.hidden = true;
  });

  ['update-auto-check', 'update-auto-download', 'update-auto-install'].forEach(id => {
    getToggle(id)?.addEventListener('change', saveSettings);
  });

  registerManualAction('update-manual-check', () => window.brightdesk.checkForUpdates?.());
  registerManualAction('update-manual-download', () => window.brightdesk.downloadUpdate?.());
  registerManualAction('update-manual-install', () => window.brightdesk.installUpdate?.());

  window.brightdesk.onUpdateState?.((state) => {
    const message = updateMessage();
    if (!message || !state) return;
    message.hidden = false;
    message.textContent = state.message || 'Update status is available.';
    if (state.status === 'available' || state.status === 'downloaded') {
      message.textContent += ' You can download or install it manually from Update settings.';
    }
  });

  loadSettings();
})();
