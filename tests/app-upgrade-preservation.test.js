'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','src','app.js'),'utf8');
test('loadLocal restores current and previous document storage keys',()=>{
 assert.match(source,/localStorage\.getItem\('brightdesk-docs-v3'\)\s*\|\|\s*localStorage\.getItem\('brightdesk-docs-v2'\)/);
 assert.match(source,/state\.docs\s*=\s*\{\s*\.\.\.clone\(defaults\)\s*,\s*\.\.\.stored\s*\}/);
});
test('loadLocal restores saved installed-product selection',()=>{
 assert.match(source,/localStorage\.getItem\('brightdesk-app-setup-v1'\)/);
 assert.match(source,/state\.installedApps\s*=\s*launchAppId\s*\?\s*\[launchAppId\]\s*:\s*appSetup\.installedApps\.filter/);
});
test('removing a product does not delete its saved document',()=>{
 const start=source.indexOf('function toggleAppInstall(id) {');
 const end=source.indexOf('\nfunction completeAppSetup()',start);
 assert.ok(start>=0&&end>start);
 const handler=source.slice(start,end);
 assert.match(handler,/state\.installedApps\s*=\s*state\.installedApps\.filter/);
 assert.doesNotMatch(handler,/state\.docs\s*=|delete\s+state\.docs|localStorage\.removeItem/);
});
