/* ZINOK · Original six-group synonym game, integrated into SUSTRAI. */
(function(root,factory){
  'use strict';
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root)root.ZinokCore=api;
})(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:null),function(){
  'use strict';
  const LEVELS=Object.freeze(['B1','B2','C1','C2','EX','MA']);
  const normalize=value=>String(value??'').trim().toLocaleLowerCase('eu');
  function shuffle(items,random=Math.random){
    const result=[...items];
    for(let i=result.length-1;i>0;i--){
      const j=Math.floor(random()*(i+1));
      [result[i],result[j]]=[result[j],result[i]];
    }
    return result;
  }
  function isGroup(g){
    return g&&LEVELS.includes(g.level)&&Array.isArray(g.words)&&
      g.words.length>=2&&g.words.every(w=>typeof w==='string'&&!!normalize(w))&&
      new Set(g.words.map(normalize)).size>=2;
  }
  function quiz(data,level,count=10,random=Math.random){
    if(!LEVELS.includes(level))throw new RangeError('ZINOK maila ezezaguna');
    const groups=data.filter(isGroup);
    const selected=shuffle(groups.filter(g=>g.level===level),random);
    const result=[],seen=new Set();
    for(const g of selected){
      const alternatives=[...new Set(g.words.map(w=>w.trim()))];
      const word=shuffle(alternatives,random)[0],base=normalize(word);
      if(seen.has(base))continue;
      const synonyms=alternatives.filter(w=>normalize(w)!==base);
      if(!synonyms.length)continue;
      const answer=shuffle(synonyms,random)[0];
      // Prevent a directly documented relation from being used as a distractor.
      const blocked=new Set(alternatives.map(normalize));
      for(const other of groups)if(other.words.some(w=>normalize(w)===base||normalize(w)===normalize(answer))){
        other.words.forEach(w=>blocked.add(normalize(w)));
      }
      const distractors=[];
      const others=shuffle(groups.filter(row=>row!==g),random);
      for(const other of others){
        const options=shuffle(other.words,random);
        for(const option of options){
          if(blocked.has(normalize(option))||distractors.some(w=>normalize(w)===normalize(option)))continue;
          distractors.push(option.trim());blocked.add(normalize(option));break;
        }
        if(distractors.length>=3)break;
      }
      if(distractors.length!==3)continue;
      const options=shuffle([answer,...distractors],random);
      result.push({id:g.uid||level+':'+g.sourceId,sourceId:g.sourceId,level,
        word,correctAnswer:answer,knownAlternatives:synonyms,
        options,correctIndex:options.findIndex(x=>x===answer)});
      seen.add(base);
      if(result.length>=count)break;
    }
    return result;
  }
  function search(data,query,limit=30){
    const key=normalize(query);
    if(key.length<2)return[];
    return data.filter(isGroup).filter(g=>g.words.some(w=>normalize(w).includes(key)))
      .slice(0,Math.max(0,limit)).map(g=>({id:g.uid||String(g.sourceId),
        level:g.level,words:[...g.words]}));
  }
  function score(results){
    return {correct:results.filter(r=>r.correct===true).length,total:results.length,
      wrong:results.filter(r=>r.correct!==true).length};
  }
  return Object.freeze({LEVELS,normalize,shuffle,isGroup,quiz,search,score});
});
