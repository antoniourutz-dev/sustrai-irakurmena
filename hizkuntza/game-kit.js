/* HitzBira · jolas-geruza (XP, bolada, dominak, unitateen aurrerapena).
   Gailuan gordetzen da (localStorage). Kontuarekin sinkronizatzea hurrengo urratsa da (sr_* taulak). */
(function () {
  'use strict';
  var KEY = 'hb-game-v1';
  var STEP = 200;
  var LEVELS = ['Hasiberria', 'Ikaslea', 'Galdezalea', 'Irakurlea', 'Hiztuna', 'Ibiltaria', 'Bidaiaria', 'Esploratzailea', 'Jakintsua', 'Maisua'];
  var WEEK_GOAL = 300;
  var MEDALS = [
    { id: 'lehen-ariketa', name: 'Lehen pausoa', desc: 'Lehen ariketa-saioa amaitu' },
    { id: 'leku-kasuak', name: 'Leku-kasuen maisua', desc: 'Leku-kasuetako ariketetan 10 edo gehiago asmatu' },
    { id: 'sinonimo-ehiztaria', name: 'Sinonimo-ehiztaria', desc: 'Bikoteak jolasa osatu' },
    { id: 'unitatea-b1-5', name: 'Bidaiari trebea', desc: 'B1eko 5. unitatea osatu' },
    { id: 'bolada-7', name: 'Astebeteko bolada', desc: '7 egun jarraian ikasi' },
    { id: 'xp-500', name: '500 XP', desc: '500 XP lortu' }
  ];

  function blank() { return { xp: 0, days: [], medals: [], steps: {}, week: {} }; }
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (!s || typeof s !== 'object') return blank();
      var b = blank();
      for (var k in b) if (s[k] === undefined) s[k] = b[k];
      return s;
    } catch (e) { return blank(); }
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* gailuak ez du uzten: saioan bakarrik */ } }
  function fmt(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function weekId(date) {
    var d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    var day = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - day);
    var y = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return d.getUTCFullYear() + '-W' + Math.ceil(((d - y) / 864e5 + 1) / 7);
  }

  var state = load();

  function touchDay() {
    var t = fmt(new Date());
    if (state.days.indexOf(t) === -1) { state.days.push(t); if (state.days.length > 400) state.days = state.days.slice(-400); }
  }
  function streak() {
    var set = {}; state.days.forEach(function (d) { set[d] = 1; });
    var d = new Date(), n = 0;
    if (!set[fmt(d)]) d.setDate(d.getDate() - 1);
    while (set[fmt(d)]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  }
  function weekDays() {
    var set = {}; state.days.forEach(function (d) { set[d] = 1; });
    var now = new Date(), dow = (now.getDay() + 6) % 7, out = [];
    var names = ['Al', 'Ar', 'Az', 'Og', 'Ol', 'La', 'Ig'];
    for (var i = 0; i < 7; i++) {
      var d = new Date(now); d.setDate(now.getDate() - dow + i);
      out.push({ name: names[i], done: !!set[fmt(d)], today: i === dow, future: i > dow });
    }
    return out;
  }
  function level() {
    var i = Math.min(Math.floor(state.xp / STEP), LEVELS.length - 1);
    var into = state.xp - i * STEP;
    var last = i === LEVELS.length - 1;
    return { n: i + 1, name: LEVELS[i], next: last ? null : LEVELS[i + 1], into: last ? STEP : into, step: STEP, left: last ? 0 : STEP - into, pct: last ? 100 : Math.round(into / STEP * 100) };
  }
  function weekXP() { return state.week[weekId(new Date())] || 0; }
  function award(id) {
    if (state.medals.indexOf(id) > -1) return null;
    state.medals.push(id); save(state);
    return MEDALS.filter(function (m) { return m.id === id; })[0] || null;
  }
  function checkAuto() {
    var got = [];
    if (streak() >= 7) { var a = award('bolada-7'); if (a) got.push(a); }
    if (state.xp >= 500) { var b = award('xp-500'); if (b) got.push(b); }
    return got;
  }
  function addXP(n) {
    var before = level().n;
    state.xp += n;
    var w = weekId(new Date()); state.week[w] = (state.week[w] || 0) + n;
    touchDay(); save(state);
    return { xp: state.xp, levelUp: level().n > before, medals: checkAuto() };
  }
  function completeStep(unit, step) {
    var list = state.steps[unit] || (state.steps[unit] = []);
    if (list.indexOf(step) === -1) list.push(step);
    touchDay(); save(state);
  }
  function stepsDone(unit) { return (state.steps[unit] || []).slice(); }


  /* ---- Feedback: soinu laburrak (WebAudio), bibrazioa eta animazio txikiak ---- */
  var SKEY = 'hb-sound', ctx = null;
  function soundOn() { try { return localStorage.getItem(SKEY) !== 'off'; } catch (e) { return true; } }
  function tone(freqs, dur, type, gain) {
    if (!soundOn()) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      var t = ctx.currentTime;
      freqs.forEach(function (f, i) {
        var o = ctx.createOscillator(), g = ctx.createGain(), st = t + i * dur * 0.8;
        o.type = type || 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, st); g.gain.exponentialRampToValueAtTime(gain || 0.12, st + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, st + dur);
        o.connect(g); g.connect(ctx.destination); o.start(st); o.stop(st + dur + 0.02);
      });
    } catch (e) { /* audiorik gabe */ }
  }
  function buzz(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) { } }
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var FX = {
    ok: function () { tone([660, 880], 0.14, 'sine', 0.1); buzz(12); },
    bad: function () { tone([220, 185], 0.16, 'triangle', 0.08); buzz([30, 40, 30]); },
    tap: function () { tone([520], 0.05, 'sine', 0.04); },
    win: function () { tone([523, 659, 784, 1047], 0.16, 'sine', 0.1); buzz([20, 40, 20, 40, 60]); },
    soundOn: soundOn,
    toggle: function () { var on = !soundOn(); try { localStorage.setItem(SKEY, on ? 'on' : 'off'); } catch (e) { } return on; },
    pop: function (anchor, text) {
      if (!anchor) return;
      var r = anchor.getBoundingClientRect(), el = document.createElement('span');
      el.className = 'hz-pop'; el.textContent = text; el.setAttribute('aria-hidden', 'true');
      el.style.left = (r.left + r.width / 2) + 'px'; el.style.top = (r.top + window.scrollY) + 'px';
      document.body.appendChild(el);
      setTimeout(function () { el.remove(); }, reduced ? 600 : 1000);
    },
    bump: function (el) { if (!el || reduced) return; el.classList.remove('hz-bump'); void el.offsetWidth; el.classList.add('hz-bump'); },
    shake: function (el) { if (!el || reduced) return; el.classList.remove('hz-shake'); void el.offsetWidth; el.classList.add('hz-shake'); }
  };

  window.HB = {
    fx: FX,
    addXP: addXP, award: award, completeStep: completeStep, stepsDone: stepsDone,
    level: level, streak: streak, weekDays: weekDays, weekXP: weekXP, WEEK_GOAL: WEEK_GOAL,
    medals: function () { return MEDALS.map(function (m) { return { id: m.id, name: m.name, desc: m.desc, got: state.medals.indexOf(m.id) > -1 }; }); },
    xp: function () { return state.xp; },
    content: function (level) {
      return fetch('/hizkuntza/edukia/' + level + '.json', { cache: 'no-cache' }).then(function (r) { if (!r.ok) throw new Error('edukia'); return r.json(); });
    },
    unit: function (id) {
      var lvl = String(id || '').split('-')[0] || 'b1';
      return HB.content(lvl).then(function (c) { return c.units.filter(function (u) { return u.id === id; })[0] || null; });
    },
    esc: function (t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); },
    toast: function (html) {
      var el = document.createElement('div'); el.className = 'hz-toast'; el.setAttribute('role', 'status'); el.innerHTML = html;
      document.body.appendChild(el);
      setTimeout(function () { el.classList.add('out'); }, 2600);
      setTimeout(function () { el.remove(); }, 3100);
    }
  };
})();
