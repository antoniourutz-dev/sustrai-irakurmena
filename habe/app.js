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
 const result=await fetch(SR_URL+path,{method:'POST',headers:SR_HEADERS,body:JSON.stringify(body),cache:'no-store'});
 if(!result.ok)throw new Error('Ezin izan da Supabaserekin konektatu ('+result.status+')');
 return await result.json();
}
async function srReadExams(organism){
 const exams=await srRequest('/rest/v1/rpc/sr_public_exam_snapshot',{p_organism_code:organism});
 if(!Array.isArray(exams))throw new Error('Azterketa-datuak ez dira egokiak');
 return exams.map(exam=>srNormalizeExam(exam,organism));
}
const srAwaiting=new Map();
async function srGrade(activeExam,getAnswers) {
 const slug=activeExam.slug;
 if(!srAwaiting.has(slug)){
   const byPart=Object.fromEntries(activeExam.items.map((it,i)=>[String(i+1),getAnswers(i)]));
   const work=srRequest('/functions/v1/sr-grade-exam',{slug,answers:byPart})
    .then(result=>{
      if(!Array.isArray(result?.items) || result.total!==activeExam.items.reduce((sum,it)=>sum+it.r[1]-it.r[0]+1,0))
        throw new Error('Ezin izan dira erantzunak zuzendu');
      const correct=new Map();
      for(const row of result.items){
        const pos=Number(row?.position),n=Number(row?.n),accepted=row?.accepted;
        const item=activeExam.items[pos-1];
        if(!Number.isInteger(pos)||!item||!Number.isInteger(n)||n<item.r[0]||n>item.r[1]||!Array.isArray(accepted)||!accepted.length||accepted.some(letter=>typeof letter!=='string'||!SR_LETTER.test(letter)))throw new Error('Ezin izan dira erantzunak zuzendu');
        if(!correct.has(pos))correct.set(pos,new Map());
        correct.get(pos).set(n,accepted.slice());
      }
      activeExam.items.forEach((it,index)=>{
        const answers=correct.get(index+1),alternative={};
        if(!answers)throw new Error('Falta diren soluzioak: '+(index+1));
        it.key=Array.from({length:it.r[1]-it.r[0]+1},(_,j)=>{
          const nn=it.r[0]+j,list=answers.get(nn);
          if(!list?.length)throw new Error('Soluzioa falta da: '+nn);
          if(list.length>1)alternative[nn]=list.join('/');
          return list[0];
        }).join('');
        it.alternatives=alternative;
      });
      return result;
    }).finally(()=>srAwaiting.delete(slug));
   srAwaiting.set(slug,work);
 }
 return await srAwaiting.get(slug);
}
const $=s=>document.getElementById(s),L="ABCD",COLORS={yellow:"#ffe174",green:"#a9e8bd",pink:"#f7bed5",blue:"#b2dbff"};
function setLoading(isLoading){document.body.classList.toggle('loading',isLoading);document.body.setAttribute('aria-busy',String(isLoading))}
function externalLink(href,label){const link=document.createElement('a');link.href=href;link.target='_blank';link.rel='noopener';link.textContent=label;return link}
const read=(k,f)=>{try{let x=JSON.parse(localStorage.getItem(k));return x===null?f:x}catch{return f}},save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const escapeText=v=>String(v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
let exams=[],examIndex=0,part=0,current=1,graded={},markVisible=true,lastSelection=[],toastCounter=0;
const exam=()=>exams[examIndex],task=()=>exam().items[part],count=it=>it.r[1]-it.r[0]+1;
const answerKey=(i=part)=>"sustrai-habe-"+exam().id+"-answers-"+i,answers=(i=part)=>read(answerKey(i),{});
const markKey=()=>"sustrai-habe-"+exam().id+"-marks-"+part,marks=()=>read(markKey(),[]);
const timerKey=()=>"sustrai-habe-"+exam().id+"-timer",timer=()=>read(timerKey(),{elapsed:0,start:null,done:false});
const elapsed=t=>Math.max(0,(t.elapsed||0)+(t.start?Date.now()-t.start:0)),formatTime=ms=>{let s=Math.floor(ms/1000);return [Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(n=>String(n).padStart(2,'0')).join(':')};
const accepted=(it,n)=>it.alternatives?.[n]?.split("/")||[it.key[n-it.r[0]]];
const answered=()=>exam().items.reduce((v,it,i)=>{let a=answers(i);return v+Object.keys(a).filter(n=>+n>=it.r[0]&&+n<=it.r[1]&&a[n]).length},0);
function toast(message){$('toast').textContent=message;$('toast').classList.add('show');let n=++toastCounter;setTimeout(()=>{if(n===toastCounter)$('toast').classList.remove('show')},2000)}
function updateTimer(){if(!exams.length)return;let t=timer();$('clock').textContent=formatTime(elapsed(t));$('clock').title="HABE C1 · 60 minutu gomendatuak";$('start').textContent=t.done?'✓ Amaituta':t.start?'Ⅱ Pausatu':t.elapsed?'▶ Jarraitu':'▶ Hasi';$('start').disabled=!!t.done;$('finish').disabled=!!t.done;$('timehint').textContent=t.done?'Denbora gordeta':t.start?'Martxan':'60 min gomendatuak'}
function toggleTimer(){let t=timer();if(t.done)return;if(t.start){t.elapsed=elapsed(t);t.start=null;toast('Kronometroa pausatuta')}else{t.start=Date.now();toast('Kronometroa martxan')}save(timerKey(),t);updateTimer()}
function score(){let ok=0,points=0;exam().items.forEach((it,i)=>{let a=answers(i);for(let n=it.r[0];n<=it.r[1];n++)if(accepted(it,n).includes(a[n])){ok++;points+=it.weight}});return {ok,points:Math.round(points*10)/10}}
async function finishExam(){
 const e=exam(),missing=30-answered();
 if(missing&&!confirm(missing+' galdera erantzun gabe daude. Amaitu azterketa?'))return;
 try{
   const t=timer(),startElapsed=elapsed(t);
   await srGrade(e,answers);
   if(e!==exam())return;
   if(!t.done){
     t.elapsed=startElapsed;t.start=null;t.done=true;save(timerKey(),t);
     const s=score(),k='sustrai-habe-'+e.id+'-attempts',arr=read(k,[]);
     arr.push({at:new Date().toISOString(),time:t.elapsed,score:s.points,correct:s.ok});
     save(k,arr.slice(-40));
   }
   showSummary();updateTimer();
 }catch(error){console.error(error);toast('Ezin izan da zuzendu: saiatu berriro')}
}
function showSummary(){let t=timer(),s=score(),h=read("sustrai-habe-"+exam().id+"-attempts",[]),old=h.length>1?h.at(-2):null;$('summary').innerHTML='<div class="scorebig">'+s.points.toFixed(1).replace('.',',')+' <span style="font-size:17px;color:#819284">/ 20 puntu</span></div><div class="summaryrow"><span>Zuzen erantzunda</span><strong>'+s.ok+' / 30</strong></div><div class="summaryrow"><span>Denbora guztira</span><strong>'+formatTime(elapsed(t))+'</strong></div><div class="summaryrow"><span>Gainditzeko gutxienekoa</span><strong>10 puntu</strong></div>'+(old?'<div class="summaryrow"><span>Aurreko saiakera</span><strong>'+old.score.toFixed(1).replace('.',',')+' puntu · '+formatTime(old.time)+'</strong></div>':'')+'<p>'+ (s.points>=10?'Gaindituta. Zorionak!':'Jarraitu praktikatzen.')+'</p>';$('modal').hidden=false}
function dismiss(){$('modal').hidden=true}
function restart(){if(!confirm("Erantzunak eta kronometroa berrabiarazi? Markak mantenduko dira."))return;exam().items.forEach((it,i)=>localStorage.removeItem(answerKey(i)));localStorage.removeItem(timerKey());graded={};current=task().r[0];dismiss();render(true);toast("Berrabiarazita")}
function setView(view){document.body.classList.toggle('view-questions',view==='questions');$('viewReading').classList.toggle('on',view==='reading');$('viewQuestions').classList.toggle('on',view==='questions')}
function pickExam(n){examIndex=n;part=0;current=task().r[0];graded={};lastSelection=[];try{localStorage.setItem('sustrai-habe-active',exam().id)}catch{}render(true);setView('reading')}
function pickPart(n){part=n;current=task().r[0];lastSelection=[];render(true);setView('reading')}
function pickQuestion(n){current=n;renderQuestion();setView('questions')}
function step(n){current=Math.max(task().r[0],Math.min(task().r[1],current+n));renderQuestion()}
function choose(letter){let a=answers();a[current]=letter;save(answerKey(),a);renderQuestion();renderPassage(false);renderTabs();renderProgress()}
function clearPart(){if(!confirm("Ariketa honetako erantzunak garbitu?"))return;localStorage.removeItem(answerKey());graded[part]=false;render(false);toast("Erantzunak garbituta")}
function renderProgress(){let c=answered();$('progressLabel').textContent=c+'/30 erantzunda';$('trackfill').style.width=(100*c/30)+'%'}
function renderTabs(){const names=["Ulermena","Ulermena","Hutsuneak","Baliokideak"];$('tabs').innerHTML=exam().items.map((it,i)=>{let a=answers(i),done=Object.keys(a).filter(n=>+n>=it.r[0]&&+n<=it.r[1]&&a[n]).length;return '<button data-part="'+i+'" class="tab '+(i===part?'active':'')+'">'+(i+1)+'. '+names[i]+' <small>'+done+'/'+count(it)+'</small></button>'}).join('');document.querySelectorAll('[data-part]').forEach(el=>el.onclick=()=>pickPart(+el.dataset.part))}
function highlighted(content,area){let sections=markVisible?marks().filter(m=>m.area===area).sort((a,b)=>a.start-b.start):[],prev=0,out='';for(let m of sections){if(m.start<prev||m.end>content.length||m.end<=m.start)continue;out+=escapeText(content.slice(prev,m.start))+'<mark class="highlit" style="background:'+COLORS[m.color]+'">'+escapeText(content.slice(m.start,m.end))+'</mark>';prev=m.end}return out+escapeText(content.slice(prev))}
function paragraphs(txt){let items=txt.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÜÑ«])/u),arr=[],p='';for(let x of items){if(p.length>470){arr.push(p.trim());p=''}p+=(p?' ':'')+x}if(p.trim())arr.push(p.trim());return arr}
function renderPassage(reset){let sc=$('readingPanel').querySelector('.paperscroll'),y=reset?0:sc.scrollTop,it=task(),a=answers(),section=0,html='';for(let paragraph of paragraphs(it.p)){html+='<p>';for(let part of paragraph.split(/(\{\{\d+\}\})/g)){let match=part.match(/^\{\{(\d+)\}\}$/);if(match){let n=+match[1],v=a[n],label=v?(it.type==="fill"?it.opts[n][L.indexOf(v)]:v):'···';html+='<button class="hole '+(n===current?'active ':'')+(v?'answered':'')+'" data-gap="'+n+'">'+n+' · '+escapeText(label)+'</button>'}else if(part){let area='a'+section++;html+='<span class="selectable" data-area="'+area+'">'+highlighted(part,area)+'</span>'}}html+='</p>'}$('passage').innerHTML=html;document.querySelectorAll('[data-gap]').forEach(el=>el.onclick=()=>pickQuestion(+el.dataset.gap));sc.scrollTop=y}
function targetWord(it,n){let p=it.p,i=p.indexOf('{{'+n+'}}');if(i<0)return'';let left=p.slice(Math.max(0,i-45),i).trim();let m=left.match(/([A-Za-zÀ-ÿ\-]+)$/);return m?m[1]:left.slice(-25)}
function renderQuestion(){let it=task(),n=current,a=answers(),idx=n-it.r[0],q=it.type==="mcq"?it.qs[idx]:null,opts=it.type==="mcq"?q.o:it.opts[n],prompt=it.type==="mcq"?q.q:it.type==="fill"?"Hutsunerako hitz edo esaldi egokia aukeratu.":"Aukeratu testuko «"+targetWord(it,n)+"» hitzaren baliokidea.";$('qcounter').textContent='GALDERA '+n+' · '+(idx+1)+' / '+count(it);$('qtitle').textContent=it.title;$('questionText').innerHTML='<span class="selectable" data-area="q'+n+'">'+highlighted(prompt,'q'+n)+'</span>';$('options').innerHTML=opts.map((v,i)=>{let l=L[i],selected=a[n]===l,correct=graded[part]&&accepted(it,n).includes(l),wrong=graded[part]&&selected&&!correct;return '<div class="choice '+(selected?'chosen ':'')+(correct?'correct ':'')+(wrong?'wrong':'')+'" data-choice="'+l+'"><button class="choose" data-letter="'+l+'" aria-label="'+l+' aukera" aria-pressed="'+selected+'">'+l+'</button><span class="selectable" data-area="c'+n+l+'">'+highlighted(v,'c'+n+l)+'</span></div>'}).join('');document.querySelectorAll('.choose').forEach(b=>b.onclick=()=>choose(b.dataset.letter));document.querySelectorAll('.choice').forEach(b=>b.onclick=e=>{if(e.target.closest('button')||window.getSelection()?.toString())return;choose(b.dataset.choice)});$('prev').disabled=n===it.r[0];$('next').disabled=n===it.r[1];$('numbers').innerHTML=Array.from({length:count(it)},(_,i)=>{let z=i+it.r[0];return '<button class="'+(current===z?'current ':'')+(a[z]?'done':'')+'" data-number="'+z+'">'+z+'</button>'}).join('');document.querySelectorAll('[data-number]').forEach(b=>b.onclick=()=>pickQuestion(+b.dataset.number));$('gradeResult').innerHTML='';if(graded[part]){let num=0;for(let z=it.r[0];z<=it.r[1];z++)if(accepted(it,z).includes(a[z]))num++;$('gradeResult').innerHTML='<div class="result"><strong>'+num+' / '+count(it)+' zuzen</strong> · '+(num*it.weight).toFixed(1).replace('.',',')+' puntu<small>Galdera honetako erantzun zuzena: '+accepted(it,n).join(' edo ')+'</small></div>'}}
function render(reset=true){if(!exams.length)return;$('exam').value=exam().id;$('readingTitle').textContent=task().title;const links=[externalLink(exam().source,'HABEko jatorrizko PDFa ↗')];if(exam().solution)links.push(' · ',externalLink(exam().solution,'Erantzun ofizialak ↗'));$('sourceNote').replaceChildren(...links);renderTabs();renderProgress();renderPassage(reset);renderQuestion();updateTimer()}
function captureSelection(){let s=window.getSelection();if(!s||s.isCollapsed||!s.rangeCount)return;let range=s.getRangeAt(0),saved=[];document.querySelectorAll('.selectable[data-area]').forEach(el=>{if(!range.intersectsNode(el))return;let full=document.createRange();full.selectNodeContents(el);let part=range.cloneRange();try{if(range.compareBoundaryPoints(Range.START_TO_START,full)<0)part.setStart(full.startContainer,full.startOffset);if(range.compareBoundaryPoints(Range.END_TO_END,full)>0)part.setEnd(full.endContainer,full.endOffset);let before=full.cloneRange();before.setEnd(part.startContainer,part.startOffset);let len=part.toString().length;if(len)saved.push({area:el.dataset.area,start:before.toString().length,end:before.toString().length+len})}catch{}});if(saved.length){lastSelection=saved;$('markerHint').textContent='Hautatuta · aukeratu kolorea'}}
function paint(color){captureSelection();if(!lastSelection.length){toast('Hautatu hitz edo esaldi bat');return}let a=marks();for(let s of lastSelection){a=a.filter(m=>m.area!==s.area||m.end<=s.start||m.start>=s.end);a.push({...s,color})}save(markKey(),a);lastSelection=[];window.getSelection()?.removeAllRanges();renderPassage(false);renderQuestion();toast('Marka gordeta')}
function erase(){captureSelection();if(!lastSelection.length){toast('Hautatu ezabatu beharreko marka');return}save(markKey(),marks().filter(m=>!lastSelection.some(s=>s.area===m.area&&s.start<m.end&&s.end>m.start)));lastSelection=[];window.getSelection()?.removeAllRanges();renderPassage(false);renderQuestion();toast('Marka ezabatuta')}
async function initialize(){exams=await srReadExams('HABE');if(!exams.length||exams.some(e=>!e.items.length||e.items.some(it=>it.key.length!==count(it))||Math.abs(e.items.reduce((n,it)=>n+count(it)*it.weight,0)-20)>0.001))throw Error('HABEko azterketak osatu gabe daude');$('exam').replaceChildren(...exams.map(e=>{const option=document.createElement('option');option.value=e.id;option.textContent=e.label;return option}));let id=localStorage.getItem('sustrai-habe-active')||exams.at(-1).id;examIndex=Math.max(0,exams.findIndex(e=>e.id===id));current=task().r[0];$('exam').onchange=e=>pickExam(exams.findIndex(x=>x.id===e.target.value));$('start').onclick=toggleTimer;$('finish').onclick=finishExam;$('prev').onclick=()=>step(-1);$('next').onclick=()=>step(1);$('grade').onclick=async()=>{const e=exam(),p=part;try{await srGrade(e,answers);if(e!==exam())return;graded[p]=true;renderQuestion()}catch(error){console.error(error);toast('Ezin izan da zuzendu: saiatu berriro')}};$('resetEx').onclick=clearPart;$('erase').onclick=erase;$('markVisibility').onclick=()=>{markVisible=!markVisible;$('markVisibility').textContent=markVisible?'◎ Ezkutatu':'◎ Erakutsi';renderPassage(false);renderQuestion()};$('markerTool').onclick=function(){let v=$('markerbar').classList.toggle('visible');this.setAttribute('aria-expanded',String(v))};$('closeMarker').onclick=()=>{$('markerbar').classList.remove('visible');$('markerTool').setAttribute('aria-expanded','false')};document.querySelectorAll('.swatch').forEach(b=>{b.onpointerdown=e=>e.preventDefault();b.onclick=()=>paint(b.dataset.color)});$('closeModal').onclick=dismiss;$('dismissSummary').onclick=dismiss;$('repeatExam').onclick=restart;$('viewReading').onclick=()=>setView('reading');$('viewQuestions').onclick=()=>setView('questions');document.addEventListener('selectionchange',()=>{if(window.getSelection()&&!window.getSelection().isCollapsed)requestAnimationFrame(captureSelection)});document.addEventListener('pointerup',()=>setTimeout(captureSelection,0));document.addEventListener('keydown',e=>{if(e.key==='Escape')dismiss()});render(true);setLoading(false);setInterval(updateTimer,500)}
initialize().catch(e=>{console.error(e);setLoading(false);$('readingTitle').textContent='Ezin izan da kargatu';$('passage').textContent=e.message});
