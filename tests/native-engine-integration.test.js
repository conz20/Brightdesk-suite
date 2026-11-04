'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('Rust engine wrapper supports a JavaScript fallback when the optional native module is absent',()=>{
 const main=read('src/main.js');
 const engine=read('src/rust-engine.js');
 assert.match(main,/require\('\.\/rust-engine'\)/);
 assert.match(main,/ipcMain\.handle\('native:engine-info'/);
 assert.match(main,/senderIsMain\(event\)/);
 assert.match(engine,/path\.resolve\(__dirname, '\.\.', 'native', 'brightdesk_engine\.node'\)/);
 assert.match(engine,/createJavaScriptFallback/);
 assert.match(engine,/BRIGHTDESK_REQUIRE_NATIVE_ENGINE/);
});

test('product installers do not build the optional Node-API bridge by default',()=>{
 const generator=read('scripts/create-app-repository-seeds.js');
 assert.match(generator,/Rust core is checked and tested/);
 assert.doesNotMatch(generator,/npm run build:native && node scripts\/build-app\.js/);
});
