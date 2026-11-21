/* SUSTRAI ADITZAK. Read only RLS-visible versions; answers never enter client data.
   Drafts are visible only under the server-side sr_is_admin() RLS policy. */
(() => {
  'use strict';
  const prefix = /^(?:DRAFT-)?ADI-/i;
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

    status('Supabasetik jarduerak irakurtzen…');
    try {
      // Gate 1: Only ADITZAK codes. Gate 2: RLS returns only approved / admin draft versions.
      const activities = check(await state.client.from('smx_activities')
        .select('id,code,kind')
        .or('code.ilike.ADI-%,code.ilike.DRAFT-ADI-%')
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
        .select('activity_version_id').eq('active', true).limit(100));
      state.pilotVersions = new Set(releaseRows.map(x=>x.activity_version_id));
      const ids = activities.map((a) => a.id);
      const versions = check(await state.client.from('smx_activity_versions')
        .select('id,activity_id,revision,prompt_json,status,linguistic_ok,factual_ok,pedagogical_ok,traceability_ok')
        .in('activity_id', ids)
        .order('revision', { ascending: false })
        .limit(1000));
      const visible = [];
      for (const a of activities) {
        const version = versions.find((v) => v.activity_id === a.id);
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
        if(selected) showActivity(selected);
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
    const draft = all.filter(a => isDraft(a) && !isPilot(a));
    status(all.length
      ? approved.length+' egiaztatutako jarduera · '+pilot.length+' probetan'
        +(draft.length?' · '+draft.length+' barne-zirriborro':'')
      : 'Ez duzu argitaratutako edo baimendutako jarduerarik.');
    for (const a of all) {
      const items = state.items.filter((i) => i.activity_version_id === a.id);
      const button = node('button', null, 'ad-card');
      button.type = 'button';
      const badge = node('span', isPilot(a)?'PROBA · Ez egiaztatua':isDraft(a)?'Barne-zirriborroa':'Argitaratua',
        'ad-badge' + (isDraft(a) ? ' draft' : ''));
      const n = state.progress.get(a.id) || 0;
      const tail = n ? ' · ' + n + ' saiakera' : '';
      button.append(badge, node('strong', titleOf(a)),
        node('small', languageLevel(a) + ' · ' + items.length + ' item · ' + (a.prompt_json?.mechanism_code || a.kind) + tail));
      button.addEventListener('click', () => showActivity(a));
      root.append(button);
    }
  }


  // Findings are authored by the tester; they do not constitute a signed
  // editorial review or an official academic approval.
  function appendFindingForm(card, a, item) {
    const details=node('details',null,'ad-finding');
    details.append(node('summary','Ohartarazi zalantza edo akatsa'));
    const form=node('form',null,'ad-finding-form');
    const categories=[
      ['arau_akatsa','Arau-akatsa'],['aldaera_onargarria','Aldaera onargarria'],
      ['erantzun_proposatua','Beste erantzun bat'],['azalpena','Azalpena'],
      ['zailtasuna','Zailtasuna'],['erabilgarritasuna','Erabilgarritasuna'],
      ['teknikoa','Arazo teknikoa'],['bestelakoa','Bestelakoa']
    ];
    const category=node('select');category.required=true;
    category.setAttribute('aria-label',item.position+'. galderako oharraren mota');
    for(const [value,label] of categories){const option=node('option',label);option.value=value;category.append(option);}
    const priority=node('select');priority.setAttribute('aria-label','Larritasuna');
    for(const [value,label] of [['normal','Arrunta'],['high','Garrantzitsua'],['blocking','Larria'],['low','Arina']]){
      const option=node('option',label);option.value=value;priority.append(option);
    }
    const comment=node('textarea',null,'ad-finding-input');
    comment.required=true;comment.maxLength=3000;comment.minLength=5;comment.rows=3;
    comment.placeholder='Zein da arazoa? Nola konponduko zenuke?';
    comment.setAttribute('aria-label','Auditoretzako oharra');
    const send=node('button','Oharra bidali','ad-button');
    send.type='submit';
    const message=node('p',null,'ad-finding-status');message.setAttribute('role','status');
    form.append(category,priority,comment,send,message);
    form.addEventListener('submit',async(event)=>{
      event.preventDefault();
      if(!form.reportValidity())return;
      send.disabled=true;message.textContent='Oharra gordetzen…';
      try{
        const {error}=await state.client.from('smx_aditzak_pilot_findings').insert({
          activity_version_id:a.id,item_id:item.id,
          attempt_id:state.attemptId||null,
          category:category.value,priority:priority.value,comment_eu:comment.value.trim()
        });
        if(error)throw error;
        message.textContent='Jasota: zure oharra auditoretzarako gorde da.';
        comment.value='';
      }catch(err){
        console.warn('Pilot finding error',err?.code||'network');
        message.textContent='Ez da oharra gorde. Saiatu berriro.';
      }finally{send.disabled=false;}
    });
    details.append(form);card.append(details);
  }

  function showActivity(a) {
    state.current = a;
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
    // E09 cloze tasks need the full text in addition to the four atomic prompts.
    const fullContext = typeof a.prompt_json?.context_eu === 'string'
      ? a.prompt_json.context_eu.trim() : '';
    $('activityContextText').textContent = fullContext;
    $('activityContext').hidden = !fullContext;
    const badge = $('activityBadge');
    badge.textContent = isPilot(a) ? 'PROBA KONTROLATUA · EZ EGIAZTATUA'
      : isDraft(a) ? 'Zirriborroa · aurrebista' : 'Argitaratua';
    badge.className = 'ad-badge' + (isDraft(a) ? ' draft' : '');
    $('adPilotWarning').hidden = !isPilot(a);
    const list = $('items');
    list.replaceChildren();
    for (const item of state.items.filter((i) => i.activity_version_id === a.id)) {
      const card = node('div', null, 'ad-item');
      card.dataset.position=String(item.position);
      const number = node('span', item.position + '. item', 'ad-item-number');
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
        const input = node('textarea', null, 'ad-answer');
        input.id = fieldId;
        input.rows = item.response_kind === 'open_writing' ? 6 : 2;
        input.maxLength = item.response_kind === 'open_writing' ? 5000 : 2000;
        input.placeholder = item.response_kind === 'open_writing' ? 'Idatzi hemen zure testua…' : 'Idatzi zure erantzuna…';
        input.addEventListener('input', () => {
          const value = input.value.trim();
          if (value) state.answers.set(item.id, { text: input.value });
          else state.answers.delete(item.id);
        });
        card.append(input);
      }
      if(isPilot(a)) appendFindingForm(card,a,item);
      list.append(card);
    }
    const save = $('saveResponses');
    save.hidden = !canSubmit(a);
    save.disabled = !canSubmit(a);
    saveNotice(isPilot(a)
      ? 'PROBA: erantzunak gordeko dira. Ondoren behin-behineko gakoen proposamenak ikusiko dituzu, notarik gabe. Bidali oharrak galderaz galdera.'
      : isDraft(a)
      ? 'Barne-aurrebista: ezin da erantzunik gorde.'
      : 'Jatorrizko erantzunak gordeko dira; soilik egiaztatutako gakoak zuzenduko dira.');
    $('activityPanel').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    state.answers.clear();
    state.attemptId = null;
    $('activityPanel').hidden = true;
    $('catalog').hidden = false;
    $('levelFilter').disabled = false;
    renderCatalog();
    $('adStatus').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const outcomeText = { correct:'Zuzena', incorrect:'Berrikusteko', needs_review:'Irakaslearen berrikuspenaren zain', not_scored:'Ebaluatu gabe',partial:'Partziala' };
  function renderFeedback(payload) {
    const area=$('gradeSummary');
    area.replaceChildren();
    if (!payload || !payload.summary || !Array.isArray(payload.results)) {
      throw new Error('Bad grade payload');
    }
    const s=payload.summary;
    const n=(s.correct || 0)+(s.incorrect || 0);
    area.append(node('h3',payload.pilot?'Probaren berrikuspena':'Ariketaren emaitza','ad-grade-heading'));
    const title=payload.pilot
      ? s.answered+' erantzun gordeta · ez da kalifikaziorik eman'
      : n ? s.correct+' / '+n+' erantzun objektibo zuzen'
      : 'Erantzunak jasota, baina zuzenketa automatiko baliozkorik ez';
    area.append(node('p',title,'ad-grade-count'));
    if(s.needs_review)area.append(node('p',s.needs_review + ' erantzun irakaslearen berrikuspenaren zain.','ad-grade-detail'));
    area.append(node('p',payload.pilot
      ? 'Erantzun-ereduak eta azalpenak behin-behineko proposamenak dira. Erabili galdera bakoitzeko oharrak haiek auditatzeko.'
      : 'Barne-praktikako emaitza orientagarria da, ez azterketa ofizialaren nota.','ad-grade-detail'));
    area.hidden=false;
    for(const result of payload.results) {
      const card=[...$('items').children].find(el=>el.dataset.position===String(result.position));
      if(!card)continue;
      card.querySelector('.ad-item-result')?.remove();
      const feedback=node('div',null,'ad-item-result ad-item-result--'+(outcomeText[result.outcome] ? result.outcome:'needs_review'));
      const title=node('strong',outcomeText[result.outcome] || 'Berrikuspenaren zain');
      const msg=node('p',result.feedback_eu || 'Erantzuna gordeta.');
      feedback.append(title,msg);
      const details=result.details || {};
      if(payload.pilot && details.pilot_reference_answer_eu) {
        feedback.append(node('p','PROPOSAMENA (ez egiaztatua): '+details.pilot_reference_answer_eu,'ad-item-solution'));
      }
      if(result.outcome==='incorrect' && details.accepted_answer_eu) {
        feedback.append(node('p','Gako egiaztatuko aukera: '+details.accepted_answer_eu,'ad-item-solution'));
      }
      if(details.explanation_eu)feedback.append(node('p',details.explanation_eu,'ad-item-explanation'));
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
      ? 'Zure erantzunak gordeta. Ereduak behin-behinekoak dira: adierazi zalantzak auditoretzako oharren bidez.'
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

  $('gradeAgain').addEventListener('click',retryGrade);
  $('newAttempt').addEventListener('click',()=>{
    if(canSubmit(state.current))showActivity(state.current);
  });
  $('backToCatalog').addEventListener('click', back);
  $('saveResponses').addEventListener('click', save);
  $('levelFilter').addEventListener('change', renderCatalog);
  load().catch((err) => status('Aplikazioa ezin izan da abiarazi.', true));
})();
