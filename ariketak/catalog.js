/* SUSTRAI Ariketak catalog. Public taxonomy is readable without login.
   Exercise versions are resolved only through RLS; no answers are fetched.
   No guessed score, no draft publication and no book-text copying. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const cloud = window.SustraiCloud;
  const LEVELS = ['B2', 'C1'];
  const state = { client: null, blocks: [], sections: [], level:'B2', block:null, section:null, token:0,pilotVersions:new Set(), cacheOwner:null, cacheEpoch:0, sectionCache:new Map(), sectionRequests:new Map() };
  // Cache only RLS-visible catalog metadata, never response keys or student work.
  // In-memory and short-lived: a new page load always consults the server.
  const SECTION_CACHE_TTL = 60_000;
  const SECTION_CACHE_LIMIT = 20;
  function cacheOwner() {
    const owner = cloud?.user()?.id || null;
    if (owner !== state.cacheOwner) {
      state.cacheOwner = owner;
      invalidateSectionCache();
    }
    return owner;
  }
  function invalidateSectionCache() {
    state.cacheEpoch++;
    state.sectionCache.clear();
    state.sectionRequests.clear();
  }
  function cachedSection(section) {
    if (!cacheOwner()) return null;
    const cached = state.sectionCache.get(section);
    if (!cached) return null;
    if (Date.now() - cached.loadedAt >= SECTION_CACHE_TTL) {
      state.sectionCache.delete(section);
      return null;
    }
    return cached.data;
  }
  function rememberSection(section, data) {
    state.sectionCache.delete(section);
    state.sectionCache.set(section, {loadedAt: Date.now(), data});
    while (state.sectionCache.size > SECTION_CACHE_LIMIT) {
      state.sectionCache.delete(state.sectionCache.keys().next().value);
    }
  }
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
    $('practiceGrid').setAttribute('aria-busy', 'false');
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
    if (meta === 'Ariketak prestatzen') btn.classList.add('is-pending');
    btn.type='button';
    btn.append(make('span',top,'practice-card-number'));
    if(tag) btn.append(make('span',tag,'practice-tag'+(tag==='Berrikusteko'?' practice-tag--draft':'')));
    btn.append(make('strong',title,'practice-card-title'));
    if (meta) btn.append(make('span',meta,'practice-card-meta'));
    const foot=make('span',null,'practice-card-foot');
    foot.append(make('span',action));
    btn.append(foot);
    btn.addEventListener('click',handler);
    return btn;
  }
  function renderBlocks() {
    const blocks=state.blocks.filter(b => b.level === state.level).sort(sorted);
    $('catalogTitle').textContent = state.level+' · Aukeratu blokea';
    status(blocks.length ? blocks.length + ' bloke · hautatu bat atalak ikusteko.' : 'Ez dago blokerik maila honetan.');
    if(!blocks.length) {empty('Oraingoz ez dago maila honetako ariketa-blokerik.');return;}
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
    status(topics.length+' atal · '+shown.length+' ikusgai. Aukeratu atala ariketak ikusteko.');
    shown.forEach((s)=>{
      const tag=s.editorial_state==='draft'?'Jarduerak':null;
      $('practiceGrid').append(card(String(s.position).padStart(2,'0'),s.title_eu,tag?'':'Ariketak prestatzen', tag ? 'Ariketak ikusi' : 'Atalaren xehetasunak',()=>go(state.level,b.code,s.code),tag));
    });
    if(!shown.length)empty('Ez da bat datorren atalik aurkitu. Probatu beste bilaketa bat.');
  }
  function renderSectionLoading() {
    $('catalogTitle').textContent=chosenSection().title_eu;
    status('Ariketak kargatzen…');
    $('practiceGrid').setAttribute('aria-busy','true');
    // Decorative placeholders; the live status above announces loading once.
    for (let i=0; i<6; i++) {
      const card=make('div',null,'practice-skeleton');
      card.setAttribute('aria-hidden','true');
      for (const cls of ['tag','title','text','text-short','button']) {
        card.append(make('span',null,'practice-skeleton-'+cls));
      }
      $('practiceGrid').append(card);
    }
  }
  function renderExercises(list, token) {
    if(token!==state.token || !state.section) return;
    clear();
    status(list.length+' jarduera eskuragarri');
    if(!list.length){
      if(!cloud?.user())empty('Ariketak ikusteko, hasi saioa. Katalogoaren atalak konturik gabe kontsulta daitezke.',true);
      else empty('Atal honetan oraindik ez dago zure kontuarentzat eskuragarri dagoen ariketarik.');
      return;
    }
    for(const a of list){
      const article=make('article',null,'practice-card practice-card--exercise');
      article.append(make('span','Ariketa','practice-card-number'));
      const pilot=state.pilotVersions.has(a.id);
      const badge=make('span','Jarduera eskuragarri','practice-tag');
      article.append(badge,make('h3',a.prompt_json?.title_eu || 'Jarduera','practice-card-title'));
      article.append(make('p',(a.itemCount??0)+' galdera','practice-card-meta'));
      const foot=make('div',null,'practice-card-foot');
      {
        const aLink=make('a','Hasi ariketa');
        const from=location.pathname+location.search;
        aLink.href='/aditzak/?activity='+encodeURIComponent(a.id)+'&from='+encodeURIComponent(from);
        foot.append(aLink);
      }
      article.append(foot);
      $('practiceGrid').append(article);
    }
  }
  async function fetchSection(section, owner, epoch) {
    const client=state.client;
    // Links and pilot permissions are independent. Fetch both in the first round.
    const [linkResult, pilotResult]=await Promise.all([
      client.from('smx_exercise_activity_links')
        .select('activity_id,position').eq('section_code',section).order('position').limit(300),
      client.from('smx_aditzak_pilot_releases')
        .select('activity_version_id').eq('active',true).limit(1000)
    ]);
    const links=check(linkResult);
    const pilotVersions=check(pilotResult).map(x=>x.activity_version_id);
    let list=[];
    if (links.length) {
      const ids=links.map(x=>x.activity_id);
      // Both queries depend on links, but not on each other.
      const [actResult, versionResult]=await Promise.all([
        client.from('smx_activities').select('id,kind,code').in('id',ids).limit(300),
        client.from('smx_activity_versions')
          .select('id,activity_id,revision,prompt_json,status').in('activity_id',ids)
          .order('revision',{ascending:false}).limit(500)
      ]);
      const acts=check(actResult), versions=check(versionResult);
      const byAct=new Map();
      versions.forEach(v=>{
        if(v.status!=='approved' && !pilotVersions.includes(v.id)) return;
        if(!byAct.has(v.activity_id))byAct.set(v.activity_id,v);
      });
      const actById=new Map(acts.map(a=>[a.id,a]));
      list=links.flatMap(l=>{
        const a=actById.get(l.activity_id),v=byAct.get(l.activity_id);
        return a&&v ? [{...a,...v,position:l.position}] : [];
      });
      const versionIds=list.map(v=>v.id);
      const counts=new Map();
      if (versionIds.length) {
        const rows=check(await client.from('smx_activity_items')
          .select('activity_version_id').in('activity_version_id',versionIds).limit(1000));
        for (const row of rows) counts.set(row.activity_version_id,(counts.get(row.activity_version_id)||0)+1);
      }
      list.forEach(v=>v.itemCount=counts.get(v.id)||0);
    }
    const data={list,pilotVersions};
    // An old response must never populate another account's cache.
    if (owner===cacheOwner() && epoch===state.cacheEpoch) rememberSection(section,data);
    return data;
  }
  async function loadSection() {
    const token=++state.token, section=state.section;
    if(!state.client){clear();status('Konexioa ez dago prest.',true);empty('Ezin izan da katalogoa kargatu. Eguneratu orria.');return;}
    const owner=cacheOwner(), epoch=state.cacheEpoch;
    if(!owner){renderExercises([],token);return;}
    try {
      // Reuse a pending request when rapid navigation returns to the same section.
      let request=state.sectionRequests.get(section);
      if (!request) {
        request=fetchSection(section,owner,epoch);
        state.sectionRequests.set(section,request);
      }
      let data;
      try { data=await request; }
      finally {
        if(state.sectionRequests.get(section)===request)state.sectionRequests.delete(section);
      }
      if(token!==state.token || owner!==cacheOwner() || epoch!==state.cacheEpoch)return;
      state.pilotVersions=new Set(data.pilotVersions);
      renderExercises(data.list,token);
    } catch(err) {
      if(token!==state.token || owner!==cacheOwner() || epoch!==state.cacheEpoch)return;
      console.warn('Ariketak catalog detail failed',err?.code||'network');
      clear();status('Ariketak ezin izan dira kargatu. Saiatu berriro.',true);
      empty('Konexio- edo baimen-arazo bat izan da.');
      const retry=make('button','Berriro saiatu');
      retry.type='button';retry.addEventListener('click',render);
      $('practiceEmpty').append(retry);
    }
  }
  function render() {
    levels(); crumbs(); clear();$('practiceFilter').hidden=true;
    if(!state.block){renderBlocks();return;}
    if(!state.section){renderTopics();return;}
    const cached=cachedSection(state.section);
    if (cached) {
      $('catalogTitle').textContent=chosenSection().title_eu;
      state.pilotVersions=new Set(cached.pilotVersions);
      renderExercises(cached.list,state.token);
    } else if (!cloud?.user()) {
      $('catalogTitle').textContent=chosenSection().title_eu;
      renderExercises([],state.token);
    } else {
      renderSectionLoading();loadSection();
    }
  }
  async function init() {
    try{
      await cloud?.ready;
      state.client=cloud?.client?.();
      if(!state.client) throw new Error('Supabase client unavailable');
      cacheOwner();
      state.client.auth?.onAuthStateChange((event,session)=>{
        // Refreshing an unchanged session keeps metadata; account/access changes do not.
        const owner=session?.user?.id || null;
        if(event==='SIGNED_OUT' || event==='USER_UPDATED' || owner!==state.cacheOwner) {
          state.cacheOwner=owner;
          invalidateSectionCache();
          state.token++;
          state.pilotVersions.clear();
          if (event==='SIGNED_OUT' && state.section) {
            clear();
            renderExercises([],state.token);
          }
        }
      });
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
