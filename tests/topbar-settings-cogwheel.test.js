const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');

const read = (file) => readFileSync(path.join(__dirname, '..', file), 'utf8');
const html = read('src/index.html');
const app = read('src/app.js');
const styles = read('src/styles.css');
const concept = read('assets/previews/suite-dashboard-concept.svg');

test('top-right Settings control uses the shared cogwheel and opens suite Settings', () => {
  assert.match(html, /id="open-settings"[^>]*aria-label="Open Brightdesk settings"/);
  assert.match(html, /id="open-settings"[\s\S]*?assets\/icons\/settings\.svg/);
  assert.match(app, /\$\('open-settings'\)\.addEventListener\('click',[\s\S]*?\$\('manage-apps'\)\.click\(\)/);
  assert.match(app, /\$\('open-settings'\)\.hidden\s*=\s*Boolean\(launchAppId\)/);
  assert.match(styles, /\.top-settings-button/);
  assert.doesNotMatch(concept, /<text[^>]*>C<\/text>/, 'the concept must not show the account initial');
  assert.match(concept, /settings-cogwheel/);
  const icon = read('src/assets/icons/settings.svg');
  assert.match(icon, /viewBox="0 0 24 24"/);
  assert.match(icon, /stroke-width="1\.8"/);
  assert.match(icon, /M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8/);
  assert.match(icon, /M19\.4 15a1\.65/);
  assert.match(concept, /M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8/);
});
