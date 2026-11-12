'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { removeRunnerWorkspace } = require('../scripts/cleanup-runner-workspace');

test('removes the job checkout but preserves the runner work root and sibling workspaces', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-runner-cleanup-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const runnerWorkspace = path.join(root, '_work');
  const workspace = path.join(runnerWorkspace, 'Brightdesk-suite', 'Brightdesk-suite');
  const sibling = path.join(runnerWorkspace, 'another-repository', 'another-repository');
  fs.mkdirSync(path.join(workspace, '.git'), { recursive: true });
  fs.mkdirSync(sibling, { recursive: true });
  fs.writeFileSync(path.join(workspace, 'source.js'), 'source');
  fs.writeFileSync(path.join(sibling, 'keep.txt'), 'keep');

  const result = removeRunnerWorkspace({ workspace, runnerWorkspace });

  assert.equal(result.removed, true);
  assert.equal(fs.existsSync(workspace), false);
  assert.equal(fs.readFileSync(path.join(sibling, 'keep.txt'), 'utf8'), 'keep');
  assert.equal(fs.existsSync(runnerWorkspace), true);
});

test('refuses to remove the runner work root itself', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-runner-cleanup-root-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.throws(
    () => removeRunnerWorkspace({ workspace: root, runnerWorkspace: root }),
    /must be a child/
  );
  assert.equal(fs.existsSync(root), true);
});

test('refuses a checkout path outside the runner work root', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brightdesk-runner-cleanup-outside-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const runnerWorkspace = path.join(root, '_work');
  const outside = path.join(root, 'important-data');
  fs.mkdirSync(runnerWorkspace, { recursive: true });
  fs.mkdirSync(outside);
  fs.writeFileSync(path.join(outside, 'keep.txt'), 'keep');
  assert.throws(
    () => removeRunnerWorkspace({ workspace: outside, runnerWorkspace }),
    /must be a child/
  );
  assert.equal(fs.readFileSync(path.join(outside, 'keep.txt'), 'utf8'), 'keep');
});

test('rejects filesystem roots and unresolved paths', () => {
  assert.throws(
    () => removeRunnerWorkspace({ workspace: path.parse(process.cwd()).root, runnerWorkspace: path.parse(process.cwd()).root }),
    /must be a child/
  );
  assert.throws(() => removeRunnerWorkspace({ workspace: '', runnerWorkspace: process.cwd() }), /required/);
});
