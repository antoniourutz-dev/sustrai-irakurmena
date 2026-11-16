/* SUSTRAI: administration client. Authorization enforced by Supabase RLS and admin RPCs. */
'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const kit = () => window.SustraiAccountKit;
  const s = { client: null, users: [], contents: [], rules: [], grants: [], selected: null, kind: 'reading', works: [], results: [], filter: 'all' };
  const status = (message) => { $('status').textContent = message; };
  const el = (tag, text, cls) => {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = String(text);
    if (cls) n.className = cls;
    return n;
  };
  const empty = (target, message) => { target.replaceChildren(el('p', message, 'subtle')); };

  async function fetchList(table, fields) {
    const { data, error } = await s.client.from(table).select(fields).limit(1500);
    if (error) throw error;
    return data || [];
  }

  async function load() {
    status('Ikasleak eta edukiak kargatzen…');
    const [students, exams, writings, orals, rules, grants] = await Promise.all([
      s.client.rpc('sr_admin_students'),
      fetchList('sr_exams', 'id,slug,title,publication_status'),
      fetchList('sr_writing_prompts', 'id,slug,title_eu,exam_reference,publication_status'),
      fetchList('sr_speaking_prompts', 'id,slug,title_eu,exam_reference,publication_status'),
      fetchList('sr_app_content_rules', 'kind,resource_id,guest_visible,member_visible'),
      fetchList('sr_app_grants', 'user_id,kind,resource_id,allowed')
    ]);
    if (students.error) throw students.error;
    if (!Array.isArray(students.data)) throw new Error('Administratzaile-baimenik ez.');
    s.users = students.data;
    s.contents = [
      ...exams.filter((e) => e.publication_status === 'published').map((e) => ({ kind: 'reading', id: e.id, label: e.title || e.slug, info: e.slug, slug: e.slug })),
      ...writings.filter((e) => e.publication_status === 'published').map((e) => ({ kind: 'writing', id: e.id, label: e.title_eu || e.slug, info: e.exam_reference || e.slug, slug: e.slug })),
      ...orals.filter((e) => e.publication_status === 'published').map((e) => ({ kind: 'speaking', id: e.id, label: e.title_eu || e.slug, info: e.exam_reference || e.slug, slug: e.slug }))
    ];
    s.rules = rules;
    s.grants = grants;
    if (s.selected && !s.users.some((u) => u.id === s.selected)) s.selected = null;
    render();
    if (s.selected) await loadStudent(s.selected);
    status('Kargatuta · ' + s.users.length + ' ikasle · ' + s.contents.length + ' eduki');
  }

  function renderStats() {
    const total = s.users.length;
    const active = s.users.filter((u) => u.active).length;
    const work = s.users.reduce((a, u) => a + Number(u.savedItems || 0), 0);
    const attempts = s.users.reduce((a, u) => a + Number(u.readingAttempts || 0), 0);
    const scored = s.users.filter((u) => u.averageReadingScore != null);
    const avg = scored.length
      ? Math.round(scored.reduce((a, u) => a + Number(u.averageReadingScore), 0) / scored.length)
      : null;
    const data = [
      ['Ikasleak', total],
      ['Kontu aktiboak', active],
      ['Gordetako elementuak', work],
      ['Irakurmen-saiakerak', attempts],
      ['Batez besteko puntuazioa', avg == null ? '—' : avg]
    ];
    $('stats').replaceChildren(...data.map(([label, value]) => {
      const box = el('div', undefined, 'stat');
      box.append(el('strong', value), el('span', label));
      return box;
    }));
  }

  function renderStudents() {
    const search = $('studentSearch').value.toLocaleLowerCase('eu');
    const list = $('students');
    list.replaceChildren();
    const rows = s.users.filter((u) => (String(u.email) + ' ' + String(u.name)).toLocaleLowerCase('eu').includes(search));
    if (!rows.length) return empty(list, 'Ez dago ikaslerik iragazki honekin.');
    for (const u of rows) {
      const btn = el('button', undefined, 'student' + (s.selected === u.id ? ' active' : ''));
      btn.type = 'button';
      const avg = u.averageReadingScore != null ? ' · batez bestekoa ' + u.averageReadingScore : '';
      btn.append(
        el('strong', u.name || u.email),
        el('small', u.email),
        el('small', (u.active ? 'Aktibo' : 'Desaktibatuta') + ' · ' + u.savedItems + ' elementu · ' + u.readingAttempts + ' proba' + avg)
      );
      btn.onclick = () => selectStudent(u.id);
      list.append(btn);
    }
  }

  async function selectStudent(id) {
    s.selected = id;
    renderStudents();
    renderContent();
    await loadStudent(id);
  }

  function classifiedWorks() {
    return s.works
      .map((row) => {
        const meta = kit().parseWork(row.storage_key);
        return { row, meta, preview: kit().previewValue(meta, row.value_text) };
      })
      .filter((item) => kit().isMeaningful(item.meta, item.row.value_text));
  }

  function renderPulse(user) {
    const root = $('studentPulse');
    root.hidden = false;
    root.replaceChildren();
    const items = classifiedWorks().filter((x) => x.meta.skill === 'writing' || x.meta.skill === 'speaking').slice(0, 3);
    const pcts = s.results.map((r) => kit().scorePct(r.score, r.max_score)).filter((x) => x != null);
    const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;
    const summary = el('article', undefined, 'continue-item');
    const left = el('div');
    left.append(
      el('span', 'Laburpena', 'tag'),
      el('strong', (user.name || user.email)),
      el('small', s.results.length + ' irakurmen-emaitza' + (avg != null ? ' · batez bestekoa %' + avg : '') + ' · ' + classifiedWorks().length + ' lan erabilgarri')
    );
    summary.append(left);
    root.append(summary);
    for (const item of items) {
      const card = el('article', undefined, 'continue-item');
      const box = el('div');
      box.append(
        el('span', kit().skillLabel(item.meta.skill), 'tag'),
        el('strong', item.meta.label + (item.meta.slug ? ' · ' + item.meta.slug : '')),
        el('small', kit().euDate(item.row.updated_at))
      );
      if (item.preview) box.append(el('span', item.preview, 'preview'));
      card.append(box);
      root.append(card);
    }
  }

  function renderWorks() {
    const root = $('works');
    root.replaceChildren();
    const items = classifiedWorks().filter((x) => s.filter === 'all' || x.meta.skill === s.filter);
    if (!items.length) return empty(root, 'Ez dago oraindik gordetako lan erabilgarririk.');
    for (const item of items) {
      const details = el('details', undefined, 'work-row work-card');
      const summary = el('summary');
      summary.textContent = item.meta.label + (item.meta.slug ? ' · ' + item.meta.slug : '') + (item.meta.mode ? ' · ' + kit().modeLabel(item.meta.mode) : '');
      details.append(summary, el('small', kit().euDate(item.row.updated_at) + ' · ' + kit().skillLabel(item.meta.skill)));
      if (item.preview) details.append(el('p', item.preview, 'preview'));
      const pre = el('pre');
      try { pre.textContent = JSON.stringify(JSON.parse(item.row.value_text), null, 2); }
      catch { pre.textContent = item.row.value_text; }
      details.append(pre);
      root.append(details);
    }
  }

  function renderResults() {
    const root = $('results');
    root.replaceChildren();
    if (!s.results.length) return empty(root, 'Ez dago erregistratutako irakurmen-emaitzarik.');
    for (const row of s.results) {
      const pct = kit().scorePct(row.score, row.max_score);
      const div = el('div', undefined, 'result-row result-card');
      const left = el('div');
      left.append(
        el('strong', kit().examTitle(row)),
        el('small', kit().euDate(row.created_at) + (kit().resultMode(row) ? ' · ' + kit().resultMode(row) : ''))
      );
      const right = el('span', (pct != null ? '%' + pct + ' · ' : '') + row.score + ' / ' + row.max_score + ' · ' + row.correct + '/' + row.total, 'score-pill' + (pct != null && pct < 60 ? ' low' : ''));
      div.append(left, right);
      root.append(div);
    }
  }

  async function loadStudent(id) {
    const user = s.users.find((u) => u.id === id);
    if (!user) return;
    $('studentTitle').textContent = user.name || user.email;
    $('studentSummary').textContent = user.email + ' · ' + (user.active ? 'Kontu aktiboa' : 'Kontua desaktibatuta') +
      ' · ' + user.savedItems + ' lan-elementu · ' + user.readingAttempts + ' irakurmen-saiakera' +
      (user.averageReadingScore != null ? ' · batez bestekoa ' + user.averageReadingScore : '');
    $('userActive').hidden = false;
    $('userActive').textContent = user.active ? 'Desaktibatu kontua' : 'Aktibatu kontua';
    empty($('works'), 'Kargatzen…');
    empty($('results'), 'Kargatzen…');
    try {
      const [a, b] = await Promise.all([
        s.client.from('sr_app_state').select('storage_key,value_text,updated_at').eq('user_id', id).order('updated_at', { ascending: false }).limit(500),
        s.client.from('sr_app_reading_results').select('score,max_score,correct,total,created_at,elapsed_seconds,response_summary,exam_id,sr_exams(slug,title)').eq('user_id', id).order('created_at', { ascending: false }).limit(100)
      ]);
      if (a.error) throw a.error;
      if (b.error) throw b.error;
      if (s.selected !== id) return;
      s.works = a.data || [];
      s.results = b.data || [];
      renderPulse(user);
      renderWorks();
      renderResults();
    } catch (err) {
      status('Ikaslearen datuak ezin izan dira irakurri: ' + (err.message || 'errorea'));
    }
  }

  /* ---------- Material manager ----------
     A content item has one state for everybody: public (guests and accounts), members (accounts
     only) or hidden. "No rule" means public, so publishing removes the rule. */
  const STATES = [['public', 'Publikoa'], ['members', 'Kontuak soilik'], ['hidden', 'Ezkutuan']];
  const picked = new Set();

  function stateOf(item) {
    const rule = s.rules.find((x) => x.kind === item.kind && x.resource_id === item.id);
    if (!rule || (rule.guest_visible !== false && rule.member_visible !== false)) return 'public';
    if (rule.member_visible === false) return rule.guest_visible === false ? 'hidden' : 'guests';
    return 'members';
  }
  const organismOf = (item) => (/^(ivap|habe)-/i.exec(item.slug || '') || [])[1]?.toUpperCase() || 'SUSTRAI';
  const KIND_LABEL = { reading: 'Irakurmena', writing: 'Idazmena', speaking: 'Ahozkoa' };

  function visibleContent() {
    const search = $('contentSearch').value.toLocaleLowerCase('eu').trim();
    const state = $('contentState').value;
    const organism = $('contentOrganism').value;
    return s.contents.filter((x) => x.kind === s.kind &&
      (state === 'all' || stateOf(x) === state) &&
      (organism === 'all' || organismOf(x) === organism) &&
      (!search || (x.label + ' ' + x.info).toLocaleLowerCase('eu').includes(search)));
  }

  async function setState(items, state) {
    if (!items.length) return;
    const kind = items[0].kind;
    const ids = items.map((x) => x.id);
    if (state === 'public') {
      const { error } = await s.client.from('sr_app_content_rules').delete().eq('kind', kind).in('resource_id', ids);
      if (error) throw error;
    } else {
      const now = new Date().toISOString();
      const rows = ids.map((id) => ({ kind, resource_id: id, guest_visible: false, member_visible: state === 'members', updated_at: now }));
      const { data, error } = await s.client.from('sr_app_content_rules').upsert(rows, { onConflict: 'kind,resource_id' }).select('resource_id');
      if (error) throw error;
      if (!data || data.length !== rows.length) throw new Error('Aldaketa batzuk ez dira gorde.');
    }
    // Always re-read: the table is the source of truth for what students can open.
    s.rules = await fetchList('sr_app_content_rules', 'kind,resource_id,guest_visible,member_visible');
  }

  async function setGrant(item, value) {
    if (!s.selected) return;
    if (value === 'default') {
      const { error } = await s.client.from('sr_app_grants').delete().eq('user_id', s.selected).eq('kind', item.kind).eq('resource_id', item.id);
      if (error) throw error;
    } else {
      const { data, error } = await s.client.from('sr_app_grants').upsert({
        user_id: s.selected, kind: item.kind, resource_id: item.id, allowed: value === 'allow', updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,kind,resource_id' }).select('resource_id');
      if (error) throw error;
      if (!data || !data.length) throw new Error('Salbuespena ez da gorde.');
    }
    s.grants = await fetchList('sr_app_grants', 'user_id,kind,resource_id,allowed');
  }

  async function applyState(items, state, question) {
    if (!items.length) return;
    if (question && !confirm(question)) return;
    const root = $('contentManager');
    root.setAttribute('aria-busy', 'true');
    try {
      await setState(items, state);
      status(items.length === 1 ? 'Egoera gordeta.' : items.length + ' eduki eguneratu dira.');
    } catch (err) {
      status('Ezin izan da gorde: ' + (err.message || 'errorea'));
    } finally {
      root.setAttribute('aria-busy', 'false');
      renderContent();
    }
  }

  function bulk(state) {
    const rows = visibleContent();
    const chosen = rows.filter((x) => picked.has(x.id));
    const target = chosen.length ? chosen : rows;
    const verb = state === 'public' ? 'argitaratu' : state === 'members' ? 'kontuentzat soilik utzi' : 'ezkutatu';
    const scope = chosen.length ? 'Hautatutako ' + target.length + ' eduki' : KIND_LABEL[s.kind] + ': zerrendako ' + target.length + ' eduki';
    applyState(target, state, scope + ' ' + verb + ' nahi dituzu?');
  }

  function renderContent() {
    const root = $('content');
    root.replaceChildren();
    document.querySelectorAll('#contentKinds button').forEach((btn) => {
      const on = btn.dataset.kind === s.kind;
      btn.classList.toggle('active', on);
      btn.setAttribute('aria-pressed', String(on));
      const all = s.contents.filter((x) => x.kind === btn.dataset.kind);
      btn.querySelector('small').textContent = all.length;
    });
    const all = s.contents.filter((x) => x.kind === s.kind);
    const count = (state) => all.filter((x) => stateOf(x) === state).length;
    $('contentSummary').textContent = all.length + ' eduki · ' + count('public') + ' publiko · ' + count('members') + ' kontuentzat · ' + count('hidden') + ' ezkutuan';
    const rows = visibleContent();
    for (const id of [...picked]) if (!rows.some((x) => x.id === id)) picked.delete(id);
    const selectedUser = s.selected ? s.users.find((u) => u.id === s.selected) : null;
    $('contentGrantHead').textContent = selectedUser ? 'Salbuespena: ' + (selectedUser.name || selectedUser.email) : 'Salbuespena (hautatu ikaslea)';
    const updateBulk = () => {
      const n = rows.filter((x) => picked.has(x.id)).length;
      $('contentPickAll').checked = !!rows.length && n === rows.length;
      $('contentPickAll').indeterminate = n > 0 && n < rows.length;
      $('contentBulkLabel').textContent = n ? n + ' hautatuta' : 'Zerrenda osoa (' + rows.length + ')';
      document.querySelectorAll('#contentBulk button').forEach((b) => { b.disabled = !rows.length; });
    };
    $('contentPickAll').onchange = (event) => {
      for (const x of rows) if (event.target.checked) picked.add(x.id); else picked.delete(x.id);
      renderContent();
    };
    if (!rows.length) { empty(root, 'Ez dago edukirik iragazki honekin.'); updateBulk(); return; }
    for (const item of rows) {
      const state = stateOf(item);
      const row = el('div', undefined, 'material-row' + (state === 'hidden' ? ' is-hidden' : ''));
      row.setAttribute('role', 'row');
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = picked.has(item.id);
      check.setAttribute('aria-label', 'Hautatu: ' + item.label);
      check.onchange = () => { if (check.checked) picked.add(item.id); else picked.delete(item.id); updateBulk(); };
      const pick = el('label', undefined, 'material-pick');
      pick.append(check);
      const name = el('div', undefined, 'material-name');
      name.append(el('strong', item.label), el('small', organismOf(item) + ' · ' + item.info));
      const seg = el('div', undefined, 'material-state');
      seg.setAttribute('role', 'group');
      seg.setAttribute('aria-label', 'Egoera: ' + item.label);
      for (const [value, title] of STATES) {
        const b = el('button', title, 'state-' + value + (state === value ? ' active' : ''));
        b.type = 'button';
        b.setAttribute('aria-pressed', String(state === value));
        b.onclick = () => { if (stateOf(item) !== value) applyState([item], value); };
        seg.append(b);
      }
      if (state === 'guests') seg.append(el('small', 'Gonbidatuak soilik (arau zaharra)'));
      const grant = s.selected ? s.grants.find((x) => x.user_id === s.selected && x.kind === item.kind && x.resource_id === item.id) : null;
      const special = document.createElement('select');
      special.setAttribute('aria-label', 'Hautatutako ikaslearen salbuespena: ' + item.label);
      for (const [value, title] of [['default', 'Orokorra'], ['allow', 'Baimendu'], ['deny', 'Ukatu']]) {
        const o = el('option', title); o.value = value; special.append(o);
      }
      special.value = grant ? (grant.allowed ? 'allow' : 'deny') : 'default';
      special.disabled = !s.selected;
      special.onchange = async () => {
        special.disabled = true;
        try { await setGrant(item, special.value); status('Salbuespena gordeta.'); }
        catch (err) { status('Ezin izan da gorde: ' + (err.message || 'errorea')); }
        renderContent();
      };
      row.append(pick, name, seg, special);
      root.append(row);
    }
    updateBulk();
  }

  async function toggleActive() {
    const u = s.users.find((x) => x.id === s.selected);
    if (!u) return;
    const target = !u.active;
    if (!confirm((target ? 'Aktibatu' : 'Desaktibatu') + ' kontua: ' + u.email + '?')) return;
    const { data, error } = await s.client.from('sr_app_profiles').update({ active: target }).eq('user_id', u.id).select('user_id');
    if (error) { status(error.message); return; }
    if (!data || !data.length) { status('Ezin izan da kontua eguneratu: ez da aldaketarik gorde.'); return; }
    u.active = target;
    renderStudents();
    renderStats();
    loadStudent(u.id);
    status('Kontuaren egoera eguneratua.');
  }

  function render() {
    renderStats();
    renderStudents();
    renderContent();
  }

  async function start() {
    await window.SustraiCloud.ready;
    s.client = window.SustraiCloud.client();
    $('adminApp').setAttribute('aria-busy', 'false');
    if (!s.client || !window.SustraiCloud.isAdmin()) {
      $('restricted').hidden = false;
      $('loginAdmin').onclick = () => window.SustraiCloud.openLogin();
      status('Administratzailearen kontua behar da.');
      return;
    }
    $('adminPanels').hidden = false;
    $('refresh').onclick = () => load().catch((e) => status(e.message));
    $('studentSearch').oninput = renderStudents;
    $('contentSearch').oninput = renderContent;
    $('contentState').onchange = renderContent;
    $('contentOrganism').onchange = renderContent;
    document.querySelectorAll('#contentKinds button').forEach((btn) => {
      btn.onclick = () => { s.kind = btn.dataset.kind; picked.clear(); renderContent(); };
    });
    document.querySelectorAll('#contentBulk button').forEach((btn) => { btn.onclick = () => bulk(btn.dataset.state); });
    $('userActive').onclick = toggleActive;
    document.querySelectorAll('.work-filters .chip').forEach((btn) => {
      btn.onclick = () => {
        s.filter = btn.dataset.filter;
        document.querySelectorAll('.work-filters .chip').forEach((b) => b.classList.toggle('active', b === btn));
        renderWorks();
      };
    });
    await load();
  }

  start().catch((err) => {
    status(err.message || 'Kargatze-errorea');
    $('restricted').hidden = false;
  });
})();
