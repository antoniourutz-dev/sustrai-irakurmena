/* SUSTRAI reading attempts: shows the answer sheet of every finished attempt of an exam side by
   side, so the student can repeat the exam another day and compare. Shared by IVAP and HABE.
   A sheet is {questionNumber: [letter, 1|0]}; it never contains the official solution. */
(function (global) {
  'use strict';
  const MAX_COLUMNS = 6;
  let dialog = null;
  let returnFocus = null;

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };
  const clock = (ms) => {
    const s = Math.max(0, Math.floor((ms || 0) / 1000));
    return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map((n) => String(n).padStart(2, '0')).join(':');
  };
  const day = (iso) => {
    try { return new Date(iso).toLocaleDateString('eu', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return ''; }
  };
  const points = (value) => Number(value || 0).toFixed(1).replace('.', ',');

  function sheetOf(parts, answersOf, isCorrect) {
    const sheet = {};
    parts.forEach((part, index) => {
      const answers = answersOf(index) || {};
      for (let n = part.from; n <= part.to; n++) {
        const letter = answers[n] || '';
        sheet[n] = [letter, letter && isCorrect(index, n, letter) ? 1 : 0];
      }
    });
    return sheet;
  }

  function close() {
    if (!dialog) return;
    dialog.remove();
    dialog = null;
    document.removeEventListener('keydown', onKey, true);
    if (returnFocus instanceof HTMLElement && returnFocus.isConnected) returnFocus.focus();
  }
  function onKey(event) {
    if (event.key === 'Escape') { event.stopPropagation(); close(); }
  }

  function show(options) {
    close();
    returnFocus = document.activeElement;
    const all = (options.attempts || []).map((a, index) => ({ ...a, number: index + 1 }));
    const shown = all.slice(-MAX_COLUMNS).reverse();
    dialog = el('div', 'modal attempts-modal');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'attemptsTitle');
    const card = el('div', 'modal-card attempts-card');
    card.tabIndex = -1;
    const x = el('button', 'modalclose', '×');
    x.type = 'button';
    x.setAttribute('aria-label', 'Itxi');
    x.onclick = close;
    const title = el('h2', '', 'Nire saiakerak');
    title.id = 'attemptsTitle';
    card.append(x, el('span', 'eyebrow', options.examTitle || 'IRAKURMENA'), title);

    if (!all.length) {
      card.append(el('p', 'attempts-empty', 'Oraindik ez duzu azterketa hau amaitu. «Amaitu» sakatzean, zure erantzun-orria gordeko da eta hurrengo saiakerekin alderatu ahal izango duzu.'));
    } else {
      card.append(el('p', 'attempts-note', all.length + ' saiakera gordeta' + (all.length > shown.length ? ' · azken ' + shown.length + 'ak erakusten dira' : '') + '. Berdea: zuzena. Gorria: okerra. Marra: erantzun gabe.'));
      const wrap = el('div', 'attempts-scroll');
      wrap.tabIndex = 0;
      const table = el('table', 'attempts-table');
      const head = el('tr');
      head.append(el('th', 'attempts-q', 'Galdera'));
      for (const a of shown) {
        const th = el('th');
        th.scope = 'col';
        th.append(
          el('strong', '', a.number + '. saiakera'),
          el('span', '', day(a.at) + (a.mode === 'simulation' ? ' · Simulazioa' : ' · Praktika')),
          el('span', 'attempts-score', points(a.score) + ' / 20 · ' + (a.correct ?? '–') + '/' + options.total),
          el('span', '', clock(a.elapsedMs))
        );
        head.append(th);
      }
      const thead = el('thead');
      thead.append(head);
      const body = el('tbody');
      for (const part of options.parts) {
        const sub = el('tr', 'attempts-part');
        const cell = el('th', '', part.label);
        cell.colSpan = shown.length + 1;
        cell.scope = 'colgroup';
        sub.append(cell);
        body.append(sub);
        for (let n = part.from; n <= part.to; n++) {
          const row = el('tr');
          const q = el('th', 'attempts-q', String(n));
          q.scope = 'row';
          row.append(q);
          shown.forEach((a, column) => {
            const mark = a.sheet ? a.sheet[n] : null;
            const td = el('td');
            if (!a.sheet) td.append(el('span', 'attempt-cell none', '·'));
            else {
              const letter = mark?.[0] || '';
              const chip = el('span', 'attempt-cell ' + (!letter ? 'blank' : mark[1] ? 'ok' : 'bad'), letter || '–');
              chip.title = !letter ? 'Erantzun gabe' : mark[1] ? 'Zuzena' : 'Okerra';
              const older = shown[column + 1];
              if (older?.sheet && (older.sheet[n]?.[0] || '') !== letter) chip.classList.add('changed');
              td.append(chip);
            }
            row.append(td);
          });
          body.append(row);
        }
      }
      table.append(thead, body);
      wrap.append(table);
      card.append(wrap);
      if (shown.some((a) => !a.sheet)) card.append(el('p', 'attempts-note', '· Saiakera zaharrek ez dute erantzun-orririk: emaitza bakarrik gorde zen.'));
      card.append(el('p', 'attempts-note', 'Puntu urdina: aurreko saiakeratik aldatu duzun erantzuna.'));
    }
    const actions = el('div', 'attempts-actions');
    if (options.onRepeat) {
      const again = el('button', 'outline', 'Azterketa berriz egin');
      again.type = 'button';
      again.onclick = () => { close(); options.onRepeat(); };
      actions.append(again);
    }
    const done = el('button', 'primary', 'Itxi');
    done.type = 'button';
    done.onclick = close;
    actions.append(done);
    card.append(actions);
    dialog.append(card);
    dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
    document.body.append(dialog);
    document.addEventListener('keydown', onKey, true);
    card.focus();
  }

  global.SustraiAttempts = { show, sheetOf };
})(window);
