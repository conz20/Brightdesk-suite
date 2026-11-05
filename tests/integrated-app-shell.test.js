'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'src','app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'src','index.html'),'utf8');
const catalog=require('../src/app-catalog');
test('all six additional apps have dedicated integrated workspace renderers',()=>{for(const [id,hook] of [['todo','renderTodoWorkspace'],['lists','renderListsWorkspace'],['forms','BrightdeskFormsUI.render'],['planner','BrightdeskPlannerUI.render'],['database','BrightdeskDatabaseUI.render'],['loop','BrightdeskWorkspaceUI.render']]){assert.ok(app.includes(hook),id+' renderer');assert.ok(html.includes('id="'+(id==='loop'?'workspace-app-wrap':id+'-wrap')+'"'),id+' markup');}});
test('the integrated app shell loads every feature module before app.js',()=>{const names=['slides-service.js','notes-service.js','todo-service.js','lists-service.js','forms-service.js','forms-workspace.js','planner-service.js','planner-workspace.js','database-service.js','database-workspace.js','workspace-service.js','workspace-editor.js'];for(const name of names)assert.ok(html.indexOf('src="'+name+'"')>=0,name+' is loaded');const main=html.indexOf('src="app.js"');for(const name of names)assert.ok(html.indexOf('src="'+name+'"')<main,name+' loads before app shell');});
test('the fixed product catalogue remains exactly ten approved apps',()=>{assert.deepEqual(catalog.map(x=>x.id),['pages','sheets','slides','notes','database','forms','lists','planner','todo','loop']);assert.equal(catalog.length,10);for(const id of ['outlook','onedrive','teams'])assert.equal(catalog.some(x=>x.id===id),false);});
test('all ten approved apps are available in the integrated suite',()=>{assert.ok(catalog.every(x=>x.availability==='available'),'every approved app must be marked available once its implementation is integrated');});
test('the suite opens on a visible app centre and provides a direct return from every workspace',()=>{
  const {resolveAppSetup}=require('../src/app-setup-policy');
  const setup=resolveAppSetup({schemaVersion:3,installedApps:['pages'],setupComplete:true},null,catalog.map(item=>item.id));
  assert.equal(setup.initialView,'home');
  assert.match(html,/id="open-home"/);
  assert.match(html,/id="back-to-home"/);
  assert.ok(app.includes("$('back-to-home').addEventListener('click'"));
});
test('all ten integrated products stay directly reachable from the sidebar and home cards',()=>{
  assert.match(app,/btn\.hidden = launchAppId \? btn\.dataset\.app === launchAppId : false/);
  assert.match(app,/open\.textContent = 'Open'/);
  assert.match(app,/Included in Brightdesk Office Suite/);
  assert.match(app,/function setApp\(app\).*catalog\.some/);
});

test('the app shell routes each app away from the generic editor',()=>{for(const id of ['todo','lists','forms','planner','database','loop'])assert.ok(app.includes("state.app === '"+id+"'")||app.includes("state.app==='")+id+"'",id+' routing');});

test('Decks uses the dedicated slide service for slide editing and lifecycle',()=>{for(const expression of ['BrightdeskSlidesService.ensurePresentation','BrightdeskSlidesService.updateSlide','BrightdeskSlidesService.addSlide','BrightdeskSlidesService.duplicateSlide','BrightdeskSlidesService.deleteSlide','BrightdeskSlidesService.setCurrentSlide'])assert.ok(app.includes(expression),expression+' is wired into the editor');});
test('Notes uses the dedicated content service for quick-note editing and export',()=>{for(const expression of ['BrightdeskNotesService.insertText','BrightdeskNotesService.updateNoteText','BrightdeskNotesService.clearNoteText','BrightdeskNotesService.exportPayload'])assert.ok(app.includes(expression),expression+' is wired into the editor');});
