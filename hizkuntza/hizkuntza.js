/* Hizkuntza: unitateko bidea (eskuragarri dauden unitateak bakarrik), maila eta bolada */
(function () {
  'use strict';
  var esc = HB.esc, $ = function (x) { return document.getElementById(x); };
  var IC = {
    check: '<path d="M5 12l5 5L20 7"/>',
    read: '<path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2zM12 6v14"/>',
    grammar: '<path d="M4 19 9 5l5 14M6 14h6"/><path d="M15 12h6M18 9v10"/>',
    practice: '<path d="M4 20l4-1L19 8l-3-3L5 16l-1 4zM14 7l3 3"/>',
    game: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    medal: '<circle cx="12" cy="15" r="6"/><path d="M8.5 9.5 6 3h4l2 4 2-4h4l-2.5 6.5"/>',
    flame: '<path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1.5 1 2.5 2 3 3 .5-2 0-4 0-6z"/>'
  };
  function svg(k, w, sw) { return '<svg aria-hidden="true" width="' + w + '" height="' + w + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (sw || 2) + '" stroke-linecap="round" stroke-linejoin="round">' + IC[k] + '</svg>'; }

  var st = HB.streak();
  $('flame').innerHTML = svg('flame', 18, 2.2) + '<span>' + st + '</span>';
  $('flame').setAttribute('aria-label', st + ' egun jarraian. Ikusi lorpenak');

  HB.content('b1').then(function (c) {
    var u = c.units.filter(function (x) { return x.ready; })[0];
    if (!u) return;
    var done = HB.stepsDone(u.id);
    var next = u.steps.filter(function (s) { return done.indexOf(s.id) === -1; })[0];
    var n = u.steps.filter(function (s) { return done.indexOf(s.id) > -1; }).length;

    if (!next && done.indexOf('osatuta') === -1) {
      HB.completeStep(u.id, 'osatuta');
      HB.addXP(u.reward || 0);
      var m = HB.award('unitatea-' + u.id);
      HB.fx.win();
      HB.toast('Unitatea osatuta! <b>+' + (u.reward || 0) + ' XP</b>' + (m ? ' · ' + esc(m.name) : ''));
      done = HB.stepsDone(u.id);
    }
    var total = u.steps.length, circ = 2 * Math.PI * 21, arc = Math.round(circ * n / total);
    $('band').innerHTML = '<span class="hz-band-deco" aria-hidden="true"></span><div class="hz-band-text"><span>' + esc(u.id.split('-')[0].toUpperCase()) + ' · ' + u.n + '. unitatea</span><h2>' + esc(u.title) + '</h2><p>' + esc(u.grammar) + '</p></div>' +
      '<svg class="hz-band-ring" role="img" aria-label="' + n + ' / ' + total + ' urrats" width="60" height="60" viewBox="0 0 52 52"><circle cx="26" cy="26" r="21" fill="none" stroke="rgb(255 255 255 / .18)" stroke-width="6"/><circle cx="26" cy="26" r="21" fill="none" stroke="#F2A93B" stroke-width="6" stroke-linecap="round" stroke-dasharray="' + arc + ' ' + Math.round(circ) + '" transform="rotate(-90 26 26)"/><text x="26" y="31" text-anchor="middle" font-family="Inter, sans-serif" font-size="13" font-weight="700" fill="#fff">' + n + '/' + total + '</text></svg>';

    var items = u.steps.map(function (s, i) {
      var isDone = done.indexOf(s.id) > -1, isNext = next && s.id === next.id;
      var cls = 'hz-node ' + (isDone ? 'done' : isNext ? 'now' : 'todo');
      return '<li class="hz-stop" style="--x:' + [0, 1, 0, -1][i % 4] + '"><a class="' + cls + '" href="' + esc(s.href) + '" aria-label="' + esc(s.label + ': ' + s.title) + (isDone ? ', eginda' : isNext ? ', orain' : '') + '">' + svg(isDone ? 'check' : s.kind, isNext ? 34 : 26, isDone ? 2.8 : 2) + '</a>' +
        '<span class="hz-stop-label"><strong>' + esc(s.title) + '</strong><span>' + (isNext ? '<b>' + (n ? 'Jarraitu' : 'Hasi') + '</b> · ' : '') + esc(s.meta) + '</span></span></li>';
    });
    var all = !next;
    items.push('<li class="hz-stop" style="--x:0"><span class="hz-node chest' + (all ? ' got' : '') + '">' + svg('medal', 30) + '</span><span class="hz-stop-label"><strong>' + (all ? 'Domina lortuta' : 'Saria') + '</strong><span>+' + (u.reward || 0) + ' XP eta domina</span></span></li>');
    $('path').innerHTML = items.join('');

    var L = HB.level();
    var days = HB.weekDays().map(function (d) { return '<span class="hz-day' + (d.done ? ' done' : '') + (d.future ? ' future' : '') + '">' + d.name + '</span>'; }).join('');
    $('side').innerHTML = '<a class="hz-card hz-side-card" href="/lorpenak/"><div class="hz-level"><span class="hz-level-n">' + L.n + '</span><div style="flex:1;display:flex;flex-direction:column;gap:6px"><div style="display:flex;justify-content:space-between;font-size:13px"><strong style="font-weight:600">' + esc(L.name) + '</strong><span class="hz-muted" style="font-size:13px">' + (L.next ? L.left + ' XP falta' : 'Goreneko maila') + '</span></div><div class="hz-bar sun"><span style="width:' + L.pct + '%"></span></div></div></div>' +
      '<div class="hz-days" aria-label="Aste honetako egunak">' + days + '</div><span class="hz-side-link">Ikusi lorpenak</span></a>';
  }).catch(function () { $('path').innerHTML = '<li class="hz-muted">Ezin izan da edukia kargatu. Saiatu berriro.</li>'; });
})();
