/* SUSTRAI · Gurutzegramak · pilotua 1.0
   Fixed, verified interlocking layout; original clues adapted from Oposik osasun entries.
   No external request, answer grading service, official-level claim or new DB table.
   One shared cell per intersection; no independent, conflicting copies of letters. */
(() => {
  'use strict';
  const root = document.getElementById('cxApp');
  if (!root) return;

  // A new dated, authored board arrives from Supabase every Euskadi-local day.
  // No future crossword answers are shipped in this public script.
  let WORDS=[],ROWS=0,COLS=0,byId=new Map(),grid=new Map(),ordered=[];
  let SAVE_KEY='',BEST_KEY='',PUZZLE_VERSION='',activePuzzle=null;
  let dailyDate='', dailyRecords={}, cloud, best=null, loading=false, dailyNotice='';
  const COST_HINT=40, COST_WRONG=15;
  const key=(r,c)=>r+','+c;
  const pos=(w,i)=>[w.r+(w.dir==='V'?i:0),w.c+(w.dir==='H'?i:0)];
  const madridDate=()=>{
    const p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Madrid',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const value=part=>p.find(x=>x.type===part)?.value;
    return value('year')+'-'+value('month')+'-'+value('day');
  };
  const dateDisplay=day=>{
    if(!/^\d{4}-\d{2}-\d{2}$/.test(day))return '';
    return new Intl.DateTimeFormat('eu-ES',{day:'numeric',month:'long',year:'numeric',timeZone:'UTC'})
      .format(new Date(day+'T12:00:00Z'));
  };
  const dailySaveKey=id=>'sustrai-crossword-daily-'+id+'-progress-v1';
  const dailyBestKey=id=>'sustrai-crossword-daily-'+id+'-best-v1';
  const dailyCacheKey=date=>'sustrai-crossword-daily-cache-'+date+'-v1';
  function setPuzzle(p) {
    const rows=Number(p.grid_rows),cols=Number(p.grid_cols),raw=p.entries;
    if(!p?.id||!Number.isInteger(rows)||!Number.isInteger(cols)||
      rows<5||rows>19||cols<5||cols>19||!Array.isArray(raw)||raw.length<8||raw.length>18)
      throw Error('Gurutzegramaren datuak ez dira zuzenak.');
    const entries=raw.map(x=>({...x,
      word:String(x.word||'').toUpperCase(),
      r:Number(x.r),c:Number(x.c),
      clue:String(x.clue||''),explanation:String(x.explanation||''),source:String(x.source||'')
    }));
    const ids=new Set(),terms=new Set(),cells=new Map();
    for(const w of entries) {
      if(!w.id||ids.has(w.id)||terms.has(w.word)||!/^[A-Z]{4,12}$/.test(w.word)||
        !['H','V'].includes(w.dir)||!Number.isInteger(w.r)||!Number.isInteger(w.c)||
        !w.clue.trim()||!w.explanation.trim()||!w.source.trim())throw Error('Hitz okerra edo errepikatua.');
      ids.add(w.id);terms.add(w.word);
      for(let i=0;i<w.word.length;i++){
        const [r,c]=pos(w,i);
        if(r<0||c<0||r>=rows||c>=cols)throw Error('Kokaleku okerra.');
        const k=key(r,c),prev=cells.get(k);
        if(prev&&(prev.letter!==w.word[i]||prev.dirs.has(w.dir)||prev.owners.length>=2))
          throw Error('Gurutzaketa okerra.');
        if(!prev)cells.set(k,{letter:w.word[i],owners:[w.id],dirs:new Set([w.dir]),number:null});
        else{prev.owners.push(w.id);prev.dirs.add(w.dir);}
      }
    }
    const connected=new Set(),pending=[entries[0].id];
    while(pending.length){
      const id=pending.pop();if(connected.has(id))continue;
      connected.add(id);
      for(const cell of cells.values())if(cell.owners.includes(id))
        for(const partner of cell.owners)if(!connected.has(partner))pending.push(partner);
    }
    if(connected.size!==entries.length)throw Error('Taula ez dago konektatuta.');
    const starts=[...new Set(entries.map(w=>key(w.r,w.c)))].sort((x,y)=>{
      const [xr,xc]=x.split(',').map(Number),[yr,yc]=y.split(',').map(Number);
      return xr-yr||xc-yc;
    });
    starts.forEach((k,i)=>{cells.get(k).number=i+1;});
    entries.forEach(w=>{w.number=cells.get(key(w.r,w.c)).number;});
    WORDS=entries;ROWS=rows;COLS=cols;
    grid=cells;byId=new Map(entries.map(w=>[w.id,w]));
    ordered=[...entries].sort((x,y)=>x.number-y.number);
    activePuzzle=p;PUZZLE_VERSION=p.id;
    SAVE_KEY=dailySaveKey(p.id);BEST_KEY=dailyBestKey(p.id);
    best=null;
  }
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
  // The competitive clock is wall-clock elapsed. Leaving the tab does not pause a challenge.
  // Scores are PERSONAL and device/account based, never a server-verified public ranking.
  const fresh = (mode = 'ikasi', phase = 'setup') => ({
    phase,mode,active:ordered[0]?.id||'',drafts:{},checked:{},hints:{},
    revealed:{},lastWrong:{},modified:[],startedAt:0,finishedAt:0,
    stats:{hints:0,wrong:0},feedback:''
  });
  let state = fresh();

  function elapsedSeconds() {
    if (state.mode !== 'erronka' || !state.startedAt) return 0;
    const end = state.finishedAt || Date.now();
    return Math.max(0,Math.floor((end-state.startedAt)/1000));
  }
  function fmtTime(seconds) {
    const n = Math.max(0,Math.floor(seconds));
    return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0');
  }
  function scoreBreakdown() {
    const correct = solvedCount(),seconds=elapsedSeconds();
    const base=correct*100;
    const bonus=correct === WORDS.length ? Math.max(0,Math.round(300-seconds/2)) : 0;
    const hints=Math.max(0,state.stats.hints)*COST_HINT;
    const wrong=Math.max(0,state.stats.wrong)*COST_WRONG;
    return {correct,seconds,base,bonus,hints,wrong,total:Math.max(0,base+bonus-hints-wrong)};
  }
  function getStorage(key) {
    try {return cloud?.storage ? cloud.storage.getItem(key) : window.localStorage.getItem(key);} catch {return null;}
  }
  function setStorage(key,value) {
    try {
      if (cloud?.storage) cloud.storage.setItem(key,value);
      else window.localStorage.setItem(key,value);
    } catch { /* Device storage is optional. */ }
  }
  function readBest() {
    try {
      const p=JSON.parse(getStorage(BEST_KEY)||'null');
      if(p?.version===PUZZLE_VERSION && Number.isInteger(p.score) && p.score>=0 && p.mode==='erronka'
        && Number.isFinite(p.seconds) && p.seconds>=0) best=p;
    } catch {best=null;}
  }
  function readSaved() {
    try {
      const p=JSON.parse(getStorage(SAVE_KEY)||'null');
      if(p?.schema!==2||p.version!==PUZZLE_VERSION||!p.drafts||typeof p.drafts!=='object')
        return false;
      const v=fresh(activePuzzle.mode,'playing');
      if(['playing','finished'].includes(p.phase))v.phase=p.phase;
      v.active=byId.has(p.active)?p.active:v.active;
      for(const w of WORDS){
        const val=p.drafts[w.id];
        if(typeof val==='string')v.drafts[w.id]=val.toUpperCase().replace(/[^A-Z]/g,'').slice(0,w.word.length);
        if(p.checked?.[w.id]==='correct'&&v.drafts[w.id]===w.word)v.checked[w.id]='correct';
        if(Number.isInteger(p.hints?.[w.id]))v.hints[w.id]=Math.max(0,Math.min(w.word.length,p.hints[w.id]));
        const positions=p.revealed?.[w.id];
        if(Array.isArray(positions))v.revealed[w.id]=[...new Set(positions.filter(n=>Number.isInteger(n)&&n>=0&&n<w.word.length))];
        if(typeof p.lastWrong?.[w.id]==='string')v.lastWrong[w.id]=p.lastWrong[w.id].slice(0,w.word.length);
      }
      v.modified=Array.isArray(p.modified)?p.modified.filter(x=>byId.has(x)).slice(-WORDS.length):[];
      v.startedAt=Number.isFinite(p.startedAt)&&p.startedAt>0?p.startedAt:0;
      v.finishedAt=Number.isFinite(p.finishedAt)&&p.finishedAt>0?p.finishedAt:0;
      v.stats.hints=Math.max(0,Math.min(500,Number.isInteger(p.stats?.hints)?p.stats.hints:0));
      v.stats.wrong=Math.max(0,Math.min(500,Number.isInteger(p.stats?.wrong)?p.stats.wrong:0));
      if(v.mode==='erronka'&&!v.startedAt&&v.phase==='playing')v.startedAt=Date.now();
      if(v.phase==='finished'&&WORDS.some(w=>v.checked[w.id]!=='correct'))v.phase='playing';
      if(v.phase==='playing'&&WORDS.every(w=>v.checked[w.id]==='correct'))v.phase='finished';
      state=v;return true;
    }catch{return false;}
  }
  async function loadDaily() {
    if(loading)return;
    loading=true;dailyDate=madridDate();dailyNotice='';
    root.innerHTML='<section class="cx-loading" role="status"><h2>Gaurko gurutzegramak prestatzen…</h2>'+
      '<p>Ikasteko eta Erronka moduetako taulak kargatzen ari gara.</p></section>';
    try{
      let rows=null;
      const client=cloud?.client?.();
      if(client){
        const {data,error}=await client.from('smx_crossword_daily')
          .select('id,play_date,mode,level,theme_eu,title_eu,grid_rows,grid_cols,entries,status')
          .eq('play_date',dailyDate).eq('level','C1')
          .in('mode',['ikasi','erronka']).in('status',['pilot','published']);
        if(!error&&Array.isArray(data)&&data.length===2)rows=data;
      }
      if(!rows){
        try{
          const cached=JSON.parse(getStorage(dailyCacheKey(dailyDate))||'null');
          if(Array.isArray(cached)&&cached.length===2)rows=cached;
        }catch{ /* Offline cache is optional. */ }
      }
      if(!rows||rows.length!==2||
        !rows.some(x=>x.mode==='ikasi')||!rows.some(x=>x.mode==='erronka'))
        throw Error('Gaurko bi gurutzegramak ez daude erabilgarri. Egiaztatu konexioa edo saiatu berriro.');
      const byMode={};
      for(const p of rows){
        if(p.play_date!==dailyDate||p.level!=='C1'||!['ikasi','erronka'].includes(p.mode))
          throw Error('Eguneko datuak ez datoz bat.');
        setPuzzle(p);
        byMode[p.mode]=p;
      }
      const sWords=new Set(byMode.ikasi.entries.map(w=>String(w.word).toUpperCase()));
      if(byMode.erronka.entries.some(w=>sWords.has(String(w.word).toUpperCase())))
        throw Error('Bi moduek erantzun bera dute: berrikusi katalogoa.');
      dailyRecords=byMode;
      setStorage(dailyCacheKey(dailyDate),JSON.stringify(rows));
      state=fresh('ikasi','setup');
      render();
    }catch(error){
      dailyRecords={};
      root.innerHTML='<section class="cx-mode-intro cx-day-error" role="alert">'+
        '<p class="cx-overline">GAURKO GURUTZEGRAMA</p><h2>Ezin izan dugu jokoa ireki.</h2>'+
        '<p>'+escapeHtml(error?.message||'Katalogoa ezin izan da kargatu.')+'</p>'+
        '<button class="cx-button primary" type="button" data-action="retry-daily">Berriz saiatu</button></section>';
    }finally{loading=false;}
  }
  function save() {
    const payload=JSON.stringify({schema:2,version:PUZZLE_VERSION,phase:state.phase,mode:state.mode,
      active:state.active,drafts:state.drafts,checked:state.checked,hints:state.hints,
      revealed:state.revealed,lastWrong:state.lastWrong,modified:state.modified,
      startedAt:state.startedAt,finishedAt:state.finishedAt,stats:state.stats});
    setStorage(SAVE_KEY,payload);
  }
  function start(mode) {
    if(!['ikasi','erronka'].includes(mode)||!dailyRecords[mode])return;
    try{setPuzzle(dailyRecords[mode]);}catch(error){
      root.innerHTML='<p class="cx-feedback" role="alert">'+escapeHtml(error?.message||'Taula hondatuta dago.')+'</p>';
      return;
    }
    readBest();
    const restored=readSaved();
    if(!restored||state.phase!=='playing'){
      state=fresh(mode,'playing');
      state.startedAt=Date.now();
    }
    save();render();
    root.querySelector('#cxWordInput')?.focus();
  }
  function finish() {
    if(state.phase!=='playing'||solvedCount()!==WORDS.length)return;
    state.phase='finished';state.finishedAt=Date.now();
    if(state.mode==='erronka') {
      const score=scoreBreakdown();
      const result={version:PUZZLE_VERSION,mode:'erronka',score:score.total,
        seconds:score.seconds,hints:state.stats.hints,wrong:state.stats.wrong,
        completedAt:new Date(state.finishedAt).toISOString()};
      if(!best || result.score>best.score ||
        (result.score===best.score&&result.seconds<best.seconds)) {
        best=result;setStorage(BEST_KEY,JSON.stringify(best));
      }
    }
    save();
  }

  function solved(w) { return state.checked[w.id] === 'correct' && state.drafts[w.id] === w.word; }
  function solvedCount() { return WORDS.filter(solved).length; }
  function setActive(id,focus) {
    if (!byId.has(id)) return;
    state.active = id; save(); render();
    if (focus) root.querySelector('#cxWordInput')?.focus();
  }
  function touchWord(id) {
    state.modified = state.modified.filter(x=>x!==id);
    state.modified.push(id);
  }
  function displayLetters() {
    const out = new Map();
    const addDraft = w => {
      const draft = state.drafts[w.id] || '';
      for (let i=0;i<Math.min(draft.length,w.word.length);i++) {
        if (draft[i]) { const [r,c]=pos(w,i);out.set(key(r,c),draft[i]); }
      }
    };
    for (const id of state.modified) {
      const w = byId.get(id);
      if (w && !solved(w)) addDraft(w);
    }
    for (const w of WORDS) if (!state.modified.includes(w.id) && !solved(w)) addDraft(w);
    // Correctly solved words are authoritative at their intersections.
    for (const w of WORDS) if (solved(w)) for (let i=0;i<w.word.length;i++) {
      const [r,c]=pos(w,i);out.set(key(r,c),w.word[i]);
    }
    return out;
  }
  function cellMarkup(r,c,values) {
    const cell = grid.get(key(r,c));
    if (!cell) return '<span class="cx-cell is-block" aria-hidden="true"></span>';
    const current = byId.get(state.active);
    const idx = cell.owners.includes(current.id) ?
      (current.dir === 'H' ? c-current.c : r-current.r) : -1;
    const selected = idx >= 0;
    const currentStatus = state.checked[current.id];
    const otherSolved = cell.owners.some(id=>solved(byId.get(id)));
    const typed = (state.drafts[current.id] || '')[idx] || '';
    const classes=['cx-cell'];
    if (selected) classes.push('is-active');
    if (selected && idx === 0) classes.push('is-focus');
    if (otherSolved) classes.push('is-solved');
    if (selected && currentStatus === 'wrong' && typed) classes.push(state.mode==='erronka'?'is-wrong':(typed===current.word[idx]?'is-right':'is-wrong'));
    if (selected && currentStatus === 'correct') classes.push('is-solved');
    const label = (cell.number ? cell.number + '. ' : '') +
      'Gelaxka: ' + (values.get(key(r,c)) || 'hutsik') + '. Sakatu hitz bat aukeratzeko.';
    return '<button type="button" class="'+classes.join(' ')+'" data-cell="'+key(r,c)+'" aria-label="'+
      escapeHtml(label)+'">'+(cell.number?'<span class="cx-cell-number">'+cell.number+'</span>':'')+
      '<span class="cx-cell-letter">'+escapeHtml(values.get(key(r,c)) || '')+'</span></button>';
  }
  function groupHtml(dir,label,arrow) {
    const items = ordered.filter(w=>w.dir===dir);
    return '<section class="cx-clue-group" aria-labelledby="cx-'+dir+'"><h3 id="cx-'+dir+'"><span aria-hidden="true">'+arrow+'</span>'+label+'</h3>'+
      '<div class="cx-clue-list">'+items.map(w=>
        '<button type="button" class="cx-clue'+(w.id===state.active?' is-active':'')+
        (solved(w)?' is-correct':'')+'" data-word="'+w.id+'" aria-pressed="'+String(w.id===state.active)+'">'+
        '<span class="cx-clue-no">'+w.number+'.</span><span class="cx-clue-copy">'+escapeHtml(w.clue)+'</span>'+
        (solved(w)?'<span class="cx-clue-state" aria-label="Ondo">✓</span>':
         '<span class="cx-clue-length">'+w.word.length+'</span>')+'</button>'
      ).join('')+'</div></section>';
  }
  function feedbackHtml(w) {
    const status = state.checked[w.id];
    if (!status) return '';
    if (status === 'correct') return '<div class="cx-feedback is-correct" id="cxFeedback" role="status">'+
      '<span class="cx-feedback-icon" aria-hidden="true">✓</span><div><strong>Ondo! '+escapeHtml(w.word)+'</strong>'+
      escapeHtml(w.explanation)+'<div class="cx-explanation">Hiztegi-erreferentzia: '+escapeHtml(w.source)+'</div></div></div>';
    if (status === 'incomplete') return '<div class="cx-feedback is-neutral" id="cxFeedback" role="status">'+
      '<span class="cx-feedback-icon" aria-hidden="true">i</span><div><strong>Hitz osoa idatzi.</strong>'+
      'Hitz honek '+w.word.length+' letra ditu. Begiratu gurutzaketak eta saiatu berriro.</div></div>';
    return '<div class="cx-feedback" id="cxFeedback" role="status"><span class="cx-feedback-icon" aria-hidden="true">×</span>'+
      '<div><strong>Erantzuna ez da zuzena.</strong>'+
      (state.mode==='erronka'?'Saiakera okerra: −'+COST_WRONG+' puntu. Ez da letraz letrako zuzenketarik ematen.':
      'Gorriz ageri dira bat ez datozen letrak; berdez, bat datozenak.')+'</div></div>';
  }
  function renderSetup() {
    const challenge=dailyRecords.erronka,study=dailyRecords.ikasi;
    if(!challenge||!study)return;
    let dailyBest=null;
    try{
      const found=JSON.parse(getStorage(dailyBestKey(challenge.id))||'null');
      if(found?.version===challenge.id&&Number.isInteger(found.score))dailyBest=found;
    }catch{/* no record yet */}
    const progressFor=p=>{
      try{
        const x=JSON.parse(getStorage(dailySaveKey(p.id))||'null');
        return x?.version===p.id&&x.phase==='playing'?'Jarraitu':
          x?.version===p.id&&x.phase==='finished'?'Berriz jokatu':'Hasi';
      }catch{return 'Hasi';}
    };
    const lastDays=[];
    const from=new Date(dailyDate+'T12:00:00Z');
    for(let i=1;i<=7;i++){
      const d=new Date(from.getTime()-i*86400000).toISOString().slice(0,10);
      try{
        const found=JSON.parse(getStorage(dailyBestKey(d+'-C1-erronka'))||'null');
        if(found?.version===d+'-C1-erronka'&&Number.isInteger(found.score))
          lastDays.push({date:d,score:found.score,seconds:found.seconds});
      }catch {/* no older score */}
    }
    root.innerHTML='<section class="cx-mode-intro" aria-labelledby="cxModeTitle">'+
      '<div class="cx-mode-title"><p class="cx-overline">EGUNEKO BI GURUTZEGRAMA · '+escapeHtml(dateDisplay(dailyDate))+'</p>'+
      '<h2 id="cxModeTitle">Gaurko hitzak, bi erronka.</h2>'+
      '<p>'+escapeHtml(study.theme_eu)+'. Ikasteko eta Erronka moduetan hitz desberdinak izango dituzu. '+
      'Bihar, 00:00etan (Euskadiko ordua), beste bi taula agertuko dira.</p></div>'+
      '<div class="cx-mode-cards">'+
      '<button type="button" class="cx-mode-card" data-action="start" data-mode="ikasi">'+
      '<span class="cx-mode-icon" aria-hidden="true">✦</span><span class="cx-mode-card-tag">EGUNEKO IKASKETA · '+study.entries.length+' HITZ</span>'+
      '<strong>Ikasteko modua</strong>'+
      '<span>Definizioak, pistak, azalpenak eta errepikapen librea. Ez dago denbora-presiorik edo zigorrik.</span>'+
      '<span class="cx-mode-cta">'+progressFor(study)+' <b aria-hidden="true">↗</b></span></button>'+
      '<button type="button" class="cx-mode-card cx-mode-card-challenge" data-action="start" data-mode="erronka">'+
      '<span class="cx-mode-icon" aria-hidden="true">♜</span><span class="cx-mode-card-tag">EGUNEKO ERRONKA · '+challenge.entries.length+' HITZ</span>'+
      '<strong>Erronka modua</strong>'+
      '<span>Erlojuaren kontra: +100 puntu hitzeko, −40 pista bakoitzeko eta −15 erantzun oker berri bakoitzeko.</span>'+
      '<span class="cx-mode-cta">'+progressFor(challenge)+' <b aria-hidden="true">↗</b></span></button>'+
      '</div>'+
      (dailyBest?'<div class="cx-record"><span class="cx-record-icon" aria-hidden="true">★</span>'+
      '<div><strong>Gaurko marka pertsonala</strong><span>'+dailyBest.score+' puntu · '+fmtTime(dailyBest.seconds)+
      ' · '+dailyBest.hints+' pista</span></div></div>':'')+
      (lastDays.length?'<section class="cx-previous"><h3>Azken egunetako markak</h3><div class="cx-previous-grid">'+
      lastDays.map(x=>'<div><span>'+escapeHtml(dateDisplay(x.date))+'</span><strong>'+
        x.score+' puntu</strong><small>'+fmtTime(x.seconds)+'</small></div>').join('')+'</div></section>':'')+
      '<p class="cx-mode-foot">Bi modalitateek taula ezberdinak dituzte; eguneko erronka bera da maila bereko '+
      'ikasle guztientzat. Markak pertsonalak dira, ez sailkapen publiko egiaztatuak.</p></section>';
  }
  function render() {
    if(state.phase==='setup'){renderSetup();return;}
    const w=byId.get(state.active),done=solvedCount(),progress=Math.round(done/WORDS.length*100);
    const competitive=state.mode==='erronka',scores=scoreBreakdown(),completed=state.phase==='finished';
    const values=displayLetters(),cells=[];
    for (let r=0;r<ROWS;r++) for (let c=0;c<COLS;c++) cells.push(cellMarkup(r,c,values));
    const counters=competitive?
      '<div class="cx-metrics" aria-label="Erronkaren emaitzak">'+
      '<div class="cx-metric"><span>DENBORA</span><strong id="cxClock">'+fmtTime(scores.seconds)+'</strong></div>'+
      '<div class="cx-metric cx-metric-score"><span>PUNTUAK</span><strong id="cxPoints">'+scores.total+'</strong></div>'+
      '<div class="cx-metric"><span>PISTAK</span><strong>'+state.stats.hints+' <small>· −'+scores.hints+'</small></strong></div>'+
      '<div class="cx-metric"><span>HUTSEGITEAK</span><strong>'+state.stats.wrong+' <small>· −'+scores.wrong+'</small></strong></div></div>'
      :'<div class="cx-progress-right"><div class="cx-progress-num" aria-label="'+done+' hitz, guztira '+WORDS.length+'">'+
      done+' <small>/ '+WORDS.length+'</small></div>'+
      '<div class="cx-progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="'+WORDS.length+
      '" aria-valuenow="'+done+'" aria-label="Hitz osatuak"><div class="cx-progress-fill" style="width:'+progress+'%"></div></div></div>';
    let completion='';
    if(completed){
      if(competitive){
        completion='<section class="cx-final" role="status" aria-labelledby="cxFinalTitle">'+
          '<p class="cx-final-kicker">ERRONKA AMAITUTA</p><h2 id="cxFinalTitle">Zorionak! '+WORDS.length+' hitzak osatu dituzu.</h2>'+
          '<p class="cx-final-total">'+scores.total+' <small>puntu</small></p>'+
          '<div class="cx-final-breakdown"><div><span>Hitz zuzenak</span><b>+'+scores.base+'</b></div>'+
          '<div><span>Denbora-saria · '+fmtTime(scores.seconds)+'</span><b>+'+scores.bonus+'</b></div>'+
          '<div><span>Pistak · '+state.stats.hints+'</span><b>−'+scores.hints+'</b></div>'+
          '<div><span>Erantzun okerrak · '+state.stats.wrong+'</span><b>−'+scores.wrong+'</b></div></div>'+
          (best?'<p class="cx-best-note">★ Zure marka onena: '+best.score+' puntu ('+fmtTime(best.seconds)+')</p>':'')+
          '<button class="cx-button secondary" type="button" data-action="reset">Beste partida bat →</button></section>';
      } else completion='<section class="cx-complete" role="status"><h2>✓ Zorionak! Gurutzegrama osatu duzu.</h2>'+
        '<p>'+WORDS.length+' hitzak asmatu dituzu. Saiatu geroago definizioak laguntzarik gabe gogoratzen.</p>'+
        '<button class="cx-button secondary" type="button" data-action="reset">Beste partida bat →</button></section>';
    }
    root.innerHTML =
      '<div class="cx-statusbar"><div class="cx-status-intro"><div class="cx-playing-label">'+
      '<span class="cx-game-mode">'+(competitive?'✦ ERRONKA MODUA':'✦ IKASTEKO MODUA')+'</span>'+
      '<span class="cx-game-count">'+done+' / '+WORDS.length+' hitz</span></div>'+
      '<h2>'+escapeHtml(activePuzzle?.theme_eu||'Osasuna')+' · '+escapeHtml(dateDisplay(activePuzzle?.play_date||dailyDate))+'</h2>'+
      '<p>'+(competitive?'Azkar jokatu, baina ez asmatu itsu-itsuan. Pista bakoitzak kostua dauka.':
      'Hitzak osatu eta azalpenekin ikasi. Pistak libre dituzu.')+'</p></div>'+counters+'</div>'+
      '<div class="cx-pdf-actions"><button class="cx-button secondary" type="button" data-action="pdf-student">Ikaslearen PDFa</button>'+
      '<button class="cx-button secondary" type="button" data-action="pdf-teacher">Irakaslearen PDFa</button>'+
      '<span class="cx-pdf-status" role="status" aria-live="polite"></span></div>'+
      '<div class="cx-layout"><section class="cx-board-card" aria-label="Gurutzegramaren taula">'+
      '<div class="cx-board-top"><div><p class="cx-overline">EGUNEKO TAULA · '+escapeHtml(state.mode.toUpperCase())+'</p>'+
      '<h2>Gurutzegrama</h2><p class="cx-board-note">Hautatu gelaxka edo eskuineko pista, eta idatzi hitza.</p></div>'+
      '<button type="button" class="cx-reset" data-action="reset">Beste partida bat</button></div>'+
      '<div class="cx-grid-scroll" tabindex="0" aria-label="Gurutzegramaren taula; mugitu horizontalean behar izanez gero">'+
      '<div class="cx-grid" role="group" aria-label="'+ROWS+' errenkada, '+COLS+' zutabe" style="--cx-rows:'+ROWS+';--cx-cols:'+COLS+'">'+cells.join('')+'</div></div>'+
      '<div class="cx-legend" aria-hidden="true"><span><i></i>Hautatua</span><span><i></i>Zuzena</span><span><i></i>Okerra</span></div>'+
      '<section class="cx-answer-card" aria-labelledby="cxAnswerLabel">'+
      '<div class="cx-answer-header"><span class="cx-answer-label" id="cxAnswerLabel">'+w.number+'. '+(w.dir==='H'?'HORIZONTALA':'BERTIKALA')+'</span>'+
      '<span class="cx-answer-count">'+w.word.length+' letra</span></div>'+
      '<p class="cx-answer-clue">'+escapeHtml(w.clue)+'</p>'+
      '<label class="sr-only" for="cxWordInput">Erantzuna, '+w.word.length+' letra</label>'+
      '<div class="cx-input-row"><input id="cxWordInput" class="cx-word-input" type="text" inputmode="text" spellcheck="false" '+
      'autocomplete="off" autocapitalize="characters" maxlength="'+w.word.length+'" value="'+
      escapeHtml(state.drafts[w.id] || '')+'" placeholder="Idatzi hitza…" '+
      (solved(w)||completed?'disabled aria-label="Hitz zuzena"':'')+'>'+
      '<button class="cx-button primary" type="button" data-action="check"'+(solved(w)||completed?' disabled':'')+'>Egiaztatu ✓</button></div>'+
      '<div class="cx-button-row"><button class="cx-button secondary" type="button" data-action="hint"'+(solved(w)||completed?' disabled':'')+
      '>💡 Pista bat'+(competitive?' <span class="cx-cost">−'+COST_HINT+' puntu</span>':'')+'</button>'+
      '<button class="cx-button secondary" type="button" data-action="next">Hurrengo hitza →</button></div>'+
      feedbackHtml(w)+
      (state.feedback?'<p class="cx-hint-note" role="status">'+escapeHtml(state.feedback)+'</p>':'')+
      '</section>'+completion+
      '</section><aside class="cx-sidebar" aria-label="Pista guztiak"><div class="cx-side-head"><p class="cx-overline">HITZEN GIDA</p>'+
      '<h2 class="cx-side-title">Pistak</h2><p>Hautatu pista bat; zuzen osatutako hitzak ✓ ikurrarekin agertuko dira.</p></div>'+
      groupHtml('H','Horizontalak','→')+groupHtml('V','Bertikalak','↓')+'</aside></div>';
  }
  function tickClock() {
    if(state.phase!=='playing'||state.mode!=='erronka')return;
    const clock=root.querySelector('#cxClock'),points=root.querySelector('#cxPoints');
    if(clock)clock.textContent=fmtTime(elapsedSeconds());
    if(points)points.textContent=String(scoreBreakdown().total);
  }
  function paintGrid() {
    const values=displayLetters(),w=byId.get(state.active),status=state.checked[w.id];
    for (const button of root.querySelectorAll('button[data-cell]')) {
      const k=button.dataset.cell,cell=grid.get(k),[r,c]=k.split(',').map(Number);
      const idx=cell.owners.includes(w.id) ? (w.dir==='H'?c-w.c:r-w.r):-1;
      const typed=(state.drafts[w.id]||'')[idx]||'';
      const solvedHere=cell.owners.some(id=>solved(byId.get(id)));
      button.querySelector('.cx-cell-letter').textContent=values.get(k)||'';
      button.classList.toggle('is-solved',solvedHere);
      button.classList.toggle('is-right',state.mode==='ikasi'&&idx>=0&&status==='wrong'&&!!typed&&typed===w.word[idx]);
      button.classList.toggle('is-wrong',idx>=0&&status==='wrong'&&!!typed&&(state.mode==='erronka'||typed!==w.word[idx]));
    }
  }
  function check() {
    if(state.phase!=='playing')return;
    const w=byId.get(state.active);
    if(solved(w))return;
    const typed=state.drafts[w.id]||'';
    state.feedback='';
    if(typed.length!==w.word.length)state.checked[w.id]='incomplete';
    else if(typed===w.word) {
      state.checked[w.id]='correct';
      finish();
    } else {
      state.checked[w.id]='wrong';
      // Re-checking the SAME unchanged mistake must not charge again.
      if(state.lastWrong[w.id]!==typed) {
        state.lastWrong[w.id]=typed;
        if(state.mode==='erronka')state.stats.wrong++;
      }
    }
    save();render();
    if(state.checked[w.id]!=='correct')root.querySelector('#cxWordInput')?.focus();
  }
  function hint() {
    if(state.phase!=='playing')return;
    const w=byId.get(state.active);
    if(solved(w))return;
    const typed=state.drafts[w.id]||'';
    const already=state.revealed[w.id]||[];
    // Do not charge to reveal a letter the player already earned at a solved crossing.
    const crossingRevealed=new Set();
    for(let i=0;i<w.word.length;i++){
      const [r,c]=pos(w,i),cell=grid.get(key(r,c));
      if(cell.owners.some(id=>id!==w.id&&solved(byId.get(id))))crossingRevealed.add(i);
    }
    // Each paid hint reveals exactly one genuinely new letter.
    const i=[...w.word].findIndex((ch,i)=>typed[i]!==ch&&!already.includes(i)&&!crossingRevealed.has(i));
    if(i<0){
      state.feedback=typed===w.word?'Hitza osatuta dago; egiaztatu erantzuna.':'Beste pistarik ez: gainerako letrak dagoeneko agerian daude.';
      render();return;
    }
    const arr=typed.split('');
    // Fill any gap exclusively with letters already visible at solved crossings
    // or previously paid hints; never reveal another unknown letter for free.
    for(let j=0;j<i;j++){
      if(!arr[j]&&(crossingRevealed.has(j)||already.includes(j)))arr[j]=w.word[j];
    }
    arr[i]=w.word[i];
    state.drafts[w.id]=arr.join('');
    state.revealed[w.id]=[...already,i];
    state.hints[w.id]=(state.hints[w.id]||0)+1;
    if(state.mode==='erronka')state.stats.hints++;
    state.feedback=state.mode==='erronka'?'Letra bat argitu da: −'+COST_HINT+' puntu.':'Letra bat argitu da.';
    delete state.checked[w.id];
    touchWord(w.id);save();render();
    root.querySelector('#cxWordInput')?.focus();
  }
  function next() {
    const current=ordered.findIndex(w=>w.id===state.active);
    const candidates=ordered.slice(current+1).concat(ordered.slice(0,current+1));
    const candidate=candidates.find(w=>!solved(w))||ordered[(current+1)%ordered.length];
    setActive(candidate.id,true);
  }
  root.addEventListener('click',event=>{
    const el=event.target.closest('[data-action],[data-word],[data-cell]');
    if(!el||!root.contains(el))return;
    const action=el.dataset.action;
    if(action==='retry-daily'){loadDaily();return;}
    if(action==='start'){start(el.dataset.mode);return;}
    if(action==='reset'){
      if(state.phase==='playing'&&!window.confirm('Partida hau bertan behera utzi eta beste bat hasi?'))return;
      const completed=state.phase==='finished';
      if(madridDate()!==dailyDate){state=fresh();loadDaily();return;}
      // Returning from a FINISHED game must not erase its saved completion.
      // A subsequent start of the same mode creates a new attempt.
      state=fresh('ikasi','setup');
      if(!completed)save();
      render();return;
    }
    if(state.phase==='setup')return;
    if(action==='pdf-student'||action==='pdf-teacher'){
      window.CrosswordPDF?.download({root,teacher:action==='pdf-teacher',
        puzzle:activePuzzle,cells:new Map(grid),words:WORDS.map(w=>({...w}))});
      return;
    }
    if(el.dataset.word){setActive(el.dataset.word,true);return;}
    if(el.dataset.cell) {
      const cell=grid.get(el.dataset.cell);
      if(!cell)return;
      const id=cell.owners.includes(state.active)&&cell.owners.length>1?
        cell.owners.find(x=>x!==state.active):(cell.owners.includes(state.active)?state.active:cell.owners[0]);
      setActive(id,true);return;
    }
    if(action==='check')check();
    else if(action==='hint')hint();
    else if(action==='next')next();
  });
  root.addEventListener('input',event=>{
    if(event.target.id!=='cxWordInput'||state.phase!=='playing')return;
    const w=byId.get(state.active);
    if(solved(w))return;
    let value=event.target.value.toUpperCase().replace(/[^A-Z]/g,'').slice(0,w.word.length);
    // An already solved intersection is authoritative: don't let the word input
    // display a conflicting letter while the shared grid displays a correct one.
    const typed=value.split('');
    for(let i=0;i<typed.length;i++){
      const [r,c]=pos(w,i),cell=grid.get(key(r,c));
      if(cell.owners.some(id=>id!==w.id&&solved(byId.get(id))))typed[i]=w.word[i];
    }
    value=typed.join('');
    event.target.value=value;
    state.drafts[w.id]=value;
    delete state.checked[w.id];state.feedback='';
    touchWord(w.id);save();paintGrid();
    root.querySelector('#cxFeedback')?.remove();
    root.querySelector('.cx-hint-note')?.remove();
  });
  root.addEventListener('keydown',event=>{
    if (event.key==='Enter'&&event.target.id==='cxWordInput') {event.preventDefault();check();}
  });
  (async()=>{
    try {cloud=window.SustraiCloud;await cloud?.ready;}catch { /* Guest mode does not need connectivity. */ }
    await loadDaily();
  })();
  let lastDateRefresh=null;
  if(typeof setInterval==='function')setInterval(()=>{
    tickClock();
    if(!dailyDate||loading)return;
    const date=madridDate();
    if(date===dailyDate)return;
    if(state.phase==='playing') {
      if(!dailyNotice){
        dailyNotice='Biharko gurutzegramak prest daude! Amaitu partida hau edo hasi beste bat.';
        const host=root.querySelector('.cx-statusbar');
        if(host)host.insertAdjacentHTML('afterend','<p class="cx-new-day" role="status">'+
          escapeHtml(dailyNotice)+'</p>');
      }
    }else if(lastDateRefresh!==date) {
      lastDateRefresh=date;loadDaily();
    }
  },1000);
})();
