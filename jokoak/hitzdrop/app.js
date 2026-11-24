/* HITZ-DROP · first pilot inside HitzBira. No automatic successes and no DB writes. */
(() => {
'use strict';
const root=document.querySelector('.hd-game');
const source=window.HitzDropCatalog;
if(!root || !source) return;
const $=id=>document.getElementById(id);
const field=$('hdBoard'),arena=$('hdArena');
const W=5,H=6,GAP=6,DURATION=180,KEY='sustrai-jokoak-hitzdrop-v1';
const missions={moves:12,words:8,prefixes:3};
let entries=source.candidates.slice(),lookup=new Map(),tokenPool=[];
let board=[],slots=[],unit=46,pitch=52,id=0;
let phase='intro',busy=false,selected=-1,clock=null,seconds=DURATION,clockStarted=false;
let hits=0,score=0,combo=0,prefixHits=0,seen=new Set(),last=null,hints=5,shuffles=3;
let epoch=0,drag=null,suppress=false,sound=false,audio=null,goalsCelebrated=false;
let sourceOrigin='pilot-fallback';
const pick=items=>items[Math.floor(Math.random()*items.length)];
const wait=ms=>new Promise(done=>setTimeout(done,ms));
const coords=n=>({row:Math.floor(n/W),column:n%W});
const nearby=(a,b)=>a>=0&&b>=0&&a!==b&&Math.abs(a%W-b%W)+Math.abs(Math.floor(a/W)-Math.floor(b/W))===1;
const place=(r,c)=>'translate3d('+(c*pitch)+'px,'+(r*pitch)+'px,0)';
const typeOf=w=>w.startsWith('-')?'suffix':w.endsWith('-')?'prefix':'root';
function configureCatalog(items) {
 entries=items;
 lookup=new Map();
 const roots=new Set(),affixes=new Set();
 for(const item of entries) {
   const key=[item.left,item.right].sort().join('|');
   lookup.set(key,item);
   roots.add(item.type==='prefix'?item.right:item.left);
   affixes.add(item.type==='prefix'?item.left:item.right);
 }
 tokenPool=[...roots].map(word=>({word,weight:4})).concat([...affixes].map(word=>({word,weight:2})));
}
configureCatalog(entries);
function findMatch(a,b) {
 if(!a||!b||a.type===b.type)return null;
 return lookup.get([a.word,b.word].sort().join('|'))||null;
}
function matches() {
 const out=[];
 for(let i=0;i<W*H;i++) for(const j of [i+1,i+W]) {
   if(j<W*H&&nearby(i,j)) {
     const rec=findMatch(board[i],board[j]);
     if(rec)out.push({a:i,b:j,rec});
   }
 }
 return out;
}
function weightedWord() {
 const total=tokenPool.reduce((s,x)=>s+x.weight,0);
 let n=Math.random()*total;
 for(const x of tokenPool) if((n-=x.weight)<0)return x.word;
 return tokenPool[0]?.word||'ARGI';
}
function create(word,r,c,falling=false) {
 const element=document.createElement('button');element.type='button';
 const t={id:++id,word,type:typeOf(word),r,c,element};
 element.className='hd-tile '+t.type;
 const glyph=document.createElement('span');glyph.className='hd-glyph';glyph.textContent=t.type==='root'?'✧':'✦';
 const name=document.createElement('span');name.className='hd-word';name.textContent=word;
 const kind=document.createElement('span');kind.className='hd-kind';kind.textContent=t.type==='root'?'OINARRIA':t.type==='suffix'?'ATZIZKIA':'AURRIZKIA';
 element.append(glyph,name,kind);element.dataset.tileid=t.id;element.setAttribute('aria-label',kind+': '+word);
 element.style.width=unit+'px';element.style.height=unit+'px';element.style.transition='none';
 element.style.transform=place(falling?-3-Math.floor(Math.random()*3):r,c);
 field.appendChild(element);
 return t;
}
function move(t,r,c,animate=true) {
 t.r=r;t.c=c;
 t.element.style.width=unit+'px';t.element.style.height=unit+'px';
 t.element.style.transition=animate?'transform .48s cubic-bezier(.18,1.05,.27,1),filter .18s':'none';
 t.element.style.transform=place(r,c);
}
function relabel(t,word) {
 t.word=word;t.type=typeOf(word);t.element.className='hd-tile '+t.type;
 t.element.querySelector('.hd-word').textContent=word;
 t.element.querySelector('.hd-kind').textContent=t.type==='root'?'OINARRIA':t.type==='suffix'?'ATZIZKIA':'AURRIZKIA';
 t.element.querySelector('.hd-glyph').textContent=t.type==='root'?'✧':'✦';
 t.element.setAttribute('aria-label',word);
 t.element.classList.add('hinted');
 setTimeout(()=>t.element.classList.remove('hinted'),650);
}
function ensureChoices() {
 // Preserve natural matches, then refill if there are fewer than two prefix and three suffix options.
 const target={prefix:2,suffix:3};
 const available=matches();
 const reserved=new Set();
 for(const m of available) {reserved.add(m.a);reserved.add(m.b);}
 const counts={prefix:available.filter(x=>x.rec.type==='prefix').length,suffix:available.filter(x=>x.rec.type==='suffix').length};
 for(const kind of ['prefix','suffix']) {
   const pool=entries.filter(e=>e.type===kind&&(!seen.has(e.result)||entries.length<10));
   const fallback=entries.filter(e=>e.type===kind);
   while(counts[kind]<target[kind]) {
     const candidates=[];
     for(let i=0;i<W*H-1;i++) if(i%W!==W-1&&!reserved.has(i)&&!reserved.has(i+1))candidates.push(i);
     if(!candidates.length)break;
     const i=pick(candidates),recipe=pick(pool.length?pool:fallback);
     if(!recipe)break;
     relabel(board[i],recipe.left);
     relabel(board[i+1],recipe.right);
     reserved.add(i);reserved.add(i+1);
     counts[kind]++;
   }
 }
}
function measure() {
 const width=field.clientWidth;if(width<75)return;
 unit=(width-GAP*(W-1))/W;pitch=unit+GAP;
 field.style.height=(H*unit+(H-1)*GAP)+'px';
 slots.forEach((element,i)=>{
   const p=coords(i);element.style.width=unit+'px';element.style.height=unit+'px';
   element.style.transform=place(p.row,p.column);
 });
 for(const t of board)if(t)move(t,t.r,t.c,false);
}
function generateBoard() {
 field.querySelectorAll('.hd-tile,.hd-particle,.hd-floater').forEach(node=>node.remove());
 board=Array.from({length:W*H},(_,i)=>{
   const p=coords(i);return create(weightedWord(),p.row,p.column);
 });
 ensureChoices();measure();
}
function showMessage(message,kind='') {
 const el=$('hdFeedback');el.textContent=message;el.className='hd-feedback'+(kind?' '+kind:'');
}
function showOverlay(icon,title,description,label) {
 $('hdOverlayIcon').textContent=icon;$('hdOverlayTitle').textContent=title;
 $('hdOverlayDesc').textContent=description;$('hdStart').textContent=label;
 $('hdOverlay').hidden=false;
}
function historyRead() {
 try {
   const raw=window.SustraiCloud?.storage?.getItem(KEY) || localStorage.getItem(KEY) || '[]';
   const parsed=JSON.parse(raw);return Array.isArray(parsed)?parsed:[];
 }catch {return [];}
}
function recordHistory() {
 const record={playedAt:new Date().toISOString(),score,moves:hits,unique:seen.size,prefixes:prefixHits};
 const data=[record,...historyRead()].slice(0,20);
 try {
   if(window.SustraiCloud?.storage) window.SustraiCloud.storage.setItem(KEY,JSON.stringify(data));
   else localStorage.setItem(KEY,JSON.stringify(data));
 }catch { /* session remains playable without storage */ }
}
function bestScore(){return Math.max(0,...historyRead().map(x=>Number(x.score)||0));}
function hud() {
 $('hdTime').textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
 $('hdScore').textContent=score.toLocaleString('eu-ES');$('hdCombo').textContent='×'+Math.max(1,combo);
 $('hdMoves').textContent=hits;
 $('hdGoalMoves').textContent=hits+' / '+missions.moves;
 $('hdGoalWords').textContent=seen.size+' / '+missions.words;
 $('hdGoalPrefixes').textContent=prefixHits+' / '+missions.prefixes;
 $('hdBarMoves').style.width=Math.min(100,100*hits/missions.moves)+'%';
 $('hdBarWords').style.width=Math.min(100,100*seen.size/missions.words)+'%';
 $('hdBarPrefixes').style.width=Math.min(100,100*prefixHits/missions.prefixes)+'%';
 $('hdHintsLeft').textContent=hints;$('hdShufflesLeft').textContent=shuffles;
 $('hdHint').disabled=phase!=='playing'||busy||hints===0;
 $('hdShuffle').disabled=phase!=='playing'||busy||shuffles===0;
 $('hdPause').disabled=phase!=='playing'||busy;
 $('hdSound').setAttribute('aria-pressed',String(sound));
 $('hdBest').textContent=Math.max(score,bestScore()).toLocaleString('eu-ES')+' puntu';
 $('hdCollection').replaceChildren();
 if(!seen.size) {
   const empty=document.createElement('span');empty.className='hd-note';empty.textContent='Aurkitutako hitzak hemen agertuko dira.';
   $('hdCollection').append(empty);
 } else for(const word of seen) {
   const chip=document.createElement('span');chip.className='hd-chip';chip.textContent=word;
   $('hdCollection').append(chip);
 }
 $('hdLastWord').textContent=last?.result||'—';
 $('hdDefinition').textContent=last?(last.definitionEu||last.gloss||''):'Hitza osatzean, esanahia ikusiko duzu.';
 board.forEach((t,i)=>{if(t){t.element.classList.toggle('selected',i===selected);t.element.style.zIndex=i===selected?'5':'2';}});
}
function playSound(freq=530) {
 if(!sound)return;
 try {
   const Context=window.AudioContext||window.webkitAudioContext;
   if(!Context)return;if(!audio)audio=new Context();
   if(audio.state==='suspended')audio.resume();
   const osc=audio.createOscillator(),gain=audio.createGain(),at=audio.currentTime;
   osc.type='triangle';osc.frequency.setValueAtTime(freq,at);osc.frequency.exponentialRampToValueAtTime(freq*1.3,at+.13);
   gain.gain.setValueAtTime(.001,at);gain.gain.exponentialRampToValueAtTime(.06,at+.01);gain.gain.exponentialRampToValueAtTime(.001,at+.16);
   osc.connect(gain).connect(audio.destination);osc.start(at);osc.stop(at+.17);
 }catch {}
}
function effect(t) {
 if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
   const x=t.c*pitch+unit/2,y=t.r*pitch+unit/2;
   for(let n=0;n<14;n++) {
     const p=document.createElement('span');p.className='hd-particle';
     const angle=n*Math.PI*2/14,range=30+Math.random()*65;
     p.style.left=x+'px';p.style.top=y+'px';
     p.style.background=n%2?'#9affed':'#ffe4a5';p.style.color=p.style.background;
     p.style.setProperty('--dx',Math.cos(angle)*range+'px');
     p.style.setProperty('--dy',Math.sin(angle)*range+'px');
     field.appendChild(p);setTimeout(()=>p.remove(),750);
   }
 }
 if(t.element.animate) {
   const at=t.element.style.transform;
   t.element.animate([
     {transform:at+' scale(1)',opacity:1},
     {transform:at+' scale(1.2)',opacity:1,offset:.35},
     {transform:at+' scale(.05)',opacity:0}
   ],{duration:335,fill:'forwards'});
 }
}
function floatPoints(a,b,points) {
 const A=board[a],B=board[b],p=document.createElement('span');
 p.className='hd-floater';p.textContent='+'+points;
 p.style.left=((A.c+B.c)*pitch/2+unit/2)+'px';p.style.top=((A.r+B.r)*pitch/2+unit/2)+'px';
 field.appendChild(p);setTimeout(()=>p.remove(),1000);
}
function gravity() {
 for(let c=0;c<W;c++){
   const stack=[];
   for(let r=H-1;r>=0;r--)if(board[r*W+c])stack.push(board[r*W+c]);
   for(let r=H-1,k=0;r>=0;r--){
     const i=r*W+c;
     board[i]=k<stack.length?stack[k++]:create(weightedWord(),-3-Math.floor(Math.random()*3),c,true);
   }
 }
 requestAnimationFrame(()=>requestAnimationFrame(()=>{
   board.forEach((t,i)=>{const p=coords(i);move(t,p.row,p.column);});
 }));
}
function stopClock() {if(clock!==null){clearInterval(clock);clock=null;}}
function startClock(){
 if(clockStarted)return;clockStarted=true;
 clock=setInterval(()=>{
   if(phase!=='playing')return;
   seconds=Math.max(0,seconds-1);hud();
   if(seconds===0)finish();
 },1000);
}
function finish() {
 if(phase==='ended')return;
 phase='ended';epoch++;busy=false;stopClock();recordHistory();
 const complete=hits>=missions.moves&&seen.size>=missions.words&&prefixHits>=missions.prefixes;
 showOverlay(complete?'🏆':'⏳',complete?'ERRONKA GAINDITUTA!':'PARTIDA AMAITUTA',
  hits+' hitz osatu dituzu; '+seen.size+' desberdin, '+prefixHits+' aurrizkiekin. '+score.toLocaleString('eu-ES')+' puntu.',
  '↻ BERRIRO JOKATU');
 hud();
}
function pause(){
 if(phase!=='playing'||busy)return;
 phase='paused';stopClock();clockStarted=false;
 showOverlay('⏸','ATSEDENALDIA','Partida geldituta dago. Jarraitzeko prest zaudenean, sakatu botoia.','▶ JARRAITU');hud();
}
function start(){
 if(phase==='paused') {phase='playing';$('hdOverlay').hidden=true;if(hits||selected>=0)startClock();hud();return;}
 epoch++;stopClock();
 phase='playing';busy=false;selected=-1;seconds=DURATION;clockStarted=false;score=0;hits=0;combo=0;prefixHits=0;
 seen=new Set();last=null;hints=5;shuffles=3;goalsCelebrated=false;
 generateBoard();$('hdOverlay').hidden=true;hud();
 showMessage('✦ Hautatu bi pieza elkarren ondoan. Lehen mugimenduan hasiko da erlojua.');
}
async function combine(a,b) {
 if(phase!=='playing'||busy||!nearby(a,b))return;
 selected=-1;startClock();
 const rec=findMatch(board[a],board[b]);
 if(!rec) {
   combo=0;playSound(210);hud();
   arena.classList.remove('shake');void arena.offsetWidth;arena.classList.add('shake');
   showMessage('Konbinazio hori ez da katalogoan agertzen. Saiatu beste bi piezarekin.','bad');
   setTimeout(()=>arena.classList.remove('shake'),330);
   return;
 }
 busy=true;combo=Math.min(5,combo+1);hits++;
 const fresh=!seen.has(rec.result);seen.add(rec.result);
 if(rec.type==='prefix')prefixHits++;
 const points=100+(combo-1)*35+(rec.type==='prefix'?50:0)+(fresh?40:0);
 score+=points;last=rec;hud();playSound(480+combo*85);
 showMessage('✦ '+rec.result+' · '+rec.gloss+' · +'+points+' puntu','good');
 floatPoints(a,b,points);
 const one=board[a],two=board[b];effect(one);effect(two);
 arena.classList.remove('flash');void arena.offsetWidth;arena.classList.add('flash');
 const currentEpoch=epoch;
 await wait(355);if(currentEpoch!==epoch||phase!=='playing')return;
 one.element.remove();two.element.remove();board[a]=null;board[b]=null;
 gravity();
 await wait(540);if(currentEpoch!==epoch||phase!=='playing')return;
 ensureChoices();busy=false;hud();
 if(!goalsCelebrated&&hits>=missions.moves&&seen.size>=missions.words&&prefixHits>=missions.prefixes){
   goalsCelebrated=true;
   showMessage('🏆 Hiru erronkak osatu dituzu! Jarraitu denbora amaitu arte.','good');
 }
}
function clickTile(i) {
 if(phase!=='playing'||busy)return;
 if(selected===-1){selected=i;startClock();hud();return;}
 if(selected===i){selected=-1;hud();return;}
 if(!nearby(selected,i)) {selected=i;hud();return;}
 combine(selected,i);
}
function hint(){
 if(phase!=='playing'||busy||!hints)return;
 const options=matches();if(!options.length){ensureChoices();return;}
 hints--;
 const prefix=options.filter(x=>x.rec.type==='prefix');
 const example=pick(prefix.length&&prefixHits<missions.prefixes?prefix:options);
 const A=board[example.a],B=board[example.b];
 A.element.classList.add('hinted');B.element.classList.add('hinted');
 setTimeout(()=>{A.element.classList.remove('hinted');B.element.classList.remove('hinted');},1900);
 hud();showMessage('✧ Distiratsu agertzen diren bi piezak hautatu.');
}
function shuffle(){
 if(phase!=='playing'||busy||!shuffles)return;
 shuffles--;combo=0;selected=-1;
 for(let i=board.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[board[i],board[j]]=[board[j],board[i]];}
 board.forEach((t,i)=>{const p=coords(i);move(t,p.row,p.column);});
 ensureChoices();hud();showMessage('⇄ Piezak nahastu dira. Bilatu beste hitz bat!');
}
for(let i=0;i<W*H;i++){
 const slot=document.createElement('span');slot.className='hd-slot';field.appendChild(slot);slots.push(slot);
}
generateBoard();hud();
const observer=typeof ResizeObserver==='function'?new ResizeObserver(measure):null;
if(observer)observer.observe(field);
else window.addEventListener('resize',measure);
field.addEventListener('click',event=>{
 if(suppress){suppress=false;return;}
 const node=event.target.closest('.hd-tile');if(!node)return;
 const i=board.findIndex(t=>t&&t.id===Number(node.dataset.tileid));
 if(i>=0)clickTile(i);
});
field.addEventListener('pointerdown',event=>{
 const node=event.target.closest('.hd-tile');
 if(node)drag={id:Number(node.dataset.tileid),x:event.clientX,y:event.clientY};
});
field.addEventListener('pointerup',event=>{
 if(!drag)return;
 const previous=drag;drag=null;
 if(Math.hypot(event.clientX-previous.x,event.clientY-previous.y)<14)return;
 const destination=document.elementFromPoint(event.clientX,event.clientY)?.closest('.hd-tile');
 if(!destination||!field.contains(destination))return;
 suppress=true;setTimeout(()=>suppress=false,100);
 const a=board.findIndex(t=>t&&t.id===previous.id);
 const b=board.findIndex(t=>t&&t.id===Number(destination.dataset.tileid));
 if(a>=0&&b>=0&&nearby(a,b))combine(a,b);
});
field.addEventListener('pointercancel',()=>{drag=null;});
$('hdStart').addEventListener('click',start);
$('hdPause').addEventListener('click',pause);
$('hdHint').addEventListener('click',hint);
$('hdShuffle').addEventListener('click',shuffle);
$('hdSound').addEventListener('click',()=>{sound=!sound;hud();if(sound)playSound(600);});
showOverlay('💎','HITZAK SORTU!','Hautatu elkarren ondoko oinarria eta aurrizki edo atzizki bat. 3 minutu, hainbat erronka, eta hitz berriak!','▶ JOLASTU');
// Read only existing Supabase sources. The relation map remains a curated pilot, not an automatic morphology engine.
Promise.resolve(window.SustraiCloud?.ready).then(()=>source.load(window.SustraiCloud)).then(result=>{
 if(!result)return;
 sourceOrigin=result.origin;
 if(phase==='intro'){configureCatalog(result.entries);generateBoard();hud();}
 $('hdSource').textContent=sourceOrigin==='supabase-results'
   ?'Lexikoako '+result.matches+' hitz baliatu dira. Loturak pilotuan.'
   :'Pilotuko hitz-zerrenda erabilgarri; Supabaseko egiaztapena ez dago aktibo.';
}).catch(()=>{
 $('hdSource').textContent='Pilotuko hitz-zerrenda erabilgarri (konexiorik gabe).';
});
})();