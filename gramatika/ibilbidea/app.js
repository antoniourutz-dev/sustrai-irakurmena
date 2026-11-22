/* SUSTRAI · B2ko ibilbide gidatuaren lehen pilotua.
   Gramatika azalpenen iturri bakarra: Supabaseko public_editorial_grammar_* ikuspegiak.
   Praktika galdera sintetikoak ez dira azterketa edo ebaluazio akademiko ofiziala. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const cloud = window.SustraiCloud;
  const state = {
    client: null, user: null, profile: null, modules: [], units: [], entries: new Map(),
    progress: new Map(), assigned: [], myGroups: [], teacherGroups: [], teacherAssignments: [],
    selected: null, step: 0, quizAnswers: new Map(), quizTries: new Map(), examplesCache: new Map(), readerSize: 18, readerFocus: false
  };
  const QUESTIONS = Object.create(null);
  const LESSONS = new Map();
  const designFor = code => LESSONS.get(code)||null;
  const day = d => new Date(d).toLocaleDateString('eu-ES',{year:'numeric',month:'short',day:'numeric'});
  const listValues=(parent,items,className='b2-check-list')=>{
    if(!Array.isArray(items)||!items.length)return;
    const ul=el('ul',null,className);
    items.forEach(v=>ul.append(el('li',v)));
    parent.append(ul);
  };
  const STEPS = ['Ulertu', 'Kontrastatu', 'Praktikatu', 'Erabili'];
  const check = (res) => { if (res.error) throw res.error; return res.data || []; };
  const el = (tag, text, className) => {
    const n = document.createElement(tag);
    if (text !== undefined && text !== null) n.textContent = String(text);
    if (className) n.className = className;
    return n;
  };
  const section = (parent, title) => {
    const root = el('section', null, 'b2-learning-block');
    root.append(el('h3', title));
    parent.append(root);
    return root;
  };
  const addP = (root, value, cls = 'b2-copy') => {
    if (value) root.append(el('p', value, cls));
  };
  const button = (label, callback, cls = 'b2-button') => {
    const b = el('button', label, cls);
    b.type = 'button';
    b.onclick = callback;
    return b;
  };
  const say = (message, isError = false) => {
    const notice=$('pathNotice');
    notice.hidden=!message;
    notice.textContent=message||'';
    notice.classList.toggle('is-error',isError);
  };
  const row = (root, ...children) => {
    const r = el('div', null, 'b2-actions');
    r.append(...children);
    root.append(r);
    return r;
  };
  const own = (code) => state.progress.get(code) || {};
  const hasAccount = () => !!(state.user && state.profile && state.profile.active);
  function signIn() { cloud?.openLogin?.(); }
  function requireAccount() {
    if (hasAccount()) return true;
    say('Aurrerapena gordetzeko, hasi saioa egiaztatutako ikasle-kontuarekin.', true);
    signIn();
    return false;
  }
  function grammarLink(code) {
    return '/gramatika/?maila=B2&gaia=' + encodeURIComponent(code);
  }
  function aLink(href, label, cls = '') {
    const a = el('a', label, cls);
    a.href = href;
    return a;
  }
  function selectedUnit() {
    return state.units.find(u => u.entry_code === state.selected);
  }
  function readiness(unit) {
    return unit.review_snapshot === 'approved'
      ? '2026-11-22ko egoera: jatorrizko fitxa onartua. Ikasgai gehigarria pilotuko materiala da.'
      : '2026-11-22ko egoera: jatorrizko fitxa berrikusteko. Ikasgai gehigarria pilotuko zirriborroa da.';
  }
  function guidedCount() { return state.units.filter(u=>u.pilot_active).length; }
  function completeCount() {
    return state.units.filter(u => !!own(u.entry_code).read_at).length;
  }
  function renderSummary() {
    const produced=state.units.filter(u=>u.pilot_active&&!!own(u.entry_code).transferred_at).length;
    const reviewed=state.units.filter(u=>u.pilot_active&&!!own(u.entry_code).reviewed_again_at).length;
    $('pathProgressText').textContent=hasAccount()
      ? completeCount()+'/31 gai irakurrita · '+produced+'/'+guidedCount()+' ekoizpen gordeta · '+reviewed+'/'+guidedCount()+' gerora berrikusita'
      : completeCount()+'/31 gai saio honetan · '+produced+'/'+guidedCount()+' jarduera probatuta · ez da hodeian gordetzen.';
    $('pathProgressBar').style.width=(completeCount()/31*100).toFixed(1)+'%';
    $('pathProgressTrack')?.setAttribute('aria-valuenow',String(completeCount()));
    const next=state.units.find(u=>u.pilot_active&&own(u.entry_code).transferred_at
        && !own(u.entry_code).reviewed_again_at
        && Date.now()-new Date(own(u.entry_code).transferred_at).getTime()>=72*60*60*1000)
      || state.units.find(u=>u.pilot_active&&!own(u.entry_code).transferred_at)
      || state.units.find(u=>!own(u.entry_code).read_at)
      || state.units[0];
    if(next){
      const topic=state.entries.get(next.entry_code);
      $('pathNextTitle').textContent=topic?.title_eu||'Hurrengo ikasgaia';
      const module=state.modules.find(m=>m.module_no===next.module_no);
      const status=own(next.entry_code);
      $('pathNextDetail').textContent=(module?.title_eu||'B2')
        +' · '+(next.pilot_active?'4 urratseko ikasgaia':'Fitxa kontsultatu eta irakurketa landu')
        +' · '+(status.transferred_at&&!status.reviewed_again_at?'Geroko berrikuspena':status.practiced_at?'Ekoizpena prestatu':status.contrasted_at?'Praktika egin':status.read_at?'Kontrastea landu':'Hasi ikasten');
      $('pathContinueButton').onclick=()=>openUnit(next.entry_code);
    }
  }
  function renderPath() {
    const list = $('pathModules');
    list.replaceChildren();
    for (const module of state.modules) {
      const topics = state.units.filter(u => u.module_no === module.module_no);
      const completed = topics.filter(u => !!own(u.entry_code).read_at).length;
      const detail = el('details', null, 'b2-module');
      if (module.module_no === 1 || topics.some(u => u.entry_code === state.selected)) detail.open = true;
      const summary = el('summary');
      const heading = el('span', null, 'b2-module-heading');
      heading.append(el('span', String(module.module_no).padStart(2, '0'), 'b2-number'), el('strong', module.title_eu));
      summary.append(heading, el('small', completed + '/' + topics.length + ' irakurrita'));
      detail.append(summary, el('p', module.summary_eu, 'b2-module-intro'));
      const ol = el('ol', null, 'b2-unit-list');
      for (const u of topics) {
        const e = state.entries.get(u.entry_code);
        const li = el('li');
        const b = button(e?.title_eu || u.entry_code, () => openUnit(u.entry_code), 'b2-topic');
        if (state.selected === u.entry_code) b.classList.add('is-active');
        b.setAttribute('aria-current', state.selected === u.entry_code ? 'step' : 'false');
        const desc = el('span', null, 'b2-topic-meta');
        const status = own(u.entry_code);
        desc.append(el('span',status.reviewed_again_at?'Gerora berrikusia':status.transferred_at?'Ekoizpena gordeta':status.practiced_at?'Praktikatua':status.read_at?'Irakurrita':'Hasteko'));
        if (u.pilot_active) desc.append(el('span', '4 urratseko ikasgaia'));
        b.append(desc);
        li.append(b);
        ol.append(li);
      }
      detail.append(ol);
      list.append(detail);
    }
    renderSummary();
  }
  async function saveProgress(code, fields) {
    if(!hasAccount()){
      const old=own(code);
      state.progress.set(code,{...old,...fields,entry_code:code});
      renderPath();
      say('Gonbidatu modua: jarduera saio honetako memorian dago, ez hodeian.');
      return true;
    }
    const current = own(code);
    const next = {
      user_id: state.user.id, entry_code: code, read_at: current.read_at || null,
      contrasted_at: current.contrasted_at || null, practiced_at: current.practiced_at || null,
      transferred_at: current.transferred_at || null, reviewed_again_at: current.reviewed_again_at || null,
      review_reflection_eu: current.review_reflection_eu || null,
      practice_attempts: current.practice_attempts || 0,
      reflection_eu: current.reflection_eu || null, updated_at: new Date().toISOString(),
      ...fields
    };
    try {
      const fresh = check(await state.client.from('smx_grammar_b2_progress')
        .upsert(next, { onConflict: 'user_id,entry_code' }).select('*').single());
      state.progress.set(code, fresh);
      renderPath();
      return true;
    } catch (err) {
      say('Ezin izan da aurrerapena gorde. Ez da gordetutzat markatu. ' + (err.message || ''), true);
      return false;
    }
  }

  async function saveWrittenWork(code,value,kind) {
    if(!hasAccount()){
      const old=own(code);
      const fields=kind==='delayed'
        ? {reviewed_again_at:new Date().toISOString(),review_reflection_eu:value}
        : {transferred_at:new Date().toISOString(),reflection_eu:value,
           reviewed_again_at:null,review_reflection_eu:null};
      return saveProgress(code,fields);
    }
    try{
      const result=check(await state.client.rpc('smx_b2_save_written_work',{
        p_entry_code:code,p_body_eu:value,p_kind:kind
      }));
      if(!result||Array.isArray(result))throw new Error('Ezin izan da bertsioa erregistratu');
      state.progress.set(code,result);
      renderPath();
      return true;
    }catch(err){
      say('Ekoizpena ez da gorde: '+(err.message||'konexio-errorea'),true);
      return false;
    }
  }
  async function renderWorkHistory(code,root){
    if(!hasAccount())return;
    try{
      const rows=check(await state.client.from('smx_grammar_b2_work_versions')
        .select('version_no,version_kind,body_eu,created_at')
        .eq('user_id',state.user.id).eq('entry_code',code)
        .order('version_no',{ascending:false}).limit(30));
      if(state.selected!==code||!root.isConnected)return;
      root.replaceChildren();
      if(!rows.length){addP(root,'Oraindik ez dago gordetako bertsiorik.','b2-small');return;}
      rows.forEach(row=>{
        const item=el('article',null,'b2-feedback-note');
        const label=({initial:'Lehen ekoizpena',revision:'Berridazketa',delayed:'Geroko transferentzia'})[row.version_kind]||'Bertsioa';
        item.append(el('strong','v'+row.version_no+' · '+label),el('span',day(row.created_at),'b2-mini-label'));
        addP(item,row.body_eu);
        root.append(item);
      });
    }catch(err){addP(root,'Ezin izan da bertsioen historia irakurri.','b2-error');}
  }
  async function markRead() {
    if (own(state.selected).read_at) { state.step = 1; renderLesson(); return; }
    if (await saveProgress(state.selected, {read_at: new Date().toISOString()})) {
      state.step = 1; renderLesson(); say(hasAccount()?'Irakurketa hodeian gordeta.':'Gonbidatu-saioa: irakurketa saio honetan soilik markatuta.');
    }
  }
  async function markContrast() {
    if (!own(state.selected).read_at) { say('Lehenik, irakurri azalpena.', true); return; }
    if (own(state.selected).contrasted_at || await saveProgress(state.selected, {contrasted_at: new Date().toISOString()})) {
      state.step = 2; renderLesson(); say(hasAccount()?'Kontrastea hodeian gordeta.':'Kontrastea saio honetan soilik markatuta.');
    }
  }
  async function loadExamples(code) {
    if (state.examplesCache.has(code)) return state.examplesCache.get(code);
    const entry = state.entries.get(code);
    const [examples, formExamples] = await Promise.all([
      state.client.from('public_editorial_grammar_entry_examples')
        .select('text_eu,explanation_eu,example_type').eq('entry_id', entry.id).order('sort_order').limit(8).then(check),
      state.client.from('public_editorial_grammar_form_examples')
        .select('text_eu,explanation_eu,example_type').eq('entry_code', code).order('sort_order').limit(8).then(check)
    ]);
    const all = [...examples, ...formExamples].slice(0, 6);
    state.examplesCache.set(code, all);
    return all;
  }
  function renderLesson() {
    const u = selectedUnit();
    const e = u && state.entries.get(u.entry_code);
    if (!u || !e) return;
    $('pathLesson').hidden = false;
    $('pathLessonTitle').textContent = e.title_eu;
    $('pathLessonSubtitle').textContent = e.short_explanation_eu || '';
    const design=designFor(u.entry_code);
    const goal=$('pathLessonGoal');if(goal){goal.hidden=!design;goal.textContent=design?design.learning_goal_eu:'';}
    const duration=$('pathLessonDuration');if(duration){duration.hidden=!design;duration.textContent=design?design.suggested_minutes+' min inguru · zure erritmora':'';}

    $('pathLessonMeta').textContent=readiness(u);
    const module=state.modules.find(m=>m.module_no===u.module_no);
    const micro=$('pathCurrentModule');
    if(micro)micro.textContent='Modulua '+u.module_no+'/7 · '+(module?.title_eu||'');

    $('pathLessonMeta').classList.toggle('needs-review', u.review_snapshot !== 'approved');
    $('pathLessonStatus').textContent=own(u.entry_code).reviewed_again_at?'Gerora berrikusia'
      :own(u.entry_code).transferred_at?'Ekoizpena gordeta'
      :own(u.entry_code).practiced_at?'Praktikatua'
      :own(u.entry_code).read_at?'Ikasten':'Hasi gabe';
    const tabs = $('pathSteps');
    const body = $('pathStepContent');
    tabs.replaceChildren();
    body.replaceChildren();
    if (!u.pilot_active) {
      tabs.hidden=true;
      renderUnderstanding(e,body);
      return;
    }
    tabs.hidden = false;
    STEPS.forEach((name, i) => {
      const b = button((i + 1) + '. ' + name, () => {state.step = i; renderLesson();}, 'b2-step-tab');
      b.classList.toggle('is-active', i === state.step);
      b.setAttribute('aria-current', i === state.step ? 'step' : 'false');
      tabs.append(b);
    });
    if (state.step === 0) renderUnderstanding(e, body);
    if (state.step === 1) void renderContrasts(u.entry_code, body);
    if (state.step === 2) renderPractice(u.entry_code, body);
    if (state.step === 3) renderTransfer(u.entry_code, body);
  }
  function setupReadingControls(){
    const root=$('pathRoot'), reader=$('pathLesson'),focus=$('pathReaderFocus');
    const scale=delta=>{
      state.readerSize=Math.max(15,Math.min(23,state.readerSize+delta));
      reader.style.setProperty('--gr-document-size',state.readerSize+'px');
      $('pathSmallerText').disabled=state.readerSize<=15;
      $('pathLargerText').disabled=state.readerSize>=23;
    };
    const setFocus=enabled=>{
      state.readerFocus=!!enabled;
      root.classList.toggle('is-grammar-reading',state.readerFocus);
      document.body.classList.toggle('is-grammar-reading',state.readerFocus);
      focus.setAttribute('aria-pressed',String(state.readerFocus));
      focus.textContent=state.readerFocus?'Irakurketa-modutik irten':'Irakurketa-modua';
      if(state.readerFocus)reader.scrollIntoView({behavior:'auto',block:'start'});
    };
    $('pathSmallerText').addEventListener('click',()=>scale(-1));
    $('pathLargerText').addEventListener('click',()=>scale(1));
    focus.addEventListener('click',()=>setFocus(!state.readerFocus));
    window.addEventListener('keydown',event=>{
      if(event.key==='Escape'&&state.readerFocus){setFocus(false);focus.focus()}
    });
    scale(0);
  }
  function renderDocumentOutline(host,headings){
    if(headings.length<2)return;
    const menu=el('details',null,'gr-doc-outline');
    menu.append(el('summary','Dokumentuaren aurkibidea · '+headings.length+' atal'));
    const nav=el('nav',null,'gr-doc-outline-links');
    nav.setAttribute('aria-label','Dokumentuaren atalak');
    headings.forEach(heading=>{
      const link=aLink('#'+heading.id,heading.title);
      link.addEventListener('click',event=>{
        const section=host.querySelector('#'+heading.id);
        if(!section)return;
        event.preventDefault();
        const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        section.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
      });
      nav.append(link);
    });
    menu.append(nav);host.prepend(menu);
  }
  async function renderWholeGrammarEntry(entry,host){
    host.setAttribute('aria-busy','true');
    host.replaceChildren(el('p','Eduki osoa Supabasetik kargatzen…','gr-doc-loading'));
    try{
      const reader=window.SustraiGrammarReader;
      if(!reader)throw Error('reader_missing');
      const full=await reader.load(entry,state.client);
      if(!host.isConnected||state.selected!==entry.code)return;
      renderDocumentOutline(host,reader.render(host,entry,full));
    }catch(error){
      if(!host.isConnected||state.selected!==entry.code)return;
      host.replaceChildren(el('p','Ezin izan da gaiaren eduki osoa kargatu. Saiatu berriro.','b2-error'));
      host.append(button('Berriro kargatu',()=>void renderWholeGrammarEntry(entry,host),'b2-button is-secondary'));
      console.warn('SUSTRAI grammar reader',error?.code||error?.message||'load_failed');
    }finally{if(host.isConnected)host.setAttribute('aria-busy','false')}
  }
  function renderUnderstanding(e,body){
    const design=designFor(e.code);
    if(design){
      const intro=section(body,'Ikaskuntza-helburua eta egoera');
      addP(intro,design.why_it_matters_eu,'b2-intro');
      addP(intro,design.situation_eu,'b2-context');
      listValues(intro,design.success_indicators_eu,'b2-outcomes');
      const model=section(body,'Eredu landua · zergatik?');
      const sample=el('div',null,'b2-model-card');
      sample.append(el('span','SUSTRAIren adibide originala','b2-mini-label'));
      addP(sample,design.anchor_example_eu,'b2-sample-phrase');
      addP(sample,design.anchor_comment_eu,'b2-example-note');model.append(sample);
    }
    const chapter=section(body,'Gramatika · eduki osoa');
    addP(chapter,'Azalpenak, egiturak, adibideak, laburpen-taulak eta iturriak hemen bertan dituzu.','gr-doc-section-intro');
    const host=el('div',null,'gr-document-host');chapter.append(host);
    void renderWholeGrammarEntry(e,host);
    addP(body,'Irakurketa markatzea ez da egitura menderatzen dela egiaztatzea.','b2-footnote');
    row(body,button(own(e.code).read_at?(design?'Hurrengoa: kontrastatu':'Irakurketa berrikusi'):'Azalpena irakurri dut',async()=>{
      if(design){await markRead();return;}
      if(await saveProgress(e.code,{read_at:own(e.code).read_at||new Date().toISOString()})){
        renderLesson();say(hasAccount()?'Irakurketa hodeian gordeta.':'Gonbidatu moduan, irakurketa ez da hodeian gordetzen.');
      }
    }));
  }

  async function renderContrasts(code, body) {
    const title = section(body, '2. Kontrastatu: adibideak eta ñabardurak');
    addP(title, 'Alderatu erabilerak: zein da arauaren ondorioa, zein testuinguruk baldintzatzen duena eta zein estilo-aukera?');
    const design=designFor(code);
    if(design){
      const sample=el('div',null,'b2-model-card is-contrast');
      sample.append(el('span','Kontraste arrazoitua','b2-mini-label'));
      addP(sample,design.contrast_example_eu,'b2-sample-phrase');
      addP(sample,design.contrast_comment_eu,'b2-example-note');
      title.append(sample);
      addP(title,design.guided_task_eu,'b2-context');
      const tips=el('details',null,'b2-read-more');
      tips.append(el('summary','Ohiko nahasmenak eta ñabardurak'));
      listValues(tips,design.misconceptions_eu);
      title.append(tips);
    }
    const slot = el('div', 'Adibideak kargatzen…', 'b2-examples');
    title.append(slot);
    try {
      const data = await loadExamples(code);
      if (state.selected !== code || state.step !== 1) return;
      slot.replaceChildren();
      if (!data.length) addP(slot, 'Adibide gehigarriak ez dira eskuragarri; teoria osoa lehen urratsean dago.');
      for (const example of data) {
        const card = el('div', null, 'b2-example');
        const labels = {good:'Erabilera egokia',bad:'Arazotsua',better:'Beste aukera egokia',contrast:'Kontrastea'};
        card.append(el('small', labels[example.example_type] || 'Adibidea'));
        card.append(el('p', example.text_eu));
        addP(card, example.explanation_eu, 'b2-example-note');
        slot.append(card);
      }
    } catch (err) {
      slot.textContent = 'Ezin izan dira adibide gehigarriak kargatu; kontsultatu lehen urratseko teoria.';
    }
    row(body,button('Teoria osoa ikusi',()=>{state.step=0;renderLesson();},'b2-button is-secondary'),
      button(own(code).contrasted_at?'Hurrengoa: praktikatu':'Adibideak aztertu ditut',markContrast));
  }
  function renderPractice(code, body) {
    const info=QUESTIONS[code];
    const root=section(body,'Praktika · lau egoera komunikatibo');
    addP(root,'SUSTRAIren ariketa sintetikoak dira. Erantzun, irakurri aukeraren azalpena eta, behar denean, saiatu berriro. Ez da azterketa ofiziala.','b2-context');
    if(!info?.prompts?.length){addP(root,'Ariketa ez dago erabilgarri.','b2-footnote');return;}
    if(!own(code).contrasted_at){
      addP(root,'Lehenik, irakurri azalpena eta aztertu kontrasteak.','b2-footnote');
      row(root,button('Kontrasteetara itzuli',()=>{state.step=1;renderLesson();},'b2-button is-secondary'));
      return;
    }
    if(own(code).practiced_at){
      addP(root,'Lau galderak zuzen erantzun dituzu. Erantzunak hautatzea ez da, ordea, gaitasuna autonomiaz menderatzearen froga.','b2-good-note');
      row(root,button('Hurrengoa: nire ekoizpena',()=>{state.step=3;renderLesson();}));return;
    }
    const answers=state.quizAnswers.get(code)||{};
    const tries=state.quizTries.get(code)||0;
    const correct=info.prompts.filter((q,index)=>answers[index]===q.correct).length;
    root.append(el('div',correct+' / '+info.prompts.length+' aukera egoki','b2-practice-count'));
    info.prompts.forEach((q,i)=>{
      const card=el('fieldset',null,'b2-quiz-card');
      card.append(el('legend',(i+1)+'. '+q.q));
      const meta=el('div',null,'b2-question-meta');
      meta.append(el('span',q.skill,'b2-skill-tag'),el('span',q.context));
      card.append(meta);
      const opts=el('div',null,'b2-quiz-options');
      q.a.forEach((option,index)=>{
        const b=button(option,()=>{
          const next=state.quizAnswers.get(code)||{};
          next[i]=index;
          state.quizAnswers.set(code,next);
          state.quizTries.set(code,(state.quizTries.get(code)||0)+1);
          renderLesson();
          requestAnimationFrame(()=>{
            const card=$('pathStepContent')?.querySelectorAll('.b2-quiz-card')?.[i];
            card?.querySelectorAll('.b2-option')?.[index]?.focus();
          });
        },'b2-option');
        if(answers[i]===index)b.classList.add(index===q.correct?'is-correct':'is-incorrect');
        b.setAttribute('aria-pressed',String(answers[i]===index));
        opts.append(b);
      });
      card.append(opts);
      if(answers[i]!==undefined){
        const ok=answers[i]===q.correct;
        const feedback=el('div',null,'b2-feedback '+(ok?'is-correct':'is-incorrect'));
        feedback.setAttribute('role','status');
        feedback.append(el('strong',ok?'Zuzena':'Berrikusteko'));
        addP(feedback,q.feedback?.[answers[i]]||q.why,'b2-feedback-body');
        if(ok)addP(feedback,q.why,'b2-feedback-body');
        card.append(feedback);
      }
      root.append(card);
    });
    if(correct===info.prompts.length){
      addP(root,'Orain transferitu ikasitakoa egoera berri batera, laguntzarik gabe.','b2-good-note');
      row(root,button('Praktika gorde eta jarraitu',async()=>{
        if(await saveProgress(code,{
          practiced_at:new Date().toISOString(),
          practice_attempts:(own(code).practice_attempts||0)+Math.max(info.prompts.length,tries)
        })){state.step=3;renderLesson();say(hasAccount()?'Praktika orientagarria hodeian gordeta.':'Praktika probatuta; ez da hodeian gordetzen.');}
      }));
    }else addP(root,'Aukera bakoitzak azalpen propioa du. Kontuan hartu arrazoiak, ez aukera-zenbakiak bakarrik.','b2-footnote');
  }
  function renderTransfer(code, body) {
    const root = section(body, '4. Erabili: zure adibide propioa');
    const design=designFor(code);
    addP(root,design?.transfer_task_eu || QUESTIONS[code].transfer,'b2-intro');
    if(design){
      const hints=el('details',null,'b2-read-more');
      hints.append(el('summary','Neure burua berrikusteko zerrenda'));
      listValues(hints,design.transfer_checklist_eu,'b2-check-list');
      root.append(hints);
    }
    addP(root, 'Idatzi zeure ekoizpena. Hemen gordetakoa zure irakasleak ikusi ahal izango du haren taldeko kidea bazara. Ez dago zuzenketa automatiko akademikorik.', 'b2-footnote');
    if (!own(code).practiced_at) {
      addP(root, 'Praktika orientagarria amaitu behar duzu lehenik.', 'b2-footnote');
      row(root, button('Itzuli praktikatzera', () => {state.step = 2; renderLesson();}, 'b2-button is-secondary'));
      return;
    }
    const label = el('label', 'Zure azalpena edo perpausak', 'b2-input-label');
    label.htmlFor = 'pathTransferText';
    const text = el('textarea');
    text.id = 'pathTransferText'; text.rows = 5; text.maxLength = 1200;
    text.placeholder = 'Idatzi hemen zure adibidea eta azalpena…';
    text.value = own(code).reflection_eu || '';
    root.append(label, text);
    if (own(code).transferred_at) addP(root, 'Ekoizpena gordeta dago. Berridatzi eta berriro gorde dezakezu.', 'b2-good-note');
    row(root, button(own(code).transferred_at ? 'Ekoizpena eguneratu' : 'Ekoizpena gorde', async () => {
      const value = text.value.trim();
      if(value.length<50){say('Adibidea eta arrazoibidea azaltzeko, idatzi gutxienez 50 karaktere.',true);text.focus();return;}
      const iso = new Date().toISOString();
      if (await saveWrittenWork(code,value,'transfer')) {
        renderLesson(); say(hasAccount()?'Ekoizpena hodeian gordeta. Ez da zuzenketa automatikoa egin.':'Ekoizpena saio honetako memorian dago; ez da hodeian gordetzen.');
      }
    }));
    if(own(code).transferred_at){
      const review=section(body,'Atzeratutako berrikuspena');
      const due=new Date(new Date(own(code).transferred_at).getTime()+72*60*60*1000);
      if(own(code).reviewed_again_at){
        addP(review,'Beste egun bateko ekoizpena gordeta: '+day(own(code).reviewed_again_at)+'.','b2-good-note');
        addP(review,own(code).review_reflection_eu,'b2-copy');
      }else if(Date.now()<due.getTime()){
        addP(review,'Itzuli '+day(due)+' egunetik aurrera. Aukeratu aurreko egoera ez bezalako beste bat, eta berreraiki azalpena laguntzarik gabe.');
      }else{
        addP(review,'Hiru egun igaro dira. Erabili gaur beste egoera batekin ikasitakoa; ez kopiatu aurreko ekoizpena.','b2-context');
        const note=el('textarea');note.rows=4;note.maxLength=800;note.setAttribute('aria-label','Geroko ekoizpen autonomoa');
        note.placeholder='Egoera berria, adibidea eta zergatik aukeratu dudan…';
        review.append(note);
        row(review,button('Geroko berrikuspena gorde',async()=>{
          const answer=note.value.trim();
          if(answer.length<45){say('Garatu geroko ekoizpena gutxienez 45 karakteretan.',true);note.focus();return;}
          if(await saveWrittenWork(code,answer,'delayed')){
            renderLesson();say(hasAccount()?'Atzeratutako berrikuspena hodeian gordeta.':'Geroko berrikuspena saio honetan soilik markatuta.');
          }
        }));
      }
    }
    if(own(code).transferred_at&&hasAccount()){
      const history=el('details',null,'b2-read-more b2-work-history');
      const summary=el('summary','Nire idazkien bertsioen historia');
      const slot=el('div','Bertsioak kargatzen…','b2-version-list');
      history.append(summary,slot);
      history.addEventListener('toggle',()=>{
        if(history.open&&slot.dataset.loaded!=='yes'){
          slot.dataset.loaded='yes';
          void renderWorkHistory(code,slot);
        }
      });
      body.append(history);
    }
    if(own(code).transferred_at){
      const index=state.units.findIndex(u=>u.entry_code===code);
      if(state.units[index+1])row(body,button('Hurrengo gaia',()=>openUnit(state.units[index+1].entry_code)));
    }
  }
  function openUnit(code, scroll = true) {
    if (!state.entries.has(code)) {say('Gaia ezin izan da aurkitu.', true); return;}
    state.selected = code;
    const progress = own(code);
    state.step = !progress.read_at ? 0 : !progress.contrasted_at ? 1 : !progress.practiced_at ? 2 : 3;
    const url = new URL(location.href);
    url.searchParams.set('gaia', code);
    if (url.href !== location.href) history.pushState(null, '', url);
    renderPath(); renderLesson();
    if(scroll){
      const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
      $('pathLesson').scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
      const heading=$('pathLessonTitle');
      heading.tabIndex=-1;
      heading.focus({preventScroll:true});
    }
  }
  async function renderStudentFeedback(area) {
    if(!hasAccount())return;
    const box=section(area,'Irakaslearen orientabideak');
    try{
      const feedback=check(await state.client.from('smx_grammar_b2_teacher_feedback')
        .select('entry_code,feedback_eu,next_step_eu,created_at')
        .eq('student_id',state.user.id).order('created_at',{ascending:false}).limit(30));
      if(!box.isConnected)return;
      if(!feedback.length){addP(box,'Oraindik ez dago irakasle-oharrik. Zure ekoizpenak modu autonomoan berrikus ditzakezu.','b2-small');return;}
      feedback.forEach(fb=>{
        const note=el('article',null,'b2-feedback-note');
        note.append(el('span',day(fb.created_at),'b2-mini-label'));
        note.append(el('strong',state.entries.get(fb.entry_code)?.title_eu||fb.entry_code));
        addP(note,fb.feedback_eu);
        if(fb.next_step_eu)addP(note,'Hurrengo urratsa: '+fb.next_step_eu,'b2-next-note');
        box.append(note);
      });
    }catch(err){addP(box,'Irakaslearen oharrak ezin izan dira kargatu.','b2-error');}
  }
    async function loadStudent() {
    const area = $('pathStudentArea');
    area.replaceChildren();
    if (!hasAccount()) {
      addP(area, 'Ikasle-kontuarekin saioa hasita, egindako jarduerak eta irakaslearen esleipenak gordeko dituzu.');
      row(area, button('Saioa hasi', signIn));
      return;
    }
    const join = section(area, 'Irakaslearen taldean sartu');
    addP(join, 'Irakasleak emandako talde-kodearekin bat egin. Ez du zure aurrerapena publikoki erakusten.');
    const form = el('form', null, 'b2-inline-form');
    const input = el('input');input.type='text';input.maxLength=20;input.required=true;input.placeholder='Talde-kodea';input.setAttribute('aria-label','Talde-kodea');
    const submit = el('button','Taldean sartu','b2-button');submit.type='submit';
    form.append(input, submit);
    form.onsubmit = async event => {
      event.preventDefault();
      try {
        const response = await state.client.rpc('sr_join_group',{p_code:input.value});
        if (response.error) throw response.error;
        if (!response.data) throw new Error('Ez da talde hori aurkitu.');
        input.value='';say('Taldearekin lotura egin da.');await loadStudent();
      } catch(err){say('Ezin izan zara taldean sartu: '+(err.message||''),true);}
    };
    join.append(form);
    void renderStudentFeedback(area);
    try {
      const memberships = check(await state.client.rpc('sr_my_groups'));
      state.myGroups = Array.isArray(memberships) ? memberships : [];
      const assigned = section(area,'Irakasleak esleitutako gaiak');
      if(!state.myGroups.length) {addP(assigned,'Oraindik ez zaude inongo taldetan.');return;}
      const groupIds = state.myGroups.map(g=>g.id);
      const list = check(await state.client.from('smx_grammar_b2_assignments')
        .select('id,group_id,module_no,entry_code,note_eu,due_at,status')
        .in('group_id',groupIds).eq('status','active').order('created_at',{ascending:false}).limit(200));
      if(!list.length) {addP(assigned,'Oraindik ez duzu gramatika-esleipenik.');return;}
      const ul = el('ul',null,'b2-assignment-list');
      list.forEach(a=>{
        const li=el('li');const topic = state.units.find(u=>u.entry_code===a.entry_code);
        const mod = state.modules.find(m=>m.module_no===a.module_no);
        const label=topic ? state.entries.get(topic.entry_code)?.title_eu || topic.entry_code : mod?.title_eu || 'Gaia';
        const group=state.myGroups.find(g=>g.id===a.group_id);
        const b=button(label,()=>openUnit(topic?.entry_code||state.units.find(u=>u.module_no===a.module_no)?.entry_code),'b2-assignment-link');
        li.append(b);
        addP(li,(group?.name||'Taldea')+(a.due_at?' · Epea: '+new Date(a.due_at).toLocaleDateString('eu-ES'):'')+(a.note_eu?' · '+a.note_eu:''),'b2-small');
        ul.append(li);
      });
      assigned.append(ul);
    } catch(err) {addP(area,'Ezin izan dira esleipenak kargatu: '+(err.message||''),'b2-error');}
  }
  async function loadTeacher() {
    const area = $('pathTeacherArea');
    if (!state.profile?.teacher || !hasAccount()) {area.hidden=true;return;}
    area.hidden=false;
    try {
      const groups = check(await state.client.rpc('sr_teacher_overview'));
      state.teacherGroups=Array.isArray(groups)?groups:[];
      renderTeacher();
    } catch(err){say('Irakaslearen panela ezin izan da kargatu: '+(err.message||''),true);}
  }
  function renderTeacher() {
    const holder=$('pathTeacherArea');
    holder.replaceChildren();
    holder.append(el('h2','Irakaslearen panela'));
    addP(holder,'Taldea sortu, kodea ikasleei eman eta modulua edo gaia esleitu. Ikaslearen idazkiak ez dira automatikoki ebaluatzen.');
    const groupBlock=section(holder,'Talde berri bat');
    const groupForm=el('form',null,'b2-inline-form');
    const groupName=el('input');groupName.type='text';groupName.maxLength=120;groupName.required=true;groupName.placeholder='Taldearen izena';groupName.setAttribute('aria-label','Taldearen izena');
    const create=el('button','Sortu taldea','b2-button');create.type='submit';
    groupForm.append(groupName,create);
    groupForm.onsubmit=async event=>{
      event.preventDefault();
      const name=groupName.value.trim();
      if(!name)return;
      try {
        check(await state.client.from('sr_groups').insert({name}).select('id').single());
        say('Talde berria sortu da.');await loadTeacher();
      }catch(err){say('Ezin izan da taldea sortu: '+(err.message||''),true);}
    };
    groupBlock.append(groupForm);
    if (!state.teacherGroups.length) {
      addP(holder,'Oraindik ez duzu talderik. Sortu lehenengo taldea eta partekatu haren kodea ikasleekin.');return;
    }
    const choose=section(holder,'Taldearen esleipenak eta aurrerapena');
    const select=el('select');select.id='pathTeacherGroup';select.setAttribute('aria-label','Hautatu taldea');
    state.teacherGroups.filter(g=>!g.archived).forEach(g=>{
      const opt=el('option',g.name);opt.value=g.id;select.append(opt);
    });
    if (!select.options.length){addP(choose,'Talde guztiak artxibatuta daude.');return;}
    const previous=holder.dataset.selectedGroup;
    if(previous && [...select.options].some(o=>o.value===previous)) select.value=previous;
    holder.dataset.selectedGroup=select.value;
    choose.append(select);
    const slot=el('div',null,'b2-teacher-details');choose.append(slot);
    select.onchange=()=>{holder.dataset.selectedGroup=select.value;void renderTeacherGroup(select.value,slot);};
    void renderTeacherGroup(select.value,slot);
  }
  async function renderTeacherGroup(groupId,slot) {
    slot.replaceChildren();
    const group=state.teacherGroups.find(g=>g.id===groupId);
    if(!group)return;
    const code=el('div',null,'b2-join-code');
    code.append(el('small','Ikasleen sarrera-kodea'),el('strong',group.code));
    const copy=button('Kopiatu kodea',async()=>{
      try{
        if(!navigator.clipboard?.writeText)throw new Error('clipboard_not_available');
        await navigator.clipboard.writeText(group.code);
        say('Talde-kodea kopiatu da.');
      }catch{
        say('Kopiatzeko, hautatu kodea eta erabili Kopiatu aukera. Ez da aldaketarik egin.',true);
      }
    },'b2-link-button');
    code.append(copy);
    slot.append(code);
    const form=el('form',null,'b2-teacher-form');
    const label1=el('label','Esleitu modulu edo gai bat');label1.htmlFor='pathAssignTarget';
    const target=el('select');target.id='pathAssignTarget';
    state.modules.forEach(m=>{
      const opt=el('option','Modulua '+m.module_no+': '+m.title_eu);
      opt.value='m:'+m.module_no;target.append(opt);
    });
    state.units.forEach(u=>{
      const topic=state.entries.get(u.entry_code);
      const opt=el('option','Gaia '+u.global_order+': '+(topic?.title_eu || u.entry_code));
      opt.value='u:'+u.entry_code;target.append(opt);
    });
    const label2=el('label','Epea (aukerakoa)');label2.htmlFor='pathAssignDue';
    const due=el('input');due.id='pathAssignDue';due.type='date';
    const label3=el('label','Irakaslearen oharra (aukerakoa)');label3.htmlFor='pathAssignNote';
    const note=el('textarea');note.id='pathAssignNote';note.rows=2;note.maxLength=500;
    const save=el('button','Esleitu taldeari','b2-button');save.type='submit';
    form.append(label1,target,label2,due,label3,note,save);
    form.onsubmit=async event=>{
      event.preventDefault();
      const [kind,value]=target.value.split(':');
      const payload={group_id:groupId,assigned_by:state.user.id,note_eu:note.value.trim()||null,
        due_at:due.value?new Date(due.value+'T23:59:00').toISOString():null};
      if(kind==='m')payload.module_no=Number(value);
      else payload.entry_code=value;
      try{
        check(await state.client.from('smx_grammar_b2_assignments').insert(payload).select('id').single());
        say('Taldeari esleitu zaio.');await renderTeacherGroup(groupId,slot);await loadStudent();
      }catch(err){say('Esleipena ezin izan da gorde (baliteke lehendik esleituta egotea): '+(err.message||''),true);}
    };
    slot.append(form);
    const assignmentBox=section(slot,'Indarrean dauden esleipenak');
    try{
      const arr=check(await state.client.from('smx_grammar_b2_assignments')
        .select('id,module_no,entry_code,note_eu,due_at,status')
        .eq('group_id',groupId).eq('status','active').order('created_at',{ascending:false}).limit(100));
      if(!arr.length)addP(assignmentBox,'Oraindik ez duzu gairik esleitu.');
      for(const a of arr){
        const it=state.entries.get(a.entry_code);
        const m=state.modules.find(x=>x.module_no===a.module_no);
        const r=el('div',null,'b2-assigned-row');
        r.append(el('span',it?.title_eu || m?.title_eu || 'Esleipena'));
        r.append(button('Kendu esleipena',async()=>{
          try{check(await state.client.from('smx_grammar_b2_assignments').update({status:'archived'}).eq('id',a.id).select('id').single());
            say('Esleipena artxibatu da.');await renderTeacherGroup(groupId,slot);}
          catch(err){say('Ezin izan da esleipena artxibatu: '+(err.message||''),true);}
        },'b2-link-button'));
        assignmentBox.append(r);
      }
    }catch(err){addP(assignmentBox,'Esleipenak ezin izan dira kargatu.','b2-error');}
    const pupils=section(slot,'Ikasleen aurrerapena');
    const students=Array.isArray(group.students)?group.students.filter(s=>s.active):[];
    if(!students.length){addP(pupils,'Taldean ez dago oraindik ikaslerik. Partekatu sarrera-kodea.');return;}
    try{
      const data=check(await state.client.from('smx_grammar_b2_progress')
        .select('user_id,entry_code,read_at,transferred_at')
        .in('user_id',students.map(s=>s.id)).limit(1500));
      students.forEach(s=>{
        const ownRows=data.filter(d=>d.user_id===s.id);
        const started=ownRows.filter(d=>d.read_at).length;
        const transferred=ownRows.filter(d=>d.transferred_at).length;
        const item=el('div',null,'b2-student-row');
        item.append(el('strong',s.name||'Ikaslea'),el('span',started+'/31 gai irakurrita · '+transferred+'/'+guidedCount()+' ekoizpen gordeta'));
        const inspect=button('Ikusi ekoizpenak eta eman orientabidea',()=>{
          if(item.querySelector('.b2-teacher-student-detail')){
            item.querySelector('.b2-teacher-student-detail').remove();return;
          }
          const slot=el('div','Ikaslearen lanak kargatzen…','b2-teacher-student-detail');
          item.append(slot);
          void renderStudentEvidence(s,slot);
        },'b2-link-button');
        item.append(inspect);
        pupils.append(item);
      });
    }catch(err){addP(pupils,'Aurrerapena ezin izan da irakurri.','b2-error');}
  }
  async function renderStudentEvidence(student,slot) {
    if(!hasAccount()||!state.profile?.teacher)return;
    slot.replaceChildren();
    const heading=el('h4','Ikaslearen ekoizpenak eta feedback hezigarria');slot.append(heading);
    try{
      const [progress,feedback,versions]=await Promise.all([
        state.client.from('smx_grammar_b2_progress').select('entry_code,read_at,practiced_at,transferred_at,reflection_eu,reviewed_again_at,review_reflection_eu')
          .eq('user_id',student.id).order('updated_at',{ascending:false}).limit(50).then(check),
        state.client.from('smx_grammar_b2_teacher_feedback').select('entry_code,feedback_eu,next_step_eu,created_at')
          .eq('student_id',student.id).order('created_at',{ascending:false}).limit(25).then(check),
        state.client.from('smx_grammar_b2_work_versions').select('entry_code,version_no,version_kind,body_eu,created_at')
          .eq('user_id',student.id).order('created_at',{ascending:false}).limit(60).then(check)
      ]);
      const works=progress.filter(x=>x.reflection_eu||x.review_reflection_eu);
      if(!works.length)addP(slot,'Ikasleak ez du oraindik ekoizpen idatzirik gorde.','b2-small');
      else works.forEach(work=>{
        const unit=el('article',null,'b2-student-work');
        unit.append(el('strong',state.entries.get(work.entry_code)?.title_eu||work.entry_code));
        if(work.reflection_eu){unit.append(el('span','Lehen ekoizpena','b2-mini-label'));addP(unit,work.reflection_eu);}
        if(work.review_reflection_eu){unit.append(el('span','Geroko berrikuspena','b2-mini-label'));addP(unit,work.review_reflection_eu);}
        slot.append(unit);
      });
      if(versions.length){
        const history=el('details',null,'b2-read-more b2-work-history');
        history.append(el('summary','Jatorrizko ekoizpenen eta berridazketen historia ('+versions.length+')'));
        const historyList=el('div',null,'b2-version-list');
        versions.forEach(v=>{
          const card=el('article',null,'b2-feedback-note');
          const kind=({initial:'Lehen ekoizpena',revision:'Berridazketa',delayed:'Geroko transferentzia'})[v.version_kind]||'Bertsioa';
          card.append(el('strong',state.entries.get(v.entry_code)?.title_eu||v.entry_code));
          card.append(el('span','v'+v.version_no+' · '+kind+' · '+day(v.created_at),'b2-mini-label'));
          addP(card,v.body_eu);
          historyList.append(card);
        });
        history.append(historyList);slot.append(history);
      }
      if(feedback.length){
        const notes=section(slot,'Emandako orientabideak');
        feedback.forEach(fb=>{
          const note=el('article',null,'b2-feedback-note');
          note.append(el('span',day(fb.created_at)+' · '+(state.entries.get(fb.entry_code)?.title_eu||''),'b2-mini-label'));
          addP(note,fb.feedback_eu);
          if(fb.next_step_eu)addP(note,'Hurrengo urratsa: '+fb.next_step_eu,'b2-next-note');
          notes.append(note);
        });
      }
      const form=el('form',null,'b2-teacher-form');
      const suffix=String(student.id).replaceAll('-','').slice(0,12);
      const label=el('label','Ikasgaia');label.htmlFor='b2FeedbackUnit-'+suffix;
      const choose=el('select');choose.id='b2FeedbackUnit-'+suffix;
      state.units.filter(u=>u.pilot_active).forEach(u=>{
        const option=el('option',state.entries.get(u.entry_code)?.title_eu||u.entry_code);
        option.value=u.entry_code;choose.append(option);
      });
      if(works[0] && state.units.some(u=>u.entry_code===works[0].entry_code&&u.pilot_active))choose.value=works[0].entry_code;
      const textLabel=el('label','Ikaslearen ekoizpenari buruzko orientabidea');textLabel.htmlFor='b2TeacherFeedback-'+suffix;
      const area=el('textarea');area.id='b2TeacherFeedback-'+suffix;area.rows=4;area.required=true;area.minLength=12;area.maxLength=1500;
      area.placeholder='Indargune frogatu bat eta hobetzeko aukera bat, ikaslearen testuan oinarrituta…';
      const nextLabel=el('label','Hurrengo ekintza (aukerakoa)');nextLabel.htmlFor='b2TeacherNextStep-'+suffix;
      const next=el('textarea');next.id='b2TeacherNextStep-'+suffix;next.rows=2;next.maxLength=500;
      next.placeholder='Beste egoera bateko praktika edo berreraikuntza…';
      const submit=el('button','Gorde feedbacka','b2-button');submit.type='submit';
      form.append(label,choose,textLabel,area,nextLabel,next,submit);
      form.onsubmit=async event=>{
        event.preventDefault();
        if(!area.value.trim()||area.value.trim().length<12){say('Feedbackak 12 karaktere behar ditu gutxienez.',true);return;}
        submit.disabled=true;
        try{
          check(await state.client.from('smx_grammar_b2_teacher_feedback').insert({
            student_id:student.id,teacher_id:state.user.id,entry_code:choose.value,
            feedback_eu:area.value.trim(),next_step_eu:next.value.trim()||null
          }).select('id').single());
          say('Irakaslearen orientabidea gordeta. Ikasleak bere kontuan ikusi ahal izango du.');
          await renderStudentEvidence(student,slot);
        }catch(err){say('Feedbacka ezin izan da gorde: '+(err.message||''),true);}
        finally{submit.disabled=false;}
      };
      slot.append(form);
    }catch(err){addP(slot,'Ikaslearen ekoizpenak ezin izan dira kargatu: '+(err.message||''),'b2-error');}
  }
    async function start() {
    try{
      await cloud?.ready;
      state.client=cloud?.client?.()||null;
      state.profile=cloud?.profile?.()||null;
      state.user=cloud?.user?.()||null;
      if(!state.client)throw new Error('Supabase konexiorik ez');
      const [mods,units,entries,designs,items]=await Promise.all([
        state.client.from('smx_grammar_b2_modules').select('*').order('module_no').then(check),
        state.client.from('smx_grammar_b2_path_units').select('*').order('global_order').then(check),
        state.client.from('public_editorial_grammar_entries')
          .select('id,code,title_eu,short_explanation_eu,explanation_eu,level,metadata,use_when_eu,avoid_when_eu,warning_eu,source_guideline,version').eq('level','B2').limit(100).then(check),
        state.client.from('smx_grammar_b2_lesson_designs').select('*').limit(20).then(check),
        state.client.from('smx_grammar_b2_practice_items').select('*').order('item_order').limit(100).then(check)
      ]);
      if(mods.length!==7 || units.length!==31)throw new Error('Ibilbidearen egitura osatu gabe dago');
      state.modules=mods;state.units=units.map(u=>({...u,pilot_active:designs.some(d=>d.entry_code===u.entry_code)}));
      state.entries=new Map(entries.map(e=>[e.code,e]));
      const activeCount=state.units.filter(u=>u.pilot_active).length;
      if(activeCount!==designs.length)throw new Error('Ikasgaien eta gramatika-ibilbidearen kodeak ez datoz bat.');
      if(!designs.length||items.length<designs.length*4)throw new Error('Ikasgai eta praktiken datuak osatu gabe daude.');
      designs.forEach(d=>LESSONS.set(d.entry_code,d));
      for(const d of designs){
        const selected=items.filter(it=>it.entry_code===d.entry_code).sort((a,b)=>a.item_order-b.item_order);
        if(selected.length!==4)throw new Error('Lau galderak falta dira: '+d.entry_code);
        QUESTIONS[d.entry_code]={prompts:selected.map(it=>({
          q:it.question_eu,a:it.options_eu,correct:it.correct_index,why:it.explanation_eu,
          feedback:it.feedback_eu,context:it.context_eu,
          skill:({identifikatu:'Identifikatu',arrazoitu:'Arrazoitu',aplikatu:'Aplikatu',kontrastatu:'Kontrastatu'})[it.item_skill]||'Praktika'
        })),transfer:d.transfer_task_eu};
      }
      if(units.some(u=>!state.entries.has(u.entry_code)))throw new Error('Gramatika-fitxa bat ezin da irakurri');
      if(hasAccount()){
        const data=check(await state.client.from('smx_grammar_b2_progress')
          .select('*').eq('user_id',state.user.id).limit(100));
        state.progress=new Map(data.map(d=>[d.entry_code,d]));
      }
      renderPath();
      await Promise.all([loadStudent(),loadTeacher()]);
      const target=new URLSearchParams(location.search).get('gaia');
      if(target && state.entries.has(target))openUnit(target,false);
      else openUnit(state.units[0].entry_code,false);
      const stat=$('pathGuidedCount');if(stat)stat.textContent=guidedCount()+' ikasgai gidatu';
      say('');
    }catch(err){
      console.warn('SUSTRAI B2 path startup',err?.code||err?.message||'network');
      say('Ezin izan da B2ko ibilbidea kargatu. Freskatu orria edo egiaztatu konexioa.',true);
    }
  }
  window.addEventListener('popstate',()=>{
    const target=new URLSearchParams(location.search).get('gaia');
    if(target&&state.entries.has(target))openUnit(target,false);
  });
  setupReadingControls();
  void start();
})();