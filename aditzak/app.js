/* SUSTRAI ADITZAK. Activity visibility controlled by RLS (approved, admin or invited learner).
   Answer keys stay in the private schema; only post-submission reference answers are returned. */
(() => {
  'use strict';
  const prefix = /^(?:DRAFT-)?(?:ADI|SIN)-/i;
  const cloud = window.SustraiCloud;
  const $ = (id) => document.getElementById(id);
  const state = { client: null, activities: [], items: [], current: null, answers: new Map(), attemptId: null, saving: false, progress: new Map(), pilotVersions: new Set() };
  const node = (tag, text, cls) => {
    const out = document.createElement(tag);
    if (text != null) out.textContent = String(text);
    if (cls) out.className = cls;
    return out;
  };
  const status = (message, bad = false) => {
    const el = $('adStatus');
    el.textContent = message;
    el.classList.toggle('error', bad);
  };
  const saveNotice = (message, bad = false) => {
    const el = $('saveMessage');
    el.textContent = message;
    el.classList.toggle('error', bad);
  };
  const check = (res) => { if (res.error) throw res.error; return res.data || []; };
  async function loadProgress() {
    if (!state.client || !cloud?.user()) return;
    try {
      const r = await state.client.rpc('smx_my_practice_progress');
      if (r.error) throw r.error;
      state.progress = new Map((r.data || []).map(x => [x.activity_version_id, Number(x.attempt_count || 0)]));
      const attempts = [...state.progress.values()].reduce((n, x) => n+x, 0);
      const label = $('adProgress');
      if (label) label.textContent = attempts
        ? 'Zure aurrerapena: ' + attempts + ' saiakera gordeta. Emaitzak ariketa bakoitzeko berrikus daitezke.'
        : 'Oraindik ez duzu saiakerarik gorde. Ariketak argitaratu ondoren, hemen ikusiko dituzu.';
    } catch (err) {
      console.warn('ADITZAK progress temporarily unavailable',err?.code || 'network');
      if($('adProgress')) $('adProgress').textContent='Aurrerapena ezin da une honetan kargatu.';
    }
  }

  // Fisher–Yates shuffle: prevent positional clues, e.g. the first option
  // being correct in each of the initial six objective items.
  const mixedOptions = (choices) => {
    const values = [...choices];
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
  };
  const languageLevel = (a) => a.prompt_json?.target_level || '—';
  const titleOf = (a) => a.prompt_json?.title_eu || 'Jarduera';
  const isDraft = (a) => a.status !== 'approved';
  const isPilot = (a) => !!a && state.pilotVersions.has(a.id);
  const canSubmit = (a) => !!a && (!isDraft(a) || isPilot(a));

  async function load() {
    await cloud?.ready;
    state.client = cloud?.client?.() || null;
    if (!state.client || !cloud.user() || !cloud.profile()?.active) {
      $('authRequired').hidden = false;
      $('adContent').hidden = true;
      $('loginBtn').onclick = () => cloud?.openLogin?.('login');
      return;
    }

    status('Jarduerak kargatzen…');
    try {
      // Gate 1: Only ADITZAK codes. Gate 2: RLS returns only approved / admin draft versions.
      const activities = check(await state.client.from('smx_activities')
        .select('id,code,kind')
        .or('code.ilike.ADI-%,code.ilike.DRAFT-ADI-%,code.ilike.SIN-%,code.ilike.DRAFT-SIN-%')
        .order('code')
        .limit(500))
        .filter((a) => prefix.test(a.code));
      if (!activities.length) {
        state.activities = [];
        renderCatalog();
        return;
      }
      // Server RLS restricts releases to appointed testers and administrators.
      const releaseRows = check(await state.client.from('smx_aditzak_pilot_releases')
        .select('activity_version_id').eq('active', true).limit(1000));
      state.pilotVersions = new Set(releaseRows.map(x=>x.activity_version_id));
      const ids = activities.map((a) => a.id);
      const versions = check(await state.client.from('smx_activity_versions')
        .select('id,activity_id,revision,prompt_json,status,linguistic_ok,factual_ok,pedagogical_ok,traceability_ok')
        .in('activity_id', ids)
        .order('revision', { ascending: false })
        .limit(1000));
      const available = new Map();
      for (const v of versions) {
        if (v.status !== 'approved' && !state.pilotVersions.has(v.id)) continue;
        if (!available.has(v.activity_id)) available.set(v.activity_id,v);
      }
      const visible = [];
      for (const a of activities) {
        const version = available.get(a.id);
        if (!version) continue;
        visible.push({ ...a, ...version, activity_id: a.id });
      }
      state.activities = visible;
      if (visible.length) {
        state.items = check(await state.client.from('smx_activity_items')
          .select('id,activity_version_id,position,mechanism_code,response_kind,prompt_eu,public_payload')
          .in('activity_version_id', visible.map((v) => v.id))
          .order('position')
          .limit(2000));
      }
      await loadProgress();
      renderCatalog();
      // Deep links always resolve against RLS-visible activity versions.
      const chosenId=new URLSearchParams(location.search).get('activity');
      if(chosenId && /^[0-9a-f-]{36}$/i.test(chosenId)) {
        const selected=state.activities.find(a=>a.id===chosenId);
        if(selected){
          showActivity(selected);
          const itemPosition=new URLSearchParams(location.search).get('item');
          if(itemPosition && /^[1-9][0-9]{0,2}$/.test(itemPosition)){
            const anchor=$('ad-item-'+itemPosition);
            if(anchor){
              anchor.focus({preventScroll:true});
              anchor.scrollIntoView({behavior:'auto',block:'start'});
            }
          }
        }
      }
      const from=new URLSearchParams(location.search).get('from');
      if(from) {
        try {
          const url=new URL(from,location.origin);
          if(url.origin===location.origin && url.pathname==='/ariketak/') {
            const backLink=document.querySelector('.ad-breadcrumb a');
            if(backLink)backLink.href=url.pathname+url.search;
          }
        } catch { /* Ignore invalid external destinations. */ }
      }
    } catch (err) {
      console.warn('ADITZAK catalog query failed', err?.code || 'network');
      status('Ezin dira jarduerak irakurri. Egiaztatu konexioa eta berriro kargatu.', true);
    }
  }

  function renderCatalog() {
    const root = $('catalog');
    root.replaceChildren();
    const level = $('levelFilter').value;
    const all = state.activities.filter((a) => level === 'all' || languageLevel(a) === level);
    const approved = all.filter((a) => !isDraft(a));
    const pilot = all.filter(isPilot);
    status(all.length ? all.length+' jarduera eskuragarri' : 'Ez duzu jarduera eskuragarririk.');
    for (const a of all) {
      const items = state.items.filter((i) => i.activity_version_id === a.id);
      const button = node('button', null, 'ad-card');
      button.type = 'button';
      const badge = node('span','Jarduera eskuragarri','ad-badge');
      const n = state.progress.get(a.id) || 0;
      const tail = n ? ' · ' + n + ' saiakera' : '';
      button.append(badge, node('strong', titleOf(a)),
        node('small', languageLevel(a) + ' · ' + items.length + ' galdera' + tail));
      button.addEventListener('click', () => showActivity(a));
      root.append(button);
    }
  }


  // Findings are authored by the tester; they do not constitute a signed
  // editorial review or an official academic approval.
  function showActivity(a) {
    state.current = a;
    document.body.classList.add('is-practicing');
    document.querySelector('.skip').href = '#activityTitle';
    $('activityTitle').setAttribute('aria-level', '1');
    state.answers = new Map();
    state.attemptId = null;
    $('gradeSummary').hidden = true;
    $('gradeSummary').replaceChildren();
    $('gradeAgain').hidden = true;
    $('newAttempt').hidden = true;
    $('activityPanel').hidden = false;
    $('catalog').hidden = true;
    $('levelFilter').disabled = true;
    $('activityTitle').textContent = titleOf(a);
    $('activityInstruction').textContent = a.prompt_json?.instruction_eu || '';
    const activityItems = state.items.filter(i => i.activity_version_id === a.id);
    $('activityMeta').textContent = languageLevel(a) + ' · ' + (/^(?:DRAFT-)?SIN-/i.test(a.code) ? 'Sintaxia' : 'Aditzak') + ' · ' + activityItems.length + ' galdera';
    // E09 cloze tasks need the full text in addition to the four atomic prompts.
    const fullContext = typeof a.prompt_json?.context_eu === 'string'
      ? a.prompt_json.context_eu.trim() : '';
    $('activityContextText').textContent = fullContext;
    $('activityContext').hidden = !fullContext;
    const badge = $('activityBadge');
    badge.textContent = 'Jarduera eskuragarri';
    badge.className = 'ad-badge';
    const list = $('items');
    list.replaceChildren();
    for (const item of state.items.filter((i) => i.activity_version_id === a.id)) {
      const card = node('div', null, 'ad-item');
      card.dataset.position=String(item.position);
      card.id='ad-item-'+item.position;
      card.tabIndex=-1;
      card.setAttribute('aria-label', item.position + '. galdera');
      const number = node('span', item.position + '. galdera', 'ad-item-number');
      const label = node('label', item.prompt_eu);
      const fieldId = 'ad-answer-' + item.id;
      label.htmlFor = fieldId;
      card.append(number, label);
      if (item.response_kind === 'single_choice' && Array.isArray(item.public_payload?.choices)) {
        const group = node('div', null, 'ad-options');
        group.setAttribute('role', 'radiogroup');
        group.setAttribute('aria-label', item.prompt_eu);
        mixedOptions(item.public_payload.choices).forEach((choice, index) => {
          const option = node('label', null, 'ad-option');
          const input = node('input');
          input.type = 'radio';
          input.name = fieldId;
          input.value = String(choice);
          input.id = fieldId + '-' + index;
          input.addEventListener('change', () => state.answers.set(item.id, { option: input.value }));
          option.append(input, node('span', choice));
          group.append(option);
        });
        card.append(group);
      } else if (item.response_kind === 'oral_recording') {
        card.append(node('p','Ahozko jarduera: oraingoz ez da audiorik grabatzen. Nahi baduzu, gehitu zeure transkripzioa edo saioaren laburpena. Ezingo da ahoskera edo jariotasuna neurtu.','ad-footnote'));
        const input=node('textarea',null,'ad-answer');
        input.id=fieldId;input.rows=4;input.maxLength=3000;
        input.placeholder='Zure ahozko ekoizpenaren transkripzioa edo hausnarketa…';
        input.addEventListener('input',()=>{
          if(input.value.trim())state.answers.set(item.id,{text:input.value,evidence:'self_transcription_without_audio'});
          else state.answers.delete(item.id);
        });
        card.append(input);
      } else {
        const shortAnswer = (item.mechanism_code || a.prompt_json?.mechanism_code) === 'E02';
        const input = node(shortAnswer ? 'input' : 'textarea', null, 'ad-answer' + (shortAnswer ? ' ad-answer--short' : ''));
        input.id = fieldId;
        if (shortAnswer) { input.type = 'text'; input.autocomplete = 'off'; input.spellcheck = false; }
        else input.rows = item.response_kind === 'open_writing' ? 6 : 3;
        input.maxLength = item.response_kind === 'open_writing' ? 5000 : 2000;
        input.placeholder = item.response_kind === 'open_writing' ? 'Idatzi hemen zure testua…' : 'Idatzi zure erantzuna…';
        input.addEventListener('input', () => {
          const value = input.value.trim();
          if (value) state.answers.set(item.id, { text: input.value });
          else state.answers.delete(item.id);
        });
        card.append(input);
      }
      list.append(card);
    }
    const save = $('saveResponses');
    save.hidden = !canSubmit(a);
    save.disabled = !canSubmit(a);
    save.textContent='Erantzunak gorde eta zuzendu';
    saveNotice(isPilot(a)
      ? 'Erantzunak gordeko dira. Ariketa objektiboek zuzen/oker emaitza jaso dezakete; gainerakoetan, erreferentziak eta berrikuspena ikusiko dituzu.'
      : 'Jatorrizko erantzunak gordeko dira; soilik egiaztatutako gakoak zuzenduko dira.');
    renderQuestionNav();
    updateAnswerProgress();
    $('activityTitle').tabIndex = -1;
    $('activityTitle').focus({preventScroll:true});
    $('activityPanel').scrollIntoView({ behavior: 'auto', block: 'start' });
  }

  function back() {
    // Keep the exercise inside the originating unit/catalog navigation.
    const from = new URLSearchParams(location.search).get('from');
    if (from) {
      try {
        const url=new URL(from,location.origin);
        if (url.origin===location.origin && url.pathname==='/ariketak/') {
          location.assign(url.pathname+url.search);
          return;
        }
      } catch { /* Invalid external destination: use the local catalog. */ }
    }
    state.current = null;
    document.body.classList.remove('is-practicing');
    document.querySelector('.skip').href = '#pageTitle';
    state.answers.clear();
    state.attemptId = null;
    $('activityPanel').hidden = true;
    $('catalog').hidden = false;
    $('levelFilter').disabled = false;
    renderCatalog();
    $('adStatus').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const outcomeText = {
    correct:'Zuzena', incorrect:'Okerra',
    needs_review:'Berrikusteko', not_scored:'Berrikusteko', partial:'Partziala'
  };
  function renderFeedback(payload) {
    const area=$('gradeSummary');
    area.replaceChildren();
    if (!payload || !payload.summary || !Array.isArray(payload.results)) {
      throw new Error('Bad grade payload');
    }
    const s=payload.summary;
    const correct=Number(s.correct)||0;
    const incorrect=Number(s.incorrect)||0;
    const review=Number(s.needs_review)||0;
    const answered=Number(s.answered)||0;
    const pilot=!!payload.pilot;
    area.append(node('h3','Ariketaren emaitza','ad-grade-heading'));
    area.append(node('p',
      correct+' zuzen · '+incorrect+' oker'+
      ' ('+answered+' erantzun)',
      'ad-grade-count'));

    area.hidden=false;

    for(const result of payload.results) {
      const card=[...$('items').children]
        .find(el=>el.dataset.position===String(result.position));
      if(!card)continue;
      card.querySelector('.ad-item-result')?.remove();
      const outcome=outcomeText[result.outcome]?result.outcome:'needs_review';
      const feedback=node('div',null,'ad-item-result ad-item-result--'+outcome);
      const mark=outcome==='correct'?'✓ ':outcome==='incorrect'?'✕ ':'';
      const label=outcomeText[outcome]||'Berrikusteko';
      if(['correct','incorrect','partial'].includes(outcome)) feedback.append(node('strong',mark+label));
      if(['correct','incorrect','partial'].includes(outcome) && result.feedback_eu) feedback.append(node('p',result.feedback_eu));
      const item=state.items.find(i=>
        i.activity_version_id===state.current.id && i.position===result.position);
      const raw=item&&state.answers.get(item.id);
      if(raw)feedback.append(node('p','Zure erantzuna: '+(raw.option||raw.text||''),'ad-student-answer'));
      card.classList.remove('ad-item--correct','ad-item--incorrect','ad-item--needs_review');
      if(['correct','incorrect','needs_review'].includes(outcome))
        card.classList.add('ad-item--'+outcome);

      const details=result.details||{};
      const alternatives=pilot&&Array.isArray(details.pilot_accepted_answers_eu)
        ? [...new Set(details.pilot_accepted_answers_eu.filter(s=>typeof s==='string'&&s.trim()))]
        : [];
      if(alternatives.length){
        feedback.append(node('p',
          'Erantzun-eredu'+(alternatives.length>1?'ak':'a')+': '+alternatives.join(' · '),
          'ad-item-solution'));
      }else if(pilot&&details.pilot_reference_answer_eu){
        feedback.append(node('p','Erantzun-eredua: '+details.pilot_reference_answer_eu,
          'ad-item-solution'));
      }
      if(!pilot&&['correct','incorrect'].includes(outcome)&&details.accepted_answer_eu){
        feedback.append(node('p','Erantzun zuzena: '+details.accepted_answer_eu,
          'ad-item-solution'));
      }
      if(details.explanation_eu)
        feedback.append(node('p',details.explanation_eu,'ad-item-explanation'));
      card.append(feedback);
    }
  }

  async function gradeAttempt() {
    if(!state.attemptId || !state.client)return;
    const pilot=isPilot(state.current);
    const result=await state.client.rpc(
      pilot?'smx_aditzak_pilot_review_attempt':'smx_grade_attempt',
      {p_attempt_id:state.attemptId});
    if(result.error)throw result.error;
    renderFeedback(result.data);
    $('gradeAgain').hidden=true;
    saveNotice(isPilot(state.current)
      ? 'Erantzunak gordeta eta zuzenketa eskuragarri. Berrikusteko kasuetan, ikusi ereduak eta bidali iradokizunak.'
      : 'Erantzunak eta ebaluazioaren bertsioa gordeta. Zure saiakera historialean geratuko da.');
  }

  async function retryGrade() {
    const btn=$('gradeAgain');btn.disabled=true;
    saveNotice('Emaitzak zerbitzaritik eskuratzen…');
    try {await gradeAttempt();}
    catch(err) {
      console.warn('ADITZAK grade retry unavailable',err?.code||'network');
      saveNotice('Erantzunak gordeta daude; ezin izan da zuzenketa eskuratu. Saiatu berriro.',true);
    } finally {btn.disabled=false;}
  }

  async function save() {
    if (state.saving || !canSubmit(state.current)) return;
    const current = state.current;
    const selected = state.items.filter((item) => item.activity_version_id === current.id && state.answers.has(item.id));
    if (!selected.length) { saveNotice('Gutxienez erantzun bat idatzi behar duzu.', true); return; }
    state.saving = true;
    const button = $('saveResponses');
    button.disabled = true;
    saveNotice('Erantzunak zerbitzarian gordetzen…');
    try {
      if (!state.attemptId) {
        const result = await state.client.from('smx_attempts').insert({
          user_id: cloud.user().id,
          activity_version_id: current.id,
          response_json: { schema: 'smx_itemized_v1', modality: 'aditzak',
            pilot: isPilot(current)?'aditzak_beta_v1':null,item_count: selected.length },
          hints_used: 0
        }).select('id').single();
        if (result.error) throw result.error;
        state.attemptId = result.data.id;
      }
      const existing = check(await state.client.from('smx_attempt_responses')
        .select('item_id').eq('attempt_id', state.attemptId));
      const already = new Set(existing.map((r) => r.item_id));
      const missing = selected.filter((i) => !already.has(i.id));
      if (missing.length) {
        const rows = missing.map((item) => ({
          attempt_id: state.attemptId,
          activity_version_id: current.id,
          item_id: item.id,
          client_event_id: crypto.randomUUID(),
          attempt_no: 1,
          raw_response: state.answers.get(item.id),
          hints_used: 0
        }));
        const result = await state.client.from('smx_attempt_responses').insert(rows);
        if (result.error) throw result.error;
      }
      const after = check(await state.client.from('smx_attempt_responses')
        .select('item_id').eq('attempt_id', state.attemptId));
      const saved = new Set(after.map((r) => r.item_id));
      if (!selected.every((i) => saved.has(i.id))) throw new Error('Ezin izan da erantzun bakoitza egiaztatu.');
      // Original answers have been read back and confirmed before requesting evaluation.
      button.hidden = true;
      $('newAttempt').hidden = false;
      for (const el of $('items').querySelectorAll('input,textarea')) {
        if(!el.closest('.ad-finding'))el.disabled=true;
      }
      saveNotice('Gordeta: ' + selected.length + ' erantzun. Zuzenketa eskatzen…');
      await loadProgress();
      try { await gradeAttempt(); }
      catch(err) {
        // Persistence was successful: do NOT present this as a failed save.
        console.warn('ADITZAK server grading unavailable',err?.code || 'network');
        $('gradeAgain').hidden=false;
        saveNotice('Erantzunak gordeta. Zuzenketa ez dago eskuragarri; berreskuratu emaitzak berriz saiatzeko.',true);
      }
    } catch (err) {
      console.warn('ADITZAK response storage failed', err?.code || 'network');
      saveNotice('Ezin izan da gordetzea baieztatu. Ez itxi orria; saiatu berriro. (' + (err?.code || 'konexioa') + ')', true);
      button.disabled = false;
    } finally {
      state.saving = false;
    }
  }

  function renderQuestionNav() {
    const root=$('questionNav');
    root.replaceChildren();
    for (const item of state.items.filter(i=>i.activity_version_id===state.current.id)) {
      const button=node('button',item.position,'ad-question-link');
      button.type='button';
      button.dataset.itemId=item.id;
      button.dataset.position=String(item.position);
      button.addEventListener('click',()=>{
        const target=$('ad-item-'+item.position);
        target.focus({preventScroll:true});
        target.scrollIntoView({behavior:'auto',block:'start'});
        markCurrentQuestion(String(item.position));
      });
      root.append(button);
    }
  }
  function markCurrentQuestion(position) {
    for (const button of $('questionNav').children) {
      if (button.dataset.position===position) button.setAttribute('aria-current','location');
      else button.removeAttribute('aria-current');
    }
  }
  function updateAnswerProgress() {
    if (!state.current) return;
    const total = state.items.filter(i => i.activity_version_id === state.current.id).length;
    $('answerProgress').max = total || 1;
    $('answerProgress').value = state.answers.size;
    $('answerProgressLabel').textContent = state.answers.size + ' / ' + total + ' erantzunda';
    for (const button of $('questionNav').children) {
      const answered=state.answers.has(button.dataset.itemId);
      button.classList.toggle('is-answered',answered);
      button.setAttribute('aria-label',button.dataset.position+'. galdera, '+(answered?'erantzunda':'erantzun gabe'));
    }
  }
  $('items').addEventListener('focusin',event=>{
    const card=event.target.closest('.ad-item');
    if (card) markCurrentQuestion(card.dataset.position);
  });
  $('jumpToActions').addEventListener('click',()=>{
    $('activityActions').focus({preventScroll:true});
    $('activityActions').scrollIntoView({behavior:'auto',block:'center'});
  });
  $('items').addEventListener('input', updateAnswerProgress);
  $('items').addEventListener('change', updateAnswerProgress);
  $('gradeAgain').addEventListener('click',retryGrade);
  $('newAttempt').addEventListener('click',()=>{
    if(canSubmit(state.current))showActivity(state.current);
  });
  $('backToCatalog').addEventListener('click', back);
  $('saveResponses').addEventListener('click', save);
  $('levelFilter').addEventListener('change', renderCatalog);
  load().catch((err) => status('Aplikazioa ezin izan da abiarazi.', true));
})();
