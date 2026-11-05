import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const styles = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8');
const concept = readFileSync(new URL('../assets/previews/suite-dashboard-concept.svg', import.meta.url), 'utf8');

test('top-right Settings control uses the shared cogwheel and opens suite Settings', () => {
  assert.match(html, /id="open-settings"[^>]*aria-label="Open Brightdesk settings"/);
  assert.match(html, /id="open-settings"[\s\S]*?assets\/icons\/settings\.svg/);
  assert.match(app, /\$\('open-settings'\)\.addEventListener\('click',[\s\S]*?\$\('manage-apps'\)\.click\(\)/);
  assert.match(app, /\$\('open-settings'\)\.hidden\s*=\s*Boolean\(launchAppId\)/);
  assert.match(styles, /\.top-settings-button/);
  assert.doesNotMatch(concept, /<text[^>]*>C<\/text>/, 'the concept must not show the account initial');
  assert.match(concept, /settings-cogwheel/);
});
