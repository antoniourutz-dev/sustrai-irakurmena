/* Unitatea: urratsak, hitzak eta saria */
(function () {
  'use strict';
  var esc = HB.esc;
  var id = new URLSearchParams(location.search).get('u') || 'b1-5';
  var CHECK = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>';
  var MEDAL = '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="15" r="6"/><path d="M8.5 9.5 6 3h4l2 4 2-4h4l-2.5 6.5"/></svg>';

  HB.unit(id).then(function (u) {
    if (!u || !u.ready) {
      document.getElementById('hero').innerHTML = '<div class="hz-hero-main"><span class="hz-eyebrow">Laster</span><h1 id="pageTitle">' + (u ? esc(u.title) : 'Unitatea ez da aurkitu') + '</h1><p class="hz-lead">Unitate hau prestatzen ari gara.</p></div>';
      return;
    }
    document.title = u.title + ' · HitzBira';
    var done = HB.stepsDone(u.id);
    var n = u.steps.filter(function (s) { return done.indexOf(s.id) > -1; }).length;
    var pct = Math.round(n / u.steps.length * 100);
    var next = u.steps.filter(function (s) { return done.indexOf(s.id) === -1; })[0];

    if (!next && done.indexOf('osatuta') === -1) {
      HB.completeStep(u.id, 'osatuta');
      HB.addXP(u.reward || 0);
      var m = HB.award('unitatea-' + u.id);
      HB.toast('Unitatea osatuta! <b>+' + (u.reward || 0) + ' XP</b>' + (m ? ' · Domina: ' + esc(m.name) : ''));
    }

    document.getElementById('hero').innerHTML =
      '<div class="hz-hero-main"><span class="hz-eyebrow">' + esc(u.id.split('-')[0].toUpperCase()) + ' · ' + u.n + '. unitatea</span><h1 id="pageTitle">' + esc(u.title) + '</h1><p class="hz-lead">' + esc(u.lead || '') + '</p></div>' +
      '<div class="hz-hero-side"><div style="display:flex;justify-content:space-between;font-size:14px;color:var(--s-ink-3)"><span>' + n + ' / ' + u.steps.length + ' urrats</span><span style="color:var(--s-primary);font-weight:600">' + pct + '%</span></div><div class="hz-bar"><span style="width:' + pct + '%"></span></div>' +
      '<span style="display:inline-flex;align-items:center;gap:8px;font-size:13px;color:var(--s-sun-ink);font-weight:500"><span style="display:grid;place-items:center;width:26px;height:26px;border-radius:50%;background:var(--s-sun);color:var(--s-ink)">' + MEDAL + '</span>Unitatea osatzean: +' + (u.reward || 0) + ' XP eta domina</span>' +
      (next ? '<a class="hz-btn" href="' + esc(next.href) + '">' + (n ? 'Jarraitu: ' : 'Hasi: ') + esc(next.label.toLowerCase()) + '</a>' : '<span class="hz-pill ok" style="align-self:flex-start;font-size:14px;padding:8px 14px">' + CHECK + 'Unitatea osatuta</span>') + '</div>';

    document.getElementById('steps').innerHTML = u.steps.map(function (s, i) {
      var isDone = done.indexOf(s.id) > -1, isNext = next && s.id === next.id;
      return '<a class="hz-step' + (isDone ? ' done' : '') + (isNext ? ' next' : '') + '" href="' + esc(s.href) + '"><span class="ico">' + (isDone ? CHECK : (i + 1)) + '</span><span class="body"><span class="lbl">' + (i + 1) + ' · ' + esc(s.label) + '</span><strong>' + esc(s.title) + '</strong><span class="hz-muted">' + esc(s.meta) + '</span></span>' +
        (isDone ? '<span style="color:var(--s-primary);font-size:13px;font-weight:600">Eginda</span>' : (isNext ? '<span class="hz-btn" style="min-height:44px;padding:0 18px">Hasi</span>' : '')) + '</a>';
    }).join('');

    document.getElementById('wordCount').textContent = u.words.length;
    document.getElementById('words').innerHTML = u.words.map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('');
    document.getElementById('reward').textContent = 'Urrats guztiak egitean: +' + (u.reward || 0) + ' XP eta «' + ((HB.medals().filter(function (m) { return m.id === 'unitatea-' + u.id; })[0] || {}).name || 'unitateko') + '» domina.';
  }).catch(function () {
    document.getElementById('hero').innerHTML = '<p class="hz-muted">Ezin izan da unitatea kargatu. Saiatu berriro.</p>';
  });
})();
