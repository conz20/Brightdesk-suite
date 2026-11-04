'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const approved=['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop'];
test('main and preload accept the same ten approved product IDs',()=>{
 const mainIds=read('src/main.js').match(/supportedApplications\s*=\s*new Set\(\[([^\]]+)\]\)/)?.[1];
 const preloadIds=read('src/preload.js').match(/supportedApps\s*=\s*new Set\(\[([^\]]+)\]\)/)?.[1];
 const parse=s=>[...s.matchAll(/'([^']+)'/g)].map(m=>m[1]);
 assert.ok(mainIds); assert.ok(preloadIds);
 assert.deepEqual(parse(mainIds),approved);
 assert.deepEqual(parse(preloadIds),approved);
});
test('product launch ID passes from main through preload to renderer',()=>{
 assert.match(read('src/main.js'),/--brightdesk-app=\$\{applicationId\}/);
 assert.match(read('src/preload.js'),/--brightdesk-app=/);
 assert.match(read('src/app.js'),/window\.brightdesk\.launchAppId/);
});
