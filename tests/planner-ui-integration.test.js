'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const app=fs.readFileSync(path.join(root,'src','app.js'),'utf8');
const html=fs.readFileSync(path.join(root,'src','index.html'),'utf8');
const css=fs.readFileSync(path.join(root,'src','styles.css'),'utf8');
const plannerWorkspace=fs.readFileSync(path.join(root,'src','planner-workspace.js'),'utf8');
test('Planner has a dedicated board workspace',()=>{assert.match(html,/id="planner-wrap"/);assert.match(html,/id="planner-board"/);assert.ok(html.indexOf('src="planner-service.js"')<html.indexOf('src="app.js"'));assert.ok(html.indexOf('src="planner-workspace.js"')<html.indexOf('src="app.js"'));});
test('Planner is connected to the app shell and its local board renderer',()=>{assert.match(app,/planner: \{ title: 'My plans' \}/);assert.match(app,/window\.BrightdeskPlannerUI\.render\(\)/);assert.match(app,/configs\[app\] \|\| genericConfigs\[app\]/);});
test('Planner exposes bucket, task and filter controls with responsive styling',()=>{assert.match(html,/id="planner-new-bucket"/);assert.match(html,/id="planner-new-task"/);assert.match(html,/id="planner-progress-filter"/);assert.match(html,/id="planner-priority-filter"/);assert.match(html,/aria-live="polite"/);assert.match(css,/\.planner-app\{/);assert.match(css,/@media\(max-width:760px\)\{\.planner-app/);});

test('Planner exposes a rename action for each bucket',()=>{assert.ok(plannerWorkspace.includes('BrightdeskPlannerService.renameBucket'),'rename uses the validated service');assert.ok(plannerWorkspace.includes("textContent='Rename'"),'rename action is visible');assert.ok(plannerWorkspace.includes("setAttribute('aria-label'"),'rename action has an accessible name');});
test('Planner lets each task move to another bucket',()=>{assert.ok(plannerWorkspace.includes("setAttribute('aria-label','Move '+task.title+' to bucket')"),'task bucket selector has a descriptive label');assert.ok(plannerWorkspace.includes('updateTask(p,task.id,{bucketId:bucketMove.value})'),'task bucket changes use the planner service');});
test('Planner task editor exposes all supported task details',()=>{assert.ok(html.includes('id="planner-task-labels"'),'new tasks can receive labels');assert.ok(plannerWorkspace.includes("className='planner-task-edit'"),'existing tasks have an editable detail form');for(const field of ['titleInput','descriptionInput','bucketInput','priorityInput','dueInput','assigneeInput','labelsInput'])assert.ok(plannerWorkspace.includes(field),field+' is editable');});
