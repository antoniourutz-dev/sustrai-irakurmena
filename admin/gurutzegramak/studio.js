/* SUSTRAI / HitzBira · protected authoring UI. Oposik source tables are published/read-only.
   Drafts are isolated in Lexikoa through sr_is_admin() RLS; no student access or new public puzzles. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const project = 'https://gmwgwttwzkgyljevddul.supabase.co';
  const publishable = 'sb_publishable_-K_tjkVMyqf12uuXkUxcRA_Mqx-ij-A';
  const store = 'smx_crossword_authoring';
  const engine = window.CrosswordStudioEngine;
  const groups = window.CrosswordStudioGroups;
  const s = {cloud:null,client:null,source:null,entries:[],assignments:[],
    puzzle:null,selected:null,drafts:{},checked:{},answers:false,savedId:null,
    status:'draft',library:[],owner:null,loading:false,excluded:new Set(),puzzleTopicCode:'all'};
  const text = value => String(value ?? '');
  const esc = value => text(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  const notify = (message,bad=false) => {
    $('studioStatus').textContent=message;
    $('studioStatus').classList.toggle('is-error',bad);
  };
  const codeOf = cell => cell.r+','+cell.c;
  function currentTitle() {
    const title=$('studioTitle').value.trim();
    return title || 'Osasun-hiztegia';
  }
  async function all(table,columns,opts={}) {
    const rows=[];
    for(let from=0;from<10000;from+=1000){
      let q=s.source.from(table).select(columns).range(from,from+999);
      if(table==='osasun_entry_specialties')q=q.order('entry_code',{ascending:true}).order('specialty_code',{ascending:true});
      else q=q.order('code',{ascending:true});
      if(opts.status)q=q.eq('status',opts.status);
      if(opts.active!==undefined)q=q.eq('active',opts.active);
      if(opts.review)q=q.eq('review_state',opts.review);
      const {data,error}=await q;
      if(error)throw error;
      rows.push(...(data||[]));
      if(!data||data.length<1000)break;
    }
    return rows;
  }
  async function fetchCatalog() {
    notify('Oposikeko argitaratutako hiztegia kargatzen…');
    const [entries,assignments]=await Promise.all([
      all('osasun_entries','code,lemma_eu,definition_eu,meaning_es,category_general,editorial_state,entry_type',{status:'published'}),
      all('osasun_entry_specialties','entry_code,specialty_code,review_state',{review:'suggested'})
    ]);
    s.entries=entries;s.assignments=assignments;
    $('studioCatalogCount').textContent=entries.length+' sarrera argitaratu';
    renderGroups();
    notify('Hiztegia kargatuta. Gai-multzo bat edo batzuk aukeratu.');
  }
  function selectedGroupIds(){
    return [...$('studioGroupList').querySelectorAll('input[name="studioGroup"]:checked')].map(input=>input.value);
  }
  function setSelection(ids){
    const chosen=new Set(groups.validIds(ids));
    $('studioGroupList').querySelectorAll('input[name="studioGroup"]').forEach(input=>{
      input.checked=chosen.has(input.value);
    });
    s.excluded.clear();
    updateInventory();
  }
  function renderGroups(selectedIds=groups.ids()){
    const chosen=new Set(groups.validIds(selectedIds));
    $('studioGroupList').innerHTML=groups.GROUPS.map(g=>{
      const count=groups.eligible(s.entries,s.assignments,[g.id],engine.candidate,{
        phrases:$('studioPhrases').checked}).length;
      return '<div class="studio-group-card">'+
        '<label><input name="studioGroup" type="checkbox" value="'+esc(g.id)+'"'+
          (chosen.has(g.id)?' checked':'')+'>'+
        '<span class="studio-group-mark" aria-hidden="true">'+esc(g.icon)+'</span>'+
        '<span class="studio-group-copy"><strong>'+esc(g.label)+'</strong>'+
        '<small>'+esc(g.description)+'</small></span></label>'+
        '<div class="studio-group-footer"><span class="studio-group-count" data-count-for="'+
          esc(g.id)+'">'+count+' hitz</span>'+
        '<button type="button" class="studio-only" data-only="'+esc(g.id)+
          '" aria-label="'+esc(g.label)+' bakarrik hautatu">Hau bakarrik</button></div></div>';
    }).join('');
    updateInventory();
  }
  function isPending(item) {
    return /BALIDATZEKE|BERRIKUSTEKE|EGIAZTATZEKE|GATAZKA|KONTRAESANA|FROGA PARTZIALA/i.test(item.editorial_state||'');
  }
  function getEligible() {
    return groups.eligible(s.entries,s.assignments,selectedGroupIds(),engine.candidate,{
      phrases:$('studioPhrases').checked,excluded:s.excluded});
  }
  function updateInventory(){
    if(!s.entries.length)return;
    const chosen=selectedGroupIds(),pool=getEligible(),pending=pool.filter(isPending).length;
    const requested=Number($('studioCount').value);
    $('studioSelectedSummary').textContent=chosen.length===groups.GROUPS.length
      ? '8 multzo hautatuta · hiztegi orokorra'
      :chosen.length+' / '+groups.GROUPS.length+' multzo hautatuta';
    for(const g of groups.GROUPS){
      const output=$('studioGroupList').querySelector('[data-count-for="'+g.id+'"]');
      if(output)output.textContent=groups.eligible(s.entries,s.assignments,[g.id],engine.candidate,{
        phrases:$('studioPhrases').checked}).length+' hitz';
    }
    const warning=!chosen.length
      ? '<span class="warning">Hautatu gutxienez gai-multzo bat.</span>'
      :pool.length<requested
        ? '<span class="warning">Ez dago nahikoa hitz; gehitu beste gai-multzo bat edo murriztu hitz kopurua.</span>'
        : 'Gurutzegrama sortzeko hautagaiak prest.';
    const differentSelection=!!s.puzzle&&s.puzzleTopicCode!==groups.serialize(chosen);
    const previewNote=differentSelection
      ? ' <span class="warning">Hautaketa aldatu duzu: aurreko taula mantentzen da, berria sortu arte.</span>'
      : '';
    $('studioInventory').innerHTML='<strong>'+pool.length+' hitz erabilgarri</strong> · '+
      chosen.length+' gai-multzo · '+pending+' sarreratan berrikusteko oharrak. '+warning+previewNote+
      '<br><small>Multzoetako hitzak batzen dira, errepikapenik gabe. Espezialitate txikiak antzeko gaiekin bateratuta daude. Sailkapenak proposatuak dira; Oposikeko sarrera argitaratuak soilik.</small>';
    $('studioGenerate').disabled=!chosen.length||pool.length<requested;
    $('studioRegenerate').disabled=!s.puzzle||!chosen.length||pool.length<requested;
  }
  function makePuzzle() {
    if(s.loading)return;
    if(!selectedGroupIds().length){notify('Aukeratu gutxienez gai-multzo bat.',true);return;}
    s.loading=true;$('studioGenerate').disabled=true;
    try {
      const pool=getEligible(),count=Number($('studioCount').value);
      const difficulty=$('studioDifficulty').value;
      const size=difficulty==='oinarrizkoa'?17:difficulty==='ertaina'?21:23;
      const board=engine.generate(pool,count,{size,phrases:$('studioPhrases').checked,title:currentTitle(),
        seed:Date.now().toString()+'-'+Math.random().toString()});
      s.puzzle=board;s.selected=board.entries[0].id;s.drafts={};s.checked={};s.answers=false;
      s.savedId=null;s.status='draft';s.puzzleTopicCode=groups.serialize(selectedGroupIds());
      $('studioShowAnswers').textContent='Erantzunak erakutsi';
      $('studioPreviewPanel').hidden=false;$('studioRegenerate').disabled=false;
      drawPreview();drawEditor();
      $('studioPreviewPanel').scrollIntoView({behavior:'smooth',block:'start'});
      notify(board.entries.length+' hitzeko gurutzegrama sortu da. Pista guztiak berrikusi gorde aurretik.');
    }catch(error){notify(error.message||'Ezin izan da gurutzegrama sortu.',true);}
    finally{s.loading=false;updateInventory();}
  }
  function wordAt(id){return s.puzzle?.entries.find(w=>w.id===id);}
  function cellMap(){return engine.validate(s.puzzle);}
  function cellNumberMap() {
    const out=new Map();
    for(const w of s.puzzle.entries)out.set(codeOf(w),w.number);
    return out;
  }
  function outputLetters() {
    const out=new Map();
    for(const w of s.puzzle.entries){
      const input=s.drafts[w.id]||'';
      for(let i=0;i<input.length&&i<w.word.length;i++){
        const r=w.r+(w.dir==='V'?i:0),c=w.c+(w.dir==='H'?i:0);
        out.set(r+','+c,input[i]);
      }
    }
    for(const w of s.puzzle.entries)if(s.checked[w.id]==='correct')
      for(let i=0;i<w.word.length;i++){
        const r=w.r+(w.dir==='V'?i:0),c=w.c+(w.dir==='H'?i:0);
        out.set(r+','+c,w.word[i]);
      }
    return out;
  }
  function paintLetters(){
    if(!s.puzzle)return;
    const cells=cellMap(),inputs=outputLetters();
    $('studioPreviewRoot').querySelectorAll('[data-cell]').forEach(el=>{
      const k=el.dataset.cell,cell=cells.get(k);
      const value=s.answers?cell.letter:(inputs.get(k)||'');
      el.querySelector('.cx-cell-letter').textContent=value;
      el.classList.toggle('is-preview-answer',s.answers);
    });
  }
  function groupMarkup(dir,label){
    const entries=s.puzzle.entries.filter(w=>w.dir===dir).sort((a,b)=>a.number-b.number);
    return '<section class="cx-clue-group"><h3><span aria-hidden="true">'+(dir==='H'?'→':'↓')+'</span>'+label+'</h3>'+
      '<div class="cx-clue-list">'+entries.map(w=>
        '<button type="button" class="cx-clue'+(w.id===s.selected?' is-active':'')+
        '" data-word="'+esc(w.id)+'" aria-pressed="'+(w.id===s.selected)+'">'+
        '<span class="cx-clue-no">'+w.number+'.</span><span class="cx-clue-copy">'+esc(w.clue)+'</span>'+
        '<span class="cx-clue-length">'+w.word.length+'</span></button>'
      ).join('')+'</div></section>';
  }
  function drawPreview(){
    if(!s.puzzle)return;
    const p=s.puzzle,cells=cellMap(),numbers=cellNumberMap(),w=wordAt(s.selected)||p.entries[0];
    const letters=outputLetters();
    const blocks=[];
    for(let r=0;r<p.grid_rows;r++)for(let c=0;c<p.grid_cols;c++){
      const k=r+','+c,cell=cells.get(k);
      if(!cell){blocks.push('<span class="cx-cell is-block" aria-hidden="true"></span>');continue;}
      const isSelected=w && (w.dir==='H' && r===w.r && c>=w.c && c<w.c+w.word.length
        || w.dir==='V' && c===w.c && r>=w.r && r<w.r+w.word.length);
      blocks.push('<button type="button" data-cell="'+k+'" class="cx-cell'+(isSelected?' is-active':'')+
        (s.answers?' is-preview-answer':'')+'" aria-label="Gelaxka '+(r+1)+', '+(c+1)+'">'+
        (numbers.has(k)?'<span class="cx-cell-number">'+numbers.get(k)+'</span>':'')+
        '<span class="cx-cell-letter">'+esc(s.answers?cell.letter:(letters.get(k)||''))+'</span></button>');
    }
    $('studioPuzzleStats').textContent=p.entries.length+' hitz · '+p.grid_rows+' × '+p.grid_cols;
    const feedback=s.checked[w.id]==='correct'
      ? '<p class="studio-answer-feedback" role="status">✓ Ondo erantzunda.</p>'
      : s.checked[w.id]==='wrong'
        ? '<p class="studio-answer-feedback is-error" role="status">Erantzuna ez da zuzena. Saiatu berriro.</p>'
        : '';
    $('studioPreviewRoot').innerHTML=
      '<div class="cx-statusbar"><div class="cx-status-intro"><div class="cx-playing-label">'+
      '<span class="cx-game-mode">SORTZAILEAREN AURREBISTA</span>'+
      '<span class="cx-game-count">'+p.entries.length+' hitz</span></div>'+
      '<h2>'+esc(p.theme_eu)+'</h2><p>Oposikeko osasun-hiztegia · irakaslearen berrikuspenerako</p></div></div>'+
      '<div class="cx-layout"><section class="cx-board-card"><div class="cx-board-top"><div>'+
      '<p class="cx-overline">OSASUN GURUTZEGRAMA</p><h2>Gurutzegrama</h2>'+
      '<p class="cx-board-note">Osatu hitz gurutzatuak, definizioen laguntzaz.</p></div></div>'+
      '<div class="cx-grid-scroll" tabindex="0"><div class="cx-grid" style="--cx-rows:'+p.grid_rows+
      ';--cx-cols:'+p.grid_cols+'">'+blocks.join('')+'</div></div>'+
      '<div class="cx-legend"><span><i></i>Hautatua</span><span><i></i>Zuzena</span><span><i></i>Okerra</span></div>'+
      '<section class="cx-answer-card"><div class="cx-answer-header"><span class="cx-answer-label">'+
      w.number+'. '+(w.dir==='H'?'HORIZONTALA':'BERTIKALA')+'</span><span class="cx-answer-count">'+w.word.length+
      ' letra</span></div><p class="cx-answer-clue">'+esc(w.clue)+'</p>'+
      '<div class="studio-answer-form"><input id="studioSolveInput" class="studio-solve-input" type="text" '+
      'spellcheck="false" autocomplete="off" maxlength="'+w.word.length+'" value="'+esc(s.drafts[w.id]||'')+
      '" aria-label="Erantzuna"><button type="button" class="studio-button" data-check>✓ Egiaztatu</button></div>'+
      feedback+'</section></section>'+
      '<aside class="cx-sidebar"><div class="cx-side-head"><p class="cx-overline">HITZEN GIDA</p>'+
      '<h2 class="cx-side-title">Pistak</h2><p>Definizioak irakurri eta hitzak taulan kokatu.</p></div>'+
      groupMarkup('H','Horizontalak')+groupMarkup('V','Bertikalak')+'</aside></div>';
  }
  function drawEditor(){
    if(!s.puzzle)return;
    const ordered=[...s.puzzle.entries].sort((a,b)=>a.number-b.number);
    $('studioClueEditor').innerHTML=ordered.map(w=>
      '<div class="studio-editor-row"><div><label for="clue-'+esc(w.id)+'">'+w.number+
      '. '+(w.dir==='H'?'Horizontala':'Bertikala')+' · '+esc(w.original||w.word)+'</label>'+
      '<small>'+esc(w.source)+'<br>'+esc(w.editorial_state||'Argitalpen-egoera kontsultatu gabe')+'</small>'+ 
      '<button type="button" class="studio-button studio-replace" data-exclude="'+esc(w.id)+'">Hitz hau ordeztu</button></div>'+
      '<textarea id="clue-'+esc(w.id)+'" data-clue="'+esc(w.id)+'" rows="2" maxlength="450">'+esc(w.clue)+'</textarea></div>'
    ).join('');
  }
  function selectWord(id) {
    if(!wordAt(id))return;
    s.selected=id;drawPreview();$('studioSolveInput')?.focus();
  }
  function solve(){
    const w=wordAt(s.selected),input=$('studioSolveInput');
    if(!w||!input)return;
    s.drafts[w.id]=engine.normalize(input.value).slice(0,w.word.length);
    s.checked[w.id]=s.drafts[w.id]===w.word?'correct':'wrong';
    drawPreview();$('studioSolveInput')?.focus();
  }
  function assertReviewed(){
    engine.validate(s.puzzle);
    for(const w of s.puzzle.entries){
      if(!w.clue.trim() || engine.normalize(w.clue).includes(w.word))
        throw Error(w.number+'. hitzaren pista hutsik dago edo erantzuna agertzen da.');
    }
  }
  async function save(){
    if(!s.puzzle||!s.owner)return;
    try{
      assertReviewed();notify('Gurutzegrama gordetzen…');
      const p=s.puzzle;
      const body={created_by:s.owner,title_eu:currentTitle(),topic_code:s.puzzleTopicCode,
        difficulty:$('studioDifficulty').value,status:s.status,word_count:p.entries.length,
        grid_rows:p.grid_rows,grid_cols:p.grid_cols,entries:p.entries,review_note:'',
        updated_at:new Date().toISOString()};
      let query=s.savedId?s.client.from(store).update(body).eq('id',s.savedId)
        :s.client.from(store).insert(body);
      const {data,error}=await query.select('id').single();
      if(error)throw error;
      s.savedId=data.id;
      notify('Gurutzegrama gordeta: '+(s.status==='reviewed'?'berrikusia':'zirriborroa')+'.');
      await loadLibrary();
    }catch(error){notify(error.message||'Ezin izan da gorde.',true);}
  }
  async function loadLibrary(){
    const {data,error}=await s.client.from(store).select('id,created_by,title_eu,topic_code,difficulty,status,word_count,grid_rows,grid_cols,entries,created_at')
      .eq('created_by',s.owner).order('created_at',{ascending:false}).limit(50);
    if(error){$('studioLibrary').textContent='Ezin izan da liburutegia kargatu.';return;}
    s.library=data||[];
    $('studioLibrary').replaceChildren();
    if(!s.library.length){
      const note=document.createElement('p');note.className='studio-muted';note.textContent='Oraindik ez dago gordetako gurutzegramarik.';
      $('studioLibrary').append(note);return;
    }
    for(const item of s.library){
      const row=document.createElement('div');row.className='studio-library-item';
      const summary=document.createElement('div');
      const heading=document.createElement('strong');heading.textContent=item.title_eu;
      const small=document.createElement('small');
      const selected=groups.deserialize(item.topic_code);
      const label=selected.length===groups.GROUPS.length?'Osasun-hiztegi orokorra':
        selected.map(id=>groups.GROUPS.find(g=>g.id===id)?.label||id).join(' + ');
      small.textContent=item.word_count+' hitz · '+(item.status==='reviewed'?'Berrikusia':'Zirriborroa')+
        ' · '+label+' · '+new Date(item.created_at).toLocaleDateString('eu-ES');
      summary.append(heading,small);
      const open=document.createElement('button');open.type='button';open.textContent='Ireki eta editatu';
      open.dataset.open=item.id;
      row.append(summary,open);$('studioLibrary').append(row);
    }
  }
  function openSaved(id){
    const record=s.library.find(x=>x.id===id);if(!record)return;
    const puzzle={id:record.id,grid_rows:record.grid_rows,grid_cols:record.grid_cols,entries:record.entries,
      play_date:new Date(record.created_at).toISOString().slice(0,10),mode:'ikasi',theme_eu:record.title_eu};
    try{engine.validate(puzzle);}catch(error){notify('Gordetako taula hondatuta dago: '+error.message,true);return;}
    s.puzzle=puzzle;s.selected=puzzle.entries[0].id;s.drafts={};s.checked={};s.answers=false;
    s.savedId=record.id;s.status=record.status;s.excluded.clear();
    $('studioTitle').value=record.title_eu;$('studioDifficulty').value=record.difficulty;
    $('studioCount').value=String(record.word_count);
    s.puzzleTopicCode=record.topic_code;
    setSelection(groups.deserialize(record.topic_code));
    $('studioShowAnswers').textContent='Erantzunak erakutsi';
    $('studioPreviewPanel').hidden=false;$('studioRegenerate').disabled=false;
    drawPreview();drawEditor();$('studioPreviewPanel').scrollIntoView({behavior:'smooth'});
    notify('Gordetako gurutzegrama ireki da.');
  }
  function exportFile(action){
    if(!s.puzzle)return;
    try{assertReviewed();}catch(error){notify(error.message,true);return;}
    const cells=cellMap();
    const numbers=cellNumberMap();
    for(const [key,cell] of cells)cell.number=numbers.get(key)||null;
    const root=$('studioWorkspace');
    const teacher=action.endsWith('teacher');
    const options={root,teacher,puzzle:{...s.puzzle,theme_eu:currentTitle(),is_authoring:true},
      words:s.puzzle.entries.map(w=>({...w})),cells};
    if(action.startsWith('pdf-'))window.CrosswordPDF?.download(options);
    else window.CrosswordWord?.download(options);
  }
  function bind(){
    $('studioLogin').addEventListener('click',()=>s.cloud?.openLogin?.());
    $('studioGroupList').addEventListener('change',event=>{
      if(event.target.matches('input[name="studioGroup"]')){
        s.excluded.clear();updateInventory();
      }
    });
    $('studioGroupList').addEventListener('click',event=>{
      const selected=event.target.closest('[data-only]');
      if(selected)setSelection([selected.dataset.only]);
    });
    $('studioSelectAll').addEventListener('click',()=>setSelection(groups.ids()));
    $('studioClearSelection').addEventListener('click',()=>setSelection([]));
    $('studioCount').addEventListener('change',updateInventory);
    $('studioPhrases').addEventListener('change',updateInventory);
    $('studioGenerate').addEventListener('click',makePuzzle);
    $('studioRegenerate').addEventListener('click',makePuzzle);
    $('studioRefresh').addEventListener('click',loadLibrary);
    $('studioShowAnswers').addEventListener('click',()=>{
      if(!s.puzzle)return;s.answers=!s.answers;
      $('studioShowAnswers').textContent=s.answers?'Erantzunak ezkutatu':'Erantzunak erakutsi';
      paintLetters();
    });
    $('studioResetAnswers').addEventListener('click',()=>{
      if(!s.puzzle)return;s.drafts={};s.checked={};s.answers=false;
      $('studioShowAnswers').textContent='Erantzunak erakutsi';drawPreview();
    });
    $('studioReview').addEventListener('click',()=>{
      try{assertReviewed();s.status='reviewed';notify('Pistak irakasleak berrikusi dituela adierazita. Gorde egoera mantentzeko. Ez da balidazio akademiko ofiziala.');}
      catch(error){notify(error.message,true);}
    });
    $('studioSave').addEventListener('click',save);
    $('studioPreviewRoot').addEventListener('click',event=>{
      const check=event.target.closest('[data-check]');
      if(check){solve();return;}
      const word=event.target.closest('[data-word]');
      if(word){selectWord(word.dataset.word);return;}
      const cell=event.target.closest('[data-cell]');
      if(cell){
        const [r,c]=cell.dataset.cell.split(',').map(Number);
        const ids=s.puzzle.entries.filter(w=>w.dir==='H'?r===w.r&&c>=w.c&&c<w.c+w.word.length
          :c===w.c&&r>=w.r&&r<w.r+w.word.length).map(w=>w.id);
        if(ids.length)selectWord(ids.find(id=>id!==s.selected)||ids[0]);
      }
    });
    $('studioPreviewRoot').addEventListener('input',event=>{
      if(event.target.id!=='studioSolveInput'||!s.puzzle)return;
      const w=wordAt(s.selected);
      const val=engine.normalize(event.target.value).slice(0,w.word.length);
      event.target.value=val;s.drafts[w.id]=val;delete s.checked[w.id];paintLetters();
    });
    $('studioPreviewRoot').addEventListener('keydown',event=>{
      if(event.key==='Enter'&&event.target.id==='studioSolveInput'){event.preventDefault();solve();}
    });
    $('studioClueEditor').addEventListener('click',event=>{
      const excluded=event.target.closest('[data-exclude]');
      if(!excluded)return;
      s.excluded.add(excluded.dataset.exclude);
      makePuzzle();
    });
    $('studioClueEditor').addEventListener('input',event=>{
      const field=event.target.closest('[data-clue]');if(!field)return;
      const w=wordAt(field.dataset.clue);if(!w)return;
      w.clue=field.value;s.status='draft';
      $('studioPreviewRoot').querySelectorAll('[data-word]').forEach(el=>{
        if(el.dataset.word===w.id)el.querySelector('.cx-clue-copy').textContent=w.clue;
      });
      if(s.selected===w.id){const shown=$('studioPreviewRoot').querySelector('.cx-answer-clue');if(shown)shown.textContent=w.clue;}
    });
    $('studioWorkspace').addEventListener('click',event=>{
      const action=event.target.closest('[data-action]')?.dataset.action;
      if(['pdf-student','pdf-teacher','word-student','word-teacher'].includes(action))exportFile(action);
      const id=event.target.closest('[data-open]')?.dataset.open;
      if(id)openSaved(id);
    });
  }
  async function init(){
    bind();
    try{
      s.cloud=window.SustraiCloud;
      if(!s.cloud||!window.supabase||!engine||!groups)throw Error('Tresnak ezin izan dira kargatu.');
      await s.cloud.ready;
      s.client=s.cloud.client();
      const user=s.cloud.user();
      if(!s.client||!user){$('studioRestricted').hidden=false;notify('Administratzaile-saioa behar da.',true);return;}
      const {data,error}=await s.client.rpc('sr_is_admin');
      if(error||data!==true){$('studioRestricted').hidden=false;notify('Ez dago administratzaile-baimenik.',true);return;}
      s.owner=user.id;
      s.source=window.supabase.createClient(project,publishable,
        {auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
      $('studioWorkspace').hidden=false;
      await Promise.all([fetchCatalog(),loadLibrary()]);
    }catch(error){$('studioWorkspace').hidden=true;$('studioRestricted').hidden=false;
      notify('Sortzailea ezin izan da ireki: '+(error?.message||'konexio-errorea'),true);}
  }
  init();
})();
