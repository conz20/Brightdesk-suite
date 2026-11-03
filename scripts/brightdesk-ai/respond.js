#!/usr/bin/env node
'use strict';

const fs = require('node:fs');

async function main() {
  const [systemPath, userPath] = process.argv.slice(2);
  if (!systemPath || !userPath) {
    throw new Error('Usage: node scripts/brightdesk-ai/respond.js <system-instructions.md> <user-context.md>');
  }

  const system = fs.readFileSync(systemPath, 'utf8');
  const user = fs.readFileSync(userPath, 'utf8');
  if (Buffer.byteLength(system, 'utf8') > 16000 || Buffer.byteLength(user, 'utf8') > 24000) {
    throw new Error('The local AI prompt is too large. Reduce the supplied context before retrying.');
  }

  const response = await fetch('http://127.0.0.1:8080/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'brightdesk-qwen3-local',
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ],
      temperature: 0.15,
      max_tokens: 500,
      stream: false
    }),
    signal: AbortSignal.timeout(120000)
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 2000);
    throw new Error(`The local AI model returned HTTP ${response.status}: ${detail}`);
  }

  const result = await response.json();
  const answer = result?.choices?.[0]?.message?.content;
  if (typeof answer !== 'string' || !answer.trim()) {
    throw new Error('The local AI model returned an empty answer.');
  }
  process.stdout.write(`${answer.trim()}\n`);
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
