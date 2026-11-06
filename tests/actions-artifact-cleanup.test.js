'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  DEFAULT_MIN_AGE_MS,
  isApprovedArtifactName,
  isPrunableArtifact,
  pruneActionsArtifacts
} = require('../scripts/prune-actions-artifacts');

const NOW = Date.parse('2026-11-07T00:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;

function artifact(id, name, ageMs, workflowRunId = 10) {
  return {
    id,
    name,
    created_at: new Date(NOW - ageMs).toISOString(),
    expired: false,
    workflow_run: { id: workflowRunId }
  };
}

test('artifact cleanup only selects old Brightdesk installer bundles', () => {
  assert.equal(DEFAULT_MIN_AGE_MS, DAY);
  assert.equal(isApprovedArtifactName('brightdesk-Linux'), true);
  assert.equal(isApprovedArtifactName('brightdesk-Windows'), true);
  assert.equal(isApprovedArtifactName('brightdesk-macOS'), true);
  assert.equal(isApprovedArtifactName('Brightdesk-0.1.0-Installers'), true);
  assert.equal(isApprovedArtifactName('Brightdesk-1.2.3-beta.1-Installers'), true);
  assert.equal(isApprovedArtifactName('brightdesk-Linux-debug'), false);
  assert.equal(isPrunableArtifact(artifact(1, 'brightdesk-Linux', 2 * DAY), { now: NOW }), true);
  assert.equal(isPrunableArtifact(artifact(2, 'brightdesk-Windows', DAY - 1), { now: NOW }), false);
  assert.equal(isPrunableArtifact(artifact(3, 'brightdesk-macOS', 2 * DAY), { now: NOW }), true);
  assert.equal(isPrunableArtifact(artifact(4, 'Brightdesk-0.1.0-Installers', 2 * DAY), { now: NOW }), true);

  for (const name of [
    'brightdesk-rust-artifacts',
    'brightdesk-quality-report',
    'brightdesk-Linux-debug',
    'Brightdesk-Installers',
    'Other-0.1.0-Installers'
  ]) {
    assert.equal(isPrunableArtifact(artifact(5, name, 2 * DAY), { now: NOW }), false, name);
  }
});

test('artifact cleanup protects the current workflow and malformed timestamps', () => {
  assert.equal(
    isPrunableArtifact(artifact(1, 'brightdesk-macOS', 3 * DAY, '999'), { now: NOW, currentRunId: '999' }),
    false
  );
  assert.equal(
    isPrunableArtifact({ id: 2, name: 'brightdesk-Linux', created_at: 'not-a-date' }, { now: NOW }),
    false
  );
  const { workflow_run: ignoredRun, ...withoutWorkflowRun } = artifact(4, 'brightdesk-Linux', 3 * DAY);
  assert.equal(
    isPrunableArtifact(withoutWorkflowRun, { now: NOW, currentRunId: '999' }),
    false,
    'artifacts without an identifiable source run must be retained'
  );
  assert.equal(
    isPrunableArtifact(artifact(6, 'brightdesk-Linux', 3 * DAY, 10), { now: NOW, currentRunId: '999' }),
    true,
    'old artifacts from a different identified run can be pruned'
  );
  assert.equal(
    isPrunableArtifact({ ...artifact(5, 'brightdesk-Linux', 3 * DAY), expired: true }, { now: NOW }),
    false,
    'already-expired artifacts must not receive a redundant delete request'
  );
  assert.equal(
    isPrunableArtifact({ id: 7, name: 'brightdesk-Linux', created_at: new Date(NOW - 3 * DAY).toISOString() }, { now: NOW }),
    false,
    'artifacts without an explicit non-expired status must be retained'
  );
  assert.equal(
    isPrunableArtifact(artifact(3, 'brightdesk-Linux', 3 * DAY), { now: NOW, minAgeMs: 0 }),
    true
  );
});

test('cleanup paginates before deleting only stale installer artifacts', async () => {
  const pages = {
    1: [
      artifact(11, 'brightdesk-Linux', 3 * DAY),
      artifact(12, 'brightdesk-Windows', DAY / 2)
    ],
    2: [
      artifact(21, 'brightdesk-macOS', 2 * DAY),
      artifact(22, 'brightdesk-Windows', 3 * DAY, 11)
    ]
  };
  const requests = [];
  const deleted = [];
  const fetchImpl = async (url, options = {}) => {
    const parsed = new URL(url);
    requests.push({ url: parsed.toString(), method: options.method || 'GET' });
    if (options.method === 'DELETE') {
      deleted.push(Number(parsed.pathname.split('/').at(-1)));
      return { ok: true, status: 204, json: async () => ({}) };
    }
    if (parsed.pathname.endsWith('/actions/runs/10')) {
      return { ok: true, status: 200, json: async () => ({ path: '.github/workflows/build-release.yml' }) };
    }
    if (parsed.pathname.endsWith('/actions/runs/11')) {
      return { ok: true, status: 200, json: async () => ({ path: '.github/workflows/quality.yml' }) };
    }
    const page = Number(parsed.searchParams.get('page'));
    const artifacts = pages[page] || [];
    return { ok: true, status: 200, json: async () => ({ total_count: 4, artifacts }) };
  };

  const result = await pruneActionsArtifacts({
    repository: 'connormolloy12/Brightdesk-suite',
    token: 'test-token',
    apiUrl: 'https://api.github.com',
    fetchImpl,
    now: NOW,
    currentRunId: '999',
    perPage: 2
  });

  assert.deepEqual(result.deletedArtifacts.map(item => item.id), [11, 21]);
  assert.deepEqual(deleted, [11, 21], 'artifacts from other workflows must not be deleted');
  assert.deepEqual(
    requests.filter(item => item.method === 'GET').map(item => new URL(item.url).searchParams.get('page')),
    ['1', '2']
  );
  assert.ok(requests.every(item => item.url.startsWith('https://api.github.com/repos/')));
});

test('cleanup fails closed without credentials or when GitHub rejects the listing request', async () => {
  await assert.rejects(
    pruneActionsArtifacts({ repository: 'connormolloy12/Brightdesk-suite', token: '', fetchImpl: async () => ({ ok: true }) }),
    /GITHUB_TOKEN is required/
  );

  await assert.rejects(
    pruneActionsArtifacts({
      repository: 'connormolloy12/Brightdesk-suite',
      token: 'test-token',
      fetchImpl: async () => ({ ok: false, status: 403, statusText: 'Forbidden' })
    }),
    /GitHub artifact API returned 403/
  );
});
