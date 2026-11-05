const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const read = (file) => readFileSync(path.join(__dirname, '..', file), 'utf8');
const html = read('src/index.html');
const app = read('src/app.js');
const styles = read('src/styles.css');
const concept = read('assets/previews/suite-dashboard-concept.svg');
const settingsIcon = read('src/assets/icons/settings.svg');
const notificationIcon = read('src/assets/icons/notifications.svg');
const saveIcon = read('src/assets/icons/save.svg');

test('top-right controls clearly identify notifications, saving and Settings', () => {
  assert.match(html, /id="open-notifications"[^>]*aria-label="Open notifications"/);
  assert.match(html, /id="open-notifications"[\s\S]*?assets\/icons\/notifications\.svg/);
  assert.match(html, /id="notification-panel"[\s\S]*?No new notifications/);
  assert.match(html, /id="save-project"[\s\S]*?assets\/icons\/save\.svg[\s\S]*?Save/);
  const saveButton = html.match(/<button[^>]*id="save-project"[^>]*>[\\s\\S]*?<\\/button>/)?.[0] || '';
  assert.doesNotMatch(saveButton, /<button[^>]*data-i18n=/, 'translation must not replace the entire button and remove its icon');
  assert.match(saveButton, /<span data-i18n="top\\.saveProject">Save project<\\/span>/);
  assert.match(html, /id="open-settings"[^>]*aria-label="Open Brightdesk settings"/);
  assert.match(html, /id="open-settings"[\s\S]*?assets\/icons\/settings\.svg/);
  assert.match(app, /\$\('open-notifications'\)\.addEventListener\('click'/);
  assert.match(app, /panel\.hidden\s*=\s*!panel\.hidden/);
  assert.match(app, /\$\('open-notifications'\)\.hidden\s*=\s*Boolean\(launchAppId\)/);
  assert.match(app, /\$\('open-settings'\)\.addEventListener\('click',[\s\S]*?\$\('manage-apps'\)\.click\(\)/);
  assert.match(app, /\$\('open-settings'\)\.hidden\s*=\s*Boolean\(launchAppId\)/);
  assert.match(styles, /\.top-notifications-button/);
  assert.match(styles, /\.top-settings-button/);
  assert.match(settingsIcon, /<svg[\s\S]*?viewBox="0 0 24 24"/);
  assert.match(notificationIcon, /<svg[\s\S]*?viewBox="0 0 24 24"/);
  assert.match(saveIcon, /<svg[\s\S]*?viewBox="0 0 24 24"/);
  assert.match(concept, /id="notifications-bell"/);
  assert.match(concept, /id="settings-cogwheel"/);
  assert.doesNotMatch(concept, /<text[^>]*>C<\/text>/, 'the concept must not show the account initial');
});
