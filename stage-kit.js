/* SUSTRAI · two-step flow on compact screens: first choose a task, then work on it.
   Desktop keeps the side-by-side layout; below the page's breakpoint the catalog and the workshop
   become two views. The task lives in the URL (?ataza=…), so the phone's back button, reloads and
   shared links all land in the right place. Pages call:
     SustraiStage.init({breakpoint, open(slug) -> bool, title() -> string})  once tasks are loaded
     SustraiStage.opened(slug)                                               when the student picks a task */
(function(){
  'use strict';
  const PARAM='ataza';
  let options=null,mq=null,pushed=false;

  const compact=()=>!!mq&&mq.matches;
  const current=()=>{try{return new URL(location.href).searchParams.get(PARAM)}catch{return null}};
  function setStage(stage){document.body.dataset.stage=stage}
  function url(slug){const u=new URL(location.href);if(slug)u.searchParams.set(PARAM,slug);else u.searchParams.delete(PARAM);return u.toString()}

  function backBar(){
    let bar=document.getElementById('stageBack');
    if(bar)return bar;
    bar=document.createElement('nav');
    bar.id='stageBack';bar.className='stage-back';bar.setAttribute('aria-label','Atazaren nabigazioa');
    const btn=document.createElement('button');
    btn.type='button';btn.className='stage-back-button';
    btn.innerHTML='<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6 6 6"/></svg><span>Ataza guztiak</span>';
    btn.onclick=goBack;
    const title=document.createElement('span');
    title.className='stage-back-title';title.id='stageBackTitle';
    bar.append(btn,title);
    document.querySelector('.layout > .maincol')?.prepend(bar);
    return bar;
  }
  function refreshTitle(){const el=document.getElementById('stageBackTitle');if(el&&options)el.textContent=options.title?.()||''}

  function showWork(){
    setStage('work');refreshTitle();
    if(compact()){window.scrollTo(0,0);document.getElementById('stageBack')?.querySelector('button')?.focus({preventScroll:true})}
  }
  function showCatalog(){
    setStage('catalog');
    if(compact()){window.scrollTo(0,0);document.querySelector('.layout > .catalog .task-card.selected, .layout > .catalog .task-card.active')?.scrollIntoView({block:'center'})}
  }
  function goBack(){
    if(pushed&&history.state&&history.state.sustraiStage){history.back();return}
    try{history.replaceState(null,'',url(null))}catch{}
    showCatalog();
  }

  window.SustraiStage={
    init(opts){
      options=opts;
      mq=matchMedia('(max-width:'+(opts.breakpoint||850)+'px)');
      backBar();
      // Arriving with ?ataza=… means the student asked for that task: go straight to work.
      // Arriving without it on a phone means they came to choose.
      if(current()||!compact())showWork();else showCatalog();
      window.addEventListener('popstate',()=>{
        const slug=current();
        if(slug){if(options.open(slug)!==false)showWork()}
        else showCatalog();
      });
      mq.addEventListener?.('change',()=>{if(!compact())setStage('work');else if(!current())showCatalog()});
    },
    opened(slug){
      if(!options)return;
      try{
        if(compact()&&current()!==slug){history.pushState({sustraiStage:true},'',url(slug));pushed=true}
        else history.replaceState(history.state,'',url(slug));
      }catch{}
      showWork();
    },
    refreshTitle
  };
})();
