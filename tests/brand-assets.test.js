'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const catalog=require('../src/app-catalog');
test('all ten approved products have original SVG artwork',()=>{
 assert.equal(catalog.length,10);
 for(const item of catalog){
  const artwork=path.join(__dirname,'..','src','assets','apps',item.id+'.svg');
  assert.ok(fs.existsSync(artwork),item.id+' artwork exists');
  assert.ok(fs.statSync(artwork).size>0,item.id+' artwork is not empty');
 }
});
