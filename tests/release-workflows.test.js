'use strict';

const test = require('node:test');
const { execFileSync } = require('node:child_process');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('Dependabot checks npm dependencies and GitHub Actions weekly', () => {
  const workflow = read('.github/dependabot.yml');
  assert.match(workflow, /package-ecosystem: npm/);
  assert.match(workflow, /package-ecosystem: github-actions/);
  assert.equal((workflow.match(/interval: weekly/g) || []).length, 2);
});

test('one consolidated quality gate uses the self-hosted runner and verifies the committed dependency lock', () => {
  const workflow = read('.github/workflows/quality.yml');
  assert.match(workflow, /pull_request:\s*\n\s*branches: \[main\]/);
  assert.match(workflow, /cron:/);
  assert.match(workflow, /runs-on: self-hosted/);
  assert.match(workflow, /node-version: 24\.22\.2/);
  for (const command of [
    'npm run check:node',
    'npm run lock:verify',
    'npm ci --no-audit --no-fund',
    'npm run verify:licenses',
    'npm test',
    'npm run release:preflight',
    'npm audit --audit-level=high'
  ]) assert.ok(workflow.includes(command), `quality gate includes ${command}`);
  assert.ok(workflow.indexOf('npm run lock:verify') < workflow.indexOf('npm ci --no-audit --no-fund'));
  assert.doesNotMatch(workflow, /npm run lock:prepare/);
  for (const obsolete of ['integration-ci.yml', 'lists-ci.yml', 'security-audit.yml', 'todo-ci.yml']) {
    assert.equal(fs.existsSync(path.join(root, '.github', 'workflows', obsolete)), false, `${obsolete} must not duplicate the consolidated gate`);
  }
});

test('PR verification workflows never cancel an in-progress check', () => {
  const workflowFiles = [
    '.github/workflows/ci.yml',
    '.github/workflows/quality.yml',
    '.github/workflows/rust-engine.yml',
    '.github/workflows/verify-macos-installer.yml'
  ];

  for (const file of workflowFiles) {
    const workflow = read(file);
    assert.match(
      workflow,
      /concurrency:\s*\n\s*group:[^\n]+\n\s*cancel-in-progress:\s*false/,
      `${file} must preserve active verification attempts`
    );
  }
});

test('release workflow builds and verifies all three desktop platforms on private self-hosted runners', () => {
  const workflow = read('.github/workflows/build-release.yml');
  for (const platform of ['Linux', 'Windows', 'macOS']) {
    assert.match(workflow, new RegExp(`platform: ${platform}`));
  }
  for (const command of ['dist:linux', 'dist:win', 'dist:mac', 'dist:apps:linux', 'dist:apps:win', 'dist:apps:mac', 'release:verify:linux', 'release:verify:win', 'release:verify:mac', 'release:verify:products:linux', 'release:verify:products:win', 'release:verify:products:mac']) {
    assert.ok(workflow.includes(command), `workflow includes ${command}`);
  }
  assert.match(workflow, /node-version: 24\.22\.2/);
  assert.match(workflow, /pull_request:\s*\n\s*branches: \[main\]/);
  assert.match(workflow, /push:\s*\n\s*branches: \[main\]\s*\n\s*tags: \['v\*'\]/);
  assert.doesNotMatch(workflow, /workflow_dispatch:/, 'installer builds must not require manual dispatch');
  assert.doesNotMatch(workflow, /windows-latest|macos-latest|ubuntu-latest/, 'platform installer jobs must use private runners');
  assert.match(workflow, /runner: \["self-hosted", "Linux", "X64"\]/);
  assert.match(workflow, /runner: \["self-hosted", "Windows", "X64"\]/);
  assert.match(workflow, /runner: \["self-hosted", "macOS", "ARM64"\]/);
  assert.match(workflow, /runs-on: \$\{\{ matrix\.runner \}\}/);
  assert.match(workflow, /queue: max/);
  assert.match(workflow, /github\.event_name != 'pull_request' \|\| github\.event\.pull_request\.head\.repo\.full_name == github\.repository/);
  assert.doesNotMatch(workflow, /npm run lock:prepare/, 'release builds must not regenerate the committed lock');
  assert.match(workflow, /npm run lock:verify/);
  assert.doesNotMatch(workflow, /brightdesk-dependency-lock/, 'the committed lock is read directly from the checked-out source');
  assert.match(workflow, /npm run release:preflight/);
  assert.match(workflow, /npm test/);
  assert.match(workflow, /npm audit --audit-level=high/);
});
test('signing and notarisation secrets are limited to main or explicit version tags and the matching platform', () => {
  const workflow = read('.github/workflows/build-release.yml');
  const buildStep = workflow.split('- name: Build Suite and all ten standalone product installers')[1];
  assert.ok(buildStep, 'build installer step exists');
  for (const secret of ['CSC_LINK', 'CSC_KEY_PASSWORD', 'CSC_INSTALLER_LINK', 'CSC_INSTALLER_KEY_PASSWORD', 'APPLE_ID', 'APPLE_APP_SPECIFIC_PASSWORD', 'APPLE_TEAM_ID']) {
    const line = buildStep.split('\n').find((item) => item.trimStart().startsWith(`${secret}:`));
    assert.ok(line, `${secret} is configured for the build step`);
    assert.match(line, /github\.event_name == 'push'/, `${secret} is limited to push builds`);
    assert.match(line, /github\.ref == 'refs\/heads\/main' \|\| startsWith\(github\.ref, 'refs\/tags\/v'\)/, `${secret} is available only on main or explicit version tags`);
  }
  const installerCert = buildStep.split('\n').find((item) => item.trimStart().startsWith('CSC_INSTALLER_LINK:'));
  const appleId = buildStep.split('\n').find((item) => item.trimStart().startsWith('APPLE_ID:'));
  assert.match(installerCert, /matrix\.platform == 'macOS'/, 'macOS installer certificate is macOS-only');
  assert.match(appleId, /matrix\.platform == 'macOS'/, 'Apple notarisation identity is macOS-only');
});
test('release publishing requires a version tag matching the checked-out package version', () => {
  const workflow = read('.github/workflows/build-release.yml');
  assert.doesNotMatch(workflow, /workflow_dispatch:|inputs\.publish_release/);
  assert.ok(workflow.includes("if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/v') && github.ref == format('refs/tags/v{0}', needs.collect.outputs.version)"));
  assert.ok(workflow.includes('tag_name: ${{ github.ref_name }}'));
  assert.match(workflow, /contents: write/);
  assert.match(workflow, /needs: collect/);
});
test('Linux builds do not receive Windows or macOS signing credentials', () => {
  const workflow = read('.github/workflows/build-release.yml');
  const buildStep = workflow.split('- name: Build Suite and all ten standalone product installers')[1];
  for (const key of ['CSC_LINK', 'CSC_KEY_PASSWORD']) {
    const line = buildStep.split('\n').find((item) => item.trimStart().startsWith(`${key}:`));
    assert.match(line, /matrix\.platform == 'Windows'/);
    assert.match(line, /matrix\.platform == 'macOS'/);
    assert.match(line, /\|\| ''/);
  }
});

test('platform release artifacts remain in separate folders and release lock metadata is retained', () => {
  const workflow = read('.github/workflows/build-release.yml');
  for (const [platform, folder] of [['Linux', 'release/Linux'], ['Windows', 'release/Windows'], ['macOS', 'release/macOS']]) {
    assert.match(workflow, new RegExp(`name: Download verified ${platform} build`));
    assert.ok(workflow.includes(`path: ${folder}`), `${platform} is downloaded into its own folder`);
  }
  assert.ok(workflow.includes('name: Check out the exact release source'));
  assert.ok(workflow.includes('ref: ${{ github.sha }}'));
  assert.ok(workflow.includes('node-version: 24.22.2'));
  assert.ok(workflow.includes('name: Preserve the committed dependency lock in release metadata'));
  assert.ok(workflow.includes('cp package-lock.json release/build-metadata/package-lock.json'));
  assert.match(workflow, /files: release\/\*\*\/\*/);
  assert.doesNotMatch(workflow, /merge-multiple: true/);
  const prepare = read('scripts/prepare-release-assets.js');
  assert.match(prepare, /Brightdesk-\$\{label\}-LICENSE\.txt/);
  const verifier = read('scripts/verify-release-artifacts.js');
  assert.match(verifier, /Brightdesk-SHA256SUMS-\$\{platform\.toUpperCase\(\)\}/);
});

test('Node.js runtime is pinned consistently to the current 24 LTS patch', () => {
  const manifest = JSON.parse(read('package.json'));
  assert.equal(manifest.engines.node, '24.22.2');
  assert.equal(read('.nvmrc').trim(), '24.22.2');
  assert.equal(read('.node-version').trim(), '24.22.2');
  assert.match(read('.devcontainer/Dockerfile'), /^FROM node:24\.22\.2-bookworm/m);
  assert.match(read('.github/workflows/build-release.yml'), /node-version: 24\.22\.2/);
  assert.match(read('.github/workflows/quality.yml'), /node-version: 24\.22\.2/);
});

test('individual app installer builds explicitly disable implicit publishing', () => {
  const builder = read('scripts/build-app.js');
  assert.match(builder, /'--publish', 'never'/);
});

test('all customer installer build commands explicitly disable implicit publishing', () => {
  const manifest = JSON.parse(read('package.json'));
  for (const name of ['dist', 'dist:win', 'dist:mac', 'dist:linux', 'release']) {
    assert.match(manifest.scripts[name], /--publish never$/, `${name} must build locally without publishing`);
  }
});

test('local release verification runs tests and builds only for the current native platform', () => {
  const manifest = JSON.parse(read('package.json'));
  assert.equal(manifest.scripts['verify:local-release'], 'node scripts/verify-local-release.js');
  const script = read('scripts/verify-local-release.js');
  for (const step of ['check:node', 'lock:verify', 'ci', '--no-audit', '--no-fund', 'verify:licenses', 'test', 'rea:inspect', 'release:preflight', 'audit', '--audit-level=high', 'dist:', 'release:prepare', 'release:verify:']) {
    assert.ok(script.includes(step), `local release script includes ${step}`);
  }
  assert.match(script, /process\.versions\.node/);
  assert.match(script, /process\.platform/);
  assert.match(script, /CSC_IDENTITY_AUTO_DISCOVERY/);
  assert.doesNotMatch(script, /publish always|gh release create/i);
});

test('dependency-maintenance workflows use the existing self-hosted runner', () => {
  for (const file of ['.github/workflows/generate-lockfile.yml', '.github/workflows/generate-third-party-notices.yml']) {
    assert.match(read(file), /runs-on: self-hosted/, `${file} must not consume hosted-runner minutes`);
  }
});


test('installer pipeline uses the private native runner for each operating system', () => {
  const workflow = read('.github/workflows/build-release.yml');
  assert.match(workflow, /runner: \["self-hosted", "Linux", "X64"\]/);
  assert.match(workflow, /runner: \["self-hosted", "Windows", "X64"\]/);
  assert.match(workflow, /runner: \["self-hosted", "macOS", "ARM64"\]/);
  assert.match(workflow, /runs-on: self-hosted/);
  assert.doesNotMatch(workflow, /ubuntu-latest|windows-latest|macos-latest/);
});

test('README freshness check uses the existing self-hosted runner', () => {
  const workflow = read('.github/workflows/readme-freshness.yml');
  assert.match(workflow, /runs-on: self-hosted/);
  assert.doesNotMatch(workflow, /ubuntu-latest|windows-latest|macos-latest/);
});

test('README freshness script remains compatible with macOS system Bash 3.2', () => {
  const workflow = read('.github/workflows/readme-freshness.yml');
  assert.doesNotMatch(workflow, /\bmapfile\b/, 'macOS Bash 3.2 does not provide mapfile');
  assert.match(workflow, /while IFS= read -r file; do/, 'changed files are processed with Bash 3.2-compatible syntax');
});

test('README freshness workflow protects the private runner from forked pull requests', () => {
  const workflow = read('.github/workflows/readme-freshness.yml');
  const guard = /if:\s*github\.event_name != 'pull_request' \|\| github\.event\.pull_request\.head\.repo\.full_name == github\.repository/;
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /runs-on:\s*self-hosted/);
  assert.match(workflow, guard);
});


test('all private self-hosted pull-request workflows reject fork-controlled code', () => {
  const files = [
    '.github/workflows/ci.yml',
    '.github/workflows/quality.yml',
    '.github/workflows/rust-engine.yml',
    '.github/workflows/verify-macos-installer.yml'
  ];
  const guard = "if: github.event_name != 'pull_request' || github.event.pull_request.head.repo.full_name == github.repository";

  for (const file of files) {
    const workflow = read(file);
    assert.match(workflow, /pull_request:/, file + ' must retain pull-request checks');
    assert.match(workflow, /runs-on:.*self-hosted/, file + ' must use the private runner');
    assert.ok(workflow.includes(guard), file + ' must not run fork-controlled pull-request code');
  }
});


test('all third-party workflow actions are pinned to full commit SHAs', () => {
  const workflowDirectory = path.join(root, '.github', 'workflows');
  const workflowFiles = fs.readdirSync(workflowDirectory).filter(file => file.endsWith('.yml'));
  for (const file of workflowFiles) {
    const workflow = read('.github/workflows/' + file);
    for (const line of workflow.split(/\r?\n/)) {
      const match = /^\s*uses:\s*([^\s#]+)/.exec(line);
      if (!match || match[1].startsWith('./')) continue;
      assert.match(match[1], /@[0-9a-f]{40}$/, file + ' must pin ' + match[1] + ' to a full commit SHA');
    }
  }
});


test('Windows self-hosted runner setup targets the correct private repository and isolates its download', () => {
  const setup = read('tools/runner-setup/windows/Install-Brightdesk-Windows-Runner.ps1');

  assert.match(setup, /\$RepositoryUrl = "https:\/\/github\.com\/\$Owner\/\$RepositoryName"/);
  assert.doesNotMatch(setup, /connormolloy12/);
  assert.match(setup, /RunnerVersion = '2\.338\.2'/);
  assert.match(setup, /ExpectedSha256 = '[a-f0-9]{64}'/);
  assert.match(setup, /\[guid\]::NewGuid\(\)/);
  assert.match(setup, /\[System\.IO\.Path\]::GetTempPath\(\)/);
  assert.doesNotMatch(setup, /if \(Test-Path -LiteralPath \$archivePath\)/);
  assert.match(setup, /already contains files[\s\S]*Nothing was overwritten/);
  assert.match(setup, /Type REGISTER to continue/);
  assert.match(setup, /install --id Git\.Git/);
  assert.match(setup, /install --id GitHub\.cli/);
  assert.match(setup, /auth login --hostname github\.com --git-protocol https --web/);
  assert.match(setup, /api --method POST \$RegistrationEndpoint/);
  assert.match(setup, /'--token', \$registrationToken/);
  assert.match(setup, /Remove-Variable -Name registrationToken/);
  assert.doesNotMatch(setup, /Paste the one-time registration token/);
});


test('private Mac runner bootstrap is pinned, repository-scoped and token-safe', () => {
  const setupPath = path.join(root, 'tools/runner-setup/macos/Start-Brightdesk-Mac-Foundation-Runners.sh');
  const setup = read('tools/runner-setup/macos/Start-Brightdesk-Mac-Foundation-Runners.sh');
  const repositories = [
    'Brightdesk-suite',
    'Brightdesk-Common-Actions',
    'Brightdesk-Developer-Tools',
    'Brightdesk-Extensions',
    'Brightdesk-Wiki',
    'Brightdesk-Release-Tools',
    'Brightdesk-Services',
    'Brightdesk-Assets',
    'Brightdesk-Printing',
    'Brightdesk-Lists',
    'Brightdesk-Pages',
    'Brightdesk-Database',
    'Brightdesk-Decks'
  ];

  assert.ok(setup.includes("RUNNER_VERSION='2.338.2'"));
  assert.ok(setup.includes("'Brightdesk-suite'"));
  assert.ok(setup.includes("ARCHIVE_SHA256='25a065af409ffa317ab4d5a3b614dd15fc9c40f2172bc1b35a1b1258e919a388'"));
  assert.ok(setup.includes('actions-runner-osx-arm64-'));
  assert.ok(setup.includes('shasum -a 256'));
  assert.ok(setup.includes('registration_endpoint="repos/$OWNER/$repository/actions/runners/registration-token"'));
  assert.ok(setup.includes("registration_token=\"$(gh api --method POST \"$registration_endpoint\" --jq '.token')\""));
  assert.ok(setup.includes('--token "$registration_token"'));
  assert.ok(!setup.includes('gh auth token --hostname github.com'));
  assert.ok(!setup.includes('RUNNER_CFG_PAT="$github_pat" ./config.sh'));
  assert.ok(setup.includes('Reusing previously verified runner files:'));
  assert.ok(setup.includes('--unattended'));
  assert.ok(setup.includes('config_args=(--url "$repository_url" --token "$registration_token" --name "$runner_name" --runnergroup \'Default\' --work \'_work\' --unattended)'));
  assert.ok(setup.includes('./config.sh "${config_args[@]}"'));
  assert.ok(!setup.includes(') > /dev/null 2>&1; then'));
  assert.ok(!setup.includes('configure.log'));
  assert.ok(!setup.includes('launchctl'));
  assert.ok(!setup.includes('sudo'));
  assert.ok(setup.includes('nohup ./run.sh'));
  assert.ok(setup.includes('Type REGISTER to continue'));
  assert.ok(setup.includes('The existing runner path is not a normal directory:'));
  assert.ok(setup.includes('The existing runner folder already contains runner configuration:'));
  assert.ok(setup.includes('A compatible Mac runner is already registered but offline'));
  assert.ok(setup.includes('brightdesk-product-ci'));
  assert.ok(setup.includes('Brightdesk-Lists|Brightdesk-Pages|Brightdesk-Database|Brightdesk-Decks'));
  assert.ok(setup.includes('Brightdesk-Printing)'));
  assert.ok(setup.includes("extra_label='brightdesk-printing-ci'"));
  assert.match(setup, /required_labels=.*\$extra_label/);
  assert.ok(setup.includes('up to thirteen repository-scoped runners'));
  for (const repository of repositories) assert.ok(setup.includes("'" + repository + "'"), repository);
  assert.ok(!setup.includes('ubuntu-latest'));
  assert.ok(!setup.includes('windows-latest'));
  assert.ok(!setup.includes('macos-latest'));
  execFileSync('bash', ['-n', setupPath], { stdio: 'pipe' });
});

test('Mac runner setup documentation explains scope, token handling and no-service operation', () => {
  const instructions = read('tools/runner-setup/macos/README.txt');
  const releaseGuide = read('docs/LOCAL-RELEASE-VERIFICATION.md');

  assert.match(instructions, /Apple-silicon Mac only/);
  assert.ok(instructions.includes('The GitHub CLI credential is used only by `gh api` to request a short-lived registration token for the specific repository.'));
  assert.ok(instructions.includes('The temporary registration token is passed to the official `config.sh --token` option, as required by the runner configurator.'));
  assert.ok(instructions.includes('It is not printed or saved to a file and is cleared from the setup script immediately after configuration.'));
  assert.ok(instructions.includes('They do not auto-start after logout or reboot.'));
  assert.ok(releaseGuide.includes('Start-Brightdesk-Mac-Foundation-Runners.sh'));
  assert.ok(releaseGuide.includes('Brightdesk-Printing'));
  assert.ok(releaseGuide.includes('brightdesk-printing-ci'));
  assert.ok(releaseGuide.includes('those thirteen repositories'));
  assert.match(releaseGuide, /Brightdesk-Common-Actions/);
  assert.ok(instructions.includes('these thirteen repositories'));
  assert.ok(instructions.includes('Brightdesk-Printing receives the separate "brightdesk-printing-ci" label'));
  assert.ok(instructions.includes('brightdesk-printing-ci'));
  for (const repository of ['Brightdesk-Pages', 'Brightdesk-Database', 'Brightdesk-Decks']) {
    assert.ok(instructions.includes(repository), repository);
    assert.ok(releaseGuide.includes(repository), repository);
  }
  for (const repository of ['Brightdesk-Lists', 'Brightdesk-Pages', 'Brightdesk-Database', 'Brightdesk-Decks']) {
    assert.ok(instructions.includes(repository + ' receives the additional label') || instructions.includes('Brightdesk-Lists, Brightdesk-Pages, Brightdesk-Database and Brightdesk-Decks receive'));
  }
});

test('Mac runner setup can be opened from Finder without typing a shell command', () => {
  const launcherPath = path.join(root, 'tools/runner-setup/macos/Start-Brightdesk-Mac-Foundation-Runners.command');
  const launcher = read('tools/runner-setup/macos/Start-Brightdesk-Mac-Foundation-Runners.command');
  const setupPath = path.join(root, 'tools/runner-setup/macos/Start-Brightdesk-Mac-Foundation-Runners.sh');

  assert.ok(fs.statSync(launcherPath).mode & 0o111, 'Finder launcher must be executable');
  assert.ok(launcher.includes('SCRIPT_DIR='));
  assert.ok(launcher.includes('Start-Brightdesk-Mac-Foundation-Runners.sh'));
  assert.ok(launcher.includes('bash "$RUNNER_SETUP"'));
  assert.ok(launcher.includes('REGISTER only when you are ready'));
  assert.ok(launcher.includes('read -r -p'));
  execFileSync('bash', ['-n', launcherPath], { stdio: 'pipe' });
  execFileSync('bash', ['-n', setupPath], { stdio: 'pipe' });
});

test('Windows runner setup explicitly supports Windows 10 and Windows 11', () => {
  const setup = read('tools/runner-setup/windows/Install-Brightdesk-Windows-Runner.ps1');
  const instructions = read('tools/runner-setup/windows/README.txt');
  const releaseGuide = read('docs/LOCAL-RELEASE-VERIFICATION.md');
  assert.match(instructions, /Windows 10 or Windows 11/);
  assert.match(releaseGuide, /64-bit Windows 10 and Windows 11/);
  assert.match(releaseGuide, /Windows 10 version 2004 \(build 19041\) or later/);
  assert.match(setup, /Is64BitOperatingSystem/);
  assert.ok(setup.includes('Get-Command git.exe'));
  assert.ok(setup.includes('Get-Command bash.exe'));
  assert.match(instructions, /Git for Windows/);
  assert.match(releaseGuide, /The release workflow already targets/);
});

test('release workflow registers post-job cleanup in every self-hosted job', () => {
  const workflow = read('.github/workflows/build-release.yml');
  const actionRef = 'uses: conz20/Brightdesk-suite/.github/actions/runner-workspace-cleanup@';
  assert.equal(workflow.split(actionRef).length - 1, 4);
  assert.ok(!workflow.includes('run: node scripts/cleanup-runner-workspace.js'));
  assert.equal((workflow.match(/persist-credentials: false/g) || []).length, 3);
  assert.doesNotMatch(workflow, /cache: npm/);
  assert.ok(workflow.includes('node-version: 24.22.2'));
});

test('self-hosted CI disables checkout credentials and registers post-job cleanup', () => {
  const workflow = read('.github/workflows/ci.yml');
  assert.ok(workflow.includes('runs-on: self-hosted'));
  assert.ok(workflow.includes('persist-credentials: false'));
  assert.ok(!workflow.includes('cache: npm'));
  assert.ok(workflow.includes('uses: conz20/Brightdesk-suite/.github/actions/runner-workspace-cleanup@'));
  assert.ok(!workflow.includes('run: node scripts/cleanup-runner-workspace.js'));
});

test('release collector checkout uses one valid with block and preserves the exact commit checkout', () => {
  const workflow = read('.github/workflows/build-release.yml');
  const start = workflow.indexOf('- name: Check out the exact release source');
  const end = workflow.indexOf('- name: Set up required Node.js version', start);
  assert.ok(start >= 0 && end > start, 'release collector checkout exists');
  const checkout = workflow.slice(start, end);
  assert.ok(checkout.includes('persist-credentials: false'));
  assert.ok(checkout.includes('ref: ${{ github.sha }}'));
  assert.equal(checkout.split('        with:').length - 1, 1);
});


test('every self-hosted workflow registers post-job source cleanup before other actions', () => {
  const expected = [
    ['.github/workflows/build-release.yml', 4],
    ['.github/workflows/ci.yml', 1],
    ['.github/workflows/quality.yml', 1],
    ['.github/workflows/rust-engine.yml', 1],
    ['.github/workflows/readme-freshness.yml', 1],
    ['.github/workflows/verify-macos-installer.yml', 1],
    ['.github/workflows/generate-lockfile.yml', 1],
    ['.github/workflows/generate-third-party-notices.yml', 1]
  ];
  const action = read('.github/actions/runner-workspace-cleanup/action.yml');
  assert.ok(action.includes('using: node24'));
  assert.ok(action.includes('main: register.js'));
  assert.ok(action.includes('post: cleanup.js'));
  assert.ok(action.includes('post-if: always()'));

  for (const [file, count] of expected) {
    const workflow = read(file);
    const registrations = workflow.split('uses: conz20/Brightdesk-suite/.github/actions/runner-workspace-cleanup@').length - 1;
    assert.equal(registrations, count, file);
    assert.ok(!workflow.includes('run: node scripts/cleanup-runner-workspace.js'));
    const actionIndex = workflow.indexOf('Register post-job workspace cleanup');
    const checkoutIndex = workflow.indexOf('uses: actions/checkout@');
    if (checkoutIndex >= 0) assert.ok(actionIndex >= 0 && actionIndex < checkoutIndex, file);
  }
});


test('Linux x64 runner bootstrap supports WSL 2 on Windows 10 and Windows 11', () => {
  const setupPath = path.join(root, 'tools', 'runner-setup', 'linux', 'Install-Brightdesk-Linux-Runner.sh');
  const setup = read('tools/runner-setup/linux/Install-Brightdesk-Linux-Runner.sh');
  const instructions = read('tools/runner-setup/linux/README.txt');
  const releaseGuide = read('docs/LOCAL-RELEASE-VERIFICATION.md');
  assert.ok(instructions.includes('Windows 10 version 2004 (Build 19041) or later, or Windows 11.'));
  assert.ok(instructions.includes('Ubuntu 22.04 LTS or Ubuntu 24.04 LTS.'));
  assert.ok(setup.includes("RUNNER_VERSION='2.338.2'"));
  assert.match(setup, /ARCHIVE_SHA256='[a-f0-9]{64}'/);
  assert.ok(setup.includes('microsoft-standard-WSL2'));
  assert.ok(setup.includes("'22.04'|'24.04'"));
  assert.ok(setup.includes('gh api --method POST'));
  assert.ok(setup.includes('pgrep -f -o'));
  assert.ok(setup.includes('nohup ./run.sh'));
  assert.ok(releaseGuide.includes('Install-Brightdesk-Linux-Runner.sh'));
  assert.ok(releaseGuide.includes('post-job cleanup action'));
  execFileSync('bash', ['-n', setupPath], { stdio: 'pipe' });
});

test('README freshness exempts internal workflows, runner setup and test-only changes', () => {
  const workflow = read('.github/workflows/readme-freshness.yml');
  assert.ok(workflow.includes('.github/**'));
  assert.ok(workflow.includes('tools/runner-setup/**'));
  assert.ok(workflow.includes('tests/**'));
  assert.ok(workflow.includes('test/**'));
  assert.ok(workflow.includes('scripts/cleanup-runner-workspace.js'));
});


test('Windows runner launcher runs its sibling installer without an unauthenticated private download', () => {
  const instructions = read('tools/runner-setup/windows/README.txt');
  const launcher = read('tools/runner-setup/windows/Start-Brightdesk-Windows-Runner.cmd');
  const installer = read('tools/runner-setup/windows/Install-Brightdesk-Windows-Runner.ps1');
  const releaseGuide = read('docs/LOCAL-RELEASE-VERIFICATION.md');

  assert.ok(instructions.includes('Download both Start-Brightdesk-Windows-Runner.cmd and Install-Brightdesk-Windows-Runner.ps1'));
  assert.ok(instructions.includes('Keep both files in the same folder'));
  assert.ok(launcher.includes('set "INSTALLER_PATH=%~dp0Install-Brightdesk-Windows-Runner.ps1"'));
  assert.ok(launcher.includes('if not exist "%INSTALLER_PATH%"'));
  const expectedInstallerHash = /^set "INSTALLER_SHA256=([a-f0-9]{64})"$/m.exec(launcher)?.[1];
  assert.ok(expectedInstallerHash, 'launcher pins the sibling PowerShell installer checksum');
  assert.equal(expectedInstallerHash, createHash('sha256').update(installer, 'utf8').digest('hex'));
  assert.ok(launcher.includes('Get-FileHash -LiteralPath $env:INSTALLER_PATH -Algorithm SHA256'));
  assert.ok(launcher.includes('powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%INSTALLER_PATH%"'));
  assert.ok(!/INSTALLER_URL|INSTALLER_SHA256|Invoke-WebRequest|raw\.githubusercontent\.com/i.test(launcher));
  assert.ok(installer.includes('Get-Command git.exe'));
  assert.ok(installer.includes('Get-Command bash.exe'));
  assert.ok(installer.includes('install --id Git.Git'));
  assert.ok(installer.includes('install --id GitHub.cli'));
  assert.ok(installer.includes('--web'));
  assert.ok(installer.includes('api --method POST $RegistrationEndpoint'));
  assert.ok(installer.includes("'--token', $registrationToken"));
  assert.ok(releaseGuide.includes('Download both the Windows launcher and its PowerShell installer'));
});


test('README freshness keeps only the latest pending PR check without cancelling an active run', () => {
  const workflow = read('.github/workflows/readme-freshness.yml');
  assert.ok(workflow.includes('group: brightdesk-readme-freshness-${{ github.event.pull_request.number || github.ref }}'));
  assert.match(workflow, /concurrency:\s*\n\s*group:[^\n]+\n\s*cancel-in-progress:\s*false/);
  assert.match(workflow, /runs-on: self-hosted/);
});
