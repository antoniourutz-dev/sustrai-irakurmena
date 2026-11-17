/* SUSTRAI · Idazmena: review the draft before calling it finished.
   Automatic checks the student should not have to think about (length, paragraphs, the shape
   the genre expects, connector variety, repeated words, overlong sentences), then the task's own
   requirements and a short C1 self-check that is saved per task. It is self-assessment, not a mark.
   app.js calls SustraiReview.setTask(task, mode) whenever a task is selected. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const WORD = /[\p{L}\p{N}]+(?:[-'’][\p{L}\p{N}]+)*/gu;
  const words = (t) => String(t || '').match(WORD) || [];

  // Discourse connectors by function; multiword forms first so they are matched whole.
  const CONNECTORS = {
    'Gehitzeko': ['gainera', 'era berean', 'halaber', 'horrez gain', 'are gehiago'],
    'Kontrajartzeko': ['hala ere', 'hala eta guztiz ere', 'aldiz', 'nahiz eta', 'baina', 'ostera', 'dena den'],
    'Ondorioa adierazteko': ['beraz', 'ondorioz', 'horregatik', 'horrenbestez', 'hori dela eta'],
    'Azaltzeko': ['izan ere', 'hau da', 'alegia', 'adibidez', 'esate baterako'],
    'Ordenatzeko': ['lehenik', 'lehenik eta behin', 'bigarrenik', 'azkenik', 'alde batetik', 'bestetik', 'bestalde'],
    'Amaitzeko': ['laburbilduz', 'azken batean', 'bukatzeko', 'amaitzeko', 'labur esanda']
  };
  const STOP = new Set(['baina', 'gainera', 'horrek', 'horiek', 'hauek', 'haiek', 'horren', 'horiei', 'hartan', 'honetan', 'horretan',
    'daude', 'dugun', 'duten', 'dituzte', 'ditugu', 'dituen', 'zuten', 'zuela', 'izango', 'izaten', 'egiten', 'egingo', 'behar', 'baita',
    'bezala', 'guztiak', 'guztia', 'beste', 'batzuk', 'askok', 'asko', 'gehiago', 'gutxiago', 'oraindik', 'beraz', 'hala', 'horregatik',
    'zergatik', 'nolako', 'bakarrik', 'ondoren', 'aurretik', 'artean', 'buruz', 'arteko', 'hemen', 'orain', 'gaur', 'egun', 'gure',
    'zure', 'zuen', 'haien', 'beren', 'bere', 'nire', 'eurek', 'guztiok', 'denak', 'dena', 'ezer', 'inork', 'norbait', 'zerbait', 'dela',
    'direla', 'zela', 'dutela', 'duela', 'diren', 'dituzten', 'izatea', 'izateko', 'egitea', 'egiteko', 'nahiz', 'ondorioz']);
  const LETTER = new Set(['gutuna', 'gutun_irekia', 'eskaera', 'kexa']);
  const TITLED = new Set(['iritzi_artikulua', 'txostena']);
  const SELF = [
    'Hartzaileari eta egoerari egokitutako erregistroa erabili dut.',
    'Ideia nagusi bakoitza bere paragrafoan garatu dut, argudio edo adibide batekin.',
    'Iritzia edo proposamena argi azaldu eta arrazoitu dut.',
    'Aditz-komunztadura eta deklinabidea berrikusi ditut.',
    'Puntuazioa eta ortografia berrikusi ditut (h, z/s/x, tz/ts/tx).'
  ];

  let task = null, mode = 'training';
  const key = () => task ? 'sustrai-writer-review:' + task.slug : '';
  const loadTicks = () => { try { return JSON.parse(window.SustraiCloud.storage.getItem(key()) || '{}') || {}; } catch { return {}; } };
  const saveTicks = (v) => { try { window.SustraiCloud.storage.setItem(key(), JSON.stringify(v)); } catch { /* best effort */ } };

  function paragraphs(text) {
    return String(text || '').split(/\n+/).map((p) => p.trim()).filter(Boolean);
  }
  function sentences(text) {
    return String(text || '').replace(/\n+/g, ' ').split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);
  }
  function findConnectors(text) {
    let lower = ' ' + String(text || '').toLocaleLowerCase('eu').replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ') + ' ';
    const found = new Map();
    const all = Object.entries(CONNECTORS).flatMap(([fn, list]) => list.map((c) => [c, fn])).sort((a, b) => b[0].length - a[0].length);
    for (const [c, fn] of all) {
      if (lower.includes(' ' + c + ' ')) { found.set(c, fn); lower = lower.split(' ' + c + ' ').join(' '); }
    }
    return found;
  }

  function checks(text) {
    const list = [];
    const w = words(text).length, min = task?.min_words || null;
    if (min) {
      list.push(w >= min
        ? { ok: true, title: 'Luzera', detail: w + ' hitz (gutxienez ' + min + ').' }
        : { ok: false, title: 'Luzera', detail: w + ' hitz: ' + (min - w) + ' falta zaizkizu gutxienekora iristeko (' + min + ').' });
    } else list.push({ ok: w >= 150, title: 'Luzera', detail: w + ' hitz.' });

    const paras = paragraphs(text);
    const body = LETTER.has(task?.genre) ? paras.filter((p) => words(p).length > 12) : paras;
    list.push(body.length >= 3
      ? { ok: true, title: 'Paragrafoak', detail: body.length + ' paragrafo: sarrera, garapena eta amaiera bereizteko adina.' }
      : { ok: false, title: 'Paragrafoak', detail: (body.length || 0) + ' paragrafo. Antolatu testua gutxienez hirutan: sarrera, garapena eta amaiera (lerro-jauzi batekin).' });

    if (LETTER.has(task?.genre)) {
      const first = paras[0] || '', last = paras.slice(-2).join(' ').toLocaleLowerCase('eu');
      const greet = /^(agurgarri|jaun|andre|kaixo|estimatu|arduradun|lagun|zuzendari|presidente|alkate|jaun-andre)/iu.test(first) || (/[:,]$/.test(first) && words(first).length <= 12);
      const close = /(adeitasunez|agur bero|besarkada|zure zain|zuen zain|eskerrik asko|begirunez|jaso ezazu|jaso itzazue|ondo izan|agur bat)/u.test(last);
      list.push(greet && close
        ? { ok: true, title: 'Gutunaren egitura', detail: 'Hasierako eta amaierako agurrak badaude.' }
        : { ok: false, title: 'Gutunaren egitura', detail: !greet && !close ? 'Falta dira hasierako agurra (adib. «Jaun-andre agurgarriak:») eta amaierako formula (adib. «Adeitasunez,»).' : !greet ? 'Hasi hartzaileari zuzendutako agur batekin (adib. «Jaun-andre agurgarriak:»).' : 'Amaitu formula batekin eta sinadurarekin (adib. «Adeitasunez,»).' });
    } else if (TITLED.has(task?.genre)) {
      const first = paras[0] || '';
      const titled = first && words(first).length <= 12 && !/[.!?]$/.test(first);
      list.push(titled
        ? { ok: true, title: 'Izenburua', detail: '«' + first + '»' }
        : { ok: false, title: 'Izenburua', detail: 'Jarri izenburu labur bat lehen lerroan, puntu gabe.' });
    }

    const found = findConnectors(text);
    const fns = new Set(found.values());
    const missing = Object.keys(CONNECTORS).filter((fn) => !fns.has(fn)).slice(0, 2);
    list.push(found.size >= 5
      ? { ok: true, title: 'Lokailuak', detail: found.size + ' lokailu desberdin: ' + [...found.keys()].join(', ') + '.' }
      : { ok: false, title: 'Lokailuak', detail: (found.size ? found.size + ' lokailu (' + [...found.keys()].join(', ') + '). ' : 'Ez da lokailurik aurkitu. ') + 'C1 mailan, erabili gutxienez bost desberdin.' + (missing.length ? ' Adibidez, ' + missing.map((fn) => fn.toLowerCase() + ': «' + CONNECTORS[fn][0] + '»').join('; ') + '.' : '') });

    const counts = new Map();
    for (const raw of words(text)) { const t = raw.toLocaleLowerCase('eu'); if (t.length >= 5 && !STOP.has(t) && !/^\d+$/.test(t)) counts.set(t, (counts.get(t) || 0) + 1); }
    const repeated = [...counts.entries()].filter(([, n]) => n >= 4).sort((a, b) => b[1] - a[1]).slice(0, 3);
    list.push(repeated.length
      ? { ok: false, title: 'Errepikapenak', detail: repeated.map(([t, n]) => '«' + t + '» ×' + n).join(', ') + '. Bilatu sinonimoak edo izenordainak.' }
      : { ok: true, title: 'Errepikapenak', detail: 'Ez dago hitzik lau aldiz baino gehiagotan errepikatuta.' });

    const long = sentences(text).filter((s) => words(s).length > 40).length;
    list.push(long
      ? { ok: false, title: 'Esaldi luzeak', detail: long + ' esaldik 40 hitz baino gehiago dituzte. Zatitu irakurgarriagoak izateko.' }
      : { ok: true, title: 'Esaldi luzeak', detail: 'Esaldiak irakurtzeko moduko luzerakoak dira.' });
    return list;
  }

  function render() {
    const panel = $('draftReview');
    if (!panel || panel.hidden || !task) return;
    const text = $('draft').value;
    const auto = checks(text);
    const ticks = loadTicks();
    const guidance = Array.isArray(task.exam_guidance) ? task.exam_guidance.filter((x) => typeof x === 'string' && x.trim()) : [];
    const manual = [...guidance.map((g, i) => ['g' + i, g]), ...SELF.map((s, i) => ['s' + i, s])];
    const autoOk = auto.filter((c) => c.ok).length, manualOk = manual.filter(([k]) => ticks[k]).length;
    const ready = autoOk === auto.length && manualOk === manual.length;

    let html = '<div class="review-head"><div><span class="overline">BERRIKUSPENA</span><h3>Zure testua prest dago?</h3></div>' +
      '<span class="review-pill ' + (ready ? 'ok' : 'todo') + '">' + (ready ? 'Prest' : 'Hobetu daiteke') + '</span></div>' +
      '<p class="review-sub">Egiaztapen automatikoak: <strong>' + autoOk + '/' + auto.length + '</strong> · Zure egiaztapena: <strong>' + manualOk + '/' + manual.length + '</strong></p>' +
      '<ul class="review-auto">' + auto.map((c) => '<li class="' + (c.ok ? 'ok' : 'todo') + '"><span class="review-icon" aria-hidden="true">' + (c.ok ? '✓' : '!') + '</span><div><strong>' + esc(c.title) + '</strong><p>' + esc(c.detail) + '</p></div></li>').join('') + '</ul>';
    if (guidance.length) {
      html += '<h4>Atazak eskatzen duena</h4><div class="review-manual">' + guidance.map((g, i) =>
        '<label><input type="checkbox" data-tick="g' + i + '"' + (ticks['g' + i] ? ' checked' : '') + '><span>' + esc(g) + '</span></label>').join('') + '</div>';
    }
    html += '<h4>C1 autoegiaztapena</h4><div class="review-manual">' + SELF.map((s, i) =>
      '<label><input type="checkbox" data-tick="s' + i + '"' + (ticks['s' + i] ? ' checked' : '') + '><span>' + esc(s) + '</span></label>').join('') + '</div>' +
      '<p class="review-note">Autoegiaztapena da, ez azterketako nota. ' + (mode === 'simulation' ? 'Simulazioan, egin berrikuspena denbora amaitu aurretik, azterketan bezala.' : 'Zuzendu testua eta sakatu «Berriro egiaztatu».') + '</p>' +
      '<div class="review-actions"><button type="button" class="soft" id="reviewAgain">Berriro egiaztatu</button><button type="button" class="soft" id="reviewClose">Itxi</button></div>';
    panel.innerHTML = html;
    panel.querySelectorAll('[data-tick]').forEach((box) => box.addEventListener('change', () => {
      const v = loadTicks(); v[box.dataset.tick] = box.checked; saveTicks(v); render();
    }));
    $('reviewAgain').onclick = () => { render(); $('reviewAgain').focus(); };
    $('reviewClose').onclick = () => { panel.hidden = true; $('reviewDraft').setAttribute('aria-expanded', 'false'); $('reviewDraft').focus(); };
  }

  function open() {
    const panel = $('draftReview');
    if (!panel || !task) return;
    panel.hidden = false;
    $('reviewDraft').setAttribute('aria-expanded', 'true');
    render();
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function refreshButton() {
    const btn = $('reviewDraft');
    if (btn) btn.disabled = !task || !$('draft').value.trim();
  }

  function setTask(next, nextMode) {
    task = next; mode = nextMode || 'training';
    const panel = $('draftReview');
    if (panel) panel.hidden = true;
    const btn = $('reviewDraft');
    if (btn) btn.setAttribute('aria-expanded', 'false');
    refreshButton();
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('reviewDraft')?.addEventListener('click', open);
    let timer = null;
    $('draft')?.addEventListener('input', () => {
      refreshButton();
      if ($('draftReview') && !$('draftReview').hidden) { clearTimeout(timer); timer = setTimeout(render, 600); }
    });
  });

  window.SustraiReview = { setTask, checks: (text) => checks(text) };
})();
