'use strict';
(() => {
  const $ = (id) => document.getElementById(id);
  const kit = () => window.SustraiAccountKit;
  const el = (tag, text, cls) => {
    const n = document.createElement(tag);
    if (text !== undefined) n.textContent = String(text);
    if (cls) n.className = cls;
    return n;
  };
  const status = (msg) => { $('myStatus').textContent = msg; };

  let client = null;
  let profile = null;
  let works = [];
  let results = [];
  let filter = 'all';

  function empty(target, html) {
    target.replaceChildren();
    const p = el('p', '', 'empty');
    p.innerHTML = html;
    target.append(p);
  }

  function classifiedWorks() {
    return works
      .map((row) => {
        const meta = kit().parseWork(row.storage_key);
        return { row, meta, preview: kit().previewValue(meta, row.value_text) };
      })
      .filter((item) => kit().isMeaningful(item.meta, item.row.value_text));
  }

  function renderOverview() {
    const items = classifiedWorks();
    const writing = items.filter((x) => x.meta.skill === 'writing').length;
    const speaking = items.filter((x) => x.meta.skill === 'speaking').length;
    const readingMarks = items.filter((x) => x.meta.skill === 'reading').length;
    const avg = results.length
      ? Math.round(results.reduce((a, r) => a + (kit().scorePct(r.score, r.max_score) || 0), 0) / results.length)
      : null;

    const cards = [
      ['Irakurmena', results.length + ' saiakera', avg == null ? 'Oraindik emaitzarik ez' : 'Batez bestekoa: %' + avg],
      ['Idazmena', writing + ' lan', writing ? 'Zirriborroak eta eskemak' : 'Hasi idazlan bat'],
      ['Ahozkoa', speaking + ' ohar', speaking ? 'Oharrak gordeta' : 'Presta ezazu fitxa bat'],
      ['Azpimarrak', readingMarks + ' elementu', 'Irakurmeneko markak eta erantzunak']
    ];

    $('overview').replaceChildren(...cards.map(([title, value, meta]) => {
      const box = el('div', undefined, 'stat stat-skill');
      box.append(el('strong', value), el('span', title), el('span', meta, 'meta'));
      return box;
    }));
  }

  function renderContinue() {
    const root = $('continueList');
    root.replaceChildren();
    const items = classifiedWorks()
      .filter((x) => x.meta.href && (x.meta.kind === 'draft' || x.meta.kind === 'outline' || x.meta.kind === 'notes'))
      .slice(0, 4);

    if (!items.length && !results.length) {
      empty(root, 'Oraindik ez duzu lanik. Hasi <a href="/irakurmena/">irakurmenarekin</a>, <a href="/idazlanak/">idazmenarekin</a> edo <a href="/ahozkoa/">ahozkoarekin</a>.');
      return;
    }

    for (const item of items) {
      const card = el('article', undefined, 'continue-item');
      const left = el('div');
      left.append(
        el('span', kit().skillLabel(item.meta.skill) + (item.meta.mode ? ' · ' + kit().modeLabel(item.meta.mode) : ''), 'tag'),
        el('strong', item.meta.label + (item.meta.slug ? ': ' + item.meta.slug : '')),
        el('small', kit().euDate(item.row.updated_at))
      );
      if (item.preview) left.append(el('span', item.preview, 'preview'));
      const link = el('a', 'Ireki', 'soft-link');
      link.href = item.meta.href;
      card.append(left, link);
      root.append(card);
    }

    if (results[0]) {
      const latest = results[0];
      const card = el('article', undefined, 'continue-item');
      const left = el('div');
      const pct = kit().scorePct(latest.score, latest.max_score);
      left.append(
        el('span', 'Irakurmena' + (kit().resultMode(latest) ? ' · ' + kit().resultMode(latest) : ''), 'tag'),
        el('strong', kit().examTitle(latest)),
        el('small', kit().euDate(latest.created_at) + (pct != null ? ' · %' + pct : ''))
      );
      const link = el('a', 'Katalogoa', 'soft-link');
      link.href = '/irakurmena/';
      card.append(left, link);
      root.append(card);
    }
  }

  function renderResults() {
    const root = $('myResults');
    root.replaceChildren();
    if (!results.length) {
      empty(root, 'Oraindik ez duzu irakurmen-emaitzarik. <a href="/irakurmena/">Aukeratu proba bat</a>.');
      return;
    }
    for (const row of results) {
      const pct = kit().scorePct(row.score, row.max_score);
      const card = el('article', undefined, 'result-card');
      const head = el('header');
      const left = el('div');
      left.append(
        el('span', (kit().resultMode(row) || 'Emaitza'), 'tag'),
        el('strong', kit().examTitle(row)),
        el('small', kit().euDate(row.created_at) + (row.elapsed_seconds ? ' · ' + Math.round(row.elapsed_seconds / 60) + ' min' : ''))
      );
      const pill = el('span', (pct != null ? '%' + pct + ' · ' : '') + row.score + ' / ' + row.max_score, 'score-pill' + (pct != null && pct < 60 ? ' low' : ''));
      head.append(left, pill);
      card.append(head, el('div', row.correct + ' / ' + row.total + ' erantzun zuzen'));
      root.append(card);
    }
  }

  function renderWorks() {
    const root = $('myWorks');
    root.replaceChildren();
    const items = classifiedWorks().filter((x) => filter === 'all' || x.meta.skill === filter);
    if (!items.length) {
      empty(root, filter === 'all'
        ? 'Ez dago zirriborrorik. <a href="/idazlanak/">Idatzi</a> edo <a href="/ahozkoa/">presta ezazu ahozkoa</a>.'
        : 'Iragazki honekin ez dago lanik.');
      return;
    }
    for (const item of items) {
      const card = el('article', undefined, 'work-card');
      const head = el('header');
      const left = el('div');
      left.append(
        el('span', kit().skillLabel(item.meta.skill) + (item.meta.mode ? ' · ' + kit().modeLabel(item.meta.mode) : ''), 'tag'),
        el('strong', item.meta.label + (item.meta.slug ? ' · ' + item.meta.slug : '')),
        el('small', kit().euDate(item.row.updated_at))
      );
      head.append(left);
      card.append(head);
      if (item.preview) card.append(el('p', item.preview, 'preview'));
      const actions = el('div', undefined, 'row-actions');
      if (item.meta.href) {
        const open = el('a', 'Ireki', 'soft-link');
        open.href = item.meta.href;
        actions.append(open);
      }
      const del = el('button', 'Ezabatu', 'soft');
      del.type = 'button';
      del.onclick = async () => {
        if (!confirm('Elementu hau behin betiko ezabatu?')) return;
        window.SustraiCloud.storage.removeItem(item.row.storage_key);
        await window.SustraiCloud.flush();
        await fetchData();
      };
      actions.append(del);
      card.append(actions);
      root.append(card);
    }
  }

  function render() {
    renderOverview();
    renderContinue();
    renderResults();
    renderWorks();
  }

  async function fetchData() {
    status('Datuak kargatzen…');
    await window.SustraiCloud.flush();
    const [a, b] = await Promise.all([
      client.from('sr_app_state').select('storage_key,value_text,updated_at').eq('user_id', profile.id).order('updated_at', { ascending: false }).limit(1500),
      client.from('sr_app_reading_results').select('id,score,max_score,correct,total,created_at,elapsed_seconds,response_summary,exam_id,sr_exams(slug,title)').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(500)
    ]);
    if (a.error) throw a.error;
    if (b.error) throw b.error;
    works = a.data || [];
    results = b.data || [];
    render();
    const meaningful = classifiedWorks().length;
    status(meaningful + ' lan erabilgarri · ' + results.length + ' irakurmen-emaitza');
  }

  function exportData() {
    const payload = {
      exported_at: new Date().toISOString(),
      account_email: profile.email,
      display_name: profile.name,
      works,
      reading_results: results
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sustrai-nire-datuak.json';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function saveProfile(event) {
    event.preventDefault();
    const name = $('displayName').value.trim();
    status('Profila gordetzen…');
    const { data, error } = await client.rpc('sr_update_my_name', { p_name: name });
    if (error) {
      status(error.message === 'name_too_short' ? 'Izenak gutxienez 2 karaktere izan behar ditu.' : (error.message || 'Ezin izan da gorde'));
      return;
    }
    profile = data;
    window.SustraiCloud.setProfile?.(data);
    $('identity').textContent = profile.email;
    status('Izena eguneratuta.');
    if (window.SustraiCloud.refreshAccount) window.SustraiCloud.refreshAccount();
  }

  async function start() {
    await window.SustraiCloud.ready;
    profile = window.SustraiCloud.profile();
    client = window.SustraiCloud.client();
    if (!profile?.active) {
      $('guest').hidden = false;
      $('login').onclick = () => window.SustraiCloud.openLogin();
      status('Gonbidatu modua');
      return;
    }
    $('signedIn').hidden = false;
    $('displayName').value = profile.name || '';
    $('identity').textContent = profile.email;
    $('profileForm').onsubmit = saveProfile;
    $('refresh').onclick = () => fetchData().catch((e) => status(e.message));
    $('import').onclick = async () => {
      await window.SustraiCloud.importGuestData();
      await fetchData();
    };
    $('export').onclick = exportData;
    $('eraseAll').onclick = async () => {
      if (!confirm('Zure hodeiko lan eta irakurmen-emaitza GUZTIAK ezabatuko dira. Ez ditu nabigatzaileko gonbidatu-datuak ezabatzen. Jarraitu?')) return;
      if (!confirm('Ezin da ekintza desegin. Benetan ezabatu?')) return;
      status('Datuak ezabatzen…');
      const { error } = await client.rpc('sr_delete_my_work');
      if (error) { status('Ezin izan dira datuak ezabatu: ' + error.message); return; }
      location.reload();
    };
    document.querySelectorAll('.work-filters .chip').forEach((btn) => {
      btn.onclick = () => {
        filter = btn.dataset.filter;
        document.querySelectorAll('.work-filters .chip').forEach((b) => b.classList.toggle('active', b === btn));
        renderWorks();
      };
    });
    await fetchData();
  }

  start().catch((err) => status(err?.message || 'Datuak ezin izan dira kargatu.'));
})();
