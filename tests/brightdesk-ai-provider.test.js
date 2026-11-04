'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createLocalQwenProvider } = require('../scripts/brightdesk-ai/local-qwen-provider');

test('local Qwen provider is disabled unless explicitly enabled', async () => {
  let requests = 0;
  const provider = createLocalQwenProvider({
    fetchImpl: async () => { requests += 1; throw new Error('network must not be used'); }
  });

  assert.equal(provider.enabled, false);
  assert.equal(provider.id, 'brightdesk-local-qwen');
  await assert.rejects(
    provider.generate({ task: 'Explain a failure', input: 'Public test context' }),
    { code: 'PROVIDER_DISABLED' }
  );
  assert.equal(requests, 0);
});

test('enabled provider implements the shared generate contract using loopback only', async () => {
  let requestUrl;
  let requestOptions;
  const provider = createLocalQwenProvider({
    enabled: true,
    fetchImpl: async (url, options) => {
      requestUrl = url;
      requestOptions = options;
      return {
        ok: true,
        status: 200,
        async json() {
          return { choices: [{ message: { content: '  The check failed.  ' } }] };
        }
      };
    }
  });

  const answer = await provider.generate({
    taskId: 'task-123',
    task: 'Explain the failure in plain language.',
    input: { log: 'A test failed.' },
    model: provider.model,
    promptTemplateVersion: 'maintenance-v1'
  });

  assert.equal(answer, 'The check failed.');
  assert.equal(requestUrl, 'http://127.0.0.1:8080/v1/chat/completions');
  assert.equal(requestOptions.method, 'POST');
  const body = JSON.parse(requestOptions.body);
  assert.equal(body.model, provider.model);
  assert.deepEqual(body.messages, [
    { role: 'system', content: 'Explain the failure in plain language.' },
    { role: 'user', content: '{"log":"A test failed."}' }
  ]);
  assert.equal(body.stream, false);
});

test('provider reports HTTP errors without copying response bodies into logs', async () => {
  const provider = createLocalQwenProvider({
    enabled: true,
    fetchImpl: async () => ({
      ok: false,
      status: 503,
      async text() { return 'sensitive response body'; }
    })
  });

  await assert.rejects(
    provider.generate({ task: 'Explain', input: 'Context' }),
    error => error.code === 'PROVIDER_HTTP_ERROR' && !error.message.includes('sensitive response body')
  );
});

test('provider rejects empty prompts and oversized context before making a request', async () => {
  let requests = 0;
  const provider = createLocalQwenProvider({
    enabled: true,
    fetchImpl: async () => { requests += 1; }
  });

  await assert.rejects(
    provider.generate({ task: ' ', input: 'Context' }),
    { code: 'INVALID_PROVIDER_INPUT' }
  );
  await assert.rejects(
    provider.generate({ task: 'Explain', input: 'x'.repeat(24001) }),
    { code: 'PROMPT_TOO_LARGE' }
  );
  assert.equal(requests, 0);
});

test('provider rejects malformed and empty model responses', async () => {
  const provider = createLocalQwenProvider({
    enabled: true,
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      async json() { return { choices: [{ message: { content: '   ' } }] }; }
    })
  });

  await assert.rejects(
    provider.generate({ task: 'Explain', input: 'Context' }),
    { code: 'EMPTY_MODEL_RESPONSE' }
  );
});

test('provider requires the built-in fetch implementation or an injected test fetch', () => {
  assert.throws(
    () => createLocalQwenProvider({ fetchImpl: null }),
    /fetch implementation/
  );
});
