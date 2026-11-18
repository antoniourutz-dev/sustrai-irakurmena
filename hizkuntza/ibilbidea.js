/* Ibilbidea: maila, unitateak eta jolas-geruza */
(function () {
  'use strict';
  var esc = HB.esc;
  var CHECK = '<svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>';
  var LOCK = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  var FLAME = '<svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1.5 1 2.5 2 3 3 .5-2 0-4 0-6z"/></svg>';
  var MEDAL = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="15" r="6"/><path d="M8.5 9.5 6 3h4l2 4 2-4h4l-2.5 6.5"/></svg>';

  function progress(u) {
    if (!u.ready) return { done: 0, total: 0, pct: 0, complete: false };
    var d = HB.stepsDone(u.id), total = u.steps.length;
    var done = u.steps.filter(function (s) { return d.indexOf(s.id) > -1; }).length;
    return { done: done, total: total, pct: Math.round(done / total * 100), complete: done === total };
  }

  function renderGame() {
    var L = HB.level(), st = HB.streak(), wx = HB.weekXP(), goal = HB.WEEK_GOAL;
    var days = HB.weekDays().map(function (d) {
      return '<span class="hz-day' + (d.done ? ' done' : '') + (d.future ? ' future' : '') + '"' + (d.today ? ' aria-current="date"' : '') + '>' + d.name + '</span>';
    }).join('');
    document.getElementById('game').innerHTML =
      '<div class="hz-card" style="display:flex;flex-direction:column;gap:12px"><div class="hz-level"><span class="hz-level-n">' + L.n + '</span><div style="display:flex;flex-direction:column;gap:2px"><span class="hz-eyebrow" style="color:var(--s-sun-ink)">' + L.n + '. maila</span><strong style="font:600 19px var(--s-font-display)">' + esc(L.name) + '</strong></div></div>' +
      '<div class="hz-bar sun"><span style="width:' + L.pct + '%"></span></div><span class="hz-muted">' + HB.xp() + ' XP' + (L.next ? ' · ' + L.left + ' XP falta ' + esc(L.next) + ' izateko' : '') + '</span></div>' +
      '<div class="hz-card hz-streak"><div style="display:flex;align-items:center;gap:12px"><span style="display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:#fff;color:#C47A12;flex:none">' + FLAME + '</span><div style="display:flex;flex-direction:column"><strong style="font:600 19px var(--s-font-display)">' + (st === 1 ? 'Egun 1 jarraian' : st + ' egun jarraian') + '</strong><span style="font-size:13px;color:var(--s-ink-3)">' + (st ? 'Gaur ere zerbait egin bolada mantentzeko' : 'Egin ariketa bat bolada hasteko') + '</span></div></div><div class="hz-days" aria-label="Aste honetako egunak">' + days + '</div></div>' +
      '<div class="hz-card hz-week" style="display:flex;flex-direction:column;gap:10px"><span class="hz-eyebrow" style="color:var(--s-primary)">Asteko erronka</span><strong style="font:600 19px var(--s-font-display)">Lortu ' + goal + ' XP aste honetan</strong><div class="hz-bar" style="height:8px;background:#fff"><span style="width:' + Math.min(100, Math.round(wx / goal * 100)) + '%;background:var(--s-primary)"></span></div><span style="font-size:13px;color:var(--s-primary-hover)">' + Math.min(wx, goal) + ' / ' + goal + ' XP</span></div>';
    var got = HB.medals().filter(function (m) { return m.got; });
    document.getElementById('medals').innerHTML = '<strong style="font:600 17px var(--s-font-display);margin-right:6px">Lorpenak</strong>' +
      (got.length ? got.slice(-3).reverse().map(function (m) { return '<span class="hz-medal"><i>' + MEDAL + '</i>' + esc(m.name) + '</span>'; }).join('') : '<span class="hz-muted">Oraindik ez duzu dominarik. Lehena ariketa-saio batekin lortzen da.</span>') +
      '<a href="/lorpenak/" style="margin-left:auto;font-size:14px;font-weight:600;text-decoration:none">Ikusi denak</a>';
  }

  HB.content('b1').then(function (c) {
    var units = c.units, ready = units.filter(function (u) { return u.ready; });
    var complete = units.filter(function (u) { return progress(u).complete; }).length;
    document.getElementById('lvlDone').textContent = complete + ' / ' + units.length + ' unitate osatuta';
    var pct = Math.round(complete / units.length * 100);
    document.getElementById('lvlPct').textContent = pct + '%';
    document.getElementById('lvlBar').style.width = pct + '%';
    document.getElementById('unitCount').textContent = units.length + ' unitate · ' + ready.length + ' eskuragarri';

    var cur = ready.filter(function (u) { return !progress(u).complete; })[0] || ready[0];
    var p = progress(cur), cel = document.getElementById('current');
    cel.href = '/ibilbidea/unitatea/?u=' + cur.id;
    cel.innerHTML = '<span class="hz-num">' + cur.n + '</span><div style="flex:999 1 340px;display:flex;flex-direction:column;gap:6px;min-width:0"><span class="hz-eyebrow">' + (p.done ? 'Orain lantzen' : 'Hurrengoa') + ' · ' + cur.n + '. unitatea</span><h2 style="font-size:30px">' + esc(cur.title) + '</h2><span class="hz-muted" style="font-size:15px">Gramatika: ' + esc(cur.grammar) + '</span><div style="display:flex;align-items:center;gap:12px;margin-top:6px"><div class="hz-bar" style="flex:1;max-width:360px"><span style="width:' + p.pct + '%"></span></div><span class="hz-muted">' + p.done + ' / ' + p.total + ' urrats</span></div></div><span class="hz-btn" style="flex:none">' + (p.done ? 'Jarraitu' : 'Hasi') + '</span>';

    document.getElementById('units').innerHTML = units.map(function (u) {
      var q = progress(u);
      if (!u.ready) return '<div class="hz-unit soon"><div class="top"><span>' + u.n + '. unitatea</span><span class="hz-pill soon">' + LOCK + 'Laster</span></div><h3 style="color:var(--s-ink-3)">' + esc(u.title) + '</h3><span class="hz-muted">' + esc(u.grammar) + '</span></div>';
      var badge = q.complete ? '<span class="hz-pill ok">' + CHECK + 'Osatuta</span>' : '<span class="hz-pill" style="color:var(--s-accent)">' + (q.done ? 'Orain' : 'Berria') + '</span>';
      return '<a class="hz-unit' + (u.id === cur.id && !q.complete ? ' now' : '') + '" href="/ibilbidea/unitatea/?u=' + u.id + '"><div class="top"><span>' + u.n + '. unitatea</span>' + badge + '</div><h3>' + esc(u.title) + '</h3><span class="hz-muted">' + esc(u.grammar) + '</span><div class="hz-bar" style="height:3px"><span style="width:' + q.pct + '%"></span></div></a>';
    }).join('');
    renderGame();
  }).catch(function () {
    document.getElementById('units').innerHTML = '<p class="hz-muted">Ezin izan dira unitateak kargatu. Egiaztatu konexioa eta saiatu berriro.</p>';
    renderGame();
  });
})();
