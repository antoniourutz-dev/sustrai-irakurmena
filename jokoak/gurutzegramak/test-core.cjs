/* Run: node jokoak/gurutzegramak/test-core.cjs
 * Dependency-free regression suite: topology, two modes, penalties, hints, clock,
 * re-entry, result, personal best, legacy isolation and reset.
 * Browser visual/accessibility checks are separate, and still required.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'crossword.js'),'utf8');
new vm.Script(source,{filename:'crossword.js'});
const rx=/\{\s*id:'([^']+)',word:'([^']+)',r:(\d+),c:(\d+),dir:'([HV])',source:'([^']+)'/g;
const words=Array.from(source.matchAll(rx),m=>({id:m[1],word:m[2],r:+m[3],c:+m[4],dir:m[5],source:m[6]}));
assert.equal(words.length,12);
assert.equal(new Set(words.map(w=>w.id)).size,12);
assert.equal(new Set(words.map(w=>w.source)).size,12);
const cells=new Map(),adjacent=new Map(words.map(w=>[w.id,new Set()]));
let crossings=0;
for(const w of words){
  assert.match(w.word,/^[A-Z]+$/);
  for(let i=0;i<w.word.length;i++){
    const r=w.r+(w.dir==='V'?i:0),c=w.c+(w.dir==='H'?i:0),k=r+','+c;
    assert.ok(r>=0&&r<12&&c>=0&&c<13,'Out of bounds: '+w.id);
    if(cells.has(k)){
      const prev=cells.get(k);
      assert.equal(prev.letter,w.word[i],'Conflicting cross: '+k);
      assert.notEqual(prev.dir,w.dir,'Parallel overlap: '+k);
      adjacent.get(w.id).add(prev.id);adjacent.get(prev.id).add(w.id);crossings++;
    }else cells.set(k,{letter:w.word[i],id:w.id,dir:w.dir});
  }
}
assert.equal(crossings,13);
const queue=[words[0].id],visited=new Set();
while(queue.length){
  const id=queue.shift();if(visited.has(id))continue;
  visited.add(id);queue.push(...adjacent.get(id));
}
assert.equal(visited.size,words.length,'All entries must connect');
const SAVE='sustrai-crossword-osasuna-001-v2';
const BEST='sustrai-crossword-osasuna-001-best-v2';
const LEGACY='sustrai-crossword-osasuna-001-v1';
let now=1000000;
class Clock extends Date{
  constructor(value){super(value===undefined?now:value);}
  static now(){return now;}
}
const data=new Map();
function spawn(storage=data){
  const events={};
  const root={innerHTML:'',addEventListener:(name,fn)=>events[name]=fn,
    contains:()=>true,querySelector:()=>null,querySelectorAll:()=>[]};
  const browser={localStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)},confirm:()=>true};
  vm.runInNewContext(source,{document:{getElementById:()=>root},window:browser,Date:Clock,console},{filename:'crossword.js'});
  return {root,events,storage,
    click:(dataset)=>events.click({target:{closest:()=>({dataset})}}),
    write:(value)=>events.input({target:{id:'cxWordInput',value}}),
    saved:()=>JSON.parse(storage.get(SAVE)||'null')};
}
const flush=async()=>{await Promise.resolve();await Promise.resolve();};
(async()=>{
  let app=spawn();await flush();
  assert.match(app.root.innerHTML,/Nola jokatu nahi duzu/);
  app.click({action:'start',mode:'erronka'});
  assert.equal(app.saved().phase,'playing');
  assert.equal(app.saved().mode,'erronka');
  app.click({word:'ekografia'});app.write('EKOGRAFIG');app.click({action:'check'});
  assert.match(app.root.innerHTML,/Ez da letraz letrako zuzenketarik ematen/);
  assert.doesNotMatch(app.root.innerHTML,/class="cx-cell[^"]*is-right/);
  assert.equal(app.saved().stats.wrong,1);
  app.click({action:'check'});
  assert.equal(app.saved().stats.wrong,1,'Same answer is not charged twice');
  app.click({action:'hint'});
  assert.equal(app.saved().stats.hints,1);
  assert.equal(app.saved().drafts.ekografia,'EKOGRAFIA');
  assert.deepEqual(Array.from(app.saved().revealed.ekografia),[8]);
  app.click({action:'check'});
  assert.equal(app.saved().checked.ekografia,'correct');
  now+=125000; // Time runs while the user is away; it is anchored to the start.
  app=spawn();await flush();
  assert.equal(app.saved().startedAt,1000000);
  assert.match(app.root.innerHTML,/02:05/);
  for(const w of words.filter(w=>w.id!=='ekografia')){
    app.click({word:w.id});app.write(w.word);app.click({action:'check'});
    assert.equal(app.saved().checked[w.id],'correct','Cannot grade '+w.id);
  }
  assert.equal(app.saved().phase,'finished');
  const record=JSON.parse(data.get(BEST));
  assert.equal(record.mode,'erronka');
  assert.equal(record.seconds,125);
  assert.equal(record.hints,1);
  assert.equal(record.wrong,1);
  assert.equal(record.score,1200+Math.round(300-125/2)-40-15);
  assert.match(app.root.innerHTML,/ERRONKA AMAITUTA/);
  app.click({action:'reset'});
  assert.equal(app.saved().phase,'setup');
  assert.equal(app.saved().drafts.ekografia,undefined);
  assert.equal(JSON.parse(data.get(BEST)).score,record.score,'Best survives restart');
  app.click({action:'start',mode:'ikasi'});
  app.click({word:'ekografia'});app.write('EKOGRAFIG');app.click({action:'check'});
  assert.match(app.root.innerHTML,/class="cx-cell[^"]*is-right/);
  assert.equal(app.saved().stats.wrong,0,'Study mode never charges errors');
  app.click({action:'hint'});
  assert.equal(app.saved().stats.hints,0,'Study mode never charges hints');
  app.click({action:'check'}); // EKOGRAFIA is now solved; it crosses HITZORDU at its second letter.
  app.click({word:'hitzordu'});app.write('H');app.click({action:'hint'});
  assert.equal(app.saved().drafts.hitzordu,'HIT','Earned crossing must fill skipped input position');
  assert.deepEqual(Array.from(app.saved().revealed.hitzordu),[2],
    'A paid hint must reveal one genuinely new letter, not the existing crossing');

  const old=new Map([[LEGACY,JSON.stringify({schema:1,active:'sukar',drafts:{sukar:'SUKAR'},checked:{sukar:'correct'}})]]);
  const migrated=spawn(old);await flush();
  assert.equal(migrated.saved().mode,'ikasi','Legacy must never score as competition');
  assert.equal(migrated.saved().checked.sukar,'correct');
  console.log('OK: '+words.length+' words, '+crossings+' intersections, competition timer, penalties, restore, final score, personal record, practice and migration.');
})().catch(err=>{console.error(err);process.exitCode=1;});
