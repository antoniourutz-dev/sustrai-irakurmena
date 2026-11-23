/* Gurutzegramak: deterministic, self-contained grid builder. No network or auth. */
(function (scope, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (scope) scope.CrosswordStudioEngine = api;
})(typeof window !== 'undefined' ? window : undefined, function () {
  'use strict';
  function normalize(value) {
    return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toUpperCase().replace(/[^A-Z]/g, '');
  }
  function candidate(item, opts = {}) {
    const original = String(item.lemma_eu || '').trim();
    const answer = normalize(original);
    const clue = String(item.definition_eu || '').trim();
    if (!item.code || !clue || !/^[A-Z]{4,14}$/.test(answer)) return null;
    if (!opts.phrases && /[\s\-\/]/.test(original)) return null;
    if (normalize(clue).includes(answer)) return null;
    return {id: String(item.code), word: answer, original, clue,
      explanation: clue, source: 'Oposik · osasun_entries · ' + item.code,
      editorial_state: String(item.editorial_state || ''),
      category_general: String(item.category_general || '')};
  }
  function seeded(seed) {
    let s = 2166136261;
    for (const ch of String(seed)) {s ^= ch.charCodeAt(0); s = Math.imul(s, 16777619);}
    return () => {s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296;};
  }
  function mix(items, rng) {
    const out = items.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }
  function construct(items, target, size, random) {
    const cells = new Map(), placed = [], used = new Set();
    const key = (r, c) => r + ',' + c;
    const inside = (r,c) => r >= 0 && c >= 0 && r < size && c < size;
    const get = (r,c) => cells.get(key(r,c));
    const pos = (r,c,dir,i) => [r + (dir === 'V' ? i : 0), c + (dir === 'H' ? i : 0)];
    function check(word, row, col, dir, connected) {
      const length = word.length;
      const [fr,fc] = pos(row,col,dir,-1), [ar,ac] = pos(row,col,dir,length);
      if (inside(fr,fc) && get(fr,fc)) return -1;
      if (inside(ar,ac) && get(ar,ac)) return -1;
      let crossings = 0;
      for (let i = 0; i < length; i++) {
        const [r,c] = pos(row,col,dir,i);
        if (!inside(r,c)) return -1;
        const cell = get(r,c);
        if (cell) {
          if (cell.letter !== word[i] || cell.dirs.has(dir)) return -1;
          crossings++;
        } else if ((dir === 'H' && (get(r-1,c) || get(r+1,c)))
          || (dir === 'V' && (get(r,c-1) || get(r,c+1)))) return -1;
      }
      return connected && !crossings ? -1 : crossings;
    }
    function put(w, row, col, dir) {
      for (let i = 0; i < w.word.length; i++) {
        const [r,c] = pos(row,col,dir,i), k = key(r,c);
        if (cells.has(k)) cells.get(k).dirs.add(dir);
        else cells.set(k, {letter:w.word[i], dirs:new Set([dir])});
      }
      placed.push({...w,r:row,c:col,dir});
      used.add(w.word);
    }
    const first = items.find(w => w.word.length <= size);
    if (!first) return {placed,cells};
    put(first, Math.floor(size / 2), Math.floor((size - first.word.length) / 2), 'H');
    while (placed.length < target) {
      let best = null;
      for (const w of items) {
        if (used.has(w.word)) continue;
        let picked = null;
        for (const [coordinate,cell] of cells) {
          const [r,c] = coordinate.split(',').map(Number);
          for (const dir of (cell.dirs.has('H') && !cell.dirs.has('V') ? ['V']
            : cell.dirs.has('V') && !cell.dirs.has('H') ? ['H'] : [])) {
            for (let i = 0; i < w.word.length; i++) {
              if (w.word[i] !== cell.letter) continue;
              const row = r - (dir === 'V' ? i : 0);
              const col = c - (dir === 'H' ? i : 0);
              const overlaps = check(w.word,row,col,dir,true);
              if (overlaps < 1) continue;
              const proximity = Math.abs(row-size/2) + Math.abs(col-size/2);
              const score = overlaps * 90 - proximity * 0.8 + random() * 12;
              if (!picked || score > picked.score) picked = {w,row,col,dir,score};
            }
          }
        }
        if (picked && (!best || picked.score > best.score)) best = picked;
      }
      if (!best) break;
      put(best.w,best.row,best.col,best.dir);
    }
    return {placed,cells};
  }
  function validate(p) {
    if (!p || !Array.isArray(p.entries) || !p.entries.length) throw Error('Taula hutsik dago.');
    const matrix = new Map(), seen = new Set();
    const rows = p.grid_rows, cols = p.grid_cols;
    const adjacency = new Map();
    for (const w of p.entries) {
      if (!w.clue || !w.source || seen.has(w.word) || !['H','V'].includes(w.dir)) throw Error('Erantzun errepikatua edo pista okerra.');
      seen.add(w.word); adjacency.set(w.id,new Set());
      for (let i = 0; i < w.word.length; i++) {
        const r=w.r+(w.dir==='V'?i:0), c=w.c+(w.dir==='H'?i:0);
        if (r<0 || c<0 || r>=rows || c>=cols) throw Error('Hitz bat taulatik kanpo dago.');
        const key=r+','+c, prev=matrix.get(key);
        if (prev && (prev.letter!==w.word[i] || prev.dirs.has(w.dir))) throw Error('Gurutzaketa okerra.');
        if (prev) {for (const id of prev.ids) {adjacency.get(id).add(w.id); adjacency.get(w.id).add(id);}
          prev.dirs.add(w.dir);prev.ids.push(w.id);}
        else matrix.set(key,{letter:w.word[i],dirs:new Set([w.dir]),ids:[w.id]});
      }
    }
    const reached=new Set(),stack=[p.entries[0].id];
    while (stack.length) {const id=stack.pop();if (reached.has(id)) continue; reached.add(id);for(const next of adjacency.get(id))stack.push(next);}
    if(reached.size!==p.entries.length)throw Error('Gurutzegrama ez dago konektatuta.');
    return matrix;
  }
  function generate(rows, requested=10, options={}) {
    const target = Math.max(4,Math.min(18,Math.floor(Number(requested)||10)));
    const size = Math.max(15,Math.min(25,Math.floor(Number(options.size)||21)));
    const seen = new Set();
    const items = (rows||[]).map(x=>candidate(x,options)).filter(x=>{
      if(!x || seen.has(x.word))return false;seen.add(x.word);return true;
    });
    if(items.length < target) throw Error('Ez dago nahikoa hitz egoki: '+items.length+' erabilgarri, '+target+' behar dira.');
    const rng=seeded(options.seed || (Date.now()+'-'+Math.random()));
    let best = null;
    for(let attempt=0;attempt<20;attempt++){
      const ordered=mix(items,rng).sort((a,b)=>Math.abs(a.word.length-8)-Math.abs(b.word.length-8));
      const trial=construct(ordered.slice(0,Math.min(100,ordered.length)),target,size,rng);
      if(!best||trial.placed.length>best.placed.length)best=trial;
      if(best.placed.length===target)break;
    }
    if(!best || best.placed.length!==target)
      throw Error('Ezin izan da '+target+' hitzeko taula osatu (gehienez '+(best?.placed.length||0)+'). Aukeratu gai zabalagoa edo hitz gutxiago.');
    const coordinates=[...best.cells.keys()].map(x=>x.split(',').map(Number));
    const minRow=Math.min(...coordinates.map(x=>x[0])),minCol=Math.min(...coordinates.map(x=>x[1]));
    const maxRow=Math.max(...coordinates.map(x=>x[0])),maxCol=Math.max(...coordinates.map(x=>x[1]));
    const entries=best.placed.map(w=>({...w,r:w.r-minRow,c:w.c-minCol}));
    const starts=[...new Set(entries.map(w=>w.r+','+w.c))].sort((a,b)=>{
      const [ar,ac]=a.split(',').map(Number),[br,bc]=b.split(',').map(Number);
      return ar-br||ac-bc;
    });
    const numbers=new Map(starts.map((x,i)=>[x,i+1]));
    entries.forEach(w=>w.number=numbers.get(w.r+','+w.c));
    const puzzle={id:options.id||('draft-'+Date.now()),grid_rows:maxRow-minRow+1,
      grid_cols:maxCol-minCol+1,entries,theme_eu:options.title||'Osasun-hiztegia',
      mode:'ikasi',play_date:new Date().toISOString().slice(0,10)};
    validate(puzzle);
    return puzzle;
  }
  return Object.freeze({normalize,candidate,generate,validate});
});
