'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { selectBrightdeskArtifacts, cleanupArtifacts } = require('../scripts/cleanup-actions-artifacts');

test('artifact cleanup selects only active Brightdesk build artifacts', () => {
  const selected = selectBrightdeskArtifacts([
    { id: 1, name: 'Brightdesk-Product-Repositories-0.1.0', expired: false },
    { id: 2, name: 'brightdesk-Linux', expired: false },
    { id: 3, name: 'Other-Project-Build', expired: false },
    { id: 4, name: 'Brightdesk-old', expired: true },
    { id: 'not-a-number', name: 'Brightdesk-invalid', expired: false }
  ]);
  assert.deepEqual(selected.map(item => item.id), [1, 2]);
});

test('artifact cleanup deletes only matching artifacts in the current repository', async () => {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url, method: options.method || 'GET', headers: options.headers });
    if ((options.method || 'GET') === 'DELETE') return { ok: true, status: 204 };
    return {
      ok: true,
      status: 200,
      json: async () => ({
        artifacts: [
          { id: 11, name: 'Brightdesk-0.1.0-Linux', expired: false },
          { id: 12, name: 'Other-Project-Build', expired: false }
        ]
      })
    };
  };
  const result = await cleanupArtifacts({
    repository: 'connormolloy12/Brightdesk-suite',
    token: 'test-token',
    fetchImpl,
    log: () => {}
  });
  assert.deepEqual(result, { listed: 2, deleted: 1 });
  assert.equal(requests.filter(item => item.method === 'DELETE').length, 1);
  assert.match(requests.find(item => item.method === 'DELETE').url, /\/actions\/artifacts\/11$/);
  assert.equal(requests[0].headers.Authorization, 'Bearer test-token');
});
