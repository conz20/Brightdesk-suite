'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {PRODUCT_REPOSITORIES,PRODUCT_TEST_FILES,createProductRepositorySeeds,repositoryBundleReadme,repositoryReadme,productWorkflow}=require('../scripts/create-app-repository-seeds');
test('generator includes exactly the ten approved products',()=>{
 assert.deepEqual(PRODUCT_REPOSITORIES.map(p=>p.appId),['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop']);
});
test('generated tests include required regression gates and exclude suite-only/network tests',()=>{
 for(const f of ['tests/focus-mode.test.js','tests/app-upgrade-preservation.test.js','tests/product-launch-lock.test.js','tests/native-engine-integration.test.js','tests/nsis-uninstaller-patch.test.js','tests/dependency-security.test.js']) assert.ok(PRODUCT_TEST_FILES.includes(f),f);
 for(const f of ['tests/app-catalog.test.js','tests/dictionary-service-live.test.js','tests/release-workflows.test.js']) assert.ok(!PRODUCT_TEST_FILES.includes(f),f);
 assert.equal(PRODUCT_TEST_FILES.length,38);
 for(const suiteOnly of ['tests/standalone-app-builds.test.js','tests/standalone-rust-packaging.test.js']) assert.ok(!PRODUCT_TEST_FILES.includes(suiteOnly),suiteOnly);
});
test('repository bundle reuses existing remotes and blocks destructive overwrites',()=>{
 const readme=repositoryBundleReadme();
 assert.match(readme,/## Repository folders\n\n- Brightdesk-Pages/);
 assert.match(readme,/## Populate the matching GitHub repository/);
 assert.match(readme,/matching existing repository/);
 assert.match(readme,/Do not create a duplicate repository/);
 assert.match(readme,/never overwrite its source or force-push/);
 assert.match(readme,/open a pull request/);
});
test('generated README states shared source trade-off and product lock',()=>{
 const readme=repositoryReadme(PRODUCT_REPOSITORIES.find(p=>p.appId==='todo'));
 assert.match(readme,/ships the complete shared source/);
 assert.match(readme,/renderer is locked to Brightdesk To Do/);
 assert.match(readme,/Node-API native module remains optional/);
 assert.match(readme,/launchAppId/);
});
test('product workflow runs Rust checks and keeps release publishing manual',()=>{
 const workflow=productWorkflow(PRODUCT_REPOSITORIES.find(p=>p.appId==='loop'));
 assert.match(workflow,/cargo fmt --manifest-path rust\/Cargo\.toml/);
 assert.match(workflow,/cargo clippy --manifest-path rust\/Cargo\.toml/);
 assert.match(workflow,/cargo test --manifest-path rust\/Cargo\.toml/);
 assert.match(workflow,/publish_release:[\s\S]*?default: false/);
});
test('generated manifests use canonical platform artifact names and native hooks',()=>{
 const root=path.resolve(__dirname,'..');
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'brightdesk-seeds-'));
 try{
  createProductRepositorySeeds({rootDir:root,outputDir:output});
  for(const product of PRODUCT_REPOSITORIES){
   const m=JSON.parse(fs.readFileSync(path.join(output,product.repository,'package.json'),'utf8'));
   const slug=product.repository.replace(/^Brightdesk-/,'');
   assert.equal(m.desktopName,'org.brightdesk.'+product.appId+'.desktop');
   assert.equal(m.build.win.artifactName,'Brightdesk-'+slug+'-\${version}-\${arch}.\${ext}');
   assert.equal(m.build.mac.artifactName,'Brightdesk-'+slug+'-\${version}-\${arch}.\${ext}');
   assert.equal(m.build.linux.artifactName,'brightdesk-'+slug.toLowerCase()+'-\${version}-\${arch}.\${ext}');
   assert.equal(m.build.appImage,undefined);
   assert.equal(m.overrides.exceljs.uuid,'^11.1.1');
   assert.equal(m.overrides['app-builder-lib'].minimatch,'^11.0.1');
   assert.equal(m.overrides['archiver@5.3.2']['readdir-glob@^1.1.2']['.'],'^3.0.0');
   assert.equal(m.overrides['archiver@5.3.2']['readdir-glob@^1.1.2'].minimatch,'^11.0.1');
   for(const p of ['win','mac','linux']) assert.ok(!m.scripts['dist:product:'+p].includes('build:native'));
   assert.equal(m.scripts['predist:product:win'],'node scripts/patch-electron-builder-nsis.js');
  }
 }finally{fs.rmSync(output,{recursive:true,force:true});}
});
test('generated product folders retain legal files, Rust sources, native tooling and original artwork',()=>{
 const root=path.resolve(__dirname,'..');
 const output=fs.mkdtempSync(path.join(os.tmpdir(),'brightdesk-seeds-'));
 try{
  createProductRepositorySeeds({rootDir:root,outputDir:output});
  for(const product of PRODUCT_REPOSITORIES){
   const folder=path.join(output,product.repository);
   for(const file of ['LICENSE','TERMS_AND_CONDITIONS.txt','THIRD_PARTY_NOTICES.md','rust/Cargo.toml','src/standalone-downloads.js','scripts/build-native.js','scripts/patch-electron-builder-nsis.js','scripts/verify-standalone-apps.js','.github/workflows/product-installers.yml','assets/brightdesk-product.svg','assets/social-preview.svg']) assert.ok(fs.existsSync(path.join(folder,file)),file);
   const repositoryInfo=fs.readFileSync(path.join(folder,'REPOSITORY_INFO.md'),'utf8');
   assert.match(repositoryInfo,/existing GitHub repository/);
   assert.match(repositoryInfo,/do not overwrite a populated default branch/);
  }
 }finally{fs.rmSync(output,{recursive:true,force:true});}
});
