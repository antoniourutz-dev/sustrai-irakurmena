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
  function addText(parent, text, className) {
    if (!text) return;
    parent.append(node('p', text, className || 'grammar-body'));
  }
  function section(parent, title, className = '') {
    const el = node('section', null, 'grammar-content-section' + (className ? ' ' + className : ''));
    el.append(node('h3', title));
    parent.append(el);
    return el;
  }
  function note(parent, label, value) {
    if (!value) return;
    const el = node('div', null, 'grammar-note');
    el.append(node('strong', label), node('p', value));
    parent.append(el);
  }
  function detail(parent, title, value) {
    if (!value) return;
    const row = node('div', null, 'grammar-meta-row');
    row.append(node('strong', title), node('p', value));
    parent.append(row);
  }
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
    status(rows.length ? 'Supabaseko gramatika-gaiak' : 'Ez da gairik aurkitu.');
  }
  function renderExample(parent, item) {
    const type = item.example_type || 'note';
    const label = {good:'Erabilera egokia',bad:'Hobetu beharreko erabilera',better:'Hobetutako aukera',contrast:'Kontrastea',note:'Erabilera-oharra'}[type] || 'Adibidea';
    const box = node('div', null, 'grammar-example grammar-example-' + (['good','bad','better','contrast'].includes(type) ? type : 'note'));
    box.append(node('span', label, 'grammar-caption'), node('p', item.text_eu, 'grammar-sentence'));
    addText(box, item.explanation_eu, 'grammar-explain');
    parent.append(box);
  }
  function renderForm(parent, form, examples) {
    const card = node('details', null, 'grammar-form');
    const summary = node('summary');
    summary.append(node('span', form.display_eu || form.code, 'grammar-form-name'));
    if (form.form_group) summary.append(node('span', form.form_group, 'grammar-form-group'));
    card.append(summary);
    const body = node('div', null, 'grammar-form-body');
    detail(body,'Funtzioa',form.function_eu);
    detail(body,'Esanahia',form.meaning_eu);
    detail(body,'Eraikuntza',form.formation_eu);
    detail(body,'Baiezkoa',form.positive_pattern_eu);
    detail(body,'Ezezkoa',form.negative_pattern_eu);
    detail(body,'Egitura jokatua',form.finite_pattern_eu);
    detail(body,'Egitura jokatugabea',form.non_finite_pattern_eu);
    detail(body,'Erabilera',form.use_when_eu);
    detail(body,'Erregistroa',form.register_label);
    detail(body,'Hizkera-aldaerak',form.dialect_note_eu);
    note(body,'Kontuz',form.warning_eu || form.avoid_when_eu);
    if (form.warning_eu && form.avoid_when_eu) detail(body, 'Saihestu', form.avoid_when_eu);
    const related = examples.filter(example => example.form_id === form.id);
    if (related.length) {
      const examplesGrid = node('div', null, 'grammar-example-grid');
      related.forEach(example => renderExample(examplesGrid, example));
      const title = node('h4', 'Forma honen adibideak');
      body.append(title, examplesGrid);
    }
    card.append(body);
    parent.append(card);
  }
  function renderContrast(parent, item) {
    const box = node('div', null, 'grammar-comparison-card');
    box.append(node('h4', item.title_eu || 'Egituren arteko kontrastea'));
    detail(box,'Lehen aukera',item.left_explanation_eu);
    detail(box,'Bigarren aukera',item.right_explanation_eu);
    addText(box,item.contrast_explanation_eu);
    if (item.wrong_use_eu || item.better_use_eu) {
      const pair = node('div',null,'grammar-example-grid');
      if (item.wrong_use_eu) renderExample(pair,{example_type:'bad',text_eu:item.wrong_use_eu});
      if (item.better_use_eu) renderExample(pair,{example_type:'better',text_eu:item.better_use_eu});
      box.append(pair);
    }
    parent.append(box);
  }
  function renderTable(parent, model) {
    const card = node('details',null,'grammar-form grammar-table-card');
    card.append(node('summary',model.title_eu || 'Laburpen-taula'));
    const body = node('div',null,'grammar-form-body');
    addText(body,model.description_eu);
    const columns = Array.isArray(model.columns_json) ? model.columns_json : [];
    const rows = Array.isArray(model.rows_json) ? model.rows_json : [];
    if (columns.length && rows.length) {
      const wrapper = node('div',null,'grammar-table-wrap');
      const table = node('table',null,'grammar-comparison');
      const head = node('thead');
      const header = node('tr');
      columns.forEach(label => {const th=node('th',label); th.scope='col';header.append(th)});
      head.append(header);table.append(head);
      const tbody=node('tbody');
      rows.forEach(row => {
        const values = Array.isArray(row) ? row : columns.map((column,index) => row?.[column] ?? row?.[index] ?? '');
        const tr=node('tr');
        values.slice(0,columns.length).forEach(value => tr.append(node('td',value == null ? '' : String(value))));
        tbody.append(tr);
      });
      table.append(tbody);
      wrapper.append(table);
      body.append(wrapper);
    }
    card.append(body); parent.append(card);
  }
  function renderErrors(parent, errors) {
    const content = section(parent, 'Ohiko nahasketak eta zuzenketa-proposamenak');
    const grid=node('div',null,'grammar-error-list');
    errors.forEach(e=>{
      const item=node('div',null,'grammar-error-item');
      if(e.wrong_eu)renderExample(item,{example_type:'bad',text_eu:e.wrong_eu});
      if(e.correct_eu)renderExample(item,{example_type:'better',text_eu:e.correct_eu});
      addText(item,e.explanation_eu);
      grid.append(item);
    });
    content.append(grid);
  }
  function renderDetails(entry, data) {
    $('grammarTopic').textContent = state.level + ' · ' + (entry.category_label_eu || 'Gramatika');
    $('grammarDetailTitle').textContent = entry.title_eu;
    $('grammarLead').textContent = entry.short_explanation_eu || '';
    $('grammarVersion').textContent = 'Bertsioa ' + entry.version;
    const root = $('grammarDetail');
    root.replaceChildren();
    if(entry.metadata?.pilot_public_visibility==='pending_independent_review'){
      root.append(node('p', entry.metadata.pilot_review_notice_eu || 'Ikasmaterial pilotua: berrikuspen akademiko independentea egin gabe.','grammar-pilot-notice'));
    }
    if (entry.explanation_eu) {
      const explain=section(root,'Azalpena');
      addText(explain,entry.explanation_eu);
    }
    if (entry.use_when_eu || entry.avoid_when_eu || entry.warning_eu) {
      const usage=section(root,'Erabilera eta mugak');
      detail(usage,'Noiz erabili',entry.use_when_eu);
      detail(usage,'Noiz saihestu',entry.avoid_when_eu);
      note(usage,'Kontuan hartu',entry.warning_eu);
    }
    if (data.sections.length) {
      const part=section(root,'Sakontzeko azalpenak');
      data.sections.forEach(item=>{
        const block=node('div',null,'grammar-section-block' + (item.section_type==='warning'?' grammar-warning':''));
        block.append(node('h4',item.title_eu));
        addText(block,item.body_eu);
        part.append(block);
      });
    }
    if (data.forms.length) {
      const part=section(root,'Egiturak eta erabilera zehatzak');
      addText(part,'Aukeratu egitura bat haren funtzioa, forma eta adibideak ikusteko. Ez dira ariketak.');
      data.forms.forEach(form=>renderForm(part,form,data.formExamples));
    }
    if (data.examples.length) {
      const part=section(root,'Adibide orokorrak');
      const grid=node('div',null,'grammar-example-grid');
      data.examples.forEach(example=>renderExample(grid,example));
      part.append(grid);
    }
    if (data.contrasts.length) {
      const part=section(root,'Egituren arteko aldeak');
      data.contrasts.forEach(item=>renderContrast(part,item));
    }
    if (data.tables.length) {
      const part=section(root,'Laburpen-taulak');
      data.tables.forEach(table=>renderTable(part,table));
    }
    if (data.errors.length) renderErrors(root,data.errors);
    const source=node('div',null,'grammar-source');
    source.append(node('strong','Edukia: SUSTRAIren Supabaseko gramatika-banku editoriala'));
    source.append(node('span','SUSTRAIren irakurketa-baimendutako edukia. Gai batzuk berrikuspen akademikoaren zain daude. Ez da azterketa-erakunde baten material ofiziala.'));
    if(entry.source_guideline)source.append(node('span','Jatorrizko erreferentzia editoriala: '+entry.source_guideline));
    // Source provenance is optional for older editorial entries; new material stores
    // verified link targets and the kind of claim each source supports.
    const references = Array.isArray(entry.metadata?.sources) ? entry.metadata.sources : [];
    const list = node('ul', null, 'grammar-source-list');
    for (const reference of references) {
      if (!reference || typeof reference !== 'object' || typeof reference.url !== 'string') continue;
      let parsed;
      try { parsed = new URL(reference.url); }
      catch { continue; }
      if (parsed.protocol !== 'https:') continue;
      const li = node('li');
      const a = node('a', reference.title || parsed.hostname);
      a.href = parsed.href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      li.append(a);
      const kind = reference.source_type === 'ARAUEMAILEA' ? 'Idazkera / arauemailea'
        : reference.source_type === 'DESKRIBAPENA' ? 'Deskribapen linguistikoa'
        : 'Iturri linguistikoa';
      li.append(node('span',kind,'grammar-source-type'));
      if (typeof reference.claim === 'string' && reference.claim.trim()) li.append(node('p',reference.claim,'grammar-source-claim'));
      list.append(li);
    }
    if (list.childElementCount) source.append(list);
    root.append(source);
  }
  async function readDetails(entry) {
    if (state.detailCache.has(entry.id)) return state.detailCache.get(entry.id);
    const selects=[
      [V.sections, 'section_key,title_eu,body_eu,section_type,sort_order'],
      [V.examples, 'id,entry_id,example_type,text_eu,explanation_eu,sort_order'],
      [V.forms, 'id,code,display_eu,form_group,function_eu,meaning_eu,formation_eu,positive_pattern_eu,negative_pattern_eu,finite_pattern_eu,non_finite_pattern_eu,use_when_eu,avoid_when_eu,warning_eu,register_label,dialect_note_eu,sort_order'],
      [V.formExamples,'form_id,example_type,text_eu,explanation_eu,sort_order'],
      [V.contrasts,'title_eu,left_explanation_eu,right_explanation_eu,contrast_explanation_eu,wrong_use_eu,better_use_eu,sort_order'],
      [V.tables,'title_eu,description_eu,columns_json,rows_json,sort_order'],
      [V.errors,'wrong_eu,correct_eu,explanation_eu,sort_order']
    ];
    const [sections,examples,forms,formExamples,contrasts,tables,errors] = await Promise.all(
      selects.map(([view,columns])=>state.client.from(view).select(columns).eq('entry_id',entry.id).order('sort_order').limit(500).then(check))
    );
    const data={sections,examples,forms,formExamples,contrasts,tables,errors};
    state.detailCache.set(entry.id,data);
    return data;
  }
  async function showEntry(code) {
    const entry=state.entries.find(e=>e.code===code);
    if (!entry) {
      $('grammarReading').hidden=true;
      $('grammarLibraryTitle').textContent='Gaiak';
      status('Eskatutako gaia ez da aurkitu edo beste maila batekoa da.',true);
      return;
    }
    const ticket=++state.request;
    $('grammarReading').hidden=false;
    $('grammarDetail').replaceChildren(node('p','Gaia Supabasetik kargatzen…'));
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
    $('grammarIndex').replaceChildren();
    $('grammarIndex').setAttribute('aria-busy','true');
    status('Supabaseko gaiak kargatzen…');
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
      status('Ezin izan da Supabaseko edukia kargatu. Freskatu orria edo saiatu berriro.',true);
      $('grammarIndex').setAttribute('aria-busy','false');
      $('grammarEmpty').hidden=true;
    }
  }
  async function routeTo(code) {
    const url=linkFor(state.level,code);
    if(url!==location.pathname+location.search) history.pushState(null,'',url);
    if(code) {
      await showEntry(code);
      $('grammarReading').scrollIntoView({behavior:'smooth',block:'start'});
    } else {
      ++state.request;
      $('grammarReading').hidden=true;
      $('grammarTop').scrollIntoView({behavior:'smooth',block:'start'});
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
    else {++state.request;$('grammarReading').hidden=true;}
  });
  void loadLevel();
})();
