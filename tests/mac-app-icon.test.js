'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const packageJson = require(path.join(root, 'package.json'));

test('macOS suite packaging uses the original Brightdesk app mark', () => {
  assert.equal(packageJson.build.mac.icon, 'build/icon.icns');
  const iconPath = path.join(root, packageJson.build.mac.icon);
  const icon = fs.readFileSync(iconPath);
  assert.equal(icon.toString('ascii', 0, 4), 'icns');
  assert.ok(icon.length > 1000, 'the configured ICNS must contain rendered icon artwork');
  assert.ok(fs.existsSync(path.join(root, 'src/assets/brand/brightdesk-mark.svg')));
});
