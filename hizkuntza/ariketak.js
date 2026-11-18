/* Ariketak: aukera anitzeko esaldiak, beheko feedback-panela, XP, konboak, soinua eta bibrazioa */
(function () {
  'use strict';
  var esc = HB.esc, fx = HB.fx, id = new URLSearchParams(location.search).get('u') || 'b1-5';
  var $ = function (x) { return document.getElementById(x); };
  var IC = {
    flame: '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1.5 1 2.5 2 3 3 .5-2 0-4 0-6z"/></svg>',
    check: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5L20 7"/></svg>',
    medal: '<svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="15" r="6"/><path d="M8.5 9.5 6 3h4l2 4 2-4h4l-2.5 6.5"/></svg>',
    on: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>',
    off: '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4z"/><path d="m16 9 5 6M21 9l-5 6"/></svg>'
  };
  var home = '/hizkuntza/';
  $('help').href = '/hizkuntza/gramatika/?id=leku-kasuak&u=' + encodeURIComponent(id);

  function soundBtn() { var on = fx.soundOn(); $('sound').innerHTML = on ? IC.on : IC.off; $('sound').setAttribute('aria-pressed', String(on)); }
  $('sound').addEventListener('click', function () { fx.toggle(); soundBtn(); });
  soundBtn();

  var items = [], i = 0, picked = null, checked = false, right = 0, combo = 0, gained = 0;

  function head() {
    $('pfill').style.width = Math.round(i / items.length * 100) + '%';
    $('pbar').setAttribute('aria-valuenow', i);
    var c = $('combo');
    c.innerHTML = combo >= 2 ? IC.flame + 'x' + combo : '';
    c.classList.toggle('on', combo >= 2);
  }
  function sentence() {
    var it = items[i], parts = it.s.split('___'), cls = 'hz-hole', word = '…';
    if (picked !== null) { word = it.o[picked]; cls += checked ? (picked === it.a ? ' right' : ' wrong') : ' filled'; }
    $('sentence').innerHTML = esc(parts[0]) + '<span class="' + cls + '">' + esc(word) + '</span>' + esc(parts[1] || '');
  }
  function opts() {
    var it = items[i];
    $('opts').innerHTML = it.o.map(function (o, k) {
      var cls = 'hz-opt';
      if (checked && k === it.a) cls += ' right';
      else if (checked && k === picked) cls += ' wrong';
      return '<button type="button" role="radio" class="' + cls + '" data-k="' + k + '" aria-checked="' + (k === picked) + '"' + (checked ? ' aria-disabled="true"' : '') + '>' + esc(o) + '</button>';
    }).join('');
  }
  function show() {
    picked = null; checked = false;
    $('err').hidden = true; $('fb').hidden = true; $('fb').className = 'hz-feedback'; $('bar').hidden = false;
    head(); sentence(); opts();
  }

  $('opts').addEventListener('click', function (e) {
    var b = e.target.closest('.hz-opt'); if (!b || checked) return;
    picked = Number(b.dataset.k); $('err').hidden = true; fx.tap(); sentence(); opts();
  });

  function check() {
    if (picked === null) { $('err').hidden = false; fx.shake($('opts')); return; }
    checked = true;
    var it = items[i], ok = picked === it.a, fb = $('fb');
    if (ok) {
      right++; combo++;
      var pts = 10 + (combo >= 3 ? 2 : 0);
      gained += pts; HB.addXP(pts); fx.ok();
      fb.className = 'hz-feedback ok';
      fb.innerHTML = '<div class="hz-fb-top"><span class="hz-fb-ico">' + IC.check + '</span><strong>' + ['Bikain!', 'Zuzen!', 'Hori da!', 'Ederki!'][right % 4] + '</strong><span class="hz-xp">+' + pts + ' XP</span></div><p>' + esc(it.why) + '</p><button type="button" class="hz-btn big" id="next">Jarraitu</button>';
      sentence(); opts(); head();
      fx.pop(document.querySelector('.hz-opt.right'), '+' + pts + ' XP');
      if (combo >= 2) fx.bump($('combo'));
    } else {
      combo = 0; fx.bad();
      fb.className = 'hz-feedback bad';
      fb.innerHTML = '<div class="hz-fb-top"><span class="hz-fb-ico">!</span><strong>Ia-ia!</strong></div><p>Zuzena: <strong>' + esc(it.o[it.a]) + '</strong>. ' + esc(it.why) + '</p><button type="button" class="hz-btn big" id="next">Ulertuta</button>';
      sentence(); opts(); head();
      fx.shake(document.querySelector('.hz-hole'));
    }
    $('bar').hidden = true; fb.hidden = false;
    $('next').addEventListener('click', advance);
    $('next').focus();
  }
  function advance() {
    i++;
    if (i >= items.length) return finish();
    show();
  }
  function finish() {
    $('run').hidden = true; $('bar').hidden = true; $('fb').hidden = true;
    $('pfill').style.width = '100%';
    HB.completeStep(id, 'ariketak');
    var medals = [], a = HB.award('lehen-ariketa'); if (a) medals.push(a);
    if (right >= 10) { var b = HB.award('leku-kasuak'); if (b) medals.push(b); }
    fx.win();
    var end = $('end'); end.hidden = false;
    end.innerHTML = '<span class="hz-big">' + IC.medal + '</span><h2 style="font-size:30px" tabindex="-1">' + right + ' / ' + items.length + ' asmatuta</h2>' +
      '<p class="hz-lead" style="font-size:17px">+' + gained + ' XP' + (medals.length ? ' · Domina berria: ' + medals.map(function (m) { return esc(m.name); }).join(', ') : '') + '</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center"><a class="hz-btn big" href="' + home + '">Jarraitu bidean</a><button type="button" class="hz-btn alt" id="again">Berriro egin</button></div>';
    $('again').addEventListener('click', function () { i = 0; right = 0; combo = 0; gained = 0; end.hidden = true; $('run').hidden = false; show(); });
    end.querySelector('h2').focus();
  }
  $('go').addEventListener('click', check);

  HB.unit(id).then(function (u) {
    if (!u || !u.exercises) { $('sentence').textContent = 'Ez dago ariketarik unitate honetan.'; return; }
    items = u.exercises; $('pbar').setAttribute('aria-valuemax', items.length); show();
  }).catch(function () { $('sentence').textContent = 'Ezin izan dira ariketak kargatu. Saiatu berriro.'; });
})();
