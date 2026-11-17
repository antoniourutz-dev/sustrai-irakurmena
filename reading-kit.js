/* SUSTRAI · reading helpers shared by the IVAP and HABE workshops.
   SustraiReading.gapContext(passage, n, {kind, filled}) returns the HTML of the sentence that holds
   gap n, so the student sees it inside the question panel instead of hunting for it under the sheet.
     kind 'gap'  → the gap is shown as a slot with the chosen answer (or «···»)
     kind 'word' → the word just before the marker is highlighted (HABE «Baliokideak») */
(() => {
  'use strict';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const MAX = 170;

  function gapContext(passage, n, opts = {}) {
    const p = String(passage || '');
    const token = '{{' + n + '}}';
    const at = p.indexOf(token);
    if (at < 0) return '';
    // Sentence bounds: the last sentence end before the gap, the first one after it.
    const head = p.slice(0, at), tail = p.slice(at + token.length);
    const ends = [...head.matchAll(/[.!?]["»”)]?\s+|\n+/g)];
    let before = ends.length ? head.slice(ends.at(-1).index + ends.at(-1)[0].length) : head;
    const next = tail.search(/[.!?]["»”)]?(\s|$)|\n/);
    let after = next >= 0 ? tail.slice(0, next + 1) : tail;
    // Other gaps in the same sentence read as their number, the long edges are trimmed.
    const clean = (s) => s.replace(/\{\{(\d+)\}\}/g, '($1)').replace(/\s+/g, ' ');
    before = clean(before).trimStart();
    after = clean(after).trimEnd();
    if (before.length > MAX) before = '…' + before.slice(-MAX).replace(/^\S*\s/, ' ');
    if (after.length > MAX) after = after.slice(0, MAX).replace(/\s\S*$/, '') + '…';

    if (opts.kind === 'word') {
      before = before.replace(/\s+$/, '');
      const m = before.match(/^(.*?)([\p{L}\p{N}-]+)(\W*)$/u);
      const html = m ? esc(m[1]) + '<strong class="gap-word">' + esc(m[2]) + '</strong>' + esc(m[3]) : esc(before);
      if (after && !/^[\s.,;:!?)»]/.test(after)) after = ' ' + after;
      return '<p class="gap-context">' + html + esc(after) + '</p>';
    }
    const filled = opts.filled ? String(opts.filled) : '';
    const slot = '<span class="gap-slot' + (filled ? ' filled' : '') + '"><b>' + n + '</b>' + (filled ? esc(filled) : '···') + '</span>';
    return '<p class="gap-context">' + esc(before) + slot + esc(after) + '</p>';
  }

  window.SustraiReading = { gapContext };
})();
