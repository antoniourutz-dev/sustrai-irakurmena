/* SUSTRAI reading attempts: shows the answer sheet of every finished attempt of an exam side by
   side, so the student can repeat the exam another day and compare. Shared by IVAP and HABE.
   A sheet is {questionNumber: [letter, 1|0]}; it never contains the official solution.
   Also owns deleting attempts (this device's history and, when signed in, the saved result)
   and the «start again, erase everything» confirmation. */
(function (global) {
  'use strict';
  const MAX_COLUMNS = 6;
  let dialog = null;
  let returnFocus = null;
  let pending = null; // resolve() of an open «Hasi berriro» dialog

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
    if (pending) { const r = pending; pending = null; r({ ok: false }); }
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
        if (options.onDelete) {
          const del = el('button', 'attempts-del', 'Ezabatu');
          del.type = 'button';
          del.setAttribute('aria-label', a.number + '. saiakera ezabatu');
          del.onclick = async () => {
            if (!confirm(a.number + '. saiakera ezabatu? Emaitza eta erantzun-orria betiko ezabatuko dira.')) return;
            del.disabled = true;
            const next = await options.onDelete([a.number - 1]);
            show({ ...options, attempts: next });
          };
          th.append(del);
        }
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
    if (options.onDelete && all.length > 1) {
      const wipe = el('button', 'quiet danger', 'Ezabatu guztiak');
      wipe.type = 'button';
      wipe.onclick = async () => {
        if (!confirm('Azterketa honetako ' + all.length + ' saiakerak ezabatu? Ezin da desegin.')) return;
        wipe.disabled = true;
        const next = await options.onDelete(all.map((_, i) => i));
        show({ ...options, attempts: next });
      };
      actions.append(wipe);
    }
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

  /* ---------- Deleting ---------- */

  const store = () => global.SustraiCloud?.storage || localStorage;
  const readList = (key) => { try { const v = JSON.parse(store().getItem(key)); return Array.isArray(v) ? v : []; } catch { return []; } };

  // Deletes the saved result of one attempt from the account (signed-in students only).
  // Matches by the attempt's key; older attempts without one by time (±3 min) and number correct.
  // Returns true when a row was deleted or there was nothing to delete, false when the server refused.
  async function removeCloud(attempt) {
    const cloud = global.SustraiCloud;
    const client = cloud?.client?.();
    const profile = cloud?.profile?.();
    if (!client || !profile?.active || !attempt) return true;
    let q = client.from('sr_app_reading_results').delete().eq('user_id', profile.id);
    if (attempt.id) q = q.eq('id', attempt.id);
    else if (attempt.key) q = q.eq('client_attempt_key', attempt.key);
    else {
      const t = new Date(attempt.at).getTime();
      if (!t) return true;
      q = q.gte('created_at', new Date(t - 180000).toISOString()).lte('created_at', new Date(t + 180000).toISOString());
      if (attempt.correct != null) q = q.eq('correct', attempt.correct);
    }
    const { data, error } = await q.select('id');
    if (error) { console.warn('HitzBira: result not deleted', error.code || ''); return false; }
    return (data || []).length > 0 || !attempt.id;
  }

  // Removes attempts (by index) from a history key on this device / account state, and their results.
  async function removeFromHistory(historyKey, indexes, opts = {}) {
    const list = readList(historyKey);
    const drop = new Set(indexes);
    const removed = list.filter((_, i) => drop.has(i));
    const kept = list.filter((_, i) => !drop.has(i));
    if (kept.length) store().setItem(historyKey, JSON.stringify(kept));
    else store().removeItem(historyKey);
    let ok = true;
    if (opts.cloud !== false) for (const a of removed) ok = (await removeCloud(a)) && ok;
    if (!ok) toastless('Ezin izan da emaitza zure kontutik ezabatu. Saiatu berriro geroago.');
    return kept;
  }

  // Finds the history entry that matches a result shown elsewhere (key first, then time ±3 min).
  function matchIndex(historyKey, result) {
    const list = readList(historyKey);
    if (result.key) { const i = list.findIndex((a) => a && a.key === result.key); if (i >= 0) return i; }
    const t = new Date(result.at || result.when).getTime();
    return list.findIndex((a) => a && Math.abs(new Date(a.at).getTime() - t) < 180000 && (result.correct == null || a.correct == null || a.correct === result.correct));
  }

  function toastless(message) { try { global.alert(message); } catch { /* no UI */ } }

  /* ---------- «Hasi berriro»: erase everything of the current attempt ---------- */

  function confirmRestart(opts = {}) {
    return new Promise((resolve) => {
      close();
      returnFocus = document.activeElement;
      dialog = el('div', 'modal restart-modal');
      dialog.setAttribute('role', 'alertdialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-labelledby', 'restartTitle');
      dialog.setAttribute('aria-describedby', 'restartText');
      const card = el('div', 'modal-card restart-card');
      card.tabIndex = -1;
      const title = el('h2', '', 'Hasi berriro, hutsetik?');
      title.id = 'restartTitle';
      const text = el('p', '', 'Azterketa honetako erantzunak, kronometroa eta azpimarrak ezabatuko dira. ' +
        (opts.finished ? '' : 'Saiakera hau ez da gordeko.'));
      text.id = 'restartText';
      card.append(el('span', 'eyebrow', opts.examTitle || 'IRAKURMENA'), title, text);
      let box = null;
      if (opts.finished) {
        const label = el('label', 'restart-check');
        box = el('input');
        box.type = 'checkbox';
        box.checked = true;
        label.append(box, el('span', '', 'Ezabatu saiakera honen emaitza ere nire historiatik'));
        card.append(label);
      }
      pending = resolve;
      const finish = (ok) => { pending = null; close(); resolve(ok ? { ok: true, dropResult: !!(box && box.checked) } : { ok: false }); };
      const actions = el('div', 'attempts-actions');
      const keep = el('button', 'outline', 'Utzi');
      keep.type = 'button';
      keep.onclick = () => finish(false);
      const go = el('button', 'primary', 'Dena ezabatu eta hasi');
      go.type = 'button';
      go.onclick = () => finish(true);
      actions.append(keep, go);
      card.append(actions);
      dialog.append(card);
      dialog.addEventListener('click', (event) => { if (event.target === dialog) finish(false); });
      document.body.append(dialog);
      document.addEventListener('keydown', onKey, true);
      requestAnimationFrame(() => keep.focus());
    });
  }

  global.SustraiAttempts = { show, sheetOf, removeCloud, removeFromHistory, matchIndex, confirmRestart };
})(window);
