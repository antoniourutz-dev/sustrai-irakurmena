/* Run: node jokoak/gurutzegramak/test-core.cjs
 * Zero-dependency smoke tests for grid integrity, answer handling and progress.
 * These are not a substitute for browser/mobile accessibility and academic review.
 */
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname,'crossword.js'),'utf8');
new vm.Script(source,{filename:'crossword.js'});
const rx = /\{\s*id:'([^']+)',word:'([^']+)',r:(\d+),c:(\d+),dir:'([HV])',source:'([^']+)'/g;
const words = Array.from(source.matchAll(rx),m=>({id:m[1],word:m[2],r:+m[3],c:+m[4],dir:m[5],source:m[6]}));
assert.equal(words.length,12);
assert.equal(new Set(words.map(w=>w.id)).size,12);
assert.equal(new Set(words.map(w=>w.source)).size,12);

const cells = new Map(),adjacent = new Map(words.map(w=>[w.id,new Set()]));
let crossings=0;
for (const w of words) {
  assert.match(w.word,/^[A-Z]+$/);
  assert.ok(w.word.length>=4);
  for (let i=0;i<w.word.length;i++) {
    const r=w.r+(w.dir==='V'?i:0),c=w.c+(w.dir==='H'?i:0),k=r+','+c;
    assert.ok(r>=0&&r<12&&c>=0&&c<13,'Word outside board: '+w.id);
    if (cells.has(k)) {
      const prev=cells.get(k);
      assert.equal(prev.letter,w.word[i],'Conflicting cross: '+k);
      assert.notEqual(prev.dir,w.dir,'Parallel overlap: '+k);
      adjacent.get(w.id).add(prev.id);adjacent.get(prev.id).add(w.id);crossings++;
    } else cells.set(k,{letter:w.word[i],id:w.id,dir:w.dir});
  }
}
assert.ok(crossings>=10);
const visited = new Set(),queue=[words[0].id];
while (queue.length) {
  const id=queue.shift();
  if(visited.has(id)) continue;
  visited.add(id);queue.push(...adjacent.get(id));
}
assert.equal(visited.size,words.length,'Every word must connect to the crossword');

const events={};
let stored=null;
const root={innerHTML:'',addEventListener:(name,fn)=>events[name]=fn,
  contains:()=>true,querySelector:()=>null,querySelectorAll:()=>[]};
const browser={localStorage:{getItem:()=>stored,setItem:(_key,v)=>{stored=v;}},confirm:()=>true};
vm.runInNewContext(source,{document:{getElementById:()=>root},window:browser,console},{filename:'crossword.js'});
const click=(dataset)=>events.click({target:{closest:()=>({dataset})}});
const write=(value)=>events.input({target:{id:'cxWordInput',value}});
(async()=>{
  await Promise.resolve();await Promise.resolve();
  assert.match(root.innerHTML,/cx-grid/);
  assert.match(root.innerHTML,/Pistak/);
  click({word:'ekografia'});write('EKOGRAFIG');click({action:'check'});
  assert.match(root.innerHTML,/Berrikusi erantzuna/);
  click({action:'hint'});
  assert.equal(JSON.parse(stored).drafts.ekografia,'EKOGRAFIA');
  click({action:'check'});
  assert.match(root.innerHTML,/Ondo! EKOGRAFIA/);
  for (const w of words.filter(w=>w.id!=='ekografia')) {
    click({word:w.id});write(w.word);click({action:'check'});
    assert.ok(root.innerHTML.includes('Ondo! '+w.word),'Grading failed for '+w.id);
  }
  assert.match(root.innerHTML,/Zorionak! Kasua osatu duzu/);
  click({action:'reset'});
  assert.equal(JSON.parse(stored).drafts.ekografia,undefined);
  console.log('OK: 12 linked words, '+crossings+' crossings, correct/wrong feedback, hint, completion and reset.');
})().catch(error=>{console.error(error);process.exitCode=1;});
