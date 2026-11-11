'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {PLATFORMS,PRODUCTS}=require('../scripts/verify-product-installers');
const {assembleCompleteReleaseBundle}=require('../scripts/assemble-complete-release-bundle');

function write(root,relative,value='fixture'){
 const file=path.join(root,relative);
 fs.mkdirSync(path.dirname(file),{recursive:true});
 fs.writeFileSync(file,value);
}

test('verified bundle copies only collected platform folders and lock metadata',()=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'brightdesk-release-assemble-'));
 try{
  const source=path.join(temporary,'release');
  write(source,'build-metadata/package-lock.json','{}');
  for(const platform of Object.keys(PLATFORMS)){
   const label=PLATFORMS[platform].directory;
   write(source,label+'/installer-fixture.bin');
   for(const productId of Object.keys(PRODUCTS))write(source,'apps/'+label+'/'+productId+'/installer-fixture.bin');
  }
  write(source,'win-unpacked/debug.exe','not for release');
  write(source,'apps/pages/mac-unpacked/debug.app','not for release');
  const result=assembleCompleteReleaseBundle({sourceDir:source});
  assert.equal(result.platformCount,3);
  assert.equal(result.productCount,10);
  assert.ok(fs.existsSync(path.join(result.destinationDir,'Windows','installer-fixture.bin')));
  assert.ok(fs.existsSync(path.join(result.destinationDir,'apps','Linux','pages','installer-fixture.bin')));
  assert.ok(fs.existsSync(path.join(result.destinationDir,'build-metadata','package-lock.json')));
  assert.equal(fs.existsSync(path.join(result.destinationDir,'win-unpacked')),false);
  assert.equal(fs.existsSync(path.join(result.destinationDir,'apps','pages')),false);
 }finally{fs.rmSync(temporary,{recursive:true,force:true});}
});

test('verified bundle refuses symbolic links in collected platform folders',()=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'brightdesk-release-symlink-'));
 try{
  const source=path.join(temporary,'release');
  write(source,'build-metadata/package-lock.json','{}');
  for(const platform of Object.keys(PLATFORMS)){
   const label=PLATFORMS[platform].directory;
   fs.mkdirSync(path.join(source,label),{recursive:true});
   fs.mkdirSync(path.join(source,'apps',label),{recursive:true});
   for(const productId of Object.keys(PRODUCTS))fs.mkdirSync(path.join(source,'apps',label,productId),{recursive:true});
  }
  write(source,'outside.txt','outside');
  fs.symlinkSync(path.join(source,'outside.txt'),path.join(source,'Windows','unsafe-link'));
  assert.throws(()=>assembleCompleteReleaseBundle({sourceDir:source}),/symbolic link/);
 }finally{fs.rmSync(temporary,{recursive:true,force:true});}
});
