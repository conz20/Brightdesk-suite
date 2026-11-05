const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { test } = require('node:test');

const root = path.resolve(__dirname, '..');
const products = [
  'Brightdesk-Pages', 'Brightdesk-Sheets', 'Brightdesk-Decks',
  'Brightdesk-Notes', 'Brightdesk-Database', 'Brightdesk-Forms',
  'Brightdesk-Lists', 'Brightdesk-Planner', 'Brightdesk-To-Do',
  'Brightdesk-Workspace'
];

test('nested product Rust targets and native binaries are ignored', () => {
  for (const product of products) {
    for (const generatedPath of [
      `${product}/rust/target/debug/.rustc_info.json`,
      `${product}/native/darwin-arm64/brightdesk_native.node`,
      `${product}/native/darwin-x64/brightdesk_native.node`
    ]) {
      const result = spawnSync('git', ['check-ignore', '--no-index', '--quiet', generatedPath], {
        cwd: root,
        encoding: 'utf8'
      });
      assert.equal(result.status, 0, `Expected generated output to be ignored: ${generatedPath}`);
    }
  }
});
