'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const { createLocalQwenProvider } = require('../scripts/brightdesk-ai/local-qwen-provider');

test('local AI model bootstrap script has valid Bash syntax', { skip: process.platform === 'win32' }, () => {
  const script = path.join(__dirname, '..', 'scripts', 'brightdesk-ai', 'start-local-model.sh');
  execFileSync('bash', ['-n', script], { stdio: 'pipe' });
});

test('local llama.cpp model alias matches the provider model identifier', () => {
  const script = path.join(__dirname, '..', 'scripts', 'brightdesk-ai', 'start-local-model.sh');
  const source = readFileSync(script, 'utf8');
  const alias = source.match(/^MODEL_ALIAS="([^"]+)"$/m)?.[1];

  assert.equal(alias, createLocalQwenProvider().model);
  assert.match(source, /--alias "\$MODEL_ALIAS"/);
});
