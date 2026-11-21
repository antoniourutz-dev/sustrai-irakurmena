/* SUSTRAI Ariketak catalog. Public taxonomy is readable without login.
   Exercise versions are resolved only through RLS; no answers are fetched.
   No guessed score, no draft publication and no book-text copying. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const cloud = window.SustraiCloud;
  const LEVELS = ['B2', 'C1', 'C2'];
  const state = { client: null, blocks: [], sections: [], level:'B2', block:null, section:null, token:0,pilotVersions:new Set() };
  const make = (tag, value, cls) => {
    const el = document.createElement(tag);
    if (value != null) el.textContent = String(value);
    if (cls) el.className = cls;
    return el;
  };
  const validLevel = (v) => LEVELS.includes(v);
  const sorted = (a, b) => a.position - b.position;
  const check = (r) => { if (r.error) throw r.error; return r.data || []; };
  const status = (message, bad=false) => {
    $('practiceStatus').textContent = message;
    $('practiceStatus').classList.toggle('is-error', bad);
  };
  const empty = (message, offerLogin=false) => {
    const root = $('practiceEmpty');
    root.replaceChildren(make('p', message));
    if (offerLogin && cloud?.openLogin) {
      const button = make('button', 'Saioa hasi');
      button.type = 'button';
      button.addEventListener('click', () => cloud.openLogin('login'));
      root.append(button);
    }
    root.hidden = false;
  };
  const clear = () => {
    $('practiceGrid').replaceChildren();
    $('practiceEmpty').hidden = true;
  };
  const chosenBlock = () => state.blocks.find(b => b.code === state.block && b.level === state.level);
  const chosenSection = () => state.sections.find(s => s.code === state.section && s.block_code === state.block);
  function fromLocation() {
    const q = new URLSearchParams(location.search);
    state.level = validLevel(q.get('maila')) ? q.get('maila') : 'B2';
    const b = state.blocks.find(x => x.code === q.get('blokea') && x.level === state.level);
    state.block = b?.code || null;
    const s = state.sections.find(x => x.code === q.get('atala') && x.block_code === state.block);
    state.section = s?.code || null;
  }
  function writeUrl(push=true) {
    const url = new URL(location.href);
    url.searchParams.set('maila', state.level);
    if (state.block) url.searchParams.set('blokea', state.block); else url.searchParams.delete('blokea');
    if (state.section) url.searchParams.set('atala', state.section); else url.searchParams.delete('atala');
    if (push) history.pushState(null, '', url); else history.replaceState(null, '', url);
  }
  function go(level, block=null, section=null, options={}) {
    const b = state.blocks.find(x => x.code === block && x.level === level);
    const s = state.sections.find(x => x.code === section && x.block_code === b?.code);
    state.level = validLevel(level) ? level : 'B2';
    state.block = b?.code || null;
    state.section = s?.code || null;
    state.token++;
    if (!options.popstate) writeUrl();
    $('topicSearch').value = '';
    render();
    if (!options.popstate) $('catalogTitle').focus({preventScroll:true});
  }
  function levels() {
    const root = $('practiceLevels');
    root.replaceChildren();
    for (const level of LEVELS) {
      const button = make('button', level);
      button.type = 'button';
      button.setAttribute('aria-pressed', String(state.level === level));
      button.addEventListener('click', () => go(level));
      root.append(button);
    }
  }
  function crumbs() {
    const root = $('practiceCrumbs');
    root.replaceChildren();
    const base = make('button', 'Mailak');
    base.type = 'button'; base.addEventListener('click', () => go(state.level));
    if (state.block) {
      root.append(base, make('span', '›'));
      const block = chosenBlock();
      if (state.section) {
        const b = make('button', block?.title_eu || state.block);
        b.type='button'; b.addEventListener('click', () => go(state.level, state.block));
        root.append(b, make('span','›'), make('span', chosenSection()?.title_eu || state.section));
      } else {
        const current = make('span', block?.title_eu || state.block);
        current.setAttribute('aria-current','location');root.append(current);
      }
    } else {
      const current=make('span',state.level+' maila');
      current.setAttribute('aria-current','location');
      root.append(make('span','›'), current);
    }
  }
  function card(top,title,meta,action,handler,tag=null) {
    const btn=make('button',null,'practice-card');
    btn.type='button';
    btn.append(make('span',top,'practice-card-number'));
    if(tag) btn.append(make('span',tag,'practice-tag'+(tag==='Berrikusteko'?' practice-tag--draft':'')));
    btn.append(make('strong',title,'practice-card-title'),make('span',meta,'practice-card-meta'));
    const foot=make('span',null,'practice-card-foot');
    foot.append(make('span',action),make('span','→'));
    btn.append(foot);
    btn.addEventListener('click',handler);
    return btn;
  }
  function renderBlocks() {
    const blocks=state.blocks.filter(b => b.level === state.level).sort(sorted);
    $('catalogTitle').textContent = state.level+' · Aukeratu blokea';
    status(blocks.length ? blocks.length + ' bloke · hautatu bat atalak ikusteko.' : 'Ez dago blokerik maila honetan.');
    if(!blocks.length) {empty('C2ko ariketa-blokeak prestatzen ari gara. Oraingoz ez dago argitaratzeko eduki antolaturik.');return;}
    blocks.forEach((b,i)=>{
      const count=state.sections.filter(s=>s.block_code===b.code).length;
      const label=count+' atal · edukien sailkapena';
      $('practiceGrid').append(card(String(i+1).padStart(2,'0')+' · '+state.level, b.title_eu,label,'Atalak ikusi',()=>go(state.level,b.code)));
    });
  }
  function renderTopics() {
    const b=chosenBlock();
    $('catalogTitle').textContent=state.level+' · '+b.title_eu;
    const topics=state.sections.filter(s=>s.block_code===b.code).sort(sorted);
    $('practiceFilter').hidden=false;
    const search=$('topicSearch').value.trim().toLocaleLowerCase('eu');
    const shown=topics.filter(s=>s.title_eu.toLocaleLowerCase('eu').includes(search));
    status(topics.length+' atal · '+shown.length+' ikusgai. Jarduerak argitaratzeko, berrikuspen akademikoa behar da.');
    shown.forEach((s)=>{
      const tag=s.editorial_state==='draft'?'Berrikusteko':null;
      $('practiceGrid').append(card(String(s.position).padStart(2,'0'),s.title_eu,tag?'Ariketak berrikuspen akademikoan':'Ariketak prestatzeko', 'Ariketak ikusi',()=>go(state.level,b.code,s.code),tag));
    });
    if(!shown.length)empty('Ez da bat datorren atalik aurkitu. Probatu beste bilaketa bat.');
  }
  function renderSectionLoading() {
    const b=chosenBlock(),s=chosenSection();
    $('catalogTitle').textContent=s.title_eu;
    status(state.level+' · '+b.title_eu+' · '+s.title_eu);
    empty('Ariketak egiaztatzen…');
  }
  function renderExercises(list, token) {
    if(token!==state.token || !state.section) return;
    clear();
    const approved=list.filter(x=>x.status==='approved').length;
    const pilot=list.filter(x=>state.pilotVersions.has(x.id)).length;
    const drafts=list.filter(x=>x.status!=='approved'&&!state.pilotVersions.has(x.id)).length;
    status(approved+' ariketa egiaztatu · '+pilot+' proba kontrolatuan'
      +(drafts?' · '+drafts+' barne-zirriborro':''));
    if(!list.length){
      if(!cloud?.user())empty('Ariketak ikusteko, hasi saioa. Katalogoaren atalak konturik gabe kontsulta daitezke.',true);
      else empty('Atal honetan ez dago oraindik ikaslearentzako argitaratutako ariketarik. Edukia prestatzen eta egiaztatzen ari gara.');
      return;
    }
    for(const a of list){
      const article=make('article',null,'practice-card practice-card--exercise');
      article.append(make('span',String(a.position).padStart(2,'0')+' · '+(a.prompt_json?.mechanism_code||a.kind||'Ariketa'),'practice-card-number'));
      const pilot=state.pilotVersions.has(a.id);
      const badge=make('span',pilot?'PROBA · Ez egiaztatua':a.status==='approved'?'Argitaratua':'Berrikusteko',
        'practice-tag'+(a.status==='approved'?'':' practice-tag--draft'));
      article.append(badge,make('h3',a.prompt_json?.title_eu || 'Jarduera','practice-card-title'));
      article.append(make('p',(a.itemCount??0)+' galdera · '
        +(pilot?'Probatzaileentzat · erantzunak eta oharrak gordetzen dira.':a.status==='approved'
          ?'Ikaslearentzako jarduera':'Barne-aurrebista, ez argitaratua.'),'practice-card-meta'));
      const foot=make('div',null,'practice-card-foot');
      if(state.block.endsWith('-ADI')){
        const aLink=make('a',pilot?'Probatu ariketa':a.status==='approved'?'Hasi ariketa':'Berrikusi ariketa');
        const from=location.pathname+location.search;
        aLink.href='/aditzak/?activity='+encodeURIComponent(a.id)+'&from='+encodeURIComponent(from);
        foot.append(aLink,make('span','→'));
      } else foot.append(make('span','Ariketa-motorra prestatzen'));
      article.append(foot);
      $('practiceGrid').append(article);
    }
  }
  async function loadSection() {
    const token=++state.token;
    const section=state.section;
    if(!state.client){status('Konexioa ez dago prest.',true);empty('Ezin izan da katalogoa kargatu. Eguneratu orria.');return;}
    if(!cloud?.user()){renderExercises([],token);return;}
    try {
      const links=check(await state.client.from('smx_exercise_activity_links')
        .select('activity_id,position').eq('section_code',section).order('position').limit(300));
      if(token!==state.token) return;
      if(!links.length){renderExercises([],token);return;}
      const ids=links.map(x=>x.activity_id);
      const acts=check(await state.client.from('smx_activities')
        .select('id,kind,code').in('id',ids).limit(300));
      const pilotRows=check(await state.client.from('smx_aditzak_pilot_releases')
        .select('activity_version_id').eq('active',true).limit(100));
      state.pilotVersions=new Set(pilotRows.map(x=>x.activity_version_id));
      const versions=check(await state.client.from('smx_activity_versions')
        .select('id,activity_id,revision,prompt_json,status').in('activity_id',ids).order('revision',{ascending:false}).limit(500));
      if(token!==state.token) return;
      const byAct=new Map();
      versions.forEach(v=>{if(!byAct.has(v.activity_id))byAct.set(v.activity_id,v)});
      const actById=new Map(acts.map(a=>[a.id,a]));
      const visible=links.flatMap(l=>{
        const a=actById.get(l.activity_id),v=byAct.get(l.activity_id);
        return a&&v ? [{...a,...v,position:l.position}] : [];
      });
      const selectedVersionIds=visible.map(v=>v.id);
      let counts=new Map();
      if(selectedVersionIds.length){
        const itemRows=check(await state.client.from('smx_activity_items')
          .select('activity_version_id').in('activity_version_id',selectedVersionIds).limit(1000));
        for(const row of itemRows) counts.set(row.activity_version_id,(counts.get(row.activity_version_id)||0)+1);
      }
      visible.forEach(v=>v.itemCount=counts.get(v.id)||0);
      renderExercises(visible,token);
    } catch(err) {
      if(token!==state.token)return;
      console.warn('Ariketak catalog detail failed',err?.code||'network');
      clear();status('Ariketak ezin izan dira kargatu. Saiatu berriro.',true);
      empty('Konexio- edo baimen-arazo bat izan da. Berriro saiatu.',false);
    }
  }
  function render() {
    levels(); crumbs(); clear();$('practiceFilter').hidden=true;
    if(!state.block){renderBlocks();return;}
    if(!state.section){renderTopics();return;}
    renderSectionLoading();loadSection();
  }
  async function init() {
    try{
      await cloud?.ready;
      state.client=cloud?.client?.();
      if(!state.client) throw new Error('Supabase client unavailable');
      const [b,s]=await Promise.all([
        state.client.from('smx_exercise_blocks').select('code,level,position,title_eu').order('position').limit(200),
        state.client.from('smx_exercise_sections').select('code,block_code,position,title_eu,editorial_state').order('position').limit(300)
      ]);
      state.blocks=check(b);state.sections=check(s);
      fromLocation(); render();
    }catch(err){
      console.warn('Ariketak catalog unavailable',err?.code||'network');
      $('catalogTitle').textContent='Ezin da katalogoa ireki';
      status('Supabase konexioa ez dago erabilgarri.',true);
      empty('Katalogoa ezin izan da kargatu; egiaztatu konexioa eta berriro saiatu.');
    }
  }
  $('catalogTitle').tabIndex=-1;
  $('topicSearch').addEventListener('input',()=>{
    if(state.block && !state.section){clear();renderTopics();}
  });
  window.addEventListener('popstate',()=>{
    if(!state.blocks.length)return;
    fromLocation(); state.token++; $('topicSearch').value='';render();
  });
  init();
})();
