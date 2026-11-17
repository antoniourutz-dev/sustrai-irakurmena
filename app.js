'use strict';

const SR_URL="https://awdajwrzxceqazmaorxc.supabase.co";
const SR_ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZGFqd3J6eGNlcWF6bWFvcnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDcyMjUsImV4cCI6MjA4OTE4MzIyNX0.OjjmvIiGf020pF2Frie2wCPiVCAPO-uWWdzoN4nkwCQ";
const SR_HEADERS={'apikey':SR_ANON,'Authorization':'Bearer '+SR_ANON,'Content-Type':'application/json'};
const SR_LETTER=/^[A-J]$/;
const srObject=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function srRequiredText(value,field){
 if(typeof value!=='string'||!value.trim())throw new Error('Azterketa-datu baliogabea: '+field);
 return value.trim();
}
function srSafeUrl(value,field,required=false){
 if(value===null||value===undefined||value===''){
   if(required)throw new Error('Azterketa-datu baliogabea: '+field);
   return null;
 }
 let url;
 try{url=new URL(value)}catch{throw new Error('Azterketa-datu baliogabea: '+field)}
 if(url.protocol!=='https:')throw new Error('Azterketa-datu baliogabea: '+field);
 return url.href;
}
function srExamLabel(label,id,organism){
 const clean=typeof label==='string'?label.trim():'';
 if(clean)return clean;
 const date=id.match(/^(\d{4})-(\d{2})-(\d{2})/);
 if(date)return date[3]+'/'+date[2]+'/'+date[1];
 return organism+' · '+id.replace(/[-_]+/g,' ');
}
function srChoiceArray(value,field){
 if(!Array.isArray(value)||!value.length||value.length>10||value.some(choice=>typeof choice!=='string'))throw new Error('Azterketa-datu baliogabea: '+field);
 return value;
}
function srOptions(value,field){
 if(!srObject(value)||!Object.keys(value).length)throw new Error('Azterketa-datu baliogabea: '+field);
 for(const [key,choice] of Object.entries(value)){
   if(/^\d+$/.test(key))srChoiceArray(choice,field+'.'+key);
   else if(!SR_LETTER.test(key)||typeof choice!=='string')throw new Error('Azterketa-datu baliogabea: '+field+'.'+key);
 }
 return value;
}
function srNormalizeExam(value,organism){
 if(!srObject(value))throw new Error('Azterketa-datu baliogabea');
 const id=srRequiredText(value.id,'id'),slug=srRequiredText(value.slug,'slug');
 if(!Array.isArray(value.items)||!value.items.length)throw new Error('Azterketa-datu baliogabea: items');
 const items=value.items.map((item,index)=>{
   if(!srObject(item)||!Array.isArray(item.r)||item.r.length!==2)throw new Error('Azterketa-datu baliogabea: items.'+index);
   const [first,last]=item.r,type=srRequiredText(item.type,'items.'+index+'.type');
   if(!Number.isInteger(first)||!Number.isInteger(last)||first<1||last<first||last-first>100)throw new Error('Azterketa-datu baliogabea: items.'+index+'.r');
   if(!['fill','mcq','fragments','synonyms'].includes(type))throw new Error('Azterketa-datu baliogabea: items.'+index+'.type');
   const title=srRequiredText(item.title,'items.'+index+'.title'),passage=srRequiredText(item.p,'items.'+index+'.p');
   if(type==='mcq'){
     if(!Array.isArray(item.qs)||item.qs.length!==last-first+1)throw new Error('Azterketa-datu baliogabea: items.'+index+'.qs');
     item.qs.forEach((question,questionIndex)=>{
       if(!srObject(question))throw new Error('Azterketa-datu baliogabea: items.'+index+'.qs.'+questionIndex);
       srRequiredText(question.q,'items.'+index+'.qs.'+questionIndex+'.q');
       srChoiceArray(question.o,'items.'+index+'.qs.'+questionIndex+'.o');
     });
   }else srOptions(item.opts,'items.'+index+'.opts');
   if(item.weight!==undefined&&(!Number.isFinite(item.weight)||item.weight<=0))throw new Error('Azterketa-datu baliogabea: items.'+index+'.weight');
   return {...item,type,title,p:passage,key:'?'.repeat(last-first+1)};
 });
 return {...value,id,slug,label:srExamLabel(value.label,id,organism),source:srSafeUrl(value.source,'source',true),solution:srSafeUrl(value.solution,'solution'),items};
}
async function srRequest(path,body){
 let lastError;
 for(let attempt=0;attempt<2;attempt++){
   const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),12000);
   try{
     const result=await fetch(SR_URL+path,{method:'POST',headers:await window.SustraiCloud.headers(SR_HEADERS),body:JSON.stringify(body),cache:'no-store',signal:controller.signal});
     if(!result.ok){const error=new Error('Ezin izan da Supabaserekin konektatu ('+result.status+')');error.retryable=result.status>=500;throw error}
     return await result.json();
   }catch(error){lastError=error;if(attempt||error.retryable===false)throw error;await new Promise(resolve=>setTimeout(resolve,600))}
   finally{clearTimeout(timeout)}
 }
 throw lastError;
}
async function srReadExams(organism){
 const exams=await srRequest('/rest/v1/rpc/sr_public_exam_snapshot',{p_organism_code:organism});
 if(!Array.isArray(exams))throw new Error('Azterketa-datuak ez dira egokiak');
 return exams.map(exam=>srNormalizeExam(exam,organism));
}
// Grading comes from the server. A solution is only known for questions the server chose to reveal.
function srAccepted(it,n){const k=it.key[n-it.r[0]];if(!k||k==='?')return[];return it.alternatives?.[n]?.split('/')||[k]}
function srIsCorrect(it,n,answer){if(!answer)return false;const known=srAccepted(it,n);if(known.length)return known.includes(answer);const seen=it.checked?.[n];return !!(seen&&seen.answer===answer&&seen.correct)}
function srSolutionHint(it,n,answer,mode){const known=srAccepted(it,n);if(known.length)return' · Erantzun zuzena: '+known.join(' edo ');if(mode==='simulation')return' · Simulazioan ez da soluziorik erakusten; Praktika moduan ikus ditzakezu.';return answer?'':' · Erantzun galdera, soluzioa ikusteko.'}
const srAwaiting=new Map();
async function srGrade(activeExam,getAnswers,options={}) {
 const slug=activeExam.slug,requestKey=slug+(options.finalize?':finish':':check');
 if(!srAwaiting.has(requestKey)){
   const byPart=Object.fromEntries(activeExam.items.map((it,i)=>[String(i+1),getAnswers(i)]));
   const work=srRequest('/functions/v1/sr-grade-exam',{slug,answers:byPart,...options})
    .then(result=>{
      if(!Array.isArray(result?.items) || result.total!==activeExam.items.reduce((sum,it)=>sum+it.r[1]-it.r[0]+1,0))
        throw new Error('Ezin izan dira erantzunak zuzendu');
      const correct=new Map();
      for(const row of result.items){
        const pos=Number(row?.position),n=Number(row?.n),accepted=row?.accepted??null;
        const item=activeExam.items[pos-1];
        if(!Number.isInteger(pos)||!item||!Number.isInteger(n)||n<item.r[0]||n>item.r[1])throw new Error('Ezin izan dira erantzunak zuzendu');
        if(accepted!==null&&(!Array.isArray(accepted)||!accepted.length||accepted.some(letter=>typeof letter!=='string'||!SR_LETTER.test(letter))))throw new Error('Ezin izan dira erantzunak zuzendu');
        if(accepted===null&&typeof row?.correct!=='boolean')throw new Error('Ezin izan dira erantzunak zuzendu');
        const given=byPart[String(pos)]?.[n]||'';
        if(!correct.has(pos))correct.set(pos,new Map());
        correct.get(pos).set(n,{accepted:accepted?accepted.slice():null,answer:given,correct:typeof row?.correct==='boolean'?row.correct:accepted.includes(given)});
      }
      activeExam.items.forEach((it,index)=>{
        const answers=correct.get(index+1),alternative={},checked={};
        if(!answers)throw new Error('Falta diren soluzioak: '+(index+1));
        it.key=Array.from({length:it.r[1]-it.r[0]+1},(_,j)=>{
          const nn=it.r[0]+j,row=answers.get(nn);
          if(!row)throw new Error('Zuzenketa falta da: '+nn);
          checked[nn]={answer:row.answer,correct:row.correct};
          // Keep a solution revealed earlier in this session when a later check hides it.
          if(!row.accepted){const before=it.key?.[j];if(before&&before!=='?'){if(it.alternatives?.[nn])alternative[nn]=it.alternatives[nn];return before}return '?'}
          if(row.accepted.length>1)alternative[nn]=row.accepted.join('/');
          return row.accepted[0];
        }).join('');
        it.alternatives=alternative;it.checked=checked;
      });
      return result;
    }).finally(()=>srAwaiting.delete(requestKey));
   srAwaiting.set(requestKey,work);
 }
 return await srAwaiting.get(requestKey);
}
const $=id=>document.getElementById(id);
const letters='ABCDEFGHIJ';
const colors={yellow:'#ffe174',green:'#a9e8bd',pink:'#f7bed5',blue:'#b2dbff'};

let activeMarker=null,markerDragState=null;
function setFocusMode(on){
 document.body.classList.toggle('focus-mode',!!on);
 const exit=$('exitFocus');
 if(exit)exit.hidden=!on;
}
function syncFocusFromTimer(){
 const t=timer();
 setFocusMode(!!t.start && !t.done);
}
function setActiveMarker(tool){
 const next=activeMarker===tool?null:tool;
 activeMarker=next;
 document.body.classList.toggle('marker-armed',!!activeMarker);
 if(activeMarker)document.body.dataset.markerTool=activeMarker;else delete document.body.dataset.markerTool;
 document.querySelectorAll('.swatch').forEach(el=>{
  const on=el.dataset.color===activeMarker;
  el.classList.toggle('active',on);
  el.setAttribute('aria-pressed',String(on));
 });
 const eraseBtn=$('erase');
 if(eraseBtn){
  const on=activeMarker==='erase';
  eraseBtn.classList.toggle('active',on);
  eraseBtn.setAttribute('aria-pressed',String(on));
 }
 if(activeMarker)$('markerbar').classList.add('visible');
}
function setupMarkerDrag(){window.SustraiMarkerBar.init($('markerbar'),$('markerDrag'))}
// A colour (or the eraser) acts on the current selection if there is one; otherwise it toggles the tool.
function pickMarker(tool){if(window.SustraiMarkerBar.hasSelection()){if(activeMarker!==tool)setActiveMarker(tool);if(tool==='erase')erase();else paint(tool);return}setActiveMarker(tool)}


let brushStroke=null;
function caretFromPoint(x,y){
 let node=null,offset=0;
 if(document.caretRangeFromPoint){
  const range=document.caretRangeFromPoint(x,y);
  if(range){node=range.startContainer;offset=range.startOffset}
 }else if(document.caretPositionFromPoint){
  const pos=document.caretPositionFromPoint(x,y);
  if(pos){node=pos.offsetNode;offset=pos.offset}
 }
 if(!node)return null;
 if(node.nodeType===Node.TEXT_NODE)return {node,offset};
 if(node.nodeType===Node.ELEMENT_NODE){
  const walker=document.createTreeWalker(node,NodeFilter.SHOW_TEXT);
  const first=walker.nextNode();
  if(first)return {node:first,offset:Math.min(offset,first.textContent.length)};
 }
 return null;
}
function previewBrushSelection(start,end){
 try{
  const range=document.createRange();
  range.setStart(start.node,start.offset);
  range.setEnd(end.node,end.offset);
  const sel=window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  return true;
 }catch{}
 try{
  const range=document.createRange();
  range.setStart(end.node,end.offset);
  range.setEnd(start.node,start.offset);
  const sel=window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  return true;
 }catch{}
 return false;
}
function brushTargetFromEvent(event){
 if(event.target.closest('#markerbar,.marker-drag,button,a,select,label,.numbers,.tab,.modal,.hole,.time-actions,.choose'))return null;
 return event.target.closest('.selectable[data-area]');
}
function markRangeFromElement(mark){
 const areaEl=mark.closest('.selectable[data-area]');
 if(!areaEl)return null;
 try{
  const before=document.createRange();
  before.selectNodeContents(areaEl);
  before.setEnd(mark,0);
  const start=before.toString().length,end=start+mark.textContent.length;
  if(end<=start)return null;
  return {area:areaEl.dataset.area,start,end};
 }catch{return null}
}
function eraseMarkElement(mark){
 const span=markRangeFromElement(mark);
 if(!span)return;
 const list=highlights().filter(m=>!(m.area===span.area&&m.start<span.end&&m.end>span.start));
 write(highlightsKey(),list);
 window.getSelection()?.removeAllRanges();
 renderPassage(false);renderQuestion();
}
function finishBrushStroke(){
 if(!brushStroke||!activeMarker){brushStroke=null;return}
 const moved=brushStroke.moved;
 brushStroke=null;
 if(!moved)return;
 capture();
 if(!pendingSelection.length)return;
 if(activeMarker==='erase')erase();else paint(activeMarker);
}
function setupBrushPaint(){
 document.addEventListener('pointerdown',event=>{
  if(!activeMarker||event.button!==0||brushStroke||event.pointerType==='touch')return;
  if(activeMarker==='erase'&&event.target.closest('mark.highlit'))return;
  if(!brushTargetFromEvent(event))return;
  const caret=caretFromPoint(event.clientX,event.clientY);
  if(!caret||caret.node.nodeType!==Node.TEXT_NODE)return;
  brushStroke={pid:event.pointerId,start:caret,end:caret,moved:false,x:event.clientX,y:event.clientY};
 },true);
 document.addEventListener('pointermove',event=>{
  if(!brushStroke||event.pointerId!==brushStroke.pid)return;
  if(Math.abs(event.clientX-brushStroke.x)>3||Math.abs(event.clientY-brushStroke.y)>3)brushStroke.moved=true;
  const caret=caretFromPoint(event.clientX,event.clientY);
  if(!caret||caret.node.nodeType!==Node.TEXT_NODE)return;
  brushStroke.end=caret;
  previewBrushSelection(brushStroke.start,caret);
 },true);
 const end=event=>{
  if(!brushStroke||event.pointerId!==brushStroke.pid)return;
  finishBrushStroke();
 };
 document.addEventListener('pointerup',end,true);
 document.addEventListener('pointercancel',end,true);
 document.addEventListener('click',event=>{
  if(activeMarker!=='erase')return;
  const mark=event.target.closest('mark.highlit');
  if(!mark||!mark.closest('.selectable[data-area]'))return;
  if(event.target.closest('#markerbar,button,a,select,.choose'))return;
  event.preventDefault();
  event.stopPropagation();
  eraseMarkElement(mark);
 },true);
 document.addEventListener('dblclick',event=>{
  if(!activeMarker||activeMarker==='erase')return;
  if(event.target.closest('mark.highlit,button,a,select,.choose,#markerbar,.hole'))return;
  if(!event.target.closest('.selectable[data-area]'))return;
  event.preventDefault();
  const caret=caretFromPoint(event.clientX,event.clientY);
  if(!caret||caret.node.nodeType!==Node.TEXT_NODE)return;
  const text=caret.node.textContent;
  let start=caret.offset,end=caret.offset;
  const word=c=>/[\p{L}\p{N}'’\-]/u.test(c);
  while(start>0&&word(text[start-1]))start--;
  while(end<text.length&&word(text[end]))end++;
  if(end<=start)return;
  try{
   const range=document.createRange();
   range.setStart(caret.node,start);
   range.setEnd(caret.node,end);
   const sel=window.getSelection();
   sel.removeAllRanges();
   sel.addRange(range);
  }catch{return}
  capture();
  if(!pendingSelection.length)return;
  paint(activeMarker);
 },true);
}


function setLoading(isLoading){document.body.classList.toggle('loading',isLoading);document.body.setAttribute('aria-busy',String(isLoading))}
function externalLink(href,label){const link=document.createElement('a');link.href=href;link.target='_blank';link.rel='noopener';link.textContent=label;return link}
const read=(k,defaultValue)=>{try{const v=JSON.parse(window.SustraiCloud.storage.getItem(k));return v===null?defaultValue:v}catch{return defaultValue}};
const write=(k,v)=>{try{window.SustraiCloud.storage.setItem(k,JSON.stringify(v))}catch{}};
const htmlEscape=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let exams=[],ex=0,part=0,current=1,graded={},visible=true,pendingSelection=[],toastId=0,activeDialog=null,dialogReturnFocus=null;
const exam=()=>exams[ex],task=()=>exam().items[part];
const numberOf=it=>it.r[1]-it.r[0]+1;
const totalOf=e=>e.items.reduce((a,it)=>a+numberOf(it),0);
const weight=it=>it.weight??(it.type==='fill'?.4:.8);
const storageKey=(id,index)=>{
 if(requestedMode()==='simulation')return 'sustrai-ivap-sim-answers-v1-'+id+'-'+index;
 if(id==='2019-05-04'&&index===0)return 'sustrai-gini-verified';
 if(id==='2019-05-04'&&index===1)return 'sustrai-gene-v1';
 if(id==='2019-05-04')return 'sustrai-2019-0-'+index;
 if(id==='2019-10-26')return 'sustrai-2019-1-'+index;
 if(id>='2017-01-01'&&id<='2018-12-31')return 'sustrai-answers-v2-'+id+'-'+index;
 return 'sustrai-answers-v3-'+id+'-'+index;
};
const answersOf=(i=part)=>read(storageKey(exam().id,i),{});
const highlightsKey=()=> 'sustrai-highlights-v2-'+exam().id+'-'+part;
const highlights=()=>read(highlightsKey(),[]);
const timerKey=()=>requestedMode()==='simulation'?'sustrai-ivap-sim-timer-v1-'+exam().id:'sustrai-timer-v2-'+exam().id;
const timer=()=>read(timerKey(),{elapsed:0,start:null,done:false});
const elapsed=t=>Math.max(0,(t.elapsed||0)+(t.start?Date.now()-t.start:0));
const timeString=ms=>{let n=Math.floor(ms/1000);return [Math.floor(n/3600),Math.floor(n/60)%60,n%60].map(x=>String(x).padStart(2,'0')).join(':')};
const progress=()=>exam().items.reduce((a,it,i)=>{let ans=answersOf(i);return a+Object.keys(ans).filter(n=>Number(n)>=it.r[0]&&Number(n)<=it.r[1]&&ans[n]).length},0);
function showDialog(id){dialogReturnFocus=document.activeElement;activeDialog=$(id);activeDialog.hidden=false;requestAnimationFrame(()=>activeDialog.querySelector('.modal-card')?.focus())}
function hideDialog(id){const dialog=$(id);dialog.hidden=true;if(activeDialog===dialog)activeDialog=null;if(dialogReturnFocus instanceof HTMLElement&&!dialogReturnFocus.closest('[hidden]'))dialogReturnFocus.focus();dialogReturnFocus=null}
function trapDialog(event){if(!activeDialog||event.key!=='Tab')return;const focusable=[...activeDialog.querySelectorAll('button:not([disabled]):not([hidden]),a[href],select,[tabindex]:not([tabindex="-1"])')].filter(element=>!element.closest('[hidden]'));if(!focusable.length)return;const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&(document.activeElement===first||!focusable.includes(document.activeElement))){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}
function closeActions(){$('timeActions').classList.remove('expanded');$('actionsToggle').setAttribute('aria-expanded','false')}
function syncModeButtons(mode){
 const practice=$('modePractice'),simulation=$('modeSimulation');
 if(!practice||!simulation)return;
 const sim=mode==='simulation';
 practice.classList.toggle('active',!sim);simulation.classList.toggle('active',sim);
 practice.setAttribute('aria-pressed',String(!sim));simulation.setAttribute('aria-pressed',String(sim));
}
function setWorkshopMode(mode){
 const next=mode==='simulation'?'simulation':'practice';
 try{
  const url=new URL(location.href);
  url.searchParams.set('mode',next);
  history.replaceState(null,'',url.toString());
 }catch{}
 chooseMode(next);
 if(exams.length)render(true);
}
function chooseMode(mode){$('grade').hidden=mode==='simulation'&&!timer().done;syncModeButtons(mode);$('modeBadge').textContent=mode==='simulation'?'Simulazioa':'Praktika librea';if(mode==='simulation'){const t=timer();if(!t.done&&!t.start){t.start=Date.now();write(timerKey(),t);tick();syncFocusFromTimer();toast('Simulazioa · kontzentrazio-modua')}}else syncFocusFromTimer()}
function requestedMode(){const mode=new URLSearchParams(location.search).get('mode');return mode==='simulation'?'simulation':'practice'}
function mistakeList(gradedOnly=false){const list=[];exam().items.forEach((it,index)=>{if(gradedOnly&&!graded[index])return;const selected=answersOf(index);for(let n=it.r[0];n<=it.r[1];n++)if(!srIsCorrect(it,n,selected[n]))list.push({part:index,n})});return list}
function learningTip(it){if(it.type==='fill')return'Berrirakurri esaldi osoa eta egiaztatu gramatika-loturak.';if(it.type==='mcq')return'Bilatu testuan aukera zuzena frogatzen duen esaldia.';return'Egiaztatu lokailuak eta aurreko zein ondorengo esaldien lotura.'}
function reviewMistakes(){const errors=mistakeList();if(!errors.length){toast('Ez dago berrikusteko akatsik');return}graded=Object.fromEntries(exam().items.map((_,index)=>[index,true]));part=errors[0].part;current=errors[0].n;closeSummary();render(true);view('questions');$('qtitle').focus()}
function nextMistake(){const errors=mistakeList(true),index=errors.findIndex(error=>error.part===part&&error.n===current),target=errors[(index+1+errors.length)%errors.length];if(!target)return;part=target.part;current=target.n;render(true);view('questions')}
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');const serial=++toastId;setTimeout(()=>{if(serial===toastId)$('toast').classList.remove('show')},2500)}
function tick(){if(!exams.length)return;const t=timer();$('clock').textContent=timeString(elapsed(t));$('clock').title='Azterketaren iraupena · gomendioa: '+(totalOf(exam())===25?'35 minutu':'50–60 minutu');$('start').textContent=t.done?'Amaituta':t.start?'Pausatu':t.elapsed?'Jarraitu':'Hasi';$('start').disabled=!!t.done;$('finish').disabled=!!t.done;$('timehint').textContent=t.done?'Denbora gordeta':t.start?'Kronometroa martxan':totalOf(exam())===25?'Gomendioa: 35 min':'Gomendioa: 50–60 min'}
function pauseToggle(){let t=timer();if(t.done)return;if(t.start){t.elapsed=elapsed(t);t.start=null;toast('Kronometroa geldituta')}else{t.start=Date.now();toast('Kontzentrazio-modua: kronometroa martxan')}write(timerKey(),t);tick();syncFocusFromTimer()}
function points(){let score=0,correct=0;exam().items.forEach((it,i)=>{let ans=answersOf(i);for(let n=it.r[0];n<=it.r[1];n++)if(srIsCorrect(it,n,ans[n])){correct++;score+=weight(it)}});return{score:Math.round(score*10)/10,correct}}
function clientAttemptKey(){const key='sustrai-client-attempt-v1-'+exam().id+'-'+requestedMode();let value=window.SustraiCloud.storage.getItem(key);if(!value){value='sustrai-'+crypto.randomUUID();window.SustraiCloud.storage.setItem(key,value)}return value}
async function finish(){
 const e=exam(), blank=totalOf(e)-progress();
 if(blank&&!confirm(blank+' galdera erantzun gabe daude. Amaitu nahi duzu?'))return;
 try{
   const t=timer(),startElapsed=elapsed(t);
   await srGrade(e,answersOf,{finalize:true,elapsedSeconds:Math.min(86400,Math.floor(startElapsed/1000)),clientAttemptKey:clientAttemptKey(),mode:requestedMode()});
   if(e!==exam())return;
   if(!t.done){
     t.elapsed=startElapsed;t.start=null;t.done=true;write(timerKey(),t);
     const p=points(),k='sustrai-attempts-v3-'+e.id,attempts=read(k,[]);
     attempts.push({at:new Date().toISOString(),score:p.score,correct:p.correct,elapsed:t.elapsed,mode:requestedMode(),sheet:window.SustraiAttempts.sheetOf(attemptParts(),answersOf,(index,n,letter)=>srIsCorrect(e.items[index],n,letter))});
     write(k,attempts.slice(-30));
   }
   setFocusMode(false);$('grade').hidden=false;summary();tick();
 }catch(error){console.error(error);toast('Ezin izan da zuzendu: saiatu berriro');}
}
function resultData(){const e=exam(),t=timer(),history=read('sustrai-attempts-v3-'+e.id,[]),previous=history.length>1?history.at(-2):null;let correct=0,wrong=0,blank=0,score=0,max=0;
 const parts=e.items.map((it,index)=>{const a=answersOf(index),w=weight(it);let c=0,x=0,b=0;for(let n=it.r[0];n<=it.r[1];n++){if(!a[n])b++;else if(srIsCorrect(it,n,a[n]))c++;else x++}correct+=c;wrong+=x;blank+=b;score+=c*w;max+=numberOf(it)*w;return{type:it.type,title:it.title,correct:c,total:numberOf(it),wrong:x,blank:b,points:c*w,maxPoints:numberOf(it)*w,tip:learningTip(it)}});
 const ms=elapsed(t);return{score:Math.round(score*10)/10,max:Math.round(max*10)/10,pass:10,correct,total:totalOf(e),wrong,blank,elapsedMs:ms>0?ms:null,previous:previous?{score:previous.score,elapsedMs:previous.elapsed}:null,parts,mode:requestedMode()}}
function summary(){const d=resultData(),errors=mistakeList();$('summary').innerHTML=window.SustraiResult.summary(d);$('reviewMistakes').hidden=!errors.length;$('reviewMistakes').textContent='Akatsak berrikusi ('+errors.length+')';showDialog('modal')}
function closeSummary(){hideDialog('modal')}
function attemptParts(){return exam().items.map((it,index)=>({label:(index+1)+'. ariketa · '+(it.type==='fill'?'Hutsuneak':it.type==='mcq'?'Ulermena':'Testua'),from:it.r[0],to:it.r[1]}))}
function showAttempts(){const e=exam();if(!$('modal').hidden)closeSummary();window.SustraiAttempts.show({examTitle:'IVAP · '+e.id,total:totalOf(e),parts:attemptParts(),attempts:read('sustrai-attempts-v3-'+e.id,[]).map(a=>({...a,elapsedMs:a.elapsed})),onRepeat:restart})}
function restart(){if(!confirm('Azterketaren erantzunak eta kronometroa berrabiarazi? Markak mantenduko dira.'))return;window.SustraiCloud.storage.removeItem('sustrai-client-attempt-v1-'+exam().id+'-'+requestedMode());exam().items.forEach((it,i)=>window.SustraiCloud.storage.removeItem(storageKey(exam().id,i)));window.SustraiCloud.storage.removeItem(timerKey());graded={};current=task().r[0];closeSummary();render();toast('Azterketa berrabiarazita')}
function selectExam(i){ex=i;part=0;current=task().r[0];graded={};pendingSelection=[];try{window.SustraiCloud.storage.setItem('sustrai-current-exam',exam().id)}catch{};render(true);view('reading')}
function selectPart(i){part=i;current=task().r[0];pendingSelection=[];render(true);view('reading')}
function view(tab){const questions=tab==='questions';document.body.classList.toggle('view-questions',questions);$('viewReading').classList.toggle('on',!questions);$('viewQuestions').classList.toggle('on',questions);$('viewReading').setAttribute('aria-pressed',String(!questions));$('viewQuestions').setAttribute('aria-pressed',String(questions));if($('sheetToggle'))$('sheetToggle').setAttribute('aria-expanded',String(questions))}
function selectQuestion(n){current=n;renderQuestion();view('questions')}
function step(delta){current=Math.max(task().r[0],Math.min(task().r[1],current+delta));renderQuestion()}
function choose(letter){let a=answersOf(),it=task(),n=current;if(a[n]===letter)return;if(it.type==='fragments'){const other=Object.keys(a).map(Number).find(k=>k!==n&&a[k]===letter);if(other){askReassign(letter,other,n,a[n]||'');return}}commitChoice(n,letter)}
function commitChoice(n,letter,clear){let a=answersOf();if(clear)delete a[clear];a[n]=letter;write(storageKey(exam().id,part),a);renderQuestion();renderPassage(false);tabs();progressBar()}
/* Testu zatiak: each letter fits one gap only. When the student picks a letter already used in another gap,
   ask before moving it, so a slip of the finger never silently empties an earlier answer. */
function reassignDialog(){let d=$('reassignDialog');if(d)return d;d=document.createElement('div');d.id='reassignDialog';d.className='modal';d.hidden=true;d.setAttribute('role','alertdialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','reassignTitle');d.setAttribute('aria-describedby','reassignText');d.innerHTML='<div class="modal-card reassign-card" tabindex="-1"><span class="eyebrow">TESTU ZATIAK</span><h2 id="reassignTitle"></h2><p id="reassignText"></p><button type="button" id="reassignKeep" class="outline">Ez, utzi dagoen bezala</button><button type="button" id="reassignMove" class="primary"></button></div>';d.addEventListener('click',e=>{if(e.target===d)closeReassign()});document.body.append(d);$('reassignKeep').onclick=closeReassign;return d}
function askReassign(letter,from,to,previous){const d=reassignDialog(),columns=task().title.toLowerCase().includes('bi zutabeak lotu'),what=letter+(columns?' aukera':' zatia'),where=k=>k+(columns?'. galdera':'. hutsune'),emptyWhere=columns?from+'. galdera':from+'. hutsunea';$('reassignTitle').textContent=what+' erabilita dago';$('reassignText').textContent=what+' '+where(from)+'an jarri duzu jada. '+where(to)+'ra aldatu nahi duzu? Hala bada, '+emptyWhere+' erantzun gabe geratuko da'+(previous?' eta '+where(to)+'ko '+previous+(columns?' aukera':' zatia')+' kenduko da.':'.');$('reassignMove').textContent='Bai, '+where(to)+'ra aldatu';$('reassignMove').onclick=()=>{closeReassign();commitChoice(to,letter,from);toast(what+' '+where(to)+'ra aldatuta · '+emptyWhere+' hutsik')};showDialog('reassignDialog');requestAnimationFrame(()=>$('reassignKeep').focus())}
function closeReassign(){if($('reassignDialog')&&!$('reassignDialog').hidden)hideDialog('reassignDialog')}
function resetPart(){if(!confirm('Ariketa honetako erantzunak ezabatu?'))return;window.SustraiCloud.storage.removeItem(storageKey(exam().id,part));graded[part]=false;render(false);toast('Erantzunak ezabatuta')}
async function correct(){
 if(requestedMode()==='simulation'&&!timer().done){toast('Simulazioan ezin da ariketa zuzendu amaitu aurretik.');return}
 const e=exam(),n=part;
 try{await srGrade(e,answersOf,{mode:requestedMode()});if(e!==exam())return;graded[n]=true;renderQuestion();const it=e.items[n],a=answersOf(n);let ok=0;for(let k=it.r[0];k<=it.r[1];k++)if(srIsCorrect(it,k,a[k]))ok++;toast('Ariketa zuzenduta: '+ok+' / '+numberOf(it)+' zuzen');$('numbers').scrollIntoView({block:'nearest',behavior:'smooth'})}
 catch(error){console.error(error);toast('Ezin izan da zuzendu: saiatu berriro')}
}
function progressBar(){let p=progress(),total=totalOf(exam());$('progressLabel').textContent=p+'/'+total+' erantzunda';$('trackfill').style.width=(100*p/total)+'%';$('progress').setAttribute('aria-valuemax',String(total));$('progress').setAttribute('aria-valuenow',String(p));$('progress').setAttribute('aria-valuetext',p+' galdera erantzunda, '+total+'etik')}
function tabs(){let content='';exam().items.forEach((it,i)=>{let a=answersOf(i),done=Object.keys(a).filter(n=>+n>=it.r[0]&&+n<=it.r[1]&&a[n]).length;content+='<button class="tab '+(i===part?'active':'')+'" data-part="'+i+'" aria-pressed="'+(i===part)+'">'+(i+1)+'. '+(it.type==='fill'?'Hutsuneak':it.type==='mcq'?'Ulermena':'Testu zatiak')+' <small>'+done+'/'+numberOf(it)+'</small></button>'});$('tabs').innerHTML=content;document.querySelectorAll('[data-part]').forEach(b=>b.onclick=()=>selectPart(+b.dataset.part))}
function marked(content,area){let ms=visible?highlights().filter(m=>m.area===area).sort((a,b)=>a.start-b.start):[];let index=0,out='';for(let m of ms){if(m.start<index||m.start<0||m.end>content.length||m.end<=m.start)continue;out+=htmlEscape(content.slice(index,m.start))+'<mark class="highlit" style="background:'+colors[m.color]+'">'+htmlEscape(content.slice(m.start,m.end))+'</mark>';index=m.end}return out+htmlEscape(content.slice(index))}
function paragraphs(input){
 const source=String(input).replace(/\r\n?/g,'\n').trim();
 if(!source)return [];
 // Real document boundaries take priority over visual wrapping.
 const originalBlocks=source.split(/\n\s*\n/u).map(s=>s.trim()).filter(Boolean);
 if(originalBlocks.length>1)return originalBlocks;
 // Some imported source PDFs lost their line breaks but kept numbered paragraphs.
 const numbered=source.split(/(?<=[.!?])\s+(?=\d{1,2}\.\s+\p{Lu})/u);
 if(numbered.length>1)return numbered.map(s=>s.trim()).filter(Boolean);
 // Legacy layout for source texts with no explicit paragraph boundaries.
 const parts=source.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÜÑ«])/u),out=[];
 let p='';
 for(const s of parts){if(p.length>520){out.push(p.trim());p=''}p+=(p?' ':'')+s}
 if(p.trim())out.push(p.trim());
 return out;
}

function readingLayout(it){
 const title=String(it.title||'').replace(/\s*·\s*(?:lotu bi zutabeak|bi zutabeak lotu)\s*$/iu,'').trim();
 const source=String(it.p||'').trim();
 const words=title.match(/[\p{L}\p{N}]+/gu)||[];
 if(!words.length)return {title,body:source};
 const titlePattern=new RegExp(words.join('[\\s\\p{P}\\p{S}]+')+'(?=\\s|$|\\p{P})','iu');
 let end=0;
 const numberPrefix=source.match(/^\d{1,2}\.\s*testua\s*/iu);
 if(numberPrefix){
   const start=numberPrefix[0].length,remaining=source.slice(start),match=titlePattern.exec(remaining);
   if(match&&(match.index===0||(/^Egitekoa\b/iu.test(remaining)&&match.index<650)))end=start+match.index+match[0].length;
   if(!end&&title==='Eliten bestaldean, mundua'){
     const variant=remaining.match(/^Eliteen bestaldean,\s*mundua\b/iu);
     if(variant)end=start+variant[0].length;
   }
 }else{
   const match=titlePattern.exec(source);
   if(match&&match.index===0&&(words.length>1||match[0]===match[0].toLocaleUpperCase('eu')))end=match[0].length;
   if(!end&&title.length>=5&&source.toLocaleLowerCase('eu').startsWith(title.slice(1).toLocaleLowerCase('eu')))end=title.length-1;
 }
 return {title,body:end?source.slice(end).replace(/^[\s.!?:;·—-]+/u,'').trimStart():source};
}

function renderPassage(reset=false){let scroll=$('readingPanel').querySelector('.paperscroll'),pos=reset?0:scroll.scrollTop,it=task(),a=answersOf(),segment=0,doc=readingLayout(it),content='<h2 class="document-title">'+htmlEscape(doc.title)+'</h2>';for(let text of paragraphs(doc.body)){content+='<p>';for(let token of text.split(/(\{\{\d+\}\})/g)){let m=token.match(/^\{\{(\d+)\}\}$/);if(m){let n=+m[1],letter=a[n]||'',choice=letter?(it.type==='fill'?it.opts[n][letters.indexOf(letter)]:letter):'···';content+='<button class="hole '+(n===current?'active ':'')+(letter?'answered':'')+'" data-gap="'+n+'">'+n+' · '+htmlEscape(choice)+'</button>'}else if(token){let area='a'+segment++;content+='<span class="selectable" data-area="'+area+'">'+marked(token,area)+'</span>'}}content+='</p>'}$('passage').innerHTML=content;document.querySelectorAll('[data-gap]').forEach(b=>b.onclick=()=>selectQuestion(+b.dataset.gap));scroll.scrollTop=pos}
function renderQuestion(){let it=task(),a=answersOf(),n=current,index=n-it.r[0],q=it.type==='mcq'?it.qs[index]:null,choices=it.type==='mcq'?q.o:it.type==='fill'?it.opts[n]:it.opts,labels=Array.isArray(choices)?letters.slice(0,choices.length).split(''):Object.keys(choices).sort(),vals=Array.isArray(choices)?choices:labels.map(l=>choices[l]);$('qcounter').textContent='GALDERA '+n+' · '+(index+1)+' / '+numberOf(it);$('qtitle').textContent=it.title;
 let question=it.type==='mcq'?q.q:it.type==='fill'?'Hutsuneari dagokion hitza aukeratu.':it.title.toLowerCase().includes('bi zutabeak lotu')?'Lotu 1. zutabeko esaldia 2. zutabeko aukera egokiarekin. Aukera bat sobera dago.':'Testuko hutsuneari dagokion zatia aukeratu. Aukera bat sobera dago.';$('questionText').innerHTML='<span class="selectable" data-area="q'+n+'">'+marked(question,'q'+n)+'</span>';
 $('options').innerHTML=labels.map((l,j)=>{let chosen=a[n]===l,isCorrect=graded[part]&&(srAccepted(it,n).includes(l)||(chosen&&srIsCorrect(it,n,l))),isWrong=graded[part]&&chosen&&!isCorrect,area='c'+n+l;return '<div class="choice '+(chosen?'chosen ':'')+(isCorrect?'correct ':'')+(isWrong?'wrong':'')+'" data-choice="'+l+'"><button class="choose" data-letter="'+l+'" aria-label="'+l+' aukera" aria-pressed="'+chosen+'">'+l+'</button><span class="selectable" data-area="'+area+'">'+marked(vals[j],area)+'</span></div>'}).join('');
 document.querySelectorAll('.choose').forEach(b=>b.onclick=()=>{if(activeMarker)return;choose(b.dataset.letter)});document.querySelectorAll('.choice').forEach(b=>b.onclick=e=>{if(activeMarker||e.target.closest('button')||window.getSelection()?.toString())return;choose(b.dataset.choice)});
 $('prev').disabled=n===it.r[0];$('next').disabled=n===it.r[1];
 $('numbers').innerHTML=Array.from({length:numberOf(it)},(_,i)=>{let k=i+it.r[0],state=graded[part]?(!a[k]?'blank':srIsCorrect(it,k,a[k])?'ok':'bad'):'',label=k+(state==='ok'?', zuzena':state==='bad'?', okerra':state==='blank'?', erantzun gabe':'');return '<button data-q="'+k+'" aria-label="'+label+'" class="'+(k===n?'current ':'')+(a[k]?'done ':'')+window.SustraiResult.gridClass(state)+'">'+k+'</button>'}).join('');
 document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>selectQuestion(+b.dataset.q));
 $('gradeResult').innerHTML='';if(graded[part]){let good=0;for(let k=it.r[0];k<=it.r[1];k++)if(srIsCorrect(it,k,a[k]))good++;let note=exam().id==='2019-10-26'&&part===0&&current===2?'<small>Oharra: 2. galderako soluzioa ez dator bat argitaratutako bi iturri ofizialetan (C/D).</small>':'',selectedAnswer=a[n]||'Erantzun gabe',isCorrect=srIsCorrect(it,n,a[n]),errors=mistakeList(true);$('gradeResult').innerHTML='<div class="result">'+window.SustraiResult.partLine({correct:good,total:numberOf(it),points:good*weight(it),maxPoints:numberOf(it)*weight(it),blank:Array.from({length:numberOf(it)},(_,i)=>i+it.r[0]).filter(k=>!a[k]).length})+' <small>'+(isCorrect?'Galdera hau zuzen dago.':'Zure erantzuna: '+selectedAnswer+srSolutionHint(it,n,a[n],requestedMode()))+'</small>'+note+'<span class="learning-tip">'+learningTip(it)+'</span>'+(errors.length?'<button type="button" id="nextMistake" class="outline mistake-action">Hurrengo akatsa</button>':'')+'</div>';if($('nextMistake'))$('nextMistake').onclick=nextMistake}}
function render(reset=false){if(!exams.length)return;$('exam').value=exam().id;$('readingTitle').textContent=task().title;document.querySelector('.source-note').replaceChildren('Iturria: ',externalLink(exam().source,'IVAP · Azterketa ofiziala (A eredua) ↗'));tabs();progressBar();renderPassage(reset);renderQuestion();tick()}
function capture(){let selection=window.getSelection();if(!selection||selection.isCollapsed||!selection.rangeCount)return;let range=selection.getRangeAt(0),res=[];document.querySelectorAll('.selectable[data-area]').forEach(el=>{if(!range.intersectsNode(el))return;let whole=document.createRange();whole.selectNodeContents(el);let clipped=range.cloneRange();try{if(range.compareBoundaryPoints(Range.START_TO_START,whole)<0)clipped.setStart(whole.startContainer,whole.startOffset);if(range.compareBoundaryPoints(Range.END_TO_END,whole)>0)clipped.setEnd(whole.endContainer,whole.endOffset);let prefix=whole.cloneRange();prefix.setEnd(clipped.startContainer,clipped.startOffset);let start=prefix.toString().length,len=clipped.toString().length;if(len)res.push({area:el.dataset.area,start,end:start+len})}catch{}});if(res.length){pendingSelection=res;}}
function paint(color){capture();if(!pendingSelection.length){if(!activeMarker)toast('Hautatu hitz edo esaldi bat lehenik');return}let list=highlights();for(let s of pendingSelection){list=list.filter(m=>m.area!==s.area||m.end<=s.start||m.start>=s.end);list.push({...s,color})}write(highlightsKey(),list);pendingSelection=[];window.getSelection()?.removeAllRanges();renderPassage(false);renderQuestion();if(!activeMarker)toast('Marka gordeta')}
function erase(){capture();if(!pendingSelection.length){if(!activeMarker)toast('Hautatu ezabatu nahi duzun zatia');return}let list=highlights().filter(m=>!pendingSelection.some(s=>s.area===m.area&&s.start<m.end&&s.end>m.start));write(highlightsKey(),list);pendingSelection=[];window.getSelection()?.removeAllRanges();renderPassage(false);renderQuestion();if(!activeMarker)toast('Marka ezabatuta')}
async function start(){await window.SustraiCloud.ready;
 const mode=requestedMode();
 exams=(await srReadExams('IVAP')).sort((a,b)=>a.id.localeCompare(b.id));
 if(!exams.length)throw Error('Ez dago argitaratutako IVAP azterketarik');
 let ids=new Set;
 for(let e of exams){
   if(ids.has(e.id))throw Error('Bikoiztutako deialdia');ids.add(e.id);
   let count=totalOf(e),max=e.items.reduce((x,it)=>x+numberOf(it)*weight(it),0);
   if((count!==25&&count!==34)||Math.abs(max-20)>.01)throw Error('Galdera kopurua edo puntuazioa ez dira zuzenak: '+e.id);
   for(let it of e.items)if(it.key.length!==numberOf(it))throw Error('Ariketa osatu gabea: '+e.id);
 }
 $('exam').replaceChildren(...exams.map(e=>{const option=document.createElement('option');option.value=e.id;option.textContent=e.label+' · '+totalOf(e)+' galdera';return option}));
 let requestedExam=null;try{requestedExam=new URLSearchParams(location.search).get('exam')}catch{}let chosen=requestedExam||window.SustraiCloud.storage.getItem('sustrai-current-exam')||'2019-05-04',found=exams.findIndex(e=>e.id===chosen);ex=found>=0?found:0;current=task().r[0];
 $('exam').onchange=e=>selectExam(exams.findIndex(x=>x.id===e.target.value));if($('modePractice'))$('modePractice').onclick=()=>setWorkshopMode('practice');if($('modeSimulation'))$('modeSimulation').onclick=()=>setWorkshopMode('simulation');$('start').onclick=pauseToggle;$('finish').onclick=()=>{closeActions();finish()};$('prev').onclick=()=>step(-1);$('next').onclick=()=>step(1);$('grade').onclick=correct;$('resetEx').onclick=resetPart;$('markerTool').onclick=function(){closeActions();const open=$('markerbar').classList.toggle('visible');this.setAttribute('aria-expanded',String(open))};$('closeMarker').onclick=()=>{$('markerbar').classList.remove('visible');$('markerTool').setAttribute('aria-expanded','false');if(activeMarker)setActiveMarker(activeMarker)};$('actionsToggle').onclick=()=>{const open=$('timeActions').classList.toggle('expanded');$('actionsToggle').setAttribute('aria-expanded',String(open))};
 document.querySelectorAll('.swatch').forEach(b=>{b.addEventListener('pointerdown',e=>e.preventDefault());b.onclick=()=>pickMarker(b.dataset.color)});$('erase').addEventListener('pointerdown',e=>e.preventDefault());$('erase').onclick=()=>pickMarker('erase');const _markVis=$('markVisibility');_markVis.onclick=()=>{visible=!visible;_markVis.textContent=visible?'Ezkutatu':'Erakutsi';renderPassage(false);renderQuestion()};setupMarkerDrag();if($('exitFocus'))$('exitFocus').onclick=()=>{const t=timer();if(t.start){t.elapsed=elapsed(t);t.start=null;write(timerKey(),t);tick()}setFocusMode(false);toast('Kontzentrazio-modua itxita')};$('closeModal').onclick=closeSummary;$('dismissSummary').onclick=closeSummary;$('reviewMistakes').onclick=reviewMistakes;$('repeatExam').onclick=restart;$('attemptsOpen').onclick=showAttempts;$('compareAttempts').onclick=showAttempts;$('viewReading').onclick=()=>view('reading');$('viewQuestions').onclick=()=>view('questions');if($('sheetToggle'))$('sheetToggle').onclick=()=>view(document.body.classList.contains('view-questions')?'reading':'questions');document.addEventListener('selectionchange',()=>{if(activeMarker||brushStroke)return;if(window.getSelection()&&!window.getSelection().isCollapsed)requestAnimationFrame(capture)});setupBrushPaint();window.SustraiMarkerBar.touchAutoApply(()=>activeMarker,tool=>{if(tool==='erase')erase();else paint(tool)});document.addEventListener('keydown',event=>{trapDialog(event);if(event.key==='Escape'){if($('reassignDialog')&&!$('reassignDialog').hidden)closeReassign();else if(!$('modal').hidden)closeSummary()}});render(true);setLoading(false);chooseMode(mode);syncFocusFromTimer();setInterval(tick,500)}
start().catch(error=>{console.error(error);setLoading(false);$('readingTitle').textContent='Ezin izan da aplikazioa kargatu';$('passage').innerHTML='<div class="load-error"><strong>Ezin izan dira azterketak kargatu.</strong><p>'+htmlEscape(error.message)+'</p><button id="retryLoad" type="button">Saiatu berriro</button></div>';$('retryLoad').onclick=()=>location.reload()});
