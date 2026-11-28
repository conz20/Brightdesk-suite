(function() {
  const defaults = { autoCheck: true, autoDownload: false, autoInstall: false };
  const byId = (id) => document.getElementById(id);
  const message = () => byId('update-message');

  function renderSections() {
    const panel = byId('update-settings-panel');
    if (!panel || panel.dataset.sectionsReady === 'true') return;
    panel.dataset.sectionsReady = 'true';
    panel.innerHTML = `
      <section class="update-settings-section" aria-labelledby="suite-update-heading">
        <div class="update-settings-header">
          <div>
            <h3 id="suite-update-heading">Brightdesk Office Suite updates</h3>
            <p>Choose whether this suite checks for updates automatically. Downloads and installation always require your confirmation.</p>
          </div>
          <button class="secondary small-action" id="close-update-settings" type="button">Close</button>
        </div>
        <label class="toggle-row"><input type="checkbox" id="update-auto-check" /> Check for suite updates automatically</label>
        <div class="update-settings-actions">
          <button class="primary small-action" id="update-manual-check" type="button">Check for suite updates now</button>
          <button class="secondary small-action" id="update-manual-download" type="button">Download suite update</button>
          <button class="secondary small-action" id="update-manual-install" type="button">Install suite update</button>
        </div>
      </section>
      <section class="update-settings-section" aria-labelledby="included-apps-update-heading">
        <h3 id="included-apps-update-heading">Applications included in the suite</h3>
        <p>Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace are included in the Brightdesk Office Suite release. Updates are delivered through the Suite release rather than separate product downloads.</p>
      </section>`;
    byId('close-update-settings').addEventListener('click', () => {
      panel.hidden = true;
      byId('update-settings-button')?.setAttribute('aria-expanded', 'false');
    });
    ['update-auto-check'].forEach(id => {
      byId(id).addEventListener('change', saveSettings);
    });
    registerManualAction('update-manual-check', () => window.brightdesk.checkForUpdates?.());
    registerManualAction('update-manual-download', () => window.brightdesk.downloadUpdate?.());
    registerManualAction('update-manual-install', () => window.brightdesk.installUpdate?.());
  }

  function syncSettings(settings) {
    const value = { ...defaults, ...(settings || {}) };
    byId('update-auto-check').checked = value.autoCheck !== false;
  }

  async function loadSettings() {
    try {
      const settings = await window.brightdesk.getUpdateSettings?.();
      syncSettings(settings || defaults);
    } catch (error) {
      const status = message();
      if (status) { status.hidden = false; status.textContent = `Could not load update preferences: ${error.message}`; }
    }
  }

  async function saveSettings() {
    const prefs = {
      autoCheck: byId('update-auto-check').checked,
    };
    try {
      const saved = await window.brightdesk.setUpdateSettings?.(prefs);
      syncSettings(saved || prefs);
      const status = message();
      if (status) { status.hidden = false; status.textContent = 'Brightdesk Office Suite update preferences saved.'; }
    } catch (error) {
      const status = message();
      if (status) { status.hidden = false; status.textContent = `Could not save update preferences: ${error.message}`; }
    }
  }

  function registerManualAction(id, action) {
    byId(id)?.addEventListener('click', async () => {
      const status = message();
      try {
        if (status) { status.hidden = false; status.textContent = 'Working…'; }
        const result = await action();
        if (status) status.textContent = result?.message || (result?.ok ? 'The update action was accepted.' : 'This update action is not available for this build yet.');
      } catch (error) {
        if (status) { status.hidden = false; status.textContent = error.message || 'That update action could not be completed.'; }
      }
    });
  }

  byId('update-settings-button')?.addEventListener('click', async () => {
    renderSections();
    const panel = byId('update-settings-panel');
    panel.hidden = !panel.hidden;
    byId('update-settings-button')?.setAttribute('aria-expanded', String(!panel.hidden));
    if (!panel.hidden) await loadSettings();
  });

  window.brightdesk.onUpdateState?.((state) => {
    const status = message();
    if (!status || !state) return;
    status.hidden = false;
    status.textContent = state.message || 'Update status is available.';
    if (state.status === 'available' || state.status === 'downloaded') {
      status.textContent += ' Manage suite update actions in Update settings.';
    }
  });
})();
