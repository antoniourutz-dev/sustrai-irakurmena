/* TEUSK · SUSTRAI native shell. Port of the original TEUSK question selection and game loop.
   Original: https://github.com/antoniourutz-dev/teusk ; no new database tables or answer migrations. */
(() => {
  'use strict';
  const $ = document.getElementById('teuskApp');
  const cloud = window.SustraiCloud;
  const core = window.TeuskCore;
  const HISTORY_KEY = 'sustrai-jokoak-teusk-v1';
  if (!$ || !core) return;

  const state = {
    phase: 'home', selectedLevel: 0, customCount: 20, currentIndex: 0,
    questions: [], responses: [], startedAt: null, elapsedSeconds: 0, error: ''
  };
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[c]);

  function history() {
    try {
      const value = cloud?.storage.getItem(HISTORY_KEY);
      const parsed = JSON.parse(value || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }
  function historyHtml() {
    const recent = history().slice(0, 3);
    if (!recent.length) return '';
    return '<div class="teusk-history"><strong>Azken saioak</strong><ul>' +
      recent.map(r => '<li>' + escape(r.completedAt?.slice(0, 10) || '') +
        ' · ' + escape(r.label || '') + ' · ' + escape(r.correct) + '/' + escape(r.total) + '</li>').join('') +
      '</ul></div>';
  }
  function renderHome() {
    state.phase = 'home';
    $.innerHTML = '<div class="teusk-panel"><h2>Hautatu entrenamendua</h2>' +
      '<p class="game-note">Lau sorta eta galdera-kopuru pertsonalizatua, TEUSKen jatorrizko joko-mekanikan oinarrituta.</p>' +
      '<div class="teusk-levels">' +
      [1,2,3,4].map((level) =>
        '<button class="teusk-button teusk-button--level" data-action="level" data-level="' + level + '">' +
        '<strong>' + level + '. SORTA</strong><small>5 galdera</small></button>').join('') +
      '</div><div class="teusk-custom"><label for="teuskCount">Galdera kopurua ' +
      '<output id="teuskCountOutput" for="teuskCount">' + state.customCount + '</output></label>' +
      '<input id="teuskCount" type="range" min="10" max="50" step="5" value="' + state.customCount + '">' +
      '<button class="teusk-button" data-action="custom">Hasi modu pertsonalizatua</button></div>' +
      historyHtml() + '</div>';
  }
  function renderLoading() {
    $.innerHTML = '<div class="teusk-panel"><h2>Galderak prestatzen…</h2>' +
      '<p class="teusk-status" role="status">Supabaseko bankutik galderak kargatzen ari gara.</p></div>';
  }
  function renderError(message) {
    state.phase = 'error';
    $.innerHTML = '<div class="teusk-panel"><h2>Ezin izan dira galderak kargatu</h2>' +
      '<p class="teusk-error" role="alert">' + escape(message) + '</p>' +
      '<div class="teusk-button-group"><button class="teusk-button" data-action="retry">Berriz saiatu</button>' +
      '<button class="teusk-button teusk-button--secondary" data-action="home">Hasierara</button></div></div>';
  }
  function applyBounds(query, level) {
    const b = core.bounds(level);
    if (!b) return query;
    query = query.gte('id', b.min);
    return b.max == null ? query : query.lte('id', b.max);
  }
  async function loadQuestions(level, count) {
    const client = cloud?.client();
    if (!client) throw new Error('Ezin izan da Supabaserekin konektatu. Saiatu berriro.');
    // Reuse TEUSK's count → random range → shuffle flow. Fetch extra rows to filter malformed data.
    const counter = applyBounds(client.from('atarikoa_questions')
      .select('id', { count: 'exact', head: true }), level);
    const { count: total, error: countError } = await counter;
    if (countError) throw countError;
    if (!Number.isInteger(total) || total === 0) throw new Error('Ez dago galderarik sorta honetan.');
    const windowSize = Math.min(total, Math.max(count + 16, count));
    const start = Math.floor(Math.random() * (Math.max(0, total - windowSize) + 1));
    const query = applyBounds(client.from('atarikoa_questions')
      .select('id,question,candidates,answer').order('id', { ascending: true }), level);
    const { data, error } = await query.range(start, start + windowSize - 1);
    if (error) throw error;
    const valid = (data || []).filter(core.isQuestion);
    if (valid.length < Math.min(count, total)) throw new Error('Sorta honetako galdera batzuk berrikusteko daude. Saiatu berriro.');
    return core.shuffle(valid).slice(0, count);
  }
  async function start(level) {
    state.selectedLevel = level;
    state.phase = 'loading';
    state.error = '';
    renderLoading();
    try {
      await cloud.ready;
      const wanted = level === 0 ? state.customCount : 5;
      const questions = await loadQuestions(level, wanted);
      if (!questions.length) throw new Error('Ez dago galdera erabilgarririk.');
      state.questions = questions;
      state.responses = [];
      state.currentIndex = 0;
      state.startedAt = Date.now();
      state.phase = 'playing';
      renderQuestion();
    } catch (error) {
      console.warn('TEUSK loading:', error);
      renderError(error?.message || 'Konexio arazoa. Saiatu berriro.');
    }
  }
  function renderQuestion() {
    if (state.phase !== 'playing') return;
    const q = state.questions[state.currentIndex];
    const chosen = state.responses[state.currentIndex];
    const answered = Number.isInteger(chosen);
    const correctSoFar = state.responses.reduce((acc, value, idx) =>
      acc + (value === state.questions[idx]?.answer ? 1 : 0), 0);
    const percent = Math.round((state.currentIndex / state.questions.length) * 100);
    $.innerHTML = '<div class="teusk-panel">' +
      '<div class="teusk-topline"><span class="games-kicker">' +
      (state.selectedLevel === 0 ? 'Modu pertsonalizatua' : state.selectedLevel + '. SORTA') +
      '</span><strong>' + correctSoFar + ' asmatuta</strong></div>' +
      '<div class="teusk-progress" role="progressbar" aria-valuenow="' + state.currentIndex +
      '" aria-valuemin="0" aria-valuemax="' + state.questions.length +
      '" aria-label="Galderen aurrerapena"><span style="width:' + percent + '%"></span></div>' +
      '<span class="game-note">Galdera ' + (state.currentIndex + 1) + ' / ' + state.questions.length + '</span>' +
      '<h2 class="teusk-question">' + escape(q.question) + '</h2>' +
      '<div class="teusk-options">' + q.candidates.map((text, i) => {
        const className = !answered ? '' : i === q.answer ? ' is-correct' : i === chosen ? ' is-wrong' : ' is-muted';
        const status = !answered ? '' : i === q.answer ? ' · Zuzena' : i === chosen ? ' · Okerra' : '';
        return '<button class="teusk-option' + className + '" data-action="answer" data-index="' + i + '"' +
          (answered ? ' disabled' : '') + '><span class="teusk-letter">' +
          String.fromCharCode(65 + i) + '</span><span>' + escape(text) + escape(status) + '</span></button>';
      }).join('') + '</div>' +
      (answered ? '<div class="teusk-feedback' + (chosen === q.answer ? '' : ' is-wrong') + '" role="status">' +
        '<strong>' + (chosen === q.answer ? '✓ Zuzena!' : '✕ Okerra') + '</strong>' +
        (chosen === q.answer ? 'Ongi aukeratuta.' : 'Erantzun egokia: ' + escape(q.candidates[q.answer])) +
        '</div><div class="teusk-button-group"><button class="teusk-button" data-action="next">' +
        (state.currentIndex + 1 < state.questions.length ? 'Hurrengo galdera' : 'Ikusi emaitza') +
        '</button></div>' : '') +
      '</div>';
  }
  function storeResult() {
    const summary = core.score(state.questions, state.responses);
    const record = {
      id: crypto?.randomUUID?.() || String(Date.now()), game: 'teusk',
      label: state.selectedLevel === 0 ? 'Pertsonalizatua' : state.selectedLevel + '. sorta',
      completedAt: new Date().toISOString(), seconds: state.elapsedSeconds,
      correct: summary.correct, total: summary.total,
      questionIds: state.questions.map(q => q.id),
      selected: [...state.responses]
    };
    try {
      cloud.storage.setItem(HISTORY_KEY, JSON.stringify([record, ...history()].slice(0, 30)));
      cloud.flush?.().catch(() => {});
    } catch (e) { console.warn('TEUSK history:', e); }
  }
  function finish() {
    if (state.phase !== 'playing' || state.responses.length !== state.questions.length) return;
    state.elapsedSeconds = Math.max(0, Math.round((Date.now() - state.startedAt) / 1000));
    state.phase = 'done';
    storeResult();
    renderDone();
  }
  function renderDone() {
    const total = state.questions.length;
    const s = core.score(state.questions, state.responses);
    const wrong = state.questions.map((q, i) => ({ q, answer: state.responses[i] }))
      .filter(({ q, answer }) => answer !== q.answer);
    $.innerHTML = '<div class="teusk-panel"><span class="games-kicker">Saioa amaituta</span>' +
      '<h2>Zure emaitza</h2><div class="teusk-result-num">' + s.correct + ' / ' + total + '</div>' +
      '<p>Zuzenak: <strong>' + s.correct + '</strong> · Oker: <strong>' + s.wrong +
      '</strong> · Iraupena: ' + Math.floor(state.elapsedSeconds / 60) + ' min ' +
      state.elapsedSeconds % 60 + ' s</p>' +
      (wrong.length ? '<h3>Berrikusi huts egindako galderak</h3><ul class="teusk-review">' +
        wrong.map(({ q, answer }) => '<li><strong>' + escape(q.question) + '</strong><div>Zure aukera: ' +
          escape(q.candidates[answer] || '—') + '</div><div>Erantzun egokia: <strong>' +
          escape(q.candidates[q.answer]) + '</strong></div></li>').join('') + '</ul>' :
        '<p>Galdera guztiak asmatu dituzu!</p>') +
      '<p class="game-note">Entrenamenduaren emaitza da; ez da azterketa ofizialaren kalifikazioa.</p>' +
      '<div class="teusk-button-group"><button class="teusk-button" data-action="retry">Berriz jokatu</button>' +
      '<button class="teusk-button teusk-button--secondary" data-action="home">Beste sorta bat</button></div></div>';
  }
  $.addEventListener('input', event => {
    if (event.target.id === 'teuskCount') {
      state.customCount = Number(event.target.value);
      const output = document.getElementById('teuskCountOutput');
      if (output) output.textContent = String(state.customCount);
    }
  });
  $.addEventListener('click', event => {
    const button = event.target.closest('button[data-action]');
    if (!button || !$.contains(button)) return;
    const action = button.dataset.action;
    if (action === 'home') { renderHome(); return; }
    if (action === 'level') { start(Number(button.dataset.level)); return; }
    if (action === 'custom') { start(0); return; }
    if (action === 'retry') { start(state.selectedLevel); return; }
    if (action === 'answer' && state.phase === 'playing') {
      const index = Number(button.dataset.index);
      if (!Number.isInteger(index) || state.responses[state.currentIndex] !== undefined) return;
      if (index < 0 || index >= state.questions[state.currentIndex].candidates.length) return;
      state.responses[state.currentIndex] = index;
      renderQuestion();
      document.querySelector('.teusk-feedback')?.scrollIntoView?.({ block: 'nearest' });
      return;
    }
    if (action === 'next' && state.phase === 'playing') {
      if (state.responses[state.currentIndex] === undefined) return;
      if (state.currentIndex + 1 < state.questions.length) {
        state.currentIndex++;
        renderQuestion();
        $.querySelector('.teusk-question')?.focus?.();
      } else finish();
    }
  });
  (async () => {
    if (!cloud) { renderError('SUSTRAIren kontu-sistema ezin da kargatu.'); return; }
    try { await cloud.ready; } catch { /* allow read-only data attempt via initialized client */ }
    renderHome();
  })();
})();
