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
  const json = (text, fallback) => { try { const v = JSON.parse(text); return v ?? fallback; } catch { return fallback; } };
  const words = (text) => (String(text || '').trim().match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu) || []).length;
  const time = (iso) => (iso ? new Date(iso).getTime() || 0 : 0);
  const prettySlug = (slug) => String(slug || '').replace(/[-_]+/g, ' ').replace(/\b(ivap|habe)\b/gi, (m) => m.toUpperCase());

  let client = null;
  let profile = null;
  let signedIn = false;
  let rows = [];        // {storage_key, value_text, updated_at}
  let results = [];     // {title, when, mode, pct, correct, total, score, max, minutes, href}
  let filter = 'all';
  let showAllResults = false;
  const catalog = { exams: new Map(), writing: new Map(), speaking: new Map() };

  /* ---------- Data ---------- */

  async function loadCatalog() {
    if (!client) return;
    const [ex, wr, sp] = await Promise.allSettled([
      client.from('sr_exams').select('slug,title,session_label,metadata,sr_organisms(code)'),
      client.from('sr_writing_prompts').select('slug,title_eu,min_words'),
      client.from('sr_speaking_prompts').select('slug,title_eu')
    ]);
    for (const e of ex.value?.data || []) {
      const org = e.sr_organisms?.code || (String(e.slug).startsWith('habe') ? 'HABE' : 'IVAP');
      catalog.exams.set(e.slug, {
        title: e.session_label ? org + ' · ' + e.session_label : e.title,
        total: Number(e.metadata?.expected_items) || null
      });
    }
    for (const w of wr.value?.data || []) catalog.writing.set(w.slug, { title: w.title_eu, min: w.min_words || null });
    for (const s of sp.value?.data || []) catalog.speaking.set(s.slug, { title: s.title_eu });
  }

  function localRows() {
    const out = [];
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sustrai-')) out.push({ storage_key: key, value_text: localStorage.getItem(key), updated_at: null });
      }
    } catch { /* storage blocked: nothing to show */ }
    return out;
  }

  async function loadServer() {
    await window.SustraiCloud.flush();
    const [a, b] = await Promise.all([
      client.from('sr_app_state').select('storage_key,value_text,updated_at').eq('user_id', profile.id).order('updated_at', { ascending: false }).limit(1500),
      client.from('sr_app_reading_results').select('score,max_score,correct,total,created_at,elapsed_seconds,response_summary,sr_exams(slug,title)').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(500)
    ]);
    if (a.error) throw a.error;
    if (b.error) throw b.error;
    rows = a.data || [];
    results = (b.data || []).map((r) => {
      const slug = r.sr_exams?.slug || '';
      const info = catalog.exams.get(slug);
      const rec = slug ? { org: slug.startsWith('habe') ? 'HABE' : 'IVAP', examId: slug.startsWith('ivap-') ? slug.slice(5) : slug } : null;
      const mode = r.response_summary?.mode === 'simulation' ? 'simulation' : 'practice';
      return {
        title: info?.title || kit().examTitle(r),
        when: r.created_at,
        mode,
        pct: kit().scorePct(r.score, r.max_score),
        correct: r.correct, total: r.total, score: r.score, max: r.max_score,
        minutes: r.elapsed_seconds ? Math.round(r.elapsed_seconds / 60) : null,
        href: rec ? kit().readingHref(rec, mode) : '/irakurmena/'
      };
    });
  }

  // Guests: results come from the attempt history the reading workshop keeps on this device.
  function localResults() {
    const out = [];
    for (const row of rows) {
      const rec = kit().parseReadingKey(row.storage_key);
      if (!rec || rec.kind !== 'attempts') continue;
      const info = catalog.exams.get(rec.slug);
      for (const a of json(row.value_text, [])) {
        if (!a || typeof a !== 'object') continue;
        const total = info?.total || null;
        const mode = a.mode === 'simulation' ? 'simulation' : 'practice';
        const ms = a.elapsed ?? a.time;
        out.push({
          title: info?.title || rec.org + ' · ' + rec.examId,
          when: a.at, mode,
          pct: total ? Math.round((Number(a.correct) || 0) / total * 100) : null,
          correct: a.correct, total, score: a.score, max: null,
          minutes: ms ? Math.round(ms / 60000) : null,
          href: kit().readingHref(rec, mode)
        });
      }
    }
    return out.sort((x, y) => time(y.when) - time(x.when));
  }

  /* ---------- Model: one entry per task ---------- */

  function buildTasks() {
    const reading = new Map(), writing = new Map(), speaking = new Map();
    const touch = (task, row) => {
      task.keys.push(row.storage_key);
      const t = time(row.updated_at);
      if (t > task.updated) task.updated = t;
    };

    for (const row of rows) {
      const rec = kit().parseReadingKey(row.storage_key);
      if (rec) {
        if (rec.kind === 'marks' || rec.kind === 'attempts') continue;
        const mode = rec.mode || 'practice';
        const id = rec.slug + '|' + mode;
        if (!reading.has(id)) {
          const info = catalog.exams.get(rec.slug);
          reading.set(id, { skill: 'reading', rec, mode, title: info?.title || rec.org + ' · ' + rec.examId, total: info?.total || null, answered: 0, done: false, keys: [], updated: 0 });
        }
        const task = reading.get(id);
        touch(task, row);
        if (rec.kind === 'answers') task.answered += Object.values(json(row.value_text, {})).filter(Boolean).length;
        if (rec.kind === 'timer') task.done = !!json(row.value_text, {}).done;
        continue;
      }

      const key = row.storage_key;
      let m;
      if ((m = key.match(/^sustrai-(writer-c1|outline-v1):([^:]+):(training|simulation)$/)) ||
          (m = key.match(/^sustrai-(writer-saved|writer-marks):([^:]+)$/)) ||
          (m = key.match(/^sustrai-glossary:(writing):([^:]+)$/))) {
        const slug = m[2];
        if (!writing.has(slug)) {
          const info = catalog.writing.get(slug);
          writing.set(slug, { skill: 'writing', slug, title: info?.title || prettySlug(slug), min: info?.min || null, words: 0, text: '', ideas: 0, saved: 0, glossary: 0, mode: 'training', keys: [], updated: 0 });
        }
        const task = writing.get(slug);
        touch(task, row);
        if (m[1] === 'writer-c1') {
          const w = words(row.value_text);
          if (w >= task.words) { task.words = w; task.text = String(row.value_text || ''); task.mode = m[3]; }
        } else if (m[1] === 'outline-v1') {
          const o = json(row.value_text, {});
          task.ideas = Math.max(task.ideas, Array.isArray(o.ideas) ? o.ideas.filter((x) => x && String(x.idea || '').trim()).length : 0);
          task.outline = task.outline || !!(String(o.goal || '').trim() || String(o.thesis || '').trim() || task.ideas);
        } else if (m[1] === 'writer-saved') task.saved = json(row.value_text, []).length || 0;
        else if (m[1] === 'writing') task.glossary = json(row.value_text, []).length || 0;
        continue;
      }

      if ((m = key.match(/^sustrai-oral-c1:([^:]+):(training|simulation)$/)) ||
          (m = key.match(/^sustrai-(?:oral-saved|glossary:speaking):([^:]+)$/))) {
        const slug = m[1];
        if (!speaking.has(slug)) {
          const info = catalog.speaking.get(slug);
          speaking.set(slug, { skill: 'speaking', slug, title: info?.title || prettySlug(slug), filled: 0, opening: '', mode: 'training', keys: [], updated: 0 });
        }
        const task = speaking.get(slug);
        touch(task, row);
        if (m[2]) {
          const notes = json(row.value_text, {}).notes || {};
          const filled = ['opening', 'idea1', 'idea2', 'closing'].filter((k) => String(notes[k] || '').trim()).length;
          if (filled >= task.filled) { task.filled = filled; task.opening = String(notes.opening || notes.idea1 || '').trim(); task.mode = m[2]; }
        }
      }
    }

    const live = (t) => (t.skill === 'reading' ? t.answered > 0
      : t.skill === 'writing' ? t.words > 0 || t.outline || t.saved > 0
        : t.filled > 0);
    return {
      reading: [...reading.values()].filter(live),
      writing: [...writing.values()].filter(live),
      speaking: [...speaking.values()].filter(live)
    };
  }

  function hrefOf(task) {
    if (task.skill === 'reading') return kit().readingHref(task.rec, task.mode);
    const base = task.skill === 'writing' ? '/idazlanak/' : '/ahozkoa/';
    return base + '?ataza=' + encodeURIComponent(task.slug) + (task.mode === 'simulation' ? '&mode=simulation' : '');
  }

  function progressOf(task) {
    if (task.skill === 'reading') {
      return task.total
        ? { value: Math.min(1, task.answered / task.total), text: task.answered + ' / ' + task.total + ' erantzunda' }
        : { value: null, text: task.answered + ' erantzun' };
    }
    if (task.skill === 'writing') {
      if (task.min) return { value: Math.min(1, task.words / task.min), text: task.words + ' / ' + task.min + ' hitz' };
      return { value: null, text: task.words ? task.words + ' hitz' : 'Eskema martxan' };
    }
    return { value: task.filled / 4, text: task.filled + ' / 4 atal prestatuta' };
  }

  const SKILL = { reading: 'Irakurmena', writing: 'Idazmena', speaking: 'Ahozkoa' };
  const MODE = { simulation: 'Simulazioa', practice: 'Praktika', training: 'Praktika' };

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
      return row;
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
    const list = [...(filter !== 'speaking' ? tasks.writing : []), ...(filter !== 'writing' ? tasks.speaking : [])]
      .sort((a, b) => b.updated - a.updated);
    if (!list.length) {
      emptyState(root, filter === 'speaking' ? 'Oraindik ez duzu ahozko oharrik.' : filter === 'writing' ? 'Oraindik ez duzu idazlanik.' : 'Oraindik ez duzu idazlanik edo ahozko oharrik.',
        [['Idazmena', '/idazlanak/'], ['Ahozkoa', '/ahozkoa/']]);
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
      }
      card.append(el('p', facts.join(' · '), 'card-facts'));
      const excerpt = (task.skill === 'writing' ? task.text : task.opening).replace(/\s+/g, ' ').trim();
      if (excerpt) card.append(el('p', excerpt, 'card-excerpt'));

      const actions = el('div', undefined, 'card-actions');
      const open = el('a', 'Jarraitu', 'space-btn primary');
      open.href = hrefOf(task);
      const del = el('button', 'Ezabatu', 'space-btn quiet');
      del.type = 'button';
      del.setAttribute('aria-label', '«' + task.title + '» ezabatu');
      del.onclick = async () => {
        if (!confirm('«' + task.title + '» atazako lan guztiak ezabatu? Ezin da desegin.')) return;
        for (const key of task.keys) window.SustraiCloud.storage.removeItem(key);
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
    if (signedIn) await loadServer();
    else { rows = localRows(); results = localResults(); }
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
    try { await loadCatalog(); } catch { /* titles fall back to readable slugs */ }
    await load();
  }

  start().catch((err) => {
    console.error(err);
    $('summary').textContent = 'Ezin izan dira zure datuak kargatu. Freskatu orria.';
  });
})();
