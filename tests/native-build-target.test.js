'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {resolveNativeBuild,verifyLibraryFormat,WINDOWS_GNU_TARGET}=require('../scripts/build-native');

test('native build keeps the macOS universal strategy',()=>{assert.deepEqual(resolveNativeBuild('darwin'),{kind:'mac-universal',platform:'darwin'});});
test('native Linux and Windows builds use their own host toolchains',()=>{
 assert.deepEqual(resolveNativeBuild('linux'),{kind:'native',platform:'linux',libraryName:'libbrightdesk_engine.so',cargoTarget:null});
 assert.deepEqual(resolveNativeBuild('win32'),{kind:'native',platform:'win32',libraryName:'brightdesk_engine.dll',cargoTarget:null});
});
test('Windows package cross-build on Linux selects the explicit GNU target',()=>{
 assert.deepEqual(resolveNativeBuild('linux','win32'),{kind:'cross',platform:'win32',libraryName:'brightdesk_engine.dll',cargoTarget:WINDOWS_GNU_TARGET});
});
test('unsupported host and target combinations fail closed',()=>{
 assert.throws(()=>resolveNativeBuild('darwin','win32'),/Windows GNU cross-builds require the Linux x64 build container/);
 assert.throws(()=>resolveNativeBuild('linux','darwin'),/macOS universal builds require macOS/);
 assert.throws(()=>resolveNativeBuild('freebsd'),/Unsupported Brightdesk native build/);
});
test('native library format verification rejects invalid PE and ELF files',()=>{
 const directory=fs.mkdtempSync(path.join(os.tmpdir(),'brightdesk-native-header-'));
 const file=path.join(directory,'fixture.node');
 try{
  fs.writeFileSync(file,Buffer.from([0x7f,0x45,0x4c,0x46]));
  assert.throws(()=>verifyLibraryFormat(file,'win32'),/valid PE image/);
  fs.writeFileSync(file,Buffer.from([0x4d,0x5a,0x90,0x00]));
  assert.doesNotThrow(()=>verifyLibraryFormat(file,'win32'));
  assert.throws(()=>verifyLibraryFormat(file,'linux'),/valid ELF image/);
  fs.writeFileSync(file,Buffer.from([0x7f,0x45,0x4c,0x46]));
  assert.doesNotThrow(()=>verifyLibraryFormat(file,'linux'));
 }finally{fs.rmSync(directory,{recursive:true,force:true});}
});
