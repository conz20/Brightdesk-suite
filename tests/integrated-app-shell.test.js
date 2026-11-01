'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'src','app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'src','index.html'),'utf8');
const catalog=require('../src/app-catalog');
const english=require('../src/languages/en-AU.json').translations;
test('all six additional apps have dedicated integrated workspace renderers',()=>{for(const [id,hook] of [['todo','renderTodoWorkspace'],['lists','renderListsWorkspace'],['forms','BrightdeskFormsUI.render'],['planner','BrightdeskPlannerUI.render'],['database','BrightdeskDatabaseUI.render'],['loop','BrightdeskWorkspaceUI.render']]){assert.ok(app.includes(hook),id+' renderer');assert.ok(html.includes('id="'+(id==='loop'?'workspace-app-wrap':id+'-wrap')+'"'),id+' markup');}});
test('the integrated app shell loads every feature module before app.js',()=>{const names=['todo-service.js','lists-service.js','forms-service.js','forms-workspace.js','planner-service.js','planner-workspace.js','database-service.js','database-workspace.js','workspace-service.js','workspace-editor.js'];for(const name of names)assert.ok(html.indexOf('src="'+name+'"')>=0,name+' is loaded');const main=html.indexOf('src="app.js"');for(const name of names)assert.ok(html.indexOf('src="'+name+'"')<main,name+' loads before app shell');});
test('the fixed product catalogue remains exactly ten approved apps',()=>{assert.deepEqual(catalog.map(x=>x.id),['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop']);assert.equal(catalog.length,10);for(const id of ['outlook','onedrive','teams'])assert.equal(catalog.some(x=>x.id===id),false);});
test('all ten approved apps are available in the integrated suite',()=>{assert.ok(catalog.every(x=>x.availability==='available'),'every approved app must be marked available once its implementation is integrated');});
test('the app shell routes each app away from the generic editor',()=>{for(const id of ['todo','lists','forms','planner','database','loop'])assert.ok(app.includes("state.app === '"+id+"'")||app.includes("state.app==='")+id+"'",id+' routing');});

test('product navigation follows the saved installation selection',()=>{
  const match=app.match(/function installedApp\(id\) \{[^}]*\}/);
  assert.ok(match,'installedApp helper exists');
  const isInstalled=vm.runInNewContext(match[0]+'; installedApp',{state:{installedApps:['pages','lists']}});
  assert.equal(isInstalled('pages'),true);
  assert.equal(isInstalled('lists'),true);
  for(const id of ['todo','forms','planner','database','loop']) assert.equal(isInstalled(id),false, id+' should follow saved selection');
});


test('product centre uses approved Brightdesk desktop wording',()=>{
  assert.equal(english['manager.eyebrow'],'BRIGHTDESK PRODUCT CENTRE');
  assert.equal(english['manager.chooseTitle'],'Choose the products you need');
  assert.equal(english['manager.manageTitle'],'Manage your products');
  assert.equal(english['manager.installSelected'],'Add selected products');
  assert.equal(english['sidebar.getApps'],'Get products');
  assert.ok(app.includes("downloadButton.textContent = 'Download desktop version'"));
  assert.ok(app.includes('Open the verified Brightdesk desktop installer for this operating system.'));
  assert.doesNotMatch(app,/Download standalone|standalone installer/i);
  assert.doesNotMatch(html,/YOUR APPS|Get apps|Desktop app|Back to apps/i);
  assert.doesNotMatch(app,/Keep at least one app installed|Choose at least one app to install|Desktop app ·/i);
});
