const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../ariketak/catalog.js'),'utf8');
class El {
  constructor(tag='div'){this.tagName=tag;this.children=[];this.attrs={};this.events={};this.value='';this.hidden=false;this.textContent='';this.classList={add(){},toggle(){}};}
  append(...els){this.children.push(...els);}
  replaceChildren(...els){this.children=[...els];}
  setAttribute(k,v){this.attrs[k]=v;}
  addEventListener(k,f){this.events[k]=f;}
  focus(){}
}
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
async function settle(){for(let i=0;i<12;i++)await new Promise(setImmediate);}
function harness({section='S1',user={id:'user-a'}}={}){
  const els=new Map(),reads=[],gates=new Map(),failures=new Set(),events={},authCallbacks=[];
  let now=1000;
  const get=id=>{if(!els.has(id))els.set(id,new El());return els.get(id);};
  const location={href:'https://example.test/ariketak/?maila=B2&blokea=B2-ADI'+(section?'&atala='+section:'')};
  Object.defineProperty(location,'search',{get(){return new URL(location.href).search;}});
  Object.defineProperty(location,'pathname',{get(){return new URL(location.href).pathname;}});
  const data={
    smx_exercise_blocks:[{code:'B2-ADI',level:'B2',position:1,title_eu:'Aditzak'}],
    smx_exercise_sections:['S1','S2','EMPTY'].map((code,i)=>({code,block_code:'B2-ADI',position:i+1,title_eu:code,editorial_state:'draft'})),
    smx_exercise_activity_links:[{activity_id:'a1',position:1,section_code:'S1'},{activity_id:'a2',position:1,section_code:'S2'}],
    smx_activities:[{id:'a1',kind:'practice'},{id:'a2',kind:'practice'}],
    smx_aditzak_pilot_releases:[{activity_version_id:'v1',active:true},{activity_version_id:'v2',active:true}],
    smx_activity_versions:[{id:'v1',activity_id:'a1',revision:1,status:'draft',prompt_json:{title_eu:'First exercise'}},{id:'v2',activity_id:'a2',revision:1,status:'draft',prompt_json:{title_eu:'Second exercise'}}],
    smx_activity_items:[{activity_version_id:'v1'},{activity_version_id:'v1'},{activity_version_id:'v2'}]
  };
  const client={auth:{onAuthStateChange(fn){authCallbacks.push(fn);}},from(table){
    const filters=[];let key=table;
    const q={select(){return q;},order(){return q;},limit(){return q;},
      in(k,values){filters.push(x=>values.includes(x[k]));return q;},
      eq(k,v){filters.push(x=>x[k]===v);if(k==='section_code')key+=':'+v;return q;},
      then(resolve,reject){reads.push(key);const gate=gates.get(key);return Promise.resolve(gate?.promise).then(()=>{
        if(failures.delete(key))return {data:null,error:{code:'OFFLINE'}};
        return {data:(data[table]||[]).filter(x=>filters.every(f=>f(x))),error:null};
      }).then(resolve,reject);}
    };return q;
  }};
  const env={get,reads,gates,failures,user,location,data,advance:n=>now+=n};
  const cloud={ready:Promise.resolve(),user:()=>env.user,client:()=>client};
  const FakeDate=class extends Date {static now(){return now;}};
  vm.runInNewContext(source,{document:{getElementById:get,createElement:t=>new El(t)},
    window:{SustraiCloud:cloud,addEventListener:(k,f)=>events[k]=f},
    location,history:{pushState:(_,__,url)=>location.href=String(url),replaceState:(_,__,url)=>location.href=String(url)},
    URL,URLSearchParams,Date:FakeDate,console:{warn(){}}});
  env.go=section=>{location.href='https://example.test/ariketak/?maila=B2&blokea=B2-ADI'+(section?'&atala='+section:'');events.popstate();};
  env.signOut=()=>{env.user=null;for(const fn of authCallbacks)fn('SIGNED_OUT',null);};
  env.text=()=>{const flatten=el=>[el.textContent,...el.children.map(flatten)].join(' ');return flatten(get('practiceGrid'));};
  return env;
}
test('independent reads overlap; skeleton is decorative and clears after success',async()=>{
  const h=harness();const gate=deferred(),actGate=deferred();h.gates.set('smx_exercise_activity_links:S1',gate);
  h.gates.set('smx_activities',actGate);
  await settle();
  assert(h.reads.includes('smx_aditzak_pilot_releases'),'pilot query must not wait for links');
  assert.equal(h.get('practiceGrid').attrs['aria-busy'],'true');
  assert.equal(h.get('practiceGrid').children.length,6);
  assert(h.get('practiceGrid').children.every(x=>x.attrs['aria-hidden']==='true'));
  gate.resolve();await settle();
  assert(h.reads.includes('smx_activity_versions'),'versions must not wait for activity metadata');
  assert(!h.reads.includes('smx_activity_items'),'item counts must wait for versions and metadata');
  actGate.resolve();await settle();
  assert.equal(h.get('practiceGrid').attrs['aria-busy'],'false');
  assert.match(h.text(),/First exercise/);
  assert.match(h.text(),/2 galdera/);
});
test('fresh section and empty results reuse cache; expired entries refetch',async()=>{
  const h=harness();await settle();const count=h.reads.length;
  h.go(null);h.go('S1');
  assert.equal(h.reads.length,count);assert.match(h.text(),/First exercise/);
  h.go('EMPTY');await settle();const emptyCount=h.reads.length;
  h.go(null);h.go('EMPTY');assert.equal(h.reads.length,emptyCount);
  h.advance(60001);h.go('S1');await settle();
  assert(h.reads.length>emptyCount);
});
test('rapid navigation deduplicates requests and late results never replace current section',async()=>{
  const h=harness();const gate=deferred();h.gates.set('smx_exercise_activity_links:S1',gate);await settle();
  h.go('S2');await settle();assert.match(h.text(),/Second exercise/);
  h.go('S1');await settle();
  assert.equal(h.reads.filter(x=>x==='smx_exercise_activity_links:S1').length,1);
  h.go('S2');gate.resolve();await settle();
  assert.match(h.text(),/Second exercise/);assert.doesNotMatch(h.text(),/First exercise/);
});
test('failed reads are not cached and the retry button recovers',async()=>{
  const h=harness();h.failures.add('smx_exercise_activity_links:S1');await settle();
  assert.equal(h.get('practiceGrid').attrs['aria-busy'],'false');
  assert.match(h.get('practiceStatus').textContent,/ezin/);
  const retry=h.get('practiceEmpty').children.find(x=>x.tagName==='button');
  assert(retry);retry.events.click();await settle();assert.match(h.text(),/First exercise/);
  assert.equal(h.reads.filter(x=>x==='smx_exercise_activity_links:S1').length,2);
});
test('sign-out and account switches discard cached and in-flight results',async()=>{
  const h=harness();await settle();
  h.signOut();assert.doesNotMatch(h.text(),/First exercise/);
  h.user={id:'user-b'};h.go('S1');await settle();
  assert.equal(h.reads.filter(x=>x==='smx_exercise_activity_links:S1').length,2);
  const pending=harness();const gate=deferred();pending.gates.set('smx_exercise_activity_links:S1',gate);await settle();
  pending.signOut();gate.resolve();await settle();
  assert.doesNotMatch(pending.text(),/First exercise/);
});
test('guests see sign-in guidance immediately without private reads or placeholders',async()=>{
  const h=harness({user:null});await settle();
  assert.equal(h.get('practiceGrid').children.length,0);
  assert(!h.reads.some(x=>x.startsWith('smx_exercise_activity_links')));
  assert.match(h.get('practiceEmpty').children[0].textContent,/hasi saioa/);
});

