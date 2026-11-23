/* SUSTRAI · Read-only inline editorial grammar viewer.
   Clean document typography inspired by Markdown viewers; Supabase is the sole source.
   Never render remote HTML. */
(() => {
  'use strict';
  const V = Object.freeze({
    sections:'public_editorial_grammar_entry_sections',
    examples:'public_editorial_grammar_entry_examples',
    forms:'public_editorial_grammar_forms',
    formExamples:'public_editorial_grammar_form_examples',
    contrasts:'public_editorial_grammar_form_contrasts',
    tables:'public_editorial_grammar_summary_tables',
    errors:'public_editorial_grammar_error_patterns'
  });
  const cache = new Map();
  const el = (tag,text,cls) => {
    const n=document.createElement(tag);
    if(text!==undefined&&text!==null)n.textContent=String(text);
    if(cls)n.className=cls;
    return n;
  };
  const check = (result) => {if(result.error)throw result.error;return result.data||[]};
  const norm = value => String(value||'').replace(/\r\n?/g,'\n').replace(/\\n/g,'\n').trim();
  function inline(s,parent) {
    const value=String(s);
    // A single asterisk is a linguistic acceptability marker; never consume it as emphasis.
    const re=/(\*\*([^*]+)\*\*|\x60([^\x60]+)\x60)/g;
    let end=0;
    for(const m of value.matchAll(re)) {
      const i=m.index||0;
      if(i>end)parent.append(document.createTextNode(value.slice(end,i)));
      parent.append(el(m[2]?'strong':'code',m[2]||m[3]));
      end=i+m[0].length;
    }
    if(end<value.length)parent.append(document.createTextNode(value.slice(end)));
  }
  function prose(parent,source,cls='gr-prose') {
    const value=norm(source);if(!value)return;
    const root=el('div',null,cls);
    value.split(/\n\s*\n/).forEach(block=>{
      const lines=block.split('\n').filter(t=>t.trim());
      if(!lines.length)return;
      const bullets=lines.every(t=>/^\s*[-*]\s+/.test(t));
      const numbered=lines.every(t=>/^\s*\d+[.)]\s+/.test(t));
      if(bullets||numbered){
        const list=el(bullets?'ul':'ol');
        lines.forEach(line=>{const li=el('li');inline(line.replace(bullets?/^\s*[-*]\s+/:/^\s*\d+[.)]\s+/,''),li);list.append(li)});
        root.append(list);
      }else if(lines.every(t=>/^\s*>\s?/.test(t))){
        const quote=el('blockquote');inline(lines.map(t=>t.replace(/^\s*>\s?/,'')).join(' '),quote);root.append(quote);
      }else{
        const p=el('p');
        lines.forEach((line,i)=>{if(i)p.append(document.createTextNode(' '));inline(line,p)});
        root.append(p);
      }
    });
    parent.append(root);
  }
  function section(root,title,headings) {
    const kinds={'Azalpena':'explain','Erabilera eta mugak':'usage','Sakontzeko azalpenak':'depth','Egiturak eta erabilera zehatzak':'forms','Adibideak testuinguruan':'examples','Egituren arteko aldeak':'contrast','Laburpen-taulak':'tables','Ohiko nahasketak':'review','Bankuko praktika osagarria':'practice','Iturriak eta egoera editoriala':'sources'};
    const s=el('section',null,'gr-doc-section gr-doc-section-'+(kinds[title]||'explain'));
    s.id='gr-section-'+(headings.length+1);
    const heading=el('h3');
    heading.append(el('span',String(headings.length+1).padStart(2,'0'),'gr-doc-section-number'),el('span',title));
    s.append(heading);root.append(s);
    headings.push({id:s.id,title});
    return s;
  }
  function note(root,label,value,kind='info'){
    if(!value)return;
    const box=el('aside',null,'gr-doc-note gr-doc-note-'+kind);
    box.append(el('strong',label));prose(box,value);root.append(box);
  }
  function fact(root,label,value){
    if(!value)return;
    const pattern=['Eraikuntza','Baiezkoa','Ezezkoa','Egitura jokatua','Egitura jokatugabea'].includes(label);
    const d=el('div',null,'gr-doc-fact'+(pattern?' gr-doc-fact-pattern':''));
    d.append(el('dt',label));
    const dd=el('dd');prose(dd,value,'gr-doc-fact-copy');d.append(dd);root.append(d);
  }
  function example(root,item) {
    const type=['good','bad','better','contrast'].includes(item.example_type)?item.example_type:'note';
    const labels={good:'Erabilera egokia',bad:'Berrikusteko erabilera',better:'Beste formulazio bat',contrast:'Kontrastea',note:'Adibidea'};
    const figure=el('figure',null,'gr-doc-example gr-doc-example-'+type);
    figure.append(el('figcaption',labels[type]));
    const quote=el('blockquote');prose(quote,item.text_eu,'gr-doc-quote-text');figure.append(quote);
    if(item.explanation_eu)prose(figure,item.explanation_eu,'gr-doc-example-explanation');
    root.append(figure);
  }
  function form(root,item,examples) {
    const group=el('section',null,'gr-doc-form');
    group.append(el('h4',item.display_eu||item.code));
    if(item.form_group){
      const label=String(item.form_group).toLocaleLowerCase('eu').replace(/_/g,' ');
      group.append(el('span',label.charAt(0).toLocaleUpperCase('eu')+label.slice(1),'gr-doc-form-label'));
    }
    const dl=el('dl',null,'gr-doc-facts');
    [
      ['Funtzioa',item.function_eu],['Esanahia',item.meaning_eu],
      ['Eraikuntza',item.formation_eu],['Baiezkoa',item.positive_pattern_eu],
      ['Ezezkoa',item.negative_pattern_eu],['Egitura jokatua',item.finite_pattern_eu],
      ['Egitura jokatugabea',item.non_finite_pattern_eu],['Erabilera',item.use_when_eu],
      ['Erregistroa',({neutral:'Neutroa',formal:'Formala',informal:'Informala'})[item.register_label]||item.register_label],['Hizkera-aldaerak',item.dialect_note_eu]
    ].forEach(([k,v])=>fact(dl,k,v));
    if(dl.childElementCount)group.append(dl);
    note(group,'Kontuan hartu',item.warning_eu||item.avoid_when_eu,'warning');
    if(item.warning_eu&&item.avoid_when_eu)note(group,'Noiz saihestu',item.avoid_when_eu);
    const related=examples.filter(e=>e.form_id===item.id);
    if(related.length){
      group.append(el('h5','Adibideak'));
      const grid=el('div',null,'gr-doc-example-grid');
      related.forEach(e=>example(grid,e));group.append(grid);
    }
    root.append(group);
  }
  function summaryTable(root,item) {
    const block=el('section',null,'gr-doc-summary');
    block.append(el('h4',item.title_eu||'Laburpen-taula'));
    prose(block,item.description_eu);
    const columns=Array.isArray(item.columns_json)?item.columns_json:[];
    const rows=Array.isArray(item.rows_json)?item.rows_json:[];
    if(columns.length&&rows.length) {
      const scroll=el('div',null,'gr-doc-table-scroll');
      const table=el('table');const thead=el('thead');const hrow=el('tr');
      columns.forEach(c=>{const th=el('th',c);th.scope='col';hrow.append(th)});
      thead.append(hrow);table.append(thead);
      const tbody=el('tbody');
      rows.forEach(row=>{
        const values=Array.isArray(row)?row:columns.map((c,i)=>row?.[c]??row?.[i]??'');
        const tr=el('tr');
        columns.forEach((_,i)=>tr.append(el('td',values[i]??'')));
        tbody.append(tr);
      });
      table.append(tbody);scroll.append(table);block.append(scroll);
    }
    root.append(block);
  }
  function sources(root,entry,headings) {
    const content=section(root,'Iturriak eta egoera editoriala',headings);
    prose(content,'SUSTRAIren gramatika-banku editorialeko edukia. Irakurgarri egoteak ez du akademikoki egiaztatuta dagoela esan nahi. Ez da azterketa-erakunde baten material ofiziala.');
    if(entry.source_guideline)prose(content,entry.source_guideline,'gr-doc-muted');
    const list=el('ul',null,'gr-doc-source-list');
    const refs=Array.isArray(entry.metadata?.sources)?entry.metadata.sources:[];
    refs.forEach(ref=>{
      if(!ref||typeof ref.url!=='string')return;
      let url;
      try{url=new URL(ref.url)}catch{return}
      if(url.protocol!=='https:')return;
      const li=el('li');
      const a=el('a',ref.title||url.hostname);
      a.href=url.href;a.target='_blank';a.rel='noopener noreferrer';
      li.append(a);
      const type={ARAUEMAILEA:'Arauemailea',DESKRIBAPENA:'Gramatika deskribatzailea',GAITASUN_MARKOA:'Gaitasun-markoa'}[ref.source_type];
      if(type)li.append(el('small',type));
      if(ref.claim)prose(li,ref.claim,'gr-doc-source-claim');
      list.append(li);
    });
    if(list.childElementCount)content.append(list);
  }
  async function load(entry,client) {
    if(!entry?.id||!client)throw Error('Gramatika-fitxa edo konexioa falta da');
    if(cache.has(entry.id))return cache.get(entry.id);
    const selects=[
      [V.sections,'section_key,title_eu,body_eu,section_type,sort_order,metadata'],
      [V.examples,'id,entry_id,example_type,text_eu,explanation_eu,sort_order'],
      [V.forms,'id,code,display_eu,form_group,function_eu,meaning_eu,formation_eu,positive_pattern_eu,negative_pattern_eu,finite_pattern_eu,non_finite_pattern_eu,use_when_eu,avoid_when_eu,warning_eu,register_label,dialect_note_eu,sort_order'],
      [V.formExamples,'form_id,example_type,text_eu,explanation_eu,sort_order'],
      [V.contrasts,'title_eu,left_explanation_eu,right_explanation_eu,contrast_explanation_eu,wrong_use_eu,better_use_eu,sort_order'],
      [V.tables,'title_eu,description_eu,columns_json,rows_json,sort_order'],
      [V.errors,'wrong_eu,correct_eu,explanation_eu,sort_order']
    ];
    const p=Promise.all(selects.map(([view,columns])=>
      client.from(view).select(columns).eq('entry_id',entry.id).order('sort_order').limit(500).then(check)
    )).then(([sections,examples,forms,formExamples,contrasts,tables,errors])=>
      ({sections,examples,forms,formExamples,contrasts,tables,errors})
    );
    cache.set(entry.id,p);
    try{return await p}catch(err){cache.delete(entry.id);throw err}
  }
  function render(container,entry,data) {
    container.replaceChildren();
    const root=el('article',null,'gr-doc');const headings=[];
    if(entry.metadata?.pilot_public_visibility==='pending_independent_review'){
      root.append(el('p',entry.metadata.pilot_review_notice_eu||'Ikasmaterial pilotua: berrikuspen akademiko independentea egin gabe.','grammar-pilot-notice'));
    }
    if(entry.explanation_eu)prose(section(root,'Azalpena',headings),entry.explanation_eu,'gr-doc-lead-prose');
    if(entry.use_when_eu||entry.avoid_when_eu||entry.warning_eu){
      const area=section(root,'Erabilera eta mugak',headings);
      note(area,'Noiz erabili',entry.use_when_eu);
      note(area,'Noiz saihestu',entry.avoid_when_eu,'warning');
      note(area,'Kontuan hartu',entry.warning_eu,'warning');
    }
    const regular=data.sections.filter(s=>s.metadata?.content_kind!=='original_active_practice');
    const exercises=data.sections.filter(s=>s.metadata?.content_kind==='original_active_practice');
    if(regular.length){
      const area=section(root,'Sakontzeko azalpenak',headings);
      regular.forEach(s=>{
        const item=el('section',null,'gr-doc-subsection'+(s.section_type==='warning'?' gr-doc-subsection-warning':''));
        item.append(el('h4',s.title_eu));prose(item,s.body_eu);area.append(item);
      });
    }
    if(data.forms.length){
      const area=section(root,'Egiturak eta erabilera zehatzak',headings);
      data.forms.forEach(f=>form(area,f,data.formExamples));
    }
    if(data.examples.length){
      const area=section(root,'Adibideak testuinguruan',headings);
      const grid=el('div',null,'gr-doc-example-grid');
      data.examples.forEach(e=>example(grid,e));area.append(grid);
    }
    if(data.contrasts.length){
      const area=section(root,'Egituren arteko aldeak',headings);
      data.contrasts.forEach(c=>{
        const part=el('section',null,'gr-doc-comparison');
        part.append(el('h4',c.title_eu||'Kontrastea'));
        note(part,'Lehen aukera',c.left_explanation_eu);
        note(part,'Bigarren aukera',c.right_explanation_eu);
        prose(part,c.contrast_explanation_eu);
        if(c.wrong_use_eu)example(part,{example_type:'bad',text_eu:c.wrong_use_eu});
        if(c.better_use_eu)example(part,{example_type:'better',text_eu:c.better_use_eu});
        area.append(part);
      });
    }
    if(data.tables.length){
      const area=section(root,'Laburpen-taulak',headings);
      data.tables.forEach(t=>summaryTable(area,t));
    }
    if(data.errors.length){
      const area=section(root,'Ohiko nahasketak',headings);
      data.errors.forEach(e=>{
        const item=el('div',null,'gr-doc-error');
        if(e.wrong_eu)example(item,{example_type:'bad',text_eu:e.wrong_eu});
        if(e.correct_eu)example(item,{example_type:'better',text_eu:e.correct_eu});
        prose(item,e.explanation_eu);area.append(item);
      });
    }
    if(exercises.length){
      const area=section(root,'Bankuko praktika osagarria',headings);
      prose(area,'Bankuan dagoen praktika osagarria eta haren erantzunak hemen bertan kontsulta ditzakezu.','gr-doc-muted');
      exercises.forEach(s=>{
        const details=el('details',null,'gr-doc-optional');
        details.append(el('summary',s.title_eu));prose(details,s.body_eu);area.append(details);
      });
    }
    const reflection=el('details',null,'gr-doc-recall');
    reflection.append(el('summary','Gelditu une batez · zer ulertu duzu?'));
    prose(reflection,'Azaldu ideia nagusia zeure hitzekin. Ondoren, sortu adibide bat beste egoera baterako eta arrazoitu aukeratu duzun egitura. Zalantzarik baduzu, itzuli dagokion azalpen edo adibidera.');
    root.append(reflection);
    sources(root,entry,headings);
    container.append(root);
    return headings;
  }
  function outline(host,headings){
    if(headings.length<2)return;
    const menu=el('details',null,'gr-doc-outline');
    menu.open=true;
    menu.append(el('summary','Gai honetan · '+headings.length+' atal'));
    const nav=el('nav',null,'gr-doc-outline-links');
    nav.setAttribute('aria-label','Gaiaren atalak');
    headings.forEach((heading,index)=>{
      const a=el('a');a.href='#'+heading.id;
      a.append(el('span',String(index+1).padStart(2,'0'),'gr-outline-number'),el('span',heading.title));
      a.addEventListener('click',event=>{
        const target=host.querySelector('#'+heading.id);if(!target)return;
        event.preventDefault();
        const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        target.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});
        target.setAttribute('tabindex','-1');target.focus({preventScroll:true});
      });
      nav.append(a);
    });
    menu.append(nav);host.prepend(menu);
  }
  window.SustraiGrammarReader=Object.freeze({load,render,outline});
})();
