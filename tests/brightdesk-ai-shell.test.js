'use strict';

const test = require('node:test');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

test('local AI model bootstrap script has valid Bash syntax', { skip: process.platform === 'win32' }, () => {
  const script = path.join(__dirname, '..', 'scripts', 'brightdesk-ai', 'start-local-model.sh');
  execFileSync('bash', ['-n', script], { stdio: 'pipe' });
});
