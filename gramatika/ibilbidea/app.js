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
    selected: null, step: 0, quizAnswers: new Map(), quizTries: new Map(), examplesCache: new Map()
  };
  const QUESTIONS = {
    subjektua_eta_aditza_oinarria: {
      prompts: [
        {q: '«Maddik liburua irakurri du» perpausean, zein da aditz multzoa?', a: ['irakurri du', 'liburua'], correct: 0, why: '«Irakurri du» aditz multzoa da; «liburua» osagarria da.'},
        {q: '«Atea ireki da» perpausean, zein osagaik adierazten du gertakaria?', a: ['Atea', 'ireki da'], correct: 1, why: '«Ireki da» aditz multzoak adierazten du gertakaria.'}
      ],
      transfer: 'Idatzi zure egunerokoari buruzko bi perpaus. Azpimarratu edo izendatu bakoitzaren aditz multzoa, eta azaldu perpausak zer adierazten duen.'
    },
    subjektua_eta_predikatua: {
      prompts: [
        {q: '«Anek leihoa ireki du» perpausean, zein da predikatua?', a: ['Anek', 'leihoa ireki du'], correct: 1, why: '«Leihoa ireki du» predikatua da; «Anek» subjektuaren funtzioan dago.'},
        {q: '«Haurrak jolasean ari dira» perpausean, zein da predikatua?', a: ['jolasean ari dira', 'Haurrak'], correct: 0, why: 'Predikatuak subjektuari buruz esaten dena biltzen du.'}
      ],
      transfer: 'Sortu bi perpaus eta idatzi bakoitzean zein den subjektua eta zein predikatua. Saiatu egitura desberdinak erabiltzen.'
    },
    b2_ergatiboa_eta_absolutiboa: {
      prompts: [
        {q: '«Ane__ liburua irakurri du» esaldian, zein da egokia?', a: ['Anek', 'Ane'], correct: 0, why: '«Irakurri du» egituran ekintzailea NORK kasuan dago: Anek.'},
        {q: '«Ane__ etorri da» esaldian, zein da egokia?', a: ['Anek', 'Ane'], correct: 1, why: '«Etorri da» egituran subjektuak NOR kasua darama: Ane.'}
      ],
      transfer: 'Idatzi «Ane etorri da» eta «Anek atea ireki du» egituren antzeko bi esaldi berri. Azaldu zergatik daraman batek -k marka eta besteak ez.'
    },
    b2_nor_eta_nor_nork_komunztadura: {
      prompts: [
        {q: '«Mirenek bi liburu erosi ___» perpausean, zein laguntzaile?', a: ['ditu', 'du'], correct: 0, why: '«Bi liburu» osagai plurala da, eta «ditu» forma dagokio egitura honetan.'},
        {q: '«Lagunak etorri ___» esaldian, zein laguntzaile?', a: ['ditu', 'dira'], correct: 1, why: '«Etorri» NOR egiturako aditza da; subjektu plurala «dira» formarekin doa.'}
      ],
      transfer: 'Idatzi NOR egiturako perpaus bat eta NOR-NORK egiturako beste bat. Azaldu bi laguntzaileen arteko aldea.'
    },
    b2_datiboa_eta_nori_komunztadura: {
      prompts: [
        {q: '«Nik Mireni liburu bat eman ___» perpausean, zein da egokia?', a: ['diot', 'dut'], correct: 0, why: '«Mireni» NORI osagaia da; «diot» laguntzaileak osagai hori jasotzen du.'},
        {q: '«Guk lagunei gutun bana bidali ___» perpausean, zein da egokia?', a: ['dugu', 'diegu'], correct: 1, why: '«Lagunei» datibo plurala da eta «diegu» laguntzaileak NORI komunztadura jasotzen du.'}
      ],
      transfer: 'Idatzi norbaiti zerbait eman edo bidali diozula adierazten duen perpaus bat. Bereizi NOR, NORI eta NORK osagaiak eta azaldu laguntzailea.'
    }
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
    $('pathNotice').textContent = message;
    $('pathNotice').classList.toggle('is-error', isError);
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
      ? '2026-11-22ko egoera: berrikuspen editoriala onartuta.'
      : '2026-11-22ko egoera: berrikuspen akademikoaren zain. Irakurgarri egoteak ez du onarpena esan nahi.';
  }
  function completeCount() {
    return state.units.filter(u => !!own(u.entry_code).read_at).length;
  }
  function renderSummary() {
    $('pathProgressText').textContent = hasAccount()
      ? completeCount() + '/31 gai irakurrita · '
        + state.units.filter(u => u.pilot_active && !!own(u.entry_code).transferred_at).length + '/5 pilotu-jarduera eginda'
      : '31 gai antolatuta · 5 pilotu-jarduera. Saioa hastean gordeko da zure aurrerapena.';
    $('pathProgressBar').style.width = (completeCount() / 31 * 100).toFixed(1) + '%';
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
        desc.append(el('span', status.transferred_at ? 'Jarduera eginda' : status.read_at ? 'Irakurrita' : 'Hasteko'));
        if (u.pilot_active) desc.append(el('span', '4 urratseko pilotua'));
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
    if (!requireAccount()) return false;
    const current = own(code);
    const next = {
      user_id: state.user.id, entry_code: code, read_at: current.read_at || null,
      contrasted_at: current.contrasted_at || null, practiced_at: current.practiced_at || null,
      transferred_at: current.transferred_at || null, practice_attempts: current.practice_attempts || 0,
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
  async function markRead() {
    if (own(state.selected).read_at) { state.step = 1; renderLesson(); return; }
    if (await saveProgress(state.selected, {read_at: new Date().toISOString()})) {
      state.step = 1; renderLesson(); say('Irakurketa gorde da.');
    }
  }
  async function markContrast() {
    if (!own(state.selected).read_at) { say('Lehenik, irakurri azalpena.', true); return; }
    if (own(state.selected).contrasted_at || await saveProgress(state.selected, {contrasted_at: new Date().toISOString()})) {
      state.step = 2; renderLesson(); say('Adibideen berrikuspena gorde da.');
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
    $('pathLessonMeta').textContent = readiness(u);
    $('pathLessonMeta').classList.toggle('needs-review', u.review_snapshot !== 'approved');
    $('pathLessonStatus').textContent = own(u.entry_code).transferred_at ? 'Jarduera eginda'
      : own(u.entry_code).read_at ? 'Ikasten' : 'Hasi gabe';
    const tabs = $('pathSteps');
    const body = $('pathStepContent');
    tabs.replaceChildren();
    body.replaceChildren();
    if (!u.pilot_active) {
      tabs.hidden = true;
      addP(body, 'Gai hau 31 unitateko ibilbidean dago. Lehen bertsioan lau urratseko jarduerak lehen bost gaientzat soilik aktibatuta daude.');
      const explanation = section(body, 'Gaia');
      addP(explanation, e.short_explanation_eu);
      row(body, aLink(grammarLink(u.entry_code), 'Ireki gramatika-fitxa osoa', 'b2-button is-secondary'),
        button(own(u.entry_code).read_at ? 'Irakurrita dago' : 'Irakurrita markatu', async () => {
          if (await saveProgress(u.entry_code, {read_at: own(u.entry_code).read_at || new Date().toISOString()})) renderLesson();
        }));
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
  function renderUnderstanding(e, body) {
    const intro = section(body, '1. Ulertu: azalpena');
    addP(intro, e.short_explanation_eu, 'b2-intro');
    addP(intro, e.explanation_eu);
    const extra = el('details', null, 'b2-read-more');
    extra.append(el('summary', 'Azalpen eta adibide gehiago'));
    const link = aLink(grammarLink(e.code), 'Ikusi fitxa osoa gramatika-bankuan', 'b2-text-link');
    extra.append(link);
    body.append(extra);
    addP(body, '«Irakurri dut» markak irakurketa erregistratzen du; ez du berez hizkuntza-gaitasuna egiaztatzen.', 'b2-footnote');
    row(body, button(own(e.code).read_at ? 'Hurrengo urratsa: kontrastatu' : 'Azalpena irakurri dut', markRead));
  }
  async function renderContrasts(code, body) {
    const title = section(body, '2. Kontrastatu: adibideak eta ñabardurak');
    addP(title, 'Alderatu adibideak: zein da forma, zein funtzioa eta zer ñabardura du? Ez da aukera estilistiko oro arau-akatsa.');
    const slot = el('div', 'Adibideak kargatzen…', 'b2-examples');
    title.append(slot);
    try {
      const data = await loadExamples(code);
      if (state.selected !== code || state.step !== 1) return;
      slot.replaceChildren();
      if (!data.length) addP(slot, 'Bankuko adibideak ez dira eskuragarri. Kontsultatu fitxa osoa.');
      for (const example of data) {
        const card = el('div', null, 'b2-example');
        const labels = {good:'Erabilera egokia',bad:'Arazotsua',better:'Beste aukera egokia',contrast:'Kontrastea'};
        card.append(el('small', labels[example.example_type] || 'Adibidea'));
        card.append(el('p', example.text_eu));
        addP(card, example.explanation_eu, 'b2-example-note');
        slot.append(card);
      }
    } catch (err) {
      slot.textContent = 'Ezin izan dira adibideak kargatu. Ikusi gramatika-fitxa.';
    }
    row(body, aLink(grammarLink(code), 'Fitxa osoa', 'b2-button is-secondary'),
      button(own(code).contrasted_at ? 'Hurrengo urratsa: praktikatu' : 'Adibideak aztertu ditut', markContrast));
  }
  function renderPractice(code, body) {
    const info = QUESTIONS[code];
    if (!info) return;
    const root = section(body, '3. Praktikatu: bi galdera labur');
    addP(root, 'Bi erantzunak ondo bereizita aukeratu. Jarduera hau orientagarria da: ez da HABEren puntuazio edo egiaztapen ofiziala.');
    if (!own(code).contrasted_at) {
      addP(root, 'Lehenik, amaitu irakurketa eta kontrastea.', 'b2-footnote');
      row(root, button('Itzuli kontrastera', () => {state.step = 1; renderLesson();}, 'b2-button is-secondary'));
      return;
    }
    if (own(code).practiced_at) {
      addP(root, 'Bi galderak zuzen erantzunda geratu dira praktika-saio batean. Beste egun batean berrikustea gomendatzen da.', 'b2-good-note');
      row(root, button('Erabilera autonomora', () => {state.step = 3; renderLesson();}));
      return;
    }
    const answers = state.quizAnswers.get(code) || {};
    const tries = state.quizTries.get(code) || 0;
    info.prompts.forEach((q, i) => {
      const card = el('fieldset', null, 'b2-quiz-card');
      card.append(el('legend', q.q));
      const opts = el('div', null, 'b2-quiz-options');
      q.a.forEach((option, index) => {
        const b = button(option, () => {
          const ans = state.quizAnswers.get(code) || {};
          ans[i] = index;
          state.quizAnswers.set(code, ans);
          state.quizTries.set(code, (state.quizTries.get(code) || 0) + 1);
          renderLesson();
        }, 'b2-option');
        const selected = answers[i] === index;
        if (selected) b.classList.add(index === q.correct ? 'is-correct' : 'is-incorrect');
        b.setAttribute('aria-pressed', String(selected));
        opts.append(b);
      });
      card.append(opts);
      if (answers[i] !== undefined) {
        const right = answers[i] === q.correct;
        addP(card, (right ? 'Zuzena. ' : 'Berrikusteko. ') + q.why, right ? 'b2-feedback is-correct' : 'b2-feedback is-incorrect');
      }
      root.append(card);
    });
    if (info.prompts.every((q, i) => answers[i] === q.correct)) {
      row(root, button('Bi galderak egin ditut · gorde', async () => {
        const today = new Date().toISOString();
        if (await saveProgress(code, {practiced_at: today, practice_attempts: (own(code).practice_attempts || 0) + Math.max(2, tries)})) {
          state.step = 3; renderLesson(); say('Praktika orientagarria gorde da.');
        }
      }));
    } else addP(root, 'Galdera bakoitzari erantzun; okerreko aukerak zuzentzeko aukera duzu.', 'b2-footnote');
  }
  function renderTransfer(code, body) {
    const root = section(body, '4. Erabili: zure adibide propioa');
    addP(root, QUESTIONS[code].transfer, 'b2-intro');
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
      if (value.length < 30) { say('Idatzi gutxienez 30 karaktere zure azalpena garatzeko.', true); text.focus(); return; }
      const iso = new Date().toISOString();
      if (await saveProgress(code, {transferred_at: iso,reflection_eu:value})) {
        renderLesson(); say('Zure ekoizpena gorde da. Ez da zuzenketa automatikoa egin.');
      }
    }));
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
    if (scroll) $('pathLesson').scrollIntoView({behavior:'smooth',block:'start'});
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
        const answer = check(await state.client.rpc('sr_join_group',{p_code:input.value}));
        if (!answer) throw new Error('Ez da talde hori aurkitu.');
        input.value='';say('Taldearekin lotura egin da.');await loadStudent();
      } catch(err){say('Ezin izan zara taldean sartu: '+(err.message||''),true);}
    };
    join.append(form);
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
        item.append(el('strong',s.name||'Ikaslea'),el('span',started+'/31 gai irakurrita · '+transferred+'/5 pilotu-jarduera eginda'));
        pupils.append(item);
      });
    }catch(err){addP(pupils,'Aurrerapena ezin izan da irakurri.','b2-error');}
  }
  async function start() {
    try{
      await cloud?.ready;
      state.client=cloud?.client?.()||null;
      state.profile=cloud?.profile?.()||null;
      state.user=cloud?.user?.()||null;
      if(!state.client)throw new Error('Supabase konexiorik ez');
      const [mods,units,entries]=await Promise.all([
        state.client.from('smx_grammar_b2_modules').select('*').order('module_no').then(check),
        state.client.from('smx_grammar_b2_path_units').select('*').order('global_order').then(check),
        state.client.from('public_editorial_grammar_entries')
          .select('id,code,title_eu,short_explanation_eu,explanation_eu,level').eq('level','B2').limit(100).then(check)
      ]);
      if(mods.length!==7 || units.length!==31)throw new Error('Ibilbidearen egitura osatu gabe dago');
      state.modules=mods;state.units=units;state.entries=new Map(entries.map(e=>[e.code,e]));
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
      say('B2ko ibilbidea kargatuta: 7 modulu, 31 gai. Lehenengo 5 gaietan praktika gidatua dago.');
    }catch(err){
      console.warn('SUSTRAI B2 path startup',err?.code||err?.message||'network');
      say('Ezin izan da B2ko ibilbidea kargatu. Freskatu orria edo egiaztatu konexioa.',true);
    }
  }
  window.addEventListener('popstate',()=>{
    const target=new URLSearchParams(location.search).get('gaia');
    if(target&&state.entries.has(target))openUnit(target,false);
  });
  void start();
})();