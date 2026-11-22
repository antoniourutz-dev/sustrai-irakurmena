/* ZINOK · seis grupos originales, sin el modo Mezu Zuzentzailea.
   Datos: antoniourutz-dev/zinok/src/data/synonyms.ts. Sin cambios en Supabase. */
(() => {
 'use strict';
 const root=document.getElementById('zinokApp'),cloud=window.SustraiCloud;
 const z=window.ZinokCore, data=window.ZinokSynonyms;
 if(!root||!z||!Array.isArray(data))return;
 const KEY='sustrai-jokoak-zinok-v1';
 const FEEDBACK_MS=850;
 let feedbackTimer=null;
 let pendingKeyboard=false;
 function clearFeedback(){
   if(feedbackTimer!==null){window.clearTimeout(feedbackTimer);feedbackTimer=null;}
   pendingKeyboard=false;
 }
 const descriptions={B1:'1. MAILA · B1',B2:'2. MAILA · B2',C1:'3. MAILA · C1',C2:'4. MAILA · C2',EX:'5. MAILA · EXPERT',MA:'6. MAILA · MAISU'};
 const state={screen:'menu',level:'B2',questions:[],index:0,answers:[],startedAt:0,searchTerm:'',searchResults:null};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const button=(action,label,light=false)=>'<button type="button" class="zinok-button'+(light?' zinok-button--light':'')+'" data-action="'+action+'">'+label+'</button>';
 const hero=document.querySelector?.('.zinok-main .areas-hero');
 function setScreen(name){
   if(name!=='quiz')clearFeedback();
   state.screen=name;
   if(hero)hero.hidden=name==='quiz'||name==='summary';
 }
 function getHistory(){
   try{const value=cloud?.storage?.getItem(KEY);const list=JSON.parse(value||'[]');return Array.isArray(list)?list:[]}
   catch{return []}
 }
 function renderHistory(){
   const recent=getHistory().slice(0,4);
   if(!recent.length)return '';
   return '<section class="zinok-history"><strong>Azken entrenamenduak</strong><ul>'+
      recent.map(r=>'<li>'+esc(String(r.completedAt||'').slice(0,10))+' · '+esc(r.label||'')+
      ' · '+esc(r.correct)+'/'+esc(r.total)+'</li>').join('')+'</ul></section>';
 }
 function saveResult(rows,seconds){
   const s=z.score(rows);
   const record={id:window.crypto?.randomUUID?.()||String(Date.now()),game:'zinok',
      mode:'synonym',label:descriptions[state.level],level:state.level,
      completedAt:new Date().toISOString(),durationSeconds:seconds,correct:s.correct,total:s.total,
      items:rows.map(r=>({id:r.id,selected:r.selected,correct:r.correct}))};
   try{cloud?.storage?.setItem(KEY,JSON.stringify([record,...getHistory()].slice(0,30)));
      const task=cloud?.flush?.();task?.catch?.(()=>{});}
   catch(e){console.warn('ZINOK historia:',e)}
 }
 function renderMenu(){
   setScreen('menu');
   root.innerHTML='<div class="zinok-panel"><span class="zinok-overline">ZINOK · SEI MAILA</span>'+
     '<h2>Sinonimoen erronka</h2>'+
     '<p class="zinok-muted">Aukeratu maila bat. Hamar galderatan sinonimoak ezagutu eta erantzunak berrikusi ahal izango dituzu.</p>'+
     '<div class="zinok-grid zinok-grid--levels">'+z.LEVELS.map(level=>{
       const number=z.LEVELS.indexOf(level)+1;
       const title=level==='EX'?'EXPERT':level==='MA'?'MAISU':level;
       const n=data.filter(g=>g.level===level).length;
       return '<button type="button" class="zinok-card" data-action="quiz" data-level="'+level+'">'+
         '<strong>'+number+'. MAILA</strong><small>'+title+' · '+n+' sinonimo-talde</small></button>';
     }).join('')+'</div>'+
     '<div class="zinok-actions">'+button('search','⌕ Hitz bilatzailea',true)+'</div>'+
     renderHistory()+'</div>';
 }
 function renderQuiz(){
   const q=state.questions[state.index];
   if(!q){renderMenu();return}
   const choice=state.answers[state.index];
   const answered=Number.isInteger(choice);
   const pct=Math.round(state.index/state.questions.length*100);
   root.innerHTML='<div class="zinok-panel zinok-panel--quiz">'+
     '<div class="zinok-top"><span class="zinok-overline">'+esc(descriptions[state.level])+
     '</span><span class="zinok-info">Galdera '+(state.index+1)+' / '+state.questions.length+'</span></div>'+
     '<div class="zinok-progress" role="progressbar" aria-label="Galderen aurrerapena" aria-valuemin="0" aria-valuemax="'+
     state.questions.length+'" aria-valuenow="'+state.index+'"><span style="width:'+pct+'%"></span></div>'+
     '<h2 id="zinokPrompt" class="zinok-question">'+esc(q.word)+'</h2>'+
     '<p class="zinok-muted">Hautatu sinonimoa.</p><div class="zinok-options" role="group" aria-labelledby="zinokPrompt">'+
     q.options.map((option,i)=>{
       const cls=!answered?'':i===q.correctIndex?' is-correct':i===choice?' is-wrong':' is-muted';
       const verdict=!answered?'':i===q.correctIndex?' · Zuzena':i===choice?' · Okerra':'';
       return '<button class="zinok-option'+cls+'" type="button" data-action="answer" data-index="'+i+'"'+
         (answered?' disabled':'')+'>'+
         '<span class="zinok-letter">'+String.fromCharCode(65+i)+'</span>'+
         '<span>'+esc(option)+esc(verdict)+'</span></button>';
     }).join('')+'</div>'+
     (answered?'<span class="sr-only" role="status" aria-live="polite">'+
       (choice===q.correctIndex?'Zuzena':'Okerra')+'</span>':'')+
     '</div>';
 }
 function start(level){
   if(!z.LEVELS.includes(level))return;
   clearFeedback();
   state.level=level;state.questions=z.quiz(data,level,10);
   state.answers=[];state.index=0;state.startedAt=Date.now();
   if(state.questions.length!==10){
     root.innerHTML='<div class="zinok-panel"><h2>Galderak ezin dira prestatu</h2>'+
       '<p role="alert" class="zinok-error">Ez dago nahikoa galdera bereizi maila honetan.</p>'+
       '<div class="zinok-actions">'+button('home','Hasierara')+'</div></div>';return;
   }
   setScreen('quiz');renderQuiz();
   window.scrollTo?.({top:0,behavior:'auto'});
 }
 function answer(index,keyboardActivation=false){
   if(state.screen!=='quiz'||state.answers[state.index]!==undefined)return;
   const q=state.questions[state.index];
   if(!Number.isInteger(index)||index<0||index>=q.options.length)return;
   state.answers[state.index]=index;
   pendingKeyboard=keyboardActivation;
   // Show both selected verdict and correct choice, as in the original game;
   // keep explanations and the mistakes list for the final summary only.
   renderQuiz();
   const answeredQuestion=state.index;
   feedbackTimer=window.setTimeout(()=>{
     feedbackTimer=null;
     if(state.screen!=='quiz'||state.index!==answeredQuestion)return;
     const moveKeyboardFocus=pendingKeyboard;
     pendingKeyboard=false;
     if(state.index+1<state.questions.length){
       state.index++;
       renderQuiz();
       if(moveKeyboardFocus)root.querySelector?.('.zinok-option')?.focus?.({preventScroll:true});
     }else finish();
   },FEEDBACK_MS);
 }
 function finish(){
   if(state.screen!=='quiz'||state.answers.length!==state.questions.length)return;
   const rows=state.questions.map((q,i)=>({
     id:q.id,word:q.word,selected:q.options[state.answers[i]],correctAnswer:q.correctAnswer,
     correct:q.correctIndex===state.answers[i]
   }));
   const seconds=Math.max(0,Math.round((Date.now()-state.startedAt)/1000));
   const result=z.score(rows);
   saveResult(rows,seconds);
   setScreen('summary');
   const wrong=rows.filter(r=>!r.correct);
   const details=wrong.length?
     '<details class="zinok-review-disclosure"><summary>Ikusi '+wrong.length+' hutsegiteak</summary>'+
     '<ul class="zinok-review">'+wrong.map(r=>
       '<li><strong>'+esc(r.word)+'</strong>'+
       '<p>Zure aukera: <span class="zinok-mark zinok-mark--wrong">'+esc(r.selected)+'</span></p>'+
       '<p>Erantzun-gakoa: <span class="zinok-mark zinok-mark--correct">'+esc(r.correctAnswer)+'</span></p></li>'
     ).join('')+'</ul></details>':
     '<p class="zinok-success">✓ Galdera guztiak asmatu dituzu!</p>';
   root.innerHTML='<div class="zinok-panel"><span class="zinok-overline">SAIOA AMAITUTA</span>'+
     '<h2>'+esc(descriptions[state.level])+'</h2><div class="zinok-score">'+result.correct+' / '+result.total+'</div>'+
     '<p>Zuzenak: <strong>'+result.correct+'</strong> · Oker: <strong>'+result.wrong+'</strong> · Iraupena: '+
     Math.floor(seconds/60)+' min '+seconds%60+' s</p>'+
     details+'<div class="zinok-actions">'+button('again','Berriro jokatu')+
       button('home','Beste maila bat',true)+'</div></div>';
 }
 function renderSearch(){
   setScreen('search');
   const result=state.searchResults;
   root.innerHTML='<div class="zinok-panel"><span class="zinok-overline">ZINOK · HIZTEGI KONTSULTA</span>'+
     '<h2>Hitz bilatzailea</h2><p class="zinok-muted">Bilatu hitzak sei mailetako 607 sinonimo-taldeetan.</p>'+
     '<form id="zinokLookup" class="zinok-search"><label for="zinokTerm" class="sr-only">Hitz bat</label>'+
     '<input id="zinokTerm" name="q" type="search" value="'+esc(state.searchTerm)+'" maxlength="70" required placeholder="Adibidez: sustatu">'+
     '<button type="submit" class="zinok-button">Bilatu</button></form>'+
     (result!==null?'<p class="zinok-info" role="status">'+result.length+' emaitza erakutsi dira (gehienez 30).</p>'+
       '<ul class="zinok-lookup-results">'+result.map(g=>'<li><strong>'+esc(g.words.join(' · '))+
         '</strong><p class="zinok-small">'+esc(g.level)+' · jatorrizko ZINOK taldea</p></li>').join('')+'</ul>':'')+
     '<div class="zinok-actions">'+button('home','← Sei mailetara itzuli',true)+'</div></div>';
 }
 function lookup(value){
   state.searchTerm=String(value||'').trim().slice(0,70);
   state.searchResults=z.search(data,state.searchTerm,30);
   renderSearch();
 }
 root.addEventListener('submit',event=>{
   if(event.target.id!=='zinokLookup')return;
   event.preventDefault();lookup(event.target.elements.q.value);
 });
 root.addEventListener('click',event=>{
   const btn=event.target.closest?.('button[data-action]');
   if(!btn||!root.contains(btn))return;
   const action=btn.dataset.action;
   if(action==='home'){renderMenu();return}
   if(action==='quiz'){start(btn.dataset.level);return}
   if(action==='answer'){answer(Number(btn.dataset.index),event.detail===0);return}
   if(action==='again'){start(state.level);return}
   if(action==='search'){state.searchResults=null;state.searchTerm='';renderSearch();root.querySelector?.('#zinokTerm')?.focus?.()}
 });
 renderMenu();
})();
