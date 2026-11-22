/* ZINOK · SUSTRAI integrazioa. Sinonimoen galderak: public.synonimoak_2.
   Mezu Zuzentzailea: jatorrizko puzzleService.ts-ko pilotu-azpimultzoa.
   Ez du datu-baseko eskema edo RLS aldatzen. */
(() => {
 'use strict';
 const root=document.getElementById('zinokApp');
 const cloud=window.SustraiCloud, z=window.ZinokCore, rawPuzzles=window.ZinokPuzzles;
 if(!root||!cloud||!z||!Array.isArray(rawPuzzles))return;
 const STORE_KEY='sustrai-jokoak-zinok-v1';
 const puzzles=rawPuzzles.filter(z.isPuzzle);
 const groups=z.puzzleGroups(puzzles);
 const state={screen:'menu',level:1,bank:new Map(),questions:[],qIndex:0,answers:[],quizStarted:0,
   group:0,puzzleIndex:0,activeTarget:null,puzzleOptions:[],puzzleAnswer:null,puzzleResults:[],puzzleStarted:0,
   lookupTerm:'',lookupResults:[],notice:''};
 const esc=text=>String(text??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const btn=(action,label,extra='')=>'<button type="button" class="zinok-button'+(extra?' zinok-button--light':'')+'" data-action="'+action+'">'+label+'</button>';
 const back=()=>'<div class="zinok-actions">'+btn('home','← Hasierara',true)+'</div>';
 const notice=()=>'<p class="zinok-notice">Sinonimia adieraren eta testuinguruaren araberakoa da. Jokoaren gakoak <strong>proposamen didaktikoak</strong> dira; materiala berrikusteko dago.</p>';
 function history(){
   try{const records=JSON.parse(cloud.storage.getItem(STORE_KEY)||'[]');return Array.isArray(records)?records:[];}catch{return [];}
 }
 function historyHtml(){
   const list=history().slice(0,4);
   if(!list.length)return '';
   return '<section class="zinok-history"><strong>Azken entrenamenduak</strong><ul>'+
    list.map(r=>'<li>'+esc((r.completedAt||'').slice(0,10))+' · '+esc(r.label||'')+' · '+esc(r.correct)+'/'+esc(r.total)+'</li>').join('')+'</ul></section>';
 }
 function saveRecord(type,label,results,seconds){
   const score=z.score(results);
   const record={id:window.crypto?.randomUUID?.()||String(Date.now()),game:'zinok',mode:type,label,
     completedAt:new Date().toISOString(),durationSeconds:seconds,correct:score.correct,
     total:score.total,items:results.map(r=>({id:r.id,selected:r.selected,correct:r.correct}))};
   try{cloud.storage.setItem(STORE_KEY,JSON.stringify([record,...history()].slice(0,30)));cloud.flush?.().catch(()=>{});}
   catch(error){console.warn('ZINOK historia:',error);}
 }
 function renderMenu(){
   state.screen='menu';
   root.innerHTML='<div class="zinok-panel"><span class="zinok-overline">ZINOK · IKASTEKO HIRU BIDE</span>'+
    '<h2>Aukeratu erronka</h2><p class="zinok-muted">Sinonimoen erronka: 10 galdera; Mezu Zuzentzailea: esaldietan hitzak hautatu; Hitz bilatzailea: sinonimoak kontsultatu.</p>'+
    '<h3>Sinonimoen erronka</h3><div class="zinok-grid">'+[1,2,3,4].map(i=>
      '<button class="zinok-card" data-action="quiz" data-level="'+i+'"><strong>'+i+'. SORTA</strong><small>10 galdera · Supabase</small></button>').join('')+
    '</div><p class="zinok-info">Sortak jatorrizko bankuaren 1–4 barne-mailak dira; ez dira B2, C1 edo C2 egiaztatutako mailak. Sinonimo-bankua erabiltzeko kontua behar da.</p>'+
    '<div class="zinok-grid"><button class="zinok-card zinok-card--puzzle" data-action="puzzle-groups"><strong>✎ Mezu Zuzentzailea</strong><small>'+puzzles.length+' ariketa hautatu · esaldiak zuzendu</small></button>'+
    '<button class="zinok-card zinok-card--lookup" data-action="search"><strong>⌕ Hitz bilatzailea</strong><small>Supabaseko sinonimoen kontsulta</small></button></div>'+
    notice()+historyHtml()+'</div>';
 }
 function renderLoading(message){
   root.innerHTML='<div class="zinok-panel"><h2>Prestatzen…</h2><p class="zinok-loading" role="status">'+esc(message)+'</p></div>';
 }
 function renderError(message,retryAction){
   state.screen='error';
   root.innerHTML='<div class="zinok-panel"><h2>Ezin izan da jarduera kargatu</h2><p role="alert" class="zinok-error">'+esc(message)+'</p>'+
    '<div class="zinok-actions">'+(retryAction?btn(retryAction,'Berriz saiatu'):'')+btn('home','Hasierara',true)+'</div></div>';
 }
 function isSignedIn(){return !!cloud.user()&&!!cloud.profile()?.active;}
 function authGate(retryAction){
   if(isSignedIn())return false;
   state.screen='login';
   root.innerHTML='<div class="zinok-panel"><h2>Hasi saioa sinonimo-bankua erabiltzeko</h2>'+
    '<p class="zinok-muted">Banku honek ikasle autentifikatuentzako baimena du. Zure SUSTRAI kontu bera erabiliko dugu, beste konturik sortu gabe.</p>'+
    '<div class="zinok-actions">'+btn('login','Saioa hasi')+btn(retryAction,'Saioa egiaztatu',true)+btn('home','Hasierara',true)+'</div></div>';
   return true;
 }
 async function getBank(level){
   if(state.bank.has(level))return state.bank.get(level);
   const client=cloud.client();
   if(!client)throw new Error('Supabaseko konexioa ez dago erabilgarri.');
   const {data,error}=await client.from('synonimoak_2')
     .select('id,source_id,level,part,hitza,sinonimoak,active')
     .eq('active',true).eq('level',level).order('source_id',{ascending:true}).limit(500);
   if(error)throw error;
   const rows=(data||[]).filter(z.isEntry);
   if(rows.length<10)throw new Error('Ez dago nahikoa sinonimo-sarrera egoki sorta honetan.');
   state.bank.set(level,rows);
   return rows;
 }
 async function startQuiz(level){
   state.level=level;
   if(authGate('retry-quiz'))return;
   state.screen='loading';renderLoading('Supabaseko sinonimoak irakurtzen…');
   try{
     const bank=await getBank(level);
     const questions=z.quiz(bank,10);
     if(questions.length!==10)throw new Error('Ezin dira 10 galdera bereizi osatu banku honetatik.');
     state.questions=questions;state.qIndex=0;state.answers=[];state.quizStarted=Date.now();
     state.screen='quiz';renderQuiz();
   }catch(error){console.warn('ZINOK bankua:',error);renderError(error?.message||'Sareko errorea gertatu da.','retry-quiz');}
 }
 function renderProgress(n,total){
   return '<div class="zinok-progress" role="progressbar" aria-label="Galderen aurrerapena" aria-valuemin="0" aria-valuemax="'+total+'" aria-valuenow="'+n+'"><span style="width:'+
    Math.round(100*n/Math.max(1,total))+'%"></span></div>';
 }
 function renderQuiz(){
   const q=state.questions[state.qIndex];
   const a=state.answers[state.qIndex];
   const done=Number.isInteger(a);
   root.innerHTML='<div class="zinok-panel"><div class="zinok-top"><span class="zinok-overline">'+state.level+'. SORTA · 10 GALDERA</span>'+
     '<span class="zinok-info">Galdera '+(state.qIndex+1)+' / '+state.questions.length+'</span></div>'+
     renderProgress(state.qIndex,state.questions.length)+
     '<p class="zinok-muted">Aukeratu proposatutako sinonimo egokia.</p>'+
     '<h2 class="zinok-question">'+esc(q.word)+'</h2><div class="zinok-options">'+
     q.options.map((option,i)=>{
       const cl=!done?'':i===q.correctIndex?' is-correct':i===a?' is-wrong':' is-muted';
       const label=!done?'':i===q.correctIndex?' · Zuzena (jokoan)':i===a?' · Okerra (jokoan)':'';
       return '<button type="button" class="zinok-option'+cl+'" data-action="answer" data-index="'+i+'"'+(done?' disabled':'')+'>'+
         '<span class="zinok-letter">'+String.fromCharCode(65+i)+'</span><span>'+esc(option)+esc(label)+'</span></button>';
     }).join('')+'</div>'+
     (done?'<div class="zinok-feedback'+(a===q.correctIndex?'':' is-wrong')+'" role="status">'+
       '<strong>'+(a===q.correctIndex?'✓ Zuzena (jokoaren arabera)':'✕ Okerra (jokoaren arabera)')+'</strong>'+
       'Proposatutako erantzuna: <strong>'+esc(q.correctAnswer)+'</strong>'+
       (q.knownAlternatives.length>1?'<p>Bankuko beste aukera batzuk: '+esc(q.knownAlternatives.filter(s=>s!==q.correctAnswer).join(', '))+'</p>':'')+
       '</div><div class="zinok-actions">'+btn('next-quiz',state.qIndex+1<state.questions.length?'Hurrengo galdera':'Ikusi emaitza')+'</div>':'')+
     '</div>';
 }
 function chooseQuizAnswer(index){
   if(state.screen!=='quiz'||state.answers[state.qIndex]!==undefined)return;
   const q=state.questions[state.qIndex];
   if(!Number.isInteger(index)||index<0||index>=q.options.length)return;
   state.answers[state.qIndex]=index;renderQuiz();
 }
 function nextQuiz(){
   if(state.answers[state.qIndex]===undefined)return;
   if(state.qIndex<state.questions.length-1){state.qIndex++;renderQuiz();}
   else{
     const answers=state.questions.map((q,i)=>({id:q.sourceId,word:q.word,selected:q.options[state.answers[i]],
       key:q.correctAnswer,correct:q.correctIndex===state.answers[i]}));
     const seconds=Math.max(0,Math.round((Date.now()-state.quizStarted)/1000));
     finish('quiz',state.level+'. sorta',answers,seconds);
   }
 }
 function renderGroups(){
   state.screen='groups';
   root.innerHTML='<div class="zinok-panel"><span class="zinok-overline">MEZU ZUZENTZAILEA</span><h2>Esaldiak zuzendu</h2>'+
     '<p class="zinok-muted">Esaldiko hitz nabarmendua aukeratu, eta haren ordezko proposamena hautatu. Multzo bakoitzak bost esaldi inguru ditu.</p>'+
     '<div class="zinok-grid">'+groups.map((g,i)=>
       '<button class="zinok-card" data-action="start-puzzle" data-group="'+i+'"><strong>'+g.label+'</strong><small>'+g.puzzles.length+' esaldi</small></button>').join('')+
     '</div>'+notice()+back()+'</div>';
 }
 function startPuzzle(groupIndex){
   if(!Number.isInteger(groupIndex)||!groups[groupIndex])return;
   state.group=groupIndex;state.puzzleIndex=0;state.activeTarget=null;state.puzzleResults=[];
   state.puzzleAnswer=null;state.puzzleOptions=[];state.puzzleStarted=Date.now();
   state.screen='puzzle';renderPuzzle();
 }
 function puzzle(){return groups[state.group].puzzles[state.puzzleIndex];}
 function solvedForCurrent(){return state.puzzleResults.filter(r=>r.id.startsWith(puzzle().id+':'));}
 function puzzleSentence(p){
   const solved=solvedForCurrent();
   const pieces=p.esaldia.split(/(\s+)/);
   return pieces.map(piece=>{
     if(/^\s+$/.test(piece))return piece;
     const match=piece.match(/^([^\p{L}]*)((?:[\p{L}]+(?:[-'][\p{L}]+)*))([^\p{L}]*)$/u);
     if(!match)return esc(piece);
     const idx=p.targets.findIndex(t=>z.normalize(t.klabea)===z.normalize(match[2]));
     if(idx<0)return esc(piece);
     const seen=solved.find(r=>r.id===p.id+':'+idx);
     const c=seen?(seen.correct?' is-correct':' is-wrong'):(state.activeTarget===idx?' is-selected':'');
     return esc(match[1])+'<button type="button" class="zinok-target'+c+'" data-action="target" data-target="'+idx+'"'+(seen?' disabled':'')+'>'+esc(match[2])+'</button>'+esc(match[3]);
   }).join('');
 }
 function renderPuzzle(){
   const p=puzzle();
   const answered=state.puzzleResults.length;
   const total=groups[state.group].puzzles.reduce((n,p)=>n+p.targets.length,0);
   const selection=state.activeTarget!==null?p.targets[state.activeTarget]:null;
   root.innerHTML='<div class="zinok-panel"><div class="zinok-top"><span class="zinok-overline">'+esc(groups[state.group].label)+' · MEZU ZUZENTZAILEA</span>'+
     '<span class="zinok-puzzle-counter">Esaldia '+(state.puzzleIndex+1)+' / '+groups[state.group].puzzles.length+'</span></div>'+
     renderProgress(answered,total)+
     '<p class="zinok-muted">Hautatu esaldian nabarmendutako hitza, eta haren ordezko proposamena.</p>'+
     '<div class="zinok-sentence" lang="eu">'+puzzleSentence(p)+'</div>'+
     (selection?'<h3>Hitz hau: '+esc(selection.klabea)+'</h3><div class="zinok-options">'+
       state.puzzleOptions.map((op,i)=>{
         const done=state.puzzleAnswer!==null;
         const good=z.normalize(op)===z.normalize(selection.zuzena);
         const chosen=i===state.puzzleAnswer;
         const cls=!done?'':good?' is-correct':chosen?' is-wrong':' is-muted';
         const label=!done?'':good?' · Zuzena (jokoan)':chosen?' · Okerra (jokoan)':'';
         return '<button class="zinok-option'+cls+'" type="button" data-action="puzzle-answer" data-index="'+i+'"'+(done?' disabled':'')+'><span class="zinok-letter">'+String.fromCharCode(65+i)+'</span><span>'+esc(op)+esc(label)+'</span></button>';
       }).join('')+'</div>':'<p class="zinok-info" role="status">Sakatu kolorez nabarmendutako hitz bat.</p>')+
     (state.puzzleAnswer!==null?'<div class="zinok-feedback'+
       (z.normalize(state.puzzleOptions[state.puzzleAnswer])===z.normalize(selection.zuzena)?'':' is-wrong')+
       '" role="status"><strong>'+
       (z.normalize(state.puzzleOptions[state.puzzleAnswer])===z.normalize(selection.zuzena)?'✓ Zuzena (jokoan)':'✕ Okerra (jokoan)')+
       '</strong>Proposatutako erantzuna: '+esc(selection.zuzena)+'</div>'+
       '<div class="zinok-actions">'+btn('next-puzzle','Jarraitu')+'</div>':'')+
     '</div>';
 }
 function chooseTarget(index){
   if(state.screen!=='puzzle'||state.puzzleAnswer!==null)return;
   const p=puzzle();
   if(!p.targets[index]||solvedForCurrent().some(r=>r.id===p.id+':'+index))return;
   state.activeTarget=index;
   const t=p.targets[index];
   state.puzzleOptions=z.shuffle([t.zuzena,...t.distraktoreak]);
   state.puzzleAnswer=null;renderPuzzle();
 }
 function choosePuzzleAnswer(index){
   if(state.screen!=='puzzle'||state.activeTarget===null||state.puzzleAnswer!==null)return;
   const p=puzzle(),t=p.targets[state.activeTarget];
   if(!Number.isInteger(index)||index<0||index>=state.puzzleOptions.length)return;
   state.puzzleAnswer=index;
   const selected=state.puzzleOptions[index];
   state.puzzleResults.push({id:p.id+':'+state.activeTarget,word:t.klabea,selected,key:t.zuzena,
     correct:z.normalize(selected)===z.normalize(t.zuzena)});
   renderPuzzle();
 }
 function nextPuzzle(){
   if(state.puzzleAnswer===null)return;
   const p=puzzle();
   state.activeTarget=null;state.puzzleAnswer=null;state.puzzleOptions=[];
   if(solvedForCurrent().length<p.targets.length){renderPuzzle();return;}
   if(state.puzzleIndex+1<groups[state.group].puzzles.length){state.puzzleIndex++;renderPuzzle();return;}
   finish('puzzle','Mezu Zuzentzailea · '+groups[state.group].label,state.puzzleResults,
    Math.max(0,Math.round((Date.now()-state.puzzleStarted)/1000)));
 }
 function finish(mode,label,results,seconds){
   const s=z.score(results);saveRecord(mode,label,results,seconds);
   state.screen='summary';
   const wrong=results.filter(r=>!r.correct);
   root.innerHTML='<div class="zinok-panel"><span class="zinok-overline">ENTRENAMENDUA AMAITU DA</span><h2>'+esc(label)+'</h2>'+
     '<div class="zinok-score">'+s.correct+' / '+s.total+'</div><p>Zuzenak: <strong>'+s.correct+'</strong> · Oker: <strong>'+s.wrong+
     '</strong> · Iraupena: <strong>'+Math.floor(seconds/60)+' min '+seconds%60+' s</strong></p>'+
     (wrong.length?'<h3>Berrikusteko aukerak</h3><ul class="zinok-review">'+wrong.map(r=>
       '<li><strong>'+esc(r.word)+'</strong><p>Zure aukera: '+esc(r.selected)+'</p>'+
       '<p>Jokoaren gakoa: <strong>'+esc(r.key)+'</strong></p></li>').join('')+'</ul>':
       '<p>Jokoaren gako guztiak asmatu dituzu!</p>')+
     '<h3>Orain, erabili</h3><p class="zinok-muted">Aukeratu landutako bi hitz eta sortu esaldi bana. Aztertu ea esanahi eta erregistro beretan erabil daitezkeen.</p>'+
     notice()+'<div class="zinok-actions">'+btn(mode==='quiz'?'retry-quiz':'retry-puzzle','Berriro jokatu')+
      btn('home','Beste erronka bat',true)+'</div></div>';
 }
 function renderSearch(results=null){
   state.screen='search';
   root.innerHTML='<div class="zinok-panel"><span class="zinok-overline">HITZ BILATZAILEA · SUPABASE</span>'+
     '<h2>Bilatu sinonimoak</h2><p class="zinok-muted">Bilaketa hitzaren hasieraren arabera egingo da. Adiera zehatzaren egokitasuna testuinguruan aztertu.</p>'+
     '<form id="zinokLookup" class="zinok-search"><label for="zinokTerm" class="sr-only">Bilatu hitza</label>'+
     '<input id="zinokTerm" name="q" type="search" maxlength="70" placeholder="Adibidez: azkar" value="'+esc(state.lookupTerm)+'" required>'+
     '<button class="zinok-button" type="submit">Bilatu</button></form>'+
     (state.notice?'<p class="zinok-info" role="status">'+esc(state.notice)+'</p>':'')+
     (results?'<ul class="zinok-lookup-results">'+results.map(r=>
       '<li><strong>'+esc(r.hitza)+'</strong> <span class="zinok-small">('+esc(r.level)+'. sorta)</span>'+
       '<p>'+esc((r.sinonimoak||[]).join(' · '))+'</p></li>').join('')+'</ul>':'')+
     notice()+back()+'</div>';
 }
 async function lookup(term){
   state.lookupTerm=term;
   if(authGate('retry-search'))return;
   const sanitized=term.replace(/[%_\\]/g,'').trim().slice(0,70);
   if(sanitized.length<2){state.notice='Gutxienez bi karaktere sartu.';renderSearch();return;}
   renderLoading('Hitzaren sarrerak bilatzen…');
   try{
     const client=cloud.client();
     const {data,error}=await client.from('synonimoak_2')
       .select('id,hitza,sinonimoak,level,active').eq('active',true)
       .ilike('hitza',sanitized+'%').order('hitza',{ascending:true}).limit(30);
     if(error)throw error;
     state.lookupResults=(data||[]).filter(z.isEntry);
     state.notice=state.lookupResults.length?state.lookupResults.length+' sarrera aurkitu dira.':'Ez da sarrerarik aurkitu.';
     renderSearch(state.lookupResults);
   }catch(error){console.warn('ZINOK bilaketa:',error);renderError(error?.message||'Bilaketak huts egin du.','retry-search');}
 }
 root.addEventListener('submit',event=>{
   if(event.target.id!=='zinokLookup')return;
   event.preventDefault();lookup(event.target.elements.q.value);
 });
 root.addEventListener('click',event=>{
   const button=event.target.closest?.('button[data-action]');
   if(!button||!root.contains(button))return;
   const action=button.dataset.action;
   if(action==='home'){renderMenu();return;}
   if(action==='login'){cloud.openLogin();return;}
   if(action==='quiz'||action==='retry-quiz'){startQuiz(action==='quiz'?Number(button.dataset.level):state.level);return;}
   if(action==='answer'){chooseQuizAnswer(Number(button.dataset.index));return;}
   if(action==='next-quiz'){nextQuiz();return;}
   if(action==='puzzle-groups'){renderGroups();return;}
   if(action==='start-puzzle'){startPuzzle(Number(button.dataset.group));return;}
   if(action==='retry-puzzle'){startPuzzle(state.group);return;}
   if(action==='target'){chooseTarget(Number(button.dataset.target));return;}
   if(action==='puzzle-answer'){choosePuzzleAnswer(Number(button.dataset.index));return;}
   if(action==='next-puzzle'){nextPuzzle();return;}
   if(action==='search'){state.notice='';renderSearch();return;}
   if(action==='retry-search'){lookup(state.lookupTerm);return;}
 });
 (async()=>{try{await cloud.ready;}catch{/* allow puzzle while auth is unavailable */}renderMenu();})();
})();
