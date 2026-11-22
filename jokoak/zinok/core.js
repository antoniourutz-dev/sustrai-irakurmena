/* ZINOK · SUSTRAI jokoaren logika. Jatorria: antoniourutz-dev/zinok. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.ZinokCore=api;
})(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:null),function(){
  'use strict';
  const normalize=value=>String(value||'').trim().toLocaleLowerCase('eu');
  function shuffle(items,random=Math.random){
    const result=[...items];
    for(let i=result.length-1;i>0;i--){
      const j=Math.floor(random()*(i+1));
      [result[i],result[j]]=[result[j],result[i]];
    }
    return result;
  }
  function isEntry(row){
    if(!row||typeof row.hitza!=='string'||!normalize(row.hitza)||!Array.isArray(row.sinonimoak))return false;
    if(row.active===false)return false;
    return row.sinonimoak.some(word=>typeof word==='string'&&normalize(word)&&normalize(word)!==normalize(row.hitza));
  }
  function quiz(entries,count=10,random=Math.random){
    const valid=entries.filter(isEntry);
    const chosen=[];const usedWords=new Set();
    for(const row of shuffle(valid,random)){
      const base=normalize(row.hitza);
      if(usedWords.has(base))continue;
      const related=[...new Set(row.sinonimoak.filter(s=>typeof s==='string').map(s=>s.trim()).filter(s=>normalize(s)&&normalize(s)!==base))];
      if(!related.length)continue;
      const targetAnswer=shuffle(related,random)[0];
      const blocked=new Set([base,...related.map(normalize)]);
      const pool=valid.filter(other=>{
        const key=normalize(other.hitza);
        if(blocked.has(key))return false;
        // Do not label a clearly reciprocal lexical relation as a distractor.
        return !other.sinonimoak.some(s=>normalize(s)===base||normalize(s)===normalize(targetAnswer));
      }).map(other=>other.hitza.trim());
      const distractors=[];
      for(const item of shuffle(pool,random)){
        if(blocked.has(normalize(item))||distractors.some(x=>normalize(x)===normalize(item)))continue;
        distractors.push(item);
        if(distractors.length===3)break;
      }
      if(distractors.length<3)continue;
      const options=shuffle([targetAnswer,...distractors],random);
      chosen.push({
        sourceId:String(row.source_id||row.id||''),level:Number(row.level)||null,
        part:Number(row.part)||null,word:row.hitza.trim(),correctAnswer:targetAnswer,
        options,correctIndex:options.findIndex(x=>x===targetAnswer),
        knownAlternatives:related
      });
      usedWords.add(base);
      if(chosen.length===count)break;
    }
    return chosen;
  }
  function isPuzzle(value){
    if(!value||typeof value.id!=='string'||!value.esaldia||!Array.isArray(value.targets)||!value.targets.length)return false;
    return value.targets.every(t=>t&&typeof t.klabea==='string'&&normalize(t.klabea)&&
      normalize(value.esaldia).includes(normalize(t.klabea))&&typeof t.zuzena==='string'&&normalize(t.zuzena)&&
      Array.isArray(t.distraktoreak)&&t.distraktoreak.length===3&&
      new Set([t.zuzena,...t.distraktoreak].map(normalize)).size===4);
  }
  function puzzleGroups(items,perGroup=5){
    const safe=items.filter(isPuzzle);
    const groups=[];
    for(let i=0;i<safe.length;i+=perGroup)
      groups.push({id:String(groups.length+1),label:(groups.length+1)+'. sorta',puzzles:safe.slice(i,i+perGroup)});
    return groups;
  }
  function score(results){return {correct:results.filter(r=>r.correct===true).length,total:results.length,wrong:results.filter(r=>r.correct!==true).length};}
  return Object.freeze({normalize,shuffle,isEntry,quiz,isPuzzle,puzzleGroups,score});
});
