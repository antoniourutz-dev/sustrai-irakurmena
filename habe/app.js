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
 if(window.SustraiExamName)return window.SustraiExamName.name(organism,id,label);
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
      const correct=new Map(),pedagogical=new Map();
      for(const row of result.items){
        const pos=Number(row?.position),n=Number(row?.n),accepted=row?.accepted??null;
        const item=activeExam.items[pos-1];
        if(!Number.isInteger(pos)||!item||!Number.isInteger(n)||n<item.r[0]||n>item.r[1])throw new Error('Ezin izan dira erantzunak zuzendu');
        if(accepted!==null&&(!Array.isArray(accepted)||!accepted.length||accepted.some(letter=>typeof letter!=='string'||!SR_LETTER.test(letter))))throw new Error('Ezin izan dira erantzunak zuzendu');
        if(accepted===null&&typeof row?.correct!=='boolean')throw new Error('Ezin izan dira erantzunak zuzendu');
        const given=byPart[String(pos)]?.[n]||'';
        if(!correct.has(pos))correct.set(pos,new Map());
        correct.get(pos).set(n,{accepted:accepted?accepted.slice():null,answer:given,correct:typeof row?.correct==='boolean'?row.correct:accepted.includes(given)});
        if(given&&row.explanation&&typeof row.explanation.reason==='string'&&row.explanation.reason.length<=12000){
          if(!pedagogical.has(pos))pedagogical.set(pos,{});
          pedagogical.get(pos)[n]=row.explanation;
        }
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
        it.explanations={...(it.explanations||{}),...(pedagogical.get(index+1)||{})};
      });
      return result;
    }).finally(()=>srAwaiting.delete(requestKey));
   srAwaiting.set(requestKey,work);
 }
 return await srAwaiting.get(requestKey);
}
const $=s=>document.getElementById(s),L="ABCD",COLORS={yellow:"#ffe174",green:"#a9e8bd",pink:"#f7bed5",blue:"#b2dbff"};

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
 const list=marks().filter(m=>!(m.area===span.area&&m.start<span.end&&m.end>span.start));
 save(markKey(),list);
 window.getSelection()?.removeAllRanges();
 renderPassage(false);renderQuestion();
}
function finishBrushStroke(){
 if(!brushStroke||!activeMarker){brushStroke=null;return}
 const moved=brushStroke.moved;
 brushStroke=null;
 if(!moved)return;
 captureSelection();
 if(!lastSelection.length)return;
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
  captureSelection();
  if(!lastSelection.length)return;
  paint(activeMarker);
 },true);
}


function setLoading(isLoading){document.body.classList.toggle('loading',isLoading);document.body.setAttribute('aria-busy',String(isLoading))}
function externalLink(href,label){const link=document.createElement('a');link.href=href;link.target='_blank';link.rel='noopener';link.textContent=label;return link}
const read=(k,f)=>{try{let x=JSON.parse(window.SustraiCloud.storage.getItem(k));return x===null?f:x}catch{return f}},save=(k,v)=>{try{window.SustraiCloud.storage.setItem(k,JSON.stringify(v))}catch{}};
const escapeText=v=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let exams=[],examIndex=0,part=0,current=1,graded={},markVisible=true,lastSelection=[],toastCounter=0,activeDialog=null,dialogReturnFocus=null;
const exam=()=>exams[examIndex],task=()=>exam().items[part],count=it=>it.r[1]-it.r[0]+1;
const answerKey=(i=part)=>requestedMode()==="simulation"?"sustrai-habe-sim-answers-v1-"+exam().id+"-"+i:"sustrai-habe-"+exam().id+"-answers-"+i,answers=(i=part)=>read(answerKey(i),{});
const markKey=()=>"sustrai-habe-"+exam().id+"-marks-"+part,marks=()=>read(markKey(),[]);
const timerKey=()=>requestedMode()==="simulation"?"sustrai-habe-sim-timer-v1-"+exam().id:"sustrai-habe-"+exam().id+"-timer",timer=()=>read(timerKey(),{elapsed:0,start:null,done:false});
const elapsed=t=>Math.max(0,(t.elapsed||0)+(t.start?Date.now()-t.start:0)),formatTime=ms=>{let s=Math.floor(ms/1000);return [Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(n=>String(n).padStart(2,'0')).join(':')};
const answered=()=>exam().items.reduce((v,it,i)=>{let a=answers(i);return v+Object.keys(a).filter(n=>+n>=it.r[0]&&+n<=it.r[1]&&a[n]).length},0);
function showDialog(id){dialogReturnFocus=document.activeElement;activeDialog=$(id);activeDialog.hidden=false;requestAnimationFrame(()=>activeDialog.querySelector('.modal-card')?.focus())}
function hideDialog(id){const dialog=$(id);dialog.hidden=true;if(activeDialog===dialog)activeDialog=null;if(dialogReturnFocus instanceof HTMLElement&&!dialogReturnFocus.closest('[hidden]'))dialogReturnFocus.focus();dialogReturnFocus=null}
function trapDialog(event){if(!activeDialog||event.key!=='Tab')return;const focusable=[...activeDialog.querySelectorAll('button:not([disabled]):not([hidden]),a[href],select,[tabindex]:not([tabindex="-1"])')].filter(element=>!element.closest('[hidden]'));if(!focusable.length)return;const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&(document.activeElement===first||!focusable.includes(document.activeElement))){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}
function closeActions(){$('timeActions').classList.remove('expanded');$('actionsToggle').setAttribute('aria-expanded','false')}
function syncModeButtons(mode){document.body.classList.toggle('mode-sim',mode==='simulation');const sb=$('start');if(sb)sb.title=mode==='simulation'?'':'Kronometroa aukerakoa da praktikan';
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
function chooseMode(mode){$('grade').hidden=mode==='simulation'&&!timer().done;syncModeButtons(mode);$('modeBadge').textContent=mode==='simulation'?'Simulazioa':'Praktika librea';if(mode==='simulation'){const t=timer();if(!t.done&&!t.start){t.start=Date.now();save(timerKey(),t);updateTimer();syncFocusFromTimer();toast('Simulazioa · kontzentrazio-modua')}}else syncFocusFromTimer()}
function requestedMode(){const mode=new URLSearchParams(location.search).get('mode');return mode==='simulation'?'simulation':'practice'}
function mistakeList(gradedOnly=false){const list=[];exam().items.forEach((it,index)=>{if(gradedOnly&&!graded[index])return;const selected=answers(index);for(let n=it.r[0];n<=it.r[1];n++)if(!srIsCorrect(it,n,selected[n]))list.push({part:index,n})});return list}
function learningTip(it){if(it.type==='fill')return'Berrirakurri esaldi osoa eta egiaztatu gramatika-loturak.';if(it.type==='mcq')return'Bilatu testuan aukera zuzena frogatzen duen esaldia.';return'Konparatu hitzaren esanahia esaldiaren testuinguruarekin.'}
function reviewMistakes(){const errors=mistakeList();if(!errors.length){toast('Ez dago berrikusteko akatsik');return}graded=Object.fromEntries(exam().items.map((_,index)=>[index,true]));part=errors[0].part;current=errors[0].n;dismiss();render(true);setView('questions');$('qtitle').focus()}
function nextMistake(){const errors=mistakeList(true),index=errors.findIndex(error=>error.part===part&&error.n===current),target=errors[(index+1+errors.length)%errors.length];if(!target)return;part=target.part;current=target.n;render(true);setView('questions')}
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');let n=++toastCounter;setTimeout(()=>{if(n===toastCounter)$('toast').classList.remove('show')},2000)}
function updateTimer(){if(!exams.length)return;let t=timer();$('clock').textContent=formatTime(elapsed(t));$('clock').title="HABE C1 · 60 minutu gomendatuak";$('start').textContent=t.done?'Amaituta':t.start?'Pausatu':t.elapsed?'Jarraitu':'Hasi';$('start').disabled=!!t.done;$('finish').disabled=!!t.done;$('timehint').textContent=t.done?'Denbora gordeta':t.start?'Martxan':'60 min gomendatuak'}
function toggleTimer(){let t=timer();if(t.done)return;if(t.start){t.elapsed=elapsed(t);t.start=null;toast('Kronometroa pausatuta')}else{t.start=Date.now();toast('Kontzentrazio-modua: kronometroa martxan')}save(timerKey(),t);updateTimer();syncFocusFromTimer()}
function score(){let ok=0,points=0;exam().items.forEach((it,i)=>{let a=answers(i);for(let n=it.r[0];n<=it.r[1];n++)if(srIsCorrect(it,n,a[n])){ok++;points+=it.weight}});return {ok,points:Math.round(points*10)/10}}
function clientAttemptKey(){const key='sustrai-client-attempt-v1-'+exam().id+'-'+requestedMode();let value=window.SustraiCloud.storage.getItem(key);if(!value){value='sustrai-'+crypto.randomUUID();window.SustraiCloud.storage.setItem(key,value)}return value}
async function finishExam(){
 const e=exam(),missing=30-answered();
 if(missing&&!confirm(missing+' galdera erantzun gabe daude. Amaitu azterketa?'))return;
 try{
   const t=timer(),startElapsed=elapsed(t);
   await srGrade(e,answers,{finalize:true,elapsedSeconds:Math.min(86400,Math.floor(startElapsed/1000)),clientAttemptKey:clientAttemptKey(),mode:requestedMode()});
   if(e!==exam())return;
   if(!t.done){
     t.elapsed=startElapsed;t.start=null;t.done=true;save(timerKey(),t);
     const s=score(),k='sustrai-habe-'+e.id+'-attempts',arr=read(k,[]);
     arr.push({at:new Date().toISOString(),time:t.elapsed,score:s.points,correct:s.ok,mode:requestedMode(),sheet:window.SustraiAttempts.sheetOf(attemptParts(),answers,(index,n,letter)=>srIsCorrect(e.items[index],n,letter))});
     save(k,arr.slice(-40));
   }
   setFocusMode(false);$('grade').hidden=false;showSummary();updateTimer();
 }catch(error){console.error(error);toast('Ezin izan da zuzendu: saiatu berriro')}
}
function resultData(){const e=exam(),t=timer(),h=read('sustrai-habe-'+e.id+'-attempts',[]),old=h.length>1?h.at(-2):null;let correct=0,wrong=0,blank=0,score=0,max=0,total=0;
 const parts=e.items.map((it,index)=>{const a=answers(index),w=it.weight;let c=0,x=0,b=0;for(let n=it.r[0];n<=it.r[1];n++){if(!a[n])b++;else if(srIsCorrect(it,n,a[n]))c++;else x++}correct+=c;wrong+=x;blank+=b;total+=count(it);score+=c*w;max+=count(it)*w;return{type:it.type,title:it.title,correct:c,total:count(it),wrong:x,blank:b,points:c*w,maxPoints:count(it)*w,tip:learningTip(it)}});
 const ms=elapsed(t);return{score:Math.round(score*10)/10,max:Math.round(max*10)/10,pass:10,correct,total,wrong,blank,elapsedMs:ms>0?ms:null,previous:old?{score:old.score,elapsedMs:old.time}:null,parts,mode:requestedMode()}}
function showSummary(){const d=resultData(),errors=mistakeList();$('summary').innerHTML=window.SustraiResult.summary(d);$('reviewMistakes').hidden=!errors.length;$('reviewMistakes').textContent='Akatsak berrikusi ('+errors.length+')';showDialog('modal')}
function dismiss(){hideDialog('modal')}
function attemptParts(){const names=["Ulermena","Ulermena","Hutsuneak","Baliokideak"];return exam().items.map((it,index)=>({label:(index+1)+'. ariketa · '+(names[index]||''),from:it.r[0],to:it.r[1]}))}
function showAttempts(){const e=exam();if(!$('modal').hidden)dismiss();window.SustraiAttempts.show({examTitle:'HABE · '+e.id,total:30,parts:attemptParts(),attempts:read('sustrai-habe-'+e.id+'-attempts',[]).map(a=>({...a,elapsedMs:a.time})),onRepeat:restart})}
function restart(){if(!confirm("Erantzunak eta kronometroa berrabiarazi? Markak mantenduko dira."))return;window.SustraiCloud.storage.removeItem("sustrai-client-attempt-v1-"+exam().id+"-"+requestedMode());exam().items.forEach((it,i)=>window.SustraiCloud.storage.removeItem(answerKey(i)));window.SustraiCloud.storage.removeItem(timerKey());graded={};current=task().r[0];dismiss();render(true);toast("Berrabiarazita")}
function setView(view){const questions=view==='questions';document.body.classList.toggle('view-questions',questions);$('viewReading').classList.toggle('on',!questions);$('viewQuestions').classList.toggle('on',questions);$('viewReading').setAttribute('aria-pressed',String(!questions));$('viewQuestions').setAttribute('aria-pressed',String(questions));if($('sheetToggle'))$('sheetToggle').setAttribute('aria-expanded',String(questions))}
function pickExam(n){examIndex=n;part=0;current=task().r[0];graded={};lastSelection=[];try{window.SustraiCloud.storage.setItem('sustrai-habe-active',exam().id)}catch{}render(true);setView('reading')}
function pickPart(n){part=n;current=task().r[0];lastSelection=[];render(true);setView('reading')}
function pickQuestion(n){current=n;renderQuestion();setView('questions')}
function step(n){current=Math.max(task().r[0],Math.min(task().r[1],current+n));renderQuestion()}
function choose(letter){let a=answers();a[current]=letter;save(answerKey(),a);renderQuestion();renderPassage(false);renderTabs();renderProgress()}
function clearPart(){if(!confirm("Ariketa honetako erantzunak garbitu?"))return;window.SustraiCloud.storage.removeItem(answerKey());graded[part]=false;render(false);toast("Erantzunak garbituta")}
function renderProgress(){let c=answered();$('progressLabel').textContent=c+'/30 erantzunda';$('trackfill').style.width=(100*c/30)+'%';$('progress').setAttribute('aria-valuenow',String(c));$('progress').setAttribute('aria-valuetext',c+' galdera erantzunda, 30etik')}
function renderTabs(){const names=["Ulermena","Ulermena","Hutsuneak","Baliokideak"];$('tabs').innerHTML=exam().items.map((it,i)=>{let a=answers(i),done=Object.keys(a).filter(n=>+n>=it.r[0]&&+n<=it.r[1]&&a[n]).length;return '<button data-part="'+i+'" class="tab '+(i===part?'active':'')+'" aria-pressed="'+(i===part)+'">'+(i+1)+'. '+names[i]+' <small>'+done+'/'+count(it)+'</small></button>'}).join('');document.querySelectorAll('[data-part]').forEach(el=>el.onclick=()=>pickPart(+el.dataset.part))}
function highlighted(content,area){let sections=markVisible?marks().filter(m=>m.area===area).sort((a,b)=>a.start-b.start):[],prev=0,out='';for(let m of sections){if(m.start<prev||m.end>content.length||m.end<=m.start)continue;out+=escapeText(content.slice(prev,m.start))+'<mark class="highlit" style="background:'+COLORS[m.color]+'">'+escapeText(content.slice(m.start,m.end))+'</mark>';prev=m.end}return out+escapeText(content.slice(prev))}
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
 for(const s of parts){if(p.length>470){out.push(p.trim());p=''}p+=(p?' ':'')+s}
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

function renderPassage(reset){let sc=$('readingPanel').querySelector('.paperscroll'),y=reset?0:sc.scrollTop,it=task(),a=answers(),section=0,doc=readingLayout(it),html='<h2 class="document-title">'+escapeText(doc.title)+'</h2>';for(let paragraph of paragraphs(doc.body)){html+='<p>';for(let part of paragraph.split(/(\{\{\d+\}\})/g)){let match=part.match(/^\{\{(\d+)\}\}$/);if(match){let n=+match[1],v=a[n],label=v?(it.type==="fill"?it.opts[n][L.indexOf(v)]:v):'···';html+='<button class="hole '+(n===current?'active ':'')+(v?'answered':'')+'" data-gap="'+n+'">'+n+' · '+escapeText(label)+'</button>'}else if(part){let area='a'+section++;html+='<span class="selectable" data-area="'+area+'">'+highlighted(part,area)+'</span>'}}html+='</p>'}$('passage').innerHTML=html;document.querySelectorAll('[data-gap]').forEach(el=>el.onclick=()=>pickQuestion(+el.dataset.gap));sc.scrollTop=y}
function targetWord(it,n){let p=it.p,i=p.indexOf('{{'+n+'}}');if(i<0)return'';let left=p.slice(Math.max(0,i-45),i).trim();let m=left.match(/([A-Za-zÀ-ÿ\-]+)$/);return m?m[1]:left.slice(-25)}
function renderQuestion(){let it=task(),n=current,a=answers(),idx=n-it.r[0],q=it.type==="mcq"?it.qs[idx]:null,opts=it.type==="mcq"?q.o:it.opts[n],prompt=it.type==="mcq"?q.q:it.type==="fill"?"Hutsunerako hitz edo esaldi egokia aukeratu.":"Aukeratu testuko «"+targetWord(it,n)+"» hitzaren baliokidea.";$('qcounter').textContent='GALDERA '+n+' · '+(idx+1)+' / '+count(it);$('qtitle').textContent=it.title;$('questionText').innerHTML='<span class="selectable" data-area="q'+n+'">'+highlighted(prompt,'q'+n)+'</span>'+(it.type!=='mcq'&&window.SustraiReading?window.SustraiReading.gapContext(it.p,n,it.type==='fill'?{kind:'gap',filled:a[n]?opts[L.indexOf(a[n])]:''}:{kind:'word'}):'');$('options').innerHTML=opts.map((v,i)=>{let l=L[i],selected=a[n]===l,correct=graded[part]&&(srAccepted(it,n).includes(l)||(selected&&srIsCorrect(it,n,l))),wrong=graded[part]&&selected&&!correct;return '<div class="choice '+(selected?'chosen ':'')+(correct?'correct ':'')+(wrong?'wrong':'')+'" data-choice="'+l+'"><button class="choose" data-letter="'+l+'" aria-label="'+l+' aukera" aria-pressed="'+selected+'">'+l+'</button><span class="selectable" data-area="c'+n+l+'">'+highlighted(v,'c'+n+l)+'</span></div>'}).join('');document.querySelectorAll('.choose').forEach(b=>b.onclick=()=>{if(activeMarker)return;choose(b.dataset.letter)});document.querySelectorAll('.choice').forEach(b=>b.onclick=e=>{if(activeMarker||e.target.closest('button')||window.getSelection()?.toString())return;choose(b.dataset.choice)});$('prev').disabled=n===it.r[0];$('next').disabled=n===it.r[1];$('numbers').innerHTML=Array.from({length:count(it)},(_,i)=>{let z=i+it.r[0],state=graded[part]?(!a[z]?'blank':srIsCorrect(it,z,a[z])?'ok':'bad'):'',label=z+(state==='ok'?', zuzena':state==='bad'?', okerra':state==='blank'?', erantzun gabe':'');return '<button aria-label="'+label+'" class="'+(current===z?'current ':'')+(a[z]?'done ':'')+window.SustraiResult.gridClass(state)+'" data-number="'+z+'">'+z+'</button>'}).join('');document.querySelectorAll('[data-number]').forEach(b=>b.onclick=()=>pickQuestion(+b.dataset.number));$('gradeResult').innerHTML='';if(graded[part]){let num=0;for(let z=it.r[0];z<=it.r[1];z++)if(srIsCorrect(it,z,a[z]))num++;let selectedAnswer=a[n]||'Erantzun gabe',isCorrect=srIsCorrect(it,n,a[n]),errors=mistakeList(true);$('gradeResult').innerHTML='<div class="result">'+window.SustraiResult.partLine({correct:num,total:count(it),points:num*it.weight,maxPoints:count(it)*it.weight,blank:Array.from({length:count(it)},(_,i)=>i+it.r[0]).filter(k=>!a[k]).length})+'<small>'+(isCorrect?'Galdera hau zuzen dago.':'Zure erantzuna: '+selectedAnswer+srSolutionHint(it,n,a[n],requestedMode()))+'</small><span class="learning-tip">'+learningTip(it)+'</span>'+(errors.length?'<button type="button" id="nextMistake" class="outline mistake-action">Hurrengo akatsa</button>':'')+'</div>';if($('nextMistake'))$('nextMistake').onclick=nextMistake}
 if(graded[part]&&requestedMode()==='practice'&&a[n]&&it.explanations?.[n])
   window.SustraiExplanation?.append($('gradeResult'),it.explanations[n]);
}
function render(reset=true){if(!exams.length)return;$('exam').value=exam().id;$('readingTitle').textContent=(part+1)+'. ariketa · '+task().title;const links=[externalLink(exam().source,'HABEko jatorrizko PDFa ↗')];if(exam().solution)links.push(' · ',externalLink(exam().solution,'Erantzun ofizialak ↗'));$('sourceNote').replaceChildren(...links);renderTabs();renderProgress();renderPassage(reset);renderQuestion();updateTimer()}
function captureSelection(){let s=window.getSelection();if(!s||s.isCollapsed||!s.rangeCount)return;let range=s.getRangeAt(0),saved=[];document.querySelectorAll('.selectable[data-area]').forEach(el=>{if(!range.intersectsNode(el))return;let full=document.createRange();full.selectNodeContents(el);let part=range.cloneRange();try{if(range.compareBoundaryPoints(Range.START_TO_START,full)<0)part.setStart(full.startContainer,full.startOffset);if(range.compareBoundaryPoints(Range.END_TO_END,full)>0)part.setEnd(full.endContainer,full.endOffset);let before=full.cloneRange();before.setEnd(part.startContainer,part.startOffset);let len=part.toString().length;if(len)saved.push({area:el.dataset.area,start:before.toString().length,end:before.toString().length+len})}catch{}});if(saved.length){lastSelection=saved;}}
function paint(color){captureSelection();if(!lastSelection.length){if(!activeMarker)toast('Hautatu hitz edo esaldi bat');return}let a=marks();for(let s of lastSelection){a=a.filter(m=>m.area!==s.area||m.end<=s.start||m.start>=s.end);a.push({...s,color})}save(markKey(),a);lastSelection=[];window.getSelection()?.removeAllRanges();renderPassage(false);renderQuestion();if(!activeMarker)toast('Marka gordeta')}
function erase(){captureSelection();if(!lastSelection.length){if(!activeMarker)toast('Hautatu ezabatu beharreko marka');return}save(markKey(),marks().filter(m=>!lastSelection.some(s=>s.area===m.area&&s.start<m.end&&s.end>m.start)));lastSelection=[];window.getSelection()?.removeAllRanges();renderPassage(false);renderQuestion();if(!activeMarker)toast('Marka ezabatuta')}
async function initialize(){await window.SustraiCloud.ready;const mode=requestedMode();exams=await srReadExams('HABE');if(!exams.length||exams.some(e=>!e.items.length||e.items.some(it=>it.key.length!==count(it))||Math.abs(e.items.reduce((n,it)=>n+count(it)*it.weight,0)-20)>0.001))throw Error('HABEko azterketak osatu gabe daude');window.SustraiExamName.fillSelect($('exam'),exams,e=>e.items.reduce((n,it)=>n+it.r[1]-it.r[0]+1,0));;let requestedExam=null;try{requestedExam=new URLSearchParams(location.search).get('exam')}catch{}let id=requestedExam||window.SustraiCloud.storage.getItem('sustrai-habe-active')||exams.at(-1).id;examIndex=Math.max(0,exams.findIndex(e=>e.id===id));if(examIndex<0)examIndex=0;current=task().r[0];$('exam').onchange=e=>pickExam(exams.findIndex(x=>x.id===e.target.value));if($('modePractice'))$('modePractice').onclick=()=>setWorkshopMode('practice');if($('modeSimulation'))$('modeSimulation').onclick=()=>setWorkshopMode('simulation');$('start').onclick=toggleTimer;$('finish').onclick=()=>{closeActions();finishExam()};$('prev').onclick=()=>step(-1);$('next').onclick=()=>step(1);$('grade').onclick=async()=>{if(requestedMode()==='simulation'&&!timer().done){toast('Simulazioan ezin da ariketa zuzendu amaitu aurretik.');return}const e=exam(),p=part;try{await srGrade(e,answers,{mode:requestedMode()});if(e!==exam())return;graded[p]=true;renderQuestion();const it=e.items[p],a=answers(p);let ok=0;for(let k=it.r[0];k<=it.r[1];k++)if(srIsCorrect(it,k,a[k]))ok++;toast('Ariketa zuzenduta: '+ok+' / '+count(it)+' zuzen');$('numbers').scrollIntoView({block:'nearest',behavior:'smooth'})}catch(error){console.error(error);toast('Ezin izan da zuzendu: saiatu berriro')}};$('resetEx').onclick=clearPart;$('markerTool').onclick=function(){closeActions();let v=$('markerbar').classList.toggle('visible');this.setAttribute('aria-expanded',String(v))};$('closeMarker').onclick=()=>{$('markerbar').classList.remove('visible');$('markerTool').setAttribute('aria-expanded','false');if(activeMarker)setActiveMarker(activeMarker)};$('actionsToggle').onclick=()=>{const open=$('timeActions').classList.toggle('expanded');$('actionsToggle').setAttribute('aria-expanded',String(open))};document.querySelectorAll('.swatch').forEach(b=>{b.onpointerdown=e=>e.preventDefault();b.onclick=()=>pickMarker(b.dataset.color)});$('erase').addEventListener('pointerdown',e=>e.preventDefault());$('erase').onclick=()=>pickMarker('erase');const _mv=$('markVisibility');_mv.onclick=()=>{markVisible=!markVisible;_mv.textContent=markVisible?'Ezkutatu':'Erakutsi';renderPassage(false);renderQuestion()};setupMarkerDrag();if($('exitFocus'))$('exitFocus').onclick=()=>{const t=timer();if(t.start){t.elapsed=elapsed(t);t.start=null;save(timerKey(),t);updateTimer()}setFocusMode(false);toast('Kontzentrazio-modua itxita')};$('closeModal').onclick=dismiss;$('dismissSummary').onclick=dismiss;$('reviewMistakes').onclick=reviewMistakes;$('repeatExam').onclick=restart;$('attemptsOpen').onclick=showAttempts;$('compareAttempts').onclick=showAttempts;$('viewReading').onclick=()=>setView('reading');$('viewQuestions').onclick=()=>setView('questions');if($('sheetToggle'))$('sheetToggle').onclick=()=>setView(document.body.classList.contains('view-questions')?'reading':'questions');document.addEventListener('selectionchange',()=>{if(activeMarker||brushStroke)return;if(window.getSelection()&&!window.getSelection().isCollapsed)requestAnimationFrame(captureSelection)});setupBrushPaint();window.SustraiMarkerBar.touchAutoApply(()=>activeMarker,tool=>{if(tool==='erase')erase();else paint(tool)});document.addEventListener('keydown',event=>{trapDialog(event);if(event.key==='Escape'&&!$('modal').hidden)dismiss()});render(true);setLoading(false);chooseMode(mode);syncFocusFromTimer();setInterval(updateTimer,500)}
initialize().catch(e=>{console.error(e);setLoading(false);$('readingTitle').textContent='Ezin izan da kargatu';$('passage').innerHTML='<div class="load-error"><strong>Ezin izan dira azterketak kargatu.</strong><p>'+escapeText(e.message)+'</p><button id="retryLoad" type="button">Saiatu berriro</button></div>';$('retryLoad').onclick=()=>location.reload()});
