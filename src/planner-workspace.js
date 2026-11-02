(function(){
'use strict';
const $=id=>document.getElementById(id);let plans=[],selected=null,query='',progress='',priority='';
try{const data=JSON.parse(localStorage.getItem('brightdesk-planner-v1')||'[]');if(Array.isArray(data))plans=data;}catch{}
const current=()=>plans.find(p=>p.id===selected)||null;
const save=()=>{localStorage.setItem('brightdesk-planner-v1',JSON.stringify(plans));$('planner-status').textContent='Saved on this device';};
const replace=next=>{const i=plans.findIndex(p=>p.id===next.id);if(i>=0)plans[i]=next;save();render();};
function render(){
 if(!selected||!plans.some(p=>p.id===selected))selected=plans[0]?.id||null;
 const side=$('planner-sidebar-items');side.innerHTML='';
 plans.forEach(p=>{const b=document.createElement('button');b.type='button';b.className='planner-side-item'+(p.id===selected?' active':'');b.textContent=p.title;b.onclick=()=>{selected=p.id;render();};side.append(b);});
 const p=current();$('planner-empty').hidden=!!p;$('planner-detail').hidden=!p;if(!p){$('planner-title').textContent='Your plans';return;}
 $('planner-title').textContent=p.title;$('planner-description').textContent=p.description||'Organise work into buckets and tasks.';
 const bucketSelect=$('planner-task-bucket');bucketSelect.innerHTML='';p.buckets.forEach(b=>{const o=document.createElement('option');o.value=b.id;o.textContent=b.name;bucketSelect.append(o);});
 const board=$('planner-board');board.innerHTML='';
 p.buckets.forEach(bucket=>{
  const column=document.createElement('section');column.className='planner-column';
  const head=document.createElement('header'),name=document.createElement('b');name.textContent=bucket.name;const count=p.tasks.filter(t=>t.bucketId===bucket.id).length;const badge=document.createElement('span');badge.textContent=String(count);head.append(name,badge);
  const rename=document.createElement('button');rename.type='button';rename.className='planner-bucket-rename';rename.textContent='Rename';rename.title='Rename bucket';rename.setAttribute('aria-label',`Rename ${bucket.name} bucket`);rename.onclick=()=>{const nextName=prompt('Bucket name',bucket.name);if(nextName===null)return;try{replace(window.BrightdeskPlannerService.renameBucket(p,bucket.id,nextName));}catch(e){$('planner-status').textContent=e.message;}};head.append(rename);
  const remove=document.createElement('button');remove.type='button';remove.className='planner-bucket-delete';remove.textContent='×';remove.title='Delete bucket';remove.onclick=()=>{if(confirm('Delete this bucket and move its tasks to another bucket?')){try{replace(window.BrightdeskPlannerService.deleteBucket(p,bucket.id));}catch(e){$('planner-status').textContent=e.message;}}};head.append(remove);column.append(head);
  const tasks=window.BrightdeskPlannerService.filterTasks(p,{bucketId:bucket.id,query,progress,priority});
  tasks.forEach(task=>{const card=document.createElement('article');card.className='planner-task-card';const title=document.createElement('b');title.textContent=task.title;card.append(title);if(task.description){const d=document.createElement('p');d.textContent=task.description;card.append(d);}const meta=document.createElement('small');meta.textContent=[task.priority+' priority',task.progress.replace('-',' '),task.dueDate?'Due '+task.dueDate:'',task.assignedTo?'Assigned: '+task.assignedTo:''].filter(Boolean).join(' · ');card.append(meta);
   const controls=document.createElement('div');controls.className='planner-task-controls';const bucketMove=document.createElement('select');p.buckets.forEach(bucketOption=>{const option=document.createElement('option');option.value=bucketOption.id;option.textContent='Move to '+bucketOption.name;bucketMove.append(option);});bucketMove.value=task.bucketId;bucketMove.setAttribute('aria-label','Move '+task.title+' to bucket');bucketMove.onchange=()=>{try{replace(window.BrightdeskPlannerService.updateTask(p,task.id,{bucketId:bucketMove.value}));}catch(e){$('planner-status').textContent=e.message;}};controls.append(bucketMove);const state=document.createElement('select');[['not-started','Not started'],['in-progress','In progress'],['completed','Completed']].forEach(([v,n])=>{const o=document.createElement('option');o.value=v;o.textContent=n;state.append(o);});state.value=task.progress;state.setAttribute('aria-label','Task progress');state.onchange=()=>replace(window.BrightdeskPlannerService.updateTask(p,task.id,{progress:state.value}));controls.append(state);
   const edit=document.createElement('button');edit.type='button';edit.textContent='Edit';edit.setAttribute('aria-label','Edit '+task.title);edit.onclick=()=>{
    const existing=card.querySelector('.planner-task-edit');if(existing){existing.hidden=!existing.hidden;return;}
    const form=document.createElement('form');form.className='planner-task-edit';
    const titleInput=document.createElement('input');titleInput.type='text';titleInput.maxLength=160;titleInput.required=true;titleInput.value=task.title;titleInput.setAttribute('aria-label','Task title');
    const descriptionInput=document.createElement('textarea');descriptionInput.value=task.description||'';descriptionInput.placeholder='Description';descriptionInput.setAttribute('aria-label','Task description');
    const bucketInput=document.createElement('select');bucketInput.setAttribute('aria-label','Task bucket');p.buckets.forEach(bucketOption=>{const option=document.createElement('option');option.value=bucketOption.id;option.textContent=bucketOption.name;bucketInput.append(option);});bucketInput.value=task.bucketId;
    const priorityInput=document.createElement('select');priorityInput.setAttribute('aria-label','Task priority');[['low','Low'],['normal','Normal'],['high','High']].forEach(([value,label])=>{const option=document.createElement('option');option.value=value;option.textContent=label;priorityInput.append(option);});priorityInput.value=task.priority;
    const dueInput=document.createElement('input');dueInput.type='date';dueInput.value=task.dueDate||'';dueInput.setAttribute('aria-label','Task due date');
    const assigneeInput=document.createElement('input');assigneeInput.type='text';assigneeInput.maxLength=160;assigneeInput.value=task.assignedTo||'';assigneeInput.placeholder='Assigned to';assigneeInput.setAttribute('aria-label','Task assignee');
    const labelsInput=document.createElement('input');labelsInput.type='text';labelsInput.value=(task.labels||[]).join(', ');labelsInput.placeholder='Labels separated by commas';labelsInput.setAttribute('aria-label','Task labels');
    const saveEdit=document.createElement('button');saveEdit.type='submit';saveEdit.className='primary';saveEdit.textContent='Save changes';
    const cancelEdit=document.createElement('button');cancelEdit.type='button';cancelEdit.className='secondary';cancelEdit.textContent='Cancel';cancelEdit.addEventListener('click',()=>form.remove());
    form.append(titleInput,descriptionInput,bucketInput,priorityInput,dueInput,assigneeInput,labelsInput,saveEdit,cancelEdit);
    form.addEventListener('submit',event=>{event.preventDefault();try{replace(window.BrightdeskPlannerService.updateTask(p,task.id,{title:titleInput.value,description:descriptionInput.value,bucketId:bucketInput.value,priority:priorityInput.value,dueDate:dueInput.value,assignedTo:assigneeInput.value,labels:labelsInput.value.split(',').map(value=>value.trim()).filter(Boolean)}));}catch(error){$('planner-status').textContent=error.message;}});
    card.append(form);titleInput.focus();
  };controls.append(edit);
   const del=document.createElement('button');del.type='button';del.textContent='Delete';del.onclick=()=>{if(confirm('Delete this task?'))replace(window.BrightdeskPlannerService.deleteTask(p,task.id));};controls.append(del);card.append(controls);column.append(card);
  });
  if(!tasks.length){const empty=document.createElement('p');empty.className='planner-column-empty';empty.textContent=query||progress||priority?'No matching tasks':'No tasks yet';column.append(empty);}
  board.append(column);
 });
}
$('planner-new-plan').addEventListener('submit',e=>{e.preventDefault();try{const p=window.BrightdeskPlannerService.createPlan({title:$('planner-new-name').value});plans.push(p);selected=p.id;$('planner-new-plan').reset();save();render();}catch(err){$('planner-status').textContent=err.message;}});
$('planner-rename').addEventListener('click',()=>{const p=current();if(!p)return;const title=prompt('Plan name',p.title);if(title===null)return;try{replace(window.BrightdeskPlannerService.updatePlan(p,{title}));}catch(e){$('planner-status').textContent=e.message;}});
$('planner-new-bucket').addEventListener('submit',e=>{e.preventDefault();const p=current();if(!p)return;try{replace(window.BrightdeskPlannerService.addBucket(p,{name:$('planner-bucket-name').value}));$('planner-new-bucket').reset();}catch(err){$('planner-status').textContent=err.message;}});
$('planner-new-task').addEventListener('submit',e=>{e.preventDefault();const p=current();if(!p)return;try{replace(window.BrightdeskPlannerService.addTask(p,{title:$('planner-task-title').value,description:$('planner-task-description').value,bucketId:$('planner-task-bucket').value,priority:$('planner-task-priority').value,progress:$('planner-task-progress').value,dueDate:$('planner-task-due').value,assignedTo:$('planner-task-assignee').value,labels:$('planner-task-labels').value.split(',').map(value=>value.trim()).filter(Boolean)}));$('planner-new-task').reset();}catch(err){$('planner-status').textContent=err.message;}});
$('planner-search').addEventListener('input',e=>{query=e.target.value;render();});
$('planner-progress-filter').addEventListener('change',e=>{progress=e.target.value;render();});
$('planner-priority-filter').addEventListener('change',e=>{priority=e.target.value;render();});
window.BrightdeskPlannerUI={render};
})();
