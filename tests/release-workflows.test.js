'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const macRunner=/runs-on:\s*\[self-hosted, macOS, ARM64\]/;

test('Dependabot checks npm dependencies and GitHub Actions weekly',()=>{
 const workflow=read('.github/dependabot.yml');
 assert.match(workflow,/package-ecosystem: npm/);
 assert.match(workflow,/package-ecosystem: github-actions/);
 assert.equal((workflow.match(/interval: weekly/g)||[]).length,2);
});

test('quality, CI, Rust and README workflows use the existing private Mac runner',()=>{
 for(const file of ['.github/workflows/ci.yml','.github/workflows/quality.yml','.github/workflows/rust-engine.yml','.github/workflows/readme-freshness.yml']){
  const workflow=read(file);
  assert.match(workflow,macRunner,file+' must use the Mac runner');
  assert.doesNotMatch(workflow,/ubuntu-latest|windows-latest|macos-latest/);
 }
});

test('quality workflow verifies the committed lock and full release readiness',()=>{
 const workflow=read('.github/workflows/quality.yml');
 assert.match(workflow,/pull_request:\s*\n\s*branches: \[main\]/);
 assert.match(workflow,/schedule:/);
 assert.match(workflow,/node-version: 24\.22\.2/);
 for(const command of ['npm run check:node','npm run lock:verify','npm ci --no-audit --no-fund','npm run verify:licenses','npm test','npm run release:preflight','npm audit --audit-level=high']){
  assert.ok(workflow.includes(command),'quality gate includes '+command);
 }
 assert.ok(workflow.indexOf('npm run lock:verify')<workflow.indexOf('npm ci --no-audit --no-fund'));
 assert.doesNotMatch(workflow,/npm run lock:prepare/);
});

test('manual release workflow builds all platforms from the one Mac runner and keeps publication off by default',()=>{
 const workflow=read('.github/workflows/build-release.yml');
 assert.match(workflow,/\non:\s*\n\s*workflow_dispatch:/);
 assert.match(workflow,/publish_release:[\s\S]*?default: false/);
 assert.match(workflow,macRunner);
 assert.doesNotMatch(workflow,/ubuntu-latest|windows-latest|macos-latest|actions\/(?:upload|download)-artifact/);
 for(const command of ['npm run lock:verify','npm ci --no-audit --no-fund','cargo fmt --manifest-path rust/Cargo.toml','cargo clippy --manifest-path rust/Cargo.toml','cargo test --manifest-path rust/Cargo.toml','npm test','npm run release:preflight','npm audit --audit-level=high','npm run dist:mac','npm run dist:products:mac','npm run release:cross-platform','npm run release:assemble','npm run release:verify:complete -- release/verified-bundle']){
  assert.ok(workflow.includes(command),'release workflow includes '+command);
 }
 assert.match(workflow,/inputs\.publish_release == true && github\.ref == 'refs\/heads\/main'/);
 assert.match(workflow,/softprops\/action-gh-release@[0-9a-f]{40}/);
 assert.match(workflow,/files: release\/verified-bundle\/\*\*\/\*/);
});

test('cross-build image and toolchain versions are pinned',()=>{
 const dockerfile=read('tools/release-cross-build/Dockerfile');
 assert.match(dockerfile,/^FROM --platform=linux\/amd64 electronuserland\/builder:24-wine-chrome@sha256:[0-9a-f]{64}/);
 assert.match(dockerfile,/ARG NODE_VERSION=24\.22\.2/);
 assert.match(dockerfile,/ARG RUST_VERSION=1\.99\.1/);
 assert.match(dockerfile,/gcc-mingw-w64-x86-64/);
 assert.match(dockerfile,/x86_64-pc-windows-gnu/);
 assert.match(dockerfile,/x86_64-w64-mingw32-gcc/);
});

test('cross-build scripts use isolated Colima volumes and verify both container platforms',()=>{
 const outer=read('scripts/run-cross-platform-installer-builds.sh');
 const inner=read('scripts/build-cross-platform-installers.sh');
 assert.match(outer,/brew install "\$formula"/);
 assert.match(outer,/colima start --profile "\$PROFILE" --arch x86_64 --vm-type qemu/);
 assert.match(outer,/docker --context "\$CONTEXT" build/);
 assert.match(outer,/brightdesk-cross-node-modules/);
 assert.match(outer,/brightdesk-cross-electron-cache/);
 assert.doesNotMatch(outer,/Docker Desktop/i);
 for(const command of ['npm run dist:linux','npm run release:verify:linux','npm run dist:products:linux','npm run release:verify:products:linux','npm run release:collect:linux','BRIGHTDESK_NATIVE_TARGET=win32 npm run dist:win','npm run release:verify:win','npm run dist:products:win','npm run release:verify:products:win','npm run release:collect:win']){
  assert.ok(inner.includes(command),'cross builder includes '+command);
 }
 assert.match(inner,/xvfb-run -a wineboot --init/);
 assert.match(inner,/native Windows OS acceptance remains separate/);
});

test('native target regression suite covers target selection and binary headers',()=>{
 const tests=read('tests/native-build-target.test.js');
 for(const item of ["resolveNativeBuild('darwin')","resolveNativeBuild('linux')","resolveNativeBuild('win32')","resolveNativeBuild('linux','win32')","WINDOWS_GNU_TARGET","valid PE image","valid ELF image"]){
  assert.ok(tests.includes(item),'native regression coverage includes '+item);
 }
});

test('PR installer workflow uses the Mac runner and checks the complete bundle',()=>{
 const workflow=read('.github/workflows/verify-macos-installer.yml');
 assert.match(workflow,macRunner);
 assert.match(workflow,/release:cross-platform/);
 assert.match(workflow,/release:assemble/);
 assert.match(workflow,/release:verify:complete -- release\/verified-bundle/);
 assert.match(workflow,/if: github\.event\.pull_request\.head\.repo\.full_name == github\.repository/);
 assert.doesNotMatch(workflow,/ubuntu-latest|windows-latest|macos-latest|actions\/(?:upload|download)-artifact|publish_release/);
 for(const p of ['scripts/build-native.js','scripts/run-cross-platform-installer-builds.sh','scripts/build-cross-platform-installers.sh','tools/release-cross-build/Dockerfile','tests/native-build-target.test.js']){
  assert.ok(workflow.includes(p),'PR installer check watches '+p);
 }
});

test('manual Pages deployment reuses the private Mac runner and is never automatic',()=>{
 const workflow=read('.github/workflows/deploy.yml');
 assert.match(workflow,/workflow_dispatch:/);
 assert.match(workflow,macRunner);
 assert.doesNotMatch(workflow,/push:|pull_request:|ubuntu-latest|windows-latest|macos-latest/);
});

test('all third-party workflow actions are pinned to full commit SHAs',()=>{
 const directory=path.join(root,'.github','workflows');
 for(const file of fs.readdirSync(directory).filter(file=>file.endsWith('.yml'))){
  for(const line of read('.github/workflows/'+file).split(/\r?\n/)){
   const match=/^\s*uses:\s*([^\s#]+)/.exec(line);
   if(!match||match[1].startsWith('./'))continue;
   assert.match(match[1],/@[0-9a-f]{40}$/ ,file+' must pin '+match[1]);
  }
 }
});

test('release product scripts preserve platform-specific verification and disable implicit publishing',()=>{
 const manifest=JSON.parse(read('package.json'));
 for(const platform of ['win','mac','linux']){
  assert.equal(manifest.scripts['dist:products:'+platform],'node scripts/build-apps.js '+platform);
  assert.equal(manifest.scripts['release:verify:products:'+platform],'node scripts/verify-product-installers.js '+platform+' release/apps');
  assert.equal(manifest.scripts['release:collect:'+platform],'node scripts/collect-platform-build.js '+platform);
 }
 for(const name of ['dist','dist:win','dist:mac','dist:linux','release'])assert.match(manifest.scripts[name],/--publish never$/);
 assert.equal(manifest.scripts['release:cross-platform'],'bash scripts/run-cross-platform-installer-builds.sh');
});

test('README freshness uses the private runner, fork guard and Bash 3.2-compatible loop',()=>{
 const workflow=read('.github/workflows/readme-freshness.yml');
 assert.match(workflow,/if:\s*github\.event_name != 'pull_request' \|\| github\.event\.pull_request\.head\.repo\.full_name == github\.repository/);
 assert.match(workflow,/while IFS= read -r file; do/);
 assert.doesNotMatch(workflow,/\bmapfile\b/);
});
