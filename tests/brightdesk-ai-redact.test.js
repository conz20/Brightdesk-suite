'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { redact } = require('../scripts/brightdesk-ai/redact');

test('redacts GitHub tokens, AWS access keys and bearer credentials', () => {
  const source = [
    'token=ghp_abcdefghijklmnopqrstuvwxyz1234567890',
    'github_pat_abcdefghijklmnopqrstuvwxyz1234567890',
    'AWS_ACCESS_KEY_ID=AKIA1234567890ABCDEF',
    'Authorization: Bearer secret-value-123'
  ].join('\n');

  const result = redact(source);
  assert.doesNotMatch(result, /ghp_abcdefghijklmnopqrstuvwxyz1234567890/);
  assert.doesNotMatch(result, /github_pat_abcdefghijklmnopqrstuvwxyz1234567890/);
  assert.doesNotMatch(result, /AKIA1234567890ABCDEF/);
  assert.doesNotMatch(result, /secret-value-123/);
  assert.match(result, /\[REDACTED/);
});

test('leaves ordinary failure messages readable', () => {
  const source = 'Error: Windows installer test failed because the setup file was missing.';
  assert.equal(redact(source), source);
});
