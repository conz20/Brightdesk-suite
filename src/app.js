const $ = (id) => document.getElementById(id);
const t = (key) => window.BrightdeskI18n.t(key);
const defaults = {
  pages: { title: 'Untitled document', html: '' },
  sheets: { title: 'Untitled spreadsheet', cells: Array.from({ length: 20 }, () => Array(12).fill('')) },
  slides: { title: 'Untitled presentation', slides: [{ title: 'Your presentation title', body: 'Add a subtitle or a few words to introduce your idea.' }], current: 0 },
  notes: { title: 'Untitled note', text: '' },
  todo: { title: 'My tasks', tasks: [] },
  lists: { title: 'My lists', lists: [] },
  forms: { title: 'My forms' },
  planner: { title: 'My plans' },
  database: { title: 'My database' },
  loop: { title: 'My workspace' }
};
const configs = {
  pages: { title: 'Brightdesk Pages', heading: 'Make room for your ideas.', desc: 'Write letters, reports and documents.' },
  sheets: { title: 'Brightdesk Sheets', heading: 'Make numbers make sense.', desc: 'Organise information, use formulas and build tables.' },
  slides: { title: 'Brightdesk Decks', heading: 'Bring your ideas to life.', desc: 'Build a presentation one slide at a time.' },
  notes: { title: 'Brightdesk Notes', heading: 'Catch that thought.', desc: 'Keep quick notes and reminders together.' },
  todo: { title: 'Brightdesk To Do', heading: 'Make time for what matters.', desc: 'Plan your day, keep track of tasks and celebrate what you finish.' },
  lists: { title: 'Brightdesk Lists', heading: 'Track the details that matter.', desc: 'Create structured lists, custom columns and records.' },
  forms: { title: 'Brightdesk Forms', heading: 'Ask. Collect. Understand.', desc: 'Create forms and surveys, then review responses.' },
  planner: { title: 'Brightdesk Planner', heading: 'Turn plans into progress.', desc: 'Organise work into buckets, tasks and priorities.' },
  database: { title: 'Brightdesk Database', heading: 'Give your information structure.', desc: 'Build tables, define fields and manage records on your device.' },
  loop: { title: 'Brightdesk Workspace', heading: 'Bring your work together.', desc: 'Create pages, notes, checklists and project information in one place.' }
};
const genericConfigs = Object.fromEntries((window.BrightdeskAppCatalog || []).filter(item => !['pages','sheets','slides','notes'].includes(item.id)).map(item => [item.id, { title: item.name, heading: item.name, desc: item.description }]));
const fullCatalog = window.BrightdeskAppCatalog || [];
const launchAppId = window.brightdesk.launchAppId || null;
const catalog = fullCatalog;
const installableCatalog = catalog.filter(item => item.availability === 'available');
const state = {
  app: launchAppId || 'pages', view: 'workspace', docs: structuredClone(defaults),
  todoView: 'my-day', todoQuery: '',
  selectedCell: { row: 0, col: 0 }, update: null, ribbonTab: 'home',
  installedApps: [], standaloneApps: [], stagedAppUpdates: [], currentVersion: '0.1.0', setupComplete: false, firstRunSelection: new Set(),
  managerView: localStorage.getItem('brightdesk-manager-view') === 'list' ? 'list' : 'grid',
  slideTheme: 'lavender', focusMode: false, editorZoom: 100, sheetZoom: 100,
  languageCatalog: [], installedLanguagePacks: [], spellCheckerLanguages: [], usesNativeMacSpellChecker: false,
  displayLanguage: 'en-AU', proofingLanguage: 'en-AU',
  installedDictionaries: [], dictionaryCatalogue: [], selectedDictionary: localStorage.getItem('brightdesk-selected-dictionary') || ''
};
const editor = $('editor'), sheetWrap = $('sheet-wrap'), slideWrap = $('slide-wrap'), notesWrap = $('notes-wrap');
const pageLayout = window.BrightdeskPageLayout;

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function activeDoc() { return state.docs[state.app]; }
function setStatus(message) { $('save-status').textContent = message; }
function persist() {
  try { localStorage.setItem('brightdesk-docs-v3', JSON.stringify(state.docs)); setStatus('Saved on this device'); }
  catch (error) { setStatus('Could not save locally'); console.error(error); }
}
function loadLocal() {
  try {
    const stored = JSON.parse(localStorage.getItem('brightdesk-docs-v3') || localStorage.getItem('brightdesk-docs-v2') || 'null');
    if (stored && typeof stored === 'object') state.docs = { ...clone(defaults), ...stored };
    const appSetup = JSON.parse(localStorage.getItem('brightdesk-app-setup-v1') || 'null');
    const legacyAutoSelectedAllApps = appSetup && appSetup.schemaVersion !== 2 &&
      appSetup.setupComplete === true && Array.isArray(appSetup.installedApps) &&
      appSetup.installedApps.length === installableCatalog.length &&
      installableCatalog.every(item => appSetup.installedApps.includes(item.id));
    if (appSetup && Array.isArray(appSetup.installedApps) && !legacyAutoSelectedAllApps) {
      state.installedApps = launchAppId ? [launchAppId] : appSetup.installedApps.filter(id => installableCatalog.some(item => item.id === id));
      state.setupComplete = launchAppId ? true : appSetup.setupComplete === true;
    } else {
      // Fresh installs and legacy builds that silently selected all ten apps
      // return to app selection. Existing documents remain untouched.
      state.installedApps = launchAppId ? [launchAppId] : [];
      state.setupComplete = Boolean(launchAppId);
      if (!launchAppId) state.view = 'manager';
    }
    if (launchAppId) { state.app = launchAppId; state.view = 'workspace'; }
    else if (!state.setupComplete || state.installedApps.length === 0) state.view = 'manager';
    else if (!installedApp(state.app)) state.app = state.installedApps[0] || 'pages';
    state.displayLanguage = localStorage.getItem('brightdesk-display-language') || 'en-AU';
    state.proofingLanguage = localStorage.getItem('brightdesk-proofing-language') || state.displayLanguage;
  } catch (error) { console.warn('Local project or app settings could not be read.', error); state.view = 'manager'; }
}
function saveAppSetup() {
  localStorage.setItem('brightdesk-app-setup-v1', JSON.stringify({ schemaVersion: 2, installedApps: state.installedApps, setupComplete: state.setupComplete }));
}
function installedApp(id) { return state.installedApps.includes(id); }
function appLabel(id) { return catalog.find(item => item.id === id)?.name || id; }

function safeHtml(html) {
  const parsed = new DOMParser().parseFromString(String(html || ''), 'text/html');
  const allowed = new Set(['P','DIV','H1','H2','H3','STRONG','B','EM','I','U','UL','OL','LI','BLOCKQUOTE','BR','SPAN','TABLE','THEAD','TBODY','TFOOT','TR','TD','TH','HR']);
  const walk = (node) => {
    [...node.childNodes].forEach(child => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (!allowed.has(child.tagName)) { child.replaceWith(document.createTextNode(child.textContent || '')); return; }
        [...child.attributes].forEach(attr => {
          const isCell = child.tagName === 'TD' || child.tagName === 'TH';
          const isSpan = isCell && (attr.name === 'colspan' || attr.name === 'rowspan') && /^[1-9]\d{0,2}$/.test(attr.value) && Number(attr.value) <= 100;
          if (!isSpan) child.removeAttribute(attr.name);
        });
        walk(child);
      } else if (child.nodeType !== Node.TEXT_NODE) child.remove();
    });
  };
  walk(parsed.body); return parsed.body.innerHTML;
}
function letter(n) { let result = ''; for (n++; n > 0; n = Math.floor((n - 1) / 26)) result = String.fromCharCode(65 + (n - 1) % 26) + result; return result; }
function cellRaw(row, col) { return String(activeDoc().cells?.[row]?.[col] ?? ''); }
function cellNumeric(row, col) { return window.BrightdeskFormula.calculateCell(activeDoc().cells || [], row, col); }
function colIndex(label) { return window.BrightdeskFormula.columnIndex(label); }
const ribbonTabs = {
  pages: ['home', 'insert', 'layout', 'review', 'view'],
  sheets: ['home', 'insert', 'formulas', 'data', 'view'],
  slides: ['home', 'insert', 'design', 'slideShow', 'view'],
  notes: ['home', 'insert', 'view']
};
function ribbonGroup(toolbar, label) {
  const group = document.createElement('div'); group.className = 'ribbon-group';
  const commands = document.createElement('div'); commands.className = 'ribbon-command-row';
  const caption = document.createElement('span'); caption.className = 'ribbon-group-label'; caption.textContent = label;
  group.append(commands, caption); toolbar.append(group); return commands;
}
function renderRibbonTabs() {
  const tabs = $('ribbon-tabs'); tabs.innerHTML = '';
  (ribbonTabs[state.app] || ['home']).forEach(tabKey => {
    const tab = t(`ribbon.${tabKey}`);
    const button = document.createElement('button'); button.className = 'ribbon-tab'; button.textContent = tab;
    button.setAttribute('role', 'tab'); button.setAttribute('aria-selected', String(state.ribbonTab === tabKey));
    button.classList.toggle('active', state.ribbonTab === tabKey);
    button.addEventListener('click', () => { state.ribbonTab = tabKey; renderToolbar(); }); tabs.append(button);
  });
}
function renderToolbar() {
  const toolbar = $('toolbar'); toolbar.innerHTML = ''; renderRibbonTabs();
  const label = (key) => t(`common.${key}`);
  const group = (key) => ribbonGroup(toolbar, label(key));
  const addButton = (container, label, action, title = label) => {
    const button = document.createElement('button'); button.className = 'tool'; button.textContent = label; button.title = title;
    button.addEventListener('click', action); container.append(button); return button;
  };
  const app = state.app, tab = state.ribbonTab;
  if (app === 'pages') {
    if (tab === 'home') {
      const font = group('text');
      [[label('bold'),'bold'],[label('italic'),'italic'],[label('underline'),'underline'],[label('heading1'),'heading'],[label('heading2'),'subheading']].forEach(([label, cmd]) => addButton(font, label, () => {
        editor.focus(); if (cmd === 'heading') document.execCommand('formatBlock', false, 'H1'); else if (cmd === 'subheading') document.execCommand('formatBlock', false, 'H2'); else document.execCommand(cmd); persist();
      }, label));
      const para = group('paragraph');
      addButton(para, label('bullets'), () => { editor.focus(); document.execCommand('insertUnorderedList'); persist(); });
      addButton(para, label('numbering'), () => { editor.focus(); document.execCommand('insertOrderedList'); persist(); });
      addButton(para, label('quote'), () => { editor.focus(); document.execCommand('formatBlock', false, 'BLOCKQUOTE'); persist(); });
      const edit = group('editing');
      addButton(edit, label('undo'), () => { editor.focus(); document.execCommand('undo'); persist(); });
      addButton(edit, label('redo'), () => { editor.focus(); document.execCommand('redo'); persist(); });
      addButton(group('export'), label('pdf'), exportPdf, 'Export as PDF');
    } else if (tab === 'insert') {
      const insert = group('tools');
      addButton(insert, label('table'), () => { editor.focus(); document.execCommand('insertHTML', false, '<table><tbody><tr><td> </td><td> </td></tr><tr><td> </td><td> </td></tr></tbody></table><p></p>'); persist(); });
      addButton(insert, label('horizontalLine'), () => { editor.focus(); document.execCommand('insertHorizontalRule'); persist(); });
      addButton(insert, label('date'), () => { editor.focus(); document.execCommand('insertText', false, new Date().toLocaleDateString()); persist(); });
    } else if (tab === 'layout') {
      const layout = group('paragraph');
      [[label('alignLeft'),'justifyLeft'],[label('centre'),'justifyCenter'],[label('alignRight'),'justifyRight'],[label('justify'),'justifyFull']].forEach(([label, command]) => addButton(layout, label, () => { editor.focus(); document.execCommand(command); persist(); }));
      const page = group('Page setup');
      const addPageSelect = (caption, key, options) => {
        const wrap = document.createElement('label'); wrap.className = 'page-setting'; wrap.textContent = caption;
        const select = document.createElement('select'); select.className = 'page-setting-select'; select.setAttribute('aria-label', caption);
        options.forEach(([value, text]) => { const option = document.createElement('option'); option.value = value; option.textContent = text; select.append(option); });
        const current = pageLayout.normalizePageLayout(activeDoc().pageSettings || {}); select.value = current[key];
        select.addEventListener('change', () => { const next = pageLayout.normalizePageLayout({ ...activeDoc().pageSettings, [key]: select.value }); activeDoc().pageSettings = next; applyPageLayout(); persist(); });
        wrap.append(select); page.append(wrap);
      };
      addPageSelect('Paper', 'size', [['A4','A4'],['Letter','US Letter'],['Legal','US Legal']]);
      addPageSelect('Orientation', 'orientation', [['portrait','Portrait'],['landscape','Landscape']]);
      addPageSelect('Margins', 'margin', [['normal','Normal'],['narrow','Narrow'],['moderate','Moderate'],['wide','Wide']]);
    } else if (tab === 'review') {
      const review = group('proofing');
      addButton(review, label('wordCount'), () => { const count = (editor.innerText.trim().match(/\S+/g) || []).length; setStatus(`${count} ${t('common.words')}`); });
      addButton(review, label('spellCheck'), () => { editor.spellcheck = !editor.spellcheck; setStatus(`Spell check ${editor.spellcheck ? 'on' : 'off'}`); });
    } else {
      const view = group('zoom');
      addButton(view, label('zoomOut'), () => changeEditorZoom(-10)); addButton(view, '100%', () => { state.editorZoom = 100; applyEditorZoom(); }); addButton(view, label('zoomIn'), () => changeEditorZoom(10));
      addButton(view, label('focusMode'), () => { state.focusMode = !state.focusMode; $('workspace').classList.toggle('focus-mode', state.focusMode);
    $('workspace').classList.toggle('todo-mode', isTodo); });
    }
  } else if (app === 'sheets') {
    if (tab === 'home') {
      const cell = group('cell');
      const ref = document.createElement('span'); ref.className = 'cell-ref'; ref.textContent = `${letter(state.selectedCell.col)}${state.selectedCell.row + 1}`; cell.append(ref);
      const formula = document.createElement('input'); formula.id = 'formula-input'; formula.className = 'formula-input'; formula.placeholder = label('enterValue'); formula.value = cellRaw(state.selectedCell.row, state.selectedCell.col);
      formula.addEventListener('change', () => { setCell(state.selectedCell.row, state.selectedCell.col, formula.value); refreshSheetValues(); }); cell.append(formula);
      const grid = group('cells'); addButton(grid, `+ ${label('row')}`, () => addSheetRow()); addButton(grid, `+ ${label('column')}`, () => addSheetColumn());
    } else if (tab === 'insert') {
      const insert = group('tools'); addButton(insert, label('newRow'), addSheetRow); addButton(insert, label('newColumn'), addSheetColumn);
    } else if (tab === 'formulas') {
      const fn = group('functions');
      ['SUM','AVERAGE','MIN','MAX','COUNT'].forEach(name => addButton(fn, name, () => insertColumnFormula(name), `Insert ${name} formula for the selected column`));
    } else if (tab === 'data') {
      const data = group('sort');
      addButton(data, label('sortAZ'), () => sortSheetColumn(false)); addButton(data, label('sortZA'), () => sortSheetColumn(true));
    } else {
      const view = group('zoom');
      addButton(view, label('zoomOut'), () => changeSheetZoom(-10)); addButton(view, `${state.sheetZoom}%`, () => { state.sheetZoom = 100; applySheetZoom(); }); addButton(view, label('zoomIn'), () => changeSheetZoom(10));
    }
  } else if (app === 'slides') {
    if (tab === 'home') {
      const slides = group('slides'); addButton(slides, label('newSlide'), addSlide); addButton(slides, label('duplicate'), duplicateSlide); addButton(slides, label('delete'), deleteSlide);
    } else if (tab === 'insert') {
      const insert = group('slideContent'); addButton(insert, label('titleSlide'), () => addSlideWithContent('Title', 'Add a subtitle')); addButton(insert, label('textSlide'), () => addSlideWithContent('New section', 'Add your points here'));
    } else if (tab === 'design') {
      const design = group('themes');
      [['Lavender','lavender'],['Midnight','midnight'],['Paper','paper']].forEach(([label, theme]) => addButton(design, label, () => setSlideTheme(theme)));
    } else if (tab === 'slideShow') {
      const show = group('startPresentation'); addButton(show, label('fromCurrentSlide'), presentSlides);
    } else {
      const view = group('zoom'); addButton(view, label('fitSlide'), () => { slideWrap.scrollTop = 0; setStatus('Slide fitted to workspace'); });
      addButton(view, label('slideCount'), () => setStatus(`${activeDoc().slides.length} slides`));
    }
  } else if (app === 'notes') {
    if (tab === 'home') {
      const note = group('note'); addButton(note, label('exportNote'), exportCurrent);
      addButton(note, label('clearNote'), () => { if (confirm('Clear this note?')) { $('notes-editor').value = ''; activeDoc().text = ''; persist(); } });
    } else if (tab === 'insert') {
      const insert = group('tools');
      addButton(insert, label('date'), () => insertNoteText(new Date().toLocaleDateString()));
      addButton(insert, label('divider'), () => insertNoteText('\n\n---\n\n'));
      addButton(insert, label('checklistItem'), () => insertNoteText('\n☐ '));
    } else {
      const view = group('zoom'); addButton(view, label('focusMode'), () => { state.focusMode = !state.focusMode; $('workspace').classList.toggle('focus-mode', state.focusMode); });
    }
  } else if (genericConfigs[app]) {
    const tools = group('tools');
    addButton(tools, 'New section', () => { editor.focus(); document.execCommand('insertHTML', false, '<h2>New section</h2><p>Start writing here.</p>'); persist(); });
    addButton(tools, 'Checklist', () => { editor.focus(); document.execCommand('insertHTML', false, '<p>☐ Task</p>'); persist(); });
    addButton(tools, 'Date', () => { editor.focus(); document.execCommand('insertText', false, new Date().toLocaleDateString()); persist(); });
    addButton(tools, 'Export PDF', exportPdf, 'Export the current Brightdesk module document as PDF');
  }
  if (state.installedDictionaries.length) {
    const dictionaryTools = ribbonGroup(toolbar, 'Dictionary');
    addButton(dictionaryTools, 'Check spelling', checkCurrentDocumentSpelling, 'Check this document with the selected open-source dictionary');
  }
}
function addSheetRow() { const cells = activeDoc().cells; cells.push(Array(cells[0]?.length || 12).fill('')); renderSheet(); persist(); }
function addSheetColumn() { activeDoc().cells.forEach(row => row.push('')); renderSheet(); persist(); }
function insertColumnFormula(name) {
  const { row, col } = state.selectedCell; const column = letter(col);
  const start = row > 0 ? 1 : 2; const end = row > 0 ? row : Math.max(6, row + 6);
  const value = `=${name}(${column}${start}:${column}${end})`; setCell(row, col, value); renderSheet();
}
function sortSheetColumn(descending) {
  const col = state.selectedCell.col;
  activeDoc().cells.sort((a, b) => {
    const av = String(a[col] ?? '').toLocaleLowerCase(), bv = String(b[col] ?? '').toLocaleLowerCase();
    const an = Number(av), bn = Number(bv);
    const result = av !== '' && bv !== '' && Number.isFinite(an) && Number.isFinite(bn) ? an - bn : av.localeCompare(bv);
    return descending ? -result : result;
  }); renderSheet(); persist();
}
function applyPageLayout() {
  if (!pageLayout || state.app !== 'pages') return;
  const settings = pageLayout.normalizePageLayout(activeDoc().pageSettings || {});
  activeDoc().pageSettings = settings;
  Object.assign(editor.style, pageLayout.getPageStyle(settings));
  editor.style.maxWidth = 'calc(100% - 40px)';
}
function changeEditorZoom(delta) { state.editorZoom = Math.max(70, Math.min(160, state.editorZoom + delta)); applyEditorZoom(); }
function applyEditorZoom() { editor.style.fontSize = `${14 * state.editorZoom / 100}px`; setStatus(`Document zoom ${state.editorZoom}%`); }
function changeSheetZoom(delta) { state.sheetZoom = Math.max(70, Math.min(160, state.sheetZoom + delta)); applySheetZoom(); }
function applySheetZoom() { sheetWrap.style.zoom = `${state.sheetZoom}%`; setStatus(`Sheet zoom ${state.sheetZoom}%`); }
function insertNoteText(value) { const input = $('notes-editor'); const start = input.selectionStart, end = input.selectionEnd; input.setRangeText(value, start, end, 'end'); activeDoc().text = input.value; persist(); input.focus(); }
function addSlideWithContent(title, body) { activeDoc().slides.push({ title, body }); activeDoc().current = activeDoc().slides.length - 1; renderSlides(); renderToolbar(); persist(); }
function setSlideTheme(theme) { state.slideTheme = theme; renderSlides(); setStatus(`${theme[0].toUpperCase()}${theme.slice(1)} theme selected`); }
function setCell(row,col,value) { while (activeDoc().cells.length <= row) activeDoc().cells.push([]); while (activeDoc().cells[row].length <= col) activeDoc().cells[row].push(''); activeDoc().cells[row][col]=value; persist(); }
function refreshSheetValues() {
  sheetWrap.querySelectorAll('input.grid-cell').forEach(input => {
    if (document.activeElement === input) return;
    const row = Number(input.dataset.row), col = Number(input.dataset.col);
    input.value = String(cellNumeric(row, col));
  });
  const formula = $('formula-input');
  if (formula && document.activeElement !== formula) formula.value = cellRaw(state.selectedCell.row, state.selectedCell.col);
}
function renderSheet() {
  const rows = activeDoc().cells || (activeDoc().cells = clone(defaults.sheets.cells));
  const maxCols = Math.max(12, ...rows.map(r=>r.length));
  const table = document.createElement('table'); table.className='sheet';
  const thead = document.createElement('thead'), head = document.createElement('tr'); const corner=document.createElement('th'); corner.textContent=''; head.append(corner);
  for(let c=0;c<maxCols;c++){const th=document.createElement('th');th.textContent=letter(c);head.append(th);} thead.append(head); table.append(thead);
  const tbody=document.createElement('tbody');
  rows.forEach((row,r)=>{const tr=document.createElement('tr'),th=document.createElement('th');th.textContent=String(r+1);tr.append(th);
    for(let c=0;c<maxCols;c++){const td=document.createElement('td'),input=document.createElement('input');input.className='grid-cell';input.value=String(cellNumeric(r,c));input.dataset.row=r;input.dataset.col=c;input.setAttribute('aria-label',`${letter(c)}${r+1}`);input.lang=state.proofingLanguage;
      input.addEventListener('focus',()=>{state.selectedCell={row:r,col:c};renderToolbar();});
      input.addEventListener('change',()=>{setCell(r,c,input.value);refreshSheetValues();});
      input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();setCell(r,c,input.value);const next=sheetWrap.querySelector(`input[data-row="${r+1}"][data-col="${c}"]`);next?.focus();refreshSheetValues();}});td.append(input);tr.append(td);}
    tbody.append(tr);
  }); table.append(tbody); sheetWrap.innerHTML=''; sheetWrap.append(table);
}
function renderSlides() {
  const doc=activeDoc(); if(!Array.isArray(doc.slides)||!doc.slides.length)doc.slides=[{title:t('common.newSlide'),body:''}];
  doc.current=Math.min(Math.max(0,doc.current||0),doc.slides.length-1); const slide=doc.slides[doc.current];
  slideWrap.innerHTML='';
  const stage=document.createElement('div');stage.className=`slide-stage theme-${state.slideTheme}`;
  const title=document.createElement('textarea');title.className='slide-title';title.value=slide.title||'';title.setAttribute('aria-label','Slide title');title.lang=state.proofingLanguage;
  const body=document.createElement('textarea');body.className='slide-body';body.value=slide.body||'';body.setAttribute('aria-label','Slide text');body.lang=state.proofingLanguage;
  title.addEventListener('input',()=>{slide.title=title.value;persist();});body.addEventListener('input',()=>{slide.body=body.value;persist();});
  stage.append(title,body);
  const controls=document.createElement('div');controls.className='slide-controls';
  const prev=document.createElement('button');prev.textContent='← Previous';prev.disabled=doc.current===0;prev.onclick=()=>{doc.current--;renderSlides();renderToolbar();};
  const count=document.createElement('span');count.textContent=`Slide ${doc.current+1} of ${doc.slides.length}`;
  const next=document.createElement('button');next.textContent='Next →';next.disabled=doc.current===doc.slides.length-1;next.onclick=()=>{doc.current++;renderSlides();renderToolbar();};
  controls.append(prev,count,next);slideWrap.append(stage,controls);
}
function addSlide(){activeDoc().slides.push({title:`Slide ${activeDoc().slides.length+1}`,body:''});activeDoc().current=activeDoc().slides.length-1;renderSlides();renderToolbar();persist();}
function duplicateSlide(){const d=activeDoc(),copy=clone(d.slides[d.current]);d.slides.splice(d.current+1,0,copy);d.current++;renderSlides();renderToolbar();persist();}
function deleteSlide(){const d=activeDoc();if(d.slides.length===1){alert('A presentation needs at least one slide.');return;}d.slides.splice(d.current,1);d.current=Math.max(0,d.current-1);renderSlides();renderToolbar();persist();}
function presentSlides(){const d=activeDoc();let i=d.current;const overlay=document.createElement('div');overlay.className='presentation-overlay';const slide=document.createElement('div');slide.className='presentation-slide';const title=document.createElement('h1'),body=document.createElement('p'),footer=document.createElement('div');footer.className='presentation-footer';footer.textContent='Click or press an arrow key to move · Esc to exit';slide.append(title,body,footer);overlay.append(slide);document.body.append(overlay);
  const draw=()=>{title.textContent=d.slides[i].title;body.textContent=d.slides[i].body;};const key=(e)=>{if(e.key==='Escape'){overlay.remove();document.removeEventListener('keydown',key);}else if(e.key==='ArrowRight'){i=Math.min(d.slides.length-1,i+1);draw();}else if(e.key==='ArrowLeft'){i=Math.max(0,i-1);draw();}};overlay.addEventListener('click',()=>{i=Math.min(d.slides.length-1,i+1);draw();});document.addEventListener('keydown',key);draw();}
function todoTasks() { return Array.isArray(activeDoc().tasks) ? activeDoc().tasks : (activeDoc().tasks = []); }
function saveTodoTasks() { persist(); $('todo-status').textContent = 'Saved on this device'; }
function replaceTodoTask(id, patch) {
  const tasks = todoTasks();
  const index = tasks.findIndex(task => task.id === id);
  if (index < 0) return;
  tasks[index] = window.BrightdeskTodoService.updateTask(tasks[index], patch);
  saveTodoTasks(); renderTodoWorkspace();
}
function renderTodoWorkspace() {
  const view = state.todoView || 'my-day';
  const titles = { 'my-day': 'My Day', important: 'Important', planned: 'Planned', tasks: 'Tasks', completed: 'Completed' };
  const descriptions = { 'my-day': 'Focus on what you want to get done today.', important: 'Keep your most important tasks close.', planned: 'See tasks that have a due date.', tasks: 'Everything you still need to do.', completed: 'Look back at what you have finished.' };
  $('todo-view-title').textContent = titles[view] || 'Tasks';
  $('todo-view-description').textContent = descriptions[view] || descriptions.tasks;
  $('todo-search').value = state.todoQuery || '';
  document.querySelectorAll('[data-todo-view]').forEach(button => button.classList.toggle('active', button.dataset.todoView === view));
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  const tasks = window.BrightdeskTodoService.filterTasks(todoTasks(), { view, query: state.todoQuery, today });
  $('todo-task-count').textContent = `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`;
  const list = $('todo-task-list'); list.innerHTML = '';
  if (!tasks.length) {
    const empty = document.createElement('div'); empty.className = 'todo-empty';
    const heading = document.createElement('b'); heading.textContent = state.todoQuery ? 'No matching tasks' : (view === 'completed' ? 'Nothing completed yet' : 'All clear for now');
    const message = document.createElement('p'); message.textContent = state.todoQuery ? 'Try another search.' : (view === 'my-day' ? 'Add a task above to start your day.' : 'Tasks that match this view will appear here.');
    empty.append(heading, message); list.append(empty); return;
  }
  tasks.forEach(task => {
    const card = document.createElement('article'); card.className = 'todo-task-card'; card.setAttribute('role','listitem');
    const main = document.createElement('div'); main.className = 'todo-task-main';
    const check = document.createElement('input'); check.type = 'checkbox'; check.checked = task.completed; check.className = 'todo-complete'; check.setAttribute('aria-label', task.completed ? `Restore ${task.title}` : `Complete ${task.title}`);
    check.addEventListener('change', () => { const tasksNow = todoTasks(); const i = tasksNow.findIndex(item => item.id === task.id); if (i >= 0) { tasksNow[i] = window.BrightdeskTodoService.setCompleted(tasksNow[i], check.checked); saveTodoTasks(); renderTodoWorkspace(); } });
    const textWrap = document.createElement('div'); textWrap.className = 'todo-task-text';
    const title = document.createElement('b'); title.className = task.completed ? 'completed' : ''; title.textContent = task.title;
    textWrap.append(title);
    if (task.notes) { const notes = document.createElement('p'); notes.textContent = task.notes; textWrap.append(notes); }
    const meta = document.createElement('div'); meta.className = 'todo-task-meta';
    if (task.dueDate) { const due = document.createElement('span'); due.textContent = `Due ${new Date(`${task.dueDate}T12:00:00`).toLocaleDateString()}`; if (!task.completed && task.dueDate < today) due.classList.add('overdue'); meta.append(due); }
    if (task.priority !== 'normal') { const priority = document.createElement('span'); priority.className = `todo-priority ${task.priority}`; priority.textContent = `${task.priority[0].toUpperCase()}${task.priority.slice(1)} priority`; meta.append(priority); }
    if (task.myDay) { const day = document.createElement('span'); day.textContent = 'My Day'; meta.append(day); }
    if (meta.childNodes.length) textWrap.append(meta);
    main.append(check, textWrap); card.append(main);
    const actions = document.createElement('div'); actions.className = 'todo-task-actions';
    const important = document.createElement('button'); important.type = 'button'; important.className = task.important ? 'todo-icon-button selected' : 'todo-icon-button'; important.textContent = task.important ? '★' : '☆'; important.title = task.important ? 'Remove from Important' : 'Mark as Important'; important.setAttribute('aria-label', important.title); important.addEventListener('click', () => replaceTodoTask(task.id, { important: !task.important })); actions.append(important);
    const myDay = document.createElement('button'); myDay.type = 'button'; myDay.className = 'todo-icon-button'; myDay.textContent = task.myDay ? '−' : '+'; myDay.title = task.myDay ? 'Remove from My Day' : 'Add to My Day'; myDay.setAttribute('aria-label', myDay.title); myDay.addEventListener('click', () => replaceTodoTask(task.id, { myDay: !task.myDay })); actions.append(myDay);
    const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'todo-text-button'; edit.textContent = 'Edit'; edit.addEventListener('click', () => { const form = card.querySelector('.todo-edit-form'); if (form) { form.hidden = !form.hidden; return; } const editForm = document.createElement('form'); editForm.className = 'todo-edit-form';
      const titleInput = document.createElement('input'); titleInput.type = 'text'; titleInput.maxLength = 240; titleInput.required = true; titleInput.value = task.title; titleInput.setAttribute('aria-label','Task title');
      const notesInput = document.createElement('textarea'); notesInput.value = task.notes || ''; notesInput.placeholder = 'Add notes'; notesInput.setAttribute('aria-label','Task notes');
      const dueInput = document.createElement('input'); dueInput.type = 'date'; dueInput.value = task.dueDate || ''; dueInput.setAttribute('aria-label','Due date');
      const priorityInput = document.createElement('select'); priorityInput.setAttribute('aria-label','Priority'); [['low','Low'],['normal','Normal'],['high','High']].forEach(([value,label]) => { const option = document.createElement('option'); option.value=value; option.textContent=label; priorityInput.append(option); }); priorityInput.value=task.priority;
      const save = document.createElement('button'); save.type='submit'; save.className='primary small-action'; save.textContent='Save'; const cancel = document.createElement('button'); cancel.type='button'; cancel.className='secondary small-action'; cancel.textContent='Cancel'; cancel.addEventListener('click',()=>editForm.remove());
      editForm.append(titleInput,notesInput,dueInput,priorityInput,save,cancel); editForm.addEventListener('submit',event=>{event.preventDefault();try{replaceTodoTask(task.id,{title:titleInput.value,notes:notesInput.value,dueDate:dueInput.value,priority:priorityInput.value});}catch(error){$('todo-status').textContent=error.message;}}); card.append(editForm); titleInput.focus(); }); actions.append(edit);
    const remove = document.createElement('button'); remove.type='button'; remove.className='todo-text-button danger'; remove.textContent='Delete'; remove.addEventListener('click',()=>{if(!window.confirm(`Delete “${task.title}”?`))return; activeDoc().tasks=window.BrightdeskTodoService.deleteTask(todoTasks(),task.id); saveTodoTasks(); renderTodoWorkspace();}); actions.append(remove);
    card.append(actions); list.append(card);
  });
}
function createTodoTask(event) {
  event.preventDefault();
  try {
    const input = $('todo-new-title');
    const task = window.BrightdeskTodoService.createTask({ title: input.value, myDay: state.todoView === 'my-day' });
    todoTasks().push(task); saveTodoTasks(); input.value = ''; renderTodoWorkspace(); input.focus();
  } catch (error) { $('todo-status').textContent = error.message; }
}

let selectedListId = null;
let listQuery = '';
let listStatusFilter = '';
function allLists() { const doc = activeDoc(); if (!Array.isArray(doc.lists)) doc.lists = []; return doc.lists; }
function currentList() { return allLists().find(list => list.id === selectedListId) || null; }
function saveLists() { persist(); const status = $('lists-status'); if (status) status.textContent = 'Saved on this device'; }
function renderListsWorkspace() {
  const lists = allLists();
  if (!selectedListId || !lists.some(list => list.id === selectedListId)) selectedListId = lists[0]?.id || null;
  const sidebar = $('lists-sidebar-items'); sidebar.innerHTML = '';
  lists.forEach(list => {
    const button = document.createElement('button'); button.type = 'button'; button.className = 'lists-side-item' + (list.id === selectedListId ? ' active' : '');
    button.textContent = list.title; button.addEventListener('click', () => { selectedListId = list.id; renderListsWorkspace(); }); sidebar.append(button);
  });
  const list = currentList();
  $('lists-empty').hidden = Boolean(list);
  $('lists-detail').hidden = !list;
  if (!list) { $('lists-title').textContent = 'Your lists'; $('lists-record-count').textContent = '0 records'; return; }
  $('lists-title').textContent = list.title;
  $('lists-description').textContent = list.description || 'Keep your records organised in one place.';
  const filtered = window.BrightdeskListsService.filterItems(list, { query: listQuery, status: listStatusFilter });
  $('lists-record-count').textContent = `${filtered.length} of ${list.items.length} records`;
  const table = $('lists-table'); table.innerHTML = '';
  const head = document.createElement('thead'), headRow = document.createElement('tr');
  list.columns.forEach(column => { const th = document.createElement('th'); th.textContent = column.name; headRow.append(th); });
  const actionsHead = document.createElement('th'); actionsHead.textContent = 'Actions'; headRow.append(actionsHead); head.append(headRow); table.append(head);
  const body = document.createElement('tbody');
  filtered.forEach(item => {
    const tr = document.createElement('tr');
    list.columns.forEach(column => { const td = document.createElement('td'); td.textContent = item.values[column.id] || '—'; tr.append(td); });
    const actions = document.createElement('td');
    const edit = document.createElement('button'); edit.type='button'; edit.className='lists-row-action'; edit.textContent='Edit'; edit.addEventListener('click',()=>openListRecordForm(item)); actions.append(edit);
    const remove = document.createElement('button'); remove.type='button'; remove.className='lists-row-action danger'; remove.textContent='Delete'; remove.addEventListener('click',()=>{if(!confirm('Delete this record?'))return;const next=window.BrightdeskListsService.deleteItem(list,item.id);replaceCurrentList(next);}); actions.append(remove);
    tr.append(actions); body.append(tr);
  });
  if (!filtered.length) { const tr=document.createElement('tr'),td=document.createElement('td'); td.colSpan=list.columns.length+1; td.className='lists-no-records'; td.textContent=listQuery||listStatusFilter?'No records match these filters.':'No records yet. Add your first record above.'; tr.append(td); body.append(tr); }
  table.append(body);
  const columnSelect=$('lists-sort-column'); columnSelect.innerHTML='';
  list.columns.forEach(column=>{const option=document.createElement('option');option.value=column.id;option.textContent=column.name;columnSelect.append(option);});
}
function replaceCurrentList(next) { const lists=allLists(),i=lists.findIndex(item=>item.id===next.id); if(i>=0)lists[i]=next; saveLists(); renderListsWorkspace(); }
function createBrightdeskList(event) {
  event.preventDefault();
  try { const title=$('lists-new-name').value; const description=$('lists-new-description').value; const list=window.BrightdeskListsService.createList({title,description}); allLists().push(list); selectedListId=list.id; $('lists-new-list-form').reset(); saveLists(); renderListsWorkspace(); }
  catch(error) { $('lists-status').textContent=error.message; }
}
function openListRecordForm(item=null) {
  const list=currentList(); if(!list)return;
  const form=$('lists-record-form'); form.innerHTML='';
  list.columns.forEach(column=>{
    const label=document.createElement('label'); label.className='lists-field'; label.textContent=column.name;
    let input;
    if(column.type==='choice'){input=document.createElement('select');(column.options||[]).forEach(value=>{const option=document.createElement('option');option.value=value;option.textContent=value;input.append(option);});}
    else {input=document.createElement('input');input.type=column.type==='date'?'date':'text';}
    input.name=column.id; input.value=item?.values?.[column.id]||''; if(column.required)input.required=true; label.append(input); form.append(label);
  });
  const save=document.createElement('button');save.type='submit';save.className='primary';save.textContent=item?'Save changes':'Add record';form.append(save);
  const cancel=document.createElement('button');cancel.type='button';cancel.className='secondary';cancel.textContent='Cancel';cancel.addEventListener('click',()=>{form.hidden=true;});form.append(cancel);
  form.dataset.itemId=item?.id||'';form.hidden=false;
}
function saveListRecord(event) {
  event.preventDefault();const list=currentList();if(!list)return;
  try { const values={};list.columns.forEach(column=>{values[column.id]=$('lists-record-form').elements.namedItem(column.id)?.value||'';});
    const itemId=$('lists-record-form').dataset.itemId;
    const next=itemId?window.BrightdeskListsService.updateItem(list,itemId,{values}):window.BrightdeskListsService.addItem(list,{values});
    $('lists-record-form').hidden=true;replaceCurrentList(next);
  } catch(error) {$('lists-status').textContent=error.message;}
}
function addBrightdeskListColumn(event) {
  event.preventDefault();const list=currentList();if(!list)return;
  try { const name=$('lists-column-name').value;const type=$('lists-column-type').value;const options=$('lists-column-options').value.split(',').map(v=>v.trim()).filter(Boolean);
    const next=window.BrightdeskListsService.addColumn(list,{name,type,options});$('lists-column-form').reset();replaceCurrentList(next);
  } catch(error) {$('lists-status').textContent=error.message;}
}
function renameCurrentList() { const list=currentList();if(!list)return;const title=prompt('List name',list.title);if(title===null)return;try{replaceCurrentList(window.BrightdeskListsService.renameList(list,title));}catch(error){$('lists-status').textContent=error.message;} }
function deleteCurrentList() { const list=currentList();if(!list||!confirm(`Delete the list “${list.title}” and all its records?`))return;const lists=allLists();activeDoc().lists=lists.filter(item=>item.id!==list.id);selectedListId=null;saveLists();renderListsWorkspace(); }

function renderGenericWorkspace() {
  const doc = activeDoc();
  editor.hidden = false; sheetWrap.hidden = true; slideWrap.hidden = true; notesWrap.hidden = true;
  editor.contentEditable = 'true';
  editor.innerHTML = safeHtml(doc.html || `<h2>${escapeHtml(genericConfigs[state.app]?.heading || state.app)}</h2><p>${escapeHtml(genericConfigs[state.app]?.desc || 'Work locally in Brightdesk.')}</p><p></p>`);
  editor.oninput = () => { doc.html = editor.innerHTML; persist(); };
}

function renderAppManager() {
  const grid = $('app-manager-grid');
  grid.classList.toggle('list-view', state.managerView === 'list');
  $('manager-grid-view').setAttribute('aria-pressed', String(state.managerView === 'grid'));
  $('manager-list-view').setAttribute('aria-pressed', String(state.managerView === 'list'));
  grid.innerHTML = '';
  $('manager-title').textContent = state.setupComplete ? t('manager.manageTitle') : t('manager.chooseTitle');
  $('manager-description').textContent = state.setupComplete
    ? t('manager.manageDesc')
    : t('manager.chooseDesc');
  $('manager-note').textContent = 'Choose apps to show in your suite, or download an app as a separate desktop application.';
  $('finish-app-setup').textContent = 'Add selected apps';
  $('finish-app-setup').hidden = state.setupComplete;
  $('skip-app-setup').hidden = state.setupComplete;
  catalog.forEach(item => {
    const canInstall = item.availability === 'available';
    const selected = state.firstRunSelection.has(item.id);
    const isInstalled = installedApp(item.id);
    const desktopApp = state.standaloneApps.find(installed => installed.id === item.id) || null;
    const card = document.createElement('article'); card.className = 'app-card';
    const preview = document.createElement('img'); preview.className = 'app-preview'; preview.src = `assets/apps/${item.id}.svg`; preview.alt = `${item.name} example screen`;
    const header = document.createElement('div'); header.className = 'app-card-header';
    const icon = document.createElement('img'); icon.className = 'app-icon-image'; icon.src = item.icon; icon.alt = ''; icon.setAttribute('aria-hidden', 'true');
    const heading = document.createElement('div'); heading.className = 'app-card-heading';
    const name = document.createElement('b'); name.textContent = item.name;
    const subtitle = document.createElement('small'); subtitle.textContent = item.subtitle;
    heading.append(name, subtitle); header.append(icon, heading);
    const description = document.createElement('p'); description.textContent = item.description;
    const footer = document.createElement('div'); footer.className = 'app-card-footer';
    const version = document.createElement('span'); version.className = 'module-version'; version.textContent = desktopApp ? `Desktop ${desktopApp.version}` : `Suite ${state.currentVersion}`;
    footer.append(version);
    if (!canInstall) {
      const comingSoon = document.createElement('span'); comingSoon.className = 'app-state'; comingSoon.textContent = 'In development'; footer.append(comingSoon);
    } else if (!state.setupComplete) {
      const label = document.createElement('label'); label.className = 'app-select-label';
      const check = document.createElement('input'); check.type = 'checkbox'; check.checked = selected;
      check.addEventListener('change', () => {
        if (check.checked) state.firstRunSelection.add(item.id); else state.firstRunSelection.delete(item.id);
        renderAppManager();
      });
      label.append(check, document.createTextNode(' Include in suite')); footer.append(label);
    } else {
      if (isInstalled) {
        const open = document.createElement('button'); open.type = 'button'; open.className = 'primary small-action'; open.textContent = 'Open in suite';
        open.addEventListener('click', () => setApp(item.id)); footer.append(open);
        const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'text-button'; remove.textContent = 'Remove';
        remove.addEventListener('click', () => toggleAppInstall(item.id)); footer.append(remove);
      } else {
        const add = document.createElement('button'); add.type = 'button'; add.className = 'primary small-action'; add.textContent = 'Add to suite';
        add.addEventListener('click', () => toggleAppInstall(item.id)); footer.append(add);
      }
      const stateTag = document.createElement('span'); stateTag.className = isInstalled ? 'app-state installed' : 'app-state'; stateTag.textContent = isInstalled ? 'In your suite' : 'Not in your suite';
      footer.append(stateTag);
    }
    const desktopDownload = document.createElement('button');
    desktopDownload.type = 'button';
    desktopDownload.className = 'text-button desktop-app-download';
    desktopDownload.textContent = desktopApp ? 'Open desktop app' : 'Download desktop app';
    desktopDownload.addEventListener('click', async () => {
      try {
        if (desktopApp) await window.brightdesk.launchStandaloneApp(item.id);
        else await window.brightdesk.openAppDownloads(item.id);
      } catch (error) { alert(`Could not ${desktopApp ? 'open' : 'open downloads for'} the desktop app: ${error.message}`); }
    });
    footer.append(desktopDownload);
    card.append(preview, header, description, footer); grid.append(card);
  });
}
async function refreshInstalledAppList() {
  try {
    state.standaloneApps = await window.brightdesk.listStandaloneApps();
    state.stagedAppUpdates = await window.brightdesk.listStagedStandaloneAppUpdates();
    renderAppManager();
    updateMessage(`Found ${state.standaloneApps.length} separately installed Brightdesk app${state.standaloneApps.length === 1 ? '' : 's'}.`, 'success');
  } catch (error) {
    updateMessage(`Could not refresh installed apps: ${error.message}`, 'error');
  }
}

function toggleAppInstall(id) {
  if (!installableCatalog.some(item => item.id === id) || launchAppId) return;
  if (installedApp(id)) {
    state.installedApps = state.installedApps.filter(appId => appId !== id);
    if (state.app === id) {
      state.app = state.installedApps[0] || 'pages';
      state.ribbonTab = 'home';
      if (state.installedApps.length === 0) state.view = 'manager';
    }
  } else {
    const hadNoApps = state.installedApps.length === 0;
    state.installedApps.push(id);
    if (hadNoApps || !installedApp(state.app)) state.app = id;
  }
  saveAppSetup(); render();
}
function completeAppSetup() {
  const selected = [...state.firstRunSelection].filter(id => installableCatalog.some(item => item.id === id));
  state.installedApps = selected; state.setupComplete = true;
  state.app = selected[0] || 'pages';
  // Return to the suite Home/App Centre after selection. Users choose
  // "Open in suite" on the app card when they are ready to enter an app.
  state.view = 'manager';
  saveAppSetup(); render();
}

function installedPack(code) { return state.installedLanguagePacks.find(pack => pack.code === code) || null; }
function proofingPack() { return installedPack(state.proofingLanguage) || installedPack(state.displayLanguage) || installedPack('en-AU'); }
function updateDocumentLanguage() {
  const lang = state.proofingLanguage || state.displayLanguage || 'en-AU';
  editor.lang = lang; $('notes-editor').lang = lang;
  sheetWrap.querySelectorAll('input').forEach(input => { input.lang = lang; });
  slideWrap.querySelectorAll('textarea').forEach(input => { input.lang = lang; });
}
function syncAppNavigation() {
  const host = $('dynamic-app-nav'); if (!host) return;
  host.innerHTML = '';
  catalog.filter(item => !['pages','sheets','slides','notes'].includes(item.id) && installedApp(item.id)).forEach(item => {
    const button=document.createElement('button'); button.className='nav'; button.dataset.app=item.id;
    const icon=document.createElement('img'); icon.className='app-nav-icon'; icon.src=item.icon; icon.alt=''; icon.setAttribute('aria-hidden','true');
    const label=document.createElement('span'); const name=document.createElement('b'); name.textContent=item.name; const sub=document.createElement('small'); sub.textContent=item.subtitle;
    label.append(name,sub); button.append(icon,label);
    button.addEventListener('click',()=>setApp(item.id)); host.append(button);
  });
}

async function refreshLanguageData() {
  const data = await window.brightdesk.listLanguagePacks();
  state.languageCatalog = data.available || [];
  state.installedLanguagePacks = data.installed || [];
  state.spellCheckerLanguages = data.spellCheckerLanguages || [];
  state.usesNativeMacSpellChecker = data.usesNativeMacSpellChecker === true;
  if (!installedPack(state.displayLanguage)) state.displayLanguage = 'en-AU';
  if (!installedPack(state.proofingLanguage)) state.proofingLanguage = state.displayLanguage;
  window.BrightdeskI18n.setPacks(state.installedLanguagePacks, state.displayLanguage);
  updateDocumentLanguage();
  try { await window.brightdesk.setProofingLanguage(state.proofingLanguage); } catch (error) { console.warn('Could not configure the proofing dictionary.', error); }
  localStorage.setItem('brightdesk-display-language', state.displayLanguage);
  localStorage.setItem('brightdesk-proofing-language', state.proofingLanguage);
}
function languageCard(pack, installed) {
  const card = document.createElement('article'); card.className = 'app-card language-card';
  const header = document.createElement('div'); header.className = 'app-card-header';
  const icon = document.createElement('span'); icon.className = 'language-code-mark'; icon.textContent = pack.code.split('-')[0].toUpperCase();
  const heading = document.createElement('div'); heading.className = 'app-card-heading';
  const name = document.createElement('b'); name.textContent = pack.name;
  const subtitle = document.createElement('small'); subtitle.textContent = `${pack.nativeName} · ${pack.code}`;
  heading.append(name, subtitle); header.append(icon, heading);
  const description = document.createElement('p'); description.textContent = installed ? t('language.installed') : t('language.install');
  const footer = document.createElement('div'); footer.className = 'app-card-footer';
  const stateLabel = document.createElement('span'); stateLabel.className = installed ? 'app-state installed' : 'app-state';
  stateLabel.textContent = pack.code === 'en-AU' ? 'Default · protected' : (installed ? 'Installed · protected' : ''); footer.append(stateLabel);
  if (installed) {
    // Installed language resources are bundled catalogue data and remain read-only.
  } else {
    const install = document.createElement('button'); install.className = 'primary small-action'; install.textContent = t('language.install');
    install.addEventListener('click', () => installLanguagePack(pack.code)); footer.append(install);
  }
  card.append(header, description, footer); return card;
}
function renderLanguageManager() {
  const installedGrid = $('installed-language-grid'), availableGrid = $('available-language-grid');
  installedGrid.innerHTML = ''; availableGrid.innerHTML = '';
  const display = $('display-language'), proofing = $('proofing-language');
  display.innerHTML = ''; proofing.innerHTML = '';
  const displayPlaceholder = document.createElement('option'); displayPlaceholder.value = ''; displayPlaceholder.textContent = t('language.selectDisplay'); display.append(displayPlaceholder);
  const proofingPlaceholder = document.createElement('option'); proofingPlaceholder.value = ''; proofingPlaceholder.textContent = t('language.selectProofing'); proofing.append(proofingPlaceholder);
  for (const pack of state.installedLanguagePacks) {
    const displayOption = document.createElement('option'); displayOption.value = pack.code; displayOption.textContent = `${pack.nativeName} (${pack.code})`; display.append(displayOption);
    const proofingOption = document.createElement('option'); proofingOption.value = pack.code; proofingOption.textContent = `${pack.nativeName} (${pack.code})`; proofing.append(proofingOption);
    installedGrid.append(languageCard(pack, true));
  }
  display.value = state.displayLanguage; proofing.value = state.proofingLanguage;
  const installedCodes = new Set(state.installedLanguagePacks.map(pack => pack.code));
  state.languageCatalog.filter(pack => !installedCodes.has(pack.code)).forEach(pack => availableGrid.append(languageCard(pack, false)));
  if (!availableGrid.children.length) {
    const empty = document.createElement('p'); empty.className = 'language-empty'; empty.textContent = t('language.allInstalled'); availableGrid.append(empty);
  }
  $('proofing-status').textContent = state.usesNativeMacSpellChecker ? t('language.proofingNative') : (state.spellCheckerLanguages.includes(proofingPack()?.proofingCode || state.proofingLanguage) ? t('language.proofingSupported') : t('language.proofingUnavailable'));
  window.BrightdeskI18n.localizeStaticElements($('language-manager'));
  renderDictionaryManager();
}
async function refreshDictionaries() {
  const [installed, catalogue] = await Promise.all([
    window.brightdesk.listDictionaries(),
    window.brightdesk.listDictionaryCatalogue()
  ]);
  state.installedDictionaries = installed;
  state.dictionaryCatalogue = catalogue;
  if (!state.installedDictionaries.some(item => item.locale === state.selectedDictionary)) {
    const matching = state.installedDictionaries.find(item => item.locale.toLowerCase() === state.proofingLanguage.toLowerCase());
    state.selectedDictionary = matching?.locale || state.installedDictionaries[0]?.locale || '';
  }
  localStorage.setItem('brightdesk-selected-dictionary', state.selectedDictionary);
}
function renderDictionaryManager() {
  const grid = $('installed-dictionary-grid');
  const select = $('proofing-dictionary');
  if (!grid || !select) return;
  grid.innerHTML = ''; select.innerHTML = '';
  const placeholder = document.createElement('option'); placeholder.value = '';
  placeholder.textContent = state.installedDictionaries.length ? 'Choose a spelling dictionary' : 'No dictionaries installed';
  select.append(placeholder);
  for (const item of state.installedDictionaries) {
    const option = document.createElement('option'); option.value = item.locale;
    option.textContent = `${item.nativeName} (${item.locale})`; select.append(option);
    const card = document.createElement('article'); card.className = 'app-card language-card';
    const header = document.createElement('div'); header.className = 'app-card-header';
    const mark = document.createElement('span'); mark.className = 'language-code-mark'; mark.textContent = item.locale.split('-')[0].toUpperCase();
    const heading = document.createElement('div'); heading.className = 'app-card-heading';
    const name = document.createElement('b'); name.textContent = item.name;
    const subtitle = document.createElement('small'); subtitle.textContent = `${item.nativeName} · ${item.locale}`;
    heading.append(name, subtitle); header.append(mark, heading);
    const description = document.createElement('p'); description.textContent = `Licence: ${item.license} · Engine: ${item.engine}`;
    const source = document.createElement('small'); source.className = 'dictionary-source'; source.textContent = `Source: ${item.sourceUrl}`;
    const footer = document.createElement('div'); footer.className = 'app-card-footer';
    const status = document.createElement('span'); status.className = 'app-state installed'; status.textContent = 'Installed · protected'; footer.append(status);
    card.append(header, description, source, footer); grid.append(card);
  }
  select.value = state.selectedDictionary;
  $('dictionary-status').textContent = state.installedDictionaries.length
    ? `${state.installedDictionaries.length} spelling dictionary/dictionaries installed. The built-in OS spell checker remains available too.`
    : 'No separate dictionaries installed yet. Install one from the catalogue or import a compatible .bddict bundle.';
  renderAvailableDictionaryCatalogue();
  renderToolbar();
}

function renderAvailableDictionaryCatalogue() {
  const grid = $('available-dictionary-grid');
  const search = $('dictionary-search');
  const count = $('dictionary-catalogue-count');
  if (!grid || !search || !count) return;
  const query = search.value.trim().toLocaleLowerCase();
  const matching = state.dictionaryCatalogue.filter(item =>
    `${item.name} ${item.nativeName} ${item.locale} ${item.license}`.toLocaleLowerCase().includes(query)
  );
  const visible = query ? matching.slice(0, 30) : matching.slice(0, 18);
  grid.innerHTML = '';
  count.textContent = query
    ? `${matching.length} matching dictionaries${matching.length > visible.length ? ` · showing first ${visible.length}` : ''}`
    : `Showing ${visible.length} of ${matching.length} dictionaries. Search to find more.`;

  for (const item of visible) {
    const card = document.createElement('article'); card.className = 'app-card language-card';
    const header = document.createElement('div'); header.className = 'app-card-header';
    const mark = document.createElement('span'); mark.className = 'language-code-mark'; mark.textContent = item.locale.split('-')[0].toUpperCase();
    const heading = document.createElement('div'); heading.className = 'app-card-heading';
    const name = document.createElement('b'); name.textContent = item.name;
    const subtitle = document.createElement('small'); subtitle.textContent = `${item.nativeName} · ${item.locale}`;
    heading.append(name, subtitle); header.append(mark, heading);
    const description = document.createElement('p'); description.textContent = `Licence: ${item.license} · Compatibility: Hunspell subset; advanced rules may need review`;
    const source = document.createElement('small'); source.className = 'dictionary-source'; source.textContent = `Source: ${item.upstream} · revision ${item.upstreamRevision.slice(0, 8)}`;
    const footer = document.createElement('div'); footer.className = 'app-card-footer';
    const status = document.createElement('span'); status.className = item.installed ? 'app-state installed' : 'app-state';
    status.textContent = item.installed ? 'Installed' : 'Available'; footer.append(status);
    const install = document.createElement('button'); install.className = item.installed ? 'secondary small-action' : 'primary small-action';
    install.textContent = item.installed ? 'Installed' : 'Install'; install.disabled = item.installed; install.dataset.dictionaryId = item.id;
    install.addEventListener('click', () => installCatalogueDictionary(item.id)); footer.append(install);
    card.append(header, description, source, footer); grid.append(card);
  }
  if (!visible.length) {
    const empty = document.createElement('p'); empty.className = 'language-empty'; empty.textContent = 'No dictionaries match that search.'; grid.append(empty);
  }
}

async function installCatalogueDictionary(id) {
  const item = state.dictionaryCatalogue.find(entry => entry.id === id);
  if (!item) { $('dictionary-status').textContent = 'That dictionary is not available in the catalogue.'; return; }
  const button = [...document.querySelectorAll('#available-dictionary-grid button')].find(element => element.dataset.dictionaryId === id);
  if (button) { button.disabled = true; button.textContent = 'Installing…'; }
  $('dictionary-status').textContent = `Downloading ${item.name} (${item.locale}) from its pinned open-source source…`;
  try {
    const result = await window.brightdesk.installCatalogueDictionary(id);
    await refreshDictionaries(); render();
    $('dictionary-status').textContent = `${result.name} (${result.locale}) installed. Original licence retained: ${result.license}.`;
  } catch (error) {
    if (button) { button.disabled = false; button.textContent = 'Install'; }
    $('dictionary-status').textContent = `Could not install ${item.locale}: ${error.message}`;
  }
}
function currentDocumentText() {
  if (state.app === 'pages') return editor.innerText || '';
  if (state.app === 'notes') return $('notes-editor').value || '';
  if (state.app === 'slides') return (activeDoc().slides || []).map(slide => `${slide.title || ''}\n${slide.body || ''}`).join('\n');
  if (state.app === 'sheets') return (activeDoc().cells || []).flat().filter(value => !String(value ?? '').startsWith('=')).map(value => String(value ?? '')).join('\n');
  return '';
}
async function checkCurrentDocumentSpelling() {
  const locale = state.selectedDictionary;
  if (!locale) { $('dictionary-status').textContent = 'Choose or install a spelling dictionary first.'; return; }
  try {
    const result = await window.brightdesk.checkSpelling({ locale, text: currentDocumentText() });
    const issues = result.misspellings || [];
    $('dictionary-status').textContent = issues.length
      ? `${issues.length} possible misspelling(s) found using ${locale}.`
      : `No possible misspellings found using ${locale}.`;
    if (!issues.length) { alert(`Spelling check complete. No possible misspellings were found using ${locale}.`); return; }
    const lines = issues.slice(0, 40).map(item => `${item.word} (${item.occurrences})${item.suggestions.length ? ` — Suggestions: ${item.suggestions.join(', ')}` : ''}`);
    const extra = issues.length > 40 ? `\n…and ${issues.length - 40} more.` : '';
    const capped = result.truncated ? '\nOnly the first 200 unique words are shown.' : '';
    alert(`Possible spelling issues (${locale}):\n\n${lines.join('\n')}${extra}${capped}\n\nThis check reports suggestions only; it does not change your document.`);
  } catch (error) { $('dictionary-status').textContent = `Spell check failed: ${error.message}`; }
}
async function openLanguageManager() {
  state.view = 'languages';
  try { await refreshLanguageData(); await refreshDictionaries(); } catch (error) { console.error(error); $('language-status').textContent = error.message; }
  render();
}
async function installLanguagePack(code) {
  try {
    await window.brightdesk.installLanguagePack(code);
    await refreshLanguageData(); render(); $('language-status').textContent = t('language.packInstalled');
  } catch (error) { $('language-status').textContent = error.message; }
}
async function changeDisplayLanguage(code) {
  if (!installedPack(code)) return;
  state.displayLanguage = code; localStorage.setItem('brightdesk-display-language', code);
  window.BrightdeskI18n.setPacks(state.installedLanguagePacks, code);
  render();
}
async function changeProofingLanguage(code) {
  if (!installedPack(code)) return;
  state.proofingLanguage = code; localStorage.setItem('brightdesk-proofing-language', code); updateDocumentLanguage();
  const languageBase = code.split('-')[0].toLowerCase();
  const matchingDictionary = state.installedDictionaries.find(item => item.locale.toLowerCase() === code.toLowerCase()) ||
    state.installedDictionaries.find(item => item.locale.split('-')[0].toLowerCase() === languageBase);
  state.selectedDictionary = matchingDictionary ? matchingDictionary.locale : '';
  localStorage.setItem('brightdesk-selected-dictionary', state.selectedDictionary);
  const dictionarySelect = $('proofing-dictionary');
  if (dictionarySelect) dictionarySelect.value = state.selectedDictionary;
  try {
    const result = await window.brightdesk.setProofingLanguage(code);
    $('proofing-status').textContent = state.usesNativeMacSpellChecker ? t('language.proofingNative') : (result?.supported ? t('language.proofingSupported') : t('language.proofingUnavailable'));
  } catch (error) { $('proofing-status').textContent = error.message; }
}

function render() {
  window.BrightdeskI18n.localizeStaticElements();
  document.querySelectorAll('.nav[data-app]').forEach(btn => {
    const appId = btn.dataset.app;
    const name = btn.querySelector('b'); if (name) name.textContent = t(`apps.${appId}`);
  });
  const manager = state.view === 'manager';
  const languages = state.view === 'languages';
  $('app-manager').hidden = !manager; $('language-manager').hidden = !languages;
  $('workspace').hidden = manager || languages; $('welcome').hidden = manager || languages || ['todo','lists','forms','planner','database','loop'].includes(state.app);
  $('app-title').textContent = manager ? t('sidebar.getApps') : (languages ? t('language.title') : (catalog.find(item => item.id === state.app)?.name || state.app));
  $('top-actions').hidden = manager || languages;
  if (manager) {
    $('save-status').textContent = t('manager.manageTitle'); renderAppManager();
  } else if (languages) {
    $('save-status').textContent = t('language.title'); renderLanguageManager();
  } else {
    const configKey = state.app;
    const coreWelcome = ['pages','sheets','slides','notes'].includes(configKey); $('welcome-title').textContent = coreWelcome ? t(`welcome.${configKey}Heading`) : (genericConfigs[configKey]?.heading || configKey); $('welcome-desc').textContent = coreWelcome ? t(`welcome.${configKey}Desc`) : (genericConfigs[configKey]?.desc || '');
    editor.setAttribute('data-placeholder', t('common.startTyping'));
    const doc = activeDoc();
    $('doc-title').value = doc.title || defaults[state.app].title;
    const isTodo = state.app === 'todo';
    const isLists = state.app === 'lists';
    const isForms = state.app === 'forms';
    const isPlanner = state.app === 'planner';
    const isDatabase = state.app === 'database';
    const isWorkspace = state.app === 'loop';
    $('todo-wrap').hidden = !isTodo; $('lists-wrap').hidden = !isLists; $('forms-wrap').hidden = !isForms; $('planner-wrap').hidden = !isPlanner; $('database-wrap').hidden = !isDatabase; $('workspace-app-wrap').hidden = !isWorkspace;
    $('open-button').hidden = isTodo || isLists || isForms || isPlanner || isDatabase || isWorkspace; $('save-project').hidden = isTodo || isLists || isForms || isPlanner || isDatabase || isWorkspace; $('export-button').hidden = isTodo || isLists || isForms || isPlanner || isDatabase || isWorkspace;
    document.querySelector('.document-bar').hidden = isTodo || isLists || isForms || isPlanner || isDatabase || isWorkspace; $('ribbon-tabs').hidden = isTodo || isLists || isForms || isPlanner || isDatabase || isWorkspace; $('toolbar').hidden = isTodo || isLists || isForms || isPlanner || isDatabase || isWorkspace;
    editor.hidden = !['pages'].includes(state.app); sheetWrap.hidden = state.app !== 'sheets'; slideWrap.hidden = state.app !== 'slides'; notesWrap.hidden = !['notes'].includes(state.app);
    editor.innerHTML = state.app === 'pages' ? safeHtml(doc.html) : '';
    if (state.app === 'pages') applyPageLayout(); else editor.removeAttribute('style');
    $('notes-editor').value = state.app === 'notes' ? (doc.text || '') : '';
    updateDocumentLanguage();
    if (state.app === 'sheets') renderSheet(); if (state.app === 'slides') renderSlides();
    if (isTodo) renderTodoWorkspace();
    else if (isLists) renderListsWorkspace();
    else if (isForms) window.BrightdeskFormsUI.render();
    else if (isPlanner) window.BrightdeskPlannerUI.render();
    else if (isDatabase) window.BrightdeskDatabaseUI.render();
    else if (isWorkspace) window.BrightdeskWorkspaceUI.render();
    else if (!['pages','sheets','slides','notes'].includes(state.app)) renderGenericWorkspace();
    renderToolbar();
    $('workspace').classList.toggle('focus-mode', state.focusMode);
  }
  syncAppNavigation();
  document.querySelectorAll('.nav[data-app]').forEach(btn => {
    const visible = launchAppId ? btn.dataset.app === launchAppId : installedApp(btn.dataset.app); btn.hidden = !visible; btn.classList.toggle('active', !manager && !languages && btn.dataset.app === state.app);
  });
  $('home-nav').hidden = Boolean(launchAppId);
  $('manage-apps').hidden = Boolean(launchAppId);
  $('home-nav').classList.toggle('active', manager);
  $('manage-apps').classList.toggle('active', false);
  $('manage-languages').classList.toggle('active', languages);
}
function collectDocxBlocks() {
  const blocks=[];
  const walk=(el,type='paragraph')=>{
    if(el.nodeType===Node.TEXT_NODE){if(el.textContent.trim())blocks.push({type,text:el.textContent.trim()});return;}
    if(el.nodeType!==Node.ELEMENT_NODE)return;
    const tag=el.tagName.toLowerCase();const blockType=tag==='h1'?'h1':tag==='h2'?'h2':tag==='li'?'li':type;
    if(['p','div','h1','h2','h3','li','blockquote'].includes(tag)){
      const runs=[];const run=(node,style={})=>{if(node.nodeType===Node.TEXT_NODE){if(node.textContent)runs.push({text:node.textContent,...style});}else if(node.nodeType===Node.ELEMENT_NODE){const next={...style,bold:style.bold||['b','strong'].includes(node.tagName.toLowerCase()),italic:style.italic||['i','em'].includes(node.tagName.toLowerCase()),underline:style.underline||node.tagName.toLowerCase()==='u'};node.childNodes.forEach(n=>run(n,next));}};
      el.childNodes.forEach(n=>run(n));const text=runs.map(r=>r.text).join('').trim();if(text)blocks.push({type:blockType,text,bold:runs.length>0&&runs.every(r=>r.bold),italic:runs.length>0&&runs.every(r=>r.italic),underline:runs.length>0&&runs.every(r=>r.underline)});
    } else el.childNodes.forEach(n=>walk(n,type));
  };
  editor.childNodes.forEach(n=>walk(n));return blocks;
}
function exportPayload(){
  const doc=activeDoc(),title=$('doc-title').value||'Brightdesk file';doc.title=title;
  if(state.app==='pages')return {kind:'pages',title,html:editor.innerHTML,blocks:collectDocxBlocks()};
  if(state.app==='sheets')return {kind:'sheets',title,rows:doc.cells||[]};
  if(state.app==='slides')return {kind:'slides',title,slides:doc.slides||[]};
  return {kind:'notes',title,text:$('notes-editor').value||''};
}
async function exportCurrent(){try{const result=await window.brightdesk.exportFile(exportPayload());if(result?.canceled)return;setStatus('Exported successfully');}catch(error){alert(`Export failed: ${error.message}`);}}
async function exportPdf(){try{const result=await window.brightdesk.exportPdf({title:$('doc-title').value});if(!result?.canceled)setStatus('PDF exported');}catch(error){alert(`PDF export failed: ${error.message}`);}}
function importProject(data){
  if (launchAppId && data?.kind && data.kind !== launchAppId) throw new Error(`This Brightdesk ${appLabel(launchAppId)} installation opens ${appLabel(launchAppId)} files only.`);
  if(data?.docs && typeof data.docs === 'object'){
    state.docs={...clone(defaults),...data.docs};
    for (const id of Object.keys(configs)) if (!state.docs[id] || typeof state.docs[id] !== 'object') state.docs[id] = clone(defaults[id]);
    const preferred = configs[state.app] ? state.app : 'pages';
    const target = state.setupComplete && installedApp(preferred) ? preferred : 'pages';
    if (!state.setupComplete || !installedApp(target)) { state.installedApps = [target]; state.setupComplete = true; }
    state.app = target; state.view = 'workspace'; state.ribbonTab = 'home'; state.focusMode = false;
    saveAppSetup(); return;
  }
  const kind=data?.kind;if(!configs[kind])throw new Error('This file could not be imported.');
  if (!installedApp(kind)) { state.installedApps.push(kind); state.setupComplete = true; saveAppSetup(); }
  if(kind==='pages')state.docs.pages={title:data.title||'Imported document',html:data.html?safeHtml(data.html):`<p>${escapeHtml(data.text||'')}</p>`};
  if(kind==='sheets')state.docs.sheets={title:data.title||'Imported spreadsheet',cells:(data.cells||[]).map(row=>row.map(v=>String(v??'')))};
  if(kind==='slides')state.docs.slides={title:data.title||'Imported presentation',slides:data.slides||clone(defaults.slides.slides),current:0};
  if(kind==='notes')state.docs.notes={title:data.title||'Imported note',text:data.text||''};
  state.app=kind; state.ribbonTab='home';
}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
async function openFile(){try{const data=await window.brightdesk.openFile();if(!data)return;importProject(data);persist();render();setStatus('File opened');}catch(error){alert(`Could not open file: ${error.message}`);}}
async function saveProject(){try{const result=await window.brightdesk.saveProject({title:$('doc-title').value,docs:state.docs});if(!result?.canceled)setStatus('Project saved');}catch(error){alert(`Could not save project: ${error.message}`);}}
function setApp(app){if((launchAppId && app !== launchAppId) || !(configs[app] || genericConfigs[app]) || !installedApp(app))return;state.app=app;state.view='workspace';state.ribbonTab='home';render();persist();}

document.querySelectorAll('.nav[data-app]').forEach(btn=>btn.addEventListener('click',()=>setApp(btn.dataset.app)));
$('home-nav').addEventListener('click',()=>{state.view='manager';render();});
$('manage-apps').addEventListener('click',()=>{if (launchAppId) return; state.view='manager';render();});
$('manage-languages').addEventListener('click',openLanguageManager);
$('display-language').addEventListener('change',event=>changeDisplayLanguage(event.target.value));
$('proofing-language').addEventListener('change',event=>changeProofingLanguage(event.target.value));
$('dictionary-search').addEventListener('input',renderAvailableDictionaryCatalogue);
$('proofing-dictionary').addEventListener('change',event=>{state.selectedDictionary=event.target.value;localStorage.setItem('brightdesk-selected-dictionary',state.selectedDictionary);renderToolbar();});
$('check-current-document').addEventListener('click',checkCurrentDocumentSpelling);
$('back-to-apps').addEventListener('click',()=>{state.view=state.setupComplete?'workspace':'manager';render();});
$('manager-grid-view').addEventListener('click', () => { state.managerView = 'grid'; localStorage.setItem('brightdesk-manager-view', state.managerView); renderAppManager(); });
$('manager-list-view').addEventListener('click', () => { state.managerView = 'list'; localStorage.setItem('brightdesk-manager-view', state.managerView); renderAppManager(); });
$('refresh-installed-apps').addEventListener('click', refreshInstalledAppList);
$('finish-app-setup').addEventListener('click',()=>{if(state.setupComplete){state.view=state.installedApps.length ? 'workspace' : 'manager';render();}else completeAppSetup();});
$('skip-app-setup').addEventListener('click',()=>{
  state.installedApps = [];
  state.setupComplete = true;
  state.app = 'pages';
  state.view = 'manager';
  saveAppSetup();
  render();
});
$('doc-title').addEventListener('change',()=>{activeDoc().title=$('doc-title').value;persist();});
editor.addEventListener('input',()=>{activeDoc().html=editor.innerHTML;persist();});
$('notes-editor').addEventListener('input',()=>{activeDoc().text=$('notes-editor').value;persist();});
$('todo-create-form').addEventListener('submit', createTodoTask);
$('todo-search').addEventListener('input', event => { state.todoQuery = event.target.value; renderTodoWorkspace(); });
document.querySelectorAll('[data-todo-view]').forEach(button => button.addEventListener('click', () => { state.todoView = button.dataset.todoView; renderTodoWorkspace(); }));
$('lists-new-list-form').addEventListener('submit', createBrightdeskList);
$('lists-record-form').addEventListener('submit', saveListRecord);
$('lists-add-record').addEventListener('click',()=>openListRecordForm());
$('lists-column-form').addEventListener('submit',addBrightdeskListColumn);
$('lists-search').addEventListener('input',event=>{listQuery=event.target.value;renderListsWorkspace();});
$('lists-status-filter').addEventListener('change',event=>{listStatusFilter=event.target.value;renderListsWorkspace();});
$('lists-sort-button').addEventListener('click',()=>{const list=currentList();if(!list)return;const sorted=window.BrightdeskListsService.sortItems(list.items,$('lists-sort-column').value,$('lists-sort-direction').value);list.items=sorted;saveLists();renderListsWorkspace();});
$('lists-rename').addEventListener('click',renameCurrentList);
$('lists-delete').addEventListener('click',deleteCurrentList);
$('lists-column-type').addEventListener('change',()=>{$('lists-column-options-wrap').hidden=$('lists-column-type').value!=='choice';});
$('export-button').addEventListener('click',exportCurrent);$('open-button').addEventListener('click',openFile);$('save-project').addEventListener('click',saveProject);
const updatePanel = $('update-settings-panel');
let updateReadyToInstall = false;
$('update-manual-install').disabled = true;
function updateMessage(message, status = 'info', actions = []) {
  const host = $('update-message');
  host.replaceChildren();
  host.hidden = false;
  host.dataset.status = status;
  const copy = document.createElement('span');
  copy.className = 'update-message-copy';
  copy.textContent = message;
  host.append(copy);
  const controls = document.createElement('div');
  controls.className = 'update-message-actions';
  actions.forEach(({ label, run, quiet = false }) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = quiet ? 'text-button' : 'secondary small-action';
    button.textContent = label;
    button.addEventListener('click', run);
    controls.append(button);
  });
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'update-message-close';
  close.textContent = '×';
  close.setAttribute('aria-label', 'Dismiss update notification');
  close.addEventListener('click', () => { host.hidden = true; host.replaceChildren(); });
  controls.append(close);
  host.append(controls);
}
async function openUpdateSettings() {
  $('app-updates-panel').hidden = true;
  updatePanel.hidden = false;
  try {
    const settings = await window.brightdesk.getUpdateSettings();
    $('update-auto-check').checked = settings.autoCheck === true;
    $('update-auto-download').checked = settings.autoDownload === true;
  } catch (error) {
    updateMessage(`Could not load update settings: ${error.message}`, 'error');
  }
}
async function saveUpdateSettings() {
  const settings = {
    autoCheck: $('update-auto-check').checked,
    autoDownload: $('update-auto-download').checked,
    autoInstall: false
  };
  try {
    const saved = await window.brightdesk.setUpdateSettings(settings);
    $('update-auto-check').checked = saved.autoCheck === true;
    $('update-auto-download').checked = saved.autoDownload === true;
    updateMessage('Your update preferences have been saved.', 'success');
  } catch (error) {
    updateMessage(`Could not save update settings: ${error.message}`, 'error');
  }
}
function renderAppUpdates(result) {
  const host = $('app-updates-list');
  host.replaceChildren();
  const appUpdates = new Map((result?.apps || []).map(item => [item.id, item]));
  const stagedUpdates = new Map(state.stagedAppUpdates.map(item => [item.appId, item]));
  const hasPublishedRelease = result?.ok === true;

  catalog.forEach(item => {
    const standalone = state.standaloneApps.find(installed => installed.id === item.id) || null;
    const inSuite = installedApp(item.id);
    const update = appUpdates.get(item.id) || null;
    const staged = stagedUpdates.get(item.id) || null;
    const row = document.createElement('article');
    row.className = 'app-update-row';
    const icon = document.createElement('img');
    icon.className = 'app-update-icon';
    icon.src = item.icon;
    icon.alt = '';
    icon.setAttribute('aria-hidden', 'true');
    const details = document.createElement('div');
    details.className = 'app-update-details';
    const title = document.createElement('b');
    title.textContent = item.name;
    const version = document.createElement('small');
    const status = document.createElement('span');
    status.className = 'app-update-status';

    if (standalone) {
      version.textContent = staged
        ? `Installed ${standalone.version} · Downloaded ${staged.version}`
        : (hasPublishedRelease
          ? `Installed ${standalone.version} · Latest ${update?.availableVersion || result.releaseVersion || 'unknown'}`
          : `Installed ${standalone.version}`);
      if (staged) {
        status.textContent = 'Ready to install';
        status.classList.add('available');
      } else if (!hasPublishedRelease) {
        status.textContent = result?.message || 'Release information unavailable';
        status.classList.add('muted');
      } else if (update?.updateAvailable) {
        status.textContent = 'Update available';
        status.classList.add('available');
      } else if (update?.installerAvailable) {
        status.textContent = 'Up to date';
        status.classList.add('current');
      } else {
        status.textContent = 'No installer published for this platform';
        status.classList.add('muted');
      }
    } else if (inSuite) {
      version.textContent = `Included in Brightdesk ${state.currentVersion}`;
      status.textContent = 'Updates with the suite';
      status.classList.add('current');
    } else {
      version.textContent = 'Not installed on this computer';
      status.textContent = 'Available to install';
      status.classList.add('muted');
    }

    details.append(title, version);
    const actions = document.createElement('div');
    actions.className = 'app-update-actions';
    if (standalone && staged) {
      const install = document.createElement('button');
      install.type = 'button';
      install.className = 'primary small-action';
      install.textContent = 'Next · Install update';
      install.addEventListener('click', async () => {
        try {
          await window.brightdesk.installStagedStandaloneAppUpdate(item.id);
          updateMessage(`Opened the ${staged.version} installer for ${item.name}. Follow its steps to finish updating.`, 'success');
        } catch (error) {
          updateMessage(`Could not open the update for ${item.name}: ${error.message}`, 'error');
        }
      });
      actions.append(install);
    } else if (standalone && update?.updateAvailable) {
      const download = document.createElement('button');
      download.type = 'button';
      download.className = 'primary small-action';
      download.textContent = 'Download update';
      download.addEventListener('click', async () => {
        try {
          await window.brightdesk.downloadStandaloneAppUpdate(item.id);
          state.stagedAppUpdates = await window.brightdesk.listStagedStandaloneAppUpdates();
          renderAppUpdates(result);
          updateMessage(`${item.name} ${update.availableVersion} has been downloaded and verified. Press Next when ready to install.`, 'success');
        } catch (error) {
          updateMessage(`Could not download the update for ${item.name}: ${error.message}`, 'error');
        }
      });
      actions.append(download);
    } else if (standalone) {
      const open = document.createElement('button');
      open.type = 'button';
      open.className = 'text-button';
      open.textContent = 'Open desktop app';
      open.addEventListener('click', async () => {
        try { await window.brightdesk.launchStandaloneApp(item.id); }
        catch (error) { updateMessage(error.message, 'error'); }
      });
      actions.append(open);
    } else if (!inSuite) {
      const download = document.createElement('button');
      download.type = 'button';
      download.className = 'text-button';
      download.textContent = 'Get app';
      download.addEventListener('click', async () => {
        try { await window.brightdesk.openAppDownloads(item.id); }
        catch (error) { updateMessage(error.message, 'error'); }
      });
      actions.append(download);
    }
    actions.prepend(status);
    row.append(icon, details, actions);
    host.append(row);
  });

  if (catalog.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'app-updates-empty';
    empty.textContent = 'No apps are listed.';
    host.append(empty);
  }
}
async function checkForUpdatesManually() {
  $('update-settings-panel').hidden = true;
  $('app-updates-panel').hidden = false;
  $('app-updates-list').replaceChildren();
  updateMessage('Checking Brightdesk and your installed standalone apps…', 'info');
  try {
    state.standaloneApps = await window.brightdesk.listStandaloneApps();
    const [suiteResult, appResult] = await Promise.all([
      window.brightdesk.checkForUpdates(),
      window.brightdesk.checkStandaloneAppUpdates()
    ]);
    state.stagedAppUpdates = appResult?.stagedApps || await window.brightdesk.listStagedStandaloneAppUpdates();
    renderAppUpdates(appResult);
    const standaloneUpdates = appResult?.ok ? appResult.apps.filter(item => item.updateAvailable) : [];
    $('update-status-dot').hidden = standaloneUpdates.length === 0;
    if (standaloneUpdates.length) {
      const stagedCount = state.stagedAppUpdates.filter(staged =>
        standaloneUpdates.some(update => update.id === staged.appId && update.availableVersion === staged.version)
      ).length;
      const message = stagedCount === standaloneUpdates.length
        ? `${stagedCount} standalone app update${stagedCount === 1 ? '' : 's'} downloaded and verified. Press Next beside an app when you are ready to install.`
        : `${standaloneUpdates.length} standalone app update${standaloneUpdates.length === 1 ? '' : 's'} available. Review the version details below.`;
      updateMessage(message, 'notice');
    } else if (!suiteResult?.ok) {
      updateMessage(suiteResult?.message || 'The Brightdesk suite update check could not be completed.', 'error');
    } else if (suiteResult.status === 'current') {
      updateMessage(`Brightdesk ${state.currentVersion} is up to date. No standalone app updates were found.`, 'success');
    }
  } catch (error) {
    renderAppUpdates({ ok: false, message: error.message, apps: [] });
    updateMessage(`Update check failed: ${error.message}`, 'error');
  }
}
async function downloadUpdateManually() {
  try {
    const result = await window.brightdesk.downloadUpdate();
    if (!result?.ok) updateMessage(result?.message || 'There is no update ready to download.', 'error');
  } catch (error) {
    updateMessage(`Could not download the update: ${error.message}`, 'error');
  }
}
async function installDownloadedUpdate() {
  if (!updateReadyToInstall) {
    updateMessage('There is no downloaded update ready to install yet.', 'info');
    return;
  }
  try {
    const result = await window.brightdesk.installUpdate();
    if (!result?.ok) updateMessage(result?.message || 'No downloaded update is ready to install.', 'error');
  } catch (error) {
    updateMessage(`Could not install the update: ${error.message}`, 'error');
  }
}
$('updates-button').addEventListener('click', checkForUpdatesManually);
$('update-settings-button').addEventListener('click', openUpdateSettings);
$('close-update-settings').addEventListener('click', () => { updatePanel.hidden = true; });
$('close-app-updates').addEventListener('click', () => { $('app-updates-panel').hidden = true; });
$('save-update-settings').addEventListener('click', saveUpdateSettings);
$('update-manual-check').addEventListener('click', checkForUpdatesManually);
$('update-manual-download').addEventListener('click', downloadUpdateManually);
$('update-manual-install').addEventListener('click', installDownloadedUpdate);
window.brightdesk.onUpdateState?.(updateState => {
  const dot = $('update-status-dot');
  const hasUpdate = ['available', 'downloaded', 'apps-available', 'apps-downloaded'].includes(updateState.status);
  updateReadyToInstall = updateState.status === 'downloaded';
  $('update-manual-install').disabled = !updateReadyToInstall;
  dot.hidden = !hasUpdate;
  if (updateState.status === 'available') {
    updateMessage(updateState.message, 'notice', [
      { label: 'Review update', run: openUpdateSettings },
      { label: 'Download update', run: downloadUpdateManually }
    ]);
  } else if (updateState.status === 'downloaded') {
    updateMessage(updateState.message, 'notice', [
      { label: 'Next · Install update', run: installDownloadedUpdate }
    ]);
  } else if (['apps-available', 'apps-downloaded'].includes(updateState.status)) {
    state.stagedAppUpdates = updateState.stagedApps || [];
    renderAppUpdates({ ok: true, releaseVersion: updateState.releaseVersion, apps: updateState.apps || [] });
    updateMessage(updateState.message, 'notice', [
      { label: 'Review updates', run: () => {
        updatePanel.hidden = true;
        $('app-updates-panel').hidden = false;
      }}
    ]);
  } else if (updateState.status === 'error' || updateState.status === 'unavailable' || updateState.status === 'external') {
    updateMessage(updateState.message, 'error');
  } else if (updateState.status === 'current') {
    updateMessage(updateState.message, 'success');
  } else if (updateState.status === 'checking' || updateState.status === 'downloading') {
    updateMessage(updateState.message, 'info');
  } else if (updateState.status === 'manual') {
    dot.hidden = true;
  }
});
loadLocal();$('platform').textContent=`Desktop app · ${window.brightdesk.platform}`;
(async()=>{
  try {
    const version = await window.brightdesk.getVersion();
    if (version) { state.currentVersion = version; $('version-label').textContent = `Version ${version}`; $('footer-version').textContent = `Brightdesk ${version}`; }
  } catch (error) { console.warn('The desktop version could not be read.', error); }
  try { await refreshLanguageData(); } catch(error) { console.error('Language packs could not be loaded.',error); }
  try { await refreshDictionaries(); } catch(error) { console.error('Spelling dictionaries could not be loaded.',error); }
  try { state.standaloneApps = await window.brightdesk.listStandaloneApps(); }
  catch(error) { console.warn('Individually installed Brightdesk apps could not be listed.', error); }
  try { state.stagedAppUpdates = await window.brightdesk.listStagedStandaloneAppUpdates(); }
  catch(error) { console.warn('Staged Brightdesk app updates could not be listed.', error); }
  render();
})();
