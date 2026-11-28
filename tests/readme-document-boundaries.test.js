# README document-boundary regression test
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');

test('Brightdesk Suite README stays focused on branding and the approved product identity', () => {
  assert.match(readme, /Brightdesk identity/);
  assert.match(readme, /Brightdesk Suite experience/);
  assert.match(readme, /Brightdesk Pages/);
  assert.match(readme, /Brightdesk Workspace/);
  assert.doesNotMatch(readme, /licen[cs]|security|vulnerabilit|MIT/i);
});

test('the operative licence and security policy remain separate root documents', () => {
  const license = fs.readFileSync(path.join(root, 'LICENSE'), 'utf8');
  const security = fs.readFileSync(path.join(root, 'SECURITY.md'), 'utf8');
  assert.match(license, /^MIT License\n/);
  assert.match(security, /^# Brightdesk Security Policy\n/);
  assert.notEqual(license, security);
});
