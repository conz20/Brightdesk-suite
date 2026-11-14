'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'tools/runner-setup/macos/Start-Brightdesk-Mac-Product-Runners.sh'), 'utf8');
const instructions = fs.readFileSync(path.join(root, 'tools/runner-setup/macos/Product-Runners-README.txt'), 'utf8');

const products = [
  'Brightdesk-Pages', 'Brightdesk-Sheets', 'Brightdesk-Decks', 'Brightdesk-Notes',
  'Brightdesk-Database', 'Brightdesk-Forms', 'Brightdesk-Lists', 'Brightdesk-Planner',
  'Brightdesk-To-Do', 'Brightdesk-Workspace'
];

test('product runner registration is limited to the ten approved customer products', () => {
  const match = script.match(/REPOSITORIES=\(\n([\s\S]*?)\n\)/);
  assert.ok(match, 'repository allowlist exists');
  const actual = [...match[1].matchAll(/^\s*'([^']+)'\s*$/gm)].map((entry) => entry[1]);
  assert.deepEqual(actual, products);
  assert.doesNotMatch(script, /Brightdesk-(?:suite|AI|Printing|Services)/i);
});

test('every product runner is registered with the shared product CI label', () => {
  assert.match(script, /required_labels='\["self-hosted","macOS","ARM64","brightdesk-product-ci"\]'/);
  assert.match(script, /--labels 'brightdesk-product-ci'/);
  assert.match(instructions, /brightdesk-product-ci/);
});

test('runner download is pinned to the verified official macOS ARM64 release', () => {
  assert.match(script, /RUNNER_VERSION='2\.338\.2'/);
  assert.match(script, /https:\/\/github\.com\/actions\/runner\/releases\/download\/v\$\{RUNNER_VERSION\}\/\$\{ARCHIVE_NAME\}/);
  assert.match(script, /ARCHIVE_SHA256='25a065af409ffa317ab4d5a3b614dd15fc9c40f2172bc1b35a1b1258e919a388'/);
  assert.match(instructions, /SHA-256/);
});

test('setup requires Apple silicon, authenticated owner identity and explicit confirmation', () => {
  assert.match(script, /uname -s.*Darwin/);
  assert.match(script, /uname -m.*arm64/);
  assert.match(script, /gh auth status --hostname github\.com/);
  assert.match(script, /github_user.*==.*OWNER/);
  assert.match(script, /Type REGISTER to continue/);
  assert.match(script, /confirmation.*REGISTER/);
});

test('registration uses per-repository short-lived tokens and does not install a background service', () => {
  assert.match(script, /repos\/\$OWNER\/\$repository\/actions\/runners\/registration-token/);
  assert.match(script, /--token "\$registration_token"/);
  assert.match(script, /unset registration_token config_args/);
  assert.match(script, /nohup \.\/run\.sh/);
  assert.doesNotMatch(script, /launchctl|sudo\s|systemctl|--token-file/i);
});

test('runner paths are scoped under a separate products directory and existing registrations are not duplicated', () => {
  assert.match(script, /RUNNER_BASE=.*brightdesk-product-ci-runners/);
  assert.match(script, /RUNNER_ROOT="\$RUNNER_BASE\/products"/);
  assert.match(script, /Already has an online runner with the required product CI labels/);
  assert.match(script, /A compatible macOS product CI runner is already registered but offline/);
  assert.match(instructions, /does not create a duplicate/i);
});
 
test('unregistered local runner folders are never executed or reused', () => {
  assert.match(script, /An unregistered runner folder already exists.*Nothing was executed or overwritten/);
  assert.doesNotMatch(script, /Reusing previously verified product runner files/);
});

test('runner-label discovery uses self-contained jq filters with no unbound variables', () => {
  const requiredLabels = 'contains(["self-hosted","macOS","ARM64","brightdesk-product-ci"])';
  assert.equal(script.split(requiredLabels).length - 1, 3);
  assert.doesNotMatch(script, /contains\\(\\$required_labels\\)/);
});

test('Finder launcher is a valid macOS app bundle with its own executable', () => {
  const appRoot = path.join(root, 'tools/runner-setup/macos/Brightdesk-Product-Runner-Setup.app');
  const appInfo = fs.readFileSync(path.join(appRoot, 'Contents/Info.plist'), 'utf8');
  const launcher = fs.readFileSync(path.join(appRoot, 'Contents/MacOS/BrightdeskProductRunnerSetup'), 'utf8');
  assert.match(appInfo, /CFBundlePackageType[\\s\\S]*?APPL/);
  assert.match(appInfo, /CFBundleExecutable[\\s\\S]*?BrightdeskProductRunnerSetup/);
  assert.match(launcher, /^#!\\/bin\\/bash/);
});

test('Finder launcher shows GUI confirmation before passing REGISTER to the setup script', () => {
  const launcher = fs.readFileSync(path.join(root, 'tools/runner-setup/macos/Brightdesk-Product-Runner-Setup.app/Contents/MacOS/BrightdeskProductRunnerSetup'), 'utf8');
  const confirmation = launcher.indexOf('This will register up to ten');
  const registration = launcher.indexOf("printf 'REGISTER");
  assert.ok(confirmation >= 0);
  assert.ok(registration > confirmation);
  assert.match(launcher, /cancel/i);
});

test('Finder launcher checks the authenticated owner account and saves private logs without opening Terminal', () => {
  const launcher = fs.readFileSync(path.join(root, 'tools/runner-setup/macos/Brightdesk-Product-Runner-Setup.app/Contents/MacOS/BrightdeskProductRunnerSetup'), 'utf8');
  assert.match(launcher, /gh auth status --hostname github\\.com/);
  assert.match(launcher, /gh api user --jq/);
  assert.match(launcher, /conz20/);
  assert.match(launcher, /Library\\/Logs\\/Brightdesk/);
  assert.match(launcher, /umask 077/);
  assert.doesNotMatch(launcher, /open -a Terminal|osascript.*Terminal/);
  assert.doesNotMatch(launcher, /sudo\\s|launchctl|systemctl/);
});
