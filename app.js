'use strict';

const SR_URL="https://awdajwrzxceqazmaorxc.supabase.co";
const SR_ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZGFqd3J6eGNlcWF6bWFvcnhjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2MDcyMjUsImV4cCI6MjA4OTE4MzIyNX0.OjjmvIiGf020pF2Frie2wCPiVCAPO-uWWdzoN4nkwCQ";
const SR_HEADERS={'apikey':SR_ANON,'Authorization':'Bearer '+SR_ANON,'Content-Type':'application/json'};
async function srRequest(path,body){
 const result=await fetch(SR_URL+path,{method:'POST',headers:SR_HEADERS,body:JSON.stringify(body)});
 if(!result.ok)throw new Error('Ezin izan da Supabaserekin konektatu ('+result.status+')');
 return await result.json();
}
async function srReadExams(organism){
 const exams=await srRequest('/rest/v1/rpc/sr_public_exam_snapshot',{p_organism_code:organism});
 if(!Array.isArray(exams))throw new Error('Azterketa-datuak ez dira egokiak');
 for(const e of exams)for(const it of e.items){
   const n=it.r[1]-it.r[0]+1;
   it.key='?'.repeat(n);
 }
 return exams;
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
        const pos=Number(row.position), n=Number(row.n);
        if(!correct.has(pos))correct.set(pos,new Map());
        correct.get(pos).set(n,row.accepted);
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
const $=id=>document.getElementById(id);
const letters='ABCDEFGHIJ';
const colors={yellow:'#ffe174',green:'#a9e8bd',pink:'#f7bed5',blue:'#b2dbff'};
const read=(k,defaultValue)=>{try{const v=JSON.parse(localStorage.getItem(k));return v===null?defaultValue:v}catch{return defaultValue}};
const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
const htmlEscape=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[c]));
let exams=[],ex=0,part=0,current=1,graded={},visible=true,pendingSelection=[],toastId=0;
const exam=()=>exams[ex],task=()=>exam().items[part];
const numberOf=it=>it.r[1]-it.r[0]+1;
const totalOf=e=>e.items.reduce((a,it)=>a+numberOf(it),0);
const weight=it=>it.weight??(it.type==='fill'?.4:.8);
const storageKey=(id,index)=>{
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
const timerKey=()=> 'sustrai-timer-v2-'+exam().id;
const timer=()=>read(timerKey(),{elapsed:0,start:null,done:false});
const elapsed=t=>Math.max(0,(t.elapsed||0)+(t.start?Date.now()-t.start:0));
const timeString=ms=>{let n=Math.floor(ms/1000);return [Math.floor(n/3600),Math.floor(n/60)%60,n%60].map(x=>String(x).padStart(2,'0')).join(':')};
const progress=()=>exam().items.reduce((a,it,i)=>{let ans=answersOf(i);return a+Object.keys(ans).filter(n=>Number(n)>=it.r[0]&&Number(n)<=it.r[1]&&ans[n]).length},0);
function toast(msg){$('toast').textContent=msg;$('toast').classList.add('show');const serial=++toastId;setTimeout(()=>{if(serial===toastId)$('toast').classList.remove('show')},2500)}
function tick(){if(!exams.length)return;const t=timer();$('clock').textContent=timeString(elapsed(t));$('clock').title='Azterketaren iraupena · gomendioa: '+(totalOf(exam())===25?'35 minutu':'50–60 minutu');$('start').textContent=t.done?'✓ Amaituta':t.start?'Ⅱ Pausatu':t.elapsed?'▶ Jarraitu':'▶ Hasi';$('start').disabled=!!t.done;$('finish').disabled=!!t.done;$('timehint').textContent=t.done?'Denbora gordeta':t.start?'Kronometroa martxan':totalOf(exam())===25?'Gomendioa: 35 min':'Gomendioa: 50–60 min'}
function pauseToggle(){let t=timer();if(t.done)return;if(t.start){t.elapsed=elapsed(t);t.start=null;toast('Kronometroa geldituta')}else{t.start=Date.now();toast('Kronometroa martxan')}write(timerKey(),t);tick()}
function points(){let score=0,correct=0;exam().items.forEach((it,i)=>{let ans=answersOf(i);for(let n=it.r[0];n<=it.r[1];n++)if(ans[n]===it.key[n-it.r[0]]){correct++;score+=weight(it)}});return{score:Math.round(score*10)/10,correct}}
async function finish(){
 const e=exam(), blank=totalOf(e)-progress();
 if(blank&&!confirm(blank+' galdera erantzun gabe daude. Amaitu nahi duzu?'))return;
 try{
   const t=timer(),startElapsed=elapsed(t);
   await srGrade(e,answersOf);
   if(e!==exam())return;
   if(!t.done){
     t.elapsed=startElapsed;t.start=null;t.done=true;write(timerKey(),t);
     const p=points(),k='sustrai-attempts-v3-'+e.id,attempts=read(k,[]);
     attempts.push({at:new Date().toISOString(),score:p.score,correct:p.correct,elapsed:t.elapsed});
     write(k,attempts.slice(-30));
   }
   summary();tick();
 }catch(error){console.error(error);toast('Ezin izan da zuzendu: saiatu berriro');}
}
function summary(){let p=points(),t=timer(),history=read('sustrai-attempts-v3-'+exam().id,[]),previous=history.length>1?history.at(-2):null;
 $('summary').innerHTML='<div class="scorebig">'+p.score.toFixed(1).replace('.',',')+' <span style="font-size:17px;color:#819284">/ 20 puntu</span></div><div class="summaryrow"><span>Erantzun zuzenak</span><strong>'+p.correct+' / '+totalOf(exam())+'</strong></div><div class="summaryrow"><span>Denbora guztira</span><strong>'+timeString(elapsed(t))+'</strong></div><div class="summaryrow"><span>Gainditzeko gutxienekoa</span><strong>10 puntu</strong></div>'+(previous?'<div class="summaryrow"><span>Aurreko saiakera</span><strong>'+previous.score.toFixed(1).replace('.',',')+' puntu · '+timeString(previous.elapsed)+'</strong></div>':'')+'<p class="'+(p.score<10?'warn':'')+'">'+(p.score>=10?'Gaindituta. Zorionak!':'Praktikatzen jarraitu.')+'</p>';$('modal').hidden=false}
function closeSummary(){$('modal').hidden=true}
function restart(){if(!confirm('Azterketaren erantzunak eta kronometroa berrabiarazi? Markak mantenduko dira.'))return;exam().items.forEach((it,i)=>localStorage.removeItem(storageKey(exam().id,i)));localStorage.removeItem(timerKey());graded={};current=task().r[0];closeSummary();render();toast('Azterketa berrabiarazita')}
function selectExam(i){ex=i;part=0;current=task().r[0];graded={};pendingSelection=[];try{localStorage.setItem('sustrai-current-exam',exam().id)}catch{};render(true);view('reading')}
function selectPart(i){part=i;current=task().r[0];pendingSelection=[];render(true);view('reading')}
function view(tab){document.body.classList.toggle('view-questions',tab==='questions');$('viewReading').classList.toggle('on',tab==='reading');$('viewQuestions').classList.toggle('on',tab==='questions')}
function selectQuestion(n){current=n;renderQuestion();view('questions')}
function step(delta){current=Math.max(task().r[0],Math.min(task().r[1],current+delta));renderQuestion()}
function choose(letter){let a=answersOf(),it=task();if(it.type==='fragments'){for(let n in a)if(+n!==current&&a[n]===letter)delete a[n]}a[current]=letter;write(storageKey(exam().id,part),a);renderQuestion();renderPassage(false);tabs();progressBar()}
function resetPart(){if(!confirm('Ariketa honetako erantzunak ezabatu?'))return;localStorage.removeItem(storageKey(exam().id,part));graded[part]=false;render(false);toast('Erantzunak ezabatuta')}
async function correct(){
 const e=exam(),n=part;
 try{await srGrade(e,answersOf);if(e!==exam())return;graded[n]=true;renderQuestion()}
 catch(error){console.error(error);toast('Ezin izan da zuzendu: saiatu berriro')}
}
function progressBar(){let p=progress(),total=totalOf(exam());$('progressLabel').textContent=p+'/'+total+' erantzunda';$('trackfill').style.width=(100*p/total)+'%'}
function tabs(){let content='';exam().items.forEach((it,i)=>{let a=answersOf(i),done=Object.keys(a).filter(n=>+n>=it.r[0]&&+n<=it.r[1]&&a[n]).length;content+='<button class="tab '+(i===part?'active':'')+'" data-part="'+i+'">'+(i+1)+'. '+(it.type==='fill'?'Hutsuneak':it.type==='mcq'?'Ulermena':'Testu zatiak')+' <small>'+done+'/'+numberOf(it)+'</small></button>'});$('tabs').innerHTML=content;document.querySelectorAll('[data-part]').forEach(b=>b.onclick=()=>selectPart(+b.dataset.part))}
function marked(content,area){let ms=visible?highlights().filter(m=>m.area===area).sort((a,b)=>a.start-b.start):[];let index=0,out='';for(let m of ms){if(m.start<index||m.start<0||m.end>content.length||m.end<=m.start)continue;out+=htmlEscape(content.slice(index,m.start))+'<mark class="highlit" style="background:'+colors[m.color]+'">'+htmlEscape(content.slice(m.start,m.end))+'</mark>';index=m.end}return out+htmlEscape(content.slice(index))}
function paragraphs(input){let parts=String(input).split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÜÑ«])/u),out=[],p='';for(let s of parts){if(p.length>520){out.push(p.trim());p=''}p+=(p?' ':'')+s}if(p.trim())out.push(p.trim());return out}
function renderPassage(reset=false){let scroll=$('readingPanel').querySelector('.paperscroll'),pos=reset?0:scroll.scrollTop,it=task(),a=answersOf(),segment=0,content='';for(let text of paragraphs(it.p)){content+='<p>';for(let token of text.split(/(\{\{\d+\}\})/g)){let m=token.match(/^\{\{(\d+)\}\}$/);if(m){let n=+m[1],letter=a[n]||'',choice=letter?(it.type==='fill'?it.opts[n][letters.indexOf(letter)]:letter):'···';content+='<button class="hole '+(n===current?'active ':'')+(letter?'answered':'')+'" data-gap="'+n+'">'+n+' · '+htmlEscape(choice)+'</button>'}else if(token){let area='a'+segment++;content+='<span class="selectable" data-area="'+area+'">'+marked(token,area)+'</span>'}}content+='</p>'}$('passage').innerHTML=content;document.querySelectorAll('[data-gap]').forEach(b=>b.onclick=()=>selectQuestion(+b.dataset.gap));scroll.scrollTop=pos}
function renderQuestion(){let it=task(),a=answersOf(),n=current,index=n-it.r[0],q=it.type==='mcq'?it.qs[index]:null,choices=it.type==='mcq'?q.o:it.type==='fill'?it.opts[n]:it.opts,labels=Array.isArray(choices)?letters.slice(0,choices.length).split(''):Object.keys(choices).sort(),vals=Array.isArray(choices)?choices:labels.map(l=>choices[l]);$('qcounter').textContent='GALDERA '+n+' · '+(index+1)+' / '+numberOf(it);$('qtitle').textContent=it.title;
 let question=it.type==='mcq'?q.q:it.type==='fill'?'Hutsuneari dagokion hitza aukeratu.':it.title.toLowerCase().includes('bi zutabeak lotu')?'Lotu 1. zutabeko esaldia 2. zutabeko aukera egokiarekin. Aukera bat sobera dago.':'Testuko hutsuneari dagokion zatia aukeratu. Aukera bat sobera dago.';$('questionText').innerHTML='<span class="selectable" data-area="q'+n+'">'+marked(question,'q'+n)+'</span>';
 $('options').innerHTML=labels.map((l,j)=>{let chosen=a[n]===l,isCorrect=graded[part]&&it.key[index]===l,isWrong=graded[part]&&chosen&&!isCorrect,area='c'+n+l;return '<div class="choice '+(chosen?'chosen ':'')+(isCorrect?'correct ':'')+(isWrong?'wrong':'')+'" data-choice="'+l+'"><button class="choose" data-letter="'+l+'" aria-label="'+l+' aukera" aria-pressed="'+chosen+'">'+l+'</button><span class="selectable" data-area="'+area+'">'+marked(vals[j],area)+'</span></div>'}).join('');
 document.querySelectorAll('.choose').forEach(b=>b.onclick=()=>choose(b.dataset.letter));document.querySelectorAll('.choice').forEach(b=>b.onclick=e=>{if(e.target.closest('button')||window.getSelection()?.toString())return;choose(b.dataset.choice)});
 $('prev').disabled=n===it.r[0];$('next').disabled=n===it.r[1];
 $('numbers').innerHTML=Array.from({length:numberOf(it)},(_,i)=>{let k=i+it.r[0];return '<button data-q="'+k+'" class="'+(k===n?'current ':'')+(a[k]?'done':'')+'">'+k+'</button>'}).join('');
 document.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>selectQuestion(+b.dataset.q));
 $('gradeResult').innerHTML='';if(graded[part]){let good=0;for(let k=it.r[0];k<=it.r[1];k++)if(a[k]===it.key[k-it.r[0]])good++;let note=exam().id==='2019-10-26'&&part===0&&current===2?'<small>Oharra: 2. galderako soluzioa ez dator bat argitaratutako bi iturri ofizialetan (C/D).</small>':'';$('gradeResult').innerHTML='<div class="result"><strong>'+good+' / '+numberOf(it)+' zuzen</strong> · '+(good*weight(it)).toFixed(1).replace('.',',')+' puntu <small>Erantzun zuzena: '+it.key[index]+'</small>'+note+'</div>'}}
function render(reset=false){if(!exams.length)return;$('exam').value=exam().id;$('readingTitle').textContent=task().title;document.querySelector('.source-note').innerHTML='Iturria: <a href="'+htmlEscape(exam().source)+'" target="_blank" rel="noopener">IVAP · Azterketa ofiziala (A eredua) ↗</a>';tabs();progressBar();renderPassage(reset);renderQuestion();tick()}
function capture(){let selection=window.getSelection();if(!selection||selection.isCollapsed||!selection.rangeCount)return;let range=selection.getRangeAt(0),res=[];document.querySelectorAll('.selectable[data-area]').forEach(el=>{if(!range.intersectsNode(el))return;let whole=document.createRange();whole.selectNodeContents(el);let clipped=range.cloneRange();try{if(range.compareBoundaryPoints(Range.START_TO_START,whole)<0)clipped.setStart(whole.startContainer,whole.startOffset);if(range.compareBoundaryPoints(Range.END_TO_END,whole)>0)clipped.setEnd(whole.endContainer,whole.endOffset);let prefix=whole.cloneRange();prefix.setEnd(clipped.startContainer,clipped.startOffset);let start=prefix.toString().length,len=clipped.toString().length;if(len)res.push({area:el.dataset.area,start,end:start+len})}catch{}});if(res.length){pendingSelection=res;$('markerHint').textContent='Testua hautatuta · aukeratu kolorea'}}
function paint(color){capture();if(!pendingSelection.length){toast('Hautatu hitz edo esaldi bat lehenik');return}let list=highlights();for(let s of pendingSelection){list=list.filter(m=>m.area!==s.area||m.end<=s.start||m.start>=s.end);list.push({...s,color})}write(highlightsKey(),list);pendingSelection=[];window.getSelection()?.removeAllRanges();renderPassage(false);renderQuestion();toast('Marka gordeta')}
function erase(){capture();if(!pendingSelection.length){toast('Hautatu ezabatu nahi duzun zatia');return}let list=highlights().filter(m=>!pendingSelection.some(s=>s.area===m.area&&s.start<m.end&&s.end>m.start));write(highlightsKey(),list);pendingSelection=[];window.getSelection()?.removeAllRanges();renderPassage(false);renderQuestion();toast('Marka ezabatuta')}
async function start(){
 exams=(await srReadExams('IVAP')).sort((a,b)=>a.id.localeCompare(b.id));
 if(!exams.length)throw Error('Ez dago argitaratutako IVAP azterketarik');
 let ids=new Set;
 for(let e of exams){
   if(ids.has(e.id))throw Error('Bikoiztutako deialdia');ids.add(e.id);
   let count=totalOf(e),max=e.items.reduce((x,it)=>x+numberOf(it)*weight(it),0);
   if((count!==25&&count!==34)||Math.abs(max-20)>.01)throw Error('Galdera kopurua edo puntuazioa ez dira zuzenak: '+e.id);
   for(let it of e.items)if(it.key.length!==numberOf(it))throw Error('Ariketa osatu gabea: '+e.id);
 }
 $('exam').innerHTML=exams.map(e=>'<option value="'+e.id+'">'+e.label+' · '+totalOf(e)+' galdera</option>').join('');
 let chosen=localStorage.getItem('sustrai-current-exam')||'2019-05-04',found=exams.findIndex(e=>e.id===chosen);ex=found>=0?found:0;current=task().r[0];
 $('exam').onchange=e=>selectExam(exams.findIndex(x=>x.id===e.target.value));$('start').onclick=pauseToggle;$('finish').onclick=finish;$('prev').onclick=()=>step(-1);$('next').onclick=()=>step(1);$('grade').onclick=correct;$('resetEx').onclick=resetPart;$('erase').onclick=erase;$('markVisibility').onclick=()=>{visible=!visible;$('markVisibility').textContent=visible?'◎ Ezkutatu':'◎ Erakutsi';renderPassage(false);renderQuestion()};
 document.querySelectorAll('.swatch').forEach(b=>{b.addEventListener('pointerdown',e=>e.preventDefault());b.onclick=()=>paint(b.dataset.color)});$('closeModal').onclick=closeSummary;$('dismissSummary').onclick=closeSummary;$('repeatExam').onclick=restart;$('viewReading').onclick=()=>view('reading');$('viewQuestions').onclick=()=>view('questions');document.addEventListener('selectionchange',()=>{if(window.getSelection()&&!window.getSelection().isCollapsed)requestAnimationFrame(capture)});document.addEventListener('pointerup',()=>setTimeout(capture,0));document.addEventListener('keydown',event=>{if(event.key==='Escape')closeSummary()});render(true);setInterval(tick,500)}
start().catch(error=>{console.error(error);$('readingTitle').textContent='Ezin izan da aplikazioa kargatu';$('passage').textContent=error.message});
