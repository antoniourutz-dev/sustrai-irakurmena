/* SUSTRAI · student progress model, shared by Nire espazioa and the home page.
   Turns saved state (one row per storage key: cloud rows when signed in, this browser's
   localStorage for guests) into tasks per skill, plus reading results.
   SustraiProgress.load() -> {signedIn, profile, client, rows, results, tasks:{reading,writing,speaking}}
   SustraiProgress.openTasks(tasks) -> tasks still in progress, most recent first
   SustraiProgress.hrefOf(task), .progressOf(task), .SKILL, .MODE
   Needs account-kit.js (and exam-names.js for exam names) loaded before it. */
(() => {
  'use strict';
  const kit = () => window.SustraiAccountKit;
  const json = (text, fallback) => { try { const v = JSON.parse(text); return v ?? fallback; } catch { return fallback; } };
  const words = (text) => (String(text || '').trim().match(/[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu) || []).length;
  const time = (iso) => (iso ? new Date(iso).getTime() || 0 : 0);
  const prettySlug = (slug) => String(slug || '').replace(/[-_]+/g, ' ').replace(/\b(ivap|habe)\b/gi, (m) => m.toUpperCase());

  let client = null;
  let profile = null;
  let signedIn = false;
  let rows = [];        // {storage_key, value_text, updated_at}
  let results = [];     // {title, when, mode, pct, correct, total, score, max, minutes, href}
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
        title: org + ' · ' + (window.SustraiExamName ? window.SustraiExamName.name(org, e.slug, e.session_label || e.title) : (e.session_label || e.title)),
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
          title: info?.title || rec.org + ' · ' + (window.SustraiExamName ? window.SustraiExamName.name(rec.org, rec.examId) : rec.examId),
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
          reading.set(id, { skill: 'reading', rec, mode, title: info?.title || rec.org + ' · ' + (window.SustraiExamName ? window.SustraiExamName.name(rec.org, rec.examId) : rec.examId), total: info?.total || null, answered: 0, done: false, keys: [], updated: 0 });
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
          (m = key.match(/^sustrai-(writer-saved|writer-marks|writer-review):([^:]+)$/)) ||
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

  function openTasks(tasks) {
    return [
      ...tasks.reading.filter((t) => !t.done && (!t.total || t.answered < t.total)),
      ...tasks.writing.filter((t) => !t.min || t.words < t.min),
      ...tasks.speaking.filter((t) => t.filled < 4)
    ].sort((a, b) => b.updated - a.updated);
  }

  async function load() {
    await window.SustraiCloud.ready;
    profile = window.SustraiCloud.profile();
    client = window.SustraiCloud.client();
    signedIn = !!profile?.active;
    try { await loadCatalog(); } catch { /* titles fall back to readable slugs */ }
    if (signedIn) await loadServer();
    else { rows = localRows(); results = localResults(); }
    return { signedIn, profile, client, rows, results, tasks: buildTasks() };
  }

  window.SustraiProgress = { load, openTasks, hrefOf, progressOf, SKILL, MODE, words, time };
})();
