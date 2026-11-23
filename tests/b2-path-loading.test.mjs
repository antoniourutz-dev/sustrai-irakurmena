import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Script} from 'node:vm';

const app=readFileSync(new URL('../gramatika/ibilbidea/app.js',import.meta.url),'utf8');
const begin=app.indexOf('async function start()');
const end=app.indexOf("window.addEventListener('popstate'",begin);
const constants=(app.match(/  const (?:MAX_PATH_UNITS|ITEMS_PER_LESSON) = [^\n]+/g)||[]).join('\n');
const startup=new Script(constants+'\n'+app.slice(begin,end)+'\nstart();');

async function run(designCount,missingItem=false){
  const codes=Array.from({length:37},(_,i)=>'topic-'+String(i).padStart(2,'0'));
  const designs=codes.slice(0,designCount).map(entry_code=>({entry_code,transfer_task_eu:'Sortu adibide bat.'}));
  const items=designs.flatMap(d=>[1,2,3,4].map(item_order=>({entry_code:d.entry_code,item_order,question_eu:'Galdera',options_eu:['A','B'],correct_index:0,explanation_eu:'Azalpena'})));
  if(missingItem)items.pop();
  const tables={smx_grammar_b2_modules:Array.from({length:7},(_,i)=>({module_no:i+1})),smx_grammar_b2_path_units:codes.map((entry_code,global_order)=>({entry_code,global_order})),public_editorial_grammar_entries:codes.map(code=>({id:code,code})),smx_grammar_b2_lesson_designs:designs,smx_grammar_b2_practice_items:items};
  const client={from(name){
    let cap=Infinity;const sort=[];
    const query={select(){return query},eq(){return query},order(key){sort.push(key);return query},limit(n){cap=n;return query},then(resolve,reject){
      const data=[...(tables[name]||[])].sort((a,b)=>{for(const key of sort){if(a[key]<b[key])return -1;if(a[key]>b[key])return 1}return 0}).slice(0,cap);
      return Promise.resolve({data,error:null}).then(resolve,reject);
    }};return query;
  }};
  const state={progress:new Map()},QUESTIONS=Object.create(null),LESSONS=new Map(),messages=[],warnings=[],ui=new Map();let rendered=0;
  const $=id=>{if(!ui.has(id))ui.set(id,{textContent:'',hidden:false});return ui.get(id)};
  const context={state,QUESTIONS,LESSONS,$,cloud:{ready:Promise.resolve(),client:()=>client},check:r=>{if(r.error)throw r.error;return r.data||[]},hasAccount:()=>false,renderPath:()=>{rendered++},loadStudent:async()=>{},loadTeacher:async()=>{},openUnit:()=>{},guidedCount:()=>state.units.filter(u=>u.pilot_active).length,say:(text,error)=>messages.push({text,error}),URLSearchParams,location:{search:''},console:{warn:(...args)=>warnings.push(args)}};
  await startup.runInNewContext(context);
  return {state,QUESTIONS,LESSONS,messages,warnings,rendered,ui};
}

test('Expanded curriculum loads all 29 lessons and 116 questions, without truncation',async()=>{
  const result=await run(29);
  assert.equal(result.rendered,1,JSON.stringify(result.warnings));
  assert.equal(result.LESSONS.size,29);
  assert.equal(Object.keys(result.QUESTIONS).length,29);
  assert.ok(Object.values(result.QUESTIONS).every(q=>q.prompts.length===4));
  assert.equal(result.state.units.length,37);
  assert.equal(result.ui.get('pathGuidedCount').textContent,'29 ikasgai gidatu');
  assert.equal(result.messages.at(-1).text,'');
});

test('Original 17-lesson curriculum also loads',async()=>{
  assert.equal((await run(17)).LESSONS.size,17);
});

test('Genuinely incomplete practice is still rejected instead of presented as complete',async()=>{
  const result=await run(29,true);
  assert.equal(result.rendered,0);
  assert.equal(result.messages.at(-1).error,true);
  assert.equal(result.ui.get('pathContinueButton').textContent,'Berriro saiatu');
  assert.equal(result.ui.get('pathContinueButton').disabled,false);
  assert.equal(typeof result.ui.get('pathContinueButton').onclick,'function');
});
