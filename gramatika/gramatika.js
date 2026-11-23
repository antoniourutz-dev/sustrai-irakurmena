/* HitzBira · Gramatika B2/C1: teoria Supabaseko argitalpen-ikuspegietatik soilik.
   Ez dauka ariketarik, zuzenketarik edo edukien kopia estatikoaren ordezko isilik. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const cloud = window.SustraiCloud;
  const state = { client: null, level: 'B2', entries: [], detailCache: new Map(), request: 0 };
  const V = {
    entries: 'public_editorial_grammar_entries',
    sections: 'public_editorial_grammar_entry_sections',
    examples: 'public_editorial_grammar_entry_examples',
    forms: 'public_editorial_grammar_forms',
    formExamples: 'public_editorial_grammar_form_examples',
    contrasts: 'public_editorial_grammar_form_contrasts',
    tables: 'public_editorial_grammar_summary_tables',
    errors: 'public_editorial_grammar_error_patterns'
  };

  const node = (tag, value, className) => {
    const el = document.createElement(tag);
    if (value !== undefined && value !== null) el.textContent = String(value);
    if (className) el.className = className;
    return el;
  };
  const check = (response) => {
    if (response.error) throw response.error;
    return response.data || [];
  };
  const sameLevel = (level) => level === 'C1' ? 'C1' : 'B2';
  function currentRoute() {
    const params = new URLSearchParams(location.search);
    return {level:sameLevel(params.get('maila')),code:params.get('gaia') || null};
  }
  function linkFor(level, code = null) {
    const path = '/gramatika/?maila=' + encodeURIComponent(level);
    return code ? path + '&gaia=' + encodeURIComponent(code) : path;
  }
  function status(message, error = false) {
    $('grammarStatus').textContent = message;
    $('grammarStatus').classList.toggle('is-error', error);
  }
  function setLevels(level) {
    document.querySelectorAll('.grammar-level-link').forEach(link => {
      if (link.dataset.level === level) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
  }
  function categories() {
    const category = $('grammarCategory');
    const current = category.value;
    const byCode = new Map();
    for (const row of state.entries) {
      const code = row.category_code || '';
      if (code && !byCode.has(code)) byCode.set(code, row.category_label_eu || code);
    }
    category.replaceChildren(node('option', 'Kategoria guztiak'));
    category.firstChild.value = '';
    for (const [code, label] of [...byCode].sort((a,b) => a[1].localeCompare(b[1], 'eu'))) {
      const opt = node('option', label);
      opt.value = code;
      category.append(opt);
    }
    if (byCode.has(current)) category.value = current;
  }
  function renderCatalog() {
    const grid = $('grammarIndex');
    const search = $('grammarSearch').value.trim().toLocaleLowerCase('eu');
    const filter = $('grammarCategory').value;
    const rows = state.entries.filter(row =>
      (!filter || row.category_code === filter)
      && (!search || (row.title_eu + ' ' + (row.short_explanation_eu || '') + ' ' + (row.category_label_eu || '')).toLocaleLowerCase('eu').includes(search))
    );
    grid.replaceChildren(...rows.map((entry, index) => {
      const a = node('a', null, 'grammar-index-card');
      a.href = linkFor(state.level, entry.code);
      a.dataset.code = entry.code;
      a.append(
        node('span', (entry.category_label_eu || 'Gramatika') + ' · ' + String(index + 1).padStart(2, '0'), 'grammar-index-number'),
        node('strong', entry.title_eu),
        node('span', entry.short_explanation_eu, 'grammar-index-desc'),
        node('span', 'Azalpena irakurri →', 'grammar-index-more')
      );
      if(entry.metadata?.pilot_public_visibility==='pending_independent_review'){
        const badge=node('span','Berrikuspen akademikoaren zain · pilotua','grammar-pilot-tag');
        a.insertBefore(badge,a.lastChild);
      }
      return a;
    }));
    grid.setAttribute('aria-busy', 'false');
    $('grammarCount').textContent = String(rows.length) + ' gai';
    $('grammarEmpty').hidden = rows.length > 0;
    status(rows.length ? 'Aukeratu gai bat azalpena eta adibideak ikusteko.' : 'Ez da gairik aurkitu.');
  }
  function renderDetails(entry, data) {
    $('grammarTopic').textContent = state.level + ' · ' + (entry.category_label_eu || 'Gramatika');
    $('grammarDetailTitle').textContent = entry.title_eu;
    $('grammarLead').textContent = entry.short_explanation_eu || '';
    $('grammarVersion').textContent = entry.version ? 'Bertsioa ' + entry.version : '';
    $('grammarBack').href = linkFor(state.level);
    const root = $('grammarDetail');
    const reader = window.SustraiGrammarReader;
    if (!reader) throw new Error('reader_missing');
    reader.outline(root, reader.render(root, entry, data));
  }
  async function readDetails(entry) {
    return window.SustraiGrammarReader.load(entry, state.client);
  }
  function detailView(enabled) {
    $('grammarTop').classList.toggle('is-detail', enabled);
    if (!enabled) {
      document.body.classList.remove('is-grammar-reading');
      $('grammarFocus').setAttribute('aria-pressed', 'false');
      $('grammarFocus').textContent = 'Irakurketa-modua';
    }
  }
  let readerSize = 18;
  function scale(delta) {
    readerSize = Math.max(15, Math.min(23, readerSize + delta));
    $('grammarArticle').style.setProperty('--gr-document-size', readerSize + 'px');
    $('grammarSmaller').disabled = readerSize <= 15;
    $('grammarLarger').disabled = readerSize >= 23;
  }
  $('grammarSmaller').addEventListener('click', () => scale(-1));
  $('grammarLarger').addEventListener('click', () => scale(1));
  $('grammarFocus').addEventListener('click', () => {
    const active = document.body.classList.toggle('is-grammar-reading');
    $('grammarFocus').setAttribute('aria-pressed', String(active));
    $('grammarFocus').textContent = active ? 'Irakurketa-modutik irten' : 'Irakurketa-modua';
  });
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && document.body.classList.contains('is-grammar-reading')) {
      $('grammarFocus').click();
      $('grammarFocus').focus();
    }
  });
  async function showEntry(code) {
    const entry=state.entries.find(e=>e.code===code);
    if (!entry) {
      $('grammarReading').hidden=true;
      detailView(false);
      $('grammarLibraryTitle').textContent='Gaiak';
      status('Eskatutako gaia ez da aurkitu edo beste maila batekoa da.',true);
      return;
    }
    const ticket=++state.request;
    $('grammarReading').hidden=false;
    detailView(true);
    $('grammarDetail').replaceChildren(node('p','Gaia kargatzen…'));
    $('grammarDetail').setAttribute('aria-busy','true');
    $('grammarTopic').textContent=state.level;
    $('grammarDetailTitle').textContent=entry.title_eu;
    $('grammarLead').textContent='';
    $('grammarVersion').textContent='';
    try {
      const data=await readDetails(entry);
      if(ticket!==state.request)return;
      renderDetails(entry,data);
      $('grammarDetail').setAttribute('aria-busy','false');
    } catch (error) {
      if(ticket!==state.request)return;
      console.warn('GRAMATIKA gaia ezin da kargatu',error?.code || 'network');
      $('grammarDetail').replaceChildren(node('p','Ezin izan da gaiaren edukia kargatu. Saiatu berriro.','grammar-load-error'));
      $('grammarDetail').setAttribute('aria-busy','false');
      state.detailCache.delete(entry.id);
    }
  }
  async function loadLevel() {
    const route=currentRoute();
    state.level=route.level;
    state.request++;
    state.entries=[];
    state.detailCache.clear();
    setLevels(state.level);
    $('grammarReading').hidden=true;
      detailView(false);
    $('grammarIndex').replaceChildren();
    $('grammarIndex').setAttribute('aria-busy','true');
    status('Gramatika-gaiak kargatzen…');
    try {
      await cloud?.ready;
      state.client=cloud?.client?.()||null;
      if(!state.client)throw new Error('Supabase client unavailable');
      state.entries=check(await state.client.from(V.entries)
        .select('id,code,title_eu,short_explanation_eu,explanation_eu,category_code,category_label_eu,level,use_when_eu,avoid_when_eu,warning_eu,source_guideline,metadata,version,sort_order')
        .eq('level',state.level)
        .order('sort_order',{ascending:true})
        .limit(250));
      categories();
      renderCatalog();
      if(route.code)await showEntry(route.code);
    } catch(error) {
      console.warn('GRAMATIKA katalogoa ezin da kargatu',error?.code||'network');
      status('Ezin izan da edukia kargatu. Freskatu orria edo saiatu berriro.',true);
      $('grammarIndex').setAttribute('aria-busy','false');
      $('grammarEmpty').hidden=true;
    }
  }
  async function routeTo(code) {
    const url=linkFor(state.level,code);
    if(url!==location.pathname+location.search) history.pushState(null,'',url);
    if(code) {
      await showEntry(code);
      if (!$('grammarReading').hidden) {
        $('grammarDetailTitle').setAttribute('tabindex','-1');
        $('grammarDetailTitle').focus({preventScroll:true});
      }
      $('grammarReading').scrollIntoView({behavior:'smooth',block:'start'});
    } else {
      ++state.request;
      $('grammarReading').hidden=true;
      detailView(false);
      $('grammarTop').scrollIntoView({behavior:'smooth',block:'start'});
      $('grammarSearch').focus({preventScroll:true});
    }
  }
  $('grammarIndex').addEventListener('click',event=>{
    const a=event.target.closest('a[data-code]');
    if(!a)return;
    event.preventDefault();
    void routeTo(a.dataset.code);
  });
  $('grammarBack').addEventListener('click',event=>{
    event.preventDefault();
    void routeTo(null);
  });
  $('grammarSearch').addEventListener('input',renderCatalog);
  $('grammarCategory').addEventListener('change',renderCatalog);
  window.addEventListener('popstate',async ()=>{
    const route=currentRoute();
    if(route.level!==state.level)await loadLevel();
    else if(route.code)await showEntry(route.code);
    else {++state.request;$('grammarReading').hidden=true;
      detailView(false);}
  });
  void loadLevel();
})();

