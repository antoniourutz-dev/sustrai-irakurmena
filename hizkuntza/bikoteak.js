/* Bikoteak: sinonimoak lotzeko jolasa */
(function () {
  'use strict';
  var esc = HB.esc, fx = HB.fx, id = new URLSearchParams(location.search).get('u') || 'b1-5';
  var $ = function (x) { return document.getElementById(x); };
  var MEDAL = '<svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="15" r="6"/><path d="M8.5 9.5 6 3h4l2 4 2-4h4l-2.5 6.5"/></svg>';
  var unitHref = '/hizkuntza/';
  var ON = '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>';
  var OFF = '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6M21 9l-5 6"/></svg>';
  function soundBtn() { var on = fx.soundOn(); $('sound').innerHTML = on ? ON : OFF; $('sound').setAttribute('aria-pressed', String(on)); }
  $('sound').addEventListener('click', function () { fx.toggle(); soundBtn(); });
  soundBtn();

  var words = [], total = 0, sel = null, done = {}, busy = false, gained = 0, combo = 0, t0 = 0, tick = null;

  function shuffle(a) { for (var k = a.length - 1; k > 0; k--) { var j = Math.floor(Math.random() * (k + 1)); var x = a[k]; a[k] = a[j]; a[j] = x; } return a; }
  function count() { return Object.keys(done).length; }
  function stats() {
    $('pairs').textContent = count() + ' / ' + total;
    $('gain').textContent = '+' + gained + ' XP';
    $('gbar').style.width = Math.round(count() / total * 100) + '%';
  }
  function clock() {
    var s = Math.floor((Date.now() - t0) / 1000);
    $('timer').textContent = Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }
  function draw() {
    $('tiles').innerHTML = words.map(function (w, k) {
      var m = done[w.p], cls = 'hz-tile' + (m ? ' matched' : '') + (w.miss ? ' miss' : '');
      return '<button type="button" class="' + cls + '" data-k="' + k + '" aria-pressed="' + (sel === k) + '"' + (m ? ' aria-disabled="true"' : '') + '>' + esc(w.w) + '</button>';
    }).join('');
  }
  function finish() {
    clearInterval(tick);
    HB.completeStep(id, 'bikoteak');
    var bonus = 20; gained += bonus; HB.addXP(bonus); fx.win();
    var m = HB.award('sinonimo-ehiztaria');
    stats();
    var end = $('end'); end.hidden = false;
    end.innerHTML = '<span class="hz-big">' + MEDAL + '</span><h2 style="font-size:28px" tabindex="-1">Bikote guztiak aurkitu dituzu</h2><p class="hz-lead" style="font-size:17px">' + $('timer').textContent + ' · +' + gained + ' XP' + (m ? ' · Domina berria: ' + esc(m.name) : '') + '</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center"><a class="hz-btn big" href="' + unitHref + '">Jarraitu bidean</a><button type="button" class="hz-btn alt" id="again">Berriro jokatu</button></div>';
    end.querySelector('h2').focus();
    $('again').addEventListener('click', start);
  }
  $('tiles').addEventListener('click', function (e) {
    var b = e.target.closest('.hz-tile'); if (!b || busy) return;
    var k = Number(b.dataset.k), w = words[k];
    if (done[w.p] || sel === k) return;
    if (sel === null) { sel = k; fx.tap(); draw(); return; }
    var a = words[sel];
    if (a.p === w.p) {
      done[w.p] = 1; sel = null; combo++;
      var pts = 10 + (combo >= 3 ? 5 : 0); gained += pts; HB.addXP(pts);
      draw(); stats(); fx.ok();
      fx.pop($('tiles').querySelector('[data-k="' + k + '"]'), '+' + pts);
      fx.bump($('gain'));
      if (count() === total) finish();
    } else {
      combo = 0; a.miss = w.miss = true; sel = null; busy = true; draw(); fx.bad();
      setTimeout(function () { a.miss = w.miss = false; busy = false; draw(); }, 650);
    }
  });
  var pairs = [];
  function start() {
    $('end').hidden = true; done = {}; sel = null; gained = 0; combo = 0;
    words = shuffle(pairs.reduce(function (acc, p, k) { acc.push({ w: p[0], p: k }, { w: p[1], p: k }); return acc; }, []));
    total = pairs.length; t0 = Date.now(); clearInterval(tick); tick = setInterval(clock, 1000); clock();
    draw(); stats();
  }
  HB.unit(id).then(function (u) {
    if (!u || !u.pairs) { $('tiles').textContent = 'Ez dago jolasik unitate honetan.'; return; }
    pairs = u.pairs; start();
  }).catch(function () { $('tiles').textContent = 'Ezin izan da jolasa kargatu. Saiatu berriro.'; });
})();
