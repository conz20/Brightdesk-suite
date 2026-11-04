'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('suite update preferences are visible and use validated IPC handlers', () => {
  const html = read('src/index.html');
  const main = read('src/main.js');
  const preload = read('src/preload.js');
  const settings = read('src/update-settings.js');
  assert.match(html, /id="update-settings-button"/);
  assert.match(html, /id="update-settings-panel"/);
  assert.ok(html.indexOf('update-settings.js') < html.indexOf('app.js'));
  assert.match(preload, /getUpdateSettings/);
  assert.match(preload, /setUpdateSettings/);
  assert.match(main, /updates:settings/);
  assert.match(main, /updates:set-settings/);
  assert.match(settings, /Pages, Sheets, Decks, Notes, Database, Forms, Lists, Planner, To Do and Workspace/);
});
