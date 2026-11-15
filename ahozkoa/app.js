'use strict';
const API_URL="https://awdajwrzxceqazmaorxc.supabase.co", API_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZGFqd3J6eGNlcWF6bWFvcnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDcyMjUsImV4cCI6MjA4OTE4MzIyNX0.OjjmvIiGf020pF2Frie2wCPiVCAPO-uWWdzoN4nkwCQ";
const HEADERS={'apikey':API_KEY,'Authorization':'Bearer '+API_KEY};
const $=id=>document.getElementById(id);
const GENRE={monologue:'Bakarrizketa',interaction:'Elkarrizketa',mediation:'Bitartekotza'};
const KEYS=['opening','idea1','idea2','closing'];
let tasks=[],supports=[],selected=null,mode='training',recording=null,mediaStream=null,mediaChunks=[],recordBlob=null,recordUrl=null,recorderMime='',clipDirty=false;
const timers={prep:{elapsed:0,running:false},speak:{elapsed:0,running:false}};
let toastTimer=null,markerKit=null;
function refreshMarkedOfficial(){
 if(!selected||!markerKit)return;
 markerKit.fillSelectable($('instruction'),selected.instruction_eu,'instruction');
 if(selected.source_text_eu?.trim())markerKit.fillSelectable($('sourceText'),selected.source_text_eu,'source');
 const points=Array.isArray(selected.role_points)?selected.role_points:[];
 $('rolePoints').querySelectorAll('li').forEach((li,index)=>{if(typeof points[index]==='string')markerKit.fillSelectable(li,points[index],'role'+index)});
 if(selected.other_position_eu)$('otherRole')&&markerKit.fillSelectable($('otherRole'),('Beste fitxako jarrera: '+selected.other_position_eu),'other');
 const qs=Array.isArray(selected.guiding_questions)?selected.guiding_questions:[];
 $('guidingQuestions').querySelectorAll('li').forEach((li,index)=>{if(typeof qs[index]==='string')markerKit.fillSelectable(li,qs[index],'q'+index)});
}
function show(message){
 const el=$('toast');el.textContent=message;el.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.hidden=true,4000);
}
function textNode(tag,value,className){
 const el=document.createElement(tag);el.textContent=String(value??'');if(className)el.className=className;return el;
}
async function readPublic(table,fields){
 const u=new URL(API_URL+'/rest/v1/'+table);u.searchParams.set('select',fields);
 if(table!=='sr_organisms')u.searchParams.set('publication_status','eq.published');
 const res=await fetch(u,{headers:HEADERS,cache:'no-store'});
 if(!res.ok)throw new Error('Datuak ezin izan dira kargatu ('+res.status+').');
 const rows=await res.json();if(!Array.isArray(rows))throw new Error('Datuen formatua ez da egokia.');return rows;
}
function safePDF(link){
 try{const u=new URL(link);return u.protocol==='https:'&&u.hostname==='drive.google.com'?u.toString():null}catch{return null}
}
function storageKey(){return selected?'sustrai-oral-c1:'+selected.slug+':'+mode:''}
function getState(){
 try{const raw=localStorage.getItem(storageKey());if(!raw)return {notes:{},checks:[]};const data=JSON.parse(raw);return {notes:data.notes||{},checks:Array.isArray(data.checks)?data.checks:[]}}catch{return {notes:{},checks:[]}}
}
function saveState(){
 if(!selected)return;
 const state={notes:Object.fromEntries(KEYS.map(k=>[k,$(k).value])),checks:[...$('reviewChecks').querySelectorAll('input:checked')].map(x=>x.value)};
 try{localStorage.setItem(storageKey(),JSON.stringify(state));$('notesStatus').textContent='Zure gailuan gordeta'}catch{$('notesStatus').textContent='Ezin izan da gorde: kopiatu eskema.'}
 $('copyNotes').disabled=!KEYS.some(k=>$(k).value.trim());
 $('clearNotes').disabled=!KEYS.some(k=>$(k).value.trim());
}
function loadState(){
 const state=getState();
 for(const k of KEYS)$(k).value=typeof state.notes?.[k]==='string'?state.notes[k]:'';
 for(const c of $('reviewChecks').querySelectorAll('input'))c.checked=state.checks.includes(c.value);
 $('copyNotes').disabled=!KEYS.some(k=>$(k).value.trim());
 $('clearNotes').disabled=!KEYS.some(k=>$(k).value.trim());
 $('notesStatus').textContent='Eskema gailu honetan gordetzen da';
}
function filtered(){
 const org=$('orgFilter').value,kind=$('kindFilter').value,term=$('search').value.toLocaleLowerCase('eu').trim();
 return tasks.filter(t=>(org==='all'||t.org_code===org)&&(kind==='all'||t.exercise_type===kind)
 &&(!term||[t.title_eu,t.exam_reference,t.other_position_eu].some(x=>String(x||'').toLocaleLowerCase('eu').includes(term))));
}
function renderCatalog(){
 const rows=filtered(),list=$('taskList');list.replaceChildren();
 $('catalogCount').textContent=rows.length+' / '+tasks.length+' ataza';
 if(!rows.length){list.append(textNode('p','Ez da atazarik aurkitu.','loading'));return}
 for(const t of rows){
  const btn=document.createElement('button');btn.type='button';btn.className='task-card'+(selected?.slug===t.slug?' active':'');
  btn.setAttribute('aria-pressed',String(selected?.slug===t.slug));
  btn.append(textNode('span',t.org_code+' · '+t.exam_reference+' · '+(t.variant||''),'meta'));
  btn.append(textNode('strong',t.title_eu));btn.append(textNode('span',GENRE[t.exercise_type]||t.exercise_type,'kind'));
  btn.onclick=()=>choose(t.slug,true);list.append(btn);
 }
}
function appendList(containerId,items){
 const box=$(containerId);box.replaceChildren();
 for(const x of items||[]){if(typeof x!=='string'||!x.trim())continue;box.append(document.createElement('li'))}
}
function renderSupports(){
 for(const t of ['planning','lexicon','structures','interaction']){
  const panel=$(t+'Details'),target=$(t+'Items');
  panel.open=false;panel.hidden=t==='interaction'&&selected?.exercise_type!=='interaction';target.replaceChildren();
  const set=supports.find(x=>x.prompt_id===selected?.id&&x.support_type===t);
  for(const item of Array.isArray(set?.items)?set.items:[]){
   const box=document.createElement('div');box.className='help-entry';
   box.append(textNode('strong',item.title||''));
   const desc=item.detail||item.example;
   if(desc)box.append(textNode('p',desc));
   target.append(box);
  }
  if(!target.childElementCount)target.append(textNode('p','Oraingoz ez dago laguntza zehatzik.'));
 }
 $('helpSections').hidden=mode==='simulation';
 $('simulationNotice').hidden=mode!=='simulation';
 $('helpCount').textContent='Laguntzarik zabaldu gabe';
}
function setFocusMode(on){
 document.body.classList.toggle('focus-mode',!!on);
 const exit=$('exitFocus');
 if(exit)exit.hidden=!on;
}
function anyTimerRunning(){return timers.prep.running||timers.speak.running}
function renderTimers(){
 for(const k of ['prep','speak']){
  const t=timers[k],target=k==='prep'?selected?.preparation_minutes:selected?.speaking_minutes;
  const stamp=String(Math.floor(t.elapsed/60)).padStart(2,'0')+':'+String(t.elapsed%60).padStart(2,'0');
  $(k+'Time').textContent=stamp;
  const top=$(k+'TimeTop');if(top)top.textContent=stamp;
  $(k+'Target').textContent=target===null||target===undefined?'Denbora ez egiaztatua':target+' min (fitxa)';
  $(k+'Start').disabled=!selected||target===null||target===undefined;
  $(k+'Start').textContent=t.running?'Gelditu':'Hasi';
  $(k+'Reset').disabled=!selected;
 }
 setFocusMode(anyTimerRunning());
}
function stopAllTimers(){for(const k of ['prep','speak'])timers[k].running=false;renderTimers()}
function startTimer(k){
 if(!selected)return;
 const target=k==='prep'?selected.preparation_minutes:selected.speaking_minutes;
 if(target===null||target===undefined)return;
 const was=timers[k].running;for(const x of ['prep','speak'])timers[x].running=false;
 timers[k].running=!was;
 renderTimers();
 if(timers[k].running)show('Kontzentrazio-modua: kronometroa martxan');
}
function resetTimer(k){timers[k].elapsed=0;timers[k].running=false;renderTimers()}
function tick(){
 for(const k of ['prep','speak']){
  if(!timers[k].running)continue;
  timers[k].elapsed++;
  const max=(k==='prep'?selected?.preparation_minutes:selected?.speaking_minutes);
  if(max!==null&&max!==undefined&&timers[k].elapsed>=max*60){
    timers[k].running=false;show(k==='prep'?'Prestaketa-denbora amaitu da.':'Interbentzioaren denbora amaitu da.');
  }
 }
 renderTimers();
}
function releaseRecording(){
 if(recording){
  // A discarded recording must not finish later and appear under another task.
  recording.onstop=null;recording.ondataavailable=null;recording.onerror=null;
  if(recording.state!=='inactive'){try{recording.stop()}catch{}}
 }
 if(mediaStream){for(const tr of mediaStream.getTracks())tr.stop();mediaStream=null}
 recording=null;
}
function clearRecording(){
 releaseRecording();recordBlob=null;mediaChunks=[];clipDirty=false;
 if(recordUrl){URL.revokeObjectURL(recordUrl);recordUrl=null}
 $('recordPlayback').pause();$('recordPlayback').removeAttribute('src');$('recordPlayback').hidden=true;
 $('recordDownload').disabled=true;$('recordToggle').textContent='● Grabatu';$('recordToggle').classList.remove('recording-now');
 $('recordStatus').textContent='Prest';
}
function finishRecording(){
 if(mediaStream){for(const t of mediaStream.getTracks())t.stop();mediaStream=null}
 const chunks=mediaChunks.slice();mediaChunks=[];recording=null;
 if(!chunks.length){$('recordStatus').textContent='Ez da audiorik jaso.';return}
 recordBlob=new Blob(chunks,{type:recorderMime||chunks[0].type||'audio/webm'});
 if(recordUrl)URL.revokeObjectURL(recordUrl);
 recordUrl=URL.createObjectURL(recordBlob);$('recordPlayback').src=recordUrl;$('recordPlayback').hidden=false;
 $('recordDownload').disabled=false;clipDirty=true;
 $('recordStatus').textContent='Grabazioa prest dago: entzun edo deskargatu. Orria ixtean ez da gordeko.';
 $('recordToggle').textContent='● Beste saio bat grabatu';$('recordToggle').classList.remove('recording-now');
}
async function toggleRecording(){
 if(!selected)return;
 if(recording&&recording.state==='recording'){recording.stop();return}
 if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){
  $('recordStatus').textContent='Nabigatzaile honek ez du tokiko grabazioa onartzen. Erabili grabagailu arrunta.';return;
 }
 if(clipDirty&&!confirm('Aurreko grabazioa galduko da. Deskargatu duzu?'))return;
 clearRecording();
 try{
  const stream=await navigator.mediaDevices.getUserMedia({audio:true});
  mediaStream=stream;
  const types=['audio/webm;codecs=opus','audio/mp4','audio/webm'];
  recorderMime=types.find(t=>MediaRecorder.isTypeSupported(t))||'';
  recording=new MediaRecorder(stream,recorderMime?{mimeType:recorderMime}:undefined);
  recording.ondataavailable=e=>{if(e.data&&e.data.size)mediaChunks.push(e.data)};
  recording.onstop=finishRecording;
  recording.onerror=()=>{$('recordStatus').textContent='Grabazioan arazoren bat gertatu da.';releaseRecording()};
  recording.start(250);$('recordStatus').textContent='Grabatzen… Gelditzeko, sakatu berriro.';
  $('recordToggle').textContent='■ Gelditu';$('recordToggle').classList.add('recording-now');
 }catch(e){releaseRecording();$('recordStatus').textContent='Mikrofonoaren baimena ez da eman edo ezin izan da ireki.'}
}
function downloadRecording(){
 if(!recordBlob||!recordUrl||!selected)return;
 const ext=/mp4/.test(recordBlob.type)?'m4a':'webm';
 const a=document.createElement('a');a.href=recordUrl;a.download='sustrai-'+selected.slug+'.'+ext;document.body.append(a);a.click();a.remove();clipDirty=false;
 $('recordStatus').textContent='Deskarga hasi da. Grabazioaren beste kopiarik ez dugu gorde.';
}
function choose(slug,updateUrl){
 const item=tasks.find(x=>x.slug===slug);if(!item)return;
 if((clipDirty||recording?.state==='recording')&&!confirm('Aldatu ataza? Uneko grabazioa galduko da. Deskargatu duzu?'))return;
 clearRecording();stopAllTimers();for(const k of ['prep','speak'])timers[k].elapsed=0;
 selected=item;
 $('speakingTitle').textContent=item.title_eu;
 const tags=[item.org_code,item.exam_reference,GENRE[item.exercise_type]||item.exercise_type,item.variant&&item.variant!=='single'?item.variant+' fitxa':null].filter(Boolean);
 $('taskTags').replaceChildren(...tags.map(t=>textNode('span',t)));
 const source=safePDF(item.source_url);$('sourceLink').hidden=!source;if(source)$('sourceLink').href=source;
 $('sourceTextBox').hidden=!item.source_text_eu?.trim();
 const debate=item.exercise_type==='interaction';$('roleBox').hidden=!debate;
 $('roleName').textContent=item.title_eu;
 appendList('rolePoints',Array.isArray(item.role_points)?item.role_points:[]);
 $('otherRole').textContent='';
 const qs=Array.isArray(item.guiding_questions)?item.guiding_questions:[];
 $('questionsBox').hidden=!qs.length;appendList('guidingQuestions',qs);
 $('sourceNote').textContent=item.reference_note||'Jatorrizko materiala: testu-geruzatik berreskuratua; irudiak PDFan.';
 refreshMarkedOfficial();
 if(debate&&!item.other_position_eu)$('otherRole').textContent='Beste fitxako jarrera: jatorrizko PDFan';
 $('recordToggle').disabled=false;
 loadState();renderTimers();renderSupports();renderCatalog();
 try{sessionStorage.setItem('sustrai-oral-last',slug)}catch{}
 if(updateUrl)try{const u=new URL(location.href);u.searchParams.set('ataza',slug);history.replaceState(null,'',u.toString())}catch{}
}
function setMode(next){
 if(next===mode)return;
 if((clipDirty||recording?.state==='recording')&&!confirm('Modua aldatuta audioa galduko da. Deskargatu duzu?'))return;
 if(selected)saveState();
 mode=next;clearRecording();stopAllTimers();for(const k of ['prep','speak'])timers[k].elapsed=0;
 $('trainMode').classList.toggle('active',next==='training');
 $('simulateMode').classList.toggle('active',next==='simulation');
 $('trainMode').setAttribute('aria-pressed',String(next==='training'));
 $('simulateMode').setAttribute('aria-pressed',String(next==='simulation'));
 $('modeInfo').textContent=next==='simulation'?'Simulazioa: laguntza pedagogikorik gabe. Iturri ofiziala beti ikusgai.':'Entrenamendua: probatu bakarrik eta zabaldu laguntza behar duzunean.';
 loadState();renderTimers();renderSupports();
}
function copyNotes(){
 if(!selected)return;
 const msg=['SUSTRAI · AHOZKO ESKEMA',selected.title_eu,'',
  ...KEYS.map((k,i)=>['Hasiera','1. ideia','2. ideia','Amaiera'][i]+': '+$(k).value.trim())].join('\n');
 navigator.clipboard?.writeText(msg).then(()=>show('Eskema kopiatu da.')).catch(()=>show('Ez da kopiatu. Aukeratu eskema eskuz.'));
}
function clearNotes(){
 if(!selected||!confirm('Ziur zaude eskema hau ezabatu nahi duzula?'))return;
 for(const k of KEYS)$(k).value='';saveState();show('Eskema ezabatu da.');
}
async function init(){
 markerKit=window.SustraiMarker?.createMarkerKit({
  storageKey:'sustrai-oral-marks',
  getScope:()=>selected?selected.slug:'none',
  onChange:refreshMarkedOfficial
 });
 markerKit?.setup();
 $('orgFilter').onchange=renderCatalog;$('kindFilter').onchange=renderCatalog;$('search').oninput=renderCatalog;
 $('trainMode').onclick=()=>setMode('training');$('simulateMode').onclick=()=>setMode('simulation');
 for(const k of KEYS)$(k).addEventListener('input',saveState);
 $('reviewChecks').addEventListener('change',saveState);
 $('copyNotes').onclick=copyNotes;$('clearNotes').onclick=clearNotes;
 for(const k of ['prep','speak']){$(k+'Start').onclick=()=>startTimer(k);$(k+'Reset').onclick=()=>resetTimer(k)}
 if($('exitFocus'))$('exitFocus').onclick=()=>{stopAllTimers();show('Kontzentrazio-modua itxita')};
 $('recordToggle').onclick=toggleRecording;$('recordDownload').onclick=downloadRecording;
 for(const panel of document.querySelectorAll('.help-sections details')){
  panel.addEventListener('toggle',()=>{
   if(!panel.open||mode==='simulation')return;
   const count=[...document.querySelectorAll('.help-sections details[open]')].length;
   $('helpCount').textContent=count+' laguntza-atal zabalik';
  });
 }
 window.addEventListener('pagehide',()=>{releaseRecording();if(recordUrl)URL.revokeObjectURL(recordUrl)});
 setInterval(tick,1000);
 try{
  const [raw,help,orgs]=await Promise.all([
   readPublic('sr_speaking_prompts','id,slug,organism_id,level,exam_reference,exercise_type,variant,title_eu,instruction_eu,source_text_eu,source_blocks,guiding_questions,role_points,other_position_eu,preparation_minutes,speaking_minutes,reference_note,source_url,review_status'),
   readPublic('sr_speaking_supports','prompt_id,support_type,items,version'),
   readPublic('sr_organisms','id,code')
  ]);
  const byId=new Map(orgs.map(x=>[x.id,x.code]));
  tasks=raw.filter(x=>byId.has(x.organism_id)&&x.review_status==='verified').map(x=>({...x,org_code:byId.get(x.organism_id)})).sort((a,b)=>a.org_code.localeCompare(b.org_code)||b.exam_reference.localeCompare(a.exam_reference)||a.title_eu.localeCompare(b.title_eu,'eu'));
  supports=help;
  $('taskList').setAttribute('aria-busy','false');
  if(!tasks.length)throw new Error('Ahozko atazarik ez da eskuragarri.');
  const params=new URLSearchParams(location.search),requested=params.get('ataza');
  let last=null;try{last=sessionStorage.getItem('sustrai-oral-last')}catch{}
  choose(tasks.some(t=>t.slug===requested)?requested:(tasks.some(t=>t.slug===last)?last:tasks[0].slug),false);
  if(params.get('mode')==='simulation')setMode('simulation');
 }catch(error){$('taskList').setAttribute('aria-busy','false');$('taskList').textContent=error.message;show('Ahozko atazak ezin izan dira kargatu.');console.error(error)}
}
init();
