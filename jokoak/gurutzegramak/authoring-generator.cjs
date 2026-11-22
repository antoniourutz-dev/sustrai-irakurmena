/* SUSTRAI · Gurutzegramak · editorial layout builder
 * This script contains NO source terms or unpublished solutions.
 * Intended for controlled authoring. Generated boards must pass academic review.
 */
'use strict';
function rng(seed) {
  let x=(seed>>>0)||1;
  return ()=>{x^=x<<13;x^=x>>>17;x^=x<<5;return (x>>>0)/4294967296;};
}
function shuffle(items,rand) {
  const a=[...items];
  for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
const xy=(r,c)=>r+','+c;
function boardOf(placed){
  const board=new Map();
  for(const w of placed){
    for(let i=0;i<w.word.length;i++){
      const r=w.r+(w.dir==='V'?i:0),c=w.c+(w.dir==='H'?i:0),k=xy(r,c);
      if(!board.has(k))board.set(k,{letter:w.word[i],dirs:new Set(),owners:[]});
      const p=board.get(k);
      if(p.letter!==w.word[i]||p.dirs.has(w.dir))return null;
      p.dirs.add(w.dir);p.owners.push(w.id);
    }
  }
  return board;
}
function boundaries(placed){
  let r0=99,c0=99,r1=-1,c1=-1;
  for(const w of placed){r0=Math.min(r0,w.r);c0=Math.min(c0,w.c);
    r1=Math.max(r1,w.r+(w.dir==='V'?w.word.length-1:0));
    c1=Math.max(c1,w.c+(w.dir==='H'?w.word.length-1:0));}
  return {r0,c0,r1,c1,rows:r1-r0+1,cols:c1-c0+1};
}
function examine(word,r,c,dir,board,placed,size){
  const len=word.word.length,endr=r+(dir==='V'?len-1:0),endc=c+(dir==='H'?len-1:0);
  if(r<0||c<0||endr>=size||endc>=size)return null;
  const before=xy(r-(dir==='V'?1:0),c-(dir==='H'?1:0));
  const after=xy(endr+(dir==='V'?1:0),endc+(dir==='H'?1:0));
  if(board.has(before)||board.has(after))return null;
  let crosses=0;
  for(let i=0;i<len;i++){
    const rr=r+(dir==='V'?i:0),cc=c+(dir==='H'?i:0),k=xy(rr,cc);
    const existing=board.get(k);
    if(existing){
      if(existing.letter!==word.word[i]||existing.dirs.has(dir)||existing.dirs.size!==1)return null;
      crosses++;
    }else{
      if(dir==='H'&&(board.has(xy(rr-1,cc))||board.has(xy(rr+1,cc))))return null;
      if(dir==='V'&&(board.has(xy(rr,cc-1))||board.has(xy(rr,cc+1))))return null;
    }
  }
  if(!crosses)return null;
  const bounds=boundaries([...placed,{...word,r,c,dir}]);
  if(bounds.rows>19||bounds.cols>19)return null;
  return {crosses,bounds,score:crosses*150-(bounds.rows*bounds.cols)*.18-(bounds.rows+bounds.cols)*2};
}
function generate(candidates,seed,target=10){
  const filtered=[];
  const seen=new Set();
  for(const x of candidates){
    const word=String(x.word||'').toLocaleUpperCase('eu');
    if(!/^[A-Z]{4,12}$/.test(word)||seen.has(word)||!x.clue||!x.source)continue;
    seen.add(word);filtered.push({...x,word});
  }
  if(filtered.length<target)throw Error('Not enough distinct sourced words');
  const size=23,random=rng(seed);
  let best=null;
  for(let attempt=0;attempt<46;attempt++){
    const sh=shuffle(filtered,random);
    const first=sh.slice(0,Math.min(7,sh.length)).sort((a,b)=>b.word.length-a.word.length)[Math.floor(random()*Math.min(3,sh.length))]||sh[0];
    let placed=[{...first,r:11,c:Math.floor((size-first.word.length)/2),dir:'H'}];
    let board=boardOf(placed);
    while(placed.length<target){
      let winner=null;
      const used=new Set(placed.map(w=>w.id));
      for(const x of sh){
        if(used.has(x.id))continue;
        let localBest=null;
        for(const [k,p] of board){
          if(p.dirs.size!==1)continue;
          const [cr,cc]=k.split(',').map(Number);
          const dir=p.dirs.has('H')?'V':'H';
          for(let i=0;i<x.word.length;i++){
            if(x.word[i]!==p.letter)continue;
            const r=cr-(dir==='V'?i:0),c=cc-(dir==='H'?i:0);
            const fit=examine(x,r,c,dir,board,placed,size);
            if(!fit)continue;
            const candidate={entry:{...x,r,c,dir},fitness:fit.score+random()*3};
            if(!localBest||candidate.fitness>localBest.fitness)localBest=candidate;
          }
        }
        if(localBest&&(!winner||localBest.fitness>winner.fitness))winner=localBest;
      }
      if(!winner)break;
      placed.push(winner.entry);board=boardOf(placed);
      if(!board)throw Error('Internal overlap failure');
    }
    const box=boundaries(placed);
    const crossings=[...board.values()].filter(x=>x.owners.length===2).length;
    const quality=placed.length*10000+crossings*60-box.rows*box.cols;
    if(!best||quality>best.quality)best={placed,box,crossings,quality};
    if(best.placed.length===target&&best.box.rows<=15&&best.box.cols<=15&&best.crossings>=target)break;
  }
  if(!best||best.placed.length<Math.min(8,target))throw Error('Unable to build sufficiently connected crossword: '+seed);
  const compact=best.placed.map(w=>({
    id:String(w.id),word:w.word,r:w.r-best.box.r0,c:w.c-best.box.c0,dir:w.dir,
    source:String(w.source),clue:String(w.clue),explanation:String(w.explanation||'')
  }));
  const puzzle={grid_rows:best.box.rows,grid_cols:best.box.cols,entries:compact};
  validate(puzzle);
  return puzzle;
}
function validate(p){
  const b=new Map();
  if(!Number.isInteger(p.grid_rows)||!Number.isInteger(p.grid_cols)||p.grid_rows>19||p.grid_cols>19)throw Error('Bad dimensions');
  const ids=new Set(),words=new Set();
  for(const w of p.entries){
    if(ids.has(w.id)||words.has(w.word))throw Error('Duplicates');
    ids.add(w.id);words.add(w.word);
    if(!w.clue||!w.explanation||!w.source||!['H','V'].includes(w.dir))throw Error('Incomplete entry');
    for(let i=0;i<w.word.length;i++){
      const r=w.r+(w.dir==='V'?i:0),c=w.c+(w.dir==='H'?i:0),k=xy(r,c);
      if(r<0||c<0||r>=p.grid_rows||c>=p.grid_cols)throw Error('Overflow '+w.id);
      if(!b.has(k))b.set(k,{letter:w.word[i],owners:[]});
      const x=b.get(k);
      if(x.letter!==w.word[i]||x.owners.includes(w.id)||x.owners.length>1)throw Error('Conflict '+k);
      x.owners.push(w.id);
    }
  }
  const crossings=[...b.values()].filter(v=>v.owners.length>1).length;
  if(crossings<p.entries.length-1)throw Error('Insufficient connectivity');
  const visited=new Set(),queue=[p.entries[0].id];
  while(queue.length){const id=queue.shift();if(visited.has(id))continue;visited.add(id);
    for(const v of b.values())if(v.owners.includes(id))for(const other of v.owners)if(!visited.has(other))queue.push(other);}
  if(visited.size!==p.entries.length)throw Error('Disconnected crossword');
  return {crossings,cells:b.size};
}
module.exports={generate,validate};