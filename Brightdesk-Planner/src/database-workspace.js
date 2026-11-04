(function(){
'use strict';
const $=id=>document.getElementById(id),KEY='brightdesk-database-v1';
let database=null,selectedTable=null,search='',sortBy='',direction='asc';
const service=()=>window.BrightdeskDatabaseService;
const status=message=>{$('database-status').textContent=message;};
function load(){try{const saved=JSON.parse(localStorage.getItem(KEY)||'null');if(saved&&Array.isArray(saved.tables)&&saved.tables.length){database=saved;}}catch{}if(!database)database=service().createDatabase({name:'My database'});selectedTable=database.tables[0].id;save();}
function save(){try{localStorage.setItem(KEY,JSON.stringify(database));status('Saved on this device');}catch(e){status('Could not save database: '+e.message);}}
function current(){return database.tables.find(t=>t.id===selectedTable)||database.tables[0]||null;}
function apply(next){database=next;save();render();}
function makeControl(field,value,editing=false){
 let el;if(field.type==='select'){el=document.createElement('select');const blank=document.createElement('option');blank.value='';blank.textContent='Choose…';el.append(blank);field.options.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;el.append(o);});}
 else if(field.type==='checkbox'){el=document.createElement('input');el.type='checkbox';el.checked=value===true;}
 else{el=document.createElement('input');el.type=field.type==='number'?'number':field.type==='date'?'date':field.type==='email'?'email':field.type==='url'?'url':'text';if(field.type==='number')el.step='any';el.value=value??'';}
 el.setAttribute('aria-label',field.name);if(field.required)el.required=true;if(editing)el.classList.add('database-cell-input');return el;
}
function render(){
 const table=current(),side=$('database-table-list');side.innerHTML='';
 database.tables.forEach(t=>{const b=document.createElement('button');b.type='button';b.className='database-table-item'+(t.id===selectedTable?' active':'');b.textContent=t.name;b.onclick=()=>{selectedTable=t.id;search='';$('database-search').value='';sortBy='';render();};side.append(b);});
 $('database-name').textContent=database.name;$('database-heading')?.replaceChildren();
 if(!table){$('database-grid-wrap').textContent='Create a table to get started.';return;}
 $('database-table-summary').textContent=table.rows.length+' records · '+table.fields.length+' fields';
 const sort=$('database-sort'),old=sort.value;sort.innerHTML='';const none=document.createElement('option');none.value='';none.textContent='Default order';sort.append(none);table.fields.filter(f=>!f.system).forEach(f=>{const o=document.createElement('option');o.value=f.id;o.textContent=f.name;sort.append(o);});sort.value=table.fields.some(f=>f.id===old)?old:'';
 const fieldsList=$('database-fields-list');fieldsList.innerHTML='';table.fields.forEach(f=>{const row=document.createElement('div');row.className='database-field-row';const name=document.createElement('span');name.textContent=f.name;const meta=document.createElement('small');meta.textContent=f.system?'System ID':f.type+(f.required?' · Required':'');row.append(name,meta);if(!f.system){const del=document.createElement('button');del.type='button';del.textContent='Remove';del.className='database-remove';del.onclick=()=>{if(confirm('Remove the '+f.name+' field and its values from every record?')){try{apply(service().deleteField(database,table.id,f.id));}catch(e){status(e.message);}}};row.append(del);}fieldsList.append(row);});
 const recordFields=$('database-record-fields');recordFields.innerHTML='';table.fields.filter(f=>!f.system).forEach(f=>{const label=document.createElement('label');label.className='database-input-label';const title=document.createElement('span');title.textContent=f.name+(f.required?' *':'');const input=makeControl(f,null);input.dataset.fieldId=f.id;label.append(title,input);recordFields.append(label);});
 const wrap=$('database-grid-wrap');wrap.innerHTML='';const results=service().queryRecords(database,table.id,{search,sortBy:sortBy||sort.value,direction});
 if(!table.fields.length){wrap.textContent='Add a field to start building your table.';return;}
 const scroller=document.createElement('div');scroller.className='database-table-scroll';const grid=document.createElement('table');grid.className='database-data-grid';const thead=document.createElement('thead'),hr=document.createElement('tr');
 table.fields.forEach(f=>{const th=document.createElement('th');th.textContent=f.name;hr.append(th);});const actionHead=document.createElement('th');actionHead.textContent='Actions';hr.append(actionHead);thead.append(hr);grid.append(thead);
 const body=document.createElement('tbody');results.forEach(record=>{const tr=document.createElement('tr');table.fields.forEach(f=>{const td=document.createElement('td');if(f.system){td.textContent=record.id;}else{const input=makeControl(f,record.values[f.id],true);input.addEventListener('change',()=>{try{apply(service().updateRecord(database,table.id,record.id,{[f.id]:f.type==='checkbox'?input.checked:input.value}));}catch(e){status(e.message);render();}});td.append(input);}tr.append(td);});const action=document.createElement('td');const del=document.createElement('button');del.type='button';del.className='database-remove';del.textContent='Delete';del.onclick=()=>{if(confirm('Delete this record?'))apply(service().deleteRecord(database,table.id,record.id));};action.append(del);tr.append(action);body.append(tr);});
 if(!results.length){const tr=document.createElement('tr'),td=document.createElement('td');td.colSpan=table.fields.length+1;td.className='database-empty';td.textContent=search?'No matching records.':'No records yet. Add your first record below.';tr.append(td);body.append(tr);}
 grid.append(body);scroller.append(grid);wrap.append(scroller);
}
$('database-new-table').addEventListener('submit',e=>{e.preventDefault();try{const name=$('database-new-table-name').value;const next=service().addTable(database,{name});database=next;selectedTable=database.tables[database.tables.length-1].id;$('database-new-table').reset();save();render();}catch(err){status(err.message);}});
$('database-new-field').addEventListener('submit',e=>{e.preventDefault();const table=current();if(!table)return;try{const type=$('database-field-type').value,opts=$('database-field-options').value.split(',').map(v=>v.trim()).filter(Boolean);apply(service().addField(database,table.id,{name:$('database-field-name').value,type,required:$('database-field-required').checked,options:opts}));$('database-new-field').reset();$('database-field-options').hidden=true;}catch(err){status(err.message);}});
$('database-field-type').addEventListener('change',e=>{$('database-field-options').hidden=e.target.value!=='select';});
$('database-new-record').addEventListener('submit',e=>{e.preventDefault();const table=current();if(!table)return;try{const values={};$('database-record-fields').querySelectorAll('[data-field-id]').forEach(el=>{values[el.dataset.fieldId]=el.type==='checkbox'?el.checked:el.value;});apply(service().addRecord(database,table.id,values));$('database-new-record').reset();}catch(err){status(err.message);}});
$('database-search').addEventListener('input',e=>{search=e.target.value;render();});
$('database-sort').addEventListener('change',e=>{sortBy=e.target.value;render();});
$('database-rename-table').addEventListener('click',()=>{const table=current();if(!table)return;const name=prompt('Table name',table.name);if(name===null)return;try{apply(service().renameTable(database,table.id,name));}catch(e){status(e.message);}});
$('database-delete-table').addEventListener('click',()=>{const table=current();if(!table)return;if(!confirm('Delete the '+table.name+' table and all its records?'))return;try{database=service().deleteTable(database,table.id);selectedTable=database.tables[0].id;save();render();}catch(e){status(e.message);}});
$('database-export').addEventListener('click',()=>{const table=current();if(!table)return;const blob=new Blob([service().toCSV(database,table.id)],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=table.name.replace(/[^a-z0-9_-]+/gi,'-').toLowerCase()+'.csv';document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);status('CSV export prepared.');});
window.BrightdeskDatabaseUI={render};
load();
})();
