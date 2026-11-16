/* SUSTRAI study kit: the student's own material for a writing or speaking task.
   - saved(): several named versions of a piece of work (essays, speaking outlines) per task.
   - glossary(): the student's vocabulary and concepts about the task's topic.
   Everything goes through SustraiCloud.storage, so it stays on the device for guests and
   syncs to the account for signed-in students. */
(function (global) {
  'use strict';
  const MAX_SAVED = 15;
  const MAX_TERMS = 120;

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };
  const button = (label, className, onClick) => {
    const node = el('button', className, label);
    node.type = 'button';
    node.onclick = onClick;
    return node;
  };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const when = (iso) => {
    try { return new Date(iso).toLocaleString('eu', { dateStyle: 'medium', timeStyle: 'short' }); }
    catch { return ''; }
  };
  const storage = () => global.SustraiCloud.storage;

  function readList(key) {
    if (!key) return [];
    try {
      const value = JSON.parse(storage().getItem(key));
      return Array.isArray(value) ? value.filter((x) => x && typeof x === 'object' && typeof x.id === 'string') : [];
    } catch { return []; }
  }
  function writeList(key, list) {
    try { storage().setItem(key, JSON.stringify(list)); return true; }
    catch { return false; }
  }

  function header(root, eyebrow, title) {
    const head = el('div', 'study-head');
    const titles = el('div');
    titles.append(el('span', 'study-eyebrow', eyebrow), el('h3', 'study-title', title));
    head.append(titles);
    root.append(head);
    return head;
  }

  /* ---------- Saved versions ---------- */
  function saved(options) {
    const root = options.root;
    if (!root) return { refresh() {} };
    const opened = new Set();
    root.classList.add('study-panel');

    function save() {
      const key = options.key();
      if (!key) return;
      const snapshot = options.capture();
      if (!snapshot) { options.notify?.(options.emptyMessage); return; }
      const list = readList(key);
      if (list.length >= MAX_SAVED) { options.notify?.('Gehienez ' + MAX_SAVED + ' gorde daitezke ataza bakoitzeko. Ezabatu bat lehenik.'); return; }
      const item = { id: uid(), at: new Date().toISOString(), name: list.length + 1 + '. ' + options.noun, ...snapshot };
      list.unshift(item);
      if (!writeList(key, list)) { options.notify?.('Ezin izan da gorde.'); return; }
      options.notify?.('Gordeta: ' + item.name);
      refresh();
    }

    function refresh() {
      const key = options.key();
      root.replaceChildren();
      root.hidden = !key;
      if (!key) return;
      const list = readList(key);
      const head = header(root, options.eyebrow, options.title);
      const saveButton = button(options.saveLabel, 'study-primary', save);
      head.append(saveButton);
      root.append(el('p', 'study-note', options.note));
      if (!list.length) { root.append(el('p', 'study-empty', options.emptyList)); return; }
      const box = el('div', 'study-list');
      for (const item of list) {
        const row = el('article', 'study-item');
        const top = el('div', 'study-item-top');
        const name = el('input', 'study-name');
        name.type = 'text';
        name.maxLength = 80;
        name.value = item.name || '';
        name.setAttribute('aria-label', 'Izena');
        name.onchange = () => {
          const all = readList(key);
          const target = all.find((x) => x.id === item.id);
          if (!target) return;
          target.name = name.value.trim().slice(0, 80) || item.name;
          writeList(key, all);
        };
        top.append(name, el('span', 'study-meta', [when(item.at), ...(options.meta?.(item) || [])].filter(Boolean).join(' · ')));
        const body = el('div', 'study-body');
        body.hidden = !opened.has(item.id);
        if (!body.hidden) body.append(options.view(item));
        const toggle = button(body.hidden ? 'Ikusi' : 'Ezkutatu', 'study-action', () => {
          if (opened.has(item.id)) opened.delete(item.id); else opened.add(item.id);
          refresh();
        });
        toggle.setAttribute('aria-expanded', String(!body.hidden));
        const actions = el('div', 'study-actions');
        actions.append(
          toggle,
          button(options.loadLabel, 'study-action', () => {
            if (options.isDirty?.(item) && !confirm('Uneko lana ordezkatuko da. Jarraitu nahi duzu?')) return;
            options.load(item);
            options.notify?.('Kargatuta: ' + (item.name || options.noun));
          }),
          button('Ezabatu', 'study-action study-danger', () => {
            if (!confirm('Ezabatu «' + (item.name || options.noun) + '»? Ezin da desegin.')) return;
            writeList(key, readList(key).filter((x) => x.id !== item.id));
            opened.delete(item.id);
            refresh();
          })
        );
        row.append(top, actions, body);
        box.append(row);
      }
      root.append(box);
    }

    refresh();
    return { refresh };
  }

  /* ---------- Vocabulary and concepts ---------- */
  function glossary(options) {
    const root = options.root;
    if (!root) return { refresh() {} };
    root.classList.add('study-panel');
    let kind = 'word';
    let editing = null;

    function refresh() {
      const key = options.key();
      root.replaceChildren();
      root.hidden = !key;
      if (!key) return;
      const list = readList(key);
      header(root, 'ZURE OHARRAK', 'Hiztegia eta kontzeptuak');
      root.append(el('p', 'study-note', 'Jaso gai honi buruz erabili nahi dituzun hitzak, esamoldeak eta ideiak. Zureak dira eta ataza honekin gordetzen dira.'));

      const form = el('form', 'study-form');
      const kinds = el('div', 'study-kinds');
      kinds.setAttribute('role', 'group');
      kinds.setAttribute('aria-label', 'Mota');
      for (const [value, label] of [['word', 'Hitza'], ['concept', 'Kontzeptua']]) {
        const b = button(label, value === kind ? 'active' : '', () => { kind = value; refresh(); });
        b.setAttribute('aria-pressed', String(value === kind));
        kinds.append(b);
      }
      const term = el('input');
      term.type = 'text'; term.maxLength = 80; term.required = true;
      term.placeholder = kind === 'word' ? 'Hitza edo esamoldea' : 'Kontzeptua edo ideia';
      term.setAttribute('aria-label', term.placeholder);
      const note = el('input');
      note.type = 'text'; note.maxLength = 300;
      note.placeholder = kind === 'word' ? 'Esanahia, itzulpena edo adibidea' : 'Azalpena edo nola erabiliko duzun';
      note.setAttribute('aria-label', note.placeholder);
      const current = editing ? list.find((x) => x.id === editing) : null;
      if (current) { term.value = current.term || ''; note.value = current.note || ''; }
      const submit = el('button', 'study-primary', current ? 'Gorde aldaketa' : 'Gehitu');
      submit.type = 'submit';
      form.append(kinds, term, note, submit);
      if (current) form.append(button('Utzi', 'study-action', () => { editing = null; refresh(); }));
      form.onsubmit = (event) => {
        event.preventDefault();
        const value = term.value.trim();
        if (!value) return;
        const all = readList(key);
        if (current) {
          const target = all.find((x) => x.id === current.id);
          if (target) { target.term = value; target.note = note.value.trim(); target.kind = kind; }
        } else {
          if (all.length >= MAX_TERMS) { options.notify?.('Gehienez ' + MAX_TERMS + ' sarrera ataza bakoitzeko.'); return; }
          all.push({ id: uid(), kind, term: value, note: note.value.trim(), at: new Date().toISOString() });
        }
        if (!writeList(key, all)) { options.notify?.('Ezin izan da gorde.'); return; }
        editing = null;
        refresh();
        root.querySelector('.study-form input')?.focus();
      };
      root.append(form);

      if (!list.length) { root.append(el('p', 'study-empty', 'Oraindik ez duzu ezer jaso.')); return; }
      for (const [value, label] of [['word', 'Hiztegia'], ['concept', 'Kontzeptuak']]) {
        const items = list.filter((x) => (x.kind === 'concept' ? 'concept' : 'word') === value);
        if (!items.length) continue;
        root.append(el('h4', 'study-group', label + ' (' + items.length + ')'));
        const box = el('ul', 'study-terms');
        for (const item of items) {
          const li = el('li', 'study-term');
          const text = el('div');
          text.append(el('strong', '', item.term));
          if (item.note) text.append(el('span', '', item.note));
          const edit = button('Aldatu', 'study-action', () => { editing = item.id; kind = value; refresh(); });
          const remove = button('×', 'study-remove', () => {
            writeList(key, readList(key).filter((x) => x.id !== item.id));
            if (editing === item.id) editing = null;
            refresh();
          });
          remove.setAttribute('aria-label', 'Ezabatu: ' + item.term);
          li.append(text, edit, remove);
          box.append(li);
        }
        root.append(box);
      }
    }

    refresh();
    return { refresh };
  }

  global.SustraiStudy = { saved, glossary };
})(window);
