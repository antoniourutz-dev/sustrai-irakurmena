'use strict';
/* SUSTRAI · Nire espazioa
   Turns the raw saved state (one row per storage key) into what a student cares about:
   what to continue, how they are progressing, their reading results and their work per task.
   Signed-in students read their cloud rows; guests see what this browser holds, with an
   invitation to create an account so it is not lost. Raw keys and JSON are never shown. */
(() => {
  const $ = (id) => document.getElementById(id);
  const kit = () => window.SustraiAccountKit;
  const el = (tag, text, cls) => {
    const n = document.createElement(tag);
    if (text !== undefined && text !== null) n.textContent = String(text);
    if (cls) n.className = cls;
    return n;
  };
  const say = (msg) => { $('myStatus').textContent = msg; };
  const P = () => window.SustraiProgress;
  const hrefOf = (t) => P().hrefOf(t);
  const progressOf = (t) => P().progressOf(t);
  const SKILL = { reading: 'Irakurmena', writing: 'Idazmena', speaking: 'Ahozkoa' };
  const MODE = { simulation: 'Simulazioa', practice: 'Praktika', training: 'Praktika' };
  const time = (iso) => (iso ? new Date(iso).getTime() || 0 : 0);

  let client = null;
  let profile = null;
  let signedIn = false;
  let rows = [];
  let results = [];
  let tasksNow = { reading: [], writing: [], speaking: [] };
  let filter = 'all';
  let showAllResults = false;
  const buildTasks = () => tasksNow;


  /* ---------- Rendering ---------- */

  function meter(value, label) {
    const wrap = el('div', undefined, 'meter');
    wrap.setAttribute('role', 'img');
    wrap.setAttribute('aria-label', label);
    const fill = el('span');
    fill.style.width = Math.round((value || 0) * 100) + '%';
    wrap.append(fill);
    return wrap;
  }

  function emptyState(root, text, links) {
    const box = el('div', undefined, 'empty');
    box.append(el('p', text));
    if (links) {
      const row = el('div', undefined, 'empty-links');
      for (const [label, href] of links) { const a = el('a', label, 'space-btn'); a.href = href; row.append(a); }
      box.append(row);
    }
    root.replaceChildren(box);
  }

  function renderHero(tasks) {
    const name = (profile?.name || '').trim().split(/\s+/)[0];
    $('greeting').textContent = signedIn && name ? 'Kaixo, ' + name : 'Nire espazioa';
    const open = [...tasks.reading.filter((t) => !t.done), ...tasks.writing, ...tasks.speaking];
    const last = Math.max(0, ...rows.map((r) => time(r.updated_at)), ...results.map((r) => time(r.when)));
    const bits = [];
    bits.push(open.length ? open.length + ' lan martxan' : 'Ez duzu lanik martxan');
    if (results.length) bits.push(results.length + ' proba zuzenduta');
    if (last) bits.push('azken jarduera: ' + kit().euWhen(last));
    $('summary').textContent = bits.join(' · ');
  }

  function renderContinue(tasks) {
    const root = $('continueList');
    const open = [
      ...tasks.reading.filter((t) => !t.done && (!t.total || t.answered < t.total)),
      ...tasks.writing.filter((t) => !t.min || t.words < t.min),
      ...tasks.speaking.filter((t) => t.filled < 4)
    ].sort((a, b) => b.updated - a.updated).slice(0, 4);

    if (!open.length) {
      emptyState(root, 'Ez duzu ezer erdizka. Aukeratu nondik hasi:', [
        ['Irakurmen-proba bat', '/irakurmena/'], ['Idazlan bat', '/idazlanak/'], ['Ahozko fitxa bat', '/ahozkoa/']
      ]);
      return;
    }
    root.replaceChildren(...open.map((task) => {
      const card = el('a', undefined, 'continue-card skill-' + task.skill);
      card.href = hrefOf(task);
      const top = el('div', undefined, 'card-top');
      top.append(el('span', SKILL[task.skill], 'skill-tag'));
      if (task.mode === 'simulation') top.append(el('span', 'Simulazioa', 'mode-tag'));
      const p = progressOf(task);
      card.append(top, el('strong', task.title, 'card-title'));
      if (p.value !== null) card.append(meter(p.value, p.text));
      const foot = el('div', undefined, 'card-foot');
      foot.append(el('span', p.text + (task.updated ? ' · ' + kit().euWhen(task.updated) : ''), 'card-meta'), el('span', 'Jarraitu', 'card-cta'));
      card.append(foot);
      return card;
    }));
  }

  function renderOverview(tasks) {
    const pcts = results.map((r) => r.pct).filter((x) => x !== null && x !== undefined);
    const avg = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;
    const totalWords = tasks.writing.reduce((a, t) => a + t.words, 0);
    const reached = tasks.writing.filter((t) => t.min && t.words >= t.min).length;
    const ready = tasks.speaking.filter((t) => t.filled === 4).length;
    const openReading = tasks.reading.filter((t) => !t.done).length;

    const tile = (skill, big, bigLabel, lines, extra, href) => {
      const box = el('a', undefined, 'skill-tile skill-' + skill);
      box.href = href;
      box.append(el('span', SKILL[skill], 'skill-tag'));
      const num = el('p', undefined, 'tile-number');
      num.append(el('strong', big), el('span', bigLabel));
      box.append(num);
      for (const line of lines) if (line) box.append(el('span', line, 'tile-line'));
      if (extra) box.append(extra);
      return box;
    };

    // Last results, oldest first, as small bars: the trend at a glance.
    let spark = null;
    const recent = results.filter((r) => r.pct !== null && r.pct !== undefined).slice(0, 10).reverse();
    if (recent.length >= 2) {
      spark = el('div', undefined, 'spark');
      spark.setAttribute('role', 'img');
      spark.setAttribute('aria-label', 'Azken emaitzak: ' + recent.map((r) => '%' + r.pct).join(', '));
      for (const r of recent) { const b = el('span'); b.style.height = Math.max(6, r.pct) + '%'; if (r.pct < 60) b.className = 'low'; spark.append(b); }
    }

    $('overview').replaceChildren(
      tile('reading', results.length, results.length === 1 ? 'proba zuzenduta' : 'proba zuzenduta',
        [avg !== null ? 'Batez beste %' + avg : 'Amaitu proba bat zure maila ikusteko', openReading ? openReading + ' martxan' : ''], spark, '/irakurmena/'),
      tile('writing', tasks.writing.length, 'idazlan',
        [totalWords ? totalWords.toLocaleString('es-ES') + ' hitz guztira' : 'Hasi zure lehen idazlana', reached ? reached + ' gutxienekora iritsita' : ''], null, '/idazlanak/'),
      tile('speaking', tasks.speaking.length, 'fitxa prestatzen',
        [ready ? ready + ' osorik prestatuta' : tasks.speaking.length ? 'Osatu lau atalak' : 'Prestatu zure lehen ahozkoa'], null, '/ahozkoa/')
    );
  }

  const TRASH = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M6 7l1 13h10l1-13"/><path d="M9 7V4h6v3"/></svg>';

  // Deletes one reading result: from the account (signed in) and from the workshop's attempt history.
  async function deleteResult(r, button) {
    if (!confirm('«' + r.title + '» (' + kit().euWhen(r.when) + ') emaitza ezabatu? Ezin da desegin.')) return;
    button.disabled = true;
    const A = window.SustraiAttempts;
    let ok = true;
    if (r.rec) {
      const hk = r.historyKey || P().historyKeyOf(r.rec);
      const i = A.matchIndex(hk, { key: r.key, at: r.when, correct: r.correct });
      if (i >= 0) await A.removeFromHistory(hk, [i], { cloud: false });
    }
    if (signedIn) ok = await A.removeCloud({ id: r.id, key: r.key, at: r.when, correct: r.correct });
    await window.SustraiCloud.flush();
    await load();
    say(ok ? 'Emaitza ezabatuta.' : 'Ezin izan da emaitza zure kontutik ezabatu. Saiatu berriro geroago.');
  }

  // Erases an unfinished reading exam: answers, timer, highlights and its pending attempt key.
  function readingKeys(task) {
    const keys = new Set(task.keys);
    for (const row of rows) {
      const rec = kit().parseReadingKey(row.storage_key);
      if (rec && rec.slug === task.rec.slug && rec.kind === 'marks') keys.add(row.storage_key);
    }
    keys.add('sustrai-client-attempt-v1-' + task.rec.examId + '-' + (task.mode === 'simulation' ? 'simulation' : 'practice'));
    return [...keys];
  }

  function renderResults() {
    const root = $('myResults');
    if (!results.length) {
      emptyState(root, 'Oraindik ez duzu probarik zuzendu. Amaitu irakurmen-proba bat eta emaitza hemen ikusiko duzu.', [['Aukeratu proba bat', '/irakurmena/']]);
      return;
    }
    const list = showAllResults ? results : results.slice(0, 6);
    const items = list.map((r) => {
      const row = el('a', undefined, 'result-row' + (r.pct !== null && r.pct !== undefined && r.pct < 60 ? ' low' : ''));
      row.href = r.href;
      const left = el('div', undefined, 'result-main');
      left.append(el('strong', r.title));
      const meta = [kit().euWhen(r.when), MODE[r.mode]];
      if (r.minutes) meta.push(r.minutes + ' min');
      left.append(el('span', meta.filter(Boolean).join(' · '), 'card-meta'));
      const right = el('div', undefined, 'result-score' + (r.pct !== null && r.pct < 60 ? ' low' : ''));
      right.append(el('strong', r.pct !== null && r.pct !== undefined ? '%' + r.pct : '—'));
      const detail = [];
      if (r.correct !== undefined && r.correct !== null && r.total) detail.push(r.correct + '/' + r.total + ' zuzen');
      if (r.max) detail.push(String(r.score).replace('.', ',') + '/' + r.max + ' puntu');
      right.append(el('span', detail.join(' · ')));
      row.append(left, right);
      if (r.pct !== null && r.pct !== undefined) row.append(meter(r.pct / 100, '%' + r.pct));
      const item = el('div', undefined, 'result-item');
      const del = el('button', undefined, 'result-del');
      del.type = 'button';
      del.title = 'Emaitza ezabatu';
      del.setAttribute('aria-label', '«' + r.title + '» emaitza ezabatu (' + kit().euWhen(r.when) + ')');
      del.innerHTML = TRASH;
      del.onclick = () => deleteResult(r, del);
      item.append(row, del);
      return item;
    });
    root.replaceChildren(...items);
    if (results.length > 6) {
      const more = el('button', showAllResults ? 'Gutxiago erakutsi' : 'Emaitza guztiak (' + results.length + ')', 'space-btn quiet');
      more.type = 'button';
      more.onclick = () => { showAllResults = !showAllResults; renderResults(); };
      root.append(more);
    }
  }

  function renderWorks(tasks) {
    const root = $('myWorks');
    const list = [...(filter === 'all' || filter === 'reading' ? tasks.reading : []), ...(filter === 'all' || filter === 'writing' ? tasks.writing : []), ...(filter === 'all' || filter === 'speaking' ? tasks.speaking : [])]
      .sort((a, b) => b.updated - a.updated);
    if (!list.length) {
      emptyState(root, filter === 'speaking' ? 'Oraindik ez duzu ahozko oharrik.' : filter === 'writing' ? 'Oraindik ez duzu idazlanik.' : filter === 'reading' ? 'Ez duzu irakurmen-probarik martxan.' : 'Oraindik ez duzu lanik martxan.',
        [['Irakurmena', '/irakurmena/'], ['Idazmena', '/idazlanak/'], ['Ahozkoa', '/ahozkoa/']]);
      return;
    }
    root.replaceChildren(...list.map((task) => {
      const card = el('article', undefined, 'work-card skill-' + task.skill);
      const top = el('div', undefined, 'card-top');
      top.append(el('span', SKILL[task.skill], 'skill-tag'));
      if (task.mode === 'simulation') top.append(el('span', 'Simulazioa', 'mode-tag'));
      if (task.updated) top.append(el('span', kit().euWhen(task.updated), 'card-meta push'));
      card.append(top, el('h3', task.title, 'card-title'));

      const facts = [];
      if (task.skill === 'writing') {
        facts.push(progressOf(task).text);
        if (task.outline) facts.push(task.ideas ? 'Eskema · ' + task.ideas + ' ideia' : 'Eskema');
        if (task.saved) facts.push(task.saved + ' bertsio gordeta');
        if (task.glossary) facts.push(task.glossary + ' hitz hiztegian');
      } else {
        facts.push(progressOf(task).text);
        if (task.skill === 'reading' && task.done) facts.push('amaituta');
      }
      card.append(el('p', facts.join(' · '), 'card-facts'));
      const excerpt = (task.skill === 'writing' ? task.text : task.skill === 'speaking' ? task.opening : '').replace(/\s+/g, ' ').trim();
      if (excerpt) card.append(el('p', excerpt, 'card-excerpt'));

      const actions = el('div', undefined, 'card-actions');
      const open = el('a', 'Jarraitu', 'space-btn primary');
      open.href = hrefOf(task);
      const del = el('button', 'Ezabatu', 'space-btn quiet');
      del.type = 'button';
      del.setAttribute('aria-label', '«' + task.title + '» ezabatu');
      del.onclick = async () => {
        const question = task.skill === 'reading'
          ? '«' + task.title + '»: erantzunak, kronometroa eta azpimarrak ezabatu? Amaitutako saiakeren emaitzak ez dira ezabatzen.'
          : '«' + task.title + '» atazako lan guztiak ezabatu? Ezin da desegin.';
        if (!confirm(question)) return;
        for (const key of (task.skill === 'reading' ? readingKeys(task) : task.keys)) window.SustraiCloud.storage.removeItem(key);
        await window.SustraiCloud.flush();
        await load();
        say('«' + task.title + '» ezabatuta.');
      };
      actions.append(open, del);
      card.append(actions);
      return card;
    }));
  }

  function render() {
    const tasks = buildTasks();
    renderHero(tasks);
    renderContinue(tasks);
    renderOverview(tasks);
    renderResults();
    renderWorks(tasks);
  }

  async function load() {
    const st = await P().load();
    ({ signedIn, profile, client, rows, results } = st);
    tasksNow = st.tasks;
    render();
  }

  /* ---------- Account ---------- */

  function exportData() {
    const payload = { exported_at: new Date().toISOString(), account_email: profile.email, display_name: profile.name, works: rows, reading_results: results };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sustrai-nire-datuak.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function saveProfile(event) {
    event.preventDefault();
    const name = $('displayName').value.trim();
    say('Gordetzen…');
    const { data, error } = await client.rpc('sr_update_my_name', { p_name: name });
    if (error) { say(error.message === 'name_too_short' ? 'Izenak gutxienez 2 karaktere izan behar ditu.' : 'Ezin izan da gorde.'); return; }
    profile = data;
    window.SustraiCloud.setProfile?.(data);
    window.SustraiCloud.refreshAccount?.();
    render();
    say('Izena gordeta.');
  }

  function wireAccount() {
    $('signedIn').hidden = false;
    $('displayName').value = profile.name || '';
    $('identity').textContent = profile.email || '';
    $('profileForm').onsubmit = saveProfile;
    $('import').onclick = async () => { await window.SustraiCloud.importGuestData(); await load(); };
    $('export').onclick = exportData;
    $('eraseAll').onclick = async () => {
      if (!confirm('Hodeiko lan eta irakurmen-emaitza GUZTIAK ezabatuko dira. Gailu honetako gonbidatu-datuak ez. Jarraitu?')) return;
      if (!confirm('Ezin da desegin. Benetan ezabatu?')) return;
      say('Ezabatzen…');
      const { error } = await client.rpc('sr_delete_my_work');
      if (error) { say('Ezin izan dira ezabatu.'); return; }
      location.reload();
    };
  }

  async function start() {
    await window.SustraiCloud.ready;
    profile = window.SustraiCloud.profile();
    client = window.SustraiCloud.client();
    signedIn = !!profile?.active;
    document.querySelectorAll('.segmented button').forEach((btn) => {
      btn.onclick = () => {
        filter = btn.dataset.filter;
        document.querySelectorAll('.segmented button').forEach((b) => { b.classList.toggle('active', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
        renderWorks(buildTasks());
      };
    });
    if (!signedIn) {
      $('guest').hidden = false;
      $('login').onclick = () => window.SustraiCloud.openLogin();
    } else wireAccount();
    await load();
  }

  start().catch((err) => {
    console.error(err);
    $('summary').textContent = 'Ezin izan dira zure datuak kargatu. Freskatu orria.';
  });
})();
