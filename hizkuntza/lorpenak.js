/* Lorpenak: maila, bolada, asteko erronka eta dominak */
(function () {
  'use strict';
  var esc = HB.esc, $ = function (x) { return document.getElementById(x); };
  var MEDAL = '<svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="15" r="6"/><path d="M8.5 9.5 6 3h4l2 4 2-4h4l-2.5 6.5"/></svg>';
  var LOCK = '<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  var L = HB.level(), r = 36, c = 2 * Math.PI * r, arc = Math.round(c * L.pct / 100);
  $('lvl').innerHTML = '<svg class="hz-ring" role="img" aria-label="' + L.n + '. maila, ' + L.pct + '%" width="88" height="88" viewBox="0 0 84 84"><circle cx="42" cy="42" r="' + r + '" fill="none" stroke="#F3E9D2" stroke-width="8"/><circle cx="42" cy="42" r="' + r + '" fill="none" stroke="#F2A93B" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + arc + ' ' + Math.round(c) + '" transform="rotate(-90 42 42)"/><text x="42" y="50" text-anchor="middle" font-family="Sustrai Serif, Georgia, serif" font-size="26" font-weight="700" fill="#22261F">' + L.n + '</text></svg>' +
    '<div style="display:flex;flex-direction:column;gap:4px"><span class="hz-eyebrow" style="color:var(--s-sun-ink)">' + L.n + '. maila</span><h2 style="font-size:26px">' + esc(L.name) + '</h2><span class="hz-muted">' + HB.xp() + ' XP' + (L.next ? ' · ' + L.left + ' falta ' + esc(L.next) + ' izateko' : '') + '</span></div>';
  var learned = HB.medals().filter(function (m) { return m.got; }).length;
  function stat(n, label, bg, fg) { return '<div style="padding:14px 10px;border-radius:14px;background:' + bg + ';text-align:center;display:flex;flex-direction:column;gap:2px"><strong style="font:700 24px var(--s-font-display)">' + n + '</strong><span style="font-size:12px;color:' + fg + '">' + label + '</span></div>'; }
  $('stats').innerHTML = stat(HB.streak(), 'egun jarraian', 'var(--s-sun-soft)', '#4A3210') + stat(HB.xp(), 'XP guztira', 'var(--s-primary-soft)', 'var(--s-primary-hover)') + stat(learned, 'domina', '#F2EFE7', 'var(--s-ink-3)');
  var wx = HB.weekXP(), g = HB.WEEK_GOAL;
  $('week').innerHTML = '<span class="hz-eyebrow" style="color:var(--s-primary)">Asteko erronka</span><strong style="font:600 18px var(--s-font-display)">Lortu ' + g + ' XP aste honetan</strong><div class="hz-bar" style="height:8px;background:#fff"><span style="width:' + Math.min(100, Math.round(wx / g * 100)) + '%;background:var(--s-primary)"></span></div><span style="font-size:13px;color:var(--s-primary-hover)">' + Math.min(wx, g) + ' / ' + g + ' XP</span>';
  var ms = HB.medals();
  $('mcount').textContent = learned + ' / ' + ms.length;
  $('badges').innerHTML = ms.map(function (m) {
    return '<div class="hz-badge' + (m.got ? '' : ' locked') + '"><i>' + (m.got ? MEDAL : LOCK) + '</i><strong style="font-weight:600">' + esc(m.name) + '</strong><small>' + esc(m.desc) + '</small></div>';
  }).join('');
})();
