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

test('every product runner uses the required product CI label', () => {
  const requiredLabels = 'contains(["self-hosted","macOS","ARM64","brightdesk-product-ci"])';
  assert.equal(script.split(requiredLabels).length - 1, 3);
  assert.match(script, /--labels 'brightdesk-product-ci'/);
  assert.match(instructions, /brightdesk-product-ci/);
});

test('runner download is pinned to the official macOS ARM64 release and SHA-256 digest', () => {
  assert.match(script, /RUNNER_VERSION='2\.338\.2'/);
  assert.match(script, /https:\/\/github\.com\/actions\/runner\/releases\/download\/v\$\{RUNNER_VERSION\}\/\$\{ARCHIVE_NAME\}/);
  assert.match(script, /ARCHIVE_SHA256='25a065af409ffa317ab4d5a3b614dd15fc9c40f2172bc1b35a1b1258e919a388'/);
  assert.match(instructions, /SHA-256/);
});

test('setup requires Apple silicon, the authenticated owner account and explicit confirmation', () => {
  assert.match(script, /uname -s.*Darwin/);
  assert.match(script, /uname -m.*arm64/);
  assert.match(script, /gh auth status --hostname github\.com/);
  assert.match(script, /github_user.*==.*OWNER/);
  assert.match(script, /Type REGISTER to continue/);
  assert.match(script, /confirmation.*REGISTER/);
});

test('registration uses per-repository short-lived tokens without installing a background service', () => {
  assert.match(script, /repos\/\$OWNER\/\$repository\/actions\/runners\/registration-token/);
  assert.match(script, /--token "\$registration_token"/);
  assert.match(script, /unset registration_token config_args/);
  assert.match(script, /nohup "\$runner_home\/run\.sh"/);
  assert.doesNotMatch(script, /launchctl|sudo\s|systemctl|--token-file/i);
});

test('repository-scoped runners rely on the repository default rather than an explicit organisation runner group', () => {
  assert.match(script, /--url "\$repository_url"/);
  assert.doesNotMatch(script, /--runnergroup\s/);
});

test('setup requires a temporary fine-grained token and a clean CLI configuration directory', () => {
  assert.match(script, /\[\[ -n "\$\{GH_TOKEN:-\}" \]\]/);
  assert.match(script, /GH_CONFIG_DIR=/);
  assert.match(script, /Administration.*write|administration.*write/i);
  assert.doesNotMatch(script, /gh auth login/);
});

test('all registrations finish and the temporary GitHub token is cleared before any runner starts', () => {
  const registrationLoopStart = script.lastIndexOf('for repository in');
  const loopEnd = script.indexOf('\ndone\n\n# Clear the temporary', registrationLoopStart);
  const tokenClear = script.indexOf('unset GH_TOKEN registration_api_token', loopEnd);
  const firstStart = script.indexOf('start_runner "$runner_home"', tokenClear);
  assert.ok(tokenClear >= 0, 'temporary token is explicitly cleared');
  assert.ok(loopEnd >= 0, 'registration loop has completed');
  assert.ok(tokenClear > loopEnd, 'token is cleared after registration loop');
  assert.ok(firstStart > tokenClear, 'runner processes start only after token clearing');
  assert.doesNotMatch(script.slice(registrationLoopStart, loopEnd), /start_runner "\$runner_home"/);
  assert.match(script, /GH_TOKEN="\$registration_api_token" gh api/);
  assert.match(script, /registration_api_token="\$GH_TOKEN"\nunset GH_TOKEN/);
  const configureStart = script.indexOf('if ! (cd "$runner_home"');
  const configureEnd = script.indexOf('unset registration_token config_args', configureStart);
  assert.ok(configureStart >= 0 && configureEnd > configureStart);
  assert.doesNotMatch(script.slice(configureStart, configureEnd), /GH_TOKEN=/);
});

test('Finder launcher collects the token with a hidden-answer prompt and does not use stored gh login', () => {
  const launcherPath = path.join(root, 'tools/runner-setup/macos/Brightdesk-Product-Runner-Setup.app/Contents/MacOS/BrightdeskProductRunnerSetup');
  const launcher = fs.readFileSync(launcherPath, 'utf8');
  assert.match(launcher, /with hidden answer/);
  assert.match(launcher, /Revoke the token in GitHub Settings immediately after this setup attempt, even if setup fails/);
  assert.match(launcher, /GH_TOKEN=/);
  assert.doesNotMatch(launcher, /gh auth status|gh api user/);
  assert.doesNotMatch(launcher, /echo "\$runner_token"|printf.*runner_token/);
});

test('README explains the dedicated runner account and narrow temporary token requirements', () => {
  assert.match(instructions, /dedicated (?:standard )?macOS user account/i);
  assert.match(instructions, /Fine-grained personal access token/i);
  assert.match(instructions, /Administration: Read and write/i);
  assert.match(instructions, /Revoke the fine-grained token in GitHub Settings immediately after the setup attempt, whether it succeeds or fails/i);
  assert.match(instructions, /exactly (?:the|these) ten/i);
  assert.match(instructions, /shortest expiry GitHub offers/i);
  assert.match(instructions, /not stored in the macOS keychain/i);
  const terminalFallback = instructions.slice(
    instructions.indexOf('RUN THE SETUP'),
    instructions.indexOf('NO-TERMINAL OPTION')
  );
  assert.match(terminalFallback, /\\n   bash\\n   read -r -s -p/);
  assert.match(terminalFallback, /\\n   exit\\n/);
});

test('runner folders are separated from shared infrastructure and duplicate registrations are avoided', () => {
  assert.match(script, /brightdesk-product-ci-runners/);
  assert.match(script, /RUNNER_ROOT="\$RUNNER_BASE\/products"/);
  assert.match(script, /Already has an online runner with the required product CI labels/);
  assert.match(script, /A compatible macOS product CI runner is already registered but offline/);
  assert.match(instructions, /does not create a duplicate/i);
});

test('each runner uses its own empty owner-only GitHub CLI config folder', () => {
  assert.match(script, /runner_gh_config="\$runner_home\/gh-config-no-credentials"/);
  assert.match(script, /find "\$runner_gh_config" -mindepth 1 -maxdepth 1/);
  assert.match(script, /Refusing to start with a non-empty GitHub CLI config folder/);
  assert.match(script, /GH_CONFIG_DIR="\$runner_gh_config" nohup/);
  assert.doesNotMatch(script, /GH_NO_CREDENTIALS_CONFIG/);
  assert.match(instructions, /Each runner receives its own owner-only GitHub CLI configuration folder/);
});

test('unregistered local runner folders are never executed or reused', () => {
  assert.match(script, /An unregistered runner folder already exists.*Nothing was executed or overwritten/);
  assert.doesNotMatch(script, /Reusing previously verified product runner files/);
});

test('runner PID files are trusted only when the process command belongs to that runner folder', () => {
  assert.match(script, /ps -p "\$runner_pid" -o command=/);
  assert.match(script, /runner_command.*\*".*runner_home.*"\*/);
  const pidFileCheck = script.slice(
    script.indexOf('if [[ -f "$runner_pid_file" ]]'),
    script.indexOf('runner_pid="$(ps -axo', script.indexOf('if [[ -f "$runner_pid_file" ]]'))
  );
  assert.match(pidFileCheck, /runner_command.*run\\.sh/);
  assert.match(pidFileCheck, /runner_command.*Runner\\.Listener/);
  assert.match(script, /nohup "\$runner_home\/run\.sh"/);
  assert.ok(script.includes("index($0, runner_home) && /run[.]sh|Runner[.]Listener/"));
});

test('runner PID paths reject symlinks and non-regular files before reading or writing', () => {
  assert.match(script, /\[\[ -L "\$runner_pid_file" \]\]/);
  assert.match(script, /\[\[ -e "\$runner_pid_file" && ! -f "\$runner_pid_file" \]\]/);
  const pidGuard = script.indexOf('if [[ -L "$runner_pid_file" ]]');
  const pidRead = script.indexOf('cat "$runner_pid_file"', pidGuard);
  assert.ok(pidGuard >= 0 && pidRead > pidGuard, 'PID path validation happens before reading');
});

test('runner-label discovery uses three self-contained jq filters with no unbound variables', () => {
  const requiredLabels = 'contains(["self-hosted","macOS","ARM64","brightdesk-product-ci"])';
  assert.equal(script.split(requiredLabels).length - 1, 3);
  assert.doesNotMatch(script, /\$required_labels/);
});

test('Finder launcher has a valid app-bundle manifest and executable shell entry point', () => {
  const appRoot = path.join(root, 'tools/runner-setup/macos/Brightdesk-Product-Runner-Setup.app');
  const appInfo = fs.readFileSync(path.join(appRoot, 'Contents/Info.plist'), 'utf8');
  const launcherPath = path.join(appRoot, 'Contents/MacOS/BrightdeskProductRunnerSetup');
  const launcher = fs.readFileSync(launcherPath, 'utf8');
  assert.ok(appInfo.includes('<key>CFBundlePackageType</key>\n  <string>APPL</string>'));
  assert.ok(appInfo.includes('<key>CFBundleExecutable</key>\n  <string>BrightdeskProductRunnerSetup</string>'));
  assert.ok(launcher.startsWith('#!/bin/bash'));
  assert.ok((fs.statSync(launcherPath).mode & 0o111) !== 0, 'Finder executable must have an execute bit');
});

test('Finder launcher displays the approval dialog before providing REGISTER to the setup script', () => {
  const launcherPath = path.join(root, 'tools/runner-setup/macos/Brightdesk-Product-Runner-Setup.app/Contents/MacOS/BrightdeskProductRunnerSetup');
  const launcher = fs.readFileSync(launcherPath, 'utf8');
  const confirmation = launcher.indexOf('This setup requires a dedicated macOS runner user account');
  const tokenPrompt = launcher.indexOf('with hidden answer');
  const registration = launcher.indexOf('BRIGHTDESK_RUNNER_SETUP_CONFIRMED=REGISTER');
  assert.ok(confirmation >= 0, 'dedicated-account approval dialog exists');
  assert.ok(tokenPrompt > confirmation, 'token prompt follows the safety confirmation');
  assert.ok(registration > tokenPrompt, 'registration starts only after the hidden token prompt');
  assert.match(launcher, /\[\[ "\$choice" == "Continue" \]\] \|\| exit 0/);
});

test('setup documentation explains that product runners share one macOS user security boundary', () => {
  assert.match(instructions, /same dedicated macOS user/);
  assert.match(instructions, /does not create an operating-system security boundary/);
  assert.match(instructions, /separate macOS accounts or separate hosts/);
});

test('README distinguishes product runners from the separate Suite repository runner', () => {
  assert.match(instructions, /This helper registers runners only in the ten product repositories/);
  assert.match(instructions, /does not register or start the separate Brightdesk-suite repository runner/);
});

test('Finder launcher passes a temporary token and writes private logs without opening Terminal', () => {
  const launcherPath = path.join(root, 'tools/runner-setup/macos/Brightdesk-Product-Runner-Setup.app/Contents/MacOS/BrightdeskProductRunnerSetup');
  const launcher = fs.readFileSync(launcherPath, 'utf8');
  assert.match(launcher, /GH_TOKEN=/);
  assert.doesNotMatch(launcher, /gh auth status|gh api user/);
  assert.match(launcher, /conz20/);
  assert.match(launcher, /Library\/Logs\/Brightdesk\/Product-Runner-Setup/);
  assert.match(launcher, /umask 077/);
  assert.doesNotMatch(launcher, /open -a Terminal|osascript.*Terminal/);
  assert.doesNotMatch(launcher, /sudo\s|launchctl|systemctl/);
});

test('runner storage cannot be redirected to chmod an unrelated directory', () => {
  assert.match(script, /^RUNNER_BASE="\$\{HOME\}\/\.brightdesk-product-ci-runners"$/m);
  assert.doesNotMatch(script, /BRIGHTDESK_RUNNER_ROOT/);
});
