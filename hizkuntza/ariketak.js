/* Ariketak: aukera anitzeko esaldiak, feedback-a, XP eta konboak */
(function () {
  'use strict';
  var esc = HB.esc, id = new URLSearchParams(location.search).get('u') || 'b1-5';
  var $ = function (x) { return document.getElementById(x); };
  var FLAME = '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-7 1.5 1 2.5 2 3 3 .5-2 0-4 0-6z"/></svg>';
  var MEDAL = '<svg aria-hidden="true" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="15" r="6"/><path d="M8.5 9.5 6 3h4l2 4 2-4h4l-2.5 6.5"/></svg>';
  var unitHref = '/ibilbidea/unitatea/?u=' + encodeURIComponent(id);
  $('back').href = unitHref;
  $('help').href = '/hizkuntza/gramatika/?id=leku-kasuak&u=' + encodeURIComponent(id);

  var items = [], i = 0, picked = null, checked = false, right = 0, combo = 0, gained = 0;

  function head() {
    $('pfill').style.width = Math.round(i / items.length * 100) + '%';
    $('pbar').setAttribute('aria-valuenow', i);
    $('pcount').textContent = Math.min(i + 1, items.length) + ' / ' + items.length;
    $('xpNow').textContent = '+' + gained + ' XP';
    var c = $('combo');
    if (combo >= 2) { c.hidden = false; c.innerHTML = FLAME + 'x' + combo + ' konboa'; } else c.hidden = true;
  }

  function sentence() {
    var it = items[i], parts = it.s.split('___');
    var cls = 'hz-hole', word = '…';
    if (picked !== null) { word = it.o[picked]; cls += checked ? (picked === it.a ? ' right' : ' wrong') : ' filled'; }
    $('sentence').innerHTML = esc(parts[0]) + '<span class="' + cls + '">' + esc(word) + '</span>' + esc(parts[1] || '');
  }

  function opts() {
    var it = items[i];
    $('opts').innerHTML = it.o.map(function (o, k) {
      var cls = 'hz-opt';
      if (checked && k === it.a) cls += ' right';
      else if (checked && k === picked) cls += ' wrong';
      return '<button type="button" role="radio" class="' + cls + '" data-k="' + k + '" aria-checked="' + (k === picked && !checked) + '"' + (checked ? ' aria-disabled="true"' : '') + '>' + esc(o) + '</button>';
    }).join('');
  }

  function show() {
    picked = null; checked = false;
    $('err').hidden = true; $('fb').innerHTML = '';
    $('go').textContent = 'Egiaztatu';
    head(); sentence(); opts();
  }

  $('opts').addEventListener('click', function (e) {
    var b = e.target.closest('.hz-opt'); if (!b || checked) return;
    picked = Number(b.dataset.k); $('err').hidden = true; sentence(); opts();
  });

  function check() {
    if (picked === null) { $('err').hidden = false; return; }
    checked = true;
    var it = items[i], ok = picked === it.a;
    if (ok) {
      right++; combo++;
      var pts = 10 + (combo >= 3 ? 2 : 0);
      gained += pts; HB.addXP(pts);
      $('fb').innerHTML = '<div class="hz-fb ok"><div style="flex:1"><strong>Zuzen!</strong>' + esc(it.why) + '</div><span class="hz-pill sun" style="font-size:14px;padding:6px 12px">+' + pts + ' XP' + (combo >= 3 ? ' · x' + combo : '') + '</span></div>';
    } else {
      combo = 0;
      $('fb').innerHTML = '<div class="hz-fb bad"><div><strong>Ez da hori</strong>Erantzun zuzena: <em>' + esc(it.o[it.a]) + '</em>. ' + esc(it.why) + '</div></div>';
    }
    $('go').textContent = i + 1 < items.length ? 'Hurrengoa' : 'Amaitu';
    head(); sentence(); opts();
  }

  function finish() {
    $('run').hidden = true;
    $('pfill').style.width = '100%';
    HB.completeStep(id, 'ariketak');
    var medals = [];
    var a = HB.award('lehen-ariketa'); if (a) medals.push(a);
    if (right >= 10) { var b = HB.award('leku-kasuak'); if (b) medals.push(b); }
    var end = $('end'); end.hidden = false;
    end.innerHTML = '<span class="hz-big">' + MEDAL + '</span><h2 style="font-size:28px">' + right + ' / ' + items.length + ' asmatuta</h2>' +
      '<p class="hz-lead" style="font-size:17px">+' + gained + ' XP' + (medals.length ? ' · Domina berria: ' + medals.map(function (m) { return esc(m.name); }).join(', ') : '') + '</p>' +
      '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center"><a class="hz-btn" href="' + unitHref + '">Itzuli unitatera</a><button type="button" class="hz-btn alt" id="again">Berriro egin</button></div>';
    $('again').addEventListener('click', function () { i = 0; right = 0; combo = 0; gained = 0; end.hidden = true; $('run').hidden = false; show(); });
    end.querySelector('h2').setAttribute('tabindex', '-1'); end.querySelector('h2').focus();
  }

  $('go').addEventListener('click', function () {
    if (!checked) return check();
    i++;
    if (i >= items.length) return finish();
    show();
  });

  HB.unit(id).then(function (u) {
    if (!u || !u.exercises) { $('sentence').textContent = 'Ez dago ariketarik unitate honetan.'; return; }
    items = u.exercises; $('pbar').setAttribute('aria-valuemax', items.length); show();
  }).catch(function () { $('sentence').textContent = 'Ezin izan dira ariketak kargatu. Saiatu berriro.'; });
})();
