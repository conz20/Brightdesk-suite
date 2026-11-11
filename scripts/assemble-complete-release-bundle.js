#!/usr/bin/env node
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const {PLATFORMS,PRODUCTS}=require('./verify-product-installers');

function copyVerifiedTree(source,destination,label){
  let stat;
  try{stat=fs.lstatSync(source);}catch{throw new Error('Missing '+label+': '+source);}
  if(!stat.isDirectory()||stat.isSymbolicLink())throw new Error(label+' must be a real directory: '+source);
  fs.mkdirSync(destination,{recursive:true});
  for(const entry of fs.readdirSync(source,{withFileTypes:true})){
    const from=path.join(source,entry.name);
    const to=path.join(destination,entry.name);
    const child=fs.lstatSync(from);
    if(child.isSymbolicLink())throw new Error('Refusing to copy a symbolic link from '+label+': '+from);
    if(child.isDirectory())copyVerifiedTree(from,to,label);
    else if(child.isFile())fs.copyFileSync(from,to,fs.constants.COPYFILE_EXCL);
    else throw new Error('Refusing to copy a non-regular release entry: '+from);
  }
}

function assembleCompleteReleaseBundle(options={}){
  const sourceDir=path.resolve(options.sourceDir||path.join(__dirname,'..','release'));
  const destinationDir=path.resolve(options.destinationDir||path.join(sourceDir,'verified-bundle'));
  if(path.dirname(destinationDir)!==sourceDir||path.basename(destinationDir)!=='verified-bundle'){
    throw new Error('The verified bundle destination must be the direct release/verified-bundle child.');
  }
  if(sourceDir===destinationDir)throw new Error('The verified bundle cannot replace the release staging directory.');
  const metadataLock=path.join(sourceDir,'build-metadata','package-lock.json');
  const lockStat=fs.lstatSync(metadataLock);
  if(!lockStat.isFile()||lockStat.isSymbolicLink()||lockStat.size===0){
    throw new Error('The exact committed package-lock.json is required in release/build-metadata.');
  }
  if(fs.existsSync(destinationDir)){
    const existing=fs.lstatSync(destinationDir);
    if(existing.isSymbolicLink()||!existing.isDirectory())throw new Error('Refusing to replace an unsafe verified-bundle destination.');
    fs.rmSync(destinationDir,{recursive:true,force:true});
  }
  fs.mkdirSync(destinationDir,{recursive:true});
  for(const platform of Object.keys(PLATFORMS)){
    const label=PLATFORMS[platform].directory;
    copyVerifiedTree(path.join(sourceDir,label),path.join(destinationDir,label),label+' verified installer folder');
    copyVerifiedTree(path.join(sourceDir,'apps',label),path.join(destinationDir,'apps',label),label+' verified product installer folder');
  }
  copyVerifiedTree(path.join(sourceDir,'build-metadata'),path.join(destinationDir,'build-metadata'),'release metadata folder');
  return {sourceDir,destinationDir,platformCount:Object.keys(PLATFORMS).length,productCount:Object.keys(PRODUCTS).length};
}

if(require.main===module){
  try{
    const result=assembleCompleteReleaseBundle({sourceDir:process.argv[2]||path.join(__dirname,'..','release'),destinationDir:process.argv[3]||undefined});
    console.log('Assembled verified release inputs for '+result.platformCount+' platforms and '+result.productCount+' products.');
    console.log('Verified-bundle staging directory: '+result.destinationDir);
  }catch(error){console.error(error.message);process.exitCode=1;}
}
module.exports={copyVerifiedTree,assembleCompleteReleaseBundle};
