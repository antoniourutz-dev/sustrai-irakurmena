'use strict';
const API_URL = "https://awdajwrzxceqazmaorxc.supabase.co";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZGFqd3J6eGNlcWF6bWFvcnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDcyMjUsImV4cCI6MjA4OTE4MzIyNX0.OjjmvIiGf020pF2Frie2wCPiVCAPO-uWWdzoN4nkwCQ";
const headers = {'apikey':API_KEY,'Authorization':'Bearer '+API_KEY};
const $ = id => document.getElementById(id);
const escapeHtml = value => String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const GENRES = {iritzi_artikulua:'Iritzi-artikulua',gutuna:'Gutuna',gutun_irekia:'Gutun irekia',eskaera:'Eskaera',kexa:'Kexa',txostena:'Txostena',bestea:'Beste testu bat'};
let tasks=[], supports=[], selected=null, mode='training', started=false, elapsed=0, running=false, clockId=null, lastNotice=null;
let assistOpened = new Set();
let markerKit=null;
function refreshMarkedPrompt(){
  if(!selected||!markerKit)return;
  markerKit.fillSelectable($('contextText'), selected.context_eu, 'context');
  markerKit.fillSelectable($('instructionText'), selected.instruction_eu, 'instruction');
  const notes=Array.isArray(selected.official_material)?selected.official_material.filter(n=>n&&typeof n.text==='string'&&n.text.trim()):[];
  const grid=$('officialMaterialGrid');
  grid.querySelectorAll('.official-note-body').forEach((el,index)=>{
    const note=notes[index];
    if(note)markerKit.fillSelectable(el, note.text, 'official'+index);
  });
  const guidance=Array.isArray(selected.exam_guidance)?selected.exam_guidance:[];
  $('officialGuidanceList').querySelectorAll('li').forEach((li,index)=>{
    if(guidance[index])markerKit.fillSelectable(li, guidance[index], 'guidance'+index);
  });
  if(selected.source_excerpt_eu)markerKit.fillSelectable($('originalExcerptText'), selected.source_excerpt_eu, 'excerpt');
}
function notify(message){
  const el=$('toast'); el.textContent=message; el.hidden=false;
  if(lastNotice)clearTimeout(lastNotice);
  lastNotice=setTimeout(()=>el.hidden=true,4000);
}
function safeSource(input){
  try{const url=new URL(input);return url.protocol==='https:'&&url.hostname==='drive.google.com'?url.toString():null}catch{return null}
}
async function readTable(table,fields){
  const u=new URL(API_URL+'/rest/v1/'+table);
  u.searchParams.set('select',fields);
  u.searchParams.set('publication_status','eq.published');
  const response=await fetch(u,{headers,cache:'no-store'});
  if(!response.ok)throw Error('Ezin izan dira atazak kargatu ('+response.status+').');
  const values=await response.json();
  if(!Array.isArray(values))throw Error('Zerbitzariaren erantzuna ez da egokia.');
  return values;
}
const draftKey=()=>selected?'sustrai-writer-c1:'+selected.slug+':'+mode:'';
function loadDraft(){try{return localStorage.getItem(draftKey())||''}catch{return ''}}
function saveDraft(){if(!selected)return;try{localStorage.setItem(draftKey(),$('draft').value);$('saveState').textContent='Gordeta gailu honetan'}catch{$('saveState').textContent='Ezin izan da automatikoki gorde'}}
function countWords(text){return (text.trim().match(/[\p{L}\p{N}]+(?:['’·-][\p{L}\p{N}]+)*/gu)||[]).length}
function updateWordCount(){
  const words=countWords($('draft').value),min=selected?.min_words??null;
  $('wordCounter').textContent=words+' hitz';
  $('wordTarget').textContent=min?'Gutxienekoa: '+min+' hitz':'Gutxienekoa: ez zehaztua';
  $('wordCounter').classList.toggle('achieved',min!==null&&words>=min);
  $('copyDraft').disabled=!$('draft').value.trim();
  $('downloadDraft').disabled=!$('draft').value.trim();
}
function selectTaskBySlug(slug){
  const item=tasks.find(t=>t.slug===slug);
  if(!item)return;
  selected=item;
  $('writingTitle').textContent=item.title_eu;
  $('promptHeading').textContent=item.title_eu;
  $('taskMeta').replaceChildren();
  const noteTotal=Array.isArray(item.official_material)?item.official_material.length:0;
  const chips=[item.org_code,item.exam_reference,GENRES[item.genre]||item.genre,noteTotal?noteTotal+' jatorrizko datu':null,item.min_words?item.min_words+' hitz gutxienez':null,item.recommended_minutes?item.recommended_minutes+' min':null].filter(Boolean);
  for(const x of chips){const el=document.createElement('span');el.textContent=x;$('taskMeta').append(el)}
  const link=safeSource(item.source_url);
  $('sourceLink').hidden=!link;
  if(link)$('sourceLink').href=link;
  const notes=Array.isArray(item.official_material)?item.official_material.filter(n=>n&&typeof n.text==='string'&&n.text.trim()):[];
  $('officialMaterialSection').hidden=!notes.length;
  $('officialMaterialCount').textContent=notes.length?'('+notes.length+' testu)':'';
  const grid=$('officialMaterialGrid');grid.replaceChildren();
  notes.forEach((note,index)=>{
    const card=document.createElement('blockquote');
    card.className='official-note';
    const idx=document.createElement('span');
    idx.className='official-note-index';
    idx.textContent='JATORRIZKO DATUA '+(index+1);
    const body=document.createElement('div');
    body.className='official-note-body';
    card.append(idx,body);
    grid.append(card);
  });
  $('originalExcerpt').hidden=!item.source_excerpt_eu;
  $('originalExcerpt').open=false;
  const guidance=Array.isArray(item.exam_guidance)?item.exam_guidance:[];
  $('officialGuidance').hidden=guidance.length===0;
  $('officialGuidance').open=guidance.length>0;
  $('officialGuidanceList').replaceChildren(...guidance.map(()=>{let li=document.createElement('li');return li}));
  refreshMarkedPrompt();
  $('draft').disabled=false;
  $('draft').value=loadDraft();
  $('timerToggle').disabled=false;
  $('clearDraft').disabled=false;
  elapsed=0;running=false;
  updateClock();
  $('timeGuidance').textContent=item.recommended_minutes?item.recommended_minutes+' min gomendatuak':'Denbora-muga: ez egiaztatua';
  updateWordCount();
  renderSupports(); renderList();
  window.SustraiEskema?.setTask(item,mode);
  try{sessionStorage.setItem('sustrai-writer-last',slug)}catch{}
}
function renderList(){
  const selectedOrg=$('sourceFilter').value,selectedGenre=$('genreFilter').value;
  const search=$('taskSearch').value.toLocaleLowerCase('eu').trim();
  const filtered=tasks.filter(t=>(selectedOrg==='all'||t.org_code===selectedOrg)
    &&(selectedGenre==='all'||t.genre===selectedGenre)
    &&(!search||[t.title_eu,t.exam_reference,t.context_eu].some(v=>String(v||'').toLocaleLowerCase('eu').includes(search))));
  $('catalogCount').textContent=filtered.length+' / '+tasks.length+' ataza';
  const list=$('taskList');list.replaceChildren();
  if(!filtered.length){list.textContent='Ez dago atazarik iragazki honekin.';return}
  for(const task of filtered){
    const btn=document.createElement('button');btn.type='button';btn.className='task-card'+(task.slug===selected?.slug?' selected':'');
    btn.setAttribute('aria-pressed',String(task.slug===selected?.slug));
    btn.innerHTML='<span class="small">'+escapeHtml(task.org_code)+' · '+escapeHtml(task.exam_reference)+'</span><strong>'+escapeHtml(task.title_eu)+'</strong><span class="task-genre">'+escapeHtml(GENRES[task.genre]||task.genre)+'</span>';
    btn.onclick=()=>{selectTaskBySlug(task.slug);try{const url=new URL(window.location.href);url.searchParams.set('ataza',task.slug);window.history.replaceState(null,'',url.toString())}catch{}};
    list.append(btn);
  }
}
function supportSection(kind,target){
  const support=supports.find(s=>s.prompt_id===selected?.id&&s.support_kind===kind);
  const box=$(target);box.replaceChildren();
  for(const item of (Array.isArray(support?.items)?support.items:[])){
    const el=document.createElement('div');el.className='support-item';
    if(kind==='lexicon')el.innerHTML='<strong>'+escapeHtml(item.expression)+'</strong><p>'+escapeHtml(item.example)+'</p>';
    if(kind==='structures')el.innerHTML='<strong>'+escapeHtml(item.function_eu)+'</strong><p>'+escapeHtml(item.example)+'</p>';
    if(kind==='planning')el.innerHTML='<p><span class="index">'+escapeHtml(item.step)+'.</span>'+escapeHtml(item.instruction)+'</p>';
    box.append(el);
  }
  if(!box.childElementCount)box.textContent='Ez dago egiaztatutako laguntzarik oraingoz.';
}
function renderSupports(){
  for(const id of ['planningDetails','lexiconDetails','structuresDetails'])$(id).open=false;
  assistOpened=new Set();
  $('helpBadge').textContent='Laguntzarik erabili gabe';
  $('supportReady').hidden=mode==='simulation';
  $('simulationHelp').hidden=mode!=='simulation';
  if(!selected)return;
  supportSection('planning','planningSupport');
  supportSection('lexicon','lexiconSupport');
  supportSection('structures','structuresSupport');
}
function setMode(next){
  if(next===mode)return;
  if(selected)saveDraft();
  mode=next;
  $('trainingMode').classList.toggle('active',next==='training');
  $('simulationMode').classList.toggle('active',next==='simulation');
  $('trainingMode').setAttribute('aria-pressed',String(next==='training'));
  $('simulationMode').setAttribute('aria-pressed',String(next==='simulation'));
  $('modeNote').textContent=next==='simulation'?'Simulazioa: idazki autonomoa, hizkuntza-laguntzarik gabe.':'Entrenamendua: ideiak, hiztegia eta egiturak nahi duzunean ireki.';
  $('draft').value=loadDraft();
  updateWordCount();renderSupports();
  window.SustraiEskema?.setMode(next);
  if(next==='simulation')notify('Simulazioan laguntzak ezkutuan daude.');
}
function formatClock(seconds){const m=Math.floor(seconds/60),s=seconds%60;return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}
function setFocusMode(on){
  document.body.classList.toggle('focus-mode',!!on);
  const exit=$('exitFocus');
  if(exit)exit.hidden=!on;
}
function updateClock(){
  $('timerDisplay').textContent=formatClock(elapsed);
  $('timerToggle').textContent=running?'Gelditu':'Hasi';
  setFocusMode(running);
}
function toggleTimer(){
  if(!selected)return;
  running=!running;
  updateClock();
  notify(running?'Kontzentrazio-modua: kronometroa martxan':'Kronometroa geldituta');
}
function startClock(){clockId=setInterval(()=>{if(!running)return;elapsed++;updateClock();if(selected?.recommended_minutes&&elapsed===selected.recommended_minutes*60)notify('Gomendatutako denbora amaitu da.')},1000)}
async function copyDraft(){
  if(!selected||!$('draft').value.trim())return;
  try{await navigator.clipboard.writeText($('draft').value);notify('Testua kopiatu da.')}
  catch{notify('Ezin izan da kopiatu. Hautatu testua eskuz.')}
}
function downloadDraft(){
  if(!selected||!$('draft').value.trim())return;
  const title='SUSTRAI IDAZLANA\n'+selected.org_code+' · '+selected.exam_reference+'\n'+selected.title_eu+'\n\n';
  const blob=new Blob([title+$('draft').value],{type:'text/plain;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='sustrai-'+selected.slug+'.txt';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function clearDraft(){
  if(!selected||!$('draft').value.trim())return;
  if(!confirm('Ziur zaude idazlan hau ezabatu nahi duzula? Ezin da desegin.'))return;
  $('draft').value='';saveDraft();updateWordCount();notify('Zirriborroa ezabatu da.');
}
async function start(){
  markerKit=window.SustraiMarker?.createMarkerKit({
    storageKey:'sustrai-writer-marks',
    getScope:()=>selected?selected.slug:'none',
    onChange:refreshMarkedPrompt
  });
  markerKit?.setup();
  $('sourceFilter').onchange=renderList;
  $('genreFilter').onchange=renderList;
  $('taskSearch').oninput=renderList;
  $('trainingMode').onclick=()=>setMode('training');
  $('simulationMode').onclick=()=>setMode('simulation');
  $('draft').addEventListener('input',()=>{updateWordCount();saveDraft()});
  $('copyDraft').onclick=copyDraft;$('downloadDraft').onclick=downloadDraft;
  $('timerToggle').onclick=toggleTimer;$('clearDraft').onclick=clearDraft;
  if($('exitFocus'))$('exitFocus').onclick=()=>{running=false;updateClock();notify('Kontzentrazio-modua itxita')};
  for(const id of ['planningDetails','lexiconDetails','structuresDetails']){
    $(id).addEventListener('toggle',()=>{if(!$(id).open||!selected||mode==='simulation')return;assistOpened.add(id);$('helpBadge').textContent=assistOpened.size+' laguntza-atal irekita';});
  }
  startClock();
  try{
    const [raw,supportData]=await Promise.all([
      readTable('sr_writing_prompts','id,slug,organism_id,level,exam_reference,title_eu,genre,audience_eu,context_eu,instruction_eu,exam_guidance,min_words,recommended_minutes,source_url,source_section,source_status,official_material,source_excerpt_eu,source_excerpt_kind'),
      readTable('sr_writing_supports','prompt_id,support_kind,version,items,is_official')
    ]);
    const mapping={'IVAP':'IVAP','HABE':'HABE'};
    // The organization IDs are obtained through the existing published catalog, never inferred from slug.
    const organismData=await (async()=>{const response=await fetch(API_URL+'/rest/v1/sr_organisms?select=id,code',{headers});if(!response.ok)throw Error('Erakundeak ezin izan dira irakurri');return response.json()})();
    const organizations=new Map(organismData.map(x=>[x.id,x.code]));
    tasks=raw.filter(x=>organizations.has(x.organism_id)).map(x=>({...x,org_code:organizations.get(x.organism_id)})).sort((a,b)=>a.org_code.localeCompare(b.org_code)||b.exam_reference.localeCompare(a.exam_reference)||a.title_eu.localeCompare(b.title_eu,'eu'));
    supports=supportData.filter(x=>!x.is_official);
    $('taskList').setAttribute('aria-busy','false');
    if(!tasks.length)throw Error('Oraindik ez dago idazlanik argitaratuta.');
    let previous;try{previous=sessionStorage.getItem('sustrai-writer-last')}catch{}
    let requested=null,requestedMode=null;try{const params=new URLSearchParams(window.location.search);requested=params.get('ataza');requestedMode=params.get('mode')}catch{}
    selectTaskBySlug(tasks.some(t=>t.slug===requested)?requested:(tasks.some(t=>t.slug===previous)?previous:tasks[0].slug));
    if(requestedMode==='simulation')setMode('simulation');
  }catch(error){
    $('taskList').setAttribute('aria-busy','false');
    $('taskList').textContent=error.message||'Ezin izan da kargatu.';
    notify('Arazoa atazak kargatzean. Freskatu orria.');
    console.error(error);
  }
}
start();
