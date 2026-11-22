/* HitzBira daily crossword regression suite
 * Run: node jokoak/gurutzegramak/test-core.cjs
 * No network access or credentials. Tests deterministic synthetic, non-future fixtures.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'crossword.js'),'utf8');
const authoring=require('./authoring-generator.cjs');
new vm.Script(source,{filename:'crossword.js'});
const GROUPS=[
 ['EKOGRAFIA','HITZORDU','INFEKZIO','SENDAGAI','ONGIZATE','ARTERIA','ORBAIN','TXERTO','SUKAR','ZAURI','EZTUL','NEKE'],
 ['GLUKOSA','DIABETES','TRIAJE','BARAURIK','HEMATOMA','ZORABIO','FERRITINA','KONORTE','HEMORRAGIA','LARRIALDI','POTASIO','ZAINKETA']
];
function fixture(date,mode,index) {
  const entries=GROUPS[index].map((word,i)=>({
    id:'OS-TEST-'+index+'-'+i,word,source:'OS-TEST-'+index+'-'+i,
    clue:'Froga sintetikoko pista '+i,explanation:'Froga sintetikoko azalpena '+i
  }));
  const puzzle=authoring.generate(entries,121231+index*2021,10);
  const quality=authoring.validate(puzzle);
  assert.equal(puzzle.entries.length,10);
  assert.ok(quality.crossings>=9);
  return {id:date+'-C1-'+mode,play_date:date,mode,level:'C1',status:'pilot',
    title_eu:'Eguneko gurutzegrama',theme_eu:'Osasun-hiztegia',...puzzle};
}
const firstDay=[fixture('2026-11-22','ikasi',0),fixture('2026-11-22','erronka',1)];
const nextDay=[fixture('2026-11-23','ikasi',1),fixture('2026-11-23','erronka',0)];
assert.equal(firstDay.length,2);
assert.ok(!firstDay[1].entries.some(w=>firstDay[0].entries.some(x=>x.word===w.word)));

const db=[...firstDay,...nextDay];
const data=new Map();
const SAVE=id=>'sustrai-crossword-daily-'+id+'-progress-v1';
const BEST=id=>'sustrai-crossword-daily-'+id+'-best-v1';
let now=Date.parse('2026-11-22T12:00:00Z');
class FakeDate extends Date{
  constructor(...args){super(...(args.length?args:[now]));}
  static now(){return now;}
}
function client(){
  return {from(table){
    assert.equal(table,'smx_crossword_daily');
    const filters=[];
    return {select(){return this;},eq(key,v){filters.push([key,'eq',v]);return this;},
      in(key,v){filters.push([key,'in',v]);return this;},
      then(resolve){
        const rows=db.filter(row=>filters.every(([key,op,value])=>
          op==='eq'?row[key]===value:value.includes(row[key])));
        return Promise.resolve({data:rows,error:null}).then(resolve);
      }};
  }};
}
function spawn(){
  const events={};
  const root={innerHTML:'',addEventListener:(n,f)=>{events[n]=f;},
    querySelector:()=>null,querySelectorAll:()=>[],contains:()=>true};
  let pulse=()=>{};
  const browser={SustraiCloud:{ready:Promise.resolve(),client,
    storage:{getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)}},
    localStorage:{getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)},
    confirm:()=>true};
  vm.runInNewContext(source,{
    window:browser,document:{getElementById:()=>root},Date:FakeDate,
    setInterval:fn=>{pulse=fn;return 1;},console
  },{filename:'crossword.js'});
  return {root,pulse:()=>pulse(),
    click:dataset=>events.click({target:{closest:()=>({dataset})}}),
    write:value=>events.input({target:{id:'cxWordInput',value}})};
}
const read=id=>JSON.parse(data.get(SAVE(id))||'null');
const flush=async()=>{for(let i=0;i<12;i++)await Promise.resolve();};
(async()=>{
  let app=spawn();await flush();
  assert.match(app.root.innerHTML,/Gaurko hitzak, bi erronka/);
  assert.match(app.root.innerHTML,/Ikasteko modua/);
  assert.match(app.root.innerHTML,/Erronka modua/);
  const study=firstDay[0],challenge=firstDay[1];
  app.click({action:'start',mode:'ikasi'});
  assert.match(app.root.innerHTML,new RegExp('--cx-rows:'+study.grid_rows+';--cx-cols:'+study.grid_cols));
  assert.equal(read(study.id).mode,'ikasi');
  for(const w of study.entries){
    app.click({word:w.id});app.write(w.word);app.click({action:'check'});
    assert.equal(read(study.id).checked[w.id],'correct');
  }
  assert.equal(read(study.id).phase,'finished');
  app.click({action:'reset'});
  assert.match(app.root.innerHTML,/Gaurko hitzak, bi erronka/);
  app.click({action:'start',mode:'erronka'});
  assert.equal(read(challenge.id).mode,'erronka');
  app.click({word:challenge.entries[0].id});
  app.write('X'.repeat(challenge.entries[0].word.length));app.click({action:'check'});
  assert.match(app.root.innerHTML,/Ez da letraz letrako zuzenketarik ematen/);
  assert.doesNotMatch(app.root.innerHTML,/class="cx-cell[^"]*is-right/);
  assert.equal(read(challenge.id).stats.wrong,1);
  app.click({action:'check'});
  assert.equal(read(challenge.id).stats.wrong,1,'Repeating a mistake cannot charge twice');
  app.click({action:'hint'});
  assert.equal(read(challenge.id).stats.hints,1);
  const savedAt=read(challenge.id).startedAt;
  now+=123000;
  app=spawn();await flush();
  assert.equal(read(challenge.id).startedAt,savedAt);
  app.click({action:'start',mode:'erronka'});
  assert.match(app.root.innerHTML,/02:03/);
  for(const w of challenge.entries){
    app.click({word:w.id});app.write(w.word);app.click({action:'check'});
    assert.equal(read(challenge.id).checked[w.id],'correct');
  }
  assert.equal(read(challenge.id).phase,'finished');
  assert.match(app.root.innerHTML,/ERRONKA AMAITUTA/);
  const record=JSON.parse(data.get(BEST(challenge.id)));
  assert.equal(record.mode,'erronka');
  assert.equal(record.seconds,123);
  assert.equal(record.score,1000+Math.round(300-123/2)-40-15);
  app.click({action:'reset'});
  assert.equal(read(challenge.id).phase,'finished','Completed challenge is retained in history');
  assert.match(app.root.innerHTML,/Gaurko marka pertsonala/);
  now=Date.parse('2026-11-23T00:20:00Z');
  app.pulse();await flush();
  assert.match(app.root.innerHTML,/Gaurko hitzak, bi erronka/);
  assert.equal(JSON.parse(data.get('sustrai-crossword-daily-cache-2026-11-23-v1')).length,2);
  app.click({action:'start',mode:'ikasi'});
  assert.equal(read(nextDay[0].id).mode,'ikasi');
  assert.equal(read(study.id).phase,'finished','Yesterday remains intact');
  now=Date.parse('2026-12-06T12:00:00Z');
  app.click({action:'reset'});await flush();
  assert.match(app.root.innerHTML,/Ezin izan dugu jokoa ireki/,'Unavailable days show a truthful error');
  console.log('OK: two distinct daily modes, 10-word generated boards, timed penalties, resume, best, midnight roll-over and unavailable-day handling.');
})().catch(err=>{console.error(err);process.exitCode=1;});