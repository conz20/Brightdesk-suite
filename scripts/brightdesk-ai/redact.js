#!/usr/bin/env node
'use strict';

const fs = require('node:fs');

function redact(text) {
  return String(text)
    .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/g, '[REDACTED_GITHUB_TOKEN]')
    .replace(/\bAKIA[0-9A-Z]{16}\b/g, '[REDACTED_AWS_KEY]')
    .replace(/\bsk-[A-Za-z0-9_-]{20,}\b/g, '[REDACTED_API_KEY]')
    .replace(/-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g, '[REDACTED_PRIVATE_KEY]')
    .replace(/(authorization\s*:\s*bearer\s+)[^\s"'`]+/gi, '$1[REDACTED]')
    .replace(/(\b[A-Z0-9_]*(?:TOKEN|PASSWORD|SECRET|PRIVATE_KEY)\b\s*[:=]\s*)[^\s,;]+/gi, '$1[REDACTED]');
}

if (require.main === module) {
  const file = process.argv[2];
  if (!file) {
    console.error('Usage: node scripts/brightdesk-ai/redact.js <log-file>');
    process.exit(2);
  }
  fs.writeFileSync(file, redact(fs.readFileSync(file, 'utf8')));
}

module.exports = { redact };
