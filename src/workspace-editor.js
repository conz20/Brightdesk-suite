(function(){
'use strict';
const $=id=>document.getElementById(id),KEY='brightdesk-workspaces-v1',api=()=>window.BrightdeskWorkspaceService;
let workspaces=[],workspaceId=null,pageId=null,search='';
const current=()=>workspaces.find(w=>w.id===workspaceId)||null;
const page=()=>current()?.pages.find(p=>p.id===pageId)||current()?.pages[0]||null;
const status=m=>{$('workspace-status').textContent=m;};
function save(){try{localStorage.setItem(KEY,JSON.stringify(workspaces));status('Saved on this device');}catch(e){status('Could not save workspace: '+e.message);}}
function load(){try{const data=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(data))workspaces=data.filter(w=>w&&Array.isArray(w.pages)&&w.pages.length);}catch{}if(!workspaces.length)workspaces=[api().createWorkspace({name:'My workspace'})];workspaceId=workspaces[0].id;pageId=workspaces[0].pages[0].id;save();}
function apply(next){const i=workspaces.findIndex(w=>w.id===next.id);if(i>=0)workspaces[i]=next;save();render();}
function button(text,title,action,cls='workspace-small-action'){const b=document.createElement('button');b.type='button';b.textContent=text;b.title=title;b.setAttribute('aria-label',title);b.className=cls;b.addEventListener('click',action);return b;}
function render(){
 let w=current();if(!w){workspaceId=workspaces[0]?.id||null;w=current();}if(!w)return;
 if(!w.pages.some(p=>p.id===pageId))pageId=w.pages[0].id;
 const workList=$('workspace-list');workList.innerHTML='';workspaces.forEach(item=>{const b=document.createElement('button');b.type='button';b.className='workspace-list-item'+(item.id===w.id?' active':'');b.textContent=item.name;b.onclick=()=>{workspaceId=item.id;pageId=item.pages[0].id;search='';$('workspace-page-search').value='';render();};workList.append(b);});
 $('workspace-name-label').textContent=w.name;
 const pages=api().searchPages(w,search),pageList=$('workspace-page-list');pageList.innerHTML='';pages.forEach(p=>{const b=document.createElement('button');b.type='button';b.className='workspace-page-item'+(p.id===pageId?' active':'');b.textContent=p.title;b.onclick=()=>{pageId=p.id;render();};pageList.append(b);});
 const p=page();$('workspace-page-title').textContent=p.title;
 $('workspace-page-search-results').hidden=!search;$('workspace-page-search-results').textContent=search?pages.length+' matching page(s)':'';
 const host=$('workspace-block-list');host.innerHTML='';
 p.blocks.forEach((block,index)=>{
  const card=document.createElement('article');card.className='workspace-block workspace-block-'+block.type;
  const tools=document.createElement('div');tools.className='workspace-block-tools';tools.append(button('↑','Move block up',()=>{try{apply(api().moveBlock(w,p.id,block.id,'up'));}catch(e){status(e.message);}}),button('↓','Move block down',()=>{try{apply(api().moveBlock(w,p.id,block.id,'down'));}catch(e){status(e.message);}}),button('×','Delete block',()=>{if(confirm('Delete this content block?'))apply(api().deleteBlock(w,p.id,block.id));},'workspace-small-action workspace-delete-action'));card.append(tools);
  if(block.type==='divider'){const line=document.createElement('hr');card.append(line);}
  else if(block.type==='checklist'){
   const title=document.createElement('b');title.textContent='Checklist';card.append(title);
   block.items.forEach(item=>{const row=document.createElement('div');row.className='workspace-check-item';const check=document.createElement('input');check.type='checkbox';check.checked=item.checked;check.setAttribute('aria-label','Mark '+item.text+' complete');check.addEventListener('change',()=>apply(api().toggleChecklistItem(w,p.id,block.id,item.id,check.checked)));const input=document.createElement('input');input.type='text';input.value=item.text;input.setAttribute('aria-label','Checklist item');input.className='workspace-check-text'+(item.checked?' completed':'');input.addEventListener('change',()=>{try{apply(api().updateChecklistItem(w,p.id,block.id,item.id,{text:input.value}));}catch(e){status(e.message);}});row.append(check,input,button('×','Remove checklist item',()=>apply(api().deleteChecklistItem(w,p.id,block.id,item.id)),'workspace-small-action workspace-delete-action'));card.append(row);});
   const form=document.createElement('form');form.className='workspace-check-add';const input=document.createElement('input');input.placeholder='Add a checklist item';input.setAttribute('aria-label','New checklist item');input.required=true;const add=document.createElement('button');add.type='submit';add.textContent='Add item';add.className='secondary';form.append(input,add);form.addEventListener('submit',e=>{e.preventDefault();try{apply(api().addChecklistItem(w,p.id,block.id,input.value));}catch(err){status(err.message);}});card.append(form);
  }else{
   const input=document.createElement(block.type==='heading'?'input':'textarea');if(input.tagName==='INPUT')input.type='text';input.value=block.content;input.setAttribute('aria-label',block.type==='heading'?'Heading content':'Text content');input.className='workspace-block-content';if(block.type!=='heading')input.rows=block.type==='callout'?3:2;input.addEventListener('change',()=>{try{apply(api().updateBlock(w,p.id,block.id,{content:input.value}));}catch(e){status(e.message);}});card.append(input);
  }
  host.append(card);
 });
 $('workspace-block-content').hidden=['checklist','divider'].includes($('workspace-block-type').value);
}
$('workspace-create-form').addEventListener('submit',e=>{e.preventDefault();try{const w=api().createWorkspace({name:$('workspace-create-name').value});workspaces.push(w);workspaceId=w.id;pageId=w.pages[0].id;$('workspace-create-form').reset();$('workspace-create-form').hidden=true;save();render();}catch(err){status(err.message);}});
$('workspace-add').addEventListener('click',()=>{$('workspace-create-form').hidden=!$('workspace-create-form').hidden;$('workspace-create-name').focus();});
$('workspace-add-page').addEventListener('click',()=>{const w=current(),title=prompt('Page title','New page');if(title===null)return;try{const next=api().addPage(w,{title});workspaces[workspaces.findIndex(x=>x.id===w.id)]=next;pageId=next.pages[next.pages.length-1].id;save();render();}catch(e){status(e.message);}});
$('workspace-rename-page').addEventListener('click',()=>{const w=current(),p=page(),title=prompt('Page title',p.title);if(title===null)return;try{apply(api().renamePage(w,p.id,title));}catch(e){status(e.message);}});
$('workspace-delete-page').addEventListener('click',()=>{const w=current(),p=page();if(!confirm('Delete the '+p.title+' page and all its content?'))return;try{const next=api().deletePage(w,p.id);pageId=next.pages[0].id;apply(next);}catch(e){status(e.message);}});
$('workspace-rename').addEventListener('click',()=>{const w=current(),name=prompt('Workspace name',w.name);if(name===null)return;try{apply(api().renameWorkspace(w,name));}catch(e){status(e.message);}});
$('workspace-delete').addEventListener('click',()=>{const w=current();if(!confirm('Delete the '+w.name+' workspace and all its pages?'))return;try{workspaces=api().deleteWorkspace(workspaces,w.id);workspaceId=workspaces[0].id;pageId=workspaces[0].pages[0].id;save();render();}catch(e){status(e.message);}});
$('workspace-page-search').addEventListener('input',e=>{search=e.target.value;render();});
$('workspace-block-type').addEventListener('change',()=>{$('workspace-block-content').hidden=['checklist','divider'].includes($('workspace-block-type').value);});
$('workspace-add-block').addEventListener('submit',e=>{e.preventDefault();const w=current(),p=page(),type=$('workspace-block-type').value;try{apply(api().addBlock(w,p.id,{type,content:$('workspace-block-content').value,items:[]}));$('workspace-block-content').value='';}catch(err){status(err.message);}});
window.BrightdeskWorkspaceUI={render};
load();
})();
