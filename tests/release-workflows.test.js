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

test('cross-platform preflight bootstraps a pinned no-admin container runtime before macOS packaging',()=>{
 const workflow=read('.github/workflows/verify-macos-installer.yml');
 const manifest=JSON.parse(read('package.json'));
 const preflight=read('scripts/check-cross-platform-build-prerequisites.sh');
 const bootstrap=read('scripts/bootstrap-cross-platform-tools.sh');
 const runtime=read('scripts/prepare-cross-platform-runtime.sh');
 const outer=read('scripts/run-cross-platform-installer-builds.sh');
 assert.equal(manifest.scripts['release:cross-platform:preflight'],'bash scripts/check-cross-platform-build-prerequisites.sh');
 const preflightStep=workflow.indexOf('npm run release:cross-platform:preflight');
 const suiteBuild=workflow.indexOf('npm run dist:mac');
 const productBuild=workflow.indexOf('npm run dist:products:mac');
 assert.ok(preflightStep>=0 && preflightStep<suiteBuild && preflightStep<productBuild,'prepare the cross-build runtime before spending time on macOS installers');
 assert.match(preflight,/prepare-cross-platform-runtime\.sh/);
 assert.ok(workflow.includes('"scripts/bootstrap-cross-platform-tools.sh"'));
 assert.ok(workflow.includes('"scripts/check-cross-platform-build-prerequisites.sh"'));
 assert.ok(workflow.includes('"scripts/prepare-cross-platform-runtime.sh"'));
 assert.match(bootstrap,/RUNNER_TEMP/);
 assert.match(bootstrap,/COLIMA_VERSION=0\.10\.3/);
 assert.match(bootstrap,/LIMA_VERSION=2\.3\.0/);
 assert.match(bootstrap,/DOCKER_CLI_VERSION=29\.9\.3/);
 assert.match(bootstrap,/shasum -a 256/);
 assert.match(bootstrap,/SHA256SUMS/);
 assert.doesNotMatch(bootstrap,/brew install|sudo\b/,'bootstrap stays in the runner temporary directory without administrator access');
 assert.match(runtime,/arch: aarch64/);
 assert.match(runtime,/vmType: vz/);
 assert.match(runtime,/binfmt: true/);
 assert.match(runtime,/rosetta: false/);
 assert.ok(runtime.includes('mounts:\n  - location: "$ROOT"\n    writable: true'));
 assert.ok(runtime.includes('Existing dedicated Colima profile is not mounted to this repository workspace'));
 assert.match(outer,/--volume "\$ROOT:\/workspace"/);
 assert.match(runtime,/colima start --profile/);
 assert.match(runtime,/docker info/);
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

test('cross-build uses the user-space Colima VZ runtime with QEMU-backed x86_64 containers',()=>{
 const outer=read('scripts/run-cross-platform-installer-builds.sh');
 const inner=read('scripts/build-cross-platform-installers.sh');
 const runtime=read('scripts/prepare-cross-platform-runtime.sh');
 assert.match(outer,/prepare-cross-platform-runtime\.sh/);
 assert.match(outer,/export COLIMA_HOME="\$TOOLS_ROOT\/colima-home"/);
 assert.match(outer,/export COLIMA_CACHE_HOME="\$TOOLS_ROOT\/colima-cache"/);
 assert.match(outer,/export DOCKER_CONFIG="\$TOOLS_ROOT\/docker-config"/);
 assert.doesNotMatch(outer,/brew install|NONINTERACTIVE|sudo -n true|qemu-system-x86_64|brew shellenv/);
 assert.match(runtime,/colima start --profile/);
 assert.match(runtime,/arch: aarch64/);
 assert.match(runtime,/vmType: vz/);
 assert.match(runtime,/binfmt: true/);
 assert.match(runtime,/rosetta: false/);
 assert.match(outer,/docker --context "\$CONTEXT" build --platform linux\/amd64/);
 assert.match(outer,/docker --context "\$CONTEXT" run --rm --platform linux\/amd64/);
 assert.match(outer,/architecture.*x86_64|x86_64.*architecture/);
 assert.match(outer,/docker context show/);
 assert.match(outer,/Using an existing Docker engine context/);
 assert.match(outer,/brightdesk-cross-node-modules/);
 assert.match(outer,/brightdesk-cross-electron-cache/);
 assert.doesNotMatch(outer,/Docker Desktop/i);
 for(const command of ['npm run dist:linux','npm run release:verify:linux','npm run dist:products:linux','npm run release:verify:products:linux','npm run release:collect:linux','BRIGHTDESK_NATIVE_TARGET=win32 npm run dist:win','npm run release:verify:win','npm run dist:products:win','npm run release:verify:products:win','npm run release:collect:win']){
  assert.ok(inner.includes(command),'cross builder includes '+command);
 }
 assert.match(inner,/xvfb-run -a wineboot --init/);
 assert.match(inner,/native Windows OS acceptance remains separate/);
});

test('Linux lifecycle launches installed packages and AppImages and preserves real Electron userData',()=>{
 const script=read('scripts/test-linux-package-lifecycle.sh');
 assert.match(script,/dpkg --install/);
 assert.match(script,/dpkg --remove/);
 assert.match(script,/export XDG_CONFIG_HOME="\$HOME\/.config"/);
 assert.match(script,/app_name_for_artifact/);
 assert.match(script,/user_data_dir="\$XDG_CONFIG_HOME\/\$app_name"/);
 assert.match(script,/desktop_file=/);
 assert.match(script,/BRIGHTDESK_STARTUP_SMOKE_TEST=1 timeout 90s xvfb-run -a/);
 assert.match(script,/--appimage-extract/);
 assert.doesNotMatch(script,/--appimage-version/);
 assert.match(script,/Preserve real Electron userData/);
 assert.doesNotMatch(script,/\\\$\{/,'Linux lifecycle shell must expand variables rather than escape them');
 assert.match(read('scripts/build-cross-platform-installers.sh'),/test-linux-package-lifecycle\.sh release/);
});test('Windows lifecycle launches installed NSIS packages and preserves real Electron userData through Wine',()=>{
 const script=read('scripts/test-windows-nsis-lifecycle.sh');
 assert.match(script,/wineboot --init/);
 assert.match(script,/find_uninstall_string/);
 assert.match(script,/app_executable="\$install_directory\/\$product_name\.exe"/);
 assert.match(script,/BRIGHTDESK_STARTUP_SMOKE_TEST=1 timeout 90s xvfb-run -a wine/);
 assert.match(script,/user_data_dir="\$APPDATA_UNIX\/\$product_name"/);
 assert.ok(script.includes('Re-running same version to exercise repair/reinstall'));
 assert.match(script,/brightdesk-user-data-preservation/);
 assert.match(script,/not native Windows operating-system certification/);
 assert.doesNotMatch(script,/\\\$\{/,'Windows lifecycle shell must expand variables rather than escape them');
 assert.match(read('scripts/build-cross-platform-installers.sh'),/test-windows-nsis-lifecycle\.sh release/);
});

test('lifecycle sentinels match Electron app-specific userData naming',()=>{
 const main=read('src/main.js');
 const suite=JSON.parse(read('package.json'));
 const productConfig=read('electron-builder.app.config.js');
 assert.match(main,/app\.setName\(packageConfig\.productName \|\| 'Brightdesk'\)/);
 const setNamePosition=main.indexOf("app.setName(packageConfig.productName || 'Brightdesk')");
 const firstUserDataLookupPosition=main.indexOf("app.getPath('userData')");
 assert.ok(setNamePosition>=0 && setNamePosition<firstUserDataLookupPosition,'set the product name before any userData path is resolved');
 assert.match(main,/new DictionaryService\(app\.getPath\('userData'\)\)/);
 assert.equal(suite.build.productName,'Brightdesk Office Suite');
 assert.match(productConfig,/productName: 'Brightdesk ' \+ appName/);
 const linux=read('scripts/test-linux-package-lifecycle.sh');
 const windows=read('scripts/test-windows-nsis-lifecycle.sh');
 assert.match(linux,/user_data_dir="\$XDG_CONFIG_HOME\/\$app_name"/);
 assert.match(windows,/user_data_dir="\$APPDATA_UNIX\/\$product_name"/);
 assert.doesNotMatch(linux,/brightdesk-user-data-\$package_name/);
});

test('cross-platform packaged startup requires the native Rust engine on every target',()=>{
 const main=read('src/main.js');
 assert.match(main,/BRIGHTDESK_REQUIRE_NATIVE_ENGINE/);
 assert.match(main,/engineInfo\.native !== true/);
 assert.match(main,/nodeApiVersion !== 8/);
 const linux=read('scripts/test-linux-package-lifecycle.sh');
 const windows=read('scripts/test-windows-nsis-lifecycle.sh');
 const cross=read('scripts/build-cross-platform-installers.sh');
 assert.match(linux,/BRIGHTDESK_REQUIRE_NATIVE_ENGINE=1 BRIGHTDESK_STARTUP_SMOKE_TEST=1/);
 assert.match(windows,/BRIGHTDESK_REQUIRE_NATIVE_ENGINE=1 BRIGHTDESK_STARTUP_SMOKE_TEST=1/);
 assert.match(cross,/BRIGHTDESK_REQUIRE_NATIVE_ENGINE=1 node --test test\/rust-engine\.test\.mjs test\/embedding-bridge\.test\.mjs/);
 for(const file of ['.github/workflows/verify-macos-installer.yml','.github/workflows/build-release.yml']){
  const workflow=read(file);
  assert.match(workflow,/name: Require and test the native macOS Rust engine/);
  assert.match(workflow,/BRIGHTDESK_REQUIRE_NATIVE_ENGINE: "1"/);
 }
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
 for(const p of ['scripts/build-native.js','scripts/run-cross-platform-installer-builds.sh','scripts/build-cross-platform-installers.sh','scripts/assemble-complete-release-bundle.js','scripts/test-linux-package-lifecycle.sh','scripts/test-windows-nsis-lifecycle.sh','tools/release-cross-build/Dockerfile','tests/native-build-target.test.js','tests/release-bundle-assembly.test.js']){
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

test('Suite and product NSIS installers include the Terms page',()=>{
 const suite=JSON.parse(read('package.json'));
 const products=read('electron-builder.app.config.js');
 assert.equal(suite.build.nsis.license,'TERMS_AND_CONDITIONS.txt');
 assert.match(products,/license: 'TERMS_AND_CONDITIONS\.txt'/);
});

test('Suite and product NSIS uninstallers preserve app data by default',()=>{
 const suite=JSON.parse(read('package.json'));
 const products=read('electron-builder.app.config.js');
 assert.equal(suite.build.nsis.oneClick,false);
 assert.equal(suite.build.nsis.deleteAppDataOnUninstall,false);
 assert.match(products,/oneClick: false/);
 assert.match(products,/deleteAppDataOnUninstall: false/);
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
