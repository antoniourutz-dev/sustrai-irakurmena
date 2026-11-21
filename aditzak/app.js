/* SUSTRAI ADITZAK. Read only RLS-visible versions; answers never enter client data.
   Drafts are visible only under the server-side sr_is_admin() RLS policy. */
(() => {
  'use strict';
  const prefix = /^(?:DRAFT-)?ADI-/i;
  const cloud = window.SustraiCloud;
  const $ = (id) => document.getElementById(id);
  const state = { client: null, activities: [], items: [], current: null, answers: new Map(), attemptId: null, saving: false };
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
  const languageLevel = (a) => a.prompt_json?.target_level || '—';
  const titleOf = (a) => a.prompt_json?.title_eu || 'Jarduera';
  const isDraft = (a) => a.status !== 'approved';

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
    const draft = all.filter(isDraft);
    status(all.length
      ? approved.length + ' jarduera argitaratu' + (draft.length ? ' · ' + draft.length + ' berrikusteko (administratzaileak bakarrik)' : '')
      : 'Oraindik ez dago jarduera argitaraturik. Edukiak berrikusten ari gara.');
    for (const a of all) {
      const items = state.items.filter((i) => i.activity_version_id === a.id);
      const button = node('button', null, 'ad-card');
      button.type = 'button';
      const badge = node('span', isDraft(a) ? 'Berrikusteko · barne-pilotua' : 'Argitaratua', 'ad-badge' + (isDraft(a) ? ' draft' : ''));
      button.append(badge, node('strong', titleOf(a)), node('small', languageLevel(a) + ' · ' + items.length + ' item · ' + (a.prompt_json?.mechanism_code || a.kind)));
      button.addEventListener('click', () => showActivity(a));
      root.append(button);
    }
  }

  function showActivity(a) {
    state.current = a;
    state.answers = new Map();
    state.attemptId = null;
    $('activityPanel').hidden = false;
    $('catalog').hidden = true;
    $('levelFilter').disabled = true;
    $('activityTitle').textContent = titleOf(a);
    $('activityInstruction').textContent = a.prompt_json?.instruction_eu || '';
    const badge = $('activityBadge');
    badge.textContent = isDraft(a) ? 'Zirriborroa · aurrebista' : 'Argitaratua';
    badge.className = 'ad-badge' + (isDraft(a) ? ' draft' : '');
    const list = $('items');
    list.replaceChildren();
    for (const item of state.items.filter((i) => i.activity_version_id === a.id)) {
      const card = node('div', null, 'ad-item');
      const number = node('span', item.position + '. item', 'ad-item-number');
      const label = node('label', item.prompt_eu);
      const fieldId = 'ad-answer-' + item.id;
      label.htmlFor = fieldId;
      card.append(number, label);
      if (item.response_kind === 'single_choice' && Array.isArray(item.public_payload?.choices)) {
        const group = node('div', null, 'ad-options');
        group.setAttribute('role', 'radiogroup');
        group.setAttribute('aria-label', item.prompt_eu);
        item.public_payload.choices.forEach((choice, index) => {
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
        card.append(node('p', 'Ahozko jarduera: irakurri proposamena eta egin ariketa ahoz. Grabaketa ez da zerbitzarira bidaliko.', 'ad-footnote'));
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
      list.append(card);
    }
    const save = $('saveResponses');
    save.hidden = isDraft(a);
    save.disabled = isDraft(a);
    saveNotice(isDraft(a)
      ? 'Berrikuspen-aurrebista: erantzunak ez dira gordeko, eta soluzioak ez dira erakusten.'
      : 'Zure jatorrizko erantzunak gordeko dira. Zuzenketa automatikoa ez dago oraindik gaituta.');
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
    $('adStatus').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  async function save() {
    if (state.saving || !state.current || isDraft(state.current)) return;
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
          response_json: { schema: 'smx_itemized_v1', modality: 'aditzak', item_count: selected.length },
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
      button.hidden = true;
      for (const el of $('items').querySelectorAll('input,textarea')) el.disabled = true;
      saveNotice('Gordeta: ' + selected.length + ' erantzun. Ez da puntuaziorik eman; zuzenketa akademikoa egiteke.');
    } catch (err) {
      console.warn('ADITZAK response storage failed', err?.code || 'network');
      saveNotice('Ezin izan da gordetzea baieztatu. Ez itxi orria; saiatu berriro. (' + (err?.code || 'konexioa') + ')', true);
      button.disabled = false;
    } finally {
      state.saving = false;
    }
  }

  $('backToCatalog').addEventListener('click', back);
  $('saveResponses').addEventListener('click', save);
  $('levelFilter').addEventListener('change', renderCatalog);
  load().catch((err) => status('Aplikazioa ezin izan da abiarazi.', true));
})();
