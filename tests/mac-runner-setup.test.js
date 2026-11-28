'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'tools', 'runner-setup', 'macos', 'Start-Brightdesk-Mac-Foundation-Runners.sh'), 'utf8');
const guide = fs.readFileSync(path.join(root, 'tools', 'runner-setup', 'macos', 'README.txt'), 'utf8');

test('private Mac runner setup includes Brightdesk Suite before the infrastructure repositories', () => {
  const block = script.match(/REPOSITORIES=\(([\s\S]*?)\n\)/)?.[1];
  assert.ok(block, 'repository list must be present');
  const repositories = [...block.matchAll(/'([^']+)'/g)].map(match => match[1]);
  assert.deepEqual(repositories, [
    'Brightdesk-suite',
    'Brightdesk-Common-Actions',
    'Brightdesk-Developer-Tools',
    'Brightdesk-Extensions',
    'Brightdesk-Wiki',
    'Brightdesk-Release-Tools',
    'Brightdesk-Services',
    'Brightdesk-Assets',
    'Brightdesk-Lists'
  ]);
});

test('Suite runner has the normal Mac labels and a clear repository-specific name', () => {
  assert.match(script, /runner_name='Brightdesk-Brightdesk-Suite-Mac-ARM64'/);
  assert.match(script, /required_labels='\["self-hosted","macOS","ARM64"\]'/);
  assert.match(script, /registration_endpoint="repos\/\$OWNER\/\$repository\/actions\/runners\/registration-token"/);
});

test('runner setup documentation describes all nine repositories', () => {
  assert.match(guide, /nine repositories/);
  assert.match(guide, /Brightdesk-suite \(Brightdesk Suite\)/);
  assert.match(guide, /Brightdesk-Brightdesk-Suite-Mac-ARM64/);
  assert.match(guide, /Brightdesk-Common-Actions/);
  assert.match(guide, /Brightdesk-Developer-Tools/);
  assert.match(guide, /Brightdesk-Extensions/);
  assert.match(guide, /Brightdesk-Wiki/);
  assert.match(guide, /Brightdesk-Release-Tools/);
  assert.match(guide, /Brightdesk-Services/);
  assert.match(guide, /Brightdesk-Assets/);
  assert.match(guide, /Brightdesk-Lists/);
});
