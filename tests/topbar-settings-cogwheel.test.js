const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const read = (file) => readFileSync(path.join(__dirname, '..', file), 'utf8');
const html = read('src/index.html');
const app = read('src/app.js');
const styles = read('src/styles.css');
const concept = read('assets/previews/suite-dashboard-concept-single-settings.svg');
const readme = read('README.md');
const settingsIcon = read('src/assets/icons/settings.svg');
const notificationIcon = read('src/assets/icons/notifications.svg');
const saveIcon = read('src/assets/icons/save.svg');

test('top-right controls clearly identify notifications, saving and Settings', () => {
  assert.match(html, /id="open-notifications"[^>]*aria-label="Open notifications"/);
  assert.match(html, /id="open-notifications"[\s\S]*?assets\/icons\/notifications\.svg/);
  assert.match(html, /id="notification-panel"[\s\S]*?No new notifications/);
  assert.match(html, /id="save-project"[\s\S]*?assets\/icons\/save\.svg[\s\S]*?Save/);
  const saveButtonStart = html.indexOf('<button class="primary top-save-button" id="save-project"');
  const saveButtonEnd = html.indexOf('</button>', saveButtonStart);
  const saveButton = html.slice(saveButtonStart, saveButtonEnd + 9);
  const saveButtonOpenTag = saveButton.slice(0, saveButton.indexOf('>'));
  assert.ok(saveButtonStart >= 0 && saveButtonEnd > saveButtonStart, 'Save button markup must exist');
  assert.ok(!saveButtonOpenTag.includes('data-i18n='), 'translation must not replace the entire button and remove its icon');
  assert.ok(saveButton.includes('<span data-i18n="top.saveProject">Save project</span>'));
  assert.equal((html.match(/id="open-settings"/g) || []).length, 1, 'the suite must have exactly one Settings control');
  assert.doesNotMatch(html, /id="manage-apps"|settings-nav/, 'Settings must not be repeated in the sidebar');
  assert.match(html, /class="sidebar-bottom sidebar-meta"/);
  assert.match(html, /id="open-settings"[^>]*aria-label="Open Brightdesk settings"/);
  assert.match(html, /id="open-settings"[\s\S]*?assets\/icons\/settings\.svg/);
  assert.match(app, /\$\('open-notifications'\)\.addEventListener\('click'/);
  assert.match(app, /panel\.hidden\s*=\s*!panel\.hidden/);
  assert.match(app, /\$\('open-notifications'\)\.hidden\s*=\s*Boolean\(launchAppId\)/);
  assert.match(app, /\$\('open-settings'\)\.addEventListener\('click',[\s\S]*?state\.view='manager';render\(\)/);
  assert.doesNotMatch(app, /manage-apps/, 'Settings must open directly from the top-right control');
  assert.match(app, /\$\('open-settings'\)\.hidden\s*=\s*Boolean\(launchAppId\)/);
  assert.match(styles, /\.top-notifications-button/);
  assert.match(styles, /\.top-settings-button/);
  assert.match(settingsIcon, /<svg[\s\S]*?viewBox="0 0 24 24"/);
  assert.match(notificationIcon, /<svg[\s\S]*?viewBox="0 0 24 24"/);
  assert.match(saveIcon, /<svg[\s\S]*?viewBox="0 0 24 24"/);
  assert.match(concept, /id="notifications-bell"/);
  assert.ok(readme.includes('suite-dashboard-concept-single-settings.svg'), 'README must display the refreshed single-Settings preview');
  assert.match(concept, /id="settings-cogwheel"/);
  const appCentreSidebar = concept.match(/<g id="sidebar-app-centre">([\\s\\S]*?)<\\/g>/)?.[1] || '';
  assert.ok(appCentreSidebar, 'the App Centre preview must have its dedicated sidebar entry');
  assert.match(appCentreSidebar, />App Centre</);
  assert.doesNotMatch(appCentreSidebar, /Settings|Pages|Sheets|Decks|Notes|Database|Forms|Lists|Planner|To Do|Workspace/,
    'the App Centre sidebar must not repeat Settings or the ten product shortcuts beside the product cards');
  assert.equal((concept.match(/id="settings-cogwheel"/g) || []).length, 1,
    'the concept must show exactly one Settings cogwheel');
  assert.match(concept, /One Settings cogwheel appears in the top-right beside Notifications/i);
  assert.doesNotMatch(concept, /<text[^>]*>C<\/text>/, 'the concept must not show the account initial');
});
