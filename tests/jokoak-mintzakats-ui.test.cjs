/* node --test tests/jokoak-mintzakats-ui.test.cjs */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const core=require('../jokoak/mintzakats/core.js');
const script=fs.readFileSync(path.join(__dirname,'../jokoak/mintzakats/app.js'),'utf8');
const bank=Array.from({length:141},(_,i)=>({
 id:i,question:'Galdera '+i,candidates:['A'+i,'B'+i,'C'+i,'D'+i],answer:i%4
}));
const lessons=Array.from({length:12},(_,i)=>({
 id:String(i),title:'Gramatika '+i,summary:'Azalpena',status:'published',
 examples:[{text:'Adibidea'}]
}));
const KEY='sustrai-jokoak-mintzakats-v1';
async function boot(storage=new Map(),signedIn=false){
 const events={},queries=[],root={
  html:'',
  get innerHTML(){return this.html},
  set innerHTML(value){this.html=value},
  addEventListener(type,callback){events[type]=callback},
  contains(){return true}
 };
 const mockClient={from(table){
  queries.push(table);
  const query={
   select(){return this},eq(){return this},order(){return this},
   maybeSingle(){return Promise.resolve({data:null,error:null})},
   limit(){
    if(table==='euskera_questions')return Promise.resolve({data:bank,error:null});
    if(table==='grammar_lessons')return Promise.resolve({data:lessons,error:null});
    throw Error('Unexpected database query '+table);
   }
  };
  return query;
 }};
 const cloud={
  ready:Promise.resolve(),client:()=>mockClient,
  user:()=>signedIn?{id:'uuid-learner'}:null,
  profile:()=>signedIn?{active:true}:null,
  storage:{
   getItem:key=>storage.get(key)||null,
   setItem:(key,value)=>storage.set(key,value)
  },
  flush:()=>Promise.resolve()
 };
 const window={MintzakatsCore:core,SustraiCloud:cloud};
 const document={getElementById:id=>id==='mintApp'?root:null};
 vm.runInNewContext(script,{window,document,console,Date,Intl,Math,JSON,Number,String,Array,
   Object,Set,Map,RegExp,Error,Promise});
 for(let i=0;i<20;i++)await Promise.resolve();
 const click=(action,attrs={})=>events.click({
  target:{closest:()=>({dataset:{action,...attrs}})}
 });
 return {root,queries,click,storage};
}
test('Daily game: published grammar, 20 answers, private result, no legacy leaderboard writes',async()=>{
 const s=await boot(new Map(),true);
 assert.match(s.root.html,/Zure gaurko erronka/);
 assert.match(s.root.html,/Gramatika/);
 s.click('start');
 assert.match(s.root.html,/1 \/ 20 galdera/);
 for(let i=0;i<20;i++){
  s.click('answer',{index:'0'});
  assert.match(s.root.html,/Jokoaren erantzun-gakoa/);
  s.click('next');
 }
 assert.match(s.root.html,/Gaurko emaitza/);
 const state=JSON.parse(s.storage.get(KEY));
 assert.equal(state.records.length,1);
 assert.equal(state.records[0].completed,true);
 assert.equal(state.records[0].answers.length,20);
 assert(!s.queries.includes('partidak'));
 assert(!s.queries.includes('jokalari_egoera'));
 s.click('home');
 assert.match(s.root.html,/Gaurko erronka osatuta/);
 assert.doesNotMatch(s.root.html,/data-action="start"/);
 s.click('review');
 assert.match(s.root.html,/HUTSEN BERRIKUSPENA/);
});
test('Resume a partial game without resetting the same-day answers',async()=>{
 const storage=new Map();
 const first=await boot(storage,false);
 first.click('start');
 for(let i=0;i<3;i++){first.click('answer',{index:'0'});first.click('next')}
 const saved=JSON.parse(storage.get(KEY)).records[0];
 assert.equal(saved.answers.filter(Boolean).length,3);
 assert.equal(saved.currentIndex,3);
 const second=await boot(storage,false);
 assert.match(second.root.html,/3 erantzun gordeta/);
 second.click('resume');
 assert.match(second.root.html,/4 \/ 20 galdera/);
});
test('Two SUSTRAI accounts do not share the private cloud key in client state',async()=>{
 const one=await boot(new Map(),true);
 one.click('start');one.click('answer',{index:'0'});
 const other=await boot(new Map(),true);
 assert.match(other.root.html,/Hasi 20 galderen erronka/);
});
