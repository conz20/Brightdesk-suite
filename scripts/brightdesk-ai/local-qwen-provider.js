#!/usr/bin/env node
'use strict';

const ENDPOINT = 'http://127.0.0.1:8080/v1/chat/completions';
const PROVIDER_ID = 'brightdesk-local-qwen';
const PROVIDER_MODEL = 'brightdesk-qwen3-local';
const ADAPTER_VERSION = '1.0.0';
const MAX_SYSTEM_BYTES = 16000;
const MAX_INPUT_BYTES = 24000;
const DEFAULT_TIMEOUT_MS = 120000;

function providerError(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function promptText(value, label) {
  if (typeof value === 'string') return value;
  try {
    const text = JSON.stringify(value);
    if (typeof text === 'string') return text;
  } catch {
    // Report one stable, plain error without copying prompt contents.
  }
  throw providerError(label + ' must be text or JSON-serialisable data.', 'INVALID_PROVIDER_INPUT');
}

/**
 * Create a provider that matches Brightdesk-AI's Node.js generate(...) contract.
 * The adapter is disabled by default and never accepts a configurable endpoint.
 */
function createLocalQwenProvider({
  enabled = false,
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS
} = {}) {
  if (typeof fetchImpl !== 'function') {
    throw new TypeError('A fetch implementation is required.');
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > DEFAULT_TIMEOUT_MS) {
    throw new RangeError('timeoutMs must be an integer between 1 and 120000.');
  }

  return Object.freeze({
    id: PROVIDER_ID,
    model: PROVIDER_MODEL,
    adapterVersion: ADAPTER_VERSION,
    pricingMode: 'free',
    enabled: enabled === true,

    async generate({ task, input, model } = {}) {
      if (enabled !== true) {
        throw providerError('The local Qwen provider is disabled.', 'PROVIDER_DISABLED');
      }

      const systemPrompt = promptText(task, 'task');
      const userPrompt = promptText(input, 'input');
      if (!systemPrompt.trim() || !userPrompt.trim()) {
        throw providerError('The local Qwen task and input must not be empty.', 'INVALID_PROVIDER_INPUT');
      }
      if (Buffer.byteLength(systemPrompt, 'utf8') > MAX_SYSTEM_BYTES ||
          Buffer.byteLength(userPrompt, 'utf8') > MAX_INPUT_BYTES) {
        throw providerError('The local Qwen prompt is too large.', 'PROMPT_TOO_LARGE');
      }

      const selectedModel = model ?? PROVIDER_MODEL;
      if (typeof selectedModel !== 'string' || !selectedModel.trim()) {
        throw providerError('The selected model name is invalid.', 'INVALID_PROVIDER_INPUT');
      }

      let response;
      try {
        response = await fetchImpl(ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.15,
            max_tokens: 500,
            stream: false
          }),
          signal: AbortSignal.timeout(timeoutMs)
        });
      } catch (error) {
        if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
          throw providerError('The local Qwen provider timed out.', 'PROVIDER_TIMEOUT');
        }
        throw providerError('The local Qwen provider could not be reached on loopback.', 'PROVIDER_UNAVAILABLE');
      }

      if (!response || response.ok !== true) {
        const status = Number.isInteger(response?.status) ? response.status : 0;
        const error = providerError('The local Qwen provider returned HTTP ' + status + '.', 'PROVIDER_HTTP_ERROR');
        error.status = status;
        throw error;
      }

      let result;
      try {
        result = await response.json();
      } catch {
        throw providerError('The local Qwen provider returned invalid JSON.', 'INVALID_PROVIDER_RESPONSE');
      }

      const answer = result?.choices?.[0]?.message?.content;
      if (typeof answer !== 'string' || !answer.trim()) {
        throw providerError('The local Qwen provider returned an empty answer.', 'EMPTY_MODEL_RESPONSE');
      }
      return answer.trim();
    }
  });
}

module.exports = { createLocalQwenProvider };
