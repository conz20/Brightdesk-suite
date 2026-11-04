'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
test('Rust engine is loaded by main with JavaScript fallback',()=>{
 const main=read('src/main.js'), engine=read('src/rust-engine.js');
 assert.match(main,/require\('\.\/rust-engine'\)/);
 assert.match(main,/ipcMain\.handle\('native:engine-info'/);
 assert.match(main,/senderIsMain\(event\)/);
 assert.match(engine,/native\/brightdesk_engine\.node/);
 assert.match(engine,/createJavaScriptFallback/);
});
test('preload exposes native engine information over IPC',()=>{
 assert.match(read('src/preload.js'),/getNativeEngineInfo:\s*\(\)\s*=>\s*ipcRenderer\.invoke\('native:engine-info'\)/);
});
test('product builder includes and unpacks native engine binary',()=>{
 const builder=read('electron-builder.app.config.js');
 assert.match(builder,/native\/brightdesk_engine\.node/);
 assert.match(builder,/asarUnpack:\s*\['native\/brightdesk_engine\.node'\]/);
 assert.ok(fs.existsSync(path.join(root,'rust','Cargo.toml')));
 assert.ok(fs.existsSync(path.join(root,'scripts','build-native.js')));
});
