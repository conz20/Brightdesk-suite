(function(){
'use strict';
const $=id=>document.getElementById(id);
let forms=[],selected=null,tab='questions';
try{const saved=JSON.parse(localStorage.getItem('brightdesk-forms-v1')||'[]');if(Array.isArray(saved))forms=saved;}catch{}
const current=()=>forms.find(f=>f.id===selected)||null;
const save=()=>{localStorage.setItem('brightdesk-forms-v1',JSON.stringify(forms));$('forms-status').textContent='Saved on this device';};
const replace=next=>{const i=forms.findIndex(f=>f.id===next.id);if(i>=0)forms[i]=next;save();render();};
function setTab(value){tab=value;document.querySelectorAll('[data-forms-tab]').forEach(b=>b.classList.toggle('active',b.dataset.formsTab===tab));$('forms-questions-panel').hidden=tab!=='questions';$('forms-preview-panel').hidden=tab!=='preview';$('forms-responses-panel').hidden=tab!=='responses';if(tab==='preview')preview();if(tab==='responses')responses();}
function render(){
 if(!selected||!forms.some(f=>f.id===selected))selected=forms[0]?.id||null;
 const side=$('forms-sidebar-items');side.innerHTML='';
 forms.forEach(f=>{const b=document.createElement('button');b.type='button';b.className='forms-side-item'+(f.id===selected?' active':'');b.textContent=f.title;b.onclick=()=>{selected=f.id;render();};side.append(b);});
 const f=current();$('forms-empty').hidden=!!f;$('forms-detail').hidden=!f;
 if(!f){$('forms-title').textContent='Your forms';$('forms-response-count').textContent='0 responses';return;}
 $('forms-title').textContent=f.title;$('forms-description').textContent=f.description||'Build a form and collect responses.';$('forms-response-count').textContent=f.responses.length+' responses';
 $('forms-title-input').value=f.title;$('forms-description-input').value=f.description||'';
 const list=$('forms-question-list');list.innerHTML='';
 f.questions.forEach((q,i)=>{
  const card=document.createElement('form');card.className='forms-question-card';
  const heading=document.createElement('b');heading.textContent='Question '+(i+1);card.append(heading);
  const label=document.createElement('input');label.name='label';label.value=q.label;label.required=true;label.setAttribute('aria-label','Question text');card.append(label);
  const type=document.createElement('select');type.name='type';type.setAttribute('aria-label','Question type');
  [['short-text','Short answer'],['long-text','Long answer'],['choice','Single choice'],['multi-choice','Multiple choice'],['date','Date']].forEach(([v,n])=>{const o=document.createElement('option');o.value=v;o.textContent=n;type.append(o);});type.value=q.type;card.append(type);
  const opts=document.createElement('input');opts.name='options';opts.value=(q.options||[]).join(', ');opts.placeholder='Choices separated by commas';opts.hidden=!['choice','multi-choice'].includes(q.type);opts.setAttribute('aria-label','Answer choices');card.append(opts);
  type.onchange=()=>opts.hidden=!['choice','multi-choice'].includes(type.value);
  const required=document.createElement('label'),check=document.createElement('input');check.type='checkbox';check.name='required';check.checked=q.required;required.append(check,document.createTextNode(' Required'));card.append(required);
  const saveButton=document.createElement('button');saveButton.type='submit';saveButton.className='secondary';saveButton.textContent='Save question';card.append(saveButton);
  const del=document.createElement('button');del.type='button';del.className='forms-delete-button';del.textContent='Delete question';del.onclick=()=>{if(confirm('Delete this question and its saved answers?'))replace(window.BrightdeskFormsService.deleteQuestion(f,q.id));};card.append(del);
  card.onsubmit=e=>{e.preventDefault();try{replace(window.BrightdeskFormsService.updateQuestion(f,q.id,{label:label.value,type:type.value,required:check.checked,options:opts.value.split(',').map(v=>v.trim()).filter(Boolean)}));}catch(err){$('forms-status').textContent=err.message;}};
  list.append(card);
 });
 setTab(tab);
}
function preview(){
 const f=current(),form=$('forms-response-form');form.innerHTML='';if(!f)return;
 if(!f.questions.length){form.textContent='Add a question before previewing this form.';return;}
 f.questions.forEach(q=>{
  const label=document.createElement('label');label.className='forms-preview-field';label.textContent=q.label+(q.required?' *':'');let input;
  if(q.type==='choice'){input=document.createElement('select');const empty=document.createElement('option');empty.value='';empty.textContent='Choose an answer';input.append(empty);q.options.forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;input.append(o);});}
  else if(q.type==='multi-choice'){input=document.createElement('div');input.className='forms-choice-group';q.options.forEach(v=>{const wrap=document.createElement('label'),c=document.createElement('input');c.type='checkbox';c.value=v;c.dataset.questionId=q.id;wrap.append(c,document.createTextNode(v));input.append(wrap);});}
  else{input=document.createElement(q.type==='long-text'?'textarea':'input');if(q.type==='date')input.type='date';}
  if(q.type!=='multi-choice'){input.name=q.id;if(q.required)input.required=true;}label.append(input);form.append(label);
 });
 const submit=document.createElement('button');submit.type='submit';submit.className='primary';submit.textContent='Submit response';form.append(submit);
}
function responses(){
 const f=current(),list=$('forms-response-list');list.innerHTML='';if(!f)return;
 if(!f.responses.length){list.textContent='No responses yet. Open Preview to submit a test response.';return;}
 f.responses.forEach((r,i)=>{const card=document.createElement('article');card.className='forms-response-card';const title=document.createElement('b');title.textContent='Response '+(i+1)+' · '+new Date(r.submittedAt).toLocaleString();card.append(title);
  f.questions.forEach(q=>{const p=document.createElement('p'),v=r.answers[q.id];p.textContent=q.label+': '+(Array.isArray(v)?v.join(', '):v||'—');card.append(p);});
  const del=document.createElement('button');del.type='button';del.className='forms-delete-button';del.textContent='Delete response';del.onclick=()=>{if(confirm('Delete this response?'))replace(window.BrightdeskFormsService.deleteResponse(f,r.id));};card.append(del);list.append(card);
 });
}
$('forms-new-form').addEventListener('submit',e=>{e.preventDefault();try{const f=window.BrightdeskFormsService.createForm({title:$('forms-new-title').value});forms.push(f);selected=f.id;$('forms-new-form').reset();save();render();}catch(err){$('forms-status').textContent=err.message;}});
$('forms-details-form').addEventListener('submit',e=>{e.preventDefault();const f=current();if(!f)return;try{replace(window.BrightdeskFormsService.updateForm(f,{title:$('forms-title-input').value,description:$('forms-description-input').value}));}catch(err){$('forms-status').textContent=err.message;}});
$('forms-add-question-form').addEventListener('submit',e=>{e.preventDefault();const f=current();if(!f)return;try{const type=$('forms-question-type').value;replace(window.BrightdeskFormsService.addQuestion(f,{label:$('forms-question-label').value,type,required:$('forms-question-required').checked,options:$('forms-question-options').value.split(',').map(v=>v.trim()).filter(Boolean)}));$('forms-add-question-form').reset();$('forms-question-options').hidden=true;}catch(err){$('forms-status').textContent=err.message;}});
$('forms-question-type').addEventListener('change',()=>{$('forms-question-options').hidden=!['choice','multi-choice'].includes($('forms-question-type').value);});
$('forms-response-form').addEventListener('submit',e=>{e.preventDefault();const f=current();if(!f)return;const answers={};f.questions.forEach(q=>{answers[q.id]=q.type==='multi-choice'?[...$('forms-response-form').querySelectorAll('[data-question-id="'+q.id+'"]:checked')].map(c=>c.value):$('forms-response-form').elements.namedItem(q.id)?.value||'';});try{replace(window.BrightdeskFormsService.submitResponse(f,answers));setTab('responses');$('forms-status').textContent='Response saved on this device.';}catch(err){$('forms-status').textContent=err.message;}});
document.querySelectorAll('[data-forms-tab]').forEach(b=>b.addEventListener('click',()=>setTab(b.dataset.formsTab)));
window.BrightdeskFormsUI={render};
})();
