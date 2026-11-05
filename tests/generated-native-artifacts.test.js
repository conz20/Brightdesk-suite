'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

test('the Suite does not track generated Rust targets or compiled native addons', () => {
  const result = spawnSync('git', ['ls-files', '-z'], {
    cwd: root,
    encoding: 'utf8'
  });

  assert.equal(result.status, 0, result.stderr || 'git ls-files must complete successfully');

  const tracked = result.stdout
    .split('\0')
    .filter(Boolean)
    .filter(file => /(?:^|\/)rust\/target\//.test(file) || file.endsWith('.node'));

  assert.deepEqual(
    tracked,
    [],
    'compiled Rust target output and Node-API binaries must be built locally, not committed'
  );
});
