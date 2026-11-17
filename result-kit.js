/* SUSTRAI · reading result, shared by the IVAP and HABE workshops.
   SustraiResult.summary(data) returns the HTML of the end-of-exam summary.
   SustraiResult.gridClass(state) names the colour of a question number once its exercise is graded.
   SustraiResult.partLine(data) is the one-line score of a graded exercise.
   data = {
     score, max, pass,                 // points
     correct, total, wrong, blank,     // questions
     elapsedMs,                        // null when the stopwatch was never started
     previous: {score, elapsedMs}|null,
     parts: [{type, title, correct, total, wrong, blank, points, maxPoints, tip}],
     mode: 'practice'|'simulation'
   } */
(() => {
  'use strict';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const num = (x) => (Math.round(Number(x) * 10) / 10).toFixed(1).replace('.', ',').replace(/,0$/, '');
  const clock = (ms) => {
    const s = Math.round(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    return h ? h + ' h ' + String(m).padStart(2, '0') + ' min' : m + ' min ' + String(r).padStart(2, '0') + ' s';
  };
  const TYPE = { fill: 'Hutsuneak', mcq: 'Ulermena', fragments: 'Testu zatiak', synonyms: 'Sinonimoak' };
  const typeLabel = (t) => TYPE[t] || 'Ariketa';

  function summary(d) {
    const pct = d.max ? Math.max(0, Math.min(1, d.score / d.max)) : 0;
    const passPct = d.max ? d.pass / d.max : 0.5;
    let html = '';

    // Score, verdict and where the pass mark sits
    html += '<div class="rs-head"><p class="rs-score"><strong>' + num(d.score) + '</strong><span>/ ' + num(d.max) + ' puntu</span></p>' +
      '<span class="rs-badge ' + (d.score >= d.pass ? 'pass' : 'fail') + '">' + (d.score >= d.pass ? 'Gaindituta' : 'Ez gaindituta') + '</span></div>';
    html += '<div class="rs-bar" role="img" aria-label="' + num(d.score) + ' puntu ' + num(d.max) + 'etik; gutxienekoa ' + num(d.pass) + '">' +
      '<span class="' + (d.score >= d.pass ? 'pass' : 'fail') + '" style="width:' + (pct * 100).toFixed(1) + '%"></span><i style="left:' + (passPct * 100).toFixed(1) + '%"></i></div>';
    const gap = d.pass - d.score;
    html += '<p class="rs-note">' + (gap > 0 ? 'Gainditzeko ' + num(gap) + ' puntu falta dira (gutxienekoa: ' + num(d.pass) + ').' : 'Gutxienekoa: ' + num(d.pass) + ' puntu.');
    if (d.previous && Number.isFinite(Number(d.previous.score))) {
      const delta = Math.round((d.score - d.previous.score) * 10) / 10;
      html += ' <span class="rs-delta ' + (delta > 0 ? 'up' : delta < 0 ? 'down' : '') + '">' +
        (delta > 0 ? '+' + num(delta) + ' puntu aurreko saiakerarekin alderatuta' : delta < 0 ? '−' + num(-delta) + ' puntu aurreko saiakerarekin alderatuta' : 'Aurreko saiakeraren puntu berak') + '</span>';
    }
    html += '</p>';

    // Four facts
    const facts = [
      ['Zuzenak', d.correct + ' / ' + d.total],
      ['Okerrak', String(d.wrong)],
      ['Hutsik', String(d.blank)],
      ['Denbora', d.elapsedMs ? clock(d.elapsedMs) : 'Neurtu gabe']
    ];
    html += '<dl class="rs-facts">' + facts.map(([k, v]) => '<div><dt>' + k + '</dt><dd>' + esc(v) + '</dd></div>').join('') + '</dl>';

    // Exercise by exercise
    html += '<h3 class="rs-title">Ariketaz ariketa</h3><ol class="rs-parts">' + d.parts.map((p, i) => {
      const r = p.total ? p.correct / p.total : 0;
      const bits = [];
      if (p.wrong) bits.push(p.wrong + ' oker');
      if (p.blank) bits.push(p.blank + ' hutsik');
      bits.push(num(p.points) + ' / ' + num(p.maxPoints) + ' puntu');
      return '<li><div class="rs-part-head"><span><b>' + (i + 1) + ' · ' + typeLabel(p.type) + '</b>' + (String(p.title || '').trim().toLowerCase() === typeLabel(p.type).toLowerCase() ? '' : ' ' + esc(p.title)) + '</span><strong>' + p.correct + '/' + p.total + '</strong></div>' +
        '<div class="rs-mini"><span class="' + (r < 0.5 ? 'low' : '') + '" style="width:' + (r * 100).toFixed(1) + '%"></span></div>' +
        '<small>' + bits.join(' · ') + '</small></li>';
    }).join('') + '</ol>';

    // One concrete thing to work on: the exercise with the lowest share of right answers
    const weakest = d.parts.map((p, i) => ({ ...p, i, r: p.total ? p.correct / p.total : 1 }))
      .filter((p) => p.r < 1).sort((a, b) => a.r - b.r || (b.wrong + b.blank) - (a.wrong + a.blank))[0];
    if (weakest) {
      html += '<div class="rs-focus"><strong>Hobetzeko: ' + (weakest.i + 1) + '. ariketa, ' + typeLabel(weakest.type) + ' (' + weakest.correct + '/' + weakest.total + ')</strong><p>' + esc(weakest.tip) + '</p></div>';
    } else {
      html += '<div class="rs-focus good"><strong>Bikain: galdera guztiak zuzen.</strong><p>Probatu simulazio-moduan, denbora-presioarekin.</p></div>';
    }
    if (d.mode === 'simulation') html += '<p class="rs-note">Simulazioan ez da soluziorik erakusten; akatsak berrikus ditzakezu zein galdera huts egin dituzun jakiteko.</p>';
    return html;
  }

  function gridClass(state) { return state === 'ok' ? 'q-ok' : state === 'bad' ? 'q-bad' : state === 'blank' ? 'q-blank' : ''; }

  function partLine(d) {
    return '<strong>' + d.correct + ' / ' + d.total + ' zuzen</strong> · ' + num(d.points) + ' / ' + num(d.maxPoints) + ' puntu' +
      (d.blank ? ' · ' + d.blank + ' hutsik' : '');
  }

  window.SustraiResult = { summary, gridClass, partLine, typeLabel };
})();
