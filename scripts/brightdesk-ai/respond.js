#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const { createLocalQwenProvider } = require('./local-qwen-provider');

async function main() {
  const [systemPath, userPath] = process.argv.slice(2);
  if (!systemPath || !userPath) {
    throw new Error('Usage: node scripts/brightdesk-ai/respond.js <system-instructions.md> <user-context.md>');
  }

  const system = fs.readFileSync(systemPath, 'utf8');
  const user = fs.readFileSync(userPath, 'utf8');

  // The maintenance workflow explicitly enables this local, zero-API-cost provider.
  // The adapter itself remains disabled when constructed by any other caller.
  const provider = createLocalQwenProvider({ enabled: true });
  const answer = await provider.generate({
    task: system,
    input: user,
    model: provider.model,
    promptTemplateVersion: 'brightdesk-maintenance-v1'
  });

  process.stdout.write(answer + '\n');
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
