#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const manifest=path.join(root,'rust','Cargo.toml');
const releaseDir=path.join(root,'rust','target','release');
const nativeNames={win32:'brightdesk_engine.dll',darwin:'libbrightdesk_engine.dylib',linux:'libbrightdesk_engine.so'};
const WINDOWS_GNU_TARGET='x86_64-pc-windows-gnu';

function resolveNativeBuild(hostPlatform,requestedPlatform=''){
  const targetPlatform=requestedPlatform||hostPlatform;
  if(hostPlatform==='darwin'&&targetPlatform==='darwin')return{kind:'mac-universal',platform:'darwin'};
  if(hostPlatform==='linux'&&targetPlatform==='linux')return{kind:'native',platform:'linux',libraryName:nativeNames.linux,cargoTarget:null};
  if(hostPlatform==='win32'&&targetPlatform==='win32')return{kind:'native',platform:'win32',libraryName:nativeNames.win32,cargoTarget:null};
  if(hostPlatform==='linux'&&targetPlatform==='win32')return{kind:'cross',platform:'win32',libraryName:nativeNames.win32,cargoTarget:WINDOWS_GNU_TARGET};
  throw new Error(`Unsupported Brightdesk native build: host ${hostPlatform}, target ${targetPlatform}. macOS universal builds require macOS; Windows GNU cross-builds require the Linux x64 build container.`);
}

function run(command,args,env=process.env){
  const result=spawnSync(command,args,{cwd:root,stdio:'inherit',shell:process.platform==='win32',env});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status??1);
}

function verifyLibraryFormat(file,platform){
  const handle=fs.openSync(file,'r');
  const header=Buffer.alloc(4);
  try{
    const bytesRead=fs.readSync(handle,header,0,header.length,0);
    if(platform==='win32'&&(bytesRead<2||header[0]!==0x4d||header[1]!==0x5a))throw new Error('Windows native addon is not a valid PE image (missing MZ header).');
    if(platform==='linux'&&(bytesRead<4||!header.equals(Buffer.from([0x7f,0x45,0x4c,0x46]))))throw new Error('Linux native addon is not a valid ELF image.');
  }finally{fs.closeSync(handle);}
}

function buildNative(){
  const target=resolveNativeBuild(process.platform,process.env.BRIGHTDESK_NATIVE_TARGET||'');
  const outputDir=path.join(root,'native');
  fs.mkdirSync(outputDir,{recursive:true});
  const destination=path.join(outputDir,'brightdesk_engine.node');
  if(target.kind==='mac-universal'){
    const triples=['aarch64-apple-darwin','x86_64-apple-darwin'];
    run('rustup',['target','add',...triples]);
    const libraries=triples.map(triple=>{
      run('cargo',['build','--manifest-path',manifest,'--workspace','--release','--locked','--target',triple]);
      const library=path.join(root,'rust','target',triple,'release',nativeNames.darwin);
      if(!fs.existsSync(library))throw new Error('Rust did not produce the '+triple+' native library: '+library);
      return library;
    });
    run('xcrun',['lipo','-create',...libraries,'-output',destination]);
  }else{
    const args=['build','--manifest-path',manifest,'--workspace','--release','--locked'];
    let library=path.join(releaseDir,target.libraryName);
    let env=process.env;
    if(target.cargoTarget){
      run('rustup',['target','add',target.cargoTarget]);
      args.push('--target',target.cargoTarget);
      library=path.join(root,'rust','target',target.cargoTarget,'release',target.libraryName);
      env={...process.env,
        CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER:process.env.CARGO_TARGET_X86_64_PC_WINDOWS_GNU_LINKER||'x86_64-w64-mingw32-gcc',
        CARGO_TARGET_X86_64_PC_WINDOWS_GNU_RUSTFLAGS:process.env.CARGO_TARGET_X86_64_PC_WINDOWS_GNU_RUSTFLAGS||'-C target-feature=+crt-static -C link-arg=-static-libgcc'};
    }
    run(process.platform==='win32'?'cargo.exe':'cargo',args,env);
    if(!fs.existsSync(library))throw new Error('Rust did not produce the '+target.platform+' native library: '+library);
    verifyLibraryFormat(library,target.platform);
    fs.copyFileSync(library,destination);
  }
  console.log('Built Brightdesk native Node-API module:',destination);
  return destination;
}

if(require.main===module){
  try{buildNative();}catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={WINDOWS_GNU_TARGET,resolveNativeBuild,verifyLibraryFormat,buildNative};
