/* HITZ-DROP · Supabase-first lexical derivation candidates.
   No hardcoded word-family pairs: source lemmas come from existing Lexikoa tables.
   Word presence + a string decomposition is NOT an academic review of derivation.
   This module powers a controlled, explicitly provisional arcade preview only.
*/
(() => {
  'use strict';
  const CACHE_KEY='sustrai-hitzdrop-supabase-catalog-v2';
  const PAGE=650;
  const SUFFIXES=['tasun','keria','garri','kor','tu','du','ki','ka','dun','gabe','tegi','txo','tzaile'];
  const PREFIXES=['des','berr','bir','ber','ez'];
  const PROBLEMATIC=new Set([
    'BER|OTU|BEROTU', // not the re-iteration prefix ber-
    'BERR|ETSI|BERRETSI', // lexical meaning not transparently derived from etsi
    'EZ|ETSI|EZETSI',
    'EZ|BEHAR|EZBEHAR',
    'BER|RITU|BERRITU',
    'ERDI|ETSI|ERDIETSI'
  ]);
  const safeText=value=>String(value??'').trim().toLocaleUpperCase('eu');
  const isSingleWord=value=>/^\p{L}{3,35}$/u.test(value);
  const normalize=value=>String(value??'').trim().toLocaleLowerCase('eu');

  async function pages(client,table,columns,filters) {
    const all=[];
    for(let start=0;start<8000;start+=PAGE) {
      let query=client.from(table).select(columns);
      if(filters)query=filters(query);
      const {data,error}=await query.order('id',{ascending:true}).range(start,start+PAGE-1);
      if(error)throw new Error(table+': '+error.message);
      all.push(...(data||[]));
      if(!data || data.length<PAGE)return all;
    }
    throw new Error(table+': orrialde gehiegi');
  }
  function build(source) {
    const words=new Map();
    const put=(value,kind,meaning,definition,origin)=>{
      const lemma=safeText(value);
      if(!isSingleWord(lemma))return;
      const existing=words.get(lemma)||{lemma,gloss:'',definitionEu:'',sources:new Set(),kinds:new Set()};
      if(meaning&&!existing.gloss)existing.gloss=String(meaning).slice(0,150);
      if(definition&&!existing.definitionEu)existing.definitionEu=String(definition).slice(0,220);
      existing.sources.add(origin);
      if(kind)existing.kinds.add(kind);
      words.set(lemma,existing);
    };
    for(const row of source.lex)put(row.lema,row.kategoria,row.glosa_es,row.definizio_didaktikoa_eu,'lexiko_sarrerak');
    for(const row of source.verb) {
      if(/^EZ ARGITARATU/i.test(String(row.argitalpen_egoera||'')))continue;
      put(row.aditza,'verb','',row.definizioa_eu,'sustrai_aditz_definizioak');
    }
    const allowedGroups=new Set(source.groups.map(g=>String(g.id)));
    for(const row of source.lexical) {
      if(allowedGroups.has(String(row.group_id)))put(row.word,'', '', '', 'lexical_words');
    }
    for(const row of source.entries)put(row.lemma_eu,row.entry_type,row.meaning_es,'','lexiko_entries');
    const pairs=new Map();
    for(const record of words.values()) {
      for(const affix of PREFIXES) {
        if(!record.lemma.startsWith(affix.toLocaleUpperCase('eu')))continue;
        const base=record.lemma.slice(affix.length);
        if(!words.has(base)||base.length<3)continue;
        if(affix==='ber'&&record.lemma!=='BERPIZTU')continue;
        if(affix==='ez'&&record.lemma!=='EZOHIKO')continue;
        if(PROBLEMATIC.has(affix.toLocaleUpperCase('eu')+'|'+base+'|'+record.lemma))continue;
        const left=affix.toLocaleUpperCase('eu')+'-', right=base;
        const key='prefix|'+left+'|'+right;
        pairs.set(key,{type:'prefix',left,right,result:record.lemma,
          gloss:record.gloss,definitionEu:record.definitionEu,
          resultSources:[...record.sources],baseSources:[...words.get(base).sources],
          reviewStatus:'needs_morphological_review'});
      }
      for(const affix of SUFFIXES) {
        if(!record.lemma.endsWith(affix.toLocaleUpperCase('eu')))continue;
        const base=record.lemma.slice(0,-affix.length);
        if(!words.has(base)||base.length<3)continue;
        const left=base,right='-'+affix.toLocaleUpperCase('eu');
        const key='suffix|'+left+'|'+right;
        pairs.set(key,{type:'suffix',left,right,result:record.lemma,
          gloss:record.gloss,definitionEu:record.definitionEu,
          resultSources:[...record.sources],baseSources:[...words.get(base).sources],
          reviewStatus:'needs_morphological_review'});
      }
    }
    return {entries:[...pairs.values()],wordCount:words.size,
      affixes:[...new Set([...pairs.values()].map(p=>p.type==='prefix'?p.left:p.right))]};
  }
  function cached(){
    try {
      const data=JSON.parse(localStorage.getItem(CACHE_KEY)||'null');
      if(data && Number.isFinite(data.cachedAt)&&Date.now()-data.cachedAt<7*86400000
        &&Array.isArray(data.entries)&&data.entries.length>=30)
        return {entries:data.entries,wordCount:data.wordCount,affixes:data.affixes,
          origin:'supabase-cache'};
    } catch {}
    return null;
  }
  async function load(cloud){
    try {
      const client=cloud&&typeof cloud.client==='function'&&cloud.client();
      if(!client)throw new Error('Supabase konexioa ez dago prest');
      const [lex,verb,lexical,groups,entries]=await Promise.all([
        pages(client,'lexiko_sarrerak','id,lema,kategoria,glosa_es,definizio_didaktikoa_eu',q=>q.eq('berrikusi_behar_da',false)),
        pages(client,'sustrai_aditz_definizioak','id,aditza,definizioa_eu,argitalpen_egoera',q=>q.not('argitalpen_egoera','ilike','%EZ ARGITARATU%')),
        pages(client,'lexical_words','id,group_id,word',q=>q.eq('is_active',true).eq('status','egokia')),
        pages(client,'lexical_groups','id',q=>q.eq('is_active',true).in('review_status',['reviewed_safe','reviewed_context_needed','reviewed_register_sensitive'])),
        pages(client,'lexiko_entries','id,lemma_eu,entry_type,meaning_es',q=>q.eq('status','published'))
      ]);
      const result=build({lex,verb,lexical,groups,entries});
      const prefix=result.entries.filter(x=>x.type==='prefix').length;
      const suffix=result.entries.filter(x=>x.type==='suffix').length;
      if(prefix<10||suffix<30)throw new Error('Material nahikorik ez: '+prefix+' aurrizki / '+suffix+' atzizki');
      try {localStorage.setItem(CACHE_KEY,JSON.stringify({...result,cachedAt:Date.now()}));} catch {}
      return {...result,origin:'supabase-live',prefixCount:prefix,suffixCount:suffix};
    } catch(error){
      const previous=cached();
      if(previous)return {...previous,prefixCount:previous.entries.filter(x=>x.type==='prefix').length,
        suffixCount:previous.entries.filter(x=>x.type==='suffix').length,warning:String(error.message||error)};
      throw error;
    }
  }
  window.HitzDropCatalog={load};
})();