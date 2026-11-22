/* MINTZAKATS · Native SUSTRAI daily challenge.
 * Original mechanics: antoniourutz-dev/mintzakats (7-day distribution, 20 questions,
 * 40 points per correct answer + max 10 speed points, daily grammar, streak, mistakes).
 * Uses SUSTRAI's authenticated sr_app_state cloud storage; NO writes to legacy open-RLS
 * partidak/jokalari_egoera and NO unverified public leaderboard/admin functions.
 */
(() => {
 'use strict';
 const root=document.getElementById('mintApp'),cloud=window.SustraiCloud,core=window.MintzakatsCore;
 if(!root||!core||!cloud)return;
 const STORE_KEY='sustrai-jokoak-mintzakats-v1';
 const DAY_NAMES=core.WEEKDAY;
 const state={phase:'loading',today:core.madridDate(),info:core.blockInfo(),pool:[],
   todayQuestions:[],record:null,records:[],lesson:null,lessonLoaded:false,questionStarted:0,
   reviewIds:[],reviewIndex:0,reviewSelected:null,loadError:null};
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;', '"':'&quot;',"'":'&#39;'}[c]));
 const button=(action,title,secondary=false)=>'<button type="button" class="mint-action'+
    (secondary?' mint-action--secondary':'')+'" data-action="'+action+'">'+title+'</button>';
 const focus=selector=>root.querySelector?.(selector)?.focus?.();
 const badge=(txt,type='')=>'<span class="mint-chip'+(type?' mint-chip--'+type:'')+'">'+txt+'</span>';
 const inAccount=()=>!!cloud.user?.()&&!!cloud.profile?.()?.active;
 const safeRecords=raw=>{
   try{
     const v=JSON.parse(raw||'{}');
     if(!v||!Array.isArray(v.records))return[];
     return v.records.filter(r=>r&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)&&
       Array.isArray(r.questionIds)&&r.questionIds.length===20&&Array.isArray(r.answers))
       .slice(0,70);
   }catch{return[]}
 };
 function readRecords(){
   try{return safeRecords(cloud.storage.getItem(STORE_KEY))}catch{return[]}
 }
 function saveRecords(immediate=false){
   state.records.sort((a,b)=>b.date.localeCompare(a.date));
   state.records=state.records.slice(0,70);
   try{
     cloud.storage.setItem(STORE_KEY,JSON.stringify({version:1,records:state.records}));
     if(immediate){const flushed=cloud.flush?.();flushed?.catch?.(()=>{});}
   }catch(error){console.warn('MINTZAKATS datuak ezin dira gorde',error)}
 }
 function dayQuestions(){
   const generated=core.dailyQuestions(state.pool,state.today);
   state.info=generated.info;
   // Keep question order of an already-started game stable across reloads.
   const r=state.record;
   if(r&&r.questionIds.length===20){
     const bank=new Map(state.pool.map(q=>[q.id,q]));
     const saved=r.questionIds.map(id=>bank.get(id));
     if(saved.every(Boolean))return saved;
     if(!r.completed)throw new Error('Gaurko galdera-bankua aldatu da; gordetako saiakera ezin da segurtasunez berreskuratu.');
   }
   return generated.questions;
 }
 function currentRecord(){return state.records.find(r=>r.date===state.today)||null}
 function stat(){
   const completed=state.records.filter(r=>r.completed===true);
   const sum=completed.reduce((n,r)=>n+(r.score?.correct||0),0);
   return {streak:core.consecutiveDays(completed,state.today),
      best:core.personalBest(completed),days:completed.length,xp:sum*15};
 }
 function metric(value,label){return '<div class="mint-metric"><strong>'+esc(value)+'</strong><span>'+esc(label)+'</span></div>'}
 function recentHtml(){
   const rows=state.records.filter(r=>r.completed).slice(0,5);
   if(!rows.length)return '';
   return '<div class="mint-section"><h3>Azken saioak</h3><ul class="mint-review-list">'+rows.map(r=>
      '<li style="border-left-color:var(--s-primary);background:white"><strong>'+esc(r.date)+
      '</strong><p>'+esc(r.score?.correct??'—')+'/20 zuzen · '+
      esc(r.score?.totalPoints??0)+' puntu</p></li>').join('')+'</ul></div>';
 }
 function weekHtml(){
   const info=state.info,mon=info.weekMondayDateStr;
   return '<section class="mint-section"><h3>Asteko zazpi egunak</h3><div class="mint-day-strip">'+
     DAY_NAMES.map((name,i)=>{
       const date=core.moveDate(mon,i);
       const r=state.records.find(x=>x.date===date&&x.completed);
       const cls=r?' is-done':date===state.today?' is-today':'';
       return '<div class="mint-day'+cls+'" aria-label="'+esc(name+', '+date+(r?', osatuta':'') )+'">'+
         '<strong>'+esc(name.slice(0,3))+'</strong><small>'+esc(date.slice(-2))+' · '+(r?'✓':'—')+'</small></div>';
     }).join('')+'</div></section>';
 }
 function grammarHtml(){
   if(!state.lessonLoaded)return '';
   const g=state.lesson;
   if(!g)return '<section class="mint-section"><h3>Eguneko gramatika</h3><p class="mint-subtle">Gaurko gramatika-pilula ez dago eskuragarri.</p></section>';
   let examples=g.examples;
   if(typeof examples==='string'){try{examples=JSON.parse(examples)}catch{examples=[]}}
   if(!Array.isArray(examples))examples=[];
   return '<section class="mint-section"><div class="mint-grammar">'+
     '<span class="mint-overline">EGUNEKO GRAMATIKA · ARGITARATUTAKO MATERIALA</span>'+
     '<h3>'+esc(g.title||'Gramatika')+'</h3>'+
     (g.subtitle?'<p class="mint-subtle">'+esc(g.subtitle)+'</p>':'')+
     (g.summary?'<p>'+esc(g.summary)+'</p>':'')+
     ((g.explanation||g.key_point||examples.length)?'<details><summary>Ikusi azalpena eta adibideak</summary>'+
        (g.explanation?'<p>'+esc(g.explanation)+'</p>':'')+
        (g.key_point?'<p><strong>Gakoa:</strong> '+esc(g.key_point)+'</p>':'')+
        examples.slice(0,5).map(ex=>{
          const t=typeof ex==='string'?ex:ex?.text;
          return t?'<p class="mint-example">'+esc(t)+'</p>':'';
        }).join('')+'</details>':'')+
     '</div></section>';
 }
 function achievements(){
   const s=stat(),badges=[];
   if(s.days>=1)badges.push('🏅 Lehen erronka');
   if(s.streak>=3)badges.push('🔥 3 egun jarraian');
   if(s.streak>=7)badges.push('⭐ 7 egun jarraian');
   if(s.streak>=14)badges.push('🏆 14 egun jarraian');
   return badges.length?'<div class="mint-badges">'+badges.map(s=>'<span class="mint-badge">'+esc(s)+'</span>').join('')+'</div>':'';
 }
 function renderHome(){
   state.phase='home';
   const s=stat(),todayRecord=state.record;
   const complete=!!todayRecord?.completed,started=!!todayRecord&&!complete;
   root.innerHTML='<div class="mint-panel">'+
     '<div class="mint-heading"><span class="mint-overline">'+esc(state.info.dayName)+' · '+esc(state.today)+
     '</span>'+badge(complete?'Gaurko erronka osatuta':started?'Hasitako erronka':'20 galdera · egunero',complete?'done':'')+'</div>'+
     '<h2>Zure gaurko erronka</h2>'+
     '<p class="mint-lead">Egunero galdera-sorta bera partekatzen dute ikasleek. Aste berean ez da galderarik errepikatzen; erantzunen ondoren zure hutsak berrikusi ahal izango dituzu.</p>'+
     '<div class="mint-metrics">'+metric(s.streak,'Egungo bolada')+
      metric(s.best+' pt','Puntuaziorik onena')+metric(s.xp,'XP pertsonalak')+'</div>'+
     achievements()+
     (complete?'<p class="mint-chip mint-chip--done">✓ Gaurko 20 galderak amaitu dituzu. Bihar beste sorta bat izango duzu.</p>'+
       '<div class="mint-actions">'+button('summary','Gaurko emaitza ikusi')+
       (mistakesForToday().length?button('review','Hutsak berrikusi',true):'')+'</div>':
      started?'<p class="mint-status">Gaurko entrenamendua hasi duzu: '+state.record.answers.filter(Boolean).length+
        ' erantzun gordeta.</p><div class="mint-actions">'+button('resume','Jarraitu erronkarekin')+'</div>':
       '<div class="mint-actions">'+button('start','Hasi 20 galderen erronka')+'</div>')+
     '<p class="mint-note">'+(inAccount()?'Zure aurrerapena SUSTRAI kontuarekin gordetzen da.':
       'Gonbidatu gisa ari zara: aurrerapena gailu honetan gordeko da. Kontuarekin, beste gailu batzuetan ere berreskuratu ahal izango duzu.')+
       ' Puntuazioa entrenamendurako da, ez sailkapen publiko egiaztatu baterako.</p>'+
     weekHtml()+grammarHtml()+recentHtml()+'</div>';
 }
 function renderLoading(){
   state.phase='loading';
   root.innerHTML='<div class="mint-panel"><h2>Galderak prestatzen…</h2>'+
     '<p class="mint-status" role="status">MINTZAKATSen galdera-bankua eta gramatika-pilula kargatzen.</p></div>';
 }
 function renderError(message){
   state.phase='error';
   root.innerHTML='<div class="mint-panel"><h2>Ezin izan da MINTZAKATS ireki</h2>'+
     '<p class="mint-error" role="alert">'+esc(message)+'</p>'+
     '<div class="mint-actions">'+button('reload','Berriro saiatu')+'</div></div>';
 }
 async function fetchGrammar(client){
   try{
     // Same published-lesson fallback as Mintzakats' grammarService;
     // no use of private or draft grammatical material.
     const schedule=await client.from('grammar_daily_schedule').select(
       'scheduled_date,grammar_lessons(id,title,subtitle,summary,explanation,key_point,examples,status)')
       .eq('scheduled_date',state.today).eq('is_active',true).maybeSingle();
     const lesson=schedule.data?.grammar_lessons;
     const v=Array.isArray(lesson)?lesson[0]:lesson;
     if(!schedule.error&&v?.status==='published')return v;
   }catch(error){console.warn('MINTZAKATS daily grammar schedule unavailable',error)}
   try{
     const {data,error}=await client.from('grammar_lessons')
       .select('id,title,subtitle,summary,explanation,key_point,examples,status,created_at')
       .eq('status','published').order('created_at',{ascending:true}).limit(100);
     if(error||!Array.isArray(data)||!data.length)return null;
     const index=state.today.split('-').reduce((acc,part)=>acc+(parseInt(part,10)||0),0)%data.length;
     return data[index];
   }catch(error){console.warn('MINTZAKATS daily grammar unavailable',error);return null}
 }
 async function load(){
   renderLoading();
   try{
     await cloud.ready;
     const client=cloud.client();
     if(!client)throw new Error('Supabase ezin izan da abiarazi. Egiaztatu Interneteko konexioa.');
     const q=await client.from('euskera_questions')
       .select('id,question,candidates,answer').order('id',{ascending:true}).limit(200);
     if(q.error)throw q.error;
     state.pool=(q.data||[]).filter(core.validQuestion);
     if(new Set(state.pool.map(r=>r.id)).size<140)throw new Error('141 galderen jatorrizko bankua ez dago osorik eskuragarri.');
     state.today=core.madridDate();
     state.info=core.blockInfo(state.today);
     state.records=readRecords();
     state.record=currentRecord();
     state.todayQuestions=dayQuestions();
     // Grammar pill failing must never block the game.
     state.lesson=await fetchGrammar(client);
     state.lessonLoaded=true;
     renderHome();
   }catch(error){
     console.warn('MINTZAKATS load error:',error);
     renderError(error?.message||'Konexio-arazoa gertatu da.');
   }
 }
 function answerAt(index){
   if(!state.record)return null;
   return state.record.answers[index]||null;
 }
 function start(){
   if(state.record?.completed){renderSummary();return}
   if(!state.record){
     state.record={date:state.today,weekMonday:state.info.weekMondayDateStr,
       questionIds:state.todayQuestions.map(q=>q.id),answers:Array(20).fill(null),
       currentIndex:0,startedAt:new Date().toISOString(),completed:false,completedAt:null,score:null};
     state.records.unshift(state.record);saveRecords();
   }
   state.record.currentIndex=Math.min(19,Math.max(0,Number(state.record.currentIndex)||0));
   state.questionStarted=Date.now();
   renderGame();
 }
 function renderGame(){
   if(!state.record)return renderHome();
   state.phase='playing';
   const n=state.record.currentIndex,q=state.todayQuestions[n];
   if(!q){renderError('Gaurko galdera ezin da berreskuratu.');return}
   const response=answerAt(n),done=Number.isInteger(response?.selected);
   const pct=Math.round(100*n/20);
   root.innerHTML='<div class="mint-panel">'+
     '<div class="mint-heading"><span class="mint-overline">'+esc(state.info.dayName)+' · EGUNEKO ERRONKA</span>'+
      badge((n+1)+' / 20 galdera')+'</div>'+
     '<div class="mint-progress" role="progressbar" aria-label="Galderen aurrerapena" aria-valuemin="0" aria-valuemax="20" aria-valuenow="'+n+'"><span style="width:'+pct+'%"></span></div>'+
     '<h2 class="mint-prompt">'+esc(q.question)+'</h2>'+
     '<div class="mint-options">'+q.candidates.map((option,i)=>{
       const cls=!done?'':i===q.answer?' is-correct':i===response.selected?' is-wrong':' is-muted';
       const verdict=!done?'':i===q.answer?' · Zuzena (jokoan)':i===response.selected?' · Okerra (jokoan)':'';
       return '<button type="button" class="mint-option'+cls+'" data-action="answer" data-index="'+i+'"'+(done?' disabled':'')+'>'+
         '<span class="mint-letter">'+String.fromCharCode(65+i)+'</span><span>'+esc(option)+esc(verdict)+'</span></button>';
     }).join('')+'</div>'+
     (done?'<div class="mint-verdict'+(response.correct?'':' is-wrong')+'" role="status"><strong>'+
        (response.correct?'✓ Zuzena':'✕ Okerra')+'</strong>'+
        'Jokoaren erantzun-gakoa: <strong>'+esc(q.candidates[q.answer])+'</strong>'+
        (response.correct?'<p>+'+response.points+' puntu lortu dituzu ('+response.speedBonus+' abiaduragatik).</p>':
          '<p>Berrikusketan galdera hau berriro landu ahal izango duzu.</p>')+
        '</div><div class="mint-actions">'+button('next',n<19?'Hurrengo galdera':'Amaitu erronka')+'</div>':
        '<p class="mint-status">Aukeratu erantzun bat; puntuazioak zehaztasuna eta erantzuteko denbora hartzen ditu kontuan.</p>')+
     '</div>';
 }
 function selectOption(index){
   if(state.phase!=='playing'||!state.record)return;
   const n=state.record.currentIndex,q=state.todayQuestions[n];
   if(!Number.isInteger(index)||index<0||index>3||answerAt(n))return;
   const points=core.perQuestionScore(index===q.answer,Date.now()-state.questionStarted);
   state.record.answers[n]={selected:index,correct:index===q.answer,points:points.totalPoints,
      speedBonus:points.speedBonus,timeMs:Math.max(0,Date.now()-state.questionStarted)};
   saveRecords();renderGame();focus('[data-action="next"]');
 }
 function next(){
   if(state.phase!=='playing'||!state.record)return;
   const n=state.record.currentIndex;
   if(!answerAt(n))return;
   if(n<19){
     state.record.currentIndex++;
     state.questionStarted=Date.now();
     saveRecords();renderGame();focus('[data-action="answer"]');
   }else finish();
 }
 function finish(){
   if(!state.record||state.record.completed||state.record.answers.some(a=>!a))return;
   const r=state.record;
   r.completed=true;r.completedAt=new Date().toISOString();r.currentIndex=20;
   r.score=core.scoreGame(r.answers);
   saveRecords(true);renderSummary();
 }
 function mistakesForToday(){
   return state.record?state.todayQuestions
     .map((q,i)=>({q,i,a:state.record.answers[i]}))
     .filter(v=>v.a&&v.a.selected!==v.q.answer):[];
 }
 function renderSummary(){
   if(!state.record?.completed){renderHome();return}
   state.phase='summary';
   const r=state.record,s=r.score,mistakes=mistakesForToday(),streak=stat().streak;
   const totalSeconds=Math.max(0,Math.round((new Date(r.completedAt)-new Date(r.startedAt))/1000));
   root.innerHTML='<div class="mint-panel"><div class="mint-heading">'+badge('✓ Amaituta','done')+
      '<span class="mint-overline">'+esc(state.today)+'</span></div>'+
      '<h2>Gaurko emaitza</h2><div class="mint-points">'+esc(s.totalPoints)+' pt</div>'+
      '<div class="mint-metrics">'+metric(s.correct+'/20','Zuzenak')+
       metric(s.speedBonus,'Abiadura-puntuak')+metric(streak,'Eguneko bolada')+'</div>'+
      '<p class="mint-subtle">Iraupena: '+Math.floor(totalSeconds/60)+' min '+totalSeconds%60+' s · Eguneko erronka behin osatzen da; bihar beste galdera-sorta bat izango duzu.</p>'+
      (mistakes.length?'<div class="mint-section"><h3>Berrikusteko galderak ('+mistakes.length+')</h3>'+
         '<ul class="mint-review-list">'+mistakes.map(({q,i,a})=>
         '<li><strong>'+(i+1)+'. '+esc(q.question)+'</strong>'+
         '<p>Zure erantzuna: '+esc(q.candidates[a.selected])+'</p>'+
         '<p>Bankuko gakoa: <strong>'+esc(q.candidates[q.answer])+'</strong></p></li>').join('')+'</ul>'+
         '<div class="mint-actions">'+button('review','Akatsak berriz landu')+'</div></div>':
         '<p class="mint-chip mint-chip--done">Galdera guztiak asmatu dituzu!</p>')+
      '<p class="mint-note">Emaitza entrenamendukoa da. Ez da nota ofiziala, eta bankuko gakoek berrikuspen akademikoa behar dute.</p>'+
      '<div class="mint-actions">'+button('home','Itzuli hasierara',true)+'</div></div>';
 }
 function startReview(){
   const mistakes=mistakesForToday();
   if(!mistakes.length){renderSummary();return}
   state.reviewIds=mistakes.map(v=>v.i);state.reviewIndex=0;state.reviewSelected=null;
   renderReview();
 }
 function renderReview(){
   state.phase='review';
   const index=state.reviewIds[state.reviewIndex],q=state.todayQuestions[index];
   if(!q){renderSummary();return}
   const chosen=state.reviewSelected,answered=Number.isInteger(chosen);
   root.innerHTML='<div class="mint-panel"><div class="mint-heading">'+
     '<span class="mint-overline">HUTSEN BERRIKUSPENA · EZ DU EGUNEKO PUNTUAZIOA ALDATZEN</span>'+
     badge((state.reviewIndex+1)+' / '+state.reviewIds.length)+'</div>'+
     '<h2 class="mint-prompt">'+esc(q.question)+'</h2>'+
     '<div class="mint-options">'+q.candidates.map((op,i)=>{
       const cls=!answered?'':i===q.answer?' is-correct':i===chosen?' is-wrong':' is-muted';
       const verdict=!answered?'':i===q.answer?' · Zuzena':i===chosen?' · Okerra':'';
       return '<button type="button" class="mint-option'+cls+'" data-action="review-answer" data-index="'+i+'"'+(answered?' disabled':'')+'>'+
         '<span class="mint-letter">'+String.fromCharCode(65+i)+'</span><span>'+esc(op)+esc(verdict)+'</span></button>';
     }).join('')+'</div>'+
     (answered?'<div class="mint-verdict'+(chosen===q.answer?'':' is-wrong')+'" role="status">'+
       '<strong>'+(chosen===q.answer?'✓ Zuzena':'✕ Okerra')+'</strong>Bankuko erantzun-gakoa: '+
       '<strong>'+esc(q.candidates[q.answer])+'</strong></div>'+
       '<div class="mint-actions">'+button('review-next',
         state.reviewIndex+1===state.reviewIds.length?'Amaitu berrikuspena':'Hurrengo hutsa')+'</div>':'')+
     '</div>';
 }
 root.addEventListener('click',event=>{
   const b=event.target.closest?.('button[data-action]');
   if(!b||!root.contains(b))return;
   const a=b.dataset.action;
   if(a==='reload'){load();return}
   if(a==='home'){renderHome();return}
   if(a==='start'||a==='resume'){start();return}
   if(a==='answer'){selectOption(Number(b.dataset.index));return}
   if(a==='next'){next();return}
   if(a==='summary'){renderSummary();return}
   if(a==='review'){startReview();return}
   if(a==='review-answer'){
     if(state.phase!=='review'||state.reviewSelected!==null)return;
     const index=Number(b.dataset.index);
     if(!Number.isInteger(index)||index<0||index>3)return;
     state.reviewSelected=index;renderReview();focus('[data-action="review-next"]');return;
   }
   if(a==='review-next'){
     if(state.phase!=='review'||state.reviewSelected===null)return;
     state.reviewIndex++;state.reviewSelected=null;
     if(state.reviewIndex<state.reviewIds.length){renderReview();focus('[data-action="review-answer"]')}
     else renderSummary();
   }
 });
 load();
})();
